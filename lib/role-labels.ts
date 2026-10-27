import { UserRole } from "@prisma/client";

/** Libellés français des rôles (partagés client / serveur). */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  COMMERCIAL: "Commercial",
  CHEFUSINE: "Chef Usine",
  CHEFEQUIPE: "Chef Équipe",
  MAGASINIER: "Magasinier",
  RH: "RH",
  JURIDIQUE: "Juridique",
  CHEFQUALITE: "Chef Qualité",
  EMPLOYEE: "Employé",
  SAV: "SAV",
  LOGISTIQUE: "Logistique",
  FINANCE: "Finance",
  DIRECTEUR_GENERAL: "Directeur Général",
  CLIENTELLE: "Clientèle",
  COMPTABLE: "Comptable",
  CONCESSIONAIRE: "Concessionnaire",
  SUPERVISEUR: "Superviseur",
  COMMUNICATION: "Communication",
  RESPONSABLE_COMMERCIAL: "Responsable Commercial",
  ASSISTANTE: "Assistante",
  INFOGRAPHIE: "Infographie",
  COMMUNITY_MANAGER: "Community Manager",
  MARKETING: "Marketing",
  DEVELOPPEUR: "Développeur",
  DESIGNER: "Designer",
};

/** Rôles attribuables par invitation ou à l'inscription : tout sauf ADMIN. */
export const ASSIGNABLE_ROLES: UserRole[] = (Object.values(UserRole) as UserRole[]).filter(
  (role) => role !== UserRole.ADMIN,
);

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role as UserRole] ?? role;
}

export const INVITATION_VALIDITY_DAYS = 7;
