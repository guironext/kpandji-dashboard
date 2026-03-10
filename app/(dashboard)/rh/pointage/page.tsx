"use client";

import React, { useState, useEffect, useCallback } from "react";
import { recordPointage, recordPointageSortie, getPointagesByDate } from "@/lib/actions/pointage";
import { QRScanner } from "@/components/QRScanner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Calendar, Clock, User, LogOut, LogIn, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PointageRow {
  id: string;
  nom: string;
  prenoms: string;
  numro_matricule: string | null;
  heure_entree: Date;
  heure_sortie: Date;
}

type ScannerMode = "entree" | "sortie" | null;

export default function PointagePage() {
  const [showScanner, setShowScanner] = useState<ScannerMode>(null);
  const [pointages, setPointages] = useState<PointageRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);

  const loadPointages = useCallback(async (date: Date) => {
    setLoading(true);
    const result = await getPointagesByDate(date);
    setLoading(false);
    if (result.success && result.data) {
      setPointages(
        result.data.map((p) => ({
          ...p,
          heure_entree: p.heure_entree != null ? new Date(p.heure_entree) : new Date(0),
          heure_sortie: p.heure_sortie != null ? new Date(p.heure_sortie) : new Date(0),
        }))
      );
    } else {
      setPointages([]);
    }
  }, []);

  useEffect(() => {
    loadPointages(selectedDate);
  }, [selectedDate, loadPointages]);

  const handleScanEntree = async (data: string) => {
    setShowScanner(null);
    const result = await recordPointage(data);
    if (result.success) {
      toast.success(
        `Entrée enregistrée: ${result.data?.nom} ${result.data?.prenoms} à ${result.data?.heure_entree ? format(new Date(result.data.heure_entree), "HH:mm:ss", { locale: fr }) : ""}`
      );
      loadPointages(selectedDate);
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
  };

  const handleScanSortie = async (data: string) => {
    setShowScanner(null);
    const result = await recordPointageSortie(data);
    if (result.success) {
      toast.success(
        `Sortie enregistrée: ${result.data?.nom} ${result.data?.prenoms} à ${result.data?.heure_sortie ? format(new Date(result.data.heure_sortie), "HH:mm:ss", { locale: fr }) : ""}`
      );
      loadPointages(selectedDate);
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
  };

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const closedCount = pointages.filter((p) => p.heure_sortie.getTime() > p.heure_entree.getTime()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Pointage des employés
            </h1>
            <p className="mt-1 text-slate-600">
              Enregistrez les entrées et sorties via QR code
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </span>
          </div>
        </div>

        {/* Scanner cards - side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <LogIn className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Pointage d&apos;entrée</CardTitle>
                  <CardDescription className="text-emerald-100/90 text-sm mt-0.5">
                    Scannez le matricule pour enregistrer l&apos;arrivée
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowScanner("entree")}
                size="lg"
                className="w-full bg-white text-emerald-700 hover:bg-emerald-50 shadow-md gap-2 font-semibold"
              >
                <QrCode className="h-5 w-5" />
                Scanner le QR code
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <LogOut className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Pointage de sortie</CardTitle>
                  <CardDescription className="text-amber-100/90 text-sm mt-0.5">
                    Scannez le matricule pour enregistrer le départ
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowScanner("sortie")}
                size="lg"
                variant="outline"
                className="w-full border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60 backdrop-blur-sm gap-2 font-semibold"
              >
                <QrCode className="h-5 w-5" />
                Scanner le QR code
              </Button>
            </CardContent>
          </Card>
        </div>

        {showScanner && (
          <QRScanner
            onScan={showScanner === "entree" ? handleScanEntree : handleScanSortie}
            onClose={() => setShowScanner(null)}
          />
        )}

        {/* Stats & Table */}
        <Card className="border shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  Pointages
                </CardTitle>
                <CardDescription className="mt-1">
                  Sélectionnez une date pour afficher les enregistrements
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                {!loading && (
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                      {pointages.length} total
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-amber-700 border-amber-200 bg-amber-50">
                      {closedCount} sorties
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : pointages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-slate-100 mb-4">
                  <Clock className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700">Aucun pointage pour cette date</p>
                <p className="text-sm text-slate-500 mt-1">
                  Utilisez les boutons ci-dessus pour enregistrer des entrées et sorties
                </p>
              </div>
            ) : (
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
                      <TableHead className="font-semibold text-slate-600">Matricule</TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        <Clock className="inline h-4 w-4 mr-1.5 text-slate-500" />
                        Entrée
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        <LogOut className="inline h-4 w-4 mr-1.5 text-slate-500" />
                        Sortie
                      </TableHead>
                      <TableHead className="w-24 font-semibold text-slate-600">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointages.map((p, idx) => {
                      const hasSortie = p.heure_sortie.getTime() > p.heure_entree.getTime();
                      return (
                        <TableRow
                          key={p.id}
                          className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                        >
                          <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-slate-900">{p.nom}</TableCell>
                          <TableCell className="text-slate-700">{p.prenoms}</TableCell>
                          <TableCell className="font-mono text-sm text-slate-600">
                            {p.numro_matricule ?? "—"}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {format(p.heure_entree, "HH:mm:ss", { locale: fr })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {hasSortie ? (
                              <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {format(p.heure_sortie, "HH:mm:ss", { locale: fr })}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
