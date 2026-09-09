import React from "react";
import { getRapportRendezVousByCommercialUsers } from "@/lib/actions/rendezvous";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  User,
  FileText,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  UserCircle,
  ClipboardList,
  Sparkles,
  BarChart3,
  Target,
  Star,
  Activity,
} from "lucide-react";
import { RapportAccordion } from "@/components/RapportAccordion";
import { ExportReportsWrapper } from "@/components/ExportReportsWrapper";
import type { ReportForExcel, ReportsByUserForExcel } from "@/lib/exportRapportExcel";

export default async function RapportRendezVousResponsablePage() {
  const result = await getRapportRendezVousByCommercialUsers();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-700">Erreur</CardTitle>
                <CardDescription className="text-red-600">
                  {result.error ||
                    "Impossible de charger les rapports de rendez-vous"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { totalReports, totalCommercials, reportsByUser: rawGroups } =
    result.data;

  const reportsByUser: ReportsByUserForExcel[] = rawGroups.map((group) => ({
    conseiller_commercial: group.conseiller_commercial,
    totalReports: group.totalReports,
    reports: group.reports.map(
      (r): ReportForExcel => ({
        id: r.id,
        date_rendez_vous: r.date_rendez_vous,
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
        objet_autre: r.objet_autre,
        modeles_discutes: r.modeles_discutes,
        devis_offre_remise: r.devis_offre_remise,
        propositions_faites: r.propositions_faites,
        reference_offre: r.reference_offre,
        financement_propose: r.financement_propose,
        assurance_entretien: r.assurance_entretien,
        reprise_ancien_vehicule: r.reprise_ancien_vehicule,
        suivi_actions: r.suivi_actions,
        actions_suivi: r.actions_suivi,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        voiture: r.voiture
          ? {
              id: r.voiture.id,
              couleur: r.voiture.couleur ?? "",
              motorisation: String(r.voiture.motorisation ?? ""),
              transmission: String(r.voiture.transmission ?? ""),
              voitureModel: r.voiture.voitureModel ?? undefined,
            }
          : null,
      })
    ),
  }));

  const avgReportsPerUser =
    totalCommercials > 0 ? (totalReports / totalCommercials).toFixed(1) : "0";

  const interestLevels = reportsByUser.flatMap((u) =>
    u.reports.map((r) => r.degre_interet)
  );
  const highInterest = interestLevels.filter(
    (i) =>
      i?.toLowerCase().includes("élevé") || i?.toLowerCase().includes("fort")
  ).length;
  const mediumInterest = interestLevels.filter((i) =>
    i?.toLowerCase().includes("moyen")
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Rapports de Rendez-vous
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Tous les rapports créés par les commerciaux
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 opacity-10">
              <FileText className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-50">
                Total Rapports
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{totalReports}</div>
              <p className="text-xs text-blue-100 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Rapports des commerciaux
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 opacity-10">
              <UserCircle className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-indigo-50">
                Commerciaux
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <User className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{totalCommercials}</div>
              <p className="text-xs text-indigo-100 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Utilisateurs avec des rapports
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 opacity-10">
              <TrendingUp className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-50">
                Moyenne
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{avgReportsPerUser}</div>
              <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Rapports par commercial
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 opacity-10">
              <Target className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-50">
                Intérêt Élevé
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Star className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{highInterest}</div>
              <p className="text-xs text-amber-100 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Prospects chauds
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intérêt Élevé</p>
                  <p className="text-2xl font-bold text-green-600">
                    {highInterest}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <ClipboardList className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intérêt Moyen</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {mediumInterest}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Autres</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalReports - highInterest - mediumInterest}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  Rapports par commercial
                </CardTitle>
                <CardDescription className="mt-2">
                  Liste de tous les rapports créés par les utilisateurs au rôle
                  commercial
                </CardDescription>
              </div>
              <ExportReportsWrapper reportsByUser={reportsByUser} />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {reportsByUser.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Aucun rapport trouvé
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Aucun rapport de rendez-vous n&apos;a encore été créé par les
                  commerciaux.
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
}
