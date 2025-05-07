use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        query_common::{QueryOrder, SortBy},
    },
    models::{
        application_user::{ApplicationUser, ApplicationUserInput},
        tenant_user::{TenantUser, TenantUserInput},
    },
};

use database_schema::{
    enum_definitions::application_user::ApplicationUserStatus,
    schema::{application_user, tenant_user},
};

use diesel::{ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::AsyncPgConnection;
use http::StatusCode;
use supabase::{SupabaseClient, SupabaseInviteUser};
use uuid::Uuid;

use super::application_user::service::ApplicationUserServiceOutput;

pub struct SlackUserInfo {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub slack_user_id: String,
}

pub struct UserInfo {
    pub supabase_user_id: Uuid,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

pub async fn check_user_on_tenant_async(
    user_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> AppResult<Option<TenantUser>> {
    let filters = tenant_user::user_id.eq(&user_id);
    let query = tenant_user::table
        .filter(filters)
        .select(TenantUser::as_select());

    let output = diesel_async::RunQueryDsl::get_results(query, conn).await?;
    let output = output.first().cloned();
    Ok(output)
}

pub async fn get_user_by_id_async(
    user_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> AppResult<Option<ApplicationUserServiceOutput>> {
    let filters = application_user::id.eq(&user_id);
    let query = application_user::table
        .filter(filters)
        .select(ApplicationUser::as_select());
    let mut output = diesel_async::RunQueryDsl::get_results(query, conn).await?;
    let output = output.pop().map(|user| user.into());
    Ok(output)
}

#[derive(Debug, Clone, Default)]
pub enum UserOrderBy {
    #[default]
    LastName,
}

#[derive(Debug, Clone, Default)]
pub struct UserQuery {
    pub tenant_id: Uuid,
    pub id_in: Option<Vec<Uuid>>,
    pub order_by: SortBy<UserOrderBy>,
}

pub async fn get_all_users(
    query: UserQuery,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<ApplicationUserServiceOutput>> {
    let mut stmt = application_user::table
        .inner_join(tenant_user::table)
        .filter(tenant_user::tenant_id.eq(&query.tenant_id))
        .select(ApplicationUser::as_select())
        .into_boxed();
    if let Some(id_in) = query.id_in {
        stmt = stmt.filter(application_user::id.eq_any(id_in));
    }
    match query.order_by.order() {
        QueryOrder::Asc => {
            stmt = stmt.order_by(application_user::last_name.asc());
        }
        QueryOrder::Desc => {
            stmt = stmt.order_by(application_user::last_name.desc());
        }
    }
    let users = diesel_async::RunQueryDsl::get_results(stmt, conn).await?;
    Ok(users.into_iter().map(|user| user.into()).collect())
}

pub struct InviteUserServiceInput {
    pub email: String,
    pub tenant_id: Uuid,
}

pub async fn invite_user(
    input: InviteUserServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<()> {
    let application_user_stmt = application_user::table
        .filter(application_user::email.eq(&input.email))
        .select(ApplicationUser::as_select());

    let mut application_user: Vec<ApplicationUser> =
        diesel_async::RunQueryDsl::get_results(application_user_stmt, conn).await?;
    let app_user = match application_user.pop() {
        Some(user) => {
            let is_user_on_tenant = check_user_on_tenant_async(user.id, conn).await?;
            if is_user_on_tenant.is_some() {
                return Err(ServiceError::new()
                    .status_code(StatusCode::BAD_REQUEST)
                    .details("User already exists".to_string())
                    .into());
            }
            user
        }
        None => {
            let supabase_url = std::env::var("SUPABASE_URL").unwrap();
            let supabase_key = std::env::var("SUPABASE_ADMIN_KEY").unwrap();
            let supabase_admin = SupabaseClient::new(supabase_url, supabase_key);
            let supabase_user = supabase_admin
                .invite_user(&SupabaseInviteUser {
                    email: input.email.clone(),
                })
                .await?;
            let insert_stmt = diesel::insert_into(application_user::table)
                .values(ApplicationUserInput {
                    id: supabase_user.id,
                    email: supabase_user.email.clone(),
                    first_name: None,
                    last_name: None,
                    status: ApplicationUserStatus::Invited,
                })
                .returning(ApplicationUser::as_select());
            let app_user = diesel_async::RunQueryDsl::get_result(insert_stmt, conn).await?;
            app_user
        }
    };
    let tenant_user_insert_stmt = diesel::insert_into(tenant_user::table)
        .values(TenantUserInput {
            user_id: app_user.id,
            tenant_id: input.tenant_id,
        })
        .returning(TenantUser::as_select());
    diesel_async::RunQueryDsl::get_result(tenant_user_insert_stmt, conn).await?;

    Ok(())
}

pub async fn register_user(
    user_info: &UserInfo,
    conn: &mut AsyncPgConnection,
) -> AppResult<ApplicationUser> {
    let application_user_insert_stmt = diesel::insert_into(application_user::table)
        .values(ApplicationUserInput {
            id: user_info.supabase_user_id,
            email: user_info.email.clone(),
            first_name: user_info.first_name.clone(),
            last_name: user_info.last_name.clone(),
            status: ApplicationUserStatus::Active,
        })
        .on_conflict(application_user::id)
        .do_update()
        .set((
            application_user::first_name.eq(&user_info.first_name),
            application_user::last_name.eq(&user_info.last_name),
        ))
        .returning(ApplicationUser::as_select());
    let application_user =
        diesel_async::RunQueryDsl::get_result(application_user_insert_stmt, conn).await?;

    Ok(application_user)
}
