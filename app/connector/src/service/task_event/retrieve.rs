use database_schema::schema::task_event;
use diesel::{ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

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
    pub pagination_options: PaginationOptions,
}

pub async fn retrieve_task_events(
    conn: &mut AsyncPgConnection,
    input: RetrieveTaskEventServiceInput,
) -> AppResult<Vec<TaskEvent>> {
    let mut query = task_event::table.into_boxed();

    // Apply filters
    if let Some(task_ids) = input.task_id_in {
        query = query.filter(task_event::task_id.eq_any(task_ids));
    }

    if let Some(ids) = input.id_in {
        query = query.filter(task_event::id.eq_any(ids));
    }

    // Apply ordering
    match input.order_by {
        Some(TaskEventOrderBy::CreatedAt) => {
            query = query.order(task_event::created_at.desc());
        }
        Some(TaskEventOrderBy::UpdatedAt) => {
            query = query.order(task_event::updated_at.desc());
        }
        None => {
            query = query.order(task_event::created_at.desc());
        }
    }

    // Apply pagination
    if let Some(offset) = input.pagination_options.offset() {
        query = query.offset(offset);
    }
    query = query.limit(input.pagination_options.limit());

    // Execute query
    let results = query
        .select(TaskEvent::as_select())
        .get_results(conn)
        .await?;

    Ok(results)
}
