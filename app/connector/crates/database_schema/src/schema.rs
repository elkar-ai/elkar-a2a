// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "application_user_status"))]
    pub struct ApplicationUserStatus;
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::ApplicationUserStatus;

    application_user (id) {
        id -> Uuid,
        status -> ApplicationUserStatus,
        email -> Text,
        first_name -> Nullable<Text>,
        last_name -> Nullable<Text>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    tenant (id) {
        id -> Uuid,
        name -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    tenant_user (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        user_id -> Uuid,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::joinable!(tenant_user -> application_user (user_id));
diesel::joinable!(tenant_user -> tenant (tenant_id));

diesel::allow_tables_to_appear_in_same_query!(
    application_user,
    tenant,
    tenant_user,
);
