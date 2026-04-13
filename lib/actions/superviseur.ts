"use server";

import { prisma } from "../prisma";

interface CommercialPerformance {
  id: string;
  name: string;
  email: string;
  telephone: string;
  clients: number;
  prospects: number;
  rendezVous: number;
  commandes: number;
  factures: number;
  revenue: number;
  conversionRate: string | number;
}

interface RapportRendezVousData {
  id: string;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  lieu_rendez_vous: string;
  lieu_autre: string | null;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client: string | null;
  profession_societe: string | null;
  type_client: string;
  Com_Pres: boolean;
  Com_Drive: boolean;
  Com_Achat: boolean;
  Com_Livre: boolean;
  Com_APV: boolean;
  Com_Office: boolean;
  Com_Close: boolean;
  objet_autre: string | null;
  modeles_discutes: string | null;
  motivations_achat: string | null;
  points_positifs: string | null;
  objections_freins: string | null;
  degre_interet: string | null;
  decision_attendue: string | null;
  devis_offre_remise: boolean;
  propositions_faites: string | null;
  reference_offre: string | null;
  financement_propose: string | null;
  assurance_entretien: boolean;
  reprise_ancien_vehicule: boolean;
  suivi_actions: string | null;
  actions_suivi: string | null;
  commentaire_global: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    nom: string;
    telephone: string;
    email: string | null;
  } | null;
  clientEntreprise: {
    id: string;
    nom_entreprise: string;
    telephone: string;
    email: string | null;
  } | null;
  rendezVous: {
    id: string;
    date: Date;
    statut: string;
    resume_rendez_vous: string | null;
  } | null;
  voiture: {
    id: string;
    couleur: string;
    motorisation: string;
    transmission: string;
    voitureModel?: {
      model: string;
    };
  } | null;
}

