use diesel_async::AsyncPgConnection;
use uuid::Uuid;

use crate::extensions::errors::AppResult;
use crate::models::task_subscription::TaskSubscription;
use database_schema::schema::task_subscription;
use diesel::ExpressionMethods;
use diesel::prelude::*;

pub struct TaskSubscriptionServiceOutput {
    pub id: Uuid,
    pub task_id: Uuid,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl From<TaskSubscription> for TaskSubscriptionServiceOutput {
    fn from(task_subscription: TaskSubscription) -> Self {
        TaskSubscriptionServiceOutput {
            id: task_subscription.id,
            task_id: task_subscription.task_id,
            created_at: task_subscription.created_at,
            updated_at: task_subscription.updated_at,
        }
    }
}

pub struct TaskSubscriptionFilter {
    pub task_id: Option<Vec<Uuid>>,
}

pub async fn get_task_subscriptions(
    filter: TaskSubscriptionFilter,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<TaskSubscriptionServiceOutput>> {
    let mut task_subscriptions = task_subscription::table
        .select(TaskSubscription::as_select())
        .into_boxed();
    if let Some(task_ids) = filter.task_id {
        task_subscriptions = task_subscriptions.filter(task_subscription::task_id.eq_any(task_ids));
    }

    let task_subscriptions = diesel_async::RunQueryDsl::load(task_subscriptions, conn).await?;

    Ok(task_subscriptions
        .into_iter()
        .map(TaskSubscriptionServiceOutput::from)
        .collect())
}
