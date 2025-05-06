use diesel::{Insertable, Queryable, Selectable};
use uuid::Uuid;

use database_schema::schema::tenant_user;

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = tenant_user)]
pub struct TenantUserInput {
    pub tenant_id: Uuid,
    pub user_id: Uuid,
}

#[derive(Debug, Clone, Queryable, Insertable, Selectable)]
#[diesel(table_name = tenant_user)]
pub struct TenantUser {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Uuid,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}
