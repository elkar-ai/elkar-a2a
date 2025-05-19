use axum::{Json, extract::Query};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    extensions::{errors::AppResult, extractors::user_context::UserContext},
    service::debugger_history::{
        create::create_debug_history_entry,
        retrieve::{RetrieveDebuggerHistoryParams, retrieve_debugger_history},
    },
};

use super::schemas::{
    DebuggerHistoryResponse, GetDebuggerHistoryQueryParams, StoreA2ADebuggerHistoryInput,
};

pub fn debugger_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(ep_store_debugger_history))
        .routes(routes!(ep_get_debugger_history))
}

#[utoipa::path(
    post,
    path = "/debugger-history",
    tag = "debugger-history",
    summary = "Store a debugger history entry",
    request_body = StoreA2ADebuggerHistoryInput,
    responses(
        (status = 200, description = "Debugger history entry stored successfully"),
        (status = 400)
    )
)]
pub async fn ep_store_debugger_history(
    context: UserContext,
    Json(input): Json<StoreA2ADebuggerHistoryInput>,
) -> AppResult<Json<String>> {
    let mut conn = context.async_pool.get().await?;
    create_debug_history_entry(input.into(), &mut conn).await?;
    Ok(Json(
        "Debugger history entry stored successfully".to_string(),
    ))
}

#[utoipa::path(
    get,
    path = "/debugger-history",
    tag = "debugger-history",
    summary = "Retrieve debugger history entries",
    params(
        ("task_id" = Option<String>, Query, description = "Filter by task ID"),
        ("url" = Option<String>, Query, description = "Filter by URL")
    ),
    responses(
        (status = 200, description = "Debugger history entries retrieved successfully", body = Vec<DebuggerHistoryResponse>),
        (status = 400)
    )
)]
pub async fn ep_get_debugger_history(
    context: UserContext,
    Query(params): Query<GetDebuggerHistoryQueryParams>,
) -> AppResult<Json<Vec<DebuggerHistoryResponse>>> {
    let mut conn = context.async_pool.get().await?;
    let entries = retrieve_debugger_history(
        RetrieveDebuggerHistoryParams {
            task_id: params.task_id,
            url: params.url,
        },
        &mut conn,
    )
    .await?;
    Ok(Json(entries.into_iter().map(Into::into).collect()))
}
