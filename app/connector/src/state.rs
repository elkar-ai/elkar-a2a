use crate::extensions::async_database::AsyncPgPool;

#[derive(Clone)]
pub struct AppState {
    pub async_pool: AsyncPgPool,
    pub no_rls_user_pool: AsyncPgPool,
}
