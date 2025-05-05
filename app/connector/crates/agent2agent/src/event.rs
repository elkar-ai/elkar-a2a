use crate::artifact::Artifact;
use crate::task::TaskStatus;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Task status update event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatusUpdateEvent {
    pub id: String,
    pub status: TaskStatus,
    pub final_event: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Task artifact update event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskArtifactUpdateEvent {
    pub id: String,
    pub artifact: Artifact,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

pub enum TaskEvent {
    StatusUpdate(TaskStatusUpdateEvent),
    ArtifactUpdate(TaskArtifactUpdateEvent),
}
