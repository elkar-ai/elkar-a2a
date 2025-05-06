// use diesel::prelude::*;
// use diesel_async::{AsyncPgConnection, RunQueryDsl};
// use uuid::Uuid;

// use crate::{
//     extensions::errors::{AppResult, ServiceError},
//     models::agent::{Agent, AgentInput},
// };
// use database_schema::schema::*;

// use super::schema::AgentServiceOutput;

// pub struct UpdateAgentServiceInput {
//     pub id: Uuid,
//     pub tenant_id: Uuid,
//     pub name: String,
// }

// pub async fn update_agent(
//     input: UpdateAgentServiceInput,
//     conn: &mut AsyncPgConnection,
// ) -> AppResult<AgentServiceOutput> {
//     // Get existing agent to preserve created_by field
//     let existing_agent = agent::table
//         .filter(agent::id.eq(input.id))
//         .filter(agent::tenant_id.eq(input.tenant_id))
//         .select(Agent::as_select())

//     // Prepare update input
//     let agent_input = AgentInput {
//         tenant_id: input.tenant_id,
//         name: input.name,
//         created_by: existing_agent.created_by,
//     };

//     // Update agent
//     let agent_update_stmt = diesel::update(
//         agent::table
//             .filter(agent::id.eq(input.id))
//             .filter(agent::tenant_id.eq(input.tenant_id)),
//     )
//     .set(agent_input)
//     .returning(Agent::as_select());

//     let updated_agent = diesel_async::RunQueryDsl::get_result(agent_update_stmt, conn).await?;

//     Ok(AgentServiceOutput::from(updated_agent))
// }
