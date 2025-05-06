use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "documentation")]
use utoipa::ToSchema;

/// Part types for message and artifact parts
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
#[serde(tag = "type")]
pub enum PartType {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "file")]
    File { file: FileData },
    #[serde(rename = "data")]
    Data {
        data: HashMap<String, serde_json::Value>,
    },
}

/// File data for file parts
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct FileData {
    pub name: Option<String>,
    pub mime_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bytes: Option<String>, // base64 encoded content
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uri: Option<String>,
}

/// Part structure as per A2A specification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct Part {
    #[serde(flatten)]
    pub content: PartType,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

impl Part {
    pub fn text(text: String) -> Self {
        Self {
            content: PartType::Text { text },
            metadata: None,
        }
    }

    pub fn file(file: FileData) -> Self {
        Self {
            content: PartType::File { file },
            metadata: None,
        }
    }

    pub fn data(data: HashMap<String, serde_json::Value>) -> Self {
        Self {
            content: PartType::Data { data },
            metadata: None,
        }
    }

    pub fn with_metadata(mut self, metadata: HashMap<String, serde_json::Value>) -> Self {
        self.metadata = Some(metadata);
        self
    }
}
