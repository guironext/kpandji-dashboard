"use client";

import React, { useState, useEffect } from "react";
import { getAllPointagesGroupedByDay } from "@/lib/actions/pointage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, LogOut, LogIn } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function formatDureeTravail(heureEntree: Date | string, heureSortie: Date | string): string {
  const entree = new Date(heureEntree).getTime();
  const sortie = new Date(heureSortie).getTime();
  if (sortie <= entree) return "—";
  const diffMs = sortie - entree;
  const heures = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (heures > 0 && minutes > 0) return `${heures}h ${minutes}min`;
  if (heures > 0) return `${heures}h`;
  return `${minutes}min`;
}

export default function RapportPointagePage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAllPointagesGroupedByDay>>["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getAllPointagesGroupedByDay();
      setLoading(false);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Erreur lors du chargement");
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Rapport de pointage
            </h1>
            <p className="mt-1 text-slate-600">
              Tous les pointages regroupés par jour (du plus récent au plus ancien)
            </p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-6xl mx-auto p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Rapport de pointage
          </h1>
          <p className="mt-1 text-slate-600">
            Tous les pointages regroupés par jour (du plus récent au plus ancien)
          </p>
        </div>

        {data.length === 0 ? (
          <Card className="border shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <CalendarDays className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">Aucun pointage enregistré</p>
              <p className="text-sm text-slate-500 mt-1">
                Les pointages apparaîtront ici une fois enregistrés
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {data.map((dayGroup) => {
              const closedCount = dayGroup.pointages.filter(
                (p) => new Date(p.heure_sortie).getTime() > new Date(p.heure_entree).getTime()
              ).length;
              return (
                <Card key={dayGroup.date} className="border shadow-md bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CalendarDays className="h-5 w-5 text-slate-600" />
                          {dayGroup.dateFormatted}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {dayGroup.pointages.length} pointage(s) • {closedCount} sortie(s) enregistrée(s)
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="px-3 py-1">
                          {dayGroup.pointages.length} total
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 text-amber-700 border-amber-200 bg-amber-50">
                          {closedCount} sorties
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                            <TableHead className="w-14 font-semibold text-slate-600">#</TableHead>
                            <TableHead className="font-semibold text-slate-600">
                              <User className="inline h-4 w-4 mr-1.5 text-slate-500" />
                              Nom
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600">
                              <User className="inline h-4 w-4 mr-1.5 text-slate-500" />
                              Prénoms
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600">Poste</TableHead>
                            <TableHead className="font-semibold text-slate-600">Matricule</TableHead>
                            <TableHead className="font-semibold text-slate-600">
                              <LogIn className="inline h-4 w-4 mr-1.5 text-slate-500" />
                              Entrée
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600">
                              <LogOut className="inline h-4 w-4 mr-1.5 text-slate-500" />
                              Sortie
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600">Durée de travail</TableHead>
                            <TableHead className="w-24 font-semibold text-slate-600">Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayGroup.pointages.map((p, idx) => {
                            const hasSortie =
                              new Date(p.heure_sortie).getTime() > new Date(p.heure_entree).getTime();
                            return (
                              <TableRow
                                key={p.id}
                                className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                              >
                                <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                                <TableCell className="font-medium text-slate-900">{p.nom}</TableCell>
                                <TableCell className="text-slate-700">{p.prenoms}</TableCell>
                                <TableCell className="text-slate-600">{p.poste ?? "—"}</TableCell>
                                <TableCell className="font-mono text-sm text-slate-600">
                                  {p.numro_matricule ?? "—"}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {format(new Date(p.heure_entree), "HH:mm:ss", { locale: fr })}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {hasSortie ? (
                                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      {format(new Date(p.heure_sortie), "HH:mm:ss", { locale: fr })}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-slate-700">
                                  {formatDureeTravail(p.heure_entree, p.heure_sortie)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={hasSortie ? "secondary" : "outline"}
                                    className={
                                      hasSortie
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }
                                  >
                                    {hasSortie ? "Terminé" : "En cours"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
