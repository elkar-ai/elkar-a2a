use crate::extensions::errors::AppResult;
use crate::models::application_user::ApplicationUser;
use database_schema::enum_definitions::application_user::ApplicationUserStatus;

use database_schema::schema::application_user;
use diesel::prelude::*;
use diesel_async::AsyncPgConnection;
use uuid::Uuid;

pub struct ApplicationUserServiceOutput {
    pub id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: String,
    pub status: ApplicationUserStatus,
}

impl From<ApplicationUser> for ApplicationUserServiceOutput {
    fn from(user: ApplicationUser) -> Self {
        Self {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            status: user.status,
        }
    }
}

pub async fn check_registered_user(
    supabase_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> AppResult<Option<ApplicationUserServiceOutput>> {
    let filters = application_user::id.eq(&supabase_id);

    let user_stmt = application_user::table
        .filter(filters)
        .select(ApplicationUser::as_select());

    let mut users: Vec<ApplicationUser> =
        diesel_async::RunQueryDsl::get_results(user_stmt, conn).await?;

    let user = users.pop();

    Ok(user.map(ApplicationUserServiceOutput::from))
}
