"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "./user";

export type ClientsByMonthChartData = {
  chartData: Array<{ month: string; clients: number; clientEntreprises: number; total: number }>;
  totalClients: number;
  totalClientEntreprises: number;
};

export type ClientsBySecteurActiviteData = {
  chartData: Array<{ secteur: string; clients: number; clientEntreprises: number; total: number }>;
};

export type ClientOrEntrepriseItem = {
  id: string;
  type: "client" | "client_entreprise";
  nom: string;
  secteur_activite: string;
  commercialName: string;
};

export type SecteurGroup = {
  secteur: string;
  clients: ClientOrEntrepriseItem[];
  clientEntreprises: ClientOrEntrepriseItem[];
};

export type ClientsBySecteurPerPeriodData = {
  periodId: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  secteurs: SecteurGroup[];
};

export type FactureWithClientData = {
  id: string;
  clientName: string;
  type: "client" | "client_entreprise";
  status_facture: string;
  date_facture: string;
  total_ttc: number;
};

export type ClientsFacturesData = {
  factures: FactureWithClientData[];
};

export type FacturesByStatusData = {
  chartData: Array<{ status: string; count: number }>;
  factures: Array<{
    id: string;
    clientName: string;
    status_facture: string;
    date_facture: string;
    total_ttc: number;
  }>;
};

export type VehiculesLivresData = {
  total: number;
  byMonth: Array<{ month: string; count: number }>;
};

/**
 * Fetches Client and Client_entreprise with status PROSPECT or CLIENT,
 * created by the current user, grouped by secteur_activite.
 */
