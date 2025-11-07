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
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  objet_autre: string | null;
  modeles_discutes: string | null;
  motivations_achat: string | null;
  points_positifs: string | null;
  objections_freins: string | null;
  degre_interet: string | null;
  decision_attendue: string | null;
  devis_offre_remise: boolean;
  reference_offre: string | null;
  financement_propose: string | null;
  assurance_entretien: string | null;
  reprise_ancien_vehicule: string | null;
  actions_suivi: string | null;
  commentaire_global: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: unknown;
  clientEntreprise: unknown;
  rendezVous: unknown;
  voiture: unknown;
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
        clients: {
          include: {
            rendez_vous: true,
            commandes: true,
            factures: true,
          },
        },
        client_entreprises: {
          include: {
            rendez_vous: true,
            commandes: true,
            factures: true,
          },
        },
        factures: true,
        paiements: true,
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

    commercials.forEach(commercial => {
      const clients = commercial.clients.length + commercial.client_entreprises.length;
      const prospects = [
        ...commercial.clients.filter(c => c.status_client === 'PROSPECT'),
        ...commercial.client_entreprises.filter(c => c.status_client === 'PROSPECT')
      ].length;
      
      const rendezVous = [
        ...commercial.clients.flatMap(c => c.rendez_vous),
        ...commercial.client_entreprises.flatMap(c => c.rendez_vous)
      ].length;
      
      const commandes = [
        ...commercial.clients.flatMap(c => c.commandes),
        ...commercial.client_entreprises.flatMap(c => c.commandes)
      ].length;
      
      const factures = commercial.factures.length;
      const revenue = commercial.factures.reduce((sum, f) => sum + Number(f.total_ttc), 0);

      stats.totalClients += clients;
      stats.totalProspects += prospects;
      stats.totalRendezVous += rendezVous;
      stats.totalCommandes += commandes;
      stats.totalFactures += factures;
      stats.totalRevenue += revenue;

      stats.commercialPerformance.push({
        id: commercial.id,
        name: `${commercial.firstName} ${commercial.lastName}`,
        email: commercial.email,
        telephone: commercial.telephone,
        clients,
        prospects,
        rendezVous,
        commandes,
        factures,
        revenue,
        conversionRate: prospects > 0 ? ((clients - prospects) / prospects * 100).toFixed(2) : 0,
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
          user: {
            role: "COMMERCIAL",
          },
        },
        include: {
          user: {
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
                user: {
                  role: "COMMERCIAL",
                },
              },
            },
            {
              clientEntreprise: {
                user: {
                  role: "COMMERCIAL",
                },
              },
            },
          ],
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          clientEntreprise: {
            include: {
              user: {
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
              client: {
                user: {
                  role: "COMMERCIAL",
                },
              },
            },
            {
              clientEntreprise: {
                user: {
                  role: "COMMERCIAL",
                },
              },
            },
          ],
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          clientEntreprise: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          voitureModel: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      
      // Recent factures
      prisma.facture.findMany({
        where: {
          user: {
            role: "COMMERCIAL",
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          client: true,
          clientEntreprise: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return { 
      success: true, 
      data: {
        recentClients,
        recentRendezVous,
        recentCommandes,
        recentFactures,
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
        clients: {
          include: {
            rendez_vous: true,
            commandes: true,
            factures: true,
            paiements: true,
          },
        },
        client_entreprises: {
          include: {
            rendez_vous: true,
            commandes: true,
            factures: true,
            paiements: true,
          },
        },
        factures: {
          include: {
            paiements: true,
          },
        },
        paiements: true,
      },
    });

    if (!commercial) {
      return { success: false, error: "Commercial not found" };
    }

    return { success: true, data: commercial };
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
        clients: {
          select: {
            createdAt: true,
            status_client: true,
          },
        },
        factures: {
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

      commercials.forEach(commercial => {
        // Count new clients in this month
        newClients += commercial.clients.filter(c => {
          const clientDate = new Date(c.createdAt);
          return clientDate.getMonth() === period.monthNumber && 
                 clientDate.getFullYear() === period.year;
        }).length;

        // Sum revenue from factures in this month
        revenue += commercial.factures
          .filter(f => {
            const factureDate = new Date(f.createdAt);
            return factureDate.getMonth() === period.monthNumber && 
                   factureDate.getFullYear() === period.year;
          })
          .reduce((sum, f) => sum + Number(f.total_ttc), 0);
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
        clients: {
          include: {
            rendez_vous: {
              include: {
                client: {
                  select: {
                    nom: true,
                    prenom: true,
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
        client_entreprises: {
          include: {
            rendez_vous: {
              include: {
                clientEntreprise: {
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

    const rendezVousByUser = commercials.map(commercial => {
      // Combine rendez-vous from both clients and client_entreprises
      const allRendezVous = [
        ...commercial.clients.flatMap(c => c.rendez_vous.map(rdv => ({
          ...rdv,
          clientName: `${c.prenom} ${c.nom}`,
          clientType: 'PARTICULIER' as const,
          clientPhone: rdv.client?.telephone || c.telephone,
          clientEmail: rdv.client?.email || c.email,
        }))),
        ...commercial.client_entreprises.flatMap(c => c.rendez_vous.map(rdv => ({
          ...rdv,
          clientName: rdv.clientEntreprise?.nom_entreprise || c.nom_entreprise,
          clientType: 'ENTREPRISE' as const,
          clientPhone: rdv.clientEntreprise?.telephone || c.telephone,
          clientEmail: rdv.clientEntreprise?.email || c.email,
        }))),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        userId: commercial.id,
        userName: `${commercial.firstName} ${commercial.lastName}`,
        userEmail: commercial.email,
        userPhone: commercial.telephone,
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
        client: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
          },
        },
        clientEntreprise: {
          select: {
            id: true,
            nom_entreprise: true,
            telephone: true,
            email: true,
          },
        },
        rendezVous: {
          select: {
            id: true,
            date: true,
            statut: true,
            resume_rendez_vous: true,
          },
        },
        voiture: {
          select: {
            id: true,
            couleur: true,
            motorisation: true,
            transmission: true,
            voitureModel: {
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

    allReports.forEach(report => {
      const commercialName = report.conseiller_commercial;
      
      if (!reportsByUser.has(commercialName)) {
        reportsByUser.set(commercialName, []);
      }
      
      reportsByUser.get(commercialName)?.push({
        id: report.id,
        date_rendez_vous: report.date_rendez_vous,
        heure_rendez_vous: report.heure_rendez_vous,
        lieu_rendez_vous: report.lieu_rendez_vous,
        lieu_autre: report.lieu_autre,
        duree_rendez_vous: report.duree_rendez_vous,
        nom_prenom_client: report.nom_prenom_client,
        telephone_client: report.telephone_client,
        email_client: report.email_client,
        profession_societe: report.profession_societe,
        type_client: report.type_client,
        presentation_gamme: report.presentation_gamme,
        essai_vehicule: report.essai_vehicule,
        negociation_commerciale: report.negociation_commerciale,
        livraison_vehicule: report.livraison_vehicule,
        service_apres_vente: report.service_apres_vente,
        objet_autre: report.objet_autre,
        modeles_discutes: report.modeles_discutes,
        motivations_achat: report.motivations_achat,
        points_positifs: report.points_positifs,
        objections_freins: report.objections_freins,
        degre_interet: report.degre_interet,
        decision_attendue: report.decision_attendue,
        devis_offre_remise: report.devis_offre_remise,
        reference_offre: report.reference_offre,
        financement_propose: report.financement_propose,
        assurance_entretien: report.assurance_entretien,
        reprise_ancien_vehicule: report.reprise_ancien_vehicule,
        actions_suivi: report.actions_suivi,
        commentaire_global: report.commentaire_global,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        client: report.client,
        clientEntreprise: report.clientEntreprise,
        rendezVous: report.rendezVous,
        voiture: report.voiture,
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

