use agent2agent::{Task as A2ATask, TaskPushNotificationConfig};
use chrono::{DateTime, Utc};
use database_schema::enum_definitions::task::{TaskState, TaskType};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{
    extensions::pagination::PaginationOptions,
    service::task::{retrieve::RetrieveTaskParams, schema::TaskServiceOutput},
};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RetrieveTasksInput {
    pub task_type_in: Option<Vec<TaskType>>,
    pub task_id_in: Option<Vec<String>>,
    pub task_state_in: Option<Vec<TaskState>>,
    pub agent_id_in: Option<Vec<Uuid>>,
    pub pagination: Option<PaginationOptions>,
}

impl From<RetrieveTasksInput> for RetrieveTaskParams {
    fn from(input: RetrieveTasksInput) -> Self {
        Self {
            task_type_in: input.task_type_in,
            task_id_in: input.task_id_in,
            task_state_in: input.task_state_in,
            agent_id_in: input.agent_id_in,
            pagination: input.pagination,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskResponse {
    pub id: Uuid,
    pub task_type: TaskType,
    pub a2a_task: Option<A2ATask>,
    pub push_notification: Option<TaskPushNotificationConfig>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<TaskServiceOutput> for TaskResponse {
    fn from(task: TaskServiceOutput) -> Self {
        Self {
            id: task.id,
            task_type: task.task_type,
            a2a_task: task.a2a_task,
            push_notification: None,
            created_at: task.created_at.and_utc(),
            updated_at: task.updated_at.and_utc(),
        }
    }
}
