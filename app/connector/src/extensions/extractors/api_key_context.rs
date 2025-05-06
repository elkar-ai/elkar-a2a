use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};

use http::HeaderMap;
use uuid::Uuid;

use crate::{
    extensions::async_database::AsyncUserPgPool,
    service::api_key::retrieve::retrieve_api_key_by_key, state::AppState,
};

use crate::extensions::errors::{BoxedAppError, ServiceError};

/// Extract API key from request headers
fn extract_api_key(headers: &HeaderMap) -> Result<String, StatusCode> {
    let api_key = headers
        .get("x-api-key")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .to_str()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok(api_key.to_string())
}

/// Context for API key authentication
pub struct ApiKeyContext {
    pub agent_id: Option<Uuid>,
    pub tenant_id: Uuid,
    pub async_pool: AsyncUserPgPool,
}

impl<S> FromRequestParts<S> for ApiKeyContext
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

        let headers = &parts.headers;

        // Extract API key from headers
        let api_key = extract_api_key(headers).map_err(|status_code| {
            ServiceError::new()
                .status_code(status_code)
                .error_type("Missing or invalid API key".to_string())
                .details("API key must be provided in the x-api-key header".to_string())
        })?;

        // Get a connection from the pool
        let mut conn = app_state.no_rls_user_pool.get().await.map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Failed to get DB connection".to_string())
                .details(e.to_string())
        })?;
        let api_key = retrieve_api_key_by_key(&api_key, &mut conn).await?;
        // Set tenant ID for row-level security
        let tenant_id = api_key.tenant_id;

        Ok(ApiKeyContext {
            agent_id: api_key.agent_id,
            tenant_id,
            async_pool: AsyncUserPgPool::new(app_state.async_pool.clone()).tenant_id(tenant_id),
        })
    }
}
