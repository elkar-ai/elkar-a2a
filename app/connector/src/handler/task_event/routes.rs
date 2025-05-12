use axum::Json;

use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    extensions::{
        errors::AppResult, extractors::user_context::UserContext,
        pagination::output::PaginatedOutput,
    },
    service::task_event::retrieve::retrieve_task_events,
};

use super::schemas::{GetTaskEventsQuery, TaskEventOutput};

pub fn task_event_router() -> OpenApiRouter {
    OpenApiRouter::new().routes(routes!(ep_retrieve_task_events))
}

#[utoipa::path(
    post,
    path = "/task-events/list",
    tag = "task_event",
    request_body = GetTaskEventsQuery,
    responses(
        (status = 200, body = PaginatedOutput<TaskEventOutput>),

    )
)]
async fn ep_retrieve_task_events(
    context: UserContext,
    Json(query): Json<GetTaskEventsQuery>,
) -> AppResult<Json<PaginatedOutput<TaskEventOutput>>> {
    let mut conn = context.async_pool.get().await?;

    let events = retrieve_task_events(query.into(), &mut conn).await?;
    let output = PaginatedOutput::from(events);

    Ok(Json(output))
}
