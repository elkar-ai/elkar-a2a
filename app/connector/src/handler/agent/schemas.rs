use crate::service::agent::schema::AgentServiceOutput;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AgentOutput {
    pub id: Uuid,
    pub name: String,
    pub created_by: Uuid,
    pub description: Option<String>,
    pub is_deleted: bool,
}

impl From<AgentServiceOutput> for AgentOutput {
    fn from(agent: AgentServiceOutput) -> Self {
        Self {
            id: agent.id,

            name: agent.name,
            description: agent.description,
            created_by: agent.created_by,
            is_deleted: agent.is_deleted,
        }
    }
}

#[derive(Deserialize, Debug, ToSchema)]
pub struct CreateAgentInput {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Deserialize, Debug, ToSchema)]
pub struct UpdateAgentInput {
    pub name: String,
    pub description: Option<String>,
}
