use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};

use http::HeaderMap;
use uuid::Uuid;

use crate::{
    extensions::async_database::{set_tenant_id_async, AsyncUserPgPool},
    service::user::{
        application_user::service::check_registered_user, service::check_user_on_tenant_async,
    },
    state::AppState,
};

use crate::extensions::{
    errors::{BoxedAppError, ServiceError},
    token::{extract_token, SupabaseToken},
};

pub fn extract_tenant_id(header: &HeaderMap) -> Result<Uuid, StatusCode> {
    let tenant_id = header
        .get("x-tenant-id")
        .ok_or(StatusCode::BAD_REQUEST)?
        .to_str()
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let tenant_id = Uuid::parse_str(tenant_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(tenant_id)
}

const TENANT_UNPROTECTED_ENDPOINTS: [&str; 3] =
    ["/users/is-registered", "/users/register", "/tenants"];

const API_UNPROTECTED_ENDPOINTS: [&str; 5] =
    ["api", "health", "redoc", "favicon.ico", "private-api"];

pub struct UserContext {
    pub user_id: Option<Uuid>,
    pub tenant_id: Option<Uuid>,
    pub async_pool: AsyncUserPgPool,
}
#[async_trait::async_trait]
impl<S> FromRequestParts<S> for UserContext
where
    S: Send + Sync,
{
    type Rejection = BoxedAppError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        let app_state = parts.extensions.get::<AppState>();
        let app_state = match app_state {
            Some(app_state) => app_state,
            None => {
                return Err(ServiceError::new()
                    .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                    .error_type("Internal server Error".to_string())
                    .details("Failed to get app state".to_string())
                    .into())
            }
        };

        let uri_path = parts.uri.path();

        let splitted_path = uri_path
            .split('/')
            .filter(|x| !x.is_empty())
            .collect::<Vec<&str>>();

        let first_path = splitted_path.first().unwrap_or(&"");
        if API_UNPROTECTED_ENDPOINTS.contains(first_path) {
            return Ok(UserContext {
                user_id: None,
                tenant_id: None,
                async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()),
            });
        }

        if uri_path.contains("webhooks") {
            return Ok(UserContext {
                user_id: None,
                tenant_id: None,
                async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()),
            });
        }
        let headers = &parts.headers;

        let bearer_token = extract_token(headers).map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::UNAUTHORIZED)
                .error_type("Missing or invalid auth token".to_string())
                .details(e)
        })?;
        let supabase_token = SupabaseToken::new(bearer_token.as_str());
        let decoded_token = supabase_token.decode().map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::UNAUTHORIZED)
                .error_type("Missing or invalid auth token".to_string())
                .details(e)
        })?;

        let registered_user = {
            let mut conn = app_state.async_pool.get().await.map_err(|e| {
                ServiceError::new()
                    .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                    .error_type("Failed to get DB connection from no rls user pool".to_string())
                    .details(e.to_string())
            })?;

            check_registered_user(decoded_token.sub, &mut conn)
                .await
                .map_err(|_| {
                    ServiceError::new()
                        .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                        .error_type("Internal server Error".to_string())
                        .details("Failed to check user registration".to_string())
                })?
        };
        let tenant_id = extract_tenant_id(headers);

        let (user, tenant_id) = match (registered_user, tenant_id) {
            (None, _) => {
                let uri = parts.uri.to_string();

                if uri.ends_with("/users/register") | uri.ends_with("/users/is-registered") {
                    return Ok(UserContext {
                        user_id: None,
                        tenant_id: None,
                        async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()),
                    });
                }
                return Err(ServiceError::new()
                    .status_code(StatusCode::UNAUTHORIZED)
                    .error_type("User is not registered".to_string())
                    .into());
            }
            (Some(user), Err(_)) => {
                let uri = parts.uri.to_string();
                if TENANT_UNPROTECTED_ENDPOINTS.contains(&uri.as_str()) {
                    return Ok(UserContext {
                        user_id: Some(user.id),
                        tenant_id: tenant_id.ok(),
                        async_pool: AsyncUserPgPool::new(app_state.async_pool.clone())
                            .tenant_id(tenant_id.ok().unwrap_or_default()),
                    });
                }
                return Err(ServiceError::new()
                    .status_code(StatusCode::UNAUTHORIZED)
                    .error_type("Missing tenant id".to_string())
                    .into());
            }
            (Some(s), Ok(tenant_id)) => (s, tenant_id),
        };
        let mut conn = app_state.async_pool.get().await.map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Failed to get DB connection from no rls user pool".to_string())
                .details(e.to_string())
        })?;
        set_tenant_id_async(&mut conn, tenant_id).await?;
        let user_on_tenant = check_user_on_tenant_async(user.id, &mut conn).await?;
        if user_on_tenant.is_none() {
            return Err(ServiceError::new()
                .status_code(StatusCode::UNAUTHORIZED)
                .error_type("User is not on tenant".to_string())
                .into());
        };
        return Ok(UserContext {
            user_id: Some(user.id),
            tenant_id: Some(tenant_id),
            async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()).tenant_id(tenant_id),
        });
    }
}
