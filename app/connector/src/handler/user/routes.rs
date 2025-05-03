use super::schemas::*;
use crate::{
    extensions::{
        errors::{AppResult, ServiceError},
        extractors::user_context::UserContext,
        pagination::output::UnpaginatedOutput,
        token::{extract_token, SupabaseToken},
    },
    service::user::service::{
        get_all_users, get_user_by_id_async, invite_user, register_user, InviteUserServiceInput,
        UserInfo, UserQuery,
    },
};
use axum::{
    routing::{get, post, Router},
    Json,
};
use http::{HeaderMap, StatusCode};

pub fn user_router() -> Router {
    Router::new()
        .route("/user/me", get(ep_get_user_me))
        .route("/user/invite", post(ep_invite_user))
        .route("/user/register", post(ep_register_user))
}

pub async fn ep_get_user_me(user_ctx: UserContext) -> AppResult<Json<ApplicationUserOutput>> {
    let user_id = match user_ctx.user_id {
        Some(user_id) => user_id,
        None => {
            return Err(ServiceError::new()
                .status_code(StatusCode::UNAUTHORIZED)
                .error_type("Unauthorized User".to_string())
                .into())
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

pub async fn ep_retrieve_tenant_users(
    user_ctx: UserContext,
) -> AppResult<Json<UnpaginatedOutput<ApplicationUserOutput>>> {
    let query = UserQuery::default();
    let mut pg_conn = user_ctx.async_pool.get().await?;

    let user_output = get_all_users(query, &mut pg_conn).await?;

    Ok(Json(UnpaginatedOutput {
        records: user_output
            .into_iter()
            .map(ApplicationUserOutput::from)
            .collect(),
    }))
}
