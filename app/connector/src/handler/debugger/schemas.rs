use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::service::debugger_history::{
    create::DebuggerHistoryServiceInput, retrieve::DebuggerHistoryServiceOutput,
};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct StoreA2ADebuggerHistoryInput {
    pub url: String,
    pub payload: Value,
}

impl From<StoreA2ADebuggerHistoryInput> for DebuggerHistoryServiceInput {
    fn from(input: StoreA2ADebuggerHistoryInput) -> Self {
        DebuggerHistoryServiceInput {
            url: input.url,
            task: input.payload,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct GetDebuggerHistoryQueryParams {
    pub task_id: Option<String>,
    pub url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct DebuggerHistoryResponse {
    pub id: Uuid,
    pub task_id: String,
    pub url: String,
    pub payload: Value,
}

impl From<DebuggerHistoryServiceOutput> for DebuggerHistoryResponse {
    fn from(output: DebuggerHistoryServiceOutput) -> Self {
        Self {
            id: output.id,
            task_id: output.task_id,
            url: output.url,
            payload: output.payload,
        }
    }
}
