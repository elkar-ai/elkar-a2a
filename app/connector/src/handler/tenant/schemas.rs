use crate::service::tenant::schema::TenantServiceOutput;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TenantOutput {
    pub id: Uuid,
    pub name: String,
}

impl From<TenantServiceOutput> for TenantOutput {
    fn from(tenant: TenantServiceOutput) -> Self {
        Self {
            id: tenant.id,
            name: tenant.name,
        }
    }
}

#[derive(Deserialize, Debug, ToSchema)]
pub struct CreateTenantInput {
    pub name: String,
}
