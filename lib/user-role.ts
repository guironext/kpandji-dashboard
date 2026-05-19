import { UserRole } from "@prisma/client";

/** Roles defined in schema — kept in sync for stale Prisma clients before `prisma generate`. */
const SCHEMA_ROLES = [
  "ADMIN",
  "MANAGER",
  "COMMERCIAL",
  "CHEFUSINE",
  "CHEFEQUIPE",
  "MAGASINIER",
  "RH",
  "CHEFQUALITE",
  "EMPLOYEE",
  "SAV",
  "LOGISTIQUE",
  "FINANCE",
  "DIRECTEUR_GENERAL",
  "CLIENTELLE",
  "COMPTABLE",
  "CONCESSIONAIRE",
  "SUPERVISEUR",
  "COMMUNICATION",
  "RESPONSABLE_COMMERCIAL",
  "ASSISTANTE",
  "INFOGRAPHIE",
  "COMMUNITY_MANAGER",
] as const satisfies readonly UserRole[];

type SchemaRole = (typeof SCHEMA_ROLES)[number];

/** Legacy typo used in Clerk metadata and onboarding UI */
const ROLE_ALIASES: Record<string, SchemaRole> = {
  INFOGRAPHIE: "INFOGRAPHIE",
};

export function normalizeUserRole(role: unknown): UserRole {
  if (typeof role !== "string" || !role.trim()) {
    return UserRole.EMPLOYEE;
  }

  const normalized = role.trim().toUpperCase();

  if ((SCHEMA_ROLES as readonly string[]).includes(normalized)) {
    return normalized as UserRole;
  }

  const alias = ROLE_ALIASES[normalized];
  if (alias) {
    return alias as UserRole;
  }

  console.warn(`Unknown user role "${role}", defaulting to EMPLOYEE`);
  return UserRole.EMPLOYEE;
}
