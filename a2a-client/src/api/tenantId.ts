function getTenantId(): string {
  const tenantId = JSON.parse(localStorage.getItem("currentTenant") || "{}").id;

  return tenantId;
}

export default getTenantId;
