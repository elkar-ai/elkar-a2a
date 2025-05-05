use crate::service::api_key::schema::ApiKeyServiceOutput;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreateApiKeyInput {
    pub name: String,
    pub agent_id: Option<Uuid>,
    #[serde(default)]
    pub expires_in: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ApiKeyOutput {
    pub id: Uuid,
    pub name: String,
    pub api_key: Option<String>,
    pub agent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListApiKeysInput {
    pub agent_id_in: Option<Vec<Uuid>>,
}

impl From<ApiKeyServiceOutput> for ApiKeyOutput {
    fn from(api_key: ApiKeyServiceOutput) -> Self {
        Self {
            id: api_key.id,
            name: api_key.name,
            api_key: api_key.api_key,
            agent_id: api_key.agent_id,
            created_at: api_key.created_at.and_utc(),
            expires_at: api_key.expires_at.map(|dt| dt.and_utc()),
            created_by: api_key.created_by,
        }
    }
}
