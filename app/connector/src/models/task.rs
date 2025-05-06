use chrono::NaiveDateTime;
use database_schema::enum_definitions::task::{TaskState, TaskType};
use database_schema::schema::task;
use diesel::prelude::*;
use sea_query::enum_def;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Selectable, Identifiable, Queryable, QueryableByName, AsChangeset)]
#[enum_def(table_name = "task")]
#[diesel(table_name = task)]
pub struct Task {
    pub tenant_id: Uuid,
    pub id: Uuid,
    pub agent_id: Uuid,
    pub task_id: String,
    pub counterparty_id: Option<String>,
    pub task_state: TaskState,
    pub task_type: TaskType,
    pub push_notification: Option<Value>,
    pub a2a_task: Option<Value>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Insertable, Deserialize, Serialize)]
#[diesel(table_name = task)]
pub struct TaskInput {
    pub agent_id: Uuid,
    pub task_id: String,
    pub counterparty_id: Option<String>,
    pub task_state: TaskState,
    pub task_type: TaskType,
    pub push_notification: Option<Value>,
    pub a2a_task: Option<Value>,
}
