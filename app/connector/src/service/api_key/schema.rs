use chrono::NaiveDateTime;
use uuid::Uuid;

use crate::models::api_key::ApiKey;

pub struct ApiKeyServiceOutput {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub api_key: Option<String>,
    pub agent_id: Option<Uuid>,
    pub expires_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub created_by: Option<Uuid>,
}

impl From<ApiKey> for ApiKeyServiceOutput {
    fn from(api_key: ApiKey) -> Self {
        Self {
            tenant_id: api_key.tenant_id,
            id: api_key.id,
            name: api_key.name,
            api_key: None,
            agent_id: api_key.agent_id,
            created_at: api_key.created_at,
            expires_at: api_key.expires_at,
            created_by: api_key.created_by,
        }
    }
}
