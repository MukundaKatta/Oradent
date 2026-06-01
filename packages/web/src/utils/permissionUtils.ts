export type Role = "OWNER" | "DENTIST" | "HYGIENIST" | "ASSISTANT" | "FRONT_DESK";

export type Permission =
  | "patients:read"
  | "patients:write"
  | "patients:delete"
  | "appointments:read"
  | "appointments:write"
  | "appointments:delete"
  | "clinical:read"
  | "clinical:write"
  | "clinical:sign"
  | "charting:read"
  | "charting:write"
  | "treatments:read"
  | "treatments:write"
  | "imaging:read"
  | "imaging:write"
  | "imaging:delete"
  | "billing:read"
  | "billing:write"
  | "claims:manage"
  | "reports:read"
  | "settings:manage"
  | "providers:manage"
  | "inventory:read"
  | "inventory:write"
  | "audit:read";

/**
 * Maps each role to the set of permissions it is granted.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "patients:read",
    "patients:write",
    "patients:delete",
    "appointments:read",
    "appointments:write",
    "appointments:delete",
    "clinical:read",
    "clinical:write",
    "clinical:sign",
    "charting:read",
    "charting:write",
    "treatments:read",
    "treatments:write",
    "imaging:read",
    "imaging:write",
    "imaging:delete",
    "billing:read",
    "billing:write",
    "claims:manage",
    "reports:read",
    "settings:manage",
    "providers:manage",
    "inventory:read",
    "inventory:write",
    "audit:read",
  ],

  DENTIST: [
    "patients:read",
    "patients:write",
    "appointments:read",
    "appointments:write",
    "clinical:read",
    "clinical:write",
    "clinical:sign",
    "charting:read",
    "charting:write",
    "treatments:read",
    "treatments:write",
    "imaging:read",
    "imaging:write",
    "imaging:delete",
    "billing:read",
    "billing:write",
    "claims:manage",
    "reports:read",
    "inventory:read",
  ],

  HYGIENIST: [
    "patients:read",
    "patients:write",
    "appointments:read",
    "clinical:read",
    "clinical:write",
    "charting:read",
    "charting:write",
    "treatments:read",
    "imaging:read",
    "imaging:write",
    "billing:read",
    "inventory:read",
  ],

  ASSISTANT: [
    "patients:read",
    "patients:write",
    "appointments:read",
    "clinical:read",
    "clinical:write",
    "charting:read",
    "treatments:read",
    "imaging:read",
    "imaging:write",
    "inventory:read",
  ],

  FRONT_DESK: [
    "patients:read",
    "patients:write",
    "appointments:read",
    "appointments:write",
    "appointments:delete",
    "billing:read",
    "billing:write",
    "claims:manage",
    "inventory:read",
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Route access control mapping.
 */
const ROUTE_ACCESS: { path: string; roles: Role[] }[] = [
  { path: "/settings", roles: ["OWNER"] },
  { path: "/reports", roles: ["OWNER", "DENTIST"] },
  { path: "/billing", roles: ["OWNER", "DENTIST", "FRONT_DESK"] },
  { path: "/imaging", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT"] },
  { path: "/clinical", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT"] },
  { path: "/inventory", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"] },
  { path: "/patients", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"] },
  { path: "/schedule", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"] },
  { path: "/", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"] },
];

/**
 * Check if a role can access a given route path.
 * Matches the most specific route prefix first.
 */
export function canAccessRoute(role: Role, path: string): boolean {
  const match = ROUTE_ACCESS.find((route) => path.startsWith(route.path));
  if (!match) return true;
  return match.roles.includes(role);
}

/**
 * Get the list of permissions granted to a role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
