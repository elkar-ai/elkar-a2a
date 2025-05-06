use uuid::Uuid;

use crate::models::tenant::Tenant;
pub struct TenantServiceOutput {
    pub id: Uuid,
    pub name: String,
}

impl From<Tenant> for TenantServiceOutput {
    fn from(tenant: Tenant) -> Self {
        Self {
            id: tenant.id,
            name: tenant.name,
        }
    }
}
