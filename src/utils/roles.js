export const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  TENANT_ADMIN: "TenantAdmin",
  STAFF: "Staff",
  BUYER: "Buyer",
};

export const isSuperAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;
export const isTenantAdmin = (user) => user?.role === ROLES.TENANT_ADMIN;
export const isStaff = (user) => user?.role === ROLES.STAFF;
export const isBuyer = (user) => user?.role === ROLES.BUYER;