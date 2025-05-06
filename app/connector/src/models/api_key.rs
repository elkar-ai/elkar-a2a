use chrono::{NaiveDateTime, Utc};
use database_schema::schema::api_key;
use diesel::prelude::*;
use uuid::Uuid;

#[derive(Queryable, Selectable, Identifiable, Debug, Clone)]
#[diesel(table_name = api_key)]
pub struct ApiKey {
    pub tenant_id: Uuid,
    pub id: Uuid,
    pub agent_id: Option<Uuid>,
    pub name: String,
    pub hash: String,
    pub created_by: Option<Uuid>,
    pub is_deleted: bool,
    pub expires_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl ApiKey {
    pub fn is_expired(&self) -> bool {
        match self.expires_at {
            Some(expires_at) => expires_at < Utc::now().naive_utc(),
            None => false,
        }
    }
}

#[derive(Insertable, Debug)]
#[diesel(table_name = api_key)]
pub struct ApiKeyInput {
    pub agent_id: Option<Uuid>,
    pub name: String,
    pub hash: String,
    pub created_by: Option<Uuid>,
    pub is_deleted: bool,
    pub expires_at: Option<NaiveDateTime>,
}
