use database_schema::enum_definitions::application_user::ApplicationUserStatus;

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::service::user::application_user::service::ApplicationUserServiceOutput;

#[derive(Deserialize, Serialize, Debug, ToSchema)]
pub struct ApplicationUserOutput {
    pub id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: String,
    pub status: ApplicationUserStatus,
}

impl From<ApplicationUserServiceOutput> for ApplicationUserOutput {
    fn from(user: ApplicationUserServiceOutput) -> Self {
        ApplicationUserOutput {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            status: user.status,
        }
    }
}

#[derive(Deserialize, Serialize, Debug, ToSchema)]
pub struct IsRegisteredOutput {
    pub is_registered: bool,
    pub is_on_tenant: Option<bool>,
    pub need_to_create_tenant: Option<bool>,
}

#[derive(Deserialize, Serialize, Debug, ToSchema)]
pub struct RegisterUserInput {
    pub first_name: String,
    pub last_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TenantUserOutput {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
}

#[derive(Deserialize, Debug, ToSchema)]
pub struct InviteUserInput {
    pub email: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RetrieveTenantUsersOutput {
    pub records: Vec<TenantUserOutput>,
}
