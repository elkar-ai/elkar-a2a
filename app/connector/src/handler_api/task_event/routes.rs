use axum::Json;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    extensions::{
        errors::AppResult,
        extractors::{api_key_context::ApiKeyContext, user_context::UserContext},
        pagination::output::UnpaginatedOutput,
    },
    service::task_event::{
        create::{CreateTaskEventServiceInput, create_task_event},
        create_subscriber::{TaskSubscriptionServiceInput, create_task_subscriber},
        dequeue::{DequeueTaskEventServiceInput, dequeue_task_event},
    },
};

use super::schemas::{
    CreateTaskSubscriberRequest, DequeueTaskEventRequest, EnqueueTaskEventRequest,
    TaskEventResponse,
};

pub fn task_event_api_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(ep_enqueue_task_event))
        .routes(routes!(ep_dequeue_task_event))
        .routes(routes!(ep_create_task_subscriber))
}

/// Enqueue a task event
#[utoipa::path(
    post,
    path = "/task-events/enqueue",
    tag = "task_event",
        request_body = EnqueueTaskEventRequest,
    responses(
        (status = 200, description = "Task event enqueued successfully"),
        (status = 404, description = "Task not found"),
        (status = 400, description = "Invalid request")
    )
)]
pub async fn ep_enqueue_task_event(
    context: ApiKeyContext,
    Json(request): Json<EnqueueTaskEventRequest>,
) -> AppResult<Json<()>> {
    let mut conn = context.async_pool.get().await?;

    create_task_event(
        CreateTaskEventServiceInput {
            task_id: request.task_id,
            caller_id: request.caller_id,
            task_event: request.event,
        },
        &mut conn,
    )
    .await?;

    Ok(Json(()))
}

/// Dequeue task events
#[utoipa::path(
    post,
    path = "/task-events/dequeue",
    tag = "task_event",
    request_body = DequeueTaskEventRequest,
    responses(
        (status = 200, description = "Task events dequeued successfully", body = Vec<TaskEventResponse>),
        (status = 404, description = "Task not found"),
        (status = 400, description = "Invalid request")
    )
)]
pub async fn ep_dequeue_task_event(
    context: ApiKeyContext,
    Json(request): Json<DequeueTaskEventRequest>,
) -> AppResult<Json<UnpaginatedOutput<TaskEventResponse>>> {
    let mut conn = context.async_pool.get().await?;

    let events = dequeue_task_event(
        DequeueTaskEventServiceInput {
            task_id: request.task_id,
            limit: request.limit,
            subscriber_id: request.subscriber_id,
            caller_id: request.caller_id,
        },
        &mut conn,
    )
    .await?;

    Ok(Json(UnpaginatedOutput::from(
        events
            .into_iter()
            .map(TaskEventResponse::from)
            .collect::<Vec<_>>(),
    )))
}

#[utoipa::path(
    post,
    path = "/task-events/subscribers",
    tag = "task_event",
    request_body = CreateTaskSubscriberRequest,
    responses(
        (status = 200, description = "Task subscriber created successfully"),
        (status = 404, description = "Task not found"),
        (status = 400, description = "Invalid request")
    )
)]
pub async fn ep_create_task_subscriber(
    context: ApiKeyContext,
    Json(request): Json<CreateTaskSubscriberRequest>,
) -> AppResult<Json<()>> {
    let mut conn = context.async_pool.get().await?;

    create_task_subscriber(
        TaskSubscriptionServiceInput {
            task_id: request.task_id,
            subscriber_id: request.subscriber_id,
            caller_id: request.caller_id,
        },
        &mut conn,
    )
    .await?;

    Ok(Json(()))
}
