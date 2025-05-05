use agent2agent::Task;
use axum::Json;
use http::StatusCode;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        extractors::api_key_context::ApiKeyContext,
    },
    service::task::create_a2a::{create_task_a2a, CreateTaskA2AParams},
};

use super::schemas::{CreateTaskInput, TaskResponse};

pub fn task_api_router() -> OpenApiRouter {
    OpenApiRouter::new().routes(routes!(ep_upsert_task))
}

#[utoipa::path(
    post,
    path = "/task",
    tag = "task",
    summary = "Create a task",
    responses(
        (status = 200, body = TaskResponse)
    )
)]
pub async fn ep_upsert_task(
    context: ApiKeyContext,
    Json(create_task_input): Json<CreateTaskInput>,
) -> AppResult<Json<TaskResponse>> {
    let Some(agent_id) = context.agent_id else {
        return Err(ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("Agent ID is required")
            .into());
    };
    let mut conn = context.async_pool.get().await?;
    let params = CreateTaskA2AParams {
        send_task_params: create_task_input.send_task_params,
        agent_id,
        counterparty_identifier: create_task_input.counterparty_identifier,
        task_type: create_task_input.task_type,
    };
    let task = create_task_a2a(params, &mut conn).await?;
    Ok(Json(task.into()))
}
