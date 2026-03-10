"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

export type RapportRendezVousItem = {
  id: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client: string | null;
  profession_societe: string | null;
  date_rendez_vous: string;
  type_client: string;
  status_client: string;
  type: "client" | "client_entreprise";
  commercialName: string;
  secteur_activite: string;
};

export type RapportRendezVousByPeriodData = {
  periodId: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  prospects: RapportRendezVousItem[];
  clients: RapportRendezVousItem[];
};

export type RapportRendezVousAnalyticsData = {
  periods: RapportRendezVousByPeriodData[];
};

export type RapportRendezVousReportItem = {
  id: string;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client: string | null;
  type_client: string;
  lieu_rendez_vous: string;
  lieu_autre: string | null;
  profession_societe: string | null;
  degre_interet: string | null;
  motivations_achat: string | null;
  points_positifs: string | null;
  objections_freins: string | null;
  commentaire_global: string | null;
  decision_attendue: string | null;
  Com_Pres: boolean;
  Com_Drive: boolean;
  Com_Achat: boolean;
  Com_Livre: boolean;
  Com_APV: boolean;
  Com_Office: boolean;
  Com_Close: boolean;
  devis_offre_remise: boolean;
  createdAt: Date;
  updatedAt: Date;
  voiture?: {
    id: string;
    couleur: string;
    motorisation: string;
    transmission: string;
    voitureModel?: { model: string };
  } | null;
};

export type RapportRendezVousByCommercial = {
  conseiller_commercial: string;
  totalReports: number;
  reports: RapportRendezVousReportItem[];
};

export type RapportRendezVousByPeriodAndCommercialData = {
  periodId: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  commercials: RapportRendezVousByCommercial[];
};

export type RapportRendezVousByPeriodAndCommercialResult = {
  periods: RapportRendezVousByPeriodAndCommercialData[];
};

/**
 * Fetches all RapportRendezVous grouped by ObjectifPeriod and by commercial.
 * For RESPONSABLE_COMMERCIAL / ADMIN only.
 */
export async function getRapportRendezVousByObjectifPeriodAndCommercial(clerkUserId?: string): Promise<{
  success: boolean;
  data?: RapportRendezVousByPeriodAndCommercialResult;
  error?: string;
}> {
  try {
    let clerkId = clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }
    const user = userResult.data;

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const periods = await prisma.objectifPeriod.findMany({
      orderBy: { objectif_start: "desc" },
      select: { id: true, objectif_start: true, objectif_end: true },
    });

    const result: RapportRendezVousByPeriodAndCommercialData[] = [];

    for (const p of periods) {
      const rapports = await prisma.rapportRendezVous.findMany({
        where: {
          RendezVous: {
            date: {
              gte: p.objectif_start,
              lte: p.objectif_end,
            },
          },
        },
        include: {
          RendezVous: { select: { date: true } },
          Voiture: {
            select: {
              id: true,
              couleur: true,
              motorisation: true,
              transmission: true,
              VoitureModel: { select: { model: true } },
            },
          },
        },
        orderBy: { date_rendez_vous: "desc" },
      });

      const byCommercial = new Map<string, RapportRendezVousReportItem[]>();

      for (const r of rapports) {
        const commercialName = r.conseiller_commercial?.trim() || "Non assigné";
        const item: RapportRendezVousReportItem = {
          id: r.id,
          date_rendez_vous: r.RendezVous?.date ?? r.date_rendez_vous,
          heure_rendez_vous: r.heure_rendez_vous,
          duree_rendez_vous: r.duree_rendez_vous,
          nom_prenom_client: r.nom_prenom_client,
          telephone_client: r.telephone_client,
          email_client: r.email_client,
          type_client: r.type_client,
          lieu_rendez_vous: r.lieu_rendez_vous,
          lieu_autre: r.lieu_autre,
          profession_societe: r.profession_societe,
          degre_interet: r.degre_interet,
          motivations_achat: r.motivations_achat,
          points_positifs: r.points_positifs,
          objections_freins: r.objections_freins,
          commentaire_global: r.commentaire_global,
          decision_attendue: r.decision_attendue,
          Com_Pres: r.Com_Pres,
          Com_Drive: r.Com_Drive,
          Com_Achat: r.Com_Achat,
          Com_Livre: r.Com_Livre,
          Com_APV: r.Com_APV,
          Com_Office: r.Com_Office,
          Com_Close: r.Com_Close,
          devis_offre_remise: r.devis_offre_remise,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          voiture: r.Voiture
            ? {
                id: r.Voiture.id,
                couleur: r.Voiture.couleur ?? "",
                motorisation: String(r.Voiture.motorisation ?? ""),
                transmission: String(r.Voiture.transmission ?? ""),
                voitureModel: r.Voiture.VoitureModel ? { model: r.Voiture.VoitureModel.model } : undefined,
              }
            : null,
        };

        if (!byCommercial.has(commercialName)) {
          byCommercial.set(commercialName, []);
        }
        byCommercial.get(commercialName)!.push(item);
      }

      const startStr = p.objectif_start.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endStr = p.objectif_end.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const commercials: RapportRendezVousByCommercial[] = Array.from(byCommercial.entries())
        .map(([conseiller_commercial, reports]) => ({
          conseiller_commercial,
          totalReports: reports.length,
          reports,
        }))
        .sort((a, b) => a.conseiller_commercial.localeCompare(b.conseiller_commercial));

      result.push({
        periodId: p.id,
        periodStart: p.objectif_start.toISOString(),
        periodEnd: p.objectif_end.toISOString(),
        periodLabel: `${startStr} — ${endStr}`,
        commercials,
      });
    }

    return { success: true, data: { periods: result } };
  } catch (error) {
    console.error("Error fetching RapportRendezVous by ObjectifPeriod and Commercial:", error);
    return { success: false, error: "Échec du chargement des données" };
  }
}

