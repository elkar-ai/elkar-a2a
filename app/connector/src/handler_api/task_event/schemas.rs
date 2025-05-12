use agent2agent::event::TaskEvent as A2ATaskEvent;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

/// Request to enqueue a task event
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct EnqueueTaskEventRequest {
    /// The ID of the caller
    pub caller_id: Option<String>,
    /// The ID of the task to enqueue the event for
    pub task_id: String,
    /// The event data to enqueue
    pub event: A2ATaskEvent,
}

/// Request to dequeue task events
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct DequeueTaskEventRequest {
    /// The ID of the task to dequeue events from
    pub task_id: String,
    /// The ID of the subscriber requesting events
    pub subscriber_id: String,
    /// Optional limit on the number of events to dequeue
    pub limit: Option<i32>,
    /// The ID of the caller
    pub caller_id: Option<String>,
}

/// Response containing a task event
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskEventResponse {
    /// The unique ID of the event
    pub id: Uuid,
    /// The ID of the task this event belongs to
    pub task_id: String,
    /// The event data
    pub event_data: A2ATaskEvent,
}

impl From<crate::service::task_event::dequeue::DequeueTaskEventServiceOutput>
    for TaskEventResponse
{
    fn from(output: crate::service::task_event::dequeue::DequeueTaskEventServiceOutput) -> Self {
        Self {
            id: output.id,
            task_id: output.task_id,
            event_data: output.event_data,
        }
    }
}

/// Request to create a task subscriber
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateTaskSubscriberRequest {
    /// The ID of the task to subscribe to
    pub task_id: String,
    /// The ID of the subscriber
    pub subscriber_id: String,
    /// The ID of the caller
    pub caller_id: Option<String>,
}
