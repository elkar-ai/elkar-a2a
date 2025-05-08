use super::schemas::*;
use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        extractors::user_context::UserContext,
        pagination::output::UnpaginatedOutput,
        token::{SupabaseToken, extract_token},
    },
    service::user::{
        application_user::service::check_registered_user,
        service::{
            InviteUserServiceInput, UserInfo, UserQuery, get_all_users, get_user_by_id_async,
            invite_user, register_user,
        },
    },
};
use axum::Json;
use http::{HeaderMap, StatusCode};
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn user_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(ep_get_user_me))
        .routes(routes!(ep_invite_user))
        .routes(routes!(ep_register_user))
        .routes(routes!(ep_retrieve_tenant_users))
        .routes(routes!(ep_is_registered))
}

#[utoipa::path(
    get,
    path = "/users/me",
    responses(
        (status = 200, description = "User found successfully", body = ApplicationUserOutput),
        (status = NOT_FOUND, description = "User was not found")
    ),
)]
pub async fn ep_get_user_me(user_ctx: UserContext) -> AppResult<Json<ApplicationUserOutput>> {
    let user_id = match user_ctx.user_id {
        Some(user_id) => user_id,
        None => {
            return Err(ServiceError::new()
                .status_code(StatusCode::UNAUTHORIZED)
                .error_type("Unauthorized User".to_string())
                .into());
        }
    };
    let mut conn = user_ctx.async_pool.get().await?;
    let output = get_user_by_id_async(user_id, &mut conn).await?;

    output
        .map(|user| Json(ApplicationUserOutput::from(user)))
        .ok_or(
            ServiceError::new()
                .status_code(StatusCode::NOT_FOUND)
                .error_type("User not found".to_string())
                .into(),
        )
}

#[utoipa::path(
    post,
    path = "/users/invite",
    responses(
        (status = 200, description = "User invited successfully", body = ()),
        (status = 400, description = "User already exists"),
        (status = 401, description = "Unauthorized User"),
    )
)]
pub async fn ep_invite_user(
    user_ctx: UserContext,
    Json(user_login_input): Json<InviteUserInput>,
) -> AppResult<Json<()>> {
    let mut conn = user_ctx.async_pool.get().await?;
    let invite_user_input = InviteUserServiceInput {
        email: user_login_input.email,
        tenant_id: user_ctx.tenant_id.unwrap(),
    };
    invite_user(invite_user_input, &mut conn).await?;
    Ok(Json(()))
}

#[utoipa::path(
    post,
    path = "/users/register",
    responses(
        (status = 200, description = "User registered successfully", body = ()),
    )
)]

pub async fn ep_register_user(user_ctx: UserContext, headers: HeaderMap) -> AppResult<Json<()>> {
    let mut conn = user_ctx.async_pool.get().await?;
    let token = extract_token(&headers).map_err(|_| {
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("Unauthorized User".to_string())
    })?;
    let supabase_token = SupabaseToken::new(&token);
    let user_info = supabase_token.decode().map_err(|_| {
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("Unauthorized User".to_string())
    })?;

    let user_info = UserInfo {
        supabase_user_id: user_info.sub,
        email: user_info.email.unwrap(),
        first_name: None,
        last_name: None,
    };

    register_user(&user_info, &mut conn).await?;

    Ok(Json(()))
}

#[utoipa::path(
    get,
    path = "/users",
    responses(
        (status = 200, description = "Retrieve all users in the tenant", body = UnpaginatedOutput<ApplicationUserOutput>),
    ),

)]
pub async fn ep_retrieve_tenant_users(
    user_ctx: UserContext,
) -> AppResult<Json<UnpaginatedOutput<ApplicationUserOutput>>> {
    let Some(tenant_id) = user_ctx.tenant_id else {
        return Err(ServiceError::new()
            .status_code(StatusCode::BAD_REQUEST)
            .error_type("Tenant ID is required".to_string())
            .into());
    };
    let query = UserQuery {
        tenant_id,
        ..Default::default()
    };
    let mut pg_conn = user_ctx.async_pool.get().await?;

    let user_output = get_all_users(query, &mut pg_conn).await?;

    Ok(Json(UnpaginatedOutput {
        records: user_output
            .into_iter()
            .map(ApplicationUserOutput::from)
            .collect(),
    }))
}

#[utoipa::path(
    get,
    path = "/users/is-registered",
    responses(
        (status = 200, description = "User is registered", body = IsRegisteredOutput),
    ),
)]
pub async fn ep_is_registered(
    user_ctx: UserContext,
    header: HeaderMap,
) -> AppResult<Json<IsRegisteredOutput>> {
    let token = extract_token(&header).map_err(|_| {
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("Failed to check user registration".to_string())
            .details("Failed to extract token".to_string())
    })?;
    let decoded_token = SupabaseToken::new(token.as_str()).decode().map_err(|_| {
        ServiceError::new()
            .status_code(StatusCode::UNAUTHORIZED)
            .error_type("Failed to check user registration".to_string())
            .details("Failed to decode token".to_string())
    })?;
    let mut pg_conn = user_ctx
        .async_pool
        .get()
        .await
        .map_err(|_| anyhow::anyhow!("Failed to get user pool"))?;
    let tenant_id = user_ctx.tenant_id;
    let is_registered = check_registered_user(decoded_token.sub, tenant_id, &mut pg_conn)
        .await
        .map_err(|_| {
            ServiceError::new()
                .status_code(StatusCode::INTERNAL_SERVER_ERROR)
                .error_type("Internal server Error".to_string())
                .details("Failed to check user registration".to_string())
        })?;
    Ok(Json(IsRegisteredOutput {
        is_registered: is_registered.is_some(),
        need_to_create_tenant: is_registered.as_ref().map(|u| u.needs_to_create_tenant),
        is_on_tenant: is_registered
            .map(|u| u.tenant_context)
            .and_then(|c| c.map(|c| c.is_on_tenant)),
    }))
}
