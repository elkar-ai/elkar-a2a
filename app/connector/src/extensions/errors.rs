use axum::{
    body::Body,
    response::{IntoResponse, Response},
    Json,
};

use diesel::{result::Error as DieselError, ConnectionError};
use handlebars::RenderError;
use http::StatusCode;
use serde::Serialize;
use std::fmt::{Debug, Display};
use std::io::Error as IoError;
use std::{error::Error, sync::LockResult};
use supabase::SupabaseError;
use tokio::task::JoinError;

#[derive(Debug)]
pub struct ServiceError {
    status_code: StatusCode,
    error_type: String,
    details: Option<String>,
}

impl Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{} ({})",
            self.error_type,
            self.details.as_ref().unwrap_or(&"".to_string())
        )
    }
}

#[derive(Serialize, Debug)]
pub struct ServiceErrorResponse {
    error_type: String,
    details: Option<String>,
}

impl From<ServiceError> for ServiceErrorResponse {
    fn from(service_error: ServiceError) -> Self {
        Self {
            error_type: service_error.error_type,
            details: service_error.details,
        }
    }
}

impl From<&ServiceError> for ServiceErrorResponse {
    fn from(service_error: &ServiceError) -> Self {
        Self {
            error_type: service_error.error_type.clone(),
            details: service_error.details.clone(),
        }
    }
}

pub type AppResult<T> = Result<T, BoxedAppError>;

impl Default for ServiceError {
    fn default() -> Self {
        Self::new()
    }
}

impl ServiceError {
    pub fn new() -> Self {
        Self {
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            error_type: "Internal Server Error".to_string(),
            details: None,
        }
    }

    pub fn status_code(mut self, status_code: StatusCode) -> Self {
        self.status_code = status_code;
        self
    }
    pub fn error_type(mut self, error_type: impl ToString) -> Self {
        self.error_type = error_type.to_string();
        self
    }
    pub fn details(mut self, details: impl ToString) -> Self {
        self.details = Some(details.to_string());
        self
    }
}

impl IntoResponse for ServiceError {
    fn into_response(self) -> Response<Body> {
        (self.status_code, Json(ServiceErrorResponse::from(self))).into_response()
    }
}
pub type BoxedAppError = Box<dyn AppError>;

pub trait AppError: Debug + Display + Send + 'static {
    fn response(&self) -> axum::response::Response;

    fn cause(&self) -> Option<&dyn AppError> {
        None
    }
}

impl IntoResponse for BoxedAppError {
    fn into_response(self) -> Response<Body> {
        self.response()
    }
}

impl AppError for BoxedAppError {
    fn response(&self) -> Response {
        (**self).response()
    }
    fn cause(&self) -> Option<&dyn AppError> {
        (**self).cause()
    }
}

fn server_error_response(error: String) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ServiceErrorResponse {
            error_type: "Internal Server Error".to_string(),
            details: Some(error),
        }),
    )
        .into_response()
}

impl AppError for ServiceError {
    fn response(&self) -> axum::response::Response {
        let error = self.error_type.clone();
        let details = self.details.clone().unwrap_or("".to_string());
        let error_format = format!("{}: {}", error, details);
        tracing::error!(error = %error_format );
        sentry::capture_message(&error_format, sentry::Level::Error);

        (self.status_code, Json(ServiceErrorResponse::from(self))).into_response()
    }
}

impl<E: Error + Send + 'static> AppError for E {
    fn response(&self) -> axum::response::Response {
        tracing::error!(error = %self, "Internal Server Error");
        let error_format = format!("{:?}", self);
        sentry::configure_scope(|scope| {
            scope.set_fingerprint(Some([error_format.as_str()].as_ref()));
        });
        sentry::capture_error(self);

        server_error_response(self.to_string())
    }
}

impl From<ServiceError> for BoxedAppError {
    fn from(error: ServiceError) -> Self {
        Box::new(error)
    }
}

impl From<DieselError> for BoxedAppError {
    fn from(error: DieselError) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Database Error".to_string())
                .details(error.to_string()),
        )
    }
}

impl From<RenderError> for BoxedAppError {
    fn from(error: RenderError) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Template Error".to_string())
                .details(error.to_string()),
        )
    }
}

impl From<anyhow::Error> for BoxedAppError {
    fn from(error: anyhow::Error) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Internal Service Error".to_string())
                .details(error.to_string()),
        )
    }
}

impl From<serde_json::Error> for BoxedAppError {
    fn from(error: serde_json::Error) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Serde JSON Error".to_string())
                .details(error.to_string()),
        )
    }
}

impl From<JoinError> for BoxedAppError {
    fn from(error: JoinError) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Async Tokio Error".to_string())
                .details(error.to_string()),
        )
    }
}

impl<G> From<LockResult<G>> for BoxedAppError {
    fn from(_error: LockResult<G>) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("mutex lock error".to_string()),
        )
    }
}

impl From<SupabaseError> for BoxedAppError {
    fn from(error: SupabaseError) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Supabase Error".to_string())
                .details(format!("{:?}", error)),
        )
    }
}

impl From<IoError> for BoxedAppError {
    fn from(error: IoError) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("IO Error".to_string())
                .details(format!("{:?}", error)),
        )
    }
}

impl From<ConnectionError> for BoxedAppError {
    fn from(error: ConnectionError) -> Self {
        Box::new(
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Diesel Connection Error".to_string())
                .details(format!("{:?}", error)),
        )
    }
}