/**
 * Fetches all RapportRendezVous grouped by ObjectifPeriod.
 * For each period, separates Client/Client_entreprise with status_client === PROSPECT vs CLIENT.
 * For RESPONSABLE_COMMERCIAL / ADMIN only.
 */
export async function getRapportRendezVousByObjectifPeriod(clerkUserId?: string): Promise<{
  success: boolean;
  data?: RapportRendezVousAnalyticsData;
  error?: string;
}> {
  try {
    let clerkId = clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }
    const user = userResult.data;

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const periods = await prisma.objectifPeriod.findMany({
      orderBy: { objectif_start: "desc" },
      select: { id: true, objectif_start: true, objectif_end: true },
    });

    const result: RapportRendezVousByPeriodData[] = [];

    for (const p of periods) {
      const rapports = await prisma.rapportRendezVous.findMany({
        where: {
          RendezVous: {
            date: {
              gte: p.objectif_start,
              lte: p.objectif_end,
            },
          },
        },
        include: {
          Client: {
            select: {
              id: true,
              nom: true,
              status_client: true,
              secteur_activite: true,
              User: { select: { firstName: true, lastName: true } },
            },
          },
          Client_entreprise: {
            select: {
              id: true,
              nom_entreprise: true,
              status_client: true,
              secteur_activite: true,
              User: { select: { firstName: true, lastName: true } },
            },
          },
          RendezVous: { select: { date: true } },
        },
        orderBy: { date_rendez_vous: "desc" },
      });

      const prospects: RapportRendezVousItem[] = [];
      const clients: RapportRendezVousItem[] = [];

      const getCommercialName = (u: { firstName: string; lastName: string } | null) =>
        u ? `${u.firstName} ${u.lastName}`.trim() || "—" : "—";

      for (const r of rapports) {
        const client = r.Client;
        const clientEntreprise = r.Client_entreprise;
        const status = client?.status_client ?? clientEntreprise?.status_client ?? "PROSPECT";
        const type = client ? "client" : "client_entreprise";
        const nom = client?.nom ?? clientEntreprise?.nom_entreprise ?? r.nom_prenom_client;
        const secteur = client?.secteur_activite ?? clientEntreprise?.secteur_activite ?? "—";
        const commercialName = getCommercialName(client?.User ?? clientEntreprise?.User ?? null);

        const item: RapportRendezVousItem = {
          id: r.id,
          nom_prenom_client: nom,
          telephone_client: r.telephone_client,
          email_client: r.email_client,
          profession_societe: r.profession_societe,
          date_rendez_vous: r.RendezVous?.date
            ? new Date(r.RendezVous.date).toISOString()
            : r.date_rendez_vous
              ? new Date(r.date_rendez_vous).toISOString()
              : "",
          type_client: r.type_client,
          status_client: status,
          type,
          commercialName,
          secteur_activite: secteur?.trim() || "Non renseigné",
        };

        if (status === "PROSPECT") {
          prospects.push(item);
        } else if (status === "CLIENT") {
          clients.push(item);
        }
      }

      const startStr = p.objectif_start.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endStr = p.objectif_end.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      result.push({
        periodId: p.id,
        periodStart: p.objectif_start.toISOString(),
        periodEnd: p.objectif_end.toISOString(),
        periodLabel: `${startStr} — ${endStr}`,
        prospects,
        clients,
      });
    }

    return { success: true, data: { periods: result } };
  } catch (error) {
    console.error("Error fetching RapportRendezVous by ObjectifPeriod:", error);
    return { success: false, error: "Échec du chargement des données" };
  }
}

