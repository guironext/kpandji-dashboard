import React from "react";
import Link from "next/link";
import { getAllRapportRendezVous } from "@/lib/actions/rendezvous";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Users,
  FileText,
  AlertCircle,
  UserCircle,
  Sparkles,
  TrendingUp,
  BarChart3,
  Target,
  Star,
  Activity,
  Building2,
  Award,
  ArrowLeft,
} from "lucide-react";
import { RapportAccordion } from "@/components/RapportAccordion";
import { ExportReportsWrapper } from "@/components/ExportReportsWrapper";
import { Badge } from "@/components/ui/badge";

interface RapportRendezVousData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string | null;
  type_client: string;
  lieu_rendez_vous: string;
  lieu_autre?: string | null;
  conseiller_commercial: string;
  profession_societe?: string | null;
  degre_interet?: string | null;
  motivations_achat?: string | null;
  points_positifs?: string | null;
  objections_freins?: string | null;
  commentaire_global?: string | null;
  decision_attendue?: string | null;
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  devis_offre_remise: boolean;
  voiture?: {
    id: string;
    couleur?: string;
    motorisation?: string;
    transmission?: string;
    voitureModel?: {
      model: string;
    };
  } | null;
}

interface Report {
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
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  devis_offre_remise: boolean;
  createdAt: Date;
  updatedAt: Date;
  voiture?: {
    id: string;
    couleur: string;
    motorisation: string;
    transmission: string;
    voitureModel?: {
      model: string;
    };
  } | null;
}

interface ReportsByUser {
  conseiller_commercial: string;
  totalReports: number;
  reports: Report[];
}

