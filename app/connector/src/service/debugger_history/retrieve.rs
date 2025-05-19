use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use serde_json::Value;
use uuid::Uuid;

use crate::{extensions::errors::AppResult, models::debugger_history::DebuggerHistory};
use database_schema::schema::debugger_history;

pub struct DebuggerHistoryServiceOutput {
    pub id: Uuid,
    pub task_id: String,
    pub url: String,
    pub payload: Value,
}

pub struct RetrieveDebuggerHistoryParams {
    pub task_id: Option<String>,
    pub url: Option<String>,
}

pub async fn retrieve_debugger_history(
    params: RetrieveDebuggerHistoryParams,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<DebuggerHistoryServiceOutput>> {
    let mut query = debugger_history::table.into_boxed();

    if let Some(task_id) = params.task_id {
        query = query.filter(debugger_history::task_id.eq(task_id));
    }

    if let Some(url) = params.url {
        query = query.filter(debugger_history::url.eq(url));
    }

    let entries = query
        .select(DebuggerHistory::as_select())
        .get_results::<DebuggerHistory>(conn)
        .await?;

    Ok(entries
        .into_iter()
        .map(|debugger_history| DebuggerHistoryServiceOutput {
            id: debugger_history.id,
            task_id: debugger_history.task_id,
            url: debugger_history.url,
            payload: debugger_history.payload,
        })
        .collect())
}
