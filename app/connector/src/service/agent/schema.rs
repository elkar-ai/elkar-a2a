use uuid::Uuid;

use crate::models::agent::Agent;

pub struct AgentServiceOutput {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
    pub is_deleted: bool,
}

impl From<Agent> for AgentServiceOutput {
    fn from(agent: Agent) -> Self {
        Self {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            created_by: agent.created_by,
            is_deleted: agent.is_deleted,
        }
    }
}
