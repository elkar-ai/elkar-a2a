use crate::extensions::errors::{AppResult, ServiceError};

use database_schema::schema::api_key;
use diesel::prelude::*;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use http::StatusCode;
use uuid::Uuid;

pub async fn delete_api_key(id: Uuid, conn: &mut AsyncPgConnection) -> AppResult<()> {
    // Soft delete by setting is_deleted flag to true

    let affected_rows = diesel::update(api_key::table)
        .filter(api_key::id.eq(id))
        .filter(api_key::is_deleted.eq(false))
        .set(api_key::is_deleted.eq(true))
        .execute(conn)
        .await?;

    if affected_rows == 0 {
        return Err(ServiceError::new()
            .status_code(StatusCode::NOT_FOUND)
            .error_type("API key not found".to_string())
            .into());
    }

    Ok(())
}
