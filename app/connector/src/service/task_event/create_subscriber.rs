use database_schema::schema::task_subscription;
use diesel_async::{AsyncPgConnection, RunQueryDsl};

use crate::{
    extensions::errors::AppResult, models::task_subscription::TaskSubscriptionInput,
    service::task::retrieve::get_task_by_task_id,
};

pub struct TaskSubscriptionServiceInput {
    pub task_id: String,
    pub subscriber_id: String,
    pub caller_id: Option<String>,
}

pub async fn create_task_subscriber(
    input: TaskSubscriptionServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<()> {
    let task = get_task_by_task_id(input.task_id, input.caller_id, conn).await?;
    let input = TaskSubscriptionInput {
        task_id: task.id,
        subscriber_id: input.subscriber_id,
    };
    diesel::insert_into(task_subscription::table)
        .values(input)
        .execute(conn)
        .await?;
    Ok(())
}
