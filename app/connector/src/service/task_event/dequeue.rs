use database_schema::{
    enum_definitions::task::TaskEventSubscriptionStatus,
    schema::{task_event, task_event_subscription, task_subscription},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::{AsyncConnection, AsyncPgConnection, RunQueryDsl};
use serde_json::Value;
use uuid::Uuid;

use crate::extensions::errors::AppResult;

pub struct DequeueTaskEventServiceInput {
    pub task_id: Uuid,
    pub limit: Option<i32>,
    pub subscriber_id: Uuid,
}

pub struct DequeueTaskEventServiceOutput {
    pub id: Uuid,
    pub task_id: Uuid,
    pub event_data: Value,
}

pub async fn dequeue_task_event(
    input: DequeueTaskEventServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<DequeueTaskEventServiceOutput>> {
    conn.transaction(|conn| {
        Box::pin(async move {
            let task_event_subscription_event_ids = task_event_subscription::table
                .inner_join(task_subscription::table)
                .filter(task_event_subscription::status.eq(TaskEventSubscriptionStatus::Pending))
                .filter(task_subscription::id.eq(input.subscriber_id))
                .select(task_event_subscription::task_event_id);

            let events = task_event::table
                .filter(task_event::id.eq_any(task_event_subscription_event_ids))
                .filter(task_event::task_id.eq(input.task_id))
                .select((task_event::id, task_event::task_id, task_event::event_data))
                .limit(input.limit.unwrap_or(1).into())
                .load::<(Uuid, Uuid, Value)>(conn)
                .await?;

            let result = events
                .into_iter()
                .map(|(id, task_id, event_data)| DequeueTaskEventServiceOutput {
                    id,
                    task_id,
                    event_data,
                })
                .collect();

            Ok(result)
        })
    })
    .await
}
