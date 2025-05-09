// use crate::extensions::errors::AppResult;
// use agent2agent::event::TaskEvent as A2ATaskEvent;
// use chrono::NaiveDateTime;
// use database_schema::schema::task_event;
// use diesel::prelude::*;
// use sea_query::enum_def;
// use serde::{Deserialize, Serialize};
// use serde_json::Value;
// use uuid::Uuid;

// #[derive(Debug, Clone, Selectable, Identifiable, Queryable, QueryableByName, AsChangeset)]
// #[enum_def(table_name = "task_event")]
// #[diesel(table_name = task_event)]
// pub struct TaskEvent {
//     pub tenant_id: Uuid,
//     pub id: Uuid,
//     pub task_id: String,
//     pub caller_id: Option<String>,
//     pub event_data: Value, // Store the A2ATaskEvent as JSON
//     pub created_at: NaiveDateTime,
//     pub updated_at: NaiveDateTime,
// }

// #[derive(Debug, Insertable, Deserialize, Serialize)]
// #[diesel(table_name = task_event)]
// pub struct TaskEventInput {
//     pub task_id: String,
//     pub caller_id: Option<String>,
//     pub event_data: Value, // Store the A2ATaskEvent as JSON
// }
