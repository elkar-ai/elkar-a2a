use agent2agent::Task as A2ATask;
use chrono::NaiveDateTime;
use database_schema::enum_definitions::task::{TaskState, TaskType};
use uuid::Uuid;

pub struct TaskServiceOutput {
    pub id: Uuid,
    pub task_id: String,
    pub task_state: TaskState,
    pub task_type: TaskType,
    pub a2a_task: Option<A2ATask>,
    pub agent_id: Uuid,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub counterparty_id: Option<String>,
}
