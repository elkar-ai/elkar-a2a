use crate::message::Message;
use crate::push_notification::PushNotificationConfig;
use crate::task::Task;

use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
#[cfg(feature = "documentation")]
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: Option<String>,
    #[serde(flatten)]
    pub request: A2ARPCRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "method", content = "params")]
pub enum A2ARPCRequest {
    #[serde(rename = "tasks/send")]
    SendTask(TaskSendParams),
    #[serde(rename = "tasks/sendSubscribe")]
    SendTaskStreaming(TaskSendParams),
    #[serde(rename = "tasks/get")]
    GetTask(TaskQueryParams),
    #[serde(rename = "tasks/cancel")]
    CancelTask(TaskIdParams),
    #[serde(rename = "tasks/pushNotification/set")]
    SetTaskPushNotification(TaskPushNotificationConfig),
    #[serde(rename = "tasks/pushNotification/get")]
    GetTaskPushNotification(TaskIdParams),
    #[serde(rename = "tasks/resubscribe")]
    ResubscribeTask(TaskIdParams),
}

/// JSON-RPC 2.0 error object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// JSON-RPC 2.0 response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: Option<String>,
    pub result: Option<A2ARPCResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum A2ARPCResponse {
    Task(Task),
    TaskPushNotificationConfig(TaskPushNotificationConfig),
}

/// Task ID parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskIdParams {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, Value>>,
}

/// Task query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct TaskQueryParams {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history_length: Option<i32>,
}

/// Parameters for sending a task
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct TaskSendParams {
    pub id: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    pub message: Message,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_output_modes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub push_notification: Option<PushNotificationConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history_length: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, Value>>,
}

/// Parameters for configuring push notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "documentation", derive(ToSchema))]
pub struct TaskPushNotificationConfig {
    pub id: String,
    pub push_notification_config: PushNotificationConfig,
}

/// Common error codes
pub mod error_codes {
    pub const JSON_PARSE_ERROR: i32 = -32700;
    pub const INVALID_REQUEST_ERROR: i32 = -32600;
    pub const METHOD_NOT_FOUND_ERROR: i32 = -32601;
    pub const INVALID_PARAMS_ERROR: i32 = -32602;
    pub const INTERNAL_ERROR: i32 = -32603;
    pub const TASK_NOT_FOUND_ERROR: i32 = -32001;
    pub const TASK_NOT_CANCELABLE_ERROR: i32 = -32002;
    pub const PUSH_NOTIFICATION_NOT_SUPPORTED_ERROR: i32 = -32003;
    pub const UNSUPPORTED_OPERATION_ERROR: i32 = -32004;
    pub const CONTENT_TYPE_NOT_SUPPORTED_ERROR: i32 = -32005;
}

// Define lazy_static errors for common cases
lazy_static! {
    pub static ref JSON_PARSE_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::JSON_PARSE_ERROR,
        message: "Invalid JSON payload".to_string(),
        data: None,
    };
    pub static ref INVALID_REQUEST_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::INVALID_REQUEST_ERROR,
        message: "Request payload validation error".to_string(),
        data: None,
    };
    pub static ref METHOD_NOT_FOUND_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::METHOD_NOT_FOUND_ERROR,
        message: "Method not found".to_string(),
        data: None,
    };
    pub static ref INVALID_PARAMS_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::INVALID_PARAMS_ERROR,
        message: "Invalid parameters".to_string(),
        data: None,
    };
    pub static ref INTERNAL_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::INTERNAL_ERROR,
        message: "Internal error".to_string(),
        data: None,
    };
    pub static ref TASK_NOT_FOUND_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::TASK_NOT_FOUND_ERROR,
        message: "Task not found".to_string(),
        data: None,
    };
    pub static ref TASK_NOT_CANCELABLE_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::TASK_NOT_CANCELABLE_ERROR,
        message: "Task cannot be canceled".to_string(),
        data: None,
    };
    pub static ref PUSH_NOTIFICATION_NOT_SUPPORTED_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::PUSH_NOTIFICATION_NOT_SUPPORTED_ERROR,
        message: "Push Notification is not supported".to_string(),
        data: None,
    };
    pub static ref UNSUPPORTED_OPERATION_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::UNSUPPORTED_OPERATION_ERROR,
        message: "This operation is not supported".to_string(),
        data: None,
    };
    pub static ref CONTENT_TYPE_NOT_SUPPORTED_ERROR: JsonRpcError = JsonRpcError {
        code: error_codes::CONTENT_TYPE_NOT_SUPPORTED_ERROR,
        message: "Incompatible content types".to_string(),
        data: None,
    };
}
