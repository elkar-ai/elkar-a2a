use crate::extensions::errors::AppResult;
use crate::models::task_event::TaskEventInput;
use agent2agent::event::TaskEvent;
use database_schema::schema::task_event;
use diesel_async::AsyncPgConnection;

pub struct CreateTaskEventServiceInput {
    pub task_id: String,
    pub caller_id: Option<String>,
    pub task_event: TaskEvent,
}

pub async fn create_task_event(
    input: CreateTaskEventServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<()> {
    let task_insert_stmt = diesel::insert_into(task_event::table).values(TaskEventInput {
        task_id: input.task_id,
        caller_id: input.caller_id,
        event_data: serde_json::to_value(input.task_event)?,
    });
    diesel_async::RunQueryDsl::execute(task_insert_stmt, conn).await?;

    Ok(())
}
