use diesel::prelude::*;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use uuid::Uuid;

use crate::{
    extensions::errors::{AppResult, ServiceError},
    models::agent::Agent,
};
use database_schema::schema::agent;

use super::schema::AgentServiceOutput;

#[derive(Debug, Clone)]
pub struct RetrieveAgentInput {}

pub async fn retrieve_agents(
    _input: RetrieveAgentInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<AgentServiceOutput>> {
    let agents = agent::table.select(Agent::as_select()).load(conn).await?;

    Ok(agents.into_iter().map(AgentServiceOutput::from).collect())
}

pub async fn retrieve_agent(
    agent_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> AppResult<AgentServiceOutput> {
    let agent_result = agent::table
        .filter(agent::id.eq(agent_id))
        .select(Agent::as_select())
        .first(conn)
        .await
        .map_err(|_| ServiceError::new().error_type("Agent not found".to_string()))?;

    Ok(AgentServiceOutput::from(agent_result))
}
