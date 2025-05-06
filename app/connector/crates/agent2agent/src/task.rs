use crate::A2AError;
use crate::artifact::Artifact;
use crate::error::A2AResult;
use crate::message::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "documentation")]
use utoipa::ToSchema;

/// Task state according to A2A specification
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub enum TaskState {
    #[serde(rename = "submitted")]
    Submitted,
    #[serde(rename = "working")]
    Working,
    #[serde(rename = "input-required")]
    InputRequired,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "canceled")]
    Canceled,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "unknown")]
    Unknown,
}

/// Task status as per A2A specification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct TaskStatus {
    pub state: TaskState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<Message>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>, // ISO datetime value
}

impl TaskStatus {
    pub fn new(state: TaskState) -> Self {
        Self {
            state,
            message: None,
            timestamp: None,
        }
    }

    pub fn with_message(mut self, message: Message) -> Self {
        self.message = Some(message);
        self
    }

    pub fn with_timestamp(mut self, timestamp: String) -> Self {
        self.timestamp = Some(timestamp);
        self
    }
}

/// Task structure as per A2A specification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct Task {
    pub id: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    pub status: TaskStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history: Option<Vec<Message>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artifacts: Option<Vec<Artifact>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

impl Task {
    pub fn new(id: String, session_id: String, status: TaskStatus) -> Self {
        Self {
            id,
            session_id,
            status,
            history: None,
            artifacts: None,
            metadata: None,
        }
    }

    pub fn with_history(&mut self, history: Vec<Message>) {
        self.history = Some(history);
    }

    pub fn with_artifacts(&mut self, artifacts: Vec<Artifact>) {
        self.artifacts = Some(artifacts);
    }

    pub fn with_metadata(&mut self, metadata: HashMap<String, serde_json::Value>) {
        self.metadata = Some(metadata);
    }

    pub fn add_message(&mut self, message: Message) {
        if let Some(history) = &mut self.history {
            history.push(message);
        } else {
            self.history = Some(vec![message]);
        }
    }

    pub fn upsert_artifact(&mut self, artifact: Artifact) -> A2AResult<()> {
        let found_artifact = self.find_artifact(artifact.index);
        match found_artifact {
            Some(existing_artifact) => {
                if existing_artifact.last_chunk.unwrap_or(false) {
                    return Err(A2AError::TaskError(
                        "Artifact already completed".to_string(),
                    ));
                }
                existing_artifact.parts.extend(artifact.parts);
            }
            None => match &mut self.artifacts {
                Some(artifacts) => {
                    artifacts.push(artifact);
                }
                None => {
                    self.artifacts = Some(vec![artifact]);
                }
            },
        }
        Ok(())
    }

    fn find_artifact(&mut self, index: usize) -> Option<&mut Artifact> {
        if let Some(artifacts) = &mut self.artifacts {
            for artifact in artifacts.iter_mut() {
                if artifact.index == index {
                    return Some(artifact);
                }
            }
        }
        None
    }

    pub fn update_status(&mut self, status: TaskStatus) {
        self.status = status;
    }
}
