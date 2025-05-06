use axum::{extract::Path, Json};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    extensions::{
        errors::AppResult, extractors::user_context::UserContext,
        pagination::output::PaginatedOutput,
    },
    service::task::retrieve::{get_task, retrieve_tasks},
};

use super::schemas::{RetrieveTasksInput, TaskResponse};

pub fn task_app_router() -> OpenApiRouter {
    OpenApiRouter::new().routes(routes!(ep_retrieve_tasks, ep_get_task))
}

#[utoipa::path(
    post,
    path = "/tasks/list",
    tag = "task",
    summary = "Retrieve tasks",
    responses(
        (status = 200, body = PaginatedOutput<TaskResponse>)
    )
)]
pub async fn ep_retrieve_tasks(
    context: UserContext,
    Json(retrieve_tasks_input): Json<RetrieveTasksInput>,
) -> AppResult<Json<PaginatedOutput<TaskResponse>>> {
    let mut conn = context.async_pool.get().await?;

    let tasks = retrieve_tasks(retrieve_tasks_input.into(), &mut conn).await?;
    let tasks = tasks.map(TaskResponse::from);
    Ok(Json(tasks.into()))
}

#[utoipa::path(
    get,
    path = "/tasks/{task_id}",
    tag = "task",
    summary = "Get task",
    responses(
        (status = 200, body = TaskResponse),
        (status = 404)
    )
)]
pub async fn ep_get_task(
    context: UserContext,
    Path(task_id): Path<String>,
) -> AppResult<Json<TaskResponse>> {
    let mut conn = context.async_pool.get().await?;

    let task = get_task(task_id, &mut conn).await?;
    let task = TaskResponse::from(task);
    Ok(Json(task))
}
