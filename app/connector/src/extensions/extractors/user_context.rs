use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};

use http::HeaderMap;
use uuid::Uuid;

use crate::{
    extensions::async_database::{AsyncUserPgPool, set_tenant_id_async},
    service::user::{
        application_user::service::check_registered_user, service::check_user_on_tenant_async,
    },
    state::AppState,
};

use crate::extensions::{
    errors::{BoxedAppError, ServiceError},
    token::{SupabaseToken, extract_token},
};

pub fn extract_tenant_id(header: &HeaderMap) -> Result<Option<Uuid>, StatusCode> {
    let tenant_id = header
        .get("x-tenant-id")
        .map(|x| x.to_str())
        .transpose()
        .map_err(|_| StatusCode::BAD_REQUEST)?
        .map(|x| Uuid::parse_str(x).ok())
        .flatten();
    Ok(tenant_id)
}

const TENANT_UNPROTECTED_ENDPOINTS: [&str; 3] =
    ["/users/is-registered", "/users/register", "/tenants"];
const API_PATH: &str = "/api/";
pub struct UserContext {
    pub user_id: Option<Uuid>,
    pub tenant_id: Option<Uuid>,
    pub async_pool: AsyncUserPgPool,
}

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
                    .into());
            }
        };

        let headers = &parts.headers;
        let path = parts.uri.path();

        if path.starts_with(API_PATH) {
            return Ok(UserContext {
                user_id: None,
                tenant_id: None,
                async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()),
            });
        }

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

            check_registered_user(decoded_token.sub, None, &mut conn)
                .await
                .map_err(|_| {
                    ServiceError::new()
                        .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                        .error_type("Internal server Error".to_string())
                        .details("Failed to check user registration".to_string())
                })?
        };
        let tenant_id = extract_tenant_id(headers).map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::BAD_REQUEST)
                .error_type("Failed to extract tenant id".to_string())
                .details(e)
        })?;

        let uri = parts.uri.to_string();
        if TENANT_UNPROTECTED_ENDPOINTS.contains(&uri.as_str()) {
            return Ok(UserContext {
                user_id: registered_user.map(|r| r.id),
                tenant_id: tenant_id,
                async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()),
            });
        }
        let (user, tenant_id) = match (registered_user, tenant_id) {
            (None, _) => {
                return Err(ServiceError::new()
                    .status_code(StatusCode::UNAUTHORIZED)
                    .error_type("User is not registered".to_string())
                    .into());
            }
            (Some(_), None) => {
                return Err(ServiceError::new()
                    .status_code(StatusCode::UNAUTHORIZED)
                    .error_type("Missing tenant id".to_string())
                    .into());
            }
            (Some(s), Some(tenant_id)) => (s, tenant_id),
        };
        let mut conn = app_state.async_pool.get().await.map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Failed to get DB connection from no rls user pool".to_string())
                .details(e.to_string())
        })?;
        set_tenant_id_async(&mut conn, tenant_id).await?;
        let user_on_tenant = check_user_on_tenant_async(user.id, tenant_id, &mut conn).await?;
        if user_on_tenant.is_none() {
            return Err(ServiceError::new()
                .status_code(StatusCode::UNAUTHORIZED)
                .error_type("User is not on tenant".to_string())
                .into());
        };
        Ok(UserContext {
            user_id: Some(user.id),
            tenant_id: Some(tenant_id),
            async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()).tenant_id(tenant_id),
        })
    }
}
