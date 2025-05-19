use database_schema::schema::debugger_history;
use diesel::{Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Serialize, Deserialize, Selectable)]
#[diesel(table_name = debugger_history)]
pub struct DebuggerHistory {
    pub id: Uuid,
    pub task_id: String,
    pub url: String,
    pub payload: Value,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = debugger_history)]
pub struct DebuggerHistoryInsert {
    pub task_id: String,
    pub url: String,
    pub payload: Value,
}
