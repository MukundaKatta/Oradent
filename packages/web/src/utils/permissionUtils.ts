import type { ProviderRole } from "@/types";

/**
 * Actions that can be performed in the system.
 */
export type PermissionAction =
  | "view_dashboard"
  | "view_schedule"
  | "manage_schedule"
  | "view_patients"
  | "create_patient"
  | "edit_patient"
  | "delete_patient"
  | "view_clinical"
  | "create_clinical_note"
  | "edit_clinical_note"
  | "sign_clinical_note"
  | "view_dental_chart"
  | "edit_dental_chart"
  | "view_treatment_plans"
  | "create_treatment_plan"
  | "edit_treatment_plan"
  | "view_imaging"
  | "upload_image"
  | "delete_image"
  | "run_ai_analysis"
  | "view_billing"
  | "create_invoice"
  | "edit_invoice"
  | "process_payment"
  | "manage_claims"
  | "view_reports"
  | "manage_settings"
  | "manage_providers"
  | "manage_chairs"
  | "manage_fee_schedule"
  | "view_audit_log";

/**
 * Maps each role to the set of actions it is allowed to perform.
 */
export const ROLE_PERMISSIONS: Record<ProviderRole, Set<PermissionAction>> = {
  OWNER: new Set<PermissionAction>([
    "view_dashboard",
    "view_schedule",
    "manage_schedule",
    "view_patients",
    "create_patient",
    "edit_patient",
    "delete_patient",
    "view_clinical",
    "create_clinical_note",
    "edit_clinical_note",
    "sign_clinical_note",
    "view_dental_chart",
    "edit_dental_chart",
    "view_treatment_plans",
    "create_treatment_plan",
    "edit_treatment_plan",
    "view_imaging",
    "upload_image",
    "delete_image",
    "run_ai_analysis",
    "view_billing",
    "create_invoice",
    "edit_invoice",
    "process_payment",
    "manage_claims",
    "view_reports",
    "manage_settings",
    "manage_providers",
    "manage_chairs",
    "manage_fee_schedule",
    "view_audit_log",
  ]),

  DENTIST: new Set<PermissionAction>([
    "view_dashboard",
    "view_schedule",
    "manage_schedule",
    "view_patients",
    "create_patient",
    "edit_patient",
    "view_clinical",
    "create_clinical_note",
    "edit_clinical_note",
    "sign_clinical_note",
    "view_dental_chart",
    "edit_dental_chart",
    "view_treatment_plans",
    "create_treatment_plan",
    "edit_treatment_plan",
    "view_imaging",
    "upload_image",
    "delete_image",
    "run_ai_analysis",
    "view_billing",
    "create_invoice",
    "edit_invoice",
    "process_payment",
    "manage_claims",
    "view_reports",
  ]),

  HYGIENIST: new Set<PermissionAction>([
    "view_dashboard",
    "view_schedule",
    "view_patients",
    "edit_patient",
    "view_clinical",
    "create_clinical_note",
    "edit_clinical_note",
    "view_dental_chart",
    "edit_dental_chart",
    "view_treatment_plans",
    "view_imaging",
    "upload_image",
    "view_billing",
  ]),

  ASSISTANT: new Set<PermissionAction>([
    "view_dashboard",
    "view_schedule",
    "view_patients",
    "edit_patient",
    "view_clinical",
    "create_clinical_note",
    "view_dental_chart",
    "view_treatment_plans",
    "view_imaging",
    "upload_image",
  ]),

  FRONT_DESK: new Set<PermissionAction>([
    "view_dashboard",
    "view_schedule",
    "manage_schedule",
    "view_patients",
    "create_patient",
    "edit_patient",
    "view_billing",
    "create_invoice",
    "edit_invoice",
    "process_payment",
    "manage_claims",
  ]),
};

/**
 * Check if a role has permission to perform a given action.
 */
export function hasPermission(
  role: ProviderRole,
  action: PermissionAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

/**
 * Route access control mapping. Defines which roles can access each route prefix.
 */
const ROUTE_ACCESS: { path: string; roles: ProviderRole[] }[] = [
  { path: "/settings", roles: ["OWNER"] },
  { path: "/reports", roles: ["OWNER", "DENTIST"] },
  { path: "/billing", roles: ["OWNER", "DENTIST", "FRONT_DESK"] },
  { path: "/imaging", roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT"] },
  {
    path: "/clinical",
    roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT"],
  },
  {
    path: "/patients",
    roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"],
  },
  {
    path: "/schedule",
    roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"],
  },
  {
    path: "/",
    roles: ["OWNER", "DENTIST", "HYGIENIST", "ASSISTANT", "FRONT_DESK"],
  },
];

/**
 * Check if a role can access a given route path.
 * Matches the most specific route prefix first.
 */
export function canAccessRoute(role: ProviderRole, path: string): boolean {
  // Find the most specific matching route (longest prefix match)
  const match = ROUTE_ACCESS.find((route) => path.startsWith(route.path));
  if (!match) return true; // Routes not in the map are accessible by default
  return match.roles.includes(role);
}
