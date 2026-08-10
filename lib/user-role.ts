import { SCHEMA_ROLES, UserRole } from "./user-role-constants";
import type { UserRole as UserRoleType } from "./user-role-constants";

export function normalizeUserRole(role: unknown): UserRoleType {
  if (typeof role !== "string" || !role.trim()) {
    return UserRole.EMPLOYEE;
  }

  const normalized = role.trim().toUpperCase();

  if ((SCHEMA_ROLES as readonly string[]).includes(normalized)) {
    return normalized as UserRoleType;
  }

  console.warn(`Unknown user role "${role}", defaulting to EMPLOYEE`);
  return UserRole.EMPLOYEE;
}
