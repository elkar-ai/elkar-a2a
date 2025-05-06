use std::fmt::Debug;

use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};

use serde_querystring::ParseMode;

use crate::extensions::errors::{BoxedAppError, ServiceError};

#[derive(Debug, Clone, Copy, Default)]
pub struct Qs<T>(pub T);

impl<S, T> FromRequestParts<S> for Qs<T>
where
    T: serde::de::DeserializeOwned + Debug + Send,
    S: Send + Sync,
{
    type Rejection = BoxedAppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let query = parts.uri.query().unwrap_or("");
        let qs_value = serde_querystring::from_str(query, ParseMode::Duplicate).map_err(|e| {
            ServiceError::new()
                .status_code(StatusCode::BAD_REQUEST)
                .error_type("Invalid query string".to_string())
                .details(e.to_string())
        })?;
        Ok(Qs(qs_value))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use chrono::{DateTime, Utc};
    use insta::assert_json_snapshot;
    use serde::{Deserialize, Serialize};

    // Add chrono with serde feature for DateTime serialization

    #[derive(Debug, Serialize, Deserialize)]
    struct Query {
        per_page: u32,
        page: u32,
        subject_search: String,
        date_gte: DateTime<Utc>,
    }

    #[tokio::test]
    async fn test_qs() {
        let query = "per_page=15&page=1&subject_search=&date_gte=2024-10-08T22%3A00%3A00.000Z";
        let qs_value: Query = serde_querystring::from_str(query, ParseMode::Duplicate)
            .map_err(|e| {
                ServiceError::new()
                    .status_code(StatusCode::BAD_REQUEST)
                    .error_type("Invalid query string".to_string())
                    .details(e.to_string())
            })
            .unwrap();

        assert_json_snapshot!(qs_value)
    }
}
