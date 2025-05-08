use database_schema::{
    enum_definitions::application_user::ApplicationUserStatus, schema::application_user,
};

use diesel::prelude::{AsChangeset, Identifiable, Insertable, Queryable, Selectable};
use uuid::Uuid;
#[derive(Insertable, Debug)]
#[diesel(table_name = application_user)]
pub struct ApplicationUserInput {
    pub id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: String,
    pub status: ApplicationUserStatus,
}

#[derive(Debug, Clone, Queryable, Identifiable, Insertable, Selectable, AsChangeset)]
#[diesel(table_name=application_user)]
pub struct ApplicationUser {
    pub id: Uuid,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub status: ApplicationUserStatus,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}
