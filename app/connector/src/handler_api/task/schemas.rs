use agent2agent::{
    Artifact, Message, PushNotificationConfig, Task as A2ATask, TaskPushNotificationConfig,
    TaskSendParams, TaskStatus,
};
use chrono::{DateTime, Utc};
use database_schema::enum_definitions::task::{TaskState, TaskType};
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
    pub state: TaskState,
    pub a2a_task: Option<A2ATask>,
    pub push_notification: Option<TaskPushNotificationConfig>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub counterparty_identifier: Option<String>,
}

impl From<TaskServiceOutput> for TaskResponse {
    fn from(task: TaskServiceOutput) -> Self {
        Self {
            id: task.id,
            task_type: task.task_type,
            state: task.task_state,
            a2a_task: task.a2a_task,
            push_notification: None,
            created_at: task.created_at.and_utc(),
            updated_at: task.updated_at.and_utc(),
            counterparty_identifier: task.counterparty_id,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetTaskQueryParams {
    pub history_length: Option<u32>,
    pub caller_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateTaskInput {
    pub status: Option<TaskStatus>,
    pub artifacts_updates: Option<Vec<Artifact>>,
    pub new_messages: Option<Vec<Message>>,
    pub push_notification: Option<PushNotificationConfig>,
    pub caller_id: Option<String>,
}
