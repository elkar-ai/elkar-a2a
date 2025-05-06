use diesel::prelude::*;
use diesel_async::AsyncPgConnection;
use uuid::Uuid;

use crate::{extensions::errors::AppResult, models::tenant::Tenant};
use database_schema::schema::{tenant, tenant_user};

use super::schema::TenantServiceOutput;

pub struct RetrieveTenantInput {
    pub user_id: Uuid,
}

pub async fn retrieve_tenants(
    input: RetrieveTenantInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<Vec<TenantServiceOutput>> {
    let tenant = tenant::table
        .inner_join(tenant_user::table)
        .filter(tenant_user::user_id.eq(&input.user_id))
        .select(Tenant::as_select());
    let tenants: Vec<Tenant> = diesel_async::RunQueryDsl::get_results(tenant, conn).await?;
    Ok(tenants.into_iter().map(TenantServiceOutput::from).collect())
}

pub async fn retrieve_tenant(
    id: Uuid,
    user_id: Uuid,
    conn: &mut AsyncPgConnection,
) -> AppResult<TenantServiceOutput> {
    let tenant = tenant::table
        .inner_join(tenant_user::table)
        .filter(tenant_user::user_id.eq(&user_id))
        .filter(tenant::id.eq(&id))
        .select(Tenant::as_select());
    let tenant: Tenant = diesel_async::RunQueryDsl::first(tenant, conn).await?;
    Ok(tenant.into())
}