export async function getClientsAndClientEntreprisesBySecteurActiviteForCurrentUser(): Promise<{
  success: boolean;
  data?: ClientsBySecteurActiviteData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const [clients, clientEntreprises] = await Promise.all([
      prisma.client.findMany({
        where: {
          userId: user.id,
          status_client: { in: ["PROSPECT", "CLIENT"] },
        },
        select: { secteur_activite: true },
      }),
      prisma.client_entreprise.findMany({
        where: {
          userId: user.id,
          status_client: { in: ["PROSPECT", "CLIENT"] },
        },
        select: { secteur_activite: true },
      }),
    ]);

    const secteurMap = new Map<string, { clients: number; clientEntreprises: number }>();

    const addToSecteur = (secteur: string | null, isClient: boolean) => {
      const key = secteur?.trim() || "Non renseigné";
      const current = secteurMap.get(key) ?? { clients: 0, clientEntreprises: 0 };
      if (isClient) current.clients += 1;
      else current.clientEntreprises += 1;
      secteurMap.set(key, current);
    };

    for (const c of clients) {
      addToSecteur(c.secteur_activite, true);
    }
    for (const c of clientEntreprises) {
      addToSecteur(c.secteur_activite, false);
    }

    const chartData = Array.from(secteurMap.entries())
      .map(([secteur, counts]) => ({
        secteur,
        clients: counts.clients,
        clientEntreprises: counts.clientEntreprises,
        total: counts.clients + counts.clientEntreprises,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      success: true,
      data: { chartData },
    };
  } catch (error) {
    console.error("Error fetching clients by secteur_activite:", error);
    return { success: false, error: "Échec du chargement des données" };
  }
}

/**
 * Fetches all Client and Client_entreprise for each ObjectifPeriod,
 * grouped by secteur_activite. For RESPONSABLE_COMMERCIAL / ADMIN only.
 * Clients are included if createdAt is within the period's objectif_start and objectif_end.
 * Pass clerkUserId from the client (useUser().id) when calling from a client component,
 * since auth() may not work when middleware skips Clerk for server actions.
 */
export async function getClientsBySecteurForAllObjectifPeriods(clerkUserId?: string): Promise<{
  success: boolean;
  data?: ClientsBySecteurPerPeriodData[];
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

    const result: ClientsBySecteurPerPeriodData[] = [];

    for (const p of periods) {
      const [clients, clientEntreprises] = await Promise.all([
        prisma.client.findMany({
          where: {
            status_client: { in: ["PROSPECT", "CLIENT"] },
            createdAt: {
              gte: p.objectif_start,
              lte: p.objectif_end,
            },
          },
          select: {
            id: true,
            nom: true,
            secteur_activite: true,
            User: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.client_entreprise.findMany({
          where: {
            status_client: { in: ["PROSPECT", "CLIENT"] },
            createdAt: {
              gte: p.objectif_start,
              lte: p.objectif_end,
            },
          },
          select: {
            id: true,
            nom_entreprise: true,
            secteur_activite: true,
            User: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

      const secteurMap = new Map<
        string,
        { clients: ClientOrEntrepriseItem[]; clientEntreprises: ClientOrEntrepriseItem[] }
      >();

      const addToSecteur = (
        secteur: string | null,
        item: ClientOrEntrepriseItem,
        isClient: boolean
      ) => {
        const key = secteur?.trim() || "Non renseigné";
        const current = secteurMap.get(key) ?? {
          clients: [],
          clientEntreprises: [],
        };
        if (isClient) current.clients.push(item);
        else current.clientEntreprises.push(item);
        secteurMap.set(key, current);
      };

      const getCommercialName = (u: { firstName: string; lastName: string } | null) =>
        u ? `${u.firstName} ${u.lastName}`.trim() || "—" : "—";

      for (const c of clients) {
        const secteur = c.secteur_activite?.trim() || "Non renseigné";
        addToSecteur(
          c.secteur_activite,
          {
            id: c.id,
            type: "client",
            nom: c.nom,
            secteur_activite: secteur,
            commercialName: getCommercialName(c.User),
          },
          true
        );
      }
      for (const ce of clientEntreprises) {
        const secteur = ce.secteur_activite?.trim() || "Non renseigné";
        addToSecteur(
          ce.secteur_activite,
          {
            id: ce.id,
            type: "client_entreprise",
            nom: ce.nom_entreprise,
            secteur_activite: secteur,
            commercialName: getCommercialName(ce.User),
          },
          false
        );
      }

      const secteurs: SecteurGroup[] = Array.from(secteurMap.entries())
        .map(([secteur, data]) => ({
          secteur,
          clients: data.clients,
          clientEntreprises: data.clientEntreprises,
        }))
        .sort(
          (a, b) =>
            b.clients.length +
            b.clientEntreprises.length -
            (a.clients.length + a.clientEntreprises.length)
        );

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
        secteurs,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching clients by secteur per period:", error);
    return { success: false, error: "Échec du chargement des données" };
  }
}

/**
 * Fetches all factures for Client and Client_entreprise created by the current user,
 * with status_facture.
 */
export async function getFacturesByCurrentUserClients(): Promise<{
  success: boolean;
  data?: ClientsFacturesData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const [clientIds, clientEntrepriseIds] = await Promise.all([
      prisma.client.findMany({
        where: { userId: user.id },
        select: { id: true },
      }).then((r) => r.map((c) => c.id)),
      prisma.client_entreprise.findMany({
        where: { userId: user.id },
        select: { id: true },
      }).then((r) => r.map((c) => c.id)),
    ]);

    const factures = await prisma.facture.findMany({
      where: {
        OR: [
          { clientId: { in: clientIds } },
          { clientEntrepriseId: { in: clientEntrepriseIds } },
        ],
      },
      include: {
        Client: { select: { nom: true } },
        Client_entreprise: { select: { nom_entreprise: true } },
      },
      orderBy: { date_facture: "desc" },
    });

    const facturesData: FactureWithClientData[] = factures.map((f) => ({
      id: f.id,
      clientName: f.Client?.nom ?? f.Client_entreprise?.nom_entreprise ?? "—",
      type: f.clientId ? "client" : "client_entreprise",
      status_facture: f.status_facture,
      date_facture: f.date_facture.toISOString(),
      total_ttc: Number(f.total_ttc),
    }));

    return {
      success: true,
      data: { factures: facturesData },
    };
  } catch (error) {
    console.error("Error fetching factures by current user clients:", error);
    return { success: false, error: "Échec du chargement des factures" };
  }
}

/**
 * Fetches all factures created by the current user, grouped by status_facture.
 */
export async function getFacturesByCurrentUserGroupedByStatus(): Promise<{
  success: boolean;
  data?: FacturesByStatusData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const factures = await prisma.facture.findMany({
      where: { userId: user.id },
      include: {
        Client: { select: { nom: true } },
        Client_entreprise: { select: { nom_entreprise: true } },
      },
      orderBy: { date_facture: "desc" },
    });

    const statusCounts = new Map<string, number>();
    for (const f of factures) {
      const status = f.status_facture;
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }

    const STATUS_ORDER = ["EN_ATTENTE", "PROFORMA", "FACTURE", "PAYEE", "ANNULEE"];
    const orderedStatuses = STATUS_ORDER.filter((s) => statusCounts.has(s));
    const otherStatuses = Array.from(statusCounts.keys()).filter((s) => !STATUS_ORDER.includes(s));
    const chartData = [...orderedStatuses, ...otherStatuses].map((status) => ({
      status,
      count: statusCounts.get(status)!,
    }));

    const facturesData = factures.map((f) => ({
      id: f.id,
      clientName: f.Client?.nom ?? f.Client_entreprise?.nom_entreprise ?? "—",
      status_facture: f.status_facture,
      date_facture: f.date_facture.toISOString(),
      total_ttc: Number(f.total_ttc),
    }));

    return {
      success: true,
      data: { chartData, factures: facturesData },
    };
  } catch (error) {
    console.error("Error fetching factures by current user:", error);
    return { success: false, error: "Échec du chargement des factures" };
  }
}

/**
 * Fetches count of RapportRendezVous with Com_Livre=true for current user's clients,
 * grouped by month (Nombre de véhicules livrés).
 */
export async function getVehiculesLivresByCurrentUser(): Promise<{
  success: boolean;
  data?: VehiculesLivresData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const rapports = await prisma.rapportRendezVous.findMany({
      where: {
        Com_Livre: true,
        OR: [
          { Client: { userId: user.id } },
          { Client_entreprise: { userId: user.id } },
        ],
      },
      select: { createdAt: true },
    });

    const monthMap = new Map<string, number>();
    for (const r of rapports) {
      const d = new Date(r.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1);
    }

    const byMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, count]) => {
        const [year, month] = monthKey.split("-");
        const monthLabel = new Date(
          parseInt(year),
          parseInt(month) - 1
        ).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
        return { month: monthLabel, count };
      });

    return {
      success: true,
      data: {
        total: rapports.length,
        byMonth,
      },
    };
  } catch (error) {
    console.error("Error fetching véhicules livrés:", error);
    return { success: false, error: "Échec du chargement" };
  }
}

/**
 * Fetches count of RapportRendezVous with Com_Drive=true for current user's clients,
 * grouped by month (Nombre d'essais réalisés).
 */
export async function getEssaisRealisesByCurrentUser(): Promise<{
  success: boolean;
  data?: VehiculesLivresData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const rapports = await prisma.rapportRendezVous.findMany({
      where: {
        Com_Drive: true,
        OR: [
          { Client: { userId: user.id } },
          { Client_entreprise: { userId: user.id } },
        ],
      },
      select: { createdAt: true },
    });

    const monthMap = new Map<string, number>();
    for (const r of rapports) {
      const d = new Date(r.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1);
    }

    const byMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, count]) => {
        const [year, month] = monthKey.split("-");
        const monthLabel = new Date(
          parseInt(year),
          parseInt(month) - 1
        ).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
        return { month: monthLabel, count };
      });

    return {
      success: true,
      data: {
        total: rapports.length,
        byMonth,
      },
    };
  } catch (error) {
    console.error("Error fetching essais réalisés:", error);
    return { success: false, error: "Échec du chargement" };
  }
}