function serializeJsonField(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// Helper function to serialize facture Decimal fields
function serializeFacture(facture: unknown) {
  const f = facture as Record<string, unknown>;
  return {
    ...f,
    prix_unitaire: f.prix_unitaire ? Number(f.prix_unitaire) : 0,
    montant_ht: f.montant_ht ? Number(f.montant_ht) : 0,
    total_ht: f.total_ht ? Number(f.total_ht) : 0,
    remise: f.remise ? Number(f.remise) : 0,
    montant_remise: f.montant_remise ? Number(f.montant_remise) : 0,
    montant_net_ht: f.montant_net_ht ? Number(f.montant_net_ht) : 0,
    tva: f.tva ? Number(f.tva) : 0,
    montant_tva: f.montant_tva ? Number(f.montant_tva) : 0,
    total_ttc: f.total_ttc ? Number(f.total_ttc) : 0,
    avance_payee: f.avance_payee ? Number(f.avance_payee) : 0,
    reste_payer: f.reste_payer ? Number(f.reste_payer) : 0,
    accessoire_prix: f.accessoire_prix ? Number(f.accessoire_prix) : null,
    accessoire_subtotal: f.accessoire_subtotal ? Number(f.accessoire_subtotal) : null,
  };
}

// Get all users with role COMMERCIAL
export async function getAllCommercialUsers() {
  try {
    const commercials = await prisma.user.findMany({
      where: {
        role: "COMMERCIAL",
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        telephone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: commercials };
  } catch (error) {
    console.error("Error fetching commercial users:", error);
    return { success: false, error: "Failed to fetch commercial users" };
  }
}

// Get comprehensive statistics for all commercial users
export async function getCommercialActivitiesStats() {
  try {
    // Get all commercial users
    const commercials = await prisma.user.findMany({
      where: {
        role: "COMMERCIAL",
      },
      include: {
        Client: {
          include: {
            rendezVous: true,
            Commande: true,
            Facture: true,
          },
        },
        Client_entreprise: {
          include: {
            RendezVous: true,
            Commande: true,
            Facture: true,
          },
        },
        Facture: true,
        Paiement: true,
      },
    });

    // Calculate overall statistics
    const stats = {
      totalCommercials: commercials.length,
      totalClients: 0,
      totalProspects: 0,
      totalRendezVous: 0,
      totalCommandes: 0,
      totalFactures: 0,
      totalRevenue: 0,
      commercialPerformance: [] as CommercialPerformance[],
    };

    (commercials as unknown[]).forEach((comm: unknown) => {
      const commercial = comm as Record<string, unknown>;
      const clientsList = (commercial.Client || []) as Record<string, unknown>[];
      const clientEntreprisesList = (commercial.Client_entreprise || []) as Record<string, unknown>[];
      const facturesList = (commercial.Facture || []) as Record<string, unknown>[];

      const clientsCount = clientsList.length + clientEntreprisesList.length;
      const prospectsCount = [
        ...clientsList.filter((c: Record<string, unknown>) => c.status_client === 'PROSPECT'),
        ...clientEntreprisesList.filter((c: Record<string, unknown>) => c.status_client === 'PROSPECT')
      ].length;
      
      const rendezVousCount = [
        ...clientsList.flatMap((c: Record<string, unknown>) => (c.rendezVous || []) as unknown[]),
        ...clientEntreprisesList.flatMap((c: Record<string, unknown>) => (c.RendezVous || []) as unknown[])
      ].length;
      
      const commandesCount = [
        ...clientsList.flatMap((c: Record<string, unknown>) => (c.Commande || []) as unknown[]),
        ...clientEntreprisesList.flatMap((c: Record<string, unknown>) => (c.Commande || []) as unknown[])
      ].length;
      
      const facturesCount = facturesList.length;
      const revenue = facturesList.reduce((sum: number, f: Record<string, unknown>) => sum + Number(f.total_ttc), 0);

      stats.totalClients += clientsCount;
      stats.totalProspects += prospectsCount;
      stats.totalRendezVous += rendezVousCount;
      stats.totalCommandes += commandesCount;
      stats.totalFactures += facturesCount;
      stats.totalRevenue += revenue;

      stats.commercialPerformance.push({
        id: commercial.id as string,
        name: `${commercial.firstName as string} ${commercial.lastName as string}`,
        email: commercial.email as string,
        telephone: (commercial.telephone as string) || '',
        clients: clientsCount,
        prospects: prospectsCount,
        rendezVous: rendezVousCount,
        commandes: commandesCount,
        factures: facturesCount,
        revenue,
        conversionRate: prospectsCount > 0 ? ((clientsCount - prospectsCount) / prospectsCount * 100).toFixed(2) : 0,
      });
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching commercial activities stats:", error);
    return { success: false, error: "Failed to fetch commercial activities stats" };
  }
}

// Get recent activities across all commercial users
export async function getRecentCommercialActivities(limit: number = 10) {
  try {
    const [recentClients, recentRendezVous, recentCommandes, recentFactures] = await Promise.all([
      // Recent clients
      prisma.client.findMany({
        where: {
          User: {
            role: "COMMERCIAL",
          },
        },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      
      // Recent rendez-vous
      prisma.rendezVous.findMany({
        where: {
          OR: [
            {
              client: {
                User: {
                  role: "COMMERCIAL",
                },
              },
            },
            {
              Client_entreprise: {
                User: {
                  role: "COMMERCIAL",
                },
              },
            },
          ],
        },
        include: {
          client: {
            include: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          Client_entreprise: {
            include: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      
      // Recent commandes
      prisma.commande.findMany({
        where: {
          OR: [
            {
              Client: {
                User: {
                  role: "COMMERCIAL",
                },
              },
            },
            {
              Client_entreprise: {
                User: {
                  role: "COMMERCIAL",
                },
              },
            },
          ],
        },
        include: {
          Client: {
            include: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          Client_entreprise: {
            include: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          VoitureModel: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      
      // Recent factures
      prisma.facture.findMany({
        where: {
          User: {
            role: "COMMERCIAL",
          },
        },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          Client: true,
          Client_entreprise: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Serialize factures to convert Decimal fields to numbers and remap User to user
    const serializedFactures = (recentFactures as unknown[]).map((f: unknown) => {
      const facture = serializeFacture(f);
      const factureRecord = facture as Record<string, unknown>;
      return {
        ...factureRecord,
        user: factureRecord.User,
      };
    });

    // Remap for frontend compatibility
    const serializedClients = (recentClients as unknown[]).map((c: unknown) => {
      const client = c as Record<string, unknown>;
      return {
        ...client,
        user: client.User,
      };
    });

    const serializedRendezVous = (recentRendezVous as unknown[]).map((r: unknown) => {
      const rv = r as Record<string, unknown> & { client?: Record<string, unknown> & { User?: unknown }; Client_entreprise?: Record<string, unknown> & { User?: unknown } };
      return {
        ...rv,
        client: rv.client ? { ...rv.client, user: rv.client.User } : null,
        clientEntreprise: rv.Client_entreprise ? { ...rv.Client_entreprise, user: rv.Client_entreprise.User } : null,
      };
    });

    const serializedCommandes = (recentCommandes as unknown[]).map((c: unknown) => {
      const cmd = c as Record<string, unknown> & { Client?: Record<string, unknown> & { User?: unknown }; Client_entreprise?: Record<string, unknown> & { User?: unknown }; VoitureModel?: unknown; prix_unitaire?: unknown };
      return {
        ...cmd,
        client: cmd.Client ? { ...cmd.Client, user: cmd.Client.User } : null,
        clientEntreprise: cmd.Client_entreprise ? { ...cmd.Client_entreprise, user: cmd.Client_entreprise.User } : null,
        voitureModel: cmd.VoitureModel,
        prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
      };
    });

    return { 
      success: true, 
      data: {
        recentClients: serializedClients,
        recentRendezVous: serializedRendezVous,
        recentCommandes: serializedCommandes,
        recentFactures: serializedFactures,
      }
    };
  } catch (error) {
    console.error("Error fetching recent commercial activities:", error);
    return { success: false, error: "Failed to fetch recent commercial activities" };
  }
}

// Get detailed performance for a specific commercial
export async function getCommercialPerformanceDetail(userId: string) {
  try {
    const commercial = await prisma.user.findUnique({
      where: {
        id: userId,
        role: "COMMERCIAL",
      },
      include: {
        Client: {
          include: {
            rendezVous: true,
            Commande: true,
            Facture: true,
            Paiement: true,
          },
        },
        Client_entreprise: {
          include: {
            RendezVous: true,
            Commande: true,
            Facture: true,
            Paiement: true,
          },
        },
        Facture: {
          include: {
            Paiement: true,
          },
        },
        Paiement: true,
      },
    });

    if (!commercial) {
      return { success: false, error: "Commercial not found" };
    }

    // Remap for frontend compatibility
    const comm = commercial as Record<string, unknown>;
    const serializedCommercial = {
      ...comm,
      factures: ((comm.Facture || []) as unknown[]).map(serializeFacture),
      clients: ((comm.Client || []) as unknown[]).map((client: unknown) => {
        const c = client as Record<string, unknown> & { rendezVous?: unknown; Commande?: unknown; Facture?: unknown[]; Paiement?: unknown };
        return {
          ...c,
          rendez_vous: c.rendezVous,
          commandes: c.Commande,
          factures: (c.Facture || []).map(serializeFacture),
          paiements: c.Paiement,
        };
      }),
      client_entreprises: ((comm.Client_entreprise || []) as unknown[]).map((clientEntreprise: unknown) => {
        const c = clientEntreprise as Record<string, unknown> & { RendezVous?: unknown; Commande?: unknown; Facture?: unknown[]; Paiement?: unknown };
        return {
          ...c,
          rendez_vous: c.RendezVous,
          commandes: c.Commande,
          factures: (c.Facture || []).map(serializeFacture),
          paiements: c.Paiement,
        };
      }),
      paiements: comm.Paiement,
    };

    return { success: true, data: serializedCommercial };
  } catch (error) {
    console.error("Error fetching commercial performance detail:", error);
    return { success: false, error: "Failed to fetch commercial performance detail" };
  }
}

// Get monthly performance trends for all commercials
export async function getMonthlyPerformanceTrends() {
  try {
    const commercials = await prisma.user.findMany({
      where: {
        role: "COMMERCIAL",
      },
      include: {
        Client: {
          select: {
            createdAt: true,
            status_client: true,
          },
        },
        Client_entreprise: {
          select: {
            createdAt: true,
            status_client: true,
          },
        },
        Facture: {
          select: {
            createdAt: true,
            total_ttc: true,
            status_facture: true,
          },
        },
      },
    });

    // Group data by month for the last 6 months
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
        year: date.getFullYear(),
        monthNumber: date.getMonth(),
      };
    }).reverse();

    const trends = last6Months.map(period => {
      let newClients = 0;
      let revenue = 0;

      (commercials as unknown[]).forEach((comm: unknown) => {
        const commercial = comm as Record<string, unknown>;
        const clientsList = (commercial.Client || []) as Record<string, unknown>[];
        const clientEntreprisesList = (commercial.Client_entreprise || []) as Record<string, unknown>[];
        const facturesList = (commercial.Facture || []) as Record<string, unknown>[];

        // Count new clients in this month
        const allClients = [...clientsList, ...clientEntreprisesList];
        newClients += allClients.filter((c: Record<string, unknown>) => {
          const clientDate = new Date(c.createdAt as string);
          return clientDate.getMonth() === period.monthNumber && 
                 clientDate.getFullYear() === period.year;
        }).length;

        // Sum revenue from factures in this month
        revenue += facturesList
          .filter((f: Record<string, unknown>) => {
            const factureDate = new Date(f.createdAt as string);
            return factureDate.getMonth() === period.monthNumber && 
                   factureDate.getFullYear() === period.year;
          })
          .reduce((sum: number, f: Record<string, unknown>) => sum + Number(f.total_ttc), 0);
      });

      return {
        month: period.month,
        newClients,
        revenue,
      };
    });

    return { success: true, data: trends };
  } catch (error) {
    console.error("Error fetching monthly performance trends:", error);
    return { success: false, error: "Failed to fetch monthly performance trends" };
  }
}

// Get all rendez-vous grouped by commercial user
export async function getAllRendezVousByUser() {
  try {
    const commercials = await prisma.user.findMany({
      where: {
        role: "COMMERCIAL",
      },
      include: {
        Client: {
          include: {
            rendezVous: {
              include: {
                client: {
                  select: {
                    nom: true,
                    telephone: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
        Client_entreprise: {
          include: {
            RendezVous: {
              include: {
                Client_entreprise: {
                  select: {
                    nom_entreprise: true,
                    telephone: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    const rendezVousByUser = (commercials as unknown[]).map((comm: unknown) => {
      const commercial = comm as Record<string, unknown>;
      const clientsList = (commercial.Client || []) as Record<string, unknown>[];
      const clientEntreprisesList = (commercial.Client_entreprise || []) as Record<string, unknown>[];

      // Combine rendez-vous from both clients and client_entreprises
      const allRendezVous = [
        ...clientsList.flatMap((c: Record<string, unknown>) => ((c.rendezVous || []) as unknown[]).map((rdv: unknown) => {
          const r = rdv as Record<string, unknown> & { client?: { telephone?: string; email?: string } };
          return {
            ...r,
            clientName: c.nom,
            clientType: 'PARTICULIER' as const,
            clientPhone: r.client?.telephone || c.telephone,
            clientEmail: r.client?.email || c.email,
          };
        })),
        ...clientEntreprisesList.flatMap((c: Record<string, unknown>) => ((c.RendezVous || []) as unknown[]).map((rdv: unknown) => {
          const r = rdv as Record<string, unknown> & { clientEntreprise?: { nom_entreprise?: string; telephone?: string; email?: string } };
          return {
            ...r,
            clientName: r.clientEntreprise?.nom_entreprise || c.nom_entreprise,
            clientType: 'ENTREPRISE' as const,
            clientPhone: r.clientEntreprise?.telephone || c.telephone,
            clientEmail: r.clientEntreprise?.email || c.email,
          };
        })),
      ].sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

      return {
        userId: commercial.id as string,
        userName: `${String(commercial.firstName)} ${String(commercial.lastName)}`,
        userEmail: (commercial.email ?? "") as string,
        userPhone: (commercial.telephone ?? null) as string | null,
        totalRendezVous: allRendezVous.length,
        rendezVous: allRendezVous,
      };
    });

    return { success: true, data: rendezVousByUser };
  } catch (error) {
    console.error("Error fetching rendez-vous by user:", error);
    return { success: false, error: "Failed to fetch rendez-vous by user" };
  }
}

// Get all rapport rendez-vous classified by user and date (descending)
export async function getAllRapportRendezVousByUser() {
  try {
    // Fetch all meeting reports with related data
    const allReports = await prisma.rapportRendezVous.findMany({
      include: {
        Client: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
          },
        },
        Client_entreprise: {
          select: {
            id: true,
            nom_entreprise: true,
            telephone: true,
            email: true,
          },
        },
        RendezVous: {
          select: {
            id: true,
            date: true,
            statut: true,
            resume_rendez_vous: true,
          },
        },
        Voiture: {
          select: {
            id: true,
            couleur: true,
            motorisation: true,
            transmission: true,
            VoitureModel: {
              select: {
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_rendez_vous: 'desc',
      },
    });

    // Group reports by conseiller_commercial (commercial advisor)
    const reportsByUser = new Map<string, RapportRendezVousData[]>();

    (allReports as unknown[]).forEach((rep: unknown) => {
      const report = rep as Record<string, unknown> & {
        conseiller_commercial: string;
        date_rendez_vous: string;
        heure_rendez_vous: string;
        lieu_rendez_vous: string;
        lieu_autre: string | null;
        duree_rendez_vous: string;
        nom_prenom_client: string;
        telephone_client: string;
        email_client: string | null;
        profession_societe: string | null;
        type_client: string;
        Com_Pres: boolean;
        Com_Drive: boolean;
        Com_Achat: boolean;
        Com_Livre: boolean;
        Com_APV: boolean;
        Com_Office: boolean;
        Com_Close: boolean;
        objet_autre: string | null;
        modeles_discutes: unknown;
        motivations_achat: string | null;
        points_positifs: string | null;
        objections_freins: string | null;
        degre_interet: string | null;
        decision_attendue: string | null;
        devis_offre_remise: boolean;
        propositions_faites: string | null;
        reference_offre: string | null;
        financement_propose: string | null;
        assurance_entretien: boolean;
        reprise_ancien_vehicule: boolean;
        suivi_actions: string | null;
        actions_suivi: unknown;
        commentaire_global: string | null;
        createdAt: Date;
        updatedAt: Date;
        Client: unknown;
        Client_entreprise: unknown;
        RendezVous: unknown;
        Voiture: Record<string, unknown> & {
          id: string;
          couleur: string;
          motorisation: string;
          transmission: string;
          VoitureModel: { model: string } | null;
        } | null;
      };
      const commercialName = report.conseiller_commercial;
      
      if (!reportsByUser.has(commercialName)) {
        reportsByUser.set(commercialName, []);
      }
      
      reportsByUser.get(commercialName)?.push({
        id: report.id as string,
        date_rendez_vous: new Date(report.date_rendez_vous as string),
        heure_rendez_vous: report.heure_rendez_vous as string,
        lieu_rendez_vous: report.lieu_rendez_vous as string,
        lieu_autre: report.lieu_autre as string | null,
        duree_rendez_vous: report.duree_rendez_vous as string,
        nom_prenom_client: report.nom_prenom_client as string,
        telephone_client: report.telephone_client as string,
        email_client: report.email_client as string | null,
        profession_societe: report.profession_societe as string | null,
        type_client: report.type_client as string,
        Com_Pres: report.Com_Pres as boolean,
        Com_Drive: report.Com_Drive as boolean,
        Com_Achat: report.Com_Achat as boolean,
        Com_Livre: report.Com_Livre as boolean,
        Com_APV: report.Com_APV as boolean,
        Com_Office: report.Com_Office as boolean,
        Com_Close: report.Com_Close as boolean,
        objet_autre: report.objet_autre as string | null,
        modeles_discutes: serializeJsonField(report.modeles_discutes),
        motivations_achat: report.motivations_achat as string | null,
        points_positifs: report.points_positifs as string | null,
        objections_freins: report.objections_freins as string | null,
        degre_interet: report.degre_interet as string | null,
        decision_attendue: report.decision_attendue as string | null,
        devis_offre_remise: report.devis_offre_remise as boolean,
        propositions_faites: report.propositions_faites as string | null,
        reference_offre: report.reference_offre as string | null,
        financement_propose: report.financement_propose as string | null,
        assurance_entretien: Boolean(report.assurance_entretien),
        reprise_ancien_vehicule: Boolean(report.reprise_ancien_vehicule),
        suivi_actions: report.suivi_actions as string | null,
        actions_suivi: serializeJsonField(report.actions_suivi),
        commentaire_global: report.commentaire_global as string | null,
        createdAt: report.createdAt as Date,
        updatedAt: report.updatedAt as Date,
        client: report.Client as RapportRendezVousData['client'],
        clientEntreprise: report.Client_entreprise as RapportRendezVousData['clientEntreprise'],
        rendezVous: report.RendezVous as RapportRendezVousData['rendezVous'],
        voiture: report.Voiture ? {
          id: report.Voiture.id as string,
          couleur: report.Voiture.couleur as string,
          motorisation: report.Voiture.motorisation as string,
          transmission: report.Voiture.transmission as string,
          voitureModel: report.Voiture.VoitureModel || undefined,
        } : null,
      });
    });

    // Convert Map to Array and format
    const groupedReports = Array.from(reportsByUser.entries()).map(([commercialName, reports]) => ({
      conseiller_commercial: commercialName,
      totalReports: reports.length,
      reports: reports.sort((a, b) => 
        new Date(b.date_rendez_vous).getTime() - new Date(a.date_rendez_vous).getTime()
      ),
    })).sort((a, b) => a.conseiller_commercial.localeCompare(b.conseiller_commercial));

    return { 
      success: true, 
      data: {
        totalReports: allReports.length,
        totalCommercials: groupedReports.length,
        reportsByUser: groupedReports,
      }
    };
  } catch (error) {
    console.error("Error fetching rapport rendez-vous by user:", error);
    return { success: false, error: "Failed to fetch rapport rendez-vous" };
  }
}

