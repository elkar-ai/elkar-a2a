use agent2agent::{
    Artifact, Message, PushNotificationConfig, Task as A2ATask, TaskState as A2ATaskState,
    TaskStatus,
};

use database_schema::enum_definitions::task::TaskState;
use database_schema::schema::task;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use http::StatusCode;
use uuid::Uuid;

use super::schema::TaskServiceOutput;
use crate::extensions::async_database::AsyncDataBaseConnection;
use crate::extensions::errors::{AppResult, ServiceError};
use crate::models::task::Task;

#[derive(Debug, Clone)]
pub struct UpdateTaskParams {
    pub status: Option<TaskStatus>,
    pub artifacts_updates: Option<Vec<Artifact>>,
    pub new_messages: Option<Vec<Message>>,
    pub push_notification: Option<PushNotificationConfig>,
    pub caller_id: Option<String>,
}

pub async fn update_task(
    agent_id: Uuid,
    task_id: String,
    params: UpdateTaskParams,
    conn: &mut AsyncDataBaseConnection<
        impl std::ops::DerefMut<Target = diesel_async::AsyncPgConnection> + Send,
    >,
) -> AppResult<TaskServiceOutput> {
    tracing::info!(message="Updating task", task_id = task_id, params = ?params);
    let task_stmt = task::table
        .for_update()
        .filter(task::task_id.eq(&task_id))
        .filter(task::agent_id.eq(agent_id))
        .select(Task::as_select());

    let mut task = task_stmt.first::<Task>(conn).await?;

    let mut a2a_task = task
        .a2a_task
        .map(serde_json::from_value::<A2ATask>)
        .transpose()?;

    if let Some(a2a_task) = a2a_task.as_mut() {
        update_a2a_task(a2a_task, params.clone())?;
    }
    task.a2a_task = Some(serde_json::to_value(a2a_task)?);

    if let Some(status) = params.status {
        task.task_state = match status.state {
            A2ATaskState::Submitted => TaskState::Submitted,
            A2ATaskState::Working => TaskState::Working,
            A2ATaskState::InputRequired => TaskState::InputRequired,
            A2ATaskState::Completed => TaskState::Completed,
            A2ATaskState::Failed => TaskState::Failed,
            A2ATaskState::Canceled => TaskState::Canceled,
            A2ATaskState::Unknown => TaskState::Unknown,
        };
    }

    if let Some(push_notification) = params.push_notification {
        task.push_notification = Some(serde_json::to_value(push_notification)?);
    }
    let update_stmt = diesel::update(&task)
        .set(&task)
        .returning(Task::as_select());
    let task: Task = diesel_async::RunQueryDsl::get_result(update_stmt, conn).await?;

    let task_service_output = TaskServiceOutput {
        id: task.id,
        task_id: task.task_id,
        task_state: task.task_state,
        task_type: task.task_type,
        a2a_task: task
            .a2a_task
            .map(serde_json::from_value::<A2ATask>)
            .transpose()?,
        agent_id: task.agent_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
        counterparty_id: task.counterparty_id,
    };

    Ok(task_service_output)
}

pub fn update_a2a_task(a2a_task: &mut A2ATask, params: UpdateTaskParams) -> AppResult<()> {
    if let Some(status) = &params.status {
        a2a_task.status = status.clone();
        if let Some(message) = status.message.clone() {
            a2a_task.add_message(message);
        }
    }
    if let Some(messages) = &params.new_messages {
        for message in messages {
            a2a_task.add_message(message.clone());
        }
    }

    if let Some(artifacts) = &params.artifacts_updates {
        for artifact in artifacts {
            a2a_task.upsert_artifact(artifact.clone()).map_err(|e| {
                ServiceError::new()
                    .status_code(StatusCode::BAD_REQUEST)
                    .error_type("Failed to update artifact")
                    .details(e.to_string())
            })?;
        }
    }

    Ok(())
}
