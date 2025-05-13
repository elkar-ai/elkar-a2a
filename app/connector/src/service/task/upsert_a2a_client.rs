use crate::{
    extensions::errors::{AppResult, BoxedAppError},
    models::task::{Task, TaskInput},
};
use agent2agent::Task as A2ATask;
use database_schema::{enum_definitions::task::TaskType, schema::task};

use diesel::{
    prelude::*,
    upsert::{excluded, on_constraint},
};
use diesel_async::{AsyncConnection, AsyncPgConnection, scoped_futures::ScopedFutureExt};
use uuid::Uuid;

use super::{schema::TaskServiceOutput, utils::a2a_state_to_db_state};

pub struct CreateTaskA2AClientParams {
    pub task: A2ATask,
    pub agent_id: Uuid,
    pub server_agent_url: String,
    pub counterparty_identifier: Option<String>,
}

pub async fn create_task_a2a_client(
    params: CreateTaskA2AClientParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<TaskServiceOutput> {
    let task_output = conn
        .transaction(|conn| {
            async move {
                let serde_task = serde_json::to_value(&params.task)?;
                let new_task = TaskInput {
                    task_id: params.task.id,
                    agent_id: params.agent_id,
                    server_agent_url: Some(params.server_agent_url),
                    counterparty_id: params.counterparty_identifier,
                    task_type: TaskType::Outgoing,
                    task_state: a2a_state_to_db_state(params.task.status.state),
                    push_notification: None,
                    a2a_task: Some(serde_task),
                };
                let new_task_stmt = diesel::insert_into(task::table)
                    .values(&new_task)
                    .on_conflict(on_constraint("unique_agent_task"))
                    .do_update()
                    .set((
                        task::a2a_task.eq(excluded(task::a2a_task)),
                        task::task_state.eq(excluded(task::task_state)),
                    ))
                    .returning(Task::as_returning());
                let task =
                    diesel_async::RunQueryDsl::get_result::<Task>(new_task_stmt, conn).await?;
                let a2a_task = serde_json::from_value::<A2ATask>(
                    task.a2a_task
                        .ok_or(anyhow::anyhow!("Task has no A2A task"))?,
                )?;
                Ok::<_, BoxedAppError>(TaskServiceOutput {
                    id: task.id,
                    task_id: task.task_id,
                    task_state: task.task_state,
                    task_type: task.task_type,
                    a2a_task: Some(a2a_task),
                    agent_id: task.agent_id,
                    created_at: task.created_at,
                    updated_at: task.updated_at,
                    counterparty_id: task.counterparty_id,
                    server_agent_url: task.server_agent_url,
                })
            }
            .scope_boxed()
        })
        .await?;
    Ok(task_output)
}
