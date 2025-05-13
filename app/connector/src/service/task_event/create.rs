use crate::{
    extensions::errors::{AppResult, BoxedAppError},
    models::{
        task_event::{TaskEvent, TaskEventInput},
        task_subscription::TaskEventSubscriptionInput,
    },
    service::task::retrieve::get_task_by_task_id,
};

use agent2agent::event::TaskEvent as Agent2AgentTaskEvent;
use database_schema::{
    enum_definitions::task::TaskEventSubscriptionStatus,
    schema::{task_event, task_event_subscription},
};
use diesel::prelude::*;
use diesel_async::{AsyncConnection, AsyncPgConnection, scoped_futures::ScopedFutureExt};

use super::subscriber::{TaskSubscriptionFilter, get_task_subscriptions};

pub struct CreateTaskEventServiceInput {
    pub task_id: String,
    pub caller_id: Option<String>,
    pub task_event: Agent2AgentTaskEvent,
}

pub async fn create_task_event(
    input: CreateTaskEventServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<()> {
    let task = get_task_by_task_id(input.task_id, input.caller_id, conn).await?;
    let task_subscriptions = get_task_subscriptions(
        TaskSubscriptionFilter {
            task_id: Some(vec![task.id]),
        },
        conn,
    )
    .await?;
    conn.transaction(|conn| {
        async move {
            let task_insert_stmt = diesel::insert_into(task_event::table)
                .values(TaskEventInput {
                    task_id: task.id,
                    event_data: serde_json::to_value(input.task_event)?,
                })
                .returning(TaskEvent::as_select());
            let task_event = diesel_async::RunQueryDsl::get_result(task_insert_stmt, conn).await?;
            for task_subscription in task_subscriptions {
                let task_event_subscription_insert_stmt = diesel::insert_into(
                    task_event_subscription::table,
                )
                .values(TaskEventSubscriptionInput {
                    task_event_id: task_event.id,
                    status: TaskEventSubscriptionStatus::Pending,
                    task_subscription_id: task_subscription.id,
                    delivered_at: None,
                    failed_at: None,
                });
                diesel_async::RunQueryDsl::execute(task_event_subscription_insert_stmt, conn)
                    .await?;
            }
            Ok::<_, BoxedAppError>(())
        }
        .scope_boxed()
    })
    .await?;
    Ok(())
}
