use crate::artifact::Artifact;
use crate::task::TaskStatus;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "documentation")]
use utoipa::ToSchema;

/// Task status update event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct TaskStatusUpdateEvent {
    pub id: String,
    pub status: TaskStatus,
    #[serde(rename = "final")]
    pub final_event: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Task artifact update event for notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct TaskArtifactUpdateEvent {
    pub id: String,
    pub artifact: Artifact,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub enum TaskEvent {
    StatusUpdate(TaskStatusUpdateEvent),
    ArtifactUpdate(TaskArtifactUpdateEvent),
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::task::TaskState;

    #[test]
    fn test_task_status_event() {
        let json = r#"
        {
            "id": "4e244a5d-1c61-44ed-b3e9-c8ceb21d30db",
            "status": {
                "state": "failed",
                "message": {
                    "role": "agent",
                    "parts": [
                        {
                            "type": "text",
                            "text": "Internal error in the task handler.",
                            "metadata": null
                        }
                    ],
                    "metadata": null
                },
                "timestamp": "2025-05-11T19:24:55.897840"
            },
            "final": true,
            "metadata": null
        }"#;

        let event: TaskEvent = serde_json::from_str(json).unwrap();
        match event {
            TaskEvent::StatusUpdate(status_event) => {
                assert_eq!(status_event.id, "4e244a5d-1c61-44ed-b3e9-c8ceb21d30db");
                assert_eq!(status_event.final_event, true);
                assert_eq!(status_event.status.state, TaskState::Failed);
                assert!(status_event.metadata.is_none());
            }
            _ => panic!("Expected StatusUpdate variant"),
        }
    }

    #[test]
    fn test_task_artifact_event() {
        let json = r#"
        {
            "id": "4e244a5d-1c61-44ed-b3e9-c8ceb21d30db",
            "artifact": {
                "name": "test-artifact",
                "description": "Test artifact",
                "parts": [
                    {
                        "type": "text",
                        "text": "Artifact content",
                        "metadata": null
                    }
                ],
                "index": 0,
                "metadata": null
            },
            "metadata": null
        }"#;

        let event: TaskEvent = serde_json::from_str(json).unwrap();
        match event {
            TaskEvent::ArtifactUpdate(artifact_event) => {
                assert_eq!(artifact_event.id, "4e244a5d-1c61-44ed-b3e9-c8ceb21d30db");
                assert_eq!(
                    artifact_event.artifact.name,
                    Some("test-artifact".to_string())
                );
                assert_eq!(
                    artifact_event.artifact.description,
                    Some("Test artifact".to_string())
                );
                assert_eq!(artifact_event.artifact.index, 0);
                assert!(artifact_event.metadata.is_none());
            }
            _ => panic!("Expected ArtifactUpdate variant"),
        }
    }
}