export type ObjectifFinanciereByPoleAndCommercial = {
  id: string;
  pole: string;
  nomDuCommercial: string;
  periodLabel: string;
  periodId: string;
  chiffreAffaire: number;
  objectifReelAtteint: number;
  objectif_cible: string | null;
  pourcentageAtteint: number;
  ecartCible: number;
};

/**
 * Fetches all Objectifsfinancieres grouped by objectifPole (pole) and commercial.
 * For RESPONSABLE_COMMERCIAL / ADMIN only.
 */
export async function getObjectifsFinancieresByPoleAndCommercial(clerkUserId?: string): Promise<{
  success: boolean;
  data?: ObjectifFinanciereByPoleAndCommercial[];
  error?: string;
}> {
  try {
    let clerkId = clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }
    const user = userResult.data;

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const [objectifs, poles, factures] = await Promise.all([
      prisma.objectifsfinancieres.findMany({
        where: { objectifPeriodId: { not: null } },
        orderBy: [{ nomDuCommercial: "asc" }],
        include: {
          ObjectifPeriod: {
            select: { id: true, objectif_start: true, objectif_end: true },
          },
        },
      }),
      prisma.objectifPole.findMany({
        orderBy: { createdAt: "desc" },
        select: { userId: true, objectifPeriodId: true, objectifPoleCible: true },
      }),
      prisma.facture.findMany({
        where: { status_facture: "FACTURE" },
        select: { userId: true, createdAt: true, total_ttc: true },
      }),
    ]);

    const factureSumByUserAndPeriod = new Map<string, number>();
    for (const f of factures) {
      const period = objectifs
        .filter((o) => o.ObjectifPeriod)
        .find((o) => {
          const p = o.ObjectifPeriod!;
          const d = f.createdAt;
          return d >= p.objectif_start && d <= p.objectif_end;
        });
      if (period?.ObjectifPeriod && f.userId) {
        const key = `${f.userId}-${period.ObjectifPeriod.id}`;
        const current = factureSumByUserAndPeriod.get(key) ?? 0;
        factureSumByUserAndPeriod.set(key, current + Number(f.total_ttc));
      }
    }

    const poleByUserAndPeriod = new Map<string, string>();
    for (const pole of poles) {
      const key = `${pole.userId}-${pole.objectifPeriodId}`;
      if (!poleByUserAndPeriod.has(key)) {
        poleByUserAndPeriod.set(key, pole.objectifPoleCible);
      }
    }

    const result: ObjectifFinanciereByPoleAndCommercial[] = objectifs
      .filter((o) => o.ObjectifPeriod)
      .map((o) => {
        const p = o.ObjectifPeriod!;
        const poleKey = o.userId && o.objectifPeriodId ? `${o.userId}-${o.objectifPeriodId}` : null;
        const poleFromDb = poleKey ? poleByUserAndPeriod.get(poleKey) : null;
        const pole = poleFromDb ?? (o.pole || "Non renseigné");

        const startStr = p.objectif_start.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const endStr = p.objectif_end.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const factureSumKey = o.userId && o.objectifPeriodId ? `${o.userId}-${o.objectifPeriodId}` : null;
        const objectifReelAtteint = factureSumKey ? factureSumByUserAndPeriod.get(factureSumKey) ?? 0 : 0;
        const chiffreAffaire = Number(o.chiffreAffaire);
        const ecartCible = objectifReelAtteint - chiffreAffaire;

        return {
          id: o.id,
          pole,
          nomDuCommercial: o.nomDuCommercial || "—",
          periodLabel: `${startStr} — ${endStr}`,
          periodId: p.id,
          chiffreAffaire,
          objectifReelAtteint,
          objectif_cible: o.objectif_cible,
          pourcentageAtteint: Number(o.pourcentageAtteint),
          ecartCible,
        };
      })
      .sort((a, b) => a.pole.localeCompare(b.pole) || a.nomDuCommercial.localeCompare(b.nomDuCommercial));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching Objectifsfinancieres by pole and commercial:", error);
    return { success: false, error: "Échec du chargement des objectifs financiers" };
  }
}

export type ObjectifVehiculeByPeriodAndCommercial = {
  id: string;
  periodLabel: string;
  periodId: string;
  commercialName: string;
  userId: string;
  objectifCible: string;
  objectifReelAtteint: string | null;
  venteVehiculesRealise: number;
  pourcentageAtteint: number | null;
};

/**
 * Fetches all Objectifsvehicules grouped by objectifPeriod and commercial.
 * For RESPONSABLE_COMMERCIAL / ADMIN only.
 */
