use diesel_derive_enum::DbEnum;
use serde::*;
use utoipa::ToSchema;

#[derive(Debug, Clone, DbEnum, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[DbValueStyle = "SCREAMING_SNAKE_CASE"]
#[ExistingTypePath = "crate::schema::sql_types::TaskState"]
pub enum TaskState {
    Completed,
    Failed,
    Canceled,
    Submitted,
    Working,
    InputRequired,
    Unknown,
}

#[derive(Debug, Clone, DbEnum, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[DbValueStyle = "SCREAMING_SNAKE_CASE"]
#[ExistingTypePath = "crate::schema::sql_types::TaskType"]
pub enum TaskType {
    Incoming,
    Outgoing,
}
