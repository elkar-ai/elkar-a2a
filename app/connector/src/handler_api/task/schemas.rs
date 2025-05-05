use agent2agent::{Task as A2ATask, TaskPushNotificationConfig, TaskSendParams};
use chrono::{DateTime, Utc};
use database_schema::enum_definitions::task::TaskType;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::service::task::schema::TaskServiceOutput;

pub fn default_task_type() -> TaskType {
    TaskType::Incoming
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateTaskInput {
    pub send_task_params: TaskSendParams,
    pub counterparty_identifier: Option<String>,
    #[serde(default = "default_task_type")]
    pub task_type: TaskType,
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
