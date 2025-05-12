use diesel::QueryableByName;
use diesel::sql_types::{Jsonb, Timestamp, Uuid as DieselUuid};
use diesel_async::AsyncPgConnection;
use sea_query::{Expr, Iden, Order, Query, SelectStatement};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::extensions::pagination::Paginated;
use crate::extensions::pagination::query_async::load_with_pagination_async;
use crate::extensions::{errors::AppResult, pagination::PaginationOptions};
use crate::models::task_event::TaskEvent;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[serde(rename_all = "kebab-case")]
pub enum TaskEventOrderBy {
    CreatedAt,
    UpdatedAt,
}

pub struct RetrieveTaskEventServiceInput {
    pub task_id_in: Option<Vec<Uuid>>,
    pub id_in: Option<Vec<Uuid>>,
    pub order_by: Option<TaskEventOrderBy>,
    pub pagination_options: Option<PaginationOptions>,
}

#[derive(Iden)]
enum TaskEventIden {
    #[iden = "task_event"]
    Table,
    TenantId,
    Id,
    TaskId,
    EventData,
    CreatedAt,
    UpdatedAt,
}

#[derive(QueryableByName)]
struct TaskEventQuery {
    #[diesel(sql_type = DieselUuid)]
    tenant_id: Uuid,
    #[diesel(sql_type = DieselUuid)]
    id: Uuid,
    #[diesel(sql_type = DieselUuid)]
    task_id: Uuid,
    #[diesel(sql_type = Jsonb)]
    event_data: serde_json::Value,
    #[diesel(sql_type = Timestamp)]
    created_at: chrono::NaiveDateTime,
    #[diesel(sql_type = Timestamp)]
    updated_at: chrono::NaiveDateTime,
}

impl From<TaskEventQuery> for TaskEvent {
    fn from(query: TaskEventQuery) -> Self {
        TaskEvent {
            tenant_id: query.tenant_id,
            id: query.id,
            task_id: query.task_id,
            event_data: query.event_data,
            created_at: query.created_at,
            updated_at: query.updated_at,
        }
    }
}

pub struct TaskEventServiceOutput {
    pub id: Uuid,
    pub task_id: Uuid,
    pub event_data: serde_json::Value,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl From<TaskEventQuery> for TaskEventServiceOutput {
    fn from(task_event: TaskEventQuery) -> Self {
        TaskEventServiceOutput {
            id: task_event.id,
            task_id: task_event.task_id,
            event_data: task_event.event_data,
            created_at: task_event.created_at,
            updated_at: task_event.updated_at,
        }
    }
}

pub fn build_query(input: &RetrieveTaskEventServiceInput) -> SelectStatement {
    let mut query = Query::select();
    query.from(TaskEventIden::Table);
    query.columns([
        TaskEventIden::TenantId,
        TaskEventIden::Id,
        TaskEventIden::TaskId,
        TaskEventIden::EventData,
        TaskEventIden::CreatedAt,
        TaskEventIden::UpdatedAt,
    ]);

    // Apply filters
    if let Some(task_ids) = &input.task_id_in {
        query.and_where(Expr::col(TaskEventIden::TaskId).is_in(task_ids.clone()));
    }

    if let Some(ids) = &input.id_in {
        query.and_where(Expr::col(TaskEventIden::Id).is_in(ids.clone()));
    }

    // Apply ordering
    match input.order_by {
        Some(TaskEventOrderBy::CreatedAt) => {
            query.order_by(TaskEventIden::CreatedAt, Order::Desc);
        }
        Some(TaskEventOrderBy::UpdatedAt) => {
            query.order_by(TaskEventIden::UpdatedAt, Order::Desc);
        }
        None => {
            query.order_by(TaskEventIden::CreatedAt, Order::Desc);
        }
    }
    query.to_owned()
}
pub async fn retrieve_task_events(
    input: RetrieveTaskEventServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<Paginated<TaskEventServiceOutput>> {
    // Use the pagination helper
    let query = build_query(&input);
    load_with_pagination_async::<TaskEventQuery, _>(query, input.pagination_options.as_ref(), conn)
        .await
        .map(|paginated| paginated.map(TaskEventServiceOutput::from))
}
