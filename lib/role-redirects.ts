import { UserRole } from "@prisma/client";

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  ADMIN: "/admin",
  EMPLOYEE: "/manager",
  MANAGER: "/manager",
  MAGASINIER: "/magasinier",
  CHEFUSINE: "/chefusine",
  JURIDIQUE: "/juridique",
  CHEFEQUIPE: "/chefequipe",
  CHEFQUALITE: "/chefqualite",
  COMMERCIAL: "/commercial",
  RESPONSABLE_COMMERCIAL: "/responsablecommercial",
  COMMUNICATION: "/communication",
  RH: "/rh",
  SAV: "/sav",
  LOGISTIQUE: "/logistique",
  FINANCE: "/finance",
  DIRECTEUR_GENERAL: "/directeurgeneral",
  CLIENTELLE: "/clientele",
  COMPTABLE: "/comptable",
  CONCESSIONAIRE: "/concessionnaire",
  SUPERVISEUR: "/superviseur",
  INFOGRAPHIE: "/infographie",
  COMMUNITY_MANAGER: "/communityManager",
  ASSISTANTE: "/assistante",
};

export function getRedirectForRole(role: string | undefined): string | null {
  if (!role) return null;
  return ROLE_REDIRECTS[role as UserRole] ?? null;
}
