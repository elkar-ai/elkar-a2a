use diesel_derive_enum::DbEnum;
use serde::*;
use utoipa::ToSchema;

#[derive(Debug, Clone, DbEnum, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[DbValueStyle = "SCREAMING_SNAKE_CASE"]
#[ExistingTypePath = "crate::schema::sql_types::ApplicationUserStatus"]
pub enum ApplicationUserStatus {
    Active,
    Deleted,
    Invited,
}
