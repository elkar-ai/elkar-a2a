use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::service::task_event::retrieve::{
    RetrieveTaskEventServiceInput, TaskEventOrderBy, TaskEventServiceOutput,
};

#[derive(Debug, Deserialize, ToSchema)]
pub struct GetTaskEventsQuery {
    pub task_id_in: Option<Vec<Uuid>>,
    pub id_in: Option<Vec<Uuid>>,
    pub order_by: Option<TaskEventOrderBy>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

impl From<GetTaskEventsQuery> for RetrieveTaskEventServiceInput {
    fn from(query: GetTaskEventsQuery) -> Self {
        RetrieveTaskEventServiceInput {
            task_id_in: query.task_id_in,
            id_in: query.id_in,
            order_by: query.order_by,
            pagination_options: None,
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct TaskEventOutput {
    pub id: Uuid,
    pub task_id: Uuid,
    pub event_data: serde_json::Value,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl From<TaskEventServiceOutput> for TaskEventOutput {
    fn from(task_event: TaskEventServiceOutput) -> Self {
        TaskEventOutput {
            id: task_event.id,
            task_id: task_event.task_id,
            event_data: task_event.event_data,
            created_at: task_event.created_at,
            updated_at: task_event.updated_at,
        }
    }
}
