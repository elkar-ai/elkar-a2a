use chrono::NaiveDateTime;
use database_schema::schema::agent;
use diesel::*;
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset, Selectable)]
#[diesel(table_name=agent, primary_key(id))]
pub struct Agent {
    pub tenant_id: Uuid,
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_deleted: bool,
    pub created_by: Uuid,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset)]
#[diesel(table_name=agent)]
pub struct AgentInput {
    pub name: String,
    pub created_by: Uuid,
    pub description: Option<String>,
    pub is_deleted: bool,
}
