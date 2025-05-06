use crate::part::Part;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "documentation")]
use utoipa::ToSchema;

/// Role type for messages
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub enum Role {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "agent")]
    Agent,
}

/// Message structure as per A2A specification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct Message {
    pub role: Role,
    pub parts: Vec<Part>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

impl Message {
    pub fn new(role: Role, parts: Vec<Part>) -> Self {
        Self {
            role,
            parts,
            metadata: None,
        }
    }

    pub fn with_metadata(mut self, metadata: HashMap<String, serde_json::Value>) -> Self {
        self.metadata = Some(metadata);
        self
    }

    pub fn user(parts: Vec<Part>) -> Self {
        Self::new(Role::User, parts)
    }

    pub fn agent(parts: Vec<Part>) -> Self {
        Self::new(Role::Agent, parts)
    }
}
