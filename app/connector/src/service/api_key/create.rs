use crate::{
    extensions::errors::AppResult,
    models::api_key::{ApiKey, ApiKeyInput},
};
use chrono::{Duration, Utc};
use database_schema::schema::api_key;
use diesel::prelude::*;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use uuid::Uuid;

use super::{
    schema::ApiKeyServiceOutput,
    service::{generate_api_key, hash_api_key},
};

pub struct CreateApiKeyServiceInput {
    pub name: String,
    pub agent_id: Option<Uuid>,
    pub created_by: Option<Uuid>,
    pub expires_in: Option<i64>,
}

pub async fn create_api_key(
    input: CreateApiKeyServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<ApiKeyServiceOutput> {
    // Generate a random API key
    let api_key_value = generate_api_key();
    let hash = hash_api_key(&api_key_value);
    let expires_at = input
        .expires_in
        .map(|duration| Utc::now() + Duration::seconds(duration));

    // Create a new record
    let new_api_key = ApiKeyInput {
        agent_id: input.agent_id,
        name: input.name,
        hash,
        created_by: input.created_by,
        is_deleted: false,
        expires_at: expires_at.map(|dt| dt.naive_utc()),
    };

    // Insert the new API key into the database
    let api_key = diesel::insert_into(api_key::table)
        .values(new_api_key)
        .returning(ApiKey::as_returning())
        .get_result(conn)
        .await?;

    let mut output = ApiKeyServiceOutput::from(api_key);
    output.api_key = Some(api_key_value);
    Ok(output)
}

// Helper function to generate a secure API key