export async function getObjectifsVehiculesByPeriodAndCommercial(clerkUserId?: string): Promise<{
  success: boolean;
  data?: ObjectifVehiculeByPeriodAndCommercial[];
  error?: string;
}> {
  try {
    let clerkId = clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }
    const user = userResult.data;

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const [objectifs, factures] = await Promise.all([
      prisma.objectifsvehicules.findMany({
        orderBy: [{ objectifPeriodId: "asc" }, { userId: "asc" }],
        include: {
          User: { select: { id: true, firstName: true, lastName: true } },
          ObjectifPeriod: { select: { id: true, objectif_start: true, objectif_end: true } },
        },
      }),
      prisma.facture.findMany({
        where: { status_facture: "FACTURE" },
        select: {
          userId: true,
          createdAt: true,
          nbr_voiture_commande: true,
          FactureLigne: { select: { nbr_voiture: true } },
        },
      }),
    ]);

    const vehicleCountByUserAndPeriod = new Map<string, number>();
    for (const f of factures) {
      const period = objectifs
        .filter((o) => o.ObjectifPeriod)
        .find((o) => {
          const p = o.ObjectifPeriod!;
          const d = f.createdAt;
          return d >= p.objectif_start && d <= p.objectif_end;
        });
      if (period?.ObjectifPeriod && f.userId) {
        const vehicleCount =
          f.FactureLigne.length > 0
            ? f.FactureLigne.reduce((s, l) => s + l.nbr_voiture, 0)
            : f.nbr_voiture_commande;
        const key = `${f.userId}-${period.ObjectifPeriod.id}`;
        const current = vehicleCountByUserAndPeriod.get(key) ?? 0;
        vehicleCountByUserAndPeriod.set(key, current + vehicleCount);
      }
    }

    const result: ObjectifVehiculeByPeriodAndCommercial[] = objectifs
      .filter((o) => o.ObjectifPeriod)
      .map((o) => {
        const p = o.ObjectifPeriod!;
        const startStr = p.objectif_start.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const endStr = p.objectif_end.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const commercialName = o.User
          ? `${o.User.firstName} ${o.User.lastName}`.trim() || "—"
          : "—";

        const venteVehiculesKey = `${o.userId}-${p.id}`;
        const venteVehiculesRealise = vehicleCountByUserAndPeriod.get(venteVehiculesKey) ?? 0;
        const objectifCibleNum = parseFloat(String(o.objectif_cible || "0").replace(/\s/g, "")) || 0;
        const pourcentageAtteint =
          objectifCibleNum > 0
            ? Math.round((venteVehiculesRealise / objectifCibleNum) * 1000) / 10
            : null;

        return {
          id: o.id,
          periodLabel: `${startStr} — ${endStr}`,
          periodId: p.id,
          commercialName,
          userId: o.userId,
          objectifCible: o.objectif_cible || "—",
          objectifReelAtteint: o.objectif_reel_atteint,
          venteVehiculesRealise,
          pourcentageAtteint,
        };
      })
      .sort((a, b) => a.periodLabel.localeCompare(b.periodLabel) || a.commercialName.localeCompare(b.commercialName));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching Objectifsvehicules by period and commercial:", error);
    return { success: false, error: "Échec du chargement des objectifs véhicules" };
  }
}

export type ObjectifCibleByPeriodAndCommercial = {
  id: string;
  periodLabel: string;
  periodId: string;
  commercialName: string;
  userId: string;
  prospectCible: number;
  prospectReel: number;
  tauxAtteint: number;
};

/**
 * Fetches all ObjectifCible (prospect targets) grouped by objectifPeriod and commercial.
 * For RESPONSABLE_COMMERCIAL / ADMIN only.
 */
export async function getObjectifsCibleByPeriodAndCommercial(clerkUserId?: string): Promise<{
  success: boolean;
  data?: ObjectifCibleByPeriodAndCommercial[];
  error?: string;
}> {
  try {
    let clerkId = clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }
    const user = userResult.data;

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const objectifs = await prisma.objectifCible.findMany({
      orderBy: [{ periodId: "asc" }, { userId: "asc" }],
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        period: { select: { id: true, objectif_start: true, objectif_end: true } },
      },
    });

    const result: ObjectifCibleByPeriodAndCommercial[] = objectifs
      .filter((o) => o.period)
      .map((o) => {
        const p = o.period!;
        const startStr = p.objectif_start.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const endStr = p.objectif_end.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const commercialName = o.user
          ? `${o.user.firstName} ${o.user.lastName}`.trim() || "—"
          : "—";

        return {
          id: o.id,
          periodLabel: `${startStr} — ${endStr}`,
          periodId: p.id,
          commercialName,
          userId: o.userId,
          prospectCible: o.prospectCible,
          prospectReel: o.prospectReel,
          tauxAtteint: Number(o.tauxAtteint),
        };
      })
      .sort((a, b) => a.periodLabel.localeCompare(b.periodLabel) || a.commercialName.localeCompare(b.commercialName));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching ObjectifCible by period and commercial:", error);
    return { success: false, error: "Échec du chargement des objectifs cible" };
  }
}
