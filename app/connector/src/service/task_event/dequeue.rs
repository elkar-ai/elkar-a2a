use agent2agent::event::TaskEvent as A2ATaskEvent;
use chrono::Utc;
use database_schema::{
    enum_definitions::task::TaskEventSubscriptionStatus,
    schema::{task, task_event, task_event_subscription, task_subscription},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::{AsyncConnection, AsyncPgConnection, RunQueryDsl};
use serde_json::Value;
use uuid::Uuid;

use crate::extensions::errors::{AppResult, BoxedAppError};

pub struct DequeueTaskEventServiceInput {
    pub task_id: String,
    pub caller_id: Option<String>,
    pub limit: Option<i32>,
    pub subscriber_id: String,
}

pub struct DequeueTaskEventServiceOutput {
    pub id: Uuid,
    pub task_id: String,
    pub event_data: A2ATaskEvent,
}

pub async fn dequeue_task_event(
    input: DequeueTaskEventServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<DequeueTaskEventServiceOutput>> {
    conn.transaction(|conn| {
        Box::pin(async move {
            let task_event_subscription_event_ids = task_event_subscription::table
                .inner_join(task_subscription::table)
                .filter(task_event_subscription::status.eq(TaskEventSubscriptionStatus::Pending))
                .filter(task_subscription::subscriber_id.eq(input.subscriber_id))
                .select(task_event_subscription::task_event_id);
            let mut task_ids = task::table
                .filter(task::task_id.eq(&input.task_id))
                .select(task::id)
                .into_boxed();
            if let Some(caller_id) = input.caller_id {
                task_ids = task_ids.filter(task::counterparty_id.eq(caller_id));
            } else {
                task_ids = task_ids.filter(task::counterparty_id.is_null());
            }
            let task_ids = task_ids.load::<Uuid>(conn).await?;
            let mut events = task_event::table
                .inner_join(task::table)
                .filter(task::id.eq_any(task_ids))
                .filter(task_event::id.eq_any(task_event_subscription_event_ids))
                .select((task_event::id, task_event::event_data))
                .into_boxed();
            if let Some(limit) = input.limit {
                events = events.limit(limit.into());
            }
            let events = events.load::<(Uuid, Value)>(conn).await?;

            let mut successful_ids = Vec::new();
            let mut failed_ids = Vec::new();
            let mut outputs = Vec::new();

            for (id, event_data) in events {
                match serde_json::from_value::<A2ATaskEvent>(event_data) {
                    Ok(event_data) => {
                        successful_ids.push(id);
                        outputs.push(DequeueTaskEventServiceOutput {
                            task_id: input.task_id.clone(),
                            id,
                            event_data,
                        });
                    }
                    Err(e) => {
                        failed_ids.push(id);
                        tracing::error!("Failed to deserialize task event {}: {}", id, e);
                    }
                }
            }

            // Update successful events to Delivered
            if !successful_ids.is_empty() {
                diesel::update(task_event_subscription::table)
                    .filter(task_event_subscription::task_event_id.eq_any(successful_ids))
                    .set((
                        task_event_subscription::status.eq(TaskEventSubscriptionStatus::Delivered),
                        task_event_subscription::delivered_at.eq(Utc::now().naive_utc()),
                    ))
                    .execute(conn)
                    .await?;
            }

            // Update failed events to Failed
            if !failed_ids.is_empty() {
                diesel::update(task_event_subscription::table)
                    .filter(task_event_subscription::task_event_id.eq_any(failed_ids))
                    .set((
                        task_event_subscription::status.eq(TaskEventSubscriptionStatus::Failed),
                        task_event_subscription::failed_at.eq(Utc::now().naive_utc()),
                    ))
                    .execute(conn)
                    .await?;
            }

            Ok::<_, BoxedAppError>(outputs)
        })
    })
    .await
}

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use crate::{
//         async_test_utils::{TEST_APP_USER_ID, TestAsyncAppUserDatabaseConnection},
//         models::task_subscription::TaskSubscriptionInput,
//         service::agent::create::{CreateAgentServiceInput, create_agent},
//     };
//     use agent2agent::{
//         TaskStatusUpdateEvent,
//         task::{TaskState as A2ATaskState, TaskStatus},
//     };
//     use database_schema::{
//         enum_definitions::task::{TaskState, TaskType},
//         schema::task,
//     };
//     use serial_test::serial;

//     async fn setup_test_data(conn: &mut AsyncPgConnection) -> (Task, Uuid, Uuid) {
//         // Create a task first

//         let agent_id = create_agent(
//             CreateAgentServiceInput {
//                 name: "test".to_string(),
//                 description: Some("test".to_string()),
//                 created_by: *TEST_APP_USER_ID,
//             },
//             conn,
//         )
//         .await
//         .unwrap()
//         .id;
//         let task_id = "my-task-id".to_string();
//         let task_input = TaskInput {
//             agent_id,
//             task_id: task_id.clone(),
//             counterparty_id: None,
//             task_state: TaskState::Working,
//             task_type: TaskType::Incoming,
//             push_notification: None,
//             a2a_task: None,
//         };
//         let internal_task_id = diesel::insert_into(task::table)
//             .values(task_input)
//             .returning(task::id)
//             .get_result(conn)
//             .await
//             .unwrap();

//         // Create task subscription
//         let task_subscription_input = TaskSubscriptionInput {
//             task_id: internal_task_id,
//             subscriber_id: "test".to_string(),
//         };
//         let task_subscription: TaskSubscription = diesel::insert_into(task_subscription::table)
//             .values(task_subscription_input)
//             .get_result(conn)
//             .await
//             .unwrap();

//         // Create task event
//         let event_data = A2ATaskEvent::StatusUpdate(TaskStatusUpdateEvent {
//             id: task_id.to_string(),
//             status: TaskStatus {
//                 state: A2ATaskState::Working,
//                 message: None,
//                 timestamp: None,
//             },
//             final_event: false,
//             metadata: None,
//         });
//         let task_event_input = TaskEventInput {
//             task_id: internal_task_id,
//             event_data: serde_json::to_value(event_data).unwrap(),
//         };
//         let task_event: TaskEvent = diesel::insert_into(task_event::table)
//             .values(task_event_input)
//             .get_result(conn)
//             .await
//             .unwrap();

//         // Create task event subscription
//         let task_event_subscription_input = TaskEventSubscriptionInput {
//             task_event_id: task_event.id,
//             task_subscription_id: task_subscription.id,
//             status: TaskEventSubscriptionStatus::Pending,
//         };
//         let task_event_subscription: TaskEventSubscription =
//             diesel::insert_into(task_event_subscription::table)
//                 .values(task_event_subscription_input)
//                 .get_result(conn)
//                 .await
//                 .unwrap();

//         (task_id, task_subscription.id, task_event.id)
//     }

//     async fn create_task_event(
//         task_id: Uuid,
//         subscription_id: Uuid,
//         status: TaskEventSubscriptionStatus,
//         conn: &mut AsyncPgConnection,
//     ) -> Uuid {
//         let event_data = A2ATaskEvent::StatusUpdate(TaskStatusUpdateEvent {
//             id: task_id.to_string(),
//             status: TaskStatus {
//                 state: A2ATaskState::Working,
//                 message: None,
//                 timestamp: None,
//             },
//             final_event: false,
//             metadata: None,
//         });
//         let task_event_input = TaskEventInput {
//             task_id,
//             event_data: serde_json::to_value(event_data).unwrap(),
//         };
//         let task_event: TaskEvent = diesel::insert_into(task_event::table)
//             .values(task_event_input)
//             .get_result(conn)
//             .await
//             .unwrap();

//         let task_event_subscription_input = TaskEventSubscriptionInput {
//             task_event_id: task_event.id,
//             task_subscription_id: subscription_id,
//             status,
//         };
//         let _: TaskEventSubscription = diesel::insert_into(task_event_subscription::table)
//             .values(task_event_subscription_input)
//             .get_result(conn)
//             .await
//             .unwrap();

//         task_event.id
//     }

//     #[serial]
//     #[tokio::test]
//     async fn test_dequeue_task_event() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let (task_id, subscriber_id, event_id) = setup_test_data(&mut conn).await;

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             caller_id: None,
//             limit: None,
//             subscriber_id,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert_eq!(result.len(), 1);
//         assert_eq!(result[0].task_id, task_id);
//         assert_eq!(result[0].id, event_id);

//         // Verify the subscription status was updated to Delivered
//         let subscription = task_event_subscription::table
//             .filter(task_event_subscription::task_event_id.eq(event_id))
//             .filter(task_event_subscription::task_subscription_id.eq(subscriber_id))
//             .first::<TaskEventSubscription>(&mut conn)
//             .await
//             .unwrap();
//         assert_eq!(subscription.status, TaskEventSubscriptionStatus::Delivered);
//     }

//     #[tokio::test]
//     #[serial]
//     async fn test_dequeue_task_event_no_events() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let task_id = "my-task-id".to_string();
//         let subscriber_id = Uuid::new_v4();

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             limit: None,
//             subscriber_id,
//             caller_id: None,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert!(result.is_empty());
//     }

//     #[tokio::test]
//     #[serial]
//     async fn test_dequeue_task_event_with_limit() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let (task_id, subscriber_id, _) = setup_test_data(&mut conn).await;

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             caller_id: None,
//             limit: Some(1),
//             subscriber_id,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert_eq!(result.len(), 1);
//     }

//     #[tokio::test]
//     #[serial]
//     async fn test_dequeue_task_event_invalid_json() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let (task_id, subscriber_id, event_id) = setup_test_data(&mut conn).await;

//         // Update event with invalid JSON
//         diesel::update(task_event::table)
//             .filter(task_event::id.eq(event_id))
//             .set(task_event::event_data.eq(serde_json::json!({"invalid": "data"})))
//             .execute(&mut conn)
//             .await
//             .unwrap();

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             limit: None,
//             subscriber_id,
//             caller_id: None,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert!(result.is_empty());

//         // Verify subscription status was updated to Failed
//         let subscription = task_event_subscription::table
//             .filter(task_event_subscription::task_event_id.eq(event_id))
//             .filter(task_event_subscription::task_subscription_id.eq(subscriber_id))
//             .first::<TaskEventSubscription>(&mut conn)
//             .await
//             .unwrap();
//         assert_eq!(subscription.status, TaskEventSubscriptionStatus::Failed);
//     }

//     #[tokio::test]
//     #[serial]
//     async fn test_dequeue_multiple_task_events() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let (task_id, subscriber_id, _) = setup_test_data(&mut conn).await;

//         // Create two more events
//         let _event_id2 = create_task_event(
//             task_id,
//             subscriber_id,
//             TaskEventSubscriptionStatus::Pending,
//             &mut conn,
//         )
//         .await;
//         let _event_id3 = create_task_event(
//             task_id,
//             subscriber_id,
//             TaskEventSubscriptionStatus::Pending,
//             &mut conn,
//         )
//         .await;

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             limit: None,
//             subscriber_id,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert_eq!(result.len(), 3);

//         // Verify all subscriptions were updated to Delivered
//         let subscriptions = task_event_subscription::table
//             .filter(task_event_subscription::task_subscription_id.eq(subscriber_id))
//             .get_results::<TaskEventSubscription>(&mut conn)
//             .await
//             .unwrap();
//         assert_eq!(subscriptions.len(), 3);
//         for subscription in subscriptions {
//             assert_eq!(subscription.status, TaskEventSubscriptionStatus::Delivered);
//         }
//     }

//     #[tokio::test]
//     #[serial]
//     async fn test_dequeue_already_delivered_events() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let (task_id, subscriber_id, _) = setup_test_data(&mut conn).await;

//         // Create one delivered and one failed event
//         let _event_id2 = create_task_event(
//             task_id,
//             subscriber_id,
//             TaskEventSubscriptionStatus::Delivered,
//             &mut conn,
//         )
//         .await;
//         let _event_id3 = create_task_event(
//             task_id,
//             subscriber_id,
//             TaskEventSubscriptionStatus::Failed,
//             &mut conn,
//         )
//         .await;

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             limit: None,
//             subscriber_id,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert_eq!(result.len(), 1); // Only the pending event from setup_test_data should be returned
//     }

//     #[tokio::test]
//     #[serial]
//     async fn test_dequeue_failed_events() {
//         let mut conn = TestAsyncAppUserDatabaseConnection::new().await;
//         let (task_id, subscriber_id, event_id) = setup_test_data(&mut conn).await;

//         // Update event subscription to Failed
//         diesel::update(task_event_subscription::table)
//             .filter(task_event_subscription::task_event_id.eq(event_id))
//             .filter(task_event_subscription::task_subscription_id.eq(subscriber_id))
//             .set(task_event_subscription::status.eq(TaskEventSubscriptionStatus::Failed))
//             .execute(&mut conn)
//             .await
//             .unwrap();

//         let input = DequeueTaskEventServiceInput {
//             task_id,
//             limit: None,
//             subscriber_id,
//         };

//         let result = dequeue_task_event(input, &mut conn).await.unwrap();
//         assert!(result.is_empty()); // Failed events should not be returned
//     }
// }
