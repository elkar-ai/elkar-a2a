use uuid::Uuid;

pub struct TaskSubscriptionFilter {
    pub task_id: Option<Vec<Uuid>>,
}

pub async fn get_task_subscriptions(
    filter: TaskSubscriptionFilter,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<TaskSubscription>> {
    let task_subscriptions = TaskSubscription::belonging_to(task_id).load(conn).await?;
    Ok(task_subscriptions)
}
