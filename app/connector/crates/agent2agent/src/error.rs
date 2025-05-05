use thiserror::Error;

/// A2A Error type for handling errors in the agent-to-agent communication
#[derive(Debug, Error)]
pub enum A2AError {
    /// Error during serialization/deserialization
    #[error("Serialization error: {0}")]
    SerdeError(String),

    /// Error during task operation
    #[error("Task error: {0}")]
    TaskError(String),

    /// Network or communication error
    #[error("Communication error: {0}")]
    CommunicationError(String),

    /// Authentication or authorization error
    #[error("Authentication error: {0}")]
    AuthError(String),

    /// Any other error
    #[error("Other error: {0}")]
    Other(String),
}

/// Result type alias for A2A operations
pub type A2AResult<T> = Result<T, A2AError>;
