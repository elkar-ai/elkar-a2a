use crate::extensions::errors::AppResult;
use crate::models::application_user::ApplicationUser;
use crate::models::tenant_user::TenantUser;
use database_schema::enum_definitions::application_user::ApplicationUserStatus;

use database_schema::schema::{application_user, tenant_user};
use diesel::prelude::*;
use diesel_async::AsyncPgConnection;
use uuid::Uuid;

pub struct ApplicationUserServiceOutput {
    pub id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: String,
    pub status: ApplicationUserStatus,
    pub needs_to_create_tenant: bool,
    pub tenant_context: Option<ApplicationUserTenantContext>,
}

pub struct ApplicationUserTenantContext {
    pub is_on_tenant: bool,
}

impl From<ApplicationUser> for ApplicationUserServiceOutput {
    fn from(user: ApplicationUser) -> Self {
        Self {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            status: user.status,
            needs_to_create_tenant: false,
            tenant_context: None,
        }
    }
}

pub async fn check_registered_user(
    supabase_id: Uuid,
    tenant_id: Option<Uuid>,
    conn: &mut AsyncPgConnection,
) -> AppResult<Option<ApplicationUserServiceOutput>> {
    let filters = application_user::id.eq(&supabase_id);

    let user_stmt = application_user::table
        .filter(filters)
        .select(ApplicationUser::as_select());

    let mut users: Vec<ApplicationUser> =
        diesel_async::RunQueryDsl::get_results(user_stmt, conn).await?;

    let Some(user) = users.pop() else {
        return Ok(None);
    };

    let mut app_user = ApplicationUserServiceOutput::from(user);

    let tenant_user_stmt = tenant_user::table
        .filter(tenant_user::user_id.eq(app_user.id))
        .select(TenantUser::as_select());
    let tenant_users: Vec<TenantUser> =
        diesel_async::RunQueryDsl::get_results(tenant_user_stmt, conn).await?;

    app_user.needs_to_create_tenant = tenant_users.is_empty();
    if let Some(tenant_id) = tenant_id {
        let is_user_on_tenant = tenant_users.into_iter().any(|t| t.tenant_id == tenant_id);
        app_user.tenant_context = Some(ApplicationUserTenantContext {
            is_on_tenant: is_user_on_tenant,
        });
    }

    Ok(Some(app_user))
}