/**
 * Fetches Client and Client_entreprise with status PROSPECT or CLIENT,
 * created by the current user, grouped by month for chart display.
 */
export async function getClientsAndClientEntreprisesByMonthForCurrentUser(): Promise<{
  success: boolean;
  data?: ClientsByMonthChartData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const [clients, clientEntreprises] = await Promise.all([
      prisma.client.findMany({
        where: {
          userId: user.id,
          status_client: { in: ["PROSPECT", "CLIENT"] },
        },
        select: { createdAt: true },
      }),
      prisma.client_entreprise.findMany({
        where: {
          userId: user.id,
          status_client: { in: ["PROSPECT", "CLIENT"] },
        },
        select: { createdAt: true },
      }),
    ]);

    const monthMap = new Map<string, { clients: number; clientEntreprises: number }>();

    for (const c of clients) {
      const d = new Date(c.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const current = monthMap.get(monthKey) ?? { clients: 0, clientEntreprises: 0 };
      current.clients += 1;
      monthMap.set(monthKey, current);
    }

    for (const c of clientEntreprises) {
      const d = new Date(c.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const current = monthMap.get(monthKey) ?? { clients: 0, clientEntreprises: 0 };
      current.clientEntreprises += 1;
      monthMap.set(monthKey, current);
    }

    const sortedMonths = Array.from(monthMap.keys()).sort();

    const chartData = sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const monthLabel = new Date(
        parseInt(year),
        parseInt(month) - 1
      ).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
      const counts = monthMap.get(monthKey)!;
      return {
        month: monthLabel,
        clients: counts.clients,
        clientEntreprises: counts.clientEntreprises,
        total: counts.clients + counts.clientEntreprises,
      };
    });

    return {
      success: true,
      data: {
        chartData,
        totalClients: clients.length,
        totalClientEntreprises: clientEntreprises.length,
      },
    };
  } catch (error) {
    console.error("Error fetching clients by month:", error);
    return { success: false, error: "Échec du chargement des données" };
  }
}

