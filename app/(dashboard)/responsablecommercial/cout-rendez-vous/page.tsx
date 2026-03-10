"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getReservationsVehiculeConfirmees,
  type ReservationVehiculeConfirmee,
} from "@/lib/actions/reservation-vehicule";
import { formatNumberWithSpaces } from "@/lib/utils";
import {
  Car,
  RefreshCw,
  AlertCircle,
  MapPin,
  User,
  DollarSign,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCommercial(r: ReservationVehiculeConfirmee) {
  const fn = r.User?.firstName ?? "";
  const ln = r.User?.lastName ?? "";
  return `${fn} ${ln}`.trim() || "—";
}

function formatCout(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return formatNumberWithSpaces(value);
}

export default function CoutRendezVousPage() {
  const [data, setData] = useState<ReservationVehiculeConfirmee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getReservationsVehiculeConfirmees();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error ?? "Erreur lors du chargement");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await getReservationsVehiculeConfirmees();
      if (result.success && result.data) {
        setData(result.data);
        toast.success("Données actualisées");
      } else {
        toast.error(result.error ?? "Erreur lors de l'actualisation");
      }
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setRefreshing(false);
    }
  };

  const totalCoutTransport = data.reduce(
    (sum, r) => sum + (r.coutTransport ?? 0),
    0
  );
  const avgCout =
    data.length > 0 ? totalCoutTransport / data.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-slate-200 flex items-center justify-center">
              <Car className="h-10 w-10 text-teal-600" />
            </div>
            <div className="absolute -inset-3 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-800 font-semibold text-lg">
              Chargement des coûts
            </p>
            <p className="text-slate-500 text-sm">
              Récupération des réservations confirmées...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-2 border-red-200 bg-red-50/50 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
                <p className="text-red-700/90">{error}</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={fetchData}
                className="border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 shadow-xl shadow-teal-500/25 ring-1 ring-white/30 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.15)_100%)]" />
                <Car className="h-10 w-10 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Coût des rendez-vous
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                  Réservations véhicule confirmées • Coûts de transport
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 font-medium rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 shrink-0"
            >
              <RefreshCw
                className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-teal-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Réservations
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {data.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 group-hover:bg-teal-100 transition-colors">
                  <FileSpreadsheet className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </div>
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-emerald-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total transport
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCout(totalCoutTransport)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">FCFA</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-cyan-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Moyenne / RDV
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCout(avgCout)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">FCFA</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-50 group-hover:bg-cyan-100 transition-colors">
                  <Car className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </div>
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-slate-200/80 transition-all duration-300 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Statut
                  </p>
                  <p className="text-lg font-bold text-teal-600 mt-2">
                    Confirmées
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 group-hover:bg-teal-100 transition-colors">
                  <MapPin className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Détail des réservations
            </h2>
          </div>

          <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/80 to-green-50/80 px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Par commercial, destination et moyen de transport
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.length} réservation
                    {data.length !== 1 ? "s" : ""} confirmée
                    {data.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              {data.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-20 mx-6 mb-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                    <Car className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-semibold text-lg">
                    Aucune réservation confirmée
                  </p>
                  <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                    Les réservations véhicule avec statut confirmé apparaîtront
                    ici avec leurs coûts de transport.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/95 hover:bg-slate-50/95 border-b-2 border-slate-200">
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider py-4">
                          Commercial
                        </TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider py-4">
                          Destination
                        </TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider py-4">
                          Moyen de transport
                        </TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider py-4 text-right">
                          Coût transport
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((r, idx) => (
                        <TableRow
                          key={r.id}
                          className={`transition-colors hover:bg-teal-50/40 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <TableCell className="font-medium text-slate-800 py-4">
                            <span className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 text-sm font-semibold">
                                {formatCommercial(r)
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                              {formatCommercial(r)}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-700 py-4">
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                              {r.destination || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            {r.moyenTransport ? (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-700 border-slate-200 font-medium"
                              >
                                {r.moyenTransport}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-slate-800 py-4">
                            {formatCout(r.coutTransport)}
                            <span className="text-slate-500 font-normal text-xs ml-1">
                              FCFA
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-gradient-to-r from-teal-50 to-emerald-50/80 border-t-2 border-teal-200/60 hover:bg-teal-50">
                        <TableCell
                          colSpan={3}
                          className="font-bold text-slate-800 py-4 text-right"
                        >
                          Total coût transport
                        </TableCell>
                        <TableCell className="text-right font-bold text-teal-700 text-lg tabular-nums py-4">
                          {formatCout(totalCoutTransport)}
                          <span className="text-slate-600 font-normal text-sm ml-1">
                            FCFA
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
