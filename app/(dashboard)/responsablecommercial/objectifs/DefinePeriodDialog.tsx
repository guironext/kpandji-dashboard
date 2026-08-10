"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, DollarSign, Users, Car, Clock } from "lucide-react";
import { toast } from "sonner";
import { createObjectifPeriod } from "@/lib/actions/objectif-period";
import { fetchWithRetry } from "@/lib/utils";

function getDefaultPeriodDates(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDuree(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 31) return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  const months = Math.round(diffDays / 30);
  return `${months} mois`;
}

export function DefinePeriodDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [duree, setDuree] = useState<string>("");
  const [objectifFinanciere, setObjectifFinanciere] = useState<string>("");
  const [objectifClients, setObjectifClients] = useState<string>("");
  const [volumeVehicule, setVolumeVehicule] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const def = getDefaultPeriodDates();
      setStart(def.start.toISOString().slice(0, 10));
      setEnd(def.end.toISOString().slice(0, 10));
      setDuree(formatDuree(def.start, def.end));
      setObjectifFinanciere("");
      setObjectifClients("");
      setVolumeVehicule("");
    }
  };

  const handleDatesChange = (newStart?: string, newEnd?: string) => {
    const s = newStart ?? start;
    const e = newEnd ?? end;
    if (s && e) {
      const startDate = new Date(s);
      const endDate = new Date(e);
      if (startDate <= endDate) {
        setDuree(formatDuree(startDate, endDate));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
      toast.error("Veuillez sélectionner les dates de début et de fin");
      return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate > endDate) {
      toast.error("La date de début doit être antérieure à la date de fin");
      return;
    }
    const objectif_duree = duree || formatDuree(startDate, endDate);
    setSubmitting(true);
    try {
      const result = await createObjectifPeriod({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        duree: objectif_duree,
        objectifFinanciere: objectifFinanciere.trim(),
        objectifClients: objectifClients.trim(),
        volumeVehicule: volumeVehicule.trim(),
      });

      if (result.success && result.data) {
        setOpen(false);
        toast.success("Période définie avec succès");
        window.dispatchEvent(new CustomEvent("objectif-period-created", { detail: result.data }));
        onCreated?.();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNetworkError =
        msg.includes("fetch") ||
        msg.includes("network") ||
        msg.includes("Failed to fetch") ||
        msg.includes("Load failed");
      if (process.env.NODE_ENV === "development") {
        console.error("[DefinePeriodDialog] Erreur création période:", err);
      }
      if (isNetworkError) {
        try {
          const res = await fetchWithRetry("/api/objectifs-periods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              duree: objectif_duree,
              objectifFinanciere: objectifFinanciere.trim(),
              objectifClients: objectifClients.trim(),
              volumeVehicule: volumeVehicule.trim(),
            }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            setOpen(false);
            toast.success("Période définie avec succès");
            window.dispatchEvent(new CustomEvent("objectif-period-created", { detail: json.data }));
            onCreated?.();
            return;
          }
          toast.error(json.error || "Erreur lors de la création");
        } catch {
          toast.error(
            "Connexion impossible. Vérifiez que le serveur tourne (npm run dev) et réessayez."
          );
        }
      } else {
        toast.error(msg || "Erreur lors de la création de la période.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:from-amber-600 hover:to-orange-700 border-0"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Définir Période
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden [&>button]:text-white [&>button]:opacity-90 [&>button:hover]:opacity-100">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#061f5a] to-[#0a2d6e] px-6 pt-6 pb-5">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(251,191,36,0.04)_50%,transparent_100%)]" />
          <div className="relative">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30">
                  <CalendarIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Définir une période d&apos;objectif
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 mt-0.5">
                    Renseignez la période et les objectifs
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Section: Période */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Période
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period-start" className="text-slate-700 font-medium">
                    Date de début
                  </Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={start}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStart(v);
                      handleDatesChange(v, end);
                    }}
                    onBlur={() => handleDatesChange()}
                    required
                    className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period-end" className="text-slate-700 font-medium">
                    Date de fin
                  </Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={end}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEnd(v);
                      handleDatesChange(start, v);
                    }}
                    onBlur={() => handleDatesChange()}
                    required
                    className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-duree" className="text-slate-700 font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Durée
                </Label>
                <Input
                  id="period-duree"
                  type="text"
                  value={duree}
                  onChange={(e) => setDuree(e.target.value)}
                  placeholder="Ex: 1 mois"
                  className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Section: Objectifs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Objectifs
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objectif-financiere" className="text-slate-700 font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-teal-500" />
                    Objectif financière
                  </Label>
                  <Input
                    id="objectif-financiere"
                    type="text"
                    value={objectifFinanciere}
                    onChange={(e) => setObjectifFinanciere(e.target.value)}
                    placeholder="Ex: 10 000 000 FCFA"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectif-clients" className="text-slate-700 font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-500" />
                    Objectif Clients / Prospects
                  </Label>
                  <Input
                    id="objectif-clients"
                    type="text"
                    value={objectifClients}
                    onChange={(e) => setObjectifClients(e.target.value)}
                    placeholder="Ex: 50 prospects"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume-vehicule" className="text-slate-700 font-medium flex items-center gap-2">
                    <Car className="h-4 w-4 text-sky-500" />
                    Volume de véhicule
                  </Label>
                  <Input
                    id="volume-vehicule"
                    type="text"
                    value={volumeVehicule}
                    onChange={(e) => setVolumeVehicule(e.target.value)}
                    placeholder="Ex: 5 véhicules"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-lg border-slate-200 hover:bg-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:from-amber-600 hover:to-orange-700 border-0 px-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="animate-pulse">Enregistrement...</span>
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
