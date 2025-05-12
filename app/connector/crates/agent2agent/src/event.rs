use crate::artifact::Artifact;
use crate::task::TaskStatus;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::ToSchema;

/// Task status update event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg(feature = "documentation")]
#[derive(ToSchema)]
pub struct TaskStatusUpdateEvent {
    pub id: String,
    pub status: TaskStatus,
    pub final_event: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Task artifact update event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg(feature = "documentation")]
#[derive(ToSchema)]
pub struct TaskArtifactUpdateEvent {
    pub id: String,
    pub artifact: Artifact,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg(feature = "documentation")]
#[derive(ToSchema)]
#[serde(untagged)]
pub enum TaskEvent {
    StatusUpdate(TaskStatusUpdateEvent),
    ArtifactUpdate(TaskArtifactUpdateEvent),
}
