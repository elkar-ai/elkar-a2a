use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        extractors::user_context::UserContext,
        pagination::output::UnpaginatedOutput,
    },
    service::api_key::{
        create::{create_api_key, CreateApiKeyServiceInput},
        delete::delete_api_key,
        retrieve::{retrieve_api_key, retrieve_api_keys, RetrieveApiKeyInput},
    },
};

use axum::{extract::Path, Json};

use http::StatusCode;
use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;

use super::schemas::{ApiKeyOutput, CreateApiKeyInput, ListApiKeysInput};

pub fn api_key_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(ep_create_api_key))
        .routes(routes!(ep_list_api_keys))
        .routes(routes!(ep_get_api_key))
        .routes(routes!(ep_delete_api_key))
}

#[utoipa::path(
    post,
    path = "/api-keys",
    responses(
        (status = 200, description = "API key created successfully", body = ApiKeyOutput),
    ),
)]
pub async fn ep_create_api_key(
    user_ctx: UserContext,
    Json(create_input): Json<CreateApiKeyInput>,
) -> AppResult<Json<ApiKeyOutput>> {
    // Ensure the user is authenticated
    let user_id = user_ctx.user_id.ok_or(
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("User ID is required".to_string()),
    )?;

    // Convert to service input
    let service_input = CreateApiKeyServiceInput {
        name: create_input.name,
        agent_id: create_input.agent_id,
        created_by: Some(user_id),
        expires_in: create_input.expires_in,
    };

    // Get connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call service
    let api_key = create_api_key(service_input, &mut conn).await?;

    // Convert to output
    Ok(Json(ApiKeyOutput::from(api_key)))
}

#[utoipa::path(
    post,
    path = "/api-keys/list",
    responses(
        (status = 200, description = "API keys retrieved successfully", body = UnpaginatedOutput<ApiKeyOutput>),
    ),
)]
pub async fn ep_list_api_keys(
    user_ctx: UserContext,
    Json(list_input): Json<ListApiKeysInput>,
) -> AppResult<Json<UnpaginatedOutput<ApiKeyOutput>>> {
    // Prepare input
    let retrieve_input = RetrieveApiKeyInput {
        agent_id: None,
        agent_id_in: list_input.agent_id_in,
    };

    // Get connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call service
    let api_keys = retrieve_api_keys(retrieve_input, &mut conn).await?;

    // Convert to output
    let api_key_outputs = api_keys
        .into_iter()
        .map(ApiKeyOutput::from)
        .collect::<Vec<ApiKeyOutput>>();

    Ok(Json(UnpaginatedOutput {
        records: api_key_outputs,
    }))
}

#[utoipa::path(
    get,
    path = "/api-keys/{id}",
    responses(
        (status = 200, description = "API key retrieved successfully", body = ApiKeyOutput),
    ),
)]
pub async fn ep_get_api_key(
    user_ctx: UserContext,
    Path(id): Path<Uuid>,
) -> AppResult<Json<ApiKeyOutput>> {
    // Get connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call service
    let api_key = retrieve_api_key(id, &mut conn).await?;

    // Convert to output
    Ok(Json(ApiKeyOutput::from(api_key)))
}

#[utoipa::path(
    delete,
    path = "/api-keys/{id}",
    responses(
        (status = 204, description = "API key deleted successfully"),
    ),
)]
pub async fn ep_delete_api_key(
    user_ctx: UserContext,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    // Get connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call service
    delete_api_key(id, &mut conn).await?;

    Ok(StatusCode::NO_CONTENT)
}
