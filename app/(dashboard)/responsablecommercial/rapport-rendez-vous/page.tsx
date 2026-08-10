import React from "react";
import {
  getRapportRendezVousByObjectifPeriodAndCommercial,
  type RapportRendezVousByPeriodAndCommercialData,
} from "@/lib/actions/rapport-rendez-vous-analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RapportAccordion } from "@/components/RapportAccordion";
import { ExportReportsWrapper } from "@/components/ExportReportsWrapper";
import {
  FileText,
  Calendar,
  AlertCircle,
  Users,
  Activity,
} from "lucide-react";

export default async function RapportRendezVousPage() {
  const result = await getRapportRendezVousByObjectifPeriodAndCommercial();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
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

  const { periods } = result.data;
  const totalReports = periods.reduce(
    (sum, p) => sum + p.commercials.reduce((s, c) => s + c.totalReports, 0),
    0
  );
  const totalCommercials = new Set(
    periods.flatMap((p) => p.commercials.map((c) => c.conseiller_commercial))
  ).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 space-y-8 max-w-[1800px] mx-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Rapports de Rendez-vous
              </h1>
              <p className="text-muted-foreground mt-2 text-lg font-medium">
                Par période objectif et par commercial
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <FileText className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-blue-50 uppercase tracking-wide">
                Total Rapports
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{totalReports}</div>
              <div className="flex items-center gap-2 text-blue-100 text-sm">
                <Activity className="h-4 w-4" />
                <span>Tous les rapports</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <Calendar className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-indigo-50 uppercase tracking-wide">
                Périodes
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{periods.length}</div>
              <div className="flex items-center gap-2 text-indigo-100 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Périodes objectif</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <Users className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-50 uppercase tracking-wide">
                Commerciaux
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{totalCommercials}</div>
              <div className="flex items-center gap-2 text-emerald-100 text-sm">
                <Users className="h-4 w-4" />
                <span>Conseillers actifs</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200">
            <div className="space-y-1">
              <CardTitle className="text-3xl flex items-center gap-3 font-bold">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                Rapports par période et par commercial
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Consultez les rapports de rendez-vous regroupés par période objectif puis par conseiller commercial
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {periods.length === 0 ? (
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
              <Accordion type="single" collapsible className="space-y-4">
                {periods.map((period: RapportRendezVousByPeriodAndCommercialData) => {
                  const periodReportsCount = period.commercials.reduce(
                    (s, c) => s + c.totalReports,
                    0
                  );
                  return (
                    <AccordionItem
                      key={period.periodId}
                      value={period.periodId}
                      className="border rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow bg-white"
                    >
                      <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                              <span className="font-semibold text-lg text-slate-800">
                                {period.periodLabel}
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {period.commercials.length} commercial(aux) · {periodReportsCount} rapport(s)
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-6 pb-6 pt-2 border-t">
                          {period.commercials.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">
                              Aucun rapport pour cette période
                            </p>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex justify-end mb-4">
                                <ExportReportsWrapper
                                  reportsByUser={period.commercials}
                                />
                              </div>
                              <RapportAccordion
                                reportsByUser={period.commercials}
                              />
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
