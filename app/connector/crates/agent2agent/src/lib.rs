// Define modules
pub mod artifact;
pub mod capabilities;
pub mod error;
pub mod event;
pub mod message;

pub mod part;
pub mod push_notification;
pub mod rpc;
pub mod task;

// Re-export types for easier use
pub use artifact::Artifact;
pub use capabilities::{
    AgentAuthentication, AgentCapabilities, AgentCard, AgentProvider, AgentSkill,
};
pub use error::{A2AError, A2AResult};
pub use event::{TaskArtifactUpdateEvent, TaskStatusUpdateEvent};
pub use message::{Message, Role};

pub use part::{FileData, Part, PartType};
pub use push_notification::{PushNotificationAuth, PushNotificationConfig};
pub use rpc::{
    A2ARPCRequest, A2ARPCResponse, JsonRpcError, JsonRpcRequest, JsonRpcResponse, TaskIdParams,
    TaskPushNotificationConfig, TaskQueryParams, TaskSendParams,
};
pub use task::{Task, TaskState, TaskStatus};
