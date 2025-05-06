use crate::{
    extensions::errors::{AppResult, BoxedAppError},
    models::task::{Task, TaskInput},
};
use agent2agent::{Task as A2ATask, TaskSendParams, TaskState as A2ATaskState, TaskStatus};
use database_schema::{
    enum_definitions::task::{TaskState, TaskType},
    schema::task,
};

use diesel::prelude::*;
use diesel_async::{scoped_futures::ScopedFutureExt, AsyncConnection, AsyncPgConnection};
use uuid::Uuid;

use super::schema::TaskServiceOutput;

pub struct CreateTaskA2AParams {
    pub send_task_params: TaskSendParams,
    pub agent_id: Uuid,
    pub counterparty_identifier: Option<String>,
    pub task_type: TaskType,
}

pub async fn create_task_a2a(
    params: CreateTaskA2AParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<TaskServiceOutput> {
    let task_output = conn
        .transaction(|conn| {
            async move {
                let existing_tasks_stmt = task::table
                    .for_update()
                    .filter(task::task_id.eq(&params.send_task_params.id))
                    .filter(task::agent_id.eq(&params.agent_id))
                    .select(Task::as_select());

                let mut existing_tasks =
                    diesel_async::RunQueryDsl::get_results::<Task>(existing_tasks_stmt, conn)
                        .await?;

                let existing_task = existing_tasks.pop();
                let task = match existing_task {
                    Some(task) => update_task(task, params.send_task_params, conn).await?,
                    None => insert_new_task(params, conn).await?,
                };

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
                })
            }
            .scope_boxed()
        })
        .await?;
    Ok(task_output)
}

async fn insert_new_task(
    params: CreateTaskA2AParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<Task> {
    let new_task = A2ATask {
        id: params.send_task_params.id.clone(),
        session_id: params.send_task_params.session_id,
        history: Some(vec![params.send_task_params.message.clone()]),
        artifacts: None,
        metadata: None,
        status: TaskStatus {
            state: A2ATaskState::Submitted,
            message: None,
            timestamp: None,
        },
    };
    let serde_task = serde_json::to_value(&new_task)?;
    let push_notification = serde_json::to_value(&params.send_task_params.push_notification)?;
    let new_task = TaskInput {
        task_id: params.send_task_params.id,
        agent_id: params.agent_id,
        counterparty_id: params.counterparty_identifier,
        task_type: params.task_type,
        task_state: TaskState::Submitted,
        push_notification: Some(push_notification),
        a2a_task: Some(serde_task),
    };
    let new_task_stmt = diesel::insert_into(task::table)
        .values(new_task)
        .returning(Task::as_returning());
    let new_task = diesel_async::RunQueryDsl::get_result::<Task>(new_task_stmt, conn).await?;
    Ok(new_task)
}

async fn update_task(
    task: Task,
    send_task_params: TaskSendParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<Task> {
    let mut a2a_task = serde_json::from_value::<A2ATask>(
        task.a2a_task
            .ok_or(anyhow::anyhow!("Task has no A2A task"))?,
    )?;

    a2a_task.add_message(send_task_params.message);
    let updated_task = Task {
        a2a_task: Some(serde_json::to_value(&a2a_task)?),
        push_notification: Some(serde_json::to_value(&send_task_params.push_notification)?),
        ..task
    };

    let updated_task_stmt = diesel::update(task::table)
        .set(updated_task)
        .returning(Task::as_returning());
    let updated_task =
        diesel_async::RunQueryDsl::get_result::<Task>(updated_task_stmt, conn).await?;

    Ok(updated_task)
}