const RapportsRendezVousPage = async () => {
  const result = await getAllRapportRendezVous();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Link href="/manager/departements">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow border-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-700">Erreur</CardTitle>
                  <CardDescription className="text-red-600">
                    {result.error || "Impossible de charger les rapports de rendez-vous"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Group by conseiller_commercial and sort by date (newest first)
  const groupedByCommercial = new Map<string, RapportRendezVousData[]>();

  result.data.forEach((rapport: unknown) => {
    const r = rapport as RapportRendezVousData;
    const commercial = r.conseiller_commercial || "Non assigné";
    
    if (!groupedByCommercial.has(commercial)) {
      groupedByCommercial.set(commercial, []);
    }
    
    groupedByCommercial.get(commercial)!.push(r);
  });

  // Sort each group by date_rendez_vous (newest first)
  groupedByCommercial.forEach((reports) => {
    reports.sort((a, b) => {
      const dateA = new Date(a.date_rendez_vous).getTime();
      const dateB = new Date(b.date_rendez_vous).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  });

  // Convert to array format expected by RapportAccordion
  const reportsByUser: ReportsByUser[] = Array.from(groupedByCommercial.entries()).map(
    ([conseiller_commercial, reports]) => ({
      conseiller_commercial,
      totalReports: reports.length,
      reports: reports.map((r): Report => ({
        id: r.id,
        date_rendez_vous: r.date_rendez_vous,
        heure_rendez_vous: r.heure_rendez_vous,
        duree_rendez_vous: r.duree_rendez_vous,
        nom_prenom_client: r.nom_prenom_client,
        telephone_client: r.telephone_client,
        email_client: r.email_client ?? null,
        type_client: r.type_client,
        lieu_rendez_vous: r.lieu_rendez_vous,
        lieu_autre: r.lieu_autre ?? null,
        profession_societe: r.profession_societe ?? null,
        degre_interet: r.degre_interet ?? null,
        motivations_achat: r.motivations_achat ?? null,
        points_positifs: r.points_positifs ?? null,
        objections_freins: r.objections_freins ?? null,
        commentaire_global: r.commentaire_global ?? null,
        decision_attendue: r.decision_attendue ?? null,
        presentation_gamme: r.presentation_gamme,
        essai_vehicule: r.essai_vehicule,
        negociation_commerciale: r.negociation_commerciale,
        livraison_vehicule: r.livraison_vehicule,
        service_apres_vente: r.service_apres_vente,
        devis_offre_remise: r.devis_offre_remise,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        voiture: r.voiture ? {
          id: r.voiture.id,
          couleur: r.voiture.couleur ?? "",
          motorisation: r.voiture.motorisation ?? "",
          transmission: r.voiture.transmission ?? "",
          voitureModel: r.voiture.voitureModel,
        } : null,
      })),
    })
  );

  // Sort groups by commercial name alphabetically
  reportsByUser.sort((a, b) =>
    a.conseiller_commercial.localeCompare(b.conseiller_commercial)
  );

  const totalReports = result.data.length;
  const totalCommercials = reportsByUser.length;
  
  // Calculate comprehensive statistics
  const allReports = reportsByUser.flatMap((u) => u.reports);
  const highInterest = allReports.filter(
    (r) =>
      r.degre_interet?.toLowerCase().includes("élevé") ||
      r.degre_interet?.toLowerCase().includes("fort")
  ).length;
  const mediumInterest = allReports.filter((r) =>
    r.degre_interet?.toLowerCase().includes("moyen")
  ).length;
  const lowInterest = allReports.length - highInterest - mediumInterest;
  
  const avgReportsPerUser = totalCommercials > 0
    ? (totalReports / totalCommercials).toFixed(1)
    : "0";
  
  const entreprisesCount = allReports.filter(
    (r) => r.type_client === "ENTREPRISE"
  ).length;
  const particuliersCount = allReports.filter(
    (r) => r.type_client !== "ENTREPRISE"
  ).length;
  
  const withDevis = allReports.filter((r) => r.devis_offre_remise).length;
  const withTestDrive = allReports.filter((r) => r.essai_vehicule).length;
  
  // Get top performer
  const topPerformer = reportsByUser.reduce((top, current) =>
    current.totalReports > top.totalReports ? current : top,
    reportsByUser[0] || { conseiller_commercial: "N/A", totalReports: 0 }
  );

  // Calculate recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReports = allReports.filter(
    (r) => new Date(r.date_rendez_vous) >= thirtyDaysAgo
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative p-6 space-y-8 max-w-[1800px] mx-auto">
        {/* Enhanced Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager/departements">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-blue-200 hover:border-blue-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Rapports de Rendez-vous
                  </h1>
                  <p className="text-muted-foreground mt-2 text-lg font-medium">
                    Analyse complète et détaillée des performances commerciales
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="px-4 py-2 text-sm bg-white/80 backdrop-blur-sm border-blue-200">
              <Activity className="h-4 w-4 mr-2 text-blue-600" />
              {recentReports} rapports ce mois
            </Badge>
          </div>
        </div>

        {/* Enhanced Statistics Cards - Main Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <FileText className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-blue-50 uppercase tracking-wide">
                Total Rapports
              </CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <FileText className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{totalReports}</div>
              <div className="flex items-center gap-2 text-blue-100 text-sm">
                <Activity className="h-4 w-4" />
                <span>Tous les rapports enregistrés</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <UserCircle className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-indigo-50 uppercase tracking-wide">
                Conseillers Actifs
              </CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{totalCommercials}</div>
              <div className="flex items-center gap-2 text-indigo-100 text-sm">
                <UserCircle className="h-4 w-4" />
                <span>Conseillers commerciaux</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <TrendingUp className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-50 uppercase tracking-wide">
                Moyenne par Conseiller
              </CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{avgReportsPerUser}</div>
              <div className="flex items-center gap-2 text-emerald-100 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>Rapports par conseiller</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <Star className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-50 uppercase tracking-wide">
                Intérêt Élevé
              </CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{highInterest}</div>
              <div className="flex items-center gap-2 text-amber-100 text-sm">
                <Target className="h-4 w-4" />
                <span>Prospects chauds identifiés</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Statistics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Intérêt Moyen</p>
                  <p className="text-3xl font-bold text-amber-600">{mediumInterest}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Intérêt Faible</p>
                  <p className="text-3xl font-bold text-slate-600">{lowInterest}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl">
                  <Activity className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avec Devis</p>
                  <p className="text-3xl font-bold text-emerald-600">{withDevis}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Essais Véhicules</p>
                  <p className="text-3xl font-bold text-blue-600">{withTestDrive}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Type Distribution */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Clients Entreprise</p>
                  <p className="text-3xl font-bold text-indigo-600">{entreprisesCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalReports > 0 ? ((entreprisesCount / totalReports) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Clients Particuliers</p>
                  <p className="text-3xl font-bold text-blue-600">{particuliersCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalReports > 0 ? ((particuliersCount / totalReports) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Top Performer</p>
                  <p className="text-lg font-bold text-amber-600 truncate max-w-[120px]">
                    {topPerformer.conseiller_commercial}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topPerformer.totalReports} rapports
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Section */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl flex items-center gap-3 font-bold">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Rapports par Conseiller Commercial
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Consultez et analysez les rapports de rendez-vous organisés par conseiller,
                  triés du plus récent au plus ancien
                </CardDescription>
              </div>
              <ExportReportsWrapper reportsByUser={reportsByUser} />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {reportsByUser.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-6">
                  <FileText className="h-16 w-16 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">
                  Aucun rapport trouvé
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  Il n&apos;y a aucun rapport de rendez-vous pour le moment.
                  Les rapports apparaîtront ici une fois créés par les conseillers commerciaux.
                </p>
              </div>
            ) : (
              <RapportAccordion reportsByUser={reportsByUser} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RapportsRendezVousPage;
