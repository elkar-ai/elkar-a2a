use crate::{
    extensions::errors::{AppResult, ServiceError},
    models::api_key::ApiKey,
};
use database_schema::schema::api_key;
use diesel::prelude::*;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use http::StatusCode;
use uuid::Uuid;

use super::{schema::ApiKeyServiceOutput, service::hash_api_key};

pub struct RetrieveApiKeyInput {
    pub agent_id: Option<Uuid>,
    pub agent_id_in: Option<Vec<Uuid>>,
}

pub async fn retrieve_api_key(
    id: Uuid,
    conn: &mut AsyncPgConnection,
) -> AppResult<ApiKeyServiceOutput> {
    let api_key = api_key::table
        .filter(api_key::id.eq(id))
        .filter(api_key::is_deleted.eq(false))
        .select(ApiKey::as_select())
        .first(conn)
        .await
        .map_err(|_| {
            ServiceError::new()
                .status_code(StatusCode::NOT_FOUND)
                .error_type("API key not found".to_string())
        })?;

    let output = ApiKeyServiceOutput::from(api_key);

    Ok(output)
}

pub async fn retrieve_api_key_by_key(
    key: &str,
    conn: &mut AsyncPgConnection,
) -> AppResult<ApiKeyServiceOutput> {
    let hash = hash_api_key(key);
    let api_key_stmt = api_key::table
        .filter(api_key::hash.eq(&hash))
        .filter(api_key::is_deleted.eq(&false))
        .select(ApiKey::as_select());
    let mut api_keys = diesel_async::RunQueryDsl::load::<ApiKey>(api_key_stmt, conn).await?;
    let Some(api_key) = api_keys.pop() else {
        return Err(ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("API key not found".to_string())
            .into());
    };

    if api_key.is_expired() {
        return Err(ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("API key expired".to_string())
            .into());
    }

    Ok(ApiKeyServiceOutput::from(api_key))
}

pub async fn retrieve_api_keys(
    input: RetrieveApiKeyInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<ApiKeyServiceOutput>> {
    let mut query = api_key::table
        .filter(api_key::is_deleted.eq(false))
        .into_boxed();

    // Filter by agent_id if provided
    if let Some(agent_id) = input.agent_id {
        query = query.filter(api_key::agent_id.eq(agent_id));
    }

    // Filter by agent_id_in if provided
    if let Some(agent_ids) = input.agent_id_in {
        if !agent_ids.is_empty() {
            query = query.filter(api_key::agent_id.eq_any(agent_ids));
        }
    }

    let api_keys = query.select(ApiKey::as_select()).load(conn).await?;

    Ok(api_keys
        .into_iter()
        .map(ApiKeyServiceOutput::from)
        .collect())
}
