use super::schema::TaskServiceOutput;
use crate::{
    extensions::errors::{AppResult, ServiceError},
    models::task::Task,
};
use database_schema::schema::task;
use diesel::prelude::*;
use diesel_async::AsyncPgConnection;
use http::StatusCode;
use uuid::Uuid;

pub struct RetrieveTaskA2AParams {
    pub task_id: String,
    pub caller_id: Option<String>,
    pub agent_id: Uuid,
}

pub async fn retrieve_task_a2a(
    params: RetrieveTaskA2AParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<TaskServiceOutput> {
    let mut task_stmt = task::table
        .filter(task::task_id.eq(params.task_id))
        .filter(task::agent_id.eq(params.agent_id))
        .into_boxed();

    if let Some(caller_id) = params.caller_id {
        task_stmt = task_stmt.filter(task::counterparty_id.eq(caller_id));
    }

    let mut task =
        diesel_async::RunQueryDsl::get_results(task_stmt.select(Task::as_select()), conn).await?;
    let Some(task) = task.pop() else {
        return Err(ServiceError::new()
            .error_type("Task not found")
            .status_code(StatusCode::NOT_FOUND)
            .into());
    };
    let a2a_task = task.a2a_task.map(serde_json::from_value).transpose()?;
    let task = TaskServiceOutput {
        id: task.id,
        task_id: task.task_id,
        task_state: task.task_state,
        task_type: task.task_type,
        agent_id: task.agent_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
        a2a_task,
        counterparty_id: task.counterparty_id,
    };
    Ok(task)
}
