// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "application_user_status"))]
    pub struct ApplicationUserStatus;

    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "task_state"))]
    pub struct TaskState;

    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "task_type"))]
    pub struct TaskType;
}

diesel::table! {
    use diesel::sql_types::*;

    agent (id) {
        tenant_id -> Uuid,
        id -> Uuid,
        name -> Text,
        description -> Nullable<Text>,
        is_deleted -> Bool,
        created_by -> Uuid,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    api_key (id) {
        tenant_id -> Uuid,
        id -> Uuid,
        agent_id -> Nullable<Uuid>,
        name -> Text,
        hash -> Text,
        created_by -> Nullable<Uuid>,
        is_deleted -> Bool,
        expires_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
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
    use super::sql_types::TaskState;
    use super::sql_types::TaskType;

    task (id) {
        tenant_id -> Uuid,
        id -> Uuid,
        agent_id -> Uuid,
        task_id -> Text,
        counterparty_id -> Nullable<Text>,
        task_state -> TaskState,
        task_type -> TaskType,
        push_notification -> Nullable<Jsonb>,
        a2a_task -> Nullable<Jsonb>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    task_event (id) {
        tenant_id -> Uuid,
        id -> Uuid,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    task_subscription (id) {
        tenant_id -> Uuid,
        id -> Uuid,
        task_id -> Uuid,
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

diesel::joinable!(agent -> application_user (created_by));
diesel::joinable!(agent -> tenant (tenant_id));
diesel::joinable!(api_key -> agent (agent_id));
diesel::joinable!(api_key -> application_user (created_by));
diesel::joinable!(api_key -> tenant (tenant_id));
diesel::joinable!(task -> agent (agent_id));
diesel::joinable!(task -> tenant (tenant_id));
diesel::joinable!(task_event -> tenant (tenant_id));
diesel::joinable!(task_subscription -> task (task_id));
diesel::joinable!(task_subscription -> tenant (tenant_id));
diesel::joinable!(tenant_user -> application_user (user_id));
diesel::joinable!(tenant_user -> tenant (tenant_id));

diesel::allow_tables_to_appear_in_same_query!(
    agent,
    api_key,
    application_user,
    task,
    task_event,
    task_subscription,
    tenant,
    tenant_user,
);
