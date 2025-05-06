use crate::part::Part;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "documentation")]
use utoipa::ToSchema;

/// Artifact structure as per A2A specification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct Artifact {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub parts: Vec<Part>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    pub index: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub append: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_chunk: Option<bool>,
}

impl Artifact {
    pub fn new(parts: Vec<Part>, index: usize) -> Self {
        Self {
            name: None,
            description: None,
            parts,
            metadata: None,
            index,
            append: None,
            last_chunk: None,
        }
    }

    pub fn with_name(mut self, name: String) -> Self {
        self.name = Some(name);
        self
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn with_metadata(mut self, metadata: HashMap<String, serde_json::Value>) -> Self {
        self.metadata = Some(metadata);
        self
    }

    pub fn is_append(mut self, append: bool) -> Self {
        self.append = Some(append);
        self
    }

    pub fn is_last_chunk(mut self, last_chunk: bool) -> Self {
        self.last_chunk = Some(last_chunk);
        self
    }
}
