use diesel::prelude::*;
use diesel_async::{scoped_futures::ScopedFutureExt, AsyncConnection, AsyncPgConnection};
use uuid::Uuid;

use crate::{
    extensions::errors::{AppResult, BoxedAppError},
    models::{
        tenant::{Tenant, TenantInput},
        tenant_user::TenantUserInput,
    },
};
use database_schema::schema::{tenant, tenant_user};

use super::schema::TenantServiceOutput;

pub struct CreateTenantServiceInput {
    pub name: String,
    pub user_id: Uuid,
}

pub async fn create_tenant(
    input: CreateTenantServiceInput,
    conn: &mut AsyncPgConnection,
) -> AppResult<TenantServiceOutput> {
    let tenant: TenantServiceOutput = conn
        .transaction::<_, BoxedAppError, _>(|conn| {
            async move {
                let tenant_insert_stmt = diesel::insert_into(tenant::table)
                    .values(TenantInput { name: input.name })
                    .returning(Tenant::as_select());
                let tenant =
                    diesel_async::RunQueryDsl::get_result(tenant_insert_stmt, conn).await?;

                let tenant_user_input = TenantUserInput {
                    tenant_id: tenant.id,
                    user_id: input.user_id,
                };
                let tenant_user_insert_stmt =
                    diesel::insert_into(tenant_user::table).values(tenant_user_input);
                diesel_async::RunQueryDsl::execute(tenant_user_insert_stmt, conn).await?;
                Ok(tenant.into())
            }
            .scope_boxed()
        })
        .await?;
    Ok(tenant)
}
