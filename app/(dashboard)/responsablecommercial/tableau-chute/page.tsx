import React from "react";
import {
  getTableauChuteRendezVousByObjectifPeriodAndCommercial,
  type TableauChuteByPeriodAndCommercialData,
} from "@/lib/actions/tableau-chute";
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
import { TableauChuteRendezVousTable } from "@/components/TableauChuteRendezVousTable";
import {
  TrendingDown,
  Calendar,
  AlertCircle,
  Users,
  CalendarDays,
} from "lucide-react";

export default async function TableauChutePage() {
  const result = await getTableauChuteRendezVousByObjectifPeriodAndCommercial();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 p-6">
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
                    {result.error || "Impossible de charger le tableau de chute"}
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
  const totalChutes = periods.reduce(
    (sum, p) =>
      sum + p.commercials.reduce((s, c) => s + c.totalChutes, 0),
    0
  );
  const totalCommercials = new Set(
    periods.flatMap((p) => p.commercials.map((c) => c.commercialId))
  ).size;
  const totalMonths = new Set(
    periods.flatMap((p) =>
      p.commercials.flatMap((c) => c.months.map((m) => m.mois_chute)))
  ).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 space-y-8 max-w-[1800px] mx-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl">
                <TrendingDown className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-amber-900 to-orange-900 bg-clip-text text-transparent">
                Tableau de Chute
              </h1>
              <p className="text-muted-foreground mt-2 text-lg font-medium">
                Par période objectif, par commercial et par mois
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <TrendingDown className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-50 uppercase tracking-wide">
                Total Chutes
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{totalChutes}</div>
              <div className="flex items-center gap-2 text-amber-100 text-sm">
                <TrendingDown className="h-4 w-4" />
                <span>Rendez-vous en chute</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <Calendar className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-orange-50 uppercase tracking-wide">
                Périodes
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{periods.length}</div>
              <div className="flex items-center gap-2 text-orange-100 text-sm">
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
                <span>Conseillers avec chutes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white overflow-hidden relative hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <CalendarDays className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-sky-50 uppercase tracking-wide">
                Mois distincts
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold mb-2">{totalMonths}</div>
              <div className="flex items-center gap-2 text-sky-100 text-sm">
                <CalendarDays className="h-4 w-4" />
                <span>Mois de chute</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-amber-50 to-orange-50 border-b border-slate-200">
            <div className="space-y-1">
              <CardTitle className="text-3xl flex items-center gap-3 font-bold">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                Chutes par période, commercial et mois
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Consultez les rendez-vous en chute regroupés par période objectif, puis par conseiller commercial et par mois
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {periods.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-6">
                  <TrendingDown className="h-16 w-16 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">
                  Aucune chute trouvée
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  Il n&apos;y a aucun rendez-vous en chute pour le moment.
                  Les chutes apparaîtront ici une fois signalées par les conseillers commerciaux.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {periods.map((period: TableauChuteByPeriodAndCommercialData) => {
                  const periodChutesCount = period.commercials.reduce(
                    (s, c) => s + c.totalChutes,
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
                            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                              <span className="font-semibold text-lg text-slate-800">
                                {period.periodLabel}
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {period.commercials.length} commercial(aux) · {periodChutesCount} chute(s)
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-6 pb-6 pt-2 border-t">
                          {period.commercials.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">
                              Aucune chute pour cette période
                            </p>
                          ) : (
                            <div className="space-y-6">
                              {period.commercials.map((commercial) => (
                                <Accordion
                                  key={commercial.commercialId}
                                  type="single"
                                  collapsible
                                  className="border rounded-lg overflow-hidden"
                                >
                                  <AccordionItem
                                    value={commercial.commercialId}
                                    className="border-0"
                                  >
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50">
                                      <div className="flex items-center justify-between w-full pr-4">
                                        <div className="flex items-center gap-3">
                                          <div className="p-1.5 bg-amber-100 rounded-lg">
                                            <Users className="h-4 w-4 text-amber-600" />
                                          </div>
                                          <span className="font-medium text-slate-800">
                                            {commercial.commercialName}
                                          </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                          {commercial.totalChutes} chute(s) · {commercial.months.length} mois
                                        </span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="px-4 pb-4 pt-2 space-y-4">
                                        {commercial.months.map((month) => (
                                          <div
                                            key={month.mois_chute}
                                            className="space-y-3"
                                          >
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 border-b pb-2">
                                              <CalendarDays className="h-4 w-4" />
                                              {month.mois_chute}
                                              <span className="text-muted-foreground font-normal">
                                                ({month.items.length} chute{month.items.length > 1 ? "s" : ""})
                                              </span>
                                            </div>
                                            <TableauChuteRendezVousTable
                                              data={month.items}
                                              showReporterButton={false}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ))}
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
