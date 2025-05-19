use diesel::{ExpressionMethods, upsert::excluded};
use diesel_async::AsyncPgConnection;
use serde_json::Value;

use crate::{extensions::errors::AppResult, models::debugger_history::DebuggerHistoryInsert};
use agent2agent::Task as A2ATask;
use database_schema::schema::debugger_history;

pub struct DebuggerHistoryServiceInput {
    pub url: String,
    pub task: Value,
}

pub async fn create_debug_history_entry(
    input: DebuggerHistoryServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<()> {
    let task = serde_json::from_value::<A2ATask>(input.task.clone())?;
    let new_entry = DebuggerHistoryInsert {
        task_id: task.id,
        url: input.url,
        payload: input.task,
    };
    diesel_async::RunQueryDsl::execute(
        diesel::insert_into(debugger_history::table)
            .values(&new_entry)
            .on_conflict((debugger_history::task_id, debugger_history::url))
            .do_update()
            .set(debugger_history::payload.eq(excluded(debugger_history::payload))),
        conn,
    )
    .await?;
    Ok(())
}
