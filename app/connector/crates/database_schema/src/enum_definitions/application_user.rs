use diesel_derive_enum::DbEnum;
use serde::*;

#[derive(Debug, Clone, DbEnum, Serialize, Deserialize, PartialEq, Eq)]
#[DbValueStyle = "SCREAMING_SNAKE_CASE"]
#[ExistingTypePath = "crate::schema::sql_types::ApplicationUserStatus"]
pub enum ApplicationUserStatus {
    Active,
    Deleted,
    Invited,
}
