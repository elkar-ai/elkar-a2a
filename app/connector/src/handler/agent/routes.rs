use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        extractors::user_context::UserContext,
        pagination::output::UnpaginatedOutput,
    },
    service::agent::{
        create::{create_agent, CreateAgentServiceInput},
        delete::delete_agent,
        retrieve::{retrieve_agent, retrieve_agents, RetrieveAgentInput},
    },
};

use axum::{extract::Path, Json};
use http::StatusCode;

use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;

use super::schemas::{AgentOutput, CreateAgentInput};

pub fn agent_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(ep_create_agent))
        .routes(routes!(ep_retrieve_agents))
        .routes(routes!(ep_retrieve_agent))
        .routes(routes!(ep_delete_agent))
}

#[utoipa::path(
    post,
    path = "/agents",
    responses(
        (status = 200, description = "Agent created successfully", body = AgentOutput),
    ),
)]
pub async fn ep_create_agent(
    user_ctx: UserContext,
    Json(create_agent_input): Json<CreateAgentInput>,
) -> AppResult<Json<AgentOutput>> {
    // Ensure the user is authenticated
    let user_id = user_ctx.user_id.ok_or(
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("User ID is required".to_string()),
    )?;

    // Map handler input to service input
    let service_input = CreateAgentServiceInput {
        name: create_agent_input.name,
        description: create_agent_input.description,
        created_by: user_id,
    };

    // Acquire a typed database connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call the service
    let agent = create_agent(service_input, &mut conn).await?;

    // Convert service model to handler output
    Ok(Json(AgentOutput::from(agent)))
}

#[utoipa::path(
    post,
    path = "/agents/list",
    responses(
        (status = 200, description = "Agents retrieved successfully", body = UnpaginatedOutput<AgentOutput>),
    ),
)]
pub async fn ep_retrieve_agents(
    user_ctx: UserContext,
) -> AppResult<Json<UnpaginatedOutput<AgentOutput>>> {
    let retrieve_input = RetrieveAgentInput {};

    // Acquire a typed database connection
    let mut conn = user_ctx.async_pool.get().await?;

    let agents = retrieve_agents(retrieve_input, &mut conn).await?;

    let agents_output = agents
        .into_iter()
        .map(AgentOutput::from)
        .collect::<Vec<AgentOutput>>();

    Ok(Json(UnpaginatedOutput {
        records: agents_output,
    }))
}

#[utoipa::path(
    get,
    path = "/agents/{id}",
    responses(
        (status = 200, description = "Agent retrieved successfully", body = AgentOutput),
    ),
)]
pub async fn ep_retrieve_agent(
    user_ctx: UserContext,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AgentOutput>> {
    // Acquire a typed database connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call the service
    let agent = retrieve_agent(id, &mut conn).await?;

    Ok(Json(AgentOutput::from(agent)))
}

#[utoipa::path(
    delete,
    path = "/agents/{id}",
    responses(
        (status = 204, description = "Agent deleted successfully"),
    ),
)]
pub async fn ep_delete_agent(user_ctx: UserContext, Path(id): Path<Uuid>) -> AppResult<StatusCode> {
    // Acquire a typed database connection
    let mut conn = user_ctx.async_pool.get().await?;

    // Call the service
    delete_agent(id, &mut conn).await?;

    Ok(StatusCode::NO_CONTENT)
}
