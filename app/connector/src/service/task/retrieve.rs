use database_schema::{
    enum_definitions::task::{TaskState, TaskType},
    utils::list_enum_to_string,
};
use diesel::prelude::QueryableByName;
use diesel_async::AsyncPgConnection;

use http::StatusCode;
use sea_query::{Expr, SelectStatement};
use uuid::Uuid;

use crate::{
    extensions::{
        errors::{AppResult, BoxedAppError, ServiceError},
        pagination::{query_async::load_with_pagination_async, Paginated, PaginationOptions},
    },
    models::task::{Task, TaskIden},
};

use super::schema::TaskServiceOutput;

#[derive(Debug, Clone, Default)]
pub struct RetrieveTaskParams {
    pub task_id_in: Option<Vec<String>>,
    pub task_state_in: Option<Vec<TaskState>>,
    pub task_type_in: Option<Vec<TaskType>>,
    pub agent_id_in: Option<Vec<Uuid>>,
    pub pagination: Option<PaginationOptions>,
}

fn build_retrieve_task_query(params: RetrieveTaskParams) -> SelectStatement {
    let mut query = sea_query::SelectStatement::new()
        .column((TaskIden::Table, sea_query::Asterisk))
        .from(TaskIden::Table)
        .to_owned();

    if let Some(task_id_in) = params.task_id_in {
        query.and_where(Expr::col(TaskIden::Id).is_in(task_id_in));
    }

    if let Some(task_state_in) = params.task_state_in {
        query.and_where(Expr::col(TaskIden::TaskState).is_in(list_enum_to_string(&task_state_in)));
    }

    if let Some(task_type_in) = params.task_type_in {
        query.and_where(Expr::col(TaskIden::TaskType).is_in(list_enum_to_string(&task_type_in)));
    }

    if let Some(agent_id_in) = params.agent_id_in {
        query.and_where(Expr::col(TaskIden::AgentId).is_in(agent_id_in));
    }

    query
}
#[derive(QueryableByName, Debug, Clone)]
pub struct TaskRow {
    #[diesel(embed)]
    pub task: Task,
}

pub async fn retrieve_tasks(
    params: RetrieveTaskParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<Paginated<TaskServiceOutput>> {
    let query = build_retrieve_task_query(params.clone());
    let tasks: Paginated<TaskRow> =
        load_with_pagination_async(query, params.pagination.as_ref(), conn).await?;

    let output = tasks.map(|task| {
        let a2a_task = task.task.a2a_task.map(serde_json::from_value).transpose()?;
        Ok::<_, BoxedAppError>(TaskServiceOutput {
            id: task.task.id,
            task_id: task.task.task_id,
            task_state: task.task.task_state,
            task_type: task.task.task_type,
            a2a_task,
            agent_id: task.task.agent_id,
            created_at: task.task.created_at,
            updated_at: task.task.updated_at,
            counterparty_id: task.task.counterparty_id,
        })
    });

    let output = output.transpose()?;

    Ok(output)
}

pub async fn get_task(
    task_id: String,
    conn: &mut AsyncPgConnection,
) -> AppResult<TaskServiceOutput> {
    let mut tasks = retrieve_tasks(
        RetrieveTaskParams {
            task_id_in: Some(vec![task_id]),
            ..Default::default()
        },
        conn,
    )
    .await?;
    let Some(task) = tasks.pop() else {
        return Err(ServiceError::new()
            .status_code(StatusCode::NOT_FOUND)
            .error_type("task_not_found")
            .into());
    };
    Ok(task)
}
