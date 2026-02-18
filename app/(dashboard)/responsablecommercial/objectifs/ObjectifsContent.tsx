"use client";

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import {
  DollarSign,
  Car,
  Users,
  Target,
  Plus,
  BarChart3,
  Loader2,
  Calendar as CalendarIcon,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { formatNumberWithSpaces, fetchWithRetry } from "@/lib/utils";
import DatePicker, { registerLocale } from "react-datepicker";
import { fr as datePickerFr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { getCommercialActivitiesStats } from "@/lib/actions/superviseur";
import {
  createObjectifFinanciere,
  getObjectifsFinancieres,
  updateObjectifFinanciere,
  deleteObjectifFinanciere,
} from "@/lib/actions/objectif-financiere";
import {
  getObjectifPeriods,
  createObjectifPeriod,
  deleteObjectifPeriod,
} from "@/lib/actions/objectif-period";
import {
  getObjectifsCibles,
  createObjectifCible,
} from "@/lib/actions/objectif-cible";

registerLocale("fr", datePickerFr);

const TABS = [
  {
    id: "prospects",
    label: "Objectif Prospects et clients",
    icon: Users,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    id: "vente",
    label: "Objectif Vente véhicule",
    icon: Car,
    color: "from-sky-500 to-cyan-600",
    bgColor: "bg-sky-500/10",
    iconColor: "text-sky-600",
  },
  {
    id: "financiere",
    label: "Objectif Financières",
    icon: DollarSign,
    color: "from-teal-500 to-emerald-600",
    bgColor: "bg-teal-500/10",
    iconColor: "text-teal-600",
  },
];

interface ObjectifFinanciereData {
  id: string;
  nomDuCommercial: string;
  pole: string;
  duree: string;
  chiffreAffaire: number;
  finObjectif: string | null;
  pourcentageAtteint: number;
  ecartCible: number | null;
}

interface CommercialUser {
  id: string;
  fullName: string;
}

interface ObjectifCibleData {
  id: string;
  periodId: string;
  userId: string;
  commercialName: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  prospectCible: number;
  prospectReel: number;
  tauxAtteint: number;
}

interface ObjectifPeriod {
  id: string;
  start: Date;
  end: Date;
}

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

function parsePeriodFromApi(p: { id: string; start: Date | string; end: Date | string }): ObjectifPeriod {
  return {
    id: p.id,
    start: typeof p.start === "string" ? new Date(p.start) : p.start,
    end: typeof p.end === "string" ? new Date(p.end) : p.end,
  };
}

export function ObjectifsContent() {
  const [activeTab, setActiveTab] = useState("prospects");
  const [periods, setPeriods] = useState<ObjectifPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) ?? periods[0] ?? null;
  const periodStart = selectedPeriod?.start;
  const periodEnd = selectedPeriod?.end;

  const fetchPeriods = useCallback(async () => {
    setPeriodsLoading(true);
    try {
      const result = await getObjectifPeriods();
      if (result.success && result.data) {
        const parsed = result.data.map(parsePeriodFromApi);
        setPeriods(parsed);
        setSelectedPeriodId((prev) => {
          if (prev && parsed.some((p) => p.id === prev)) return prev;
          return parsed.length > 0 ? parsed[0].id : null;
        });
      } else {
        setPeriods([]);
      }
    } catch {
      toast.error("Impossible de charger les périodes");
      setPeriods([]);
    } finally {
      setPeriodsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  useEffect(() => {
    if (selectedPeriodId === null && periods.length > 0) {
      setSelectedPeriodId(periods[0].id);
    } else if (selectedPeriodId && !periods.some((p) => p.id === selectedPeriodId)) {
      setSelectedPeriodId(periods[0]?.id ?? null);
    }
  }, [periods, selectedPeriodId]);
  const [objectifs, setObjectifs] = useState<ObjectifFinanciereData[]>([]);
  const [commercialUsers, setCommercialUsers] = useState<CommercialUser[]>([]);
  const [objectifsCibles, setObjectifsCibles] = useState<ObjectifCibleData[]>([]);
  const [objectifsCiblesLoading, setObjectifsCiblesLoading] = useState(false);
  const [prospectCibleDialogOpen, setProspectCibleDialogOpen] = useState(false);
  const [prospectCibleFormData, setProspectCibleFormData] = useState({
    userId: "",
    prospectCible: "",
  });
  const [prospectCibleSubmitting, setProspectCibleSubmitting] = useState(false);
  const [venteStats, setVenteStats] = useState<{ name: string; commandes: number }[]>([]);
  const [venteLoading, setVenteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<ObjectifFinanciereData | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [definePeriodDialogOpen, setDefinePeriodDialogOpen] = useState(false);
  const [newPeriodStart, setNewPeriodStart] = useState<Date | undefined>();
  const [newPeriodEnd, setNewPeriodEnd] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    nomDuCommercial: "",
    pole: "",
    duree: "",
    chiffreAffaire: "",
    finObjectif: undefined as Date | undefined,
  });

  const fetchObjectifs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getObjectifsFinancieres();
      if (result.success && result.data) {
        setObjectifs(result.data);
      } else {
        setObjectifs([]);
      }
    } catch {
      toast.error("Impossible de charger les objectifs");
      setObjectifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchObjectifsCibles = useCallback(async () => {
    setObjectifsCiblesLoading(true);
    try {
      const result = await getObjectifsCibles();
      if (result.success && result.data) {
        setObjectifsCibles(result.data);
      } else {
        setObjectifsCibles([]);
      }
    } catch {
      toast.error("Impossible de charger les objectifs prospects");
      setObjectifsCibles([]);
    } finally {
      setObjectifsCiblesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "financiere") {
      fetchObjectifs();
      fetchWithRetry("/api/commercial-users")
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) setCommercialUsers(result.data);
        })
        .catch(() => setCommercialUsers([]));
    }
    if (activeTab === "prospects") {
      fetchObjectifsCibles();
      fetchWithRetry("/api/commercial-users")
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) setCommercialUsers(result.data);
        })
        .catch(() => setCommercialUsers([]));
    }
    if (activeTab === "vente") {
      setVenteLoading(true);
      getCommercialActivitiesStats()
        .then((res) => {
          if (res.success && res.data?.commercialPerformance) {
            const data = res.data.commercialPerformance
              .map((p) => ({ name: p.name, commandes: p.commandes }))
              .filter((p) => p.commandes > 0)
              .sort((a, b) => b.commandes - a.commandes);
            setVenteStats(data);
          } else {
            setVenteStats([]);
          }
        })
        .catch(() => setVenteStats([]))
        .finally(() => setVenteLoading(false));
    }
  }, [activeTab, fetchObjectifs, fetchObjectifsCibles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomDuCommercial || !formData.pole || !formData.duree || !formData.chiffreAffaire) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const ca = parseFloat(formData.chiffreAffaire.replace(/\D/g, "") || "0");
    if (isNaN(ca) || ca <= 0) {
      toast.error("Le chiffre d'affaires doit être un nombre positif");
      return;
    }
    setFormSubmitting(true);
    try {
      const result = await createObjectifFinanciere({
        nomDuCommercial: formData.nomDuCommercial,
        pole: formData.pole,
        duree: formData.duree,
        chiffreAffaire: ca,
        finObjectif: formData.finObjectif?.toISOString() ?? null,
      });
      if (result.success) {
        toast.success("Objectif créé avec succès");
        setFormData({ nomDuCommercial: "", pole: "", duree: "", chiffreAffaire: "", finObjectif: undefined });
        setDialogOpen(false);
        fetchObjectifs();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditDialog = (obj: ObjectifFinanciereData) => {
    setEditingObjectif(obj);
    setFormData({
      nomDuCommercial: obj.nomDuCommercial,
      pole: obj.pole,
      duree: obj.duree,
      chiffreAffaire: String(obj.chiffreAffaire),
      finObjectif: obj.finObjectif ? new Date(obj.finObjectif) : undefined,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObjectif) return;
    if (!formData.nomDuCommercial || !formData.pole || !formData.duree || !formData.chiffreAffaire) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const ca = parseFloat(formData.chiffreAffaire.replace(/\D/g, "") || "0");
    if (isNaN(ca) || ca <= 0) {
      toast.error("Le chiffre d'affaires doit être un nombre positif");
      return;
    }
    setFormSubmitting(true);
    try {
      const result = await updateObjectifFinanciere(editingObjectif.id, {
        nomDuCommercial: formData.nomDuCommercial,
        pole: formData.pole,
        duree: formData.duree,
        chiffreAffaire: ca,
        finObjectif: formData.finObjectif?.toISOString() ?? null,
      });
      if (result.success) {
        toast.success("Objectif modifié avec succès");
        setEditDialogOpen(false);
        setEditingObjectif(null);
        fetchObjectifs();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet objectif ?")) return;
    try {
      const result = await deleteObjectifFinanciere(id);
      if (result.success) {
        toast.success("Objectif supprimé");
        fetchObjectifs();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const chartData = objectifs.map((obj) => {
    const finDate = obj.finObjectif ? new Date(obj.finObjectif) : null;
    const finLabel =
      finDate && !isNaN(finDate.getTime())
        ? finDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";
    return {
      label: `${obj.nomDuCommercial} · ${obj.duree}${obj.pole ? ` · ${obj.pole}` : ""}`,
      commercial: obj.nomDuCommercial,
      chiffreAffaire: obj.chiffreAffaire,
      finObjectif: finLabel,
    };
  });

  const periodLabel =
    periodStart && periodEnd
      ? `${periodStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} – ${periodEnd.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`
      : "Période non définie";

  const handleDefinePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodStart || !newPeriodEnd) {
      toast.error("Veuillez sélectionner les dates de début et de fin");
      return;
    }
    if (newPeriodStart > newPeriodEnd) {
      toast.error("La date de début doit être antérieure à la date de fin");
      return;
    }
    try {
      const result = await createObjectifPeriod({ start: newPeriodStart, end: newPeriodEnd });
      if (result.success && result.data) {
        setDefinePeriodDialogOpen(false);
        toast.success("Période de l'objectif définie avec succès");
        await fetchPeriods();
        setSelectedPeriodId(result.data.id);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(
        msg.includes("fetch") || msg.includes("network")
          ? "Connexion impossible. Vérifiez votre réseau."
          : "Erreur lors de la création de la période."
      );
    }
  };

  const formatPeriodLabel = (p: ObjectifPeriod) =>
    `${p.start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} – ${p.end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  const handleProspectCibleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !prospectCibleFormData.userId || !prospectCibleFormData.prospectCible) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const prospectCible = parseInt(prospectCibleFormData.prospectCible, 10);
    if (isNaN(prospectCible) || prospectCible < 0) {
      toast.error("Le prospect cible doit être un nombre positif");
      return;
    }
    setProspectCibleSubmitting(true);
    try {
      const result = await createObjectifCible({
        periodId: selectedPeriodId,
        userId: prospectCibleFormData.userId,
        prospectCible,
      });
      if (result.success) {
        setProspectCibleDialogOpen(false);
        setProspectCibleFormData({ userId: "", prospectCible: "" });
        await fetchObjectifsCibles();
        toast.success("Objectif prospect défini avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setProspectCibleSubmitting(false);
    }
  };

  const removePeriod = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (periods.length <= 1) {
      toast.error("Au moins une période doit être définie");
      return;
    }
    try {
      const result = await deleteObjectifPeriod(id);
      if (result.success) {
        toast.success("Période supprimée");
        await fetchPeriods();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(
        msg.includes("fetch") || msg.includes("network")
          ? "Connexion impossible. Vérifiez votre réseau."
          : "Erreur lors de la suppression de la période."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] antialiased">
      {/* Header - Premium dark theme */}
      <div className="relative overflow-hidden mx-4 mt-4 mb-8 rounded-2xl bg-[#061f5a] shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(251,191,36,0.03)_50%,transparent_100%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.15),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="relative px-6 py-12 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 ring-1 ring-amber-400/30">
                <Target className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Objectifs
                </h1>
                <p className="mt-1 text-base text-slate-400">
                  Suivez et atteignez vos objectifs commerciaux
                </p>
              </div>
            </div>
            {selectedPeriod && (
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
                <CalendarIcon className="h-4 w-4 text-amber-400/80" />
                <span className="text-sm font-medium text-slate-300">
                  {formatPeriodLabel(selectedPeriod)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* 1. Période de l'objectif - FIRST */}
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <CalendarIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Période de l&apos;objectif
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Sélectionnez ou définissez une période pour consulter vos objectifs
                    </CardDescription>
                  </div>
                </div>
                <Dialog
                  open={definePeriodDialogOpen}
                  onOpenChange={(open) => {
                    setDefinePeriodDialogOpen(open);
                    if (open) {
                      const def = getDefaultPeriodDates();
                      setNewPeriodStart(def.start);
                      setNewPeriodEnd(def.end);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-slate-900 text-white shadow-sm hover:bg-slate-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Définir nouvel objectif
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Définir un nouvel objectif et sa période</DialogTitle>
                      <DialogDescription>
                        Choisissez la période (date de début et date de fin) pour votre nouvel objectif.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDefinePeriodSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <DatePicker
                          selected={newPeriodStart ?? null}
                          onChange={(date) => setNewPeriodStart(date ?? undefined)}
                          locale="fr"
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Sélectionner une date"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <DatePicker
                          selected={newPeriodEnd ?? null}
                          onChange={(date) => setNewPeriodEnd(date ?? undefined)}
                          locale="fr"
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Sélectionner une date"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDefinePeriodDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                          Définir la période
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-slate-700">
                    Périodes définies
                  </Label>
                  <p className="mb-3 text-sm text-slate-500">
                    Cliquez sur une période pour afficher les objectifs correspondants.
                  </p>
                  {periodsLoading ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                      <span className="text-sm text-slate-500">Chargement des périodes...</span>
                    </div>
                  ) : periods.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center">
                      <p className="text-sm text-slate-600">
                        Aucune période définie. Cliquez sur &quot;Définir nouvel objectif&quot; pour créer une période.
                      </p>
                    </div>
                  ) : (
                  <div className="flex flex-wrap gap-2">
                    {periods.map((p) => {
                      const isSelected = p.id === selectedPeriodId;
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPeriodId(p.id)}
                          onKeyDown={(e) => e.key === "Enter" && setSelectedPeriodId(p.id)}
                          className={clsx(
                            "inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2",
                            isSelected
                              ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-800"
                              : "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-100 hover:ring-slate-300"
                          )}
                        >
                          <span>{formatPeriodLabel(p)}</span>
                          {periods.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => removePeriod(e, p.id)}
                              className={clsx(
                                "rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40",
                                isSelected ? "text-white/80 hover:bg-white/20 hover:text-white" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                              )}
                              aria-label={`Supprimer la période ${formatPeriodLabel(p)}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Tabs - each tab shows content below when clicked */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-2 rounded-xl border-0 bg-white p-2 shadow-sm ring-1 ring-slate-200/60 sm:grid-cols-3">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={clsx(
                      "flex items-center justify-center gap-3 rounded-lg px-6 py-4 font-medium transition-all duration-200",
                      "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 data-[state=inactive]:hover:text-slate-900",
                      isActive && `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    )}
                  >
                    <div className={clsx(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-white/20" : tab.bgColor
                    )}>
                      <Icon className={clsx("h-5 w-5", isActive ? "text-white" : tab.iconColor)} />
                    </div>
                    <span className="whitespace-nowrap text-sm sm:text-base">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab content - shown below when tab is clicked */}
            <TabsContent value="prospects" className="mt-6 animate-in fade-in-50 duration-200 space-y-6">
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Dialog
                        open={prospectCibleDialogOpen}
                        onOpenChange={(open) => {
                          setProspectCibleDialogOpen(open);
                          if (!open) setProspectCibleFormData({ userId: "", prospectCible: "" });
                        }}
                      >
                        <Button
                          onClick={() => setProspectCibleDialogOpen(true)}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Définir Objectif Prospects / clients
                        </Button>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Définir objectif prospects / clients</DialogTitle>
                          <DialogDescription>
                            Définissez l&apos;objectif de prospects cibles pour un commercial sur la période sélectionnée.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleProspectCibleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Commercial</Label>
                            <Select
                              value={prospectCibleFormData.userId}
                              onValueChange={(v) =>
                                setProspectCibleFormData((p) => ({ ...p, userId: v }))
                              }
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un commercial" />
                              </SelectTrigger>
                              <SelectContent>
                                {commercialUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Prospect cible</Label>
                            <Input
                              type="number"
                              min={0}
                              value={prospectCibleFormData.prospectCible}
                              onChange={(e) =>
                                setProspectCibleFormData((p) => ({
                                  ...p,
                                  prospectCible: e.target.value,
                                }))
                              }
                              placeholder="Ex: 50"
                              required
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setProspectCibleDialogOpen(false)}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="submit"
                              disabled={prospectCibleSubmitting || !selectedPeriodId}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {prospectCibleSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Enregistrement...
                                </>
                              ) : (
                                "Enregistrer"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                      <div>
                        <CardTitle className="flex items-center gap-2.5 text-slate-900">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                            <Users className="h-5 w-5 text-amber-600" />
                          </div>
                          Objectif Prospects et clients
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                          Contenu des objectifs prospects et clients pour la période {periodLabel}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              
              </Card>

              {/* Liste des objectifs cibles par période pour chaque commercial */}
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardHeader>
                  <CardTitle className="text-slate-900">Objectifs prospects par période et par commercial</CardTitle>
                  <CardDescription className="text-slate-500">
                    Tous les objectifs prospects définis pour les commerciaux
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {objectifsCiblesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                  ) : objectifsCibles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-12 text-center">
                      <p className="text-slate-600">Aucun objectif prospect défini.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Période</TableHead>
                            <TableHead>Commercial</TableHead>
                            <TableHead>Prospect cible</TableHead>
                            <TableHead>Prospect réel</TableHead>
                            <TableHead>Taux atteint</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {objectifsCibles.map((obj) => {
                            const start =
                              typeof obj.periodStart === "string"
                                ? new Date(obj.periodStart)
                                : obj.periodStart;
                            const end =
                              typeof obj.periodEnd === "string"
                                ? new Date(obj.periodEnd)
                                : obj.periodEnd;
                            const periodLabel = `${start.toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })} – ${end.toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}`;
                            return (
                              <TableRow key={obj.id}>
                                <TableCell>{periodLabel}</TableCell>
                                <TableCell className="font-medium">{obj.commercialName}</TableCell>
                                <TableCell>{obj.prospectCible}</TableCell>
                                <TableCell>{obj.prospectReel}</TableCell>
                                <TableCell>{obj.tauxAtteint}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vente" className="mt-6 animate-in fade-in-50 duration-200">
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-sky-500 to-cyan-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-slate-900">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                      <Car className="h-5 w-5 text-sky-600" />
                    </div>
                    Objectif Vente véhicule
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Performance des ventes par commercial pour la période {periodLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {venteLoading ? (
                    <div className="flex h-[280px] items-center justify-center rounded-xl bg-slate-50/50">
                      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    </div>
                  ) : venteStats.length > 0 ? (
                    <div className="h-[280px] w-full overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                      <BarChart
                        data={venteStats}
                        width={Math.max(400, venteStats.length * 80)}
                        height={260}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                          cursor={{ fill: "rgba(14,165,233,0.08)" }}
                        />
                        <Bar dataKey="commandes" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Commandes" />
                      </BarChart>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-12 text-center">
                      <p className="text-slate-600">Aucune donnée de vente disponible.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financiere" className="mt-6 space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-col gap-6 lg:flex-row">
                <Card className="min-w-0 flex-1 overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                  <div className="h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                          <BarChart3 className="h-5 w-5 text-teal-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Objectifs par commercial
                        </CardTitle>
                      </div>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-teal-600 text-white hover:bg-teal-700"
                          >
                            <Plus className="h-4 w-4" />
                            Nouvel objectif
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Nouvel objectif financière</DialogTitle>
                            <DialogDescription>Renseignez les informations de l&apos;objectif</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Nom du Commercial</Label>
                              <Select
                                value={formData.nomDuCommercial}
                                onValueChange={(v) => setFormData((p) => ({ ...p, nomDuCommercial: v }))}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un commercial" />
                                </SelectTrigger>
                                <SelectContent>
                                  {commercialUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.fullName}>
                                      {u.fullName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Pôle</Label>
                                <Select
                                  value={formData.pole}
                                  onValueChange={(v) => setFormData((p) => ({ ...p, pole: v }))}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pôle" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="VIP & Sociétés">VIP & Sociétés</SelectItem>
                                    <SelectItem value="SUV & Pickup">SUV & Pickup</SelectItem>
                                    <SelectItem value="OmniCanal">OmniCanal</SelectItem>
                                    <SelectItem value="Showroom">Showroom</SelectItem>
                                    <SelectItem value="Autre">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Durée</Label>
                                <Select
                                  value={formData.duree}
                                  onValueChange={(v) => setFormData((p) => ({ ...p, duree: v }))}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Durée" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Mois">Mois</SelectItem>
                                    <SelectItem value="Trimestre">Trimestre</SelectItem>
                                    <SelectItem value="Semestre">Semestre</SelectItem>
                                    <SelectItem value="Année">Année</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Chiffre d&apos;affaires (FCFA)</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={
                                  formData.chiffreAffaire
                                    ? formatNumberWithSpaces(parseInt(formData.chiffreAffaire, 10) || 0)
                                    : ""
                                }
                                onChange={(e) =>
                                  setFormData((p) => ({ ...p, chiffreAffaire: e.target.value.replace(/\D/g, "") }))
                                }
                                placeholder="Ex: 1 000 000 000"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Fin d&apos;objectif</Label>
                              <DatePicker
                                selected={formData.finObjectif ?? null}
                                onChange={(date) => setFormData((p) => ({ ...p, finObjectif: date ?? undefined }))}
                                locale="fr"
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Sélectionner une date"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button type="submit" disabled={formSubmitting}>
                                {formSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enregistrement...
                                  </>
                                ) : (
                                  "Enregistrer"
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={editDialogOpen}
                        onOpenChange={(open) => {
                          setEditDialogOpen(open);
                          if (!open) setEditingObjectif(null);
                        }}
                      >
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Modifier l&apos;objectif</DialogTitle>
                            <DialogDescription>Modifiez les informations de l&apos;objectif sélectionné.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Nom du Commercial</Label>
                              <Select
                                value={formData.nomDuCommercial}
                                onValueChange={(v) => setFormData((p) => ({ ...p, nomDuCommercial: v }))}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un commercial" />
                                </SelectTrigger>
                                <SelectContent>
                                  {commercialUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.fullName}>
                                      {u.fullName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Pôle</Label>
                                <Select
                                  value={formData.pole}
                                  onValueChange={(v) => setFormData((p) => ({ ...p, pole: v }))}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pôle" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="VIP & Sociétés">VIP & Sociétés</SelectItem>
                                    <SelectItem value="SUV & Pickup">SUV & Pickup</SelectItem>
                                    <SelectItem value="OmniCanal">OmniCanal</SelectItem>
                                    <SelectItem value="Showroom">Showroom</SelectItem>
                                    <SelectItem value="Autre">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Durée</Label>
                                <Select
                                  value={formData.duree}
                                  onValueChange={(v) => setFormData((p) => ({ ...p, duree: v }))}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Durée" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Mois">Mois</SelectItem>
                                    <SelectItem value="Trimestre">Trimestre</SelectItem>
                                    <SelectItem value="Semestre">Semestre</SelectItem>
                                    <SelectItem value="Année">Année</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Chiffre d&apos;affaires (FCFA)</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={
                                  formData.chiffreAffaire
                                    ? formatNumberWithSpaces(parseInt(formData.chiffreAffaire, 10) || 0)
                                    : ""
                                }
                                onChange={(e) =>
                                  setFormData((p) => ({ ...p, chiffreAffaire: e.target.value.replace(/\D/g, "") }))
                                }
                                placeholder="Ex: 1 000 000 000"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Fin d&apos;objectif</Label>
                              <DatePicker
                                selected={formData.finObjectif ?? null}
                                onChange={(date) => setFormData((p) => ({ ...p, finObjectif: date ?? undefined }))}
                                locale="fr"
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Sélectionner une date"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button type="submit" disabled={formSubmitting}>
                                {formSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enregistrement...
                                  </>
                                ) : (
                                  "Enregistrer"
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[260px] w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                      {loading ? (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                        </div>
                      ) : chartData.length > 0 ? (
                        <BarChart
                          data={chartData}
                          width={Math.max(400, chartData.length * 56)}
                          height={260}
                          margin={{ top: 20, right: 30, left: 72, bottom: 5 }}
                          barSize={42}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                          <XAxis dataKey="label" hide />
                          <YAxis
                            stroke="#64748b"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            formatter={(value: number | undefined) => [`${formatNumberWithSpaces(value ?? 0)} FCFA`, "CA cible"]}
                          />
                          <Bar dataKey="chiffreAffaire" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Chiffre d'affaires" />
                        </BarChart>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-slate-600">Aucun objectif financier. Créez-en un.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
                <CardHeader>
                  <CardTitle className="text-slate-900">Liste des objectifs financiers</CardTitle>
                  <CardDescription className="text-slate-500">
                    Objectifs pour la période {periodLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex py-12 justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    </div>
                  ) : objectifs.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Commercial</TableHead>
                          <TableHead>Pôle</TableHead>
                          <TableHead>Durée</TableHead>
                          <TableHead>Chiffre d&apos;affaires</TableHead>
                          <TableHead>% Atteint</TableHead>
                          <TableHead>Fin objectif</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {objectifs.map((obj) => (
                          <TableRow key={obj.id}>
                            <TableCell className="font-medium">{obj.nomDuCommercial}</TableCell>
                            <TableCell>{obj.pole}</TableCell>
                            <TableCell>{obj.duree}</TableCell>
                            <TableCell>{formatNumberWithSpaces(obj.chiffreAffaire)} FCFA</TableCell>
                            <TableCell>{obj.pourcentageAtteint}%</TableCell>
                            <TableCell>
                              {obj.finObjectif
                                ? new Date(obj.finObjectif).toLocaleDateString("fr-FR")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(obj)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(obj.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-12 text-center">
                      <p className="text-slate-600">Aucun objectif financier.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
