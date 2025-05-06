use diesel::prelude::*;
use diesel_async::AsyncPgConnection;
use uuid::Uuid;

use super::schema::AgentServiceOutput;
use crate::{
    extensions::errors::AppResult,
    models::agent::{Agent, AgentInput},
};
use database_schema::schema::*;

pub struct CreateAgentServiceInput {
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
}

pub async fn create_agent(
    input: CreateAgentServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<AgentServiceOutput> {
    let agent_input = AgentInput {
        name: input.name,
        created_by: input.created_by,
        description: input.description,
        is_deleted: false,
    };

    let agent_insert_stmt = diesel::insert_into(agent::table)
        .values(agent_input)
        .returning(Agent::as_select());

    let agent = diesel_async::RunQueryDsl::get_result(agent_insert_stmt, conn).await?;

    Ok(AgentServiceOutput::from(agent))
}
