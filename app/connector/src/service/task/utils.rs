use agent2agent::TaskState as A2ATaskState;
use database_schema::enum_definitions::task::TaskState;

pub fn a2a_state_to_db_state(state: A2ATaskState) -> TaskState {
    match state {
        A2ATaskState::Submitted => TaskState::Submitted,
        A2ATaskState::Working => TaskState::Working,
        A2ATaskState::InputRequired => TaskState::InputRequired,
        A2ATaskState::Completed => TaskState::Completed,
        A2ATaskState::Failed => TaskState::Failed,
        A2ATaskState::Canceled => TaskState::Canceled,
        A2ATaskState::Unknown => TaskState::Unknown,
    }
}