export async function createClientEntreprise(data: {
  nom_entreprise: string;
  sigle?: string;
  email?: string;
  telephone: string;
  nom_personne_contact?: string;
  fonction_personne_contact?: string;
  email_personne_contact?: string;
  telephone_personne_contact?: string;
  localisation?: string;
  secteur_activite?: string;
  flotte_vehicules?: boolean;
  flotte_vehicules_description?: string;
  commercial?: string;
  status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
  userId: string;
}) {
  try {
    console.log("Creating client_entreprise with data:", data);
    
    // Get or create user if it doesn't exist
    const userResult = await getOrCreateUser(data.userId);
    
    if (!userResult.success || !userResult.data) {
      console.log("Failed to get or create user for clerkId:", data.userId);
      return { success: false, error: userResult.error || "User not found" };
    }
    
    const user = userResult.data;
    console.log("Found/created user:", user.id);
    
    const clientEntrepriseData = {
      id: crypto.randomUUID(),
      nom_entreprise: data.nom_entreprise,
      sigle: data.sigle || null,
      email: data.email || null,
      telephone: data.telephone,
      nom_personne_contact: data.nom_personne_contact || null,
      fonction_personne_contact: data.fonction_personne_contact || null,
      email_personne_contact: data.email_personne_contact || null,
      telephone_personne_contact: data.telephone_personne_contact || null,
      localisation: data.localisation || null,
      secteur_activite: data.secteur_activite || null,
      flotte_vehicules: data.flotte_vehicules || false,
      flotte_vehicules_description: data.flotte_vehicules_description || null,
      commercial: data.commercial || null,
      status_client: data.status_client || "PROSPECT",
      userId: user.id,
      updatedAt: new Date(),
    };
    
    console.log("Creating client_entreprise with data:", clientEntrepriseData);
    

    const clientEntreprise = await prisma.client_entreprise.create({
      data: clientEntrepriseData,
    });

    console.log("Client_entreprise created successfully:", clientEntreprise);
    revalidatePath("/commercial/prospects");
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error creating client_entreprise:", error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to create client_entreprise: ${error.message}` };
    }
    return { success: false, error: "Failed to create client_entreprise" };
  }
}

export async function getClientEntreprise(id: string) {
  try {
   
    const clientEntreprise = await prisma.client_entreprise.findUnique({
      where: { id },
      include: { User: true }
    });
    
    if (!clientEntreprise) {
      return { success: false, error: "Client_entreprise not found" };
    }
    
    return { 
      success: true, 
      data: {
        ...clientEntreprise,
        user: (clientEntreprise as { User?: unknown }).User
      } 
    };
  } catch (error) {
    console.error("Error fetching client_entreprise:", error);
    return { success: false, error: "Failed to fetch client_entreprise" };
  }
}

