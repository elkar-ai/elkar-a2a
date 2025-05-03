use database_schema::schema::*;
use diesel::*;

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset, Selectable)]
#[diesel(table_name=tenant, primary_key(id))]
pub struct Tenant {
    pub id: uuid::Uuid,
    pub name: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset)]
#[diesel(table_name=tenant)]
pub struct TenantInput {
    pub name: String,
}
