use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        extractors::user_context::UserContext,
        pagination::output::UnpaginatedOutput,
    },
    service::tenant::{
        create::{create_tenant, CreateTenantServiceInput as ServiceCreateTenantInput},
        retrieve::{retrieve_tenant, retrieve_tenants, RetrieveTenantInput},
    },
};

use axum::{extract::Path, Json};
use http::StatusCode;

use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;

use super::schemas::{CreateTenantInput, TenantOutput};

pub fn tenant_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(ep_create_tenant))
        .routes(routes!(ep_retrieve_tenants))
        .routes(routes!(ep_retrieve_tenant))
}

#[utoipa::path(
    post,
    path = "/tenants",
    responses(
        (status = 200, description = "Tenant created successfully", body = TenantOutput),
    ),
)]
pub async fn ep_create_tenant(
    user_ctx: UserContext,
    Json(create_tenant_input): Json<CreateTenantInput>,
) -> AppResult<Json<TenantOutput>> {
    // Ensure the user is authenticated
    let user_id = user_ctx.user_id.ok_or(
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("User ID is required".to_string()),
    )?;
    // Map handler input to service input
    let service_input = ServiceCreateTenantInput {
        name: create_tenant_input.name,
        user_id,
    };
    // Acquire a typed database connection
    let mut conn = user_ctx.async_pool.get().await?;
    // Call the service
    let tenant_model = create_tenant(service_input, &mut conn).await?;
    // Convert service model to handler output
    let tenant_output = TenantOutput::from(tenant_model);
    Ok(Json(tenant_output))
}

#[utoipa::path(
    get,
    path = "/tenants",
    responses(
        (status = 200, description = "Tenants retrieved successfully", body = UnpaginatedOutput<TenantOutput>),
    ),
)]
pub async fn ep_retrieve_tenants(
    user_ctx: UserContext,
) -> AppResult<Json<UnpaginatedOutput<TenantOutput>>> {
    // Ensure the user is authenticated
    let user_id = user_ctx.user_id.ok_or(
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("User ID is required".to_string()),
    )?;
    let retrieve_input = RetrieveTenantInput { user_id };
    // Acquire a typed database connection
    let mut conn = user_ctx.async_pool.get().await?;
    let tenants = retrieve_tenants(retrieve_input, &mut conn).await?;
    let tenants_output = tenants
        .into_iter()
        .map(TenantOutput::from)
        .collect::<Vec<TenantOutput>>();
    Ok(Json(UnpaginatedOutput {
        records: tenants_output,
    }))
}

#[utoipa::path(
    get,
    path = "/tenants/{id}",
    responses(
        (status = 200, description = "Tenant retrieved successfully", body = TenantOutput),
    ),
)]
pub async fn ep_retrieve_tenant(
    user_ctx: UserContext,
    Path(id): Path<Uuid>,
) -> AppResult<Json<TenantOutput>> {
    // Acquire a connection without RLS to perform explicit tenant check
    let mut pg_conn = user_ctx
        .async_pool
        .get()
        .await
        .map_err(|_| anyhow::anyhow!("Failed to get async connection"))?;
    // Ensure the user is authenticated
    let user_id = user_ctx
        .user_id
        .ok_or(anyhow::anyhow!("User ID is required"))?;
    // Call the service to retrieve a single tenant
    let tenant_service_output = retrieve_tenant(id, user_id, &mut pg_conn).await?;
    let tenant_output = TenantOutput::from(tenant_service_output);
    Ok(Json(tenant_output))
}