export async function getAllClientEntreprises() {
  try {

    const clientEntreprises = await prisma.client_entreprise.findMany({
      include: { User: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function updateClientEntreprise(id: string, data: {
  nom_entreprise?: string;
  sigle?: string;
  email?: string;
  telephone?: string;
  nom_personne_contact?: string;
  fonction_personne_contact?: string;
  email_personne_contact?: string;
  telephone_personne_contact?: string;
  localisation?: string;
  secteur_activite?: string;
  flotte_vehicules?: boolean;
  flotte_vehicules_description?: string;
  commercial?: string;
  status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
}) {
  try {
    console.log("Updating client_entreprise with ID:", id);
    console.log("Update data:", data);
    
    // First, check if the client_entreprise exists and has a valid user relationship

    const existingClientEntreprise = await prisma.client_entreprise.findUnique({
      where: { id },
      include: { User: true }
    });
    
    if (!existingClientEntreprise) {
      return { success: false, error: "Client_entreprise not found" };
    }
    
    console.log("Existing client_entreprise found:", existingClientEntreprise.nom_entreprise, "User ID:", existingClientEntreprise.userId);
    
    // Verify that the associated user exists (this prevents foreign key constraint violations)
    if (!(existingClientEntreprise as { User?: unknown }).User) {
      console.error("Client_entreprise exists but associated user is null:", existingClientEntreprise.userId);
      return { success: false, error: "Associated user not found. Please contact support." };
    }
    
    // Explicitly exclude userId to prevent foreign key constraint violations
    const { userId, ...safeData } = data as Record<string, unknown> & { userId?: unknown };
    if (userId !== undefined) {
      console.warn("Attempted to update userId field, which is not allowed. Ignoring userId:", userId);
    }
    
    // Clean the data to ensure we don't accidentally update userId
    const updateData = {
      ...(safeData.nom_entreprise !== undefined && { nom_entreprise: safeData.nom_entreprise as string }),
      ...(safeData.sigle !== undefined && { sigle: safeData.sigle as string | null }),
      ...(safeData.email !== undefined && { email: safeData.email as string | null }),
      ...(safeData.telephone !== undefined && { telephone: safeData.telephone as string }),
      ...(safeData.nom_personne_contact !== undefined && { nom_personne_contact: safeData.nom_personne_contact as string | null }),
      ...(safeData.fonction_personne_contact !== undefined && { fonction_personne_contact: safeData.fonction_personne_contact as string | null }),
      ...(safeData.email_personne_contact !== undefined && { email_personne_contact: safeData.email_personne_contact as string | null }),
      ...(safeData.telephone_personne_contact !== undefined && { telephone_personne_contact: safeData.telephone_personne_contact as string | null }),
      ...(safeData.localisation !== undefined && { localisation: safeData.localisation as string | null }),
      ...(safeData.secteur_activite !== undefined && { secteur_activite: safeData.secteur_activite as string | null }),
      ...(safeData.flotte_vehicules !== undefined && { flotte_vehicules: safeData.flotte_vehicules as boolean | null }),
      ...(safeData.flotte_vehicules_description !== undefined && { flotte_vehicules_description: safeData.flotte_vehicules_description as string | null }),
      ...(safeData.commercial !== undefined && { commercial: safeData.commercial as string | null }),
      ...(safeData.status_client !== undefined && { status_client: safeData.status_client as "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE" }),
    };
    
    console.log("Final update data (excluding userId):", updateData);
    
    const clientEntreprise = await prisma.client_entreprise.update({
      where: { id },
      data: updateData
    });
    
    console.log("Client_entreprise updated successfully:", clientEntreprise);
    revalidatePath("/commercial/prospects");
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error updating client_entreprise:", error);
    if (error instanceof Error) {
      // Check for specific foreign key constraint error
      if (error.message.includes("Foreign key constraint violated")) {
        return { success: false, error: "Invalid user reference. Please ensure the user exists in the system." };
      }
      return { success: false, error: `Failed to update client_entreprise: ${error.message}` };
    }
    return { success: false, error: "Failed to update client_entreprise" };
  }
}

export async function deleteClientEntreprise(id: string) {
  try {
    await prisma.client_entreprise.delete({
      where: { id }
    });
    
    revalidatePath("/commercial/prospects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting client_entreprise:", error);
    return { success: false, error: "Failed to delete client_entreprise" };
  }
}

export async function getClientEntreprisesByUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
  
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        userId: user.id,
      },
      include: { User: true },
      orderBy: { createdAt: 'desc' }  // Newest to oldest
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by user:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function getClientEntreprisesByStatus(status: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE") {
  try {
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        status_client: status,
      },
      include: { User: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by status:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function getClientEntreprisesByStatusWithVoitures(status: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE") {
  try {
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: { status_client: status },
      include: {
        User: true,
        Voiture: {
          include: { VoitureModel: true }
        }
      },
      orderBy: { nom_entreprise: 'asc' }
    });
    return {
      success: true,
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown; Voiture?: unknown[] };
        return {
          ...item,
          user: item.User,
          voitures: item.Voiture?.map((v: unknown) => {
            const voiture = v as Record<string, unknown> & { VoitureModel?: unknown };
            return { ...voiture, voitureModel: voiture.VoitureModel };
          })
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by status with voitures:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function reassignClientEntrepriseProspect(
  id: string,
  newUserId: string,
  newCommercialName: string
) {
  try {
    const clientEntreprise = await prisma.client_entreprise.update({
      where: { id },
      data: {
        userId: newUserId,
        commercial: newCommercialName,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/commercial/prospects");
    revalidatePath("/responsablecommercial/prospects");
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error reassigning client_entreprise prospect:", error);
    return { success: false, error: "Failed to reassign prospect" };
  }
}

export async function getClientEntreprisesByUserAndStatus(userId: string, status: "CLIENT" | "PROSPECT" | "ABANDONNE") {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    

    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        userId: user.id,
        status_client: status,
      },
      include: { User: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by user and status:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function getClientsWithFacturesGroupedByYearMonth() {
  try {
    // Fetch Client_entreprise records
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        status_client: {
          in: ["CLIENT", "PROSPECT"]
        }
      },
      include: {
        User: true,
        Facture: {
          include: {
            FactureLigne: {
              include: {
                VoitureModel: true
              }
            }
          },
          orderBy: {
            date_facture: "desc"
          }
        }
      },
      orderBy: {
        nom_entreprise: 'asc'
      }
    });

    // Fetch Client records
    const clients = await prisma.client.findMany({
      where: {
        status_client: {
          in: ["CLIENT", "PROSPECT"]
        }
      },
      include: {
        User: true,
        Facture: {
          include: {
            FactureLigne: {
              include: {
                VoitureModel: true
              }
            }
          },
          orderBy: {
            date_facture: "desc"
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Group factures by year and month
    const groupedData: Record<string, Record<string, Array<{
      client: unknown;
      facture: unknown;
    }>>> = {};

    // Process Client_entreprise records
    clientEntreprises.forEach((client) => {
      const factures = (client.Facture || []) as Array<{
        date_facture: Date;
        id: string;
        FactureLigne: Array<{
          id: string;
          voitureModelId: string;
          couleur: string;
          nbr_voiture: number;
          prix_unitaire: unknown;
          montant_ligne: unknown;
          VoitureModel: {
            model: string;
            image?: string;
            description?: string;
          } | null;
        }>;
        total_ttc: unknown;
        [key: string]: unknown;
      }>;

      factures.forEach((facture) => {
        const date = new Date(facture.date_facture);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        if (!groupedData[year]) {
          groupedData[year] = {};
        }
        if (!groupedData[year][month]) {
          groupedData[year][month] = [];
        }

        // Serialize all Decimal fields in facture
        const dateFacture = new Date(facture.date_facture);
        const dateEcheance = (facture as { date_echeance?: Date }).date_echeance 
          ? new Date((facture as { date_echeance?: Date }).date_echeance!)
          : dateFacture;
        
        const serializedFacture = {
          id: facture.id,
          date_facture: dateFacture.toISOString(),
          date_echeance: dateEcheance.toISOString(),
          status_facture: (facture as { status_facture?: string }).status_facture || "",
          nbr_voiture_commande: (facture as { nbr_voiture_commande?: number }).nbr_voiture_commande || 0,
          prix_unitaire: (facture as { prix_unitaire?: unknown }).prix_unitaire ? Number((facture as { prix_unitaire?: unknown }).prix_unitaire) : 0,
          montant_ht: (facture as { montant_ht?: unknown }).montant_ht ? Number((facture as { montant_ht?: unknown }).montant_ht) : 0,
          total_ht: (facture as { total_ht?: unknown }).total_ht ? Number((facture as { total_ht?: unknown }).total_ht) : 0,
          remise: (facture as { remise?: unknown }).remise ? Number((facture as { remise?: unknown }).remise) : 0,
          montant_remise: (facture as { montant_remise?: unknown }).montant_remise ? Number((facture as { montant_remise?: unknown }).montant_remise) : 0,
          montant_net_ht: (facture as { montant_net_ht?: unknown }).montant_net_ht ? Number((facture as { montant_net_ht?: unknown }).montant_net_ht) : 0,
          tva: (facture as { tva?: unknown }).tva ? Number((facture as { tva?: unknown }).tva) : 0,
          montant_tva: (facture as { montant_tva?: unknown }).montant_tva ? Number((facture as { montant_tva?: unknown }).montant_tva) : 0,
          total_ttc: facture.total_ttc ? Number(facture.total_ttc) : 0,
          avance_payee: (facture as { avance_payee?: unknown }).avance_payee ? Number((facture as { avance_payee?: unknown }).avance_payee) : 0,
          reste_payer: (facture as { reste_payer?: unknown }).reste_payer ? Number((facture as { reste_payer?: unknown }).reste_payer) : 0,
          accessoire_description: (facture as { accessoire_description?: string | null }).accessoire_description || null,
          accessoire_nbr: (facture as { accessoire_nbr?: number | null }).accessoire_nbr || null,
          accessoire_nom: (facture as { accessoire_nom?: string | null }).accessoire_nom || null,
          accessoire_prix: (facture as { accessoire_prix?: unknown }).accessoire_prix ? Number((facture as { accessoire_prix?: unknown }).accessoire_prix) : null,
          accessoire_subtotal: (facture as { accessoire_subtotal?: unknown }).accessoire_subtotal ? Number((facture as { accessoire_subtotal?: unknown }).accessoire_subtotal) : null,
          bon_pour_acquis: (facture as { bon_pour_acquis?: boolean }).bon_pour_acquis || false,
          FactureLigne: facture.FactureLigne.map((ligne) => ({
            id: ligne.id,
            voitureModelId: ligne.voitureModelId,
            couleur: ligne.couleur,
            nbr_voiture: ligne.nbr_voiture,
            prix_unitaire: ligne.prix_unitaire ? Number(ligne.prix_unitaire) : 0,
            montant_ligne: ligne.montant_ligne ? Number(ligne.montant_ligne) : 0,
            transmission: (ligne as { transmission?: string | null }).transmission || null,
            motorisation: (ligne as { motorisation?: string | null }).motorisation || null,
            voitureModel: ligne.VoitureModel
          }))
        };

        groupedData[year][month].push({
          client: {
            id: (client as { id?: string }).id || "",
            nom_entreprise: (client as { nom_entreprise?: string }).nom_entreprise || "",
            sigle: (client as { sigle?: string | null }).sigle || null,
            telephone: (client as { telephone?: string }).telephone || null,
            localisation: (client as { localisation?: string | null }).localisation || null,
            commercial: (client as { commercial?: string | null }).commercial || null,
            status_client: (client as { status_client?: string }).status_client || "",
            user: (client as { User?: unknown }).User,
            isEntreprise: true
          },
          facture: serializedFacture
        });
      });
    });

    // Process Client records
    clients.forEach((client) => {
      const factures = (client.Facture || []) as Array<{
        date_facture: Date;
        id: string;
        FactureLigne: Array<{
          id: string;
          voitureModelId: string;
          couleur: string;
          nbr_voiture: number;
          prix_unitaire: unknown;
          montant_ligne: unknown;
          VoitureModel: {
            model: string;
            image?: string;
            description?: string;
          } | null;
        }>;
        total_ttc: unknown;
        [key: string]: unknown;
      }>;

      factures.forEach((facture) => {
        const date = new Date(facture.date_facture);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        if (!groupedData[year]) {
          groupedData[year] = {};
        }
        if (!groupedData[year][month]) {
          groupedData[year][month] = [];
        }

        // Serialize all Decimal fields in facture
        const dateFacture = new Date(facture.date_facture);
        const dateEcheance = (facture as { date_echeance?: Date }).date_echeance 
          ? new Date((facture as { date_echeance?: Date }).date_echeance!)
          : dateFacture;
        
        const serializedFacture = {
          id: facture.id,
          date_facture: dateFacture.toISOString(),
          date_echeance: dateEcheance.toISOString(),
          status_facture: (facture as { status_facture?: string }).status_facture || "",
          nbr_voiture_commande: (facture as { nbr_voiture_commande?: number }).nbr_voiture_commande || 0,
          prix_unitaire: (facture as { prix_unitaire?: unknown }).prix_unitaire ? Number((facture as { prix_unitaire?: unknown }).prix_unitaire) : 0,
          montant_ht: (facture as { montant_ht?: unknown }).montant_ht ? Number((facture as { montant_ht?: unknown }).montant_ht) : 0,
          total_ht: (facture as { total_ht?: unknown }).total_ht ? Number((facture as { total_ht?: unknown }).total_ht) : 0,
          remise: (facture as { remise?: unknown }).remise ? Number((facture as { remise?: unknown }).remise) : 0,
          montant_remise: (facture as { montant_remise?: unknown }).montant_remise ? Number((facture as { montant_remise?: unknown }).montant_remise) : 0,
          montant_net_ht: (facture as { montant_net_ht?: unknown }).montant_net_ht ? Number((facture as { montant_net_ht?: unknown }).montant_net_ht) : 0,
          tva: (facture as { tva?: unknown }).tva ? Number((facture as { tva?: unknown }).tva) : 0,
          montant_tva: (facture as { montant_tva?: unknown }).montant_tva ? Number((facture as { montant_tva?: unknown }).montant_tva) : 0,
          total_ttc: facture.total_ttc ? Number(facture.total_ttc) : 0,
          avance_payee: (facture as { avance_payee?: unknown }).avance_payee ? Number((facture as { avance_payee?: unknown }).avance_payee) : 0,
          reste_payer: (facture as { reste_payer?: unknown }).reste_payer ? Number((facture as { reste_payer?: unknown }).reste_payer) : 0,
          accessoire_description: (facture as { accessoire_description?: string | null }).accessoire_description || null,
          accessoire_nbr: (facture as { accessoire_nbr?: number | null }).accessoire_nbr || null,
          accessoire_nom: (facture as { accessoire_nom?: string | null }).accessoire_nom || null,
          accessoire_prix: (facture as { accessoire_prix?: unknown }).accessoire_prix ? Number((facture as { accessoire_prix?: unknown }).accessoire_prix) : null,
          accessoire_subtotal: (facture as { accessoire_subtotal?: unknown }).accessoire_subtotal ? Number((facture as { accessoire_subtotal?: unknown }).accessoire_subtotal) : null,
          bon_pour_acquis: (facture as { bon_pour_acquis?: boolean }).bon_pour_acquis || false,
          FactureLigne: facture.FactureLigne.map((ligne) => ({
            id: ligne.id,
            voitureModelId: ligne.voitureModelId,
            couleur: ligne.couleur,
            nbr_voiture: ligne.nbr_voiture,
            prix_unitaire: ligne.prix_unitaire ? Number(ligne.prix_unitaire) : 0,
            montant_ligne: ligne.montant_ligne ? Number(ligne.montant_ligne) : 0,
            transmission: (ligne as { transmission?: string | null }).transmission || null,
            motorisation: (ligne as { motorisation?: string | null }).motorisation || null,
            voitureModel: ligne.VoitureModel
          }))
        };

        groupedData[year][month].push({
          client: {
            id: client.id,
            nom: (client as { nom?: string }).nom || "",
            nom_entreprise: (client as { nom?: string }).nom || "",
            sigle: null,
            telephone: (client as { telephone?: string }).telephone || null,
            localisation: (client as { localisation?: string | null }).localisation || null,
            commercial: (client as { commercial?: string | null }).commercial || null,
            status_client: (client as { status_client?: string }).status_client || "",
            user: (client as { User?: unknown }).User,
            isEntreprise: false
          },
          facture: serializedFacture
        });
      });
    });

    // Sort years and months in descending order (latest first)
    const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b) - parseInt(a));
    const result: Record<string, Record<string, Array<{
      client: unknown;
      facture: unknown;
    }>>> = {};

    sortedYears.forEach((year) => {
      const sortedMonths = Object.keys(groupedData[year]).sort((a, b) => parseInt(b) - parseInt(a));
      result[year] = {};
      sortedMonths.forEach((month) => {
        // Sort factures within each month by date (latest first)
        result[year][month] = groupedData[year][month].sort((a, b) => {
          const dateA = new Date((a.facture as { date_facture: Date }).date_facture);
          const dateB = new Date((b.facture as { date_facture: Date }).date_facture);
          return dateB.getTime() - dateA.getTime();
        });
      });
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching clients with factures grouped by year/month:", error);
    return { success: false, error: "Failed to fetch clients with factures" };
  }
}
