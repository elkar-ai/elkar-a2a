use chrono::NaiveDateTime;
use database_schema::{
    enum_definitions::task::TaskEventSubscriptionStatus,
    schema::{task_event_subscription, task_subscription},
};
use diesel::prelude::*;
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset, Selectable)]
#[diesel(table_name = task_subscription)]
pub struct TaskSubscription {
    pub tenant_id: Uuid,
    pub id: Uuid,
    pub task_id: Uuid,
    pub subscriber_id: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = task_subscription)]
pub struct TaskSubscriptionInput {
    pub task_id: Uuid,
    pub subscriber_id: String,
}

#[derive(Debug, Clone, Queryable, Insertable, AsChangeset, Selectable)]
#[diesel(table_name = task_event_subscription)]
pub struct TaskEventSubscription {
    pub tenant_id: Uuid,
    pub id: Uuid,
    pub task_event_id: Uuid,
    pub task_subscription_id: Uuid,
    pub status: TaskEventSubscriptionStatus,
    pub delivered_at: Option<NaiveDateTime>,
    pub failed_at: Option<NaiveDateTime>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = task_event_subscription)]
pub struct TaskEventSubscriptionInput {
    pub task_event_id: Uuid,
    pub task_subscription_id: Uuid,
    pub status: TaskEventSubscriptionStatus,
    pub delivered_at: Option<NaiveDateTime>,
    pub failed_at: Option<NaiveDateTime>,
}
