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
  Building2,
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
import { DefinePeriodDialog } from "./DefinePeriodDialog";

registerLocale("fr", datePickerFr);

const TABS = [
  {
    id: "pole",
    label: "Pôle",
    icon: Building2,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    id: "prospects",
    label: "Objectif Prospect / Client",
    icon: Users,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    id: "vente",
    label: "Volume vente voiture",
    icon: Car,
    color: "from-sky-500 to-cyan-600",
    bgColor: "bg-sky-500/10",
    iconColor: "text-sky-600",
  },
  {
    id: "financiere",
    label: "Objectif financière",
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
  objectifPeriodId?: string | null;
  userId?: string | null;
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
      const res = await fetchWithRetry("/api/objectifs-periods");
      const result = await res.json();
      if (result.success && result.data) {
        const parsed = result.data.map(parsePeriodFromApi);
        setPeriods(parsed);
        setSelectedPeriodId((prev) => {
          if (prev && parsed.some((p: ObjectifPeriod) => p.id === prev)) return prev;
          return parsed.length > 0 ? parsed[0].id : null;
        });
      } else {
        setPeriods([]);
      }
    } catch {
      toast.error("Impossible de charger les périodes. Réessayez dans quelques secondes.");
      setPeriods([]);
    } finally {
      setPeriodsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ id: string }>) => {
      if (e.detail?.id) {
        setSelectedPeriodId(e.detail.id);
      }
    };
    window.addEventListener("objectif-period-created", handler as EventListener);
    return () => window.removeEventListener("objectif-period-created", handler as EventListener);
  }, []);

  useEffect(() => {
    if (selectedPeriodId === null && periods.length > 0) {
      setSelectedPeriodId(periods[0].id);
    } else if (selectedPeriodId && !periods.some((p: ObjectifPeriod) => p.id === selectedPeriodId)) {
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
  const [prospectCibleEditDialogOpen, setProspectCibleEditDialogOpen] = useState(false);
  const [editingProspectCible, setEditingProspectCible] = useState<ObjectifCibleData | null>(null);
  const [prospectCibleEditFormData, setProspectCibleEditFormData] = useState({ prospectCible: "" });
  const [prospectCibleEditSubmitting, setProspectCibleEditSubmitting] = useState(false);
  const [poleDialogOpen, setPoleDialogOpen] = useState(false);
  const [poleFormData, setPoleFormData] = useState({ userId: "", pole: "" });
  const [poleSubmitting, setPoleSubmitting] = useState(false);
  const [poleEditDialogOpen, setPoleEditDialogOpen] = useState(false);
  const [editingPole, setEditingPole] = useState<{
    id: string;
    userId: string;
    objectifPeriodId: string;
    objectifPoleCible: string;
    commercialName: string;
  } | null>(null);
  const [poleEditFormData, setPoleEditFormData] = useState({ userId: "", pole: "" });
  const [poleEditSubmitting, setPoleEditSubmitting] = useState(false);
  const [objectifsPoles, setObjectifsPoles] = useState<{ id: string; userId: string; objectifPeriodId: string; objectifPoleCible: string; commercialName: string }[]>([]);
  const [objectifsPolesLoading, setObjectifsPolesLoading] = useState(false);
  const [venteStats, setVenteStats] = useState<{ name: string; commandes: number }[]>([]);
  const [venteLoading, setVenteLoading] = useState(false);
  const [venteVolumeDialogOpen, setVenteVolumeDialogOpen] = useState(false);
  const [venteVolumeFormData, setVenteVolumeFormData] = useState({ userId: "", volumeDeVente: "" });
  const [venteVolumeSubmitting, setVenteVolumeSubmitting] = useState(false);
  const [objectifsVehicules, setObjectifsVehicules] = useState<{
    id: string;
    userId: string;
    objectifPeriodId: string;
    objectifCible: string;
    commercialName: string;
    periodStart?: Date | string;
    periodEnd?: Date | string;
  }[]>([]);
  const [objectifsVehiculesLoading, setObjectifsVehiculesLoading] = useState(false);
  const [venteVolumeEditDialogOpen, setVenteVolumeEditDialogOpen] = useState(false);
  const [editingVenteVolume, setEditingVenteVolume] = useState<{
    id: string;
    userId: string;
    objectifPeriodId: string;
    objectifCible: string;
    commercialName: string;
  } | null>(null);
  const [venteVolumeEditFormData, setVenteVolumeEditFormData] = useState({ volumeDeVente: "" });
  const [venteVolumeEditSubmitting, setVenteVolumeEditSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [objectifFinanciereDialogOpen, setObjectifFinanciereDialogOpen] = useState(false);
  const [objectifFinanciereFormData, setObjectifFinanciereFormData] = useState({
    userId: "",
    chiffreAffaire: "",
  });
  const [objectifFinanciereSubmitting, setObjectifFinanciereSubmitting] = useState(false);
  const [objectifFinanciereEditDialogOpen, setObjectifFinanciereEditDialogOpen] = useState(false);
  const [editingObjectifFinanciere, setEditingObjectifFinanciere] = useState<ObjectifFinanciereData | null>(null);
  const [objectifFinanciereEditFormData, setObjectifFinanciereEditFormData] = useState({
    userId: "",
    chiffreAffaire: "",
  });
  const [objectifFinanciereEditSubmitting, setObjectifFinanciereEditSubmitting] = useState(false);

  const fetchObjectifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-financieres");
      const result = await res.json();
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

  const fetchObjectifsPoles = useCallback(async () => {
    setObjectifsPolesLoading(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-poles");
      const result = await res.json();
      if (result.success && result.data) {
        setObjectifsPoles(result.data);
      } else {
        setObjectifsPoles([]);
      }
    } catch {
      toast.error("Impossible de charger les pôles");
      setObjectifsPoles([]);
    } finally {
      setObjectifsPolesLoading(false);
    }
  }, []);

  const fetchObjectifsVehicules = useCallback(async () => {
    setObjectifsVehiculesLoading(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-vehicules");
      const result = await res.json();
      if (result.success && result.data) {
        setObjectifsVehicules(result.data);
      } else {
        setObjectifsVehicules([]);
      }
    } catch {
      toast.error("Impossible de charger les volumes de vente");
      setObjectifsVehicules([]);
    } finally {
      setObjectifsVehiculesLoading(false);
    }
  }, []);

  const fetchObjectifsCibles = useCallback(async () => {
    setObjectifsCiblesLoading(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-cibles");
      const result = await res.json();
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
      fetchObjectifsVehicules();
      fetchWithRetry("/api/commercial-users")
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) setCommercialUsers(result.data);
        })
        .catch(() => setCommercialUsers([]));
    }
    if (activeTab === "pole") {
      fetchObjectifs();
      fetchObjectifsPoles();
      fetchWithRetry("/api/commercial-users")
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) setCommercialUsers(result.data);
        })
        .catch(() => setCommercialUsers([]));
    }
  }, [activeTab, fetchObjectifs, fetchObjectifsCibles, fetchObjectifsPoles, fetchObjectifsVehicules]);

  const handleObjectifFinanciereSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectifFinanciereFormData.userId || !objectifFinanciereFormData.chiffreAffaire) {
      toast.error("Veuillez sélectionner un commercial et définir le chiffre d'affaires");
      return;
    }
    const ca = parseFloat(objectifFinanciereFormData.chiffreAffaire.replace(/\D/g, "") || "0");
    if (isNaN(ca) || ca <= 0) {
      toast.error("Le chiffre d'affaires doit être un nombre positif");
      return;
    }
    if (!selectedPeriodId) {
      toast.error("Veuillez sélectionner une période");
      return;
    }
    setObjectifFinanciereSubmitting(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-financieres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: objectifFinanciereFormData.userId,
          objectifPeriodId: selectedPeriodId,
          chiffreAffaire: ca,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Objectif financier défini avec succès");
        setObjectifFinanciereDialogOpen(false);
        setObjectifFinanciereFormData({ userId: "", chiffreAffaire: "" });
        fetchObjectifs();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez dans quelques secondes." : msg || "Erreur lors de l'enregistrement");
    } finally {
      setObjectifFinanciereSubmitting(false);
    }
  };

  const openObjectifFinanciereEditDialog = (obj: ObjectifFinanciereData) => {
    setEditingObjectifFinanciere(obj);
    setObjectifFinanciereEditFormData({
      userId: obj.userId || "",
      chiffreAffaire: String(obj.chiffreAffaire),
    });
    setObjectifFinanciereEditDialogOpen(true);
  };

  const handleObjectifFinanciereEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObjectifFinanciere || !objectifFinanciereEditFormData.chiffreAffaire) {
      toast.error("Veuillez remplir le champ chiffre d'affaires");
      return;
    }
    const ca = parseFloat(objectifFinanciereEditFormData.chiffreAffaire.replace(/\D/g, "") || "0");
    if (isNaN(ca) || ca <= 0) {
      toast.error("Le chiffre d'affaires doit être un nombre positif");
      return;
    }
    setObjectifFinanciereEditSubmitting(true);
    try {
      const res = await fetchWithRetry(`/api/objectifs-financieres/${editingObjectifFinanciere.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: objectifFinanciereEditFormData.userId || undefined,
          chiffreAffaire: ca,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setObjectifFinanciereEditDialogOpen(false);
        setEditingObjectifFinanciere(null);
        toast.success("Objectif financier modifié avec succès");
        fetchObjectifs();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la modification");
    } finally {
      setObjectifFinanciereEditSubmitting(false);
    }
  };

  const handleObjectifFinanciereDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet objectif financier ?")) return;
    try {
      const res = await fetchWithRetry(`/api/objectifs-financieres/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Objectif supprimé");
        fetchObjectifs();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la suppression");
    }
  };

  const periodLabel =
    periodStart && periodEnd
      ? `${periodStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} – ${periodEnd.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`
      : "Période non définie";

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
      const res = await fetchWithRetry("/api/objectifs-cibles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodId: selectedPeriodId,
          userId: prospectCibleFormData.userId,
          prospectCible,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setProspectCibleDialogOpen(false);
        setProspectCibleFormData({ userId: "", prospectCible: "" });
        await fetchObjectifsCibles();
        toast.success("Objectif prospect défini avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez dans quelques secondes." : msg || "Erreur lors de la création");
    } finally {
      setProspectCibleSubmitting(false);
    }
  };

  const openProspectCibleEditDialog = (obj: ObjectifCibleData) => {
    setEditingProspectCible(obj);
    setProspectCibleEditFormData({ prospectCible: String(obj.prospectCible) });
    setProspectCibleEditDialogOpen(true);
  };

  const handleProspectCibleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProspectCible || !prospectCibleEditFormData.prospectCible) {
      toast.error("Veuillez remplir le champ");
      return;
    }
    const prospectCible = parseInt(prospectCibleEditFormData.prospectCible, 10);
    if (isNaN(prospectCible) || prospectCible < 0) {
      toast.error("Le prospect cible doit être un nombre positif");
      return;
    }
    setProspectCibleEditSubmitting(true);
    try {
      const res = await fetchWithRetry(`/api/objectifs-cibles/${editingProspectCible.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectCible }),
      });
      const result = await res.json();
      if (result.success) {
        setProspectCibleEditDialogOpen(false);
        setEditingProspectCible(null);
        toast.success("Objectif prospect modifié avec succès");
        fetchObjectifsCibles();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la modification");
    } finally {
      setProspectCibleEditSubmitting(false);
    }
  };

  const handleProspectCibleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet objectif prospect ?")) return;
    try {
      const res = await fetchWithRetry(`/api/objectifs-cibles/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Objectif prospect supprimé");
        fetchObjectifsCibles();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la suppression");
    }
  };

  const handleVenteVolumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !venteVolumeFormData.userId || !venteVolumeFormData.volumeDeVente) {
      toast.error("Veuillez remplir tous les champs et sélectionner une période");
      return;
    }
    const volume = parseInt(venteVolumeFormData.volumeDeVente, 10);
    if (isNaN(volume) || volume < 0) {
      toast.error("Le volume de vente doit être un nombre positif");
      return;
    }
    setVenteVolumeSubmitting(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-vehicules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectifPeriodId: selectedPeriodId,
          userId: venteVolumeFormData.userId,
          volumeDeVente: venteVolumeFormData.volumeDeVente,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setVenteVolumeDialogOpen(false);
        setVenteVolumeFormData({ userId: "", volumeDeVente: "" });
        toast.success("Volume de vente défini avec succès");
        fetchObjectifsVehicules();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez dans quelques secondes." : msg || "Erreur lors de l'enregistrement");
    } finally {
      setVenteVolumeSubmitting(false);
    }
  };

  const openVenteVolumeEditDialog = (obj: {
    id: string;
    userId: string;
    objectifPeriodId: string;
    objectifCible: string;
    commercialName: string;
  }) => {
    setEditingVenteVolume(obj);
    setVenteVolumeEditFormData({ volumeDeVente: obj.objectifCible });
    setVenteVolumeEditDialogOpen(true);
  };

  const handleVenteVolumeEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenteVolume || !venteVolumeEditFormData.volumeDeVente) {
      toast.error("Veuillez remplir le champ");
      return;
    }
    const volume = parseInt(venteVolumeEditFormData.volumeDeVente, 10);
    if (isNaN(volume) || volume < 0) {
      toast.error("Le volume de vente doit être un nombre positif");
      return;
    }
    setVenteVolumeEditSubmitting(true);
    try {
      const res = await fetchWithRetry(`/api/objectifs-vehicules/${editingVenteVolume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeDeVente: venteVolumeEditFormData.volumeDeVente }),
      });
      const result = await res.json();
      if (result.success) {
        setVenteVolumeEditDialogOpen(false);
        setEditingVenteVolume(null);
        toast.success("Volume de vente modifié avec succès");
        fetchObjectifsVehicules();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la modification");
    } finally {
      setVenteVolumeEditSubmitting(false);
    }
  };

  const handleVenteVolumeDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet objectif de volume de vente ?"))
      return;
    try {
      const res = await fetchWithRetry(`/api/objectifs-vehicules/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Objectif supprimé");
        fetchObjectifsVehicules();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la suppression");
    }
  };

  const handlePoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !poleFormData.userId || !poleFormData.pole) {
      toast.error("Veuillez remplir tous les champs et sélectionner une période");
      return;
    }
    setPoleSubmitting(true);
    try {
      const res = await fetchWithRetry("/api/objectifs-poles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectifPeriodId: selectedPeriodId,
          userId: poleFormData.userId,
          objectifPoleCible: poleFormData.pole,
        }),
      });
      let result: { success?: boolean; error?: string };
      try {
        result = await res.json();
      } catch {
        result = { success: false, error: `Erreur serveur (${res.status})` };
      }
      if (result.success) {
        setPoleDialogOpen(false);
        setPoleFormData({ userId: "", pole: "" });
        toast.success("Pôle défini avec succès");
        fetchObjectifs();
        fetchObjectifsPoles();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      const isNetworkError = msg.includes("fetch") || msg.includes("Failed") || msg.includes("network");
      toast.error(
        isNetworkError
          ? "Connexion impossible. Réessayez dans quelques secondes."
          : msg || "Erreur lors de l'enregistrement"
      );
    } finally {
      setPoleSubmitting(false);
    }
  };

  const openPoleEditDialog = (p: {
    id: string;
    userId: string;
    objectifPeriodId: string;
    objectifPoleCible: string;
    commercialName: string;
  }) => {
    setEditingPole(p);
    setPoleEditFormData({ userId: p.userId, pole: p.objectifPoleCible });
    setPoleEditDialogOpen(true);
  };

  const handlePoleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPole || !poleEditFormData.userId || !poleEditFormData.pole) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setPoleEditSubmitting(true);
    try {
      const res = await fetchWithRetry(`/api/objectifs-poles/${editingPole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: poleEditFormData.userId,
          objectifPoleCible: poleEditFormData.pole,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPoleEditDialogOpen(false);
        setEditingPole(null);
        toast.success("Pôle modifié avec succès");
        fetchObjectifsPoles();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la modification");
    } finally {
      setPoleEditSubmitting(false);
    }
  };

  const handlePoleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette assignation de pôle ?")) return;
    try {
      const res = await fetchWithRetry(`/api/objectifs-poles/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Pôle supprimé");
        fetchObjectifsPoles();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      toast.error(msg.includes("fetch") || msg.includes("Failed") ? "Connexion impossible. Réessayez." : msg || "Erreur lors de la suppression");
    }
  };

  const removePeriod = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (periods.length <= 1) {
      toast.error("Au moins une période doit être définie");
      return;
    }
    try {
      const res = await fetchWithRetry(`/api/objectifs-periods/${id}`, { method: "DELETE" });
      const result = await res.json();
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
            <div className="flex items-center gap-3">
              {selectedPeriod && (
                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
                  <CalendarIcon className="h-4 w-4 text-amber-400/80" />
                  <span className="text-sm font-medium text-slate-300">
                    {formatPeriodLabel(selectedPeriod)}
                  </span>
                </div>
              )}
              <DefinePeriodDialog onCreated={fetchPeriods} />
            </div>
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
                      Cliquez sur une période pour afficher les objectifs correspondants
                    </CardDescription>
                  </div>
                </div>
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
                        Aucune période définie. Cliquez sur &quot;Définir Période&quot; pour créer une période.
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
            <TabsList className="grid w-full grid-cols-1 gap-2 rounded-xl border-0 bg-white p-2 shadow-sm ring-1 ring-slate-200/60 sm:grid-cols-4">
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
                    <>
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Période</TableHead>
                              <TableHead>Commercial</TableHead>
                              <TableHead>Prospect cible</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
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
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openProspectCibleEditDialog(obj)}
                                        className="h-8"
                                      >
                                        <Pencil className="h-4 w-4" />
                                        
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleProspectCibleDelete(obj.id)}
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <Dialog
                        open={prospectCibleEditDialogOpen}
                        onOpenChange={(open) => {
                          setProspectCibleEditDialogOpen(open);
                          if (!open) setEditingProspectCible(null);
                        }}
                      >
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Modifier l&apos;objectif prospect</DialogTitle>
                            <DialogDescription>
                              Modifiez le prospect cible pour {editingProspectCible?.commercialName}.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleProspectCibleEditSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Prospect cible</Label>
                              <Input
                                type="number"
                                min={0}
                                value={prospectCibleEditFormData.prospectCible}
                                onChange={(e) =>
                                  setProspectCibleEditFormData((p) => ({
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
                                onClick={() => setProspectCibleEditDialogOpen(false)}
                              >
                                Annuler
                              </Button>
                              <Button
                                type="submit"
                                disabled={prospectCibleEditSubmitting}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                {prospectCibleEditSubmitting ? (
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
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vente" className="mt-6 animate-in fade-in-50 duration-200">
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-sky-500 to-cyan-500" />
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Dialog
                        open={venteVolumeDialogOpen}
                        onOpenChange={(open) => {
                          setVenteVolumeDialogOpen(open);
                          if (!open) setVenteVolumeFormData({ userId: "", volumeDeVente: "" });
                        }}
                      >
                        <Button
                          onClick={() => setVenteVolumeDialogOpen(true)}
                          className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Définir Volume de vente
                        </Button>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Définir Volume de vente</DialogTitle>
                            <DialogDescription>
                              Définissez le volume de vente cible pour un commercial sur la période sélectionnée.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleVenteVolumeSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Commercial</Label>
                              <Select
                                value={venteVolumeFormData.userId}
                                onValueChange={(v) => setVenteVolumeFormData((p) => ({ ...p, userId: v }))}
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
                              <Label>Volume de vente</Label>
                              <Input
                                type="number"
                                min={0}
                                value={venteVolumeFormData.volumeDeVente}
                                onChange={(e) =>
                                  setVenteVolumeFormData((p) => ({
                                    ...p,
                                    volumeDeVente: e.target.value,
                                  }))
                                }
                                placeholder="Ex: 10"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setVenteVolumeDialogOpen(false)}
                              >
                                Annuler
                              </Button>
                              <Button
                                type="submit"
                                disabled={venteVolumeSubmitting || !selectedPeriodId}
                                className="bg-sky-600 hover:bg-sky-700"
                              >
                                {venteVolumeSubmitting ? (
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
                    
                    </div>
                  </div>
                </CardHeader>
                
              </Card>

              <Card className="min-w-0 overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-sky-500 to-blue-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-slate-900">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                      <Car className="h-5 w-5 text-sky-600" />
                    </div>
                    Volumes de vente définis
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Liste des objectifs de volume de vente par commercial et période
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {objectifsVehiculesLoading ? (
                    <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50/50">
                      <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                    </div>
                  ) : (() => {
                    const filtered = selectedPeriodId
                      ? objectifsVehicules.filter((o) => o.objectifPeriodId === selectedPeriodId)
                      : objectifsVehicules;
                    if (filtered.length === 0) {
                      return (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-8 text-center">
                          <p className="text-slate-600">
                            {selectedPeriodId
                              ? "Aucun volume de vente défini pour cette période."
                              : "Sélectionnez une période ou définissez un volume de vente."}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Période</TableHead>
                                <TableHead>Commercial</TableHead>
                                <TableHead>Volume de vente</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((o) => (
                                <TableRow key={o.id}>
                                  <TableCell className="font-medium">
                                    {o.periodStart && o.periodEnd
                                      ? `${new Date(o.periodStart).toLocaleDateString("fr-FR")} – ${new Date(o.periodEnd).toLocaleDateString("fr-FR")}`
                                      : "—"}
                                  </TableCell>
                                  <TableCell>{o.commercialName || "—"}</TableCell>
                                  <TableCell>{o.objectifCible || "—"}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openVenteVolumeEditDialog(o)}
                                        className="h-8"
                                      >
                                        <Pencil className="h-4 w-4" />
                                        
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVenteVolumeDelete(o.id)}
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Dialog
                          open={venteVolumeEditDialogOpen}
                          onOpenChange={(open) => {
                            setVenteVolumeEditDialogOpen(open);
                            if (!open) setEditingVenteVolume(null);
                          }}
                        >
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Modifier le volume de vente</DialogTitle>
                              <DialogDescription>
                                Modifiez le volume de vente pour {editingVenteVolume?.commercialName}.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleVenteVolumeEditSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Volume de vente</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={venteVolumeEditFormData.volumeDeVente}
                                  onChange={(e) =>
                                    setVenteVolumeEditFormData((p) => ({
                                      ...p,
                                      volumeDeVente: e.target.value,
                                    }))
                                  }
                                  placeholder="Ex: 10"
                                  required
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setVenteVolumeEditDialogOpen(false)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={venteVolumeEditSubmitting}
                                  className="bg-sky-600 hover:bg-sky-700"
                                >
                                  {venteVolumeEditSubmitting ? (
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
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financiere" className="mt-6 space-y-6 animate-in fade-in-50 duration-200">
              <Card className="min-w-0 overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2.5 text-slate-900">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                          <DollarSign className="h-5 w-5 text-teal-600" />
                        </div>
                        Objectifs financiers
                      </CardTitle>
                      <CardDescription className="text-slate-500 mt-1">
                        Définissez les objectifs financiers par commercial pour la période {periodLabel}
                      </CardDescription>
                    </div>
                    <Dialog
                      open={objectifFinanciereDialogOpen}
                      onOpenChange={(open) => {
                        setObjectifFinanciereDialogOpen(open);
                        if (!open) setObjectifFinanciereFormData({ userId: "", chiffreAffaire: "" });
                      }}
                    >
                      <Button
                        onClick={() => setObjectifFinanciereDialogOpen(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Définir objectif financière
                      </Button>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Définir objectif financière</DialogTitle>
                          <DialogDescription>
                            Sélectionnez un commercial et définissez la valeur de l&apos;objectif financier pour la période {periodLabel}.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleObjectifFinanciereSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Commercial</Label>
                            <Select
                              value={objectifFinanciereFormData.userId}
                              onValueChange={(v) =>
                                setObjectifFinanciereFormData((p) => ({ ...p, userId: v }))
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
                            <Label>Chiffre d&apos;affaires (FCFA)</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={
                                objectifFinanciereFormData.chiffreAffaire
                                  ? formatNumberWithSpaces(parseInt(objectifFinanciereFormData.chiffreAffaire, 10) || 0)
                                  : ""
                              }
                              onChange={(e) =>
                                setObjectifFinanciereFormData((p) => ({
                                  ...p,
                                  chiffreAffaire: e.target.value.replace(/\D/g, ""),
                                }))
                              }
                              placeholder="Ex: 1 000 000 000"
                              required
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setObjectifFinanciereDialogOpen(false)}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="submit"
                              disabled={objectifFinanciereSubmitting || !selectedPeriodId}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              {objectifFinanciereSubmitting ? (
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
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50/50">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                    </div>
                  ) : (() => {
                    const filtered = selectedPeriodId
                      ? objectifs.filter((o) => o.objectifPeriodId === selectedPeriodId)
                      : objectifs;
                    if (filtered.length === 0) {
                      return (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-8 text-center">
                          <p className="text-slate-600">
                            {selectedPeriodId
                              ? "Aucun objectif financier défini pour cette période."
                              : "Sélectionnez une période ou définissez un objectif financier."}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Commercial</TableHead>
                                <TableHead>Chiffre d&apos;affaires (FCFA)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((o) => (
                                <TableRow key={o.id}>
                                  <TableCell className="font-medium">{o.nomDuCommercial || "—"}</TableCell>
                                  <TableCell>{formatNumberWithSpaces(o.chiffreAffaire)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openObjectifFinanciereEditDialog(o)}
                                        className="h-8"
                                      >
                                        <Pencil className="h-4 w-4" />
                                        
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleObjectifFinanciereDelete(o.id)}
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Dialog
                          open={objectifFinanciereEditDialogOpen}
                          onOpenChange={(open) => {
                            setObjectifFinanciereEditDialogOpen(open);
                            if (!open) setEditingObjectifFinanciere(null);
                          }}
                        >
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Modifier l&apos;objectif financier</DialogTitle>
                              <DialogDescription>
                                Modifiez le chiffre d&apos;affaires pour {editingObjectifFinanciere?.nomDuCommercial}.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleObjectifFinanciereEditSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Commercial</Label>
                                <Select
                                  value={objectifFinanciereEditFormData.userId || "__keep__"}
                                  onValueChange={(v) =>
                                    setObjectifFinanciereEditFormData((p) => ({
                                      ...p,
                                      userId: v === "__keep__" ? "" : v,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Conserver le commercial actuel" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__keep__">
                                      Conserver ({editingObjectifFinanciere?.nomDuCommercial || "—"})
                                    </SelectItem>
                                    {commercialUsers.map((u) => (
                                      <SelectItem key={u.id} value={u.id}>
                                        {u.fullName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Chiffre d&apos;affaires (FCFA)</Label>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    objectifFinanciereEditFormData.chiffreAffaire
                                      ? formatNumberWithSpaces(parseInt(objectifFinanciereEditFormData.chiffreAffaire, 10) || 0)
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setObjectifFinanciereEditFormData((p) => ({
                                      ...p,
                                      chiffreAffaire: e.target.value.replace(/\D/g, ""),
                                    }))
                                  }
                                  placeholder="Ex: 1 000 000 000"
                                  required
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setObjectifFinanciereEditDialogOpen(false)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={objectifFinanciereEditSubmitting}
                                  className="bg-teal-600 hover:bg-teal-700"
                                >
                                  {objectifFinanciereEditSubmitting ? (
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
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pole" className="mt-6 animate-in fade-in-50 duration-200 space-y-6">
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Dialog
                        open={poleDialogOpen}
                        onOpenChange={(open) => {
                          setPoleDialogOpen(open);
                          if (!open) setPoleFormData({ userId: "", pole: "" });
                        }}
                      >
                        <Button
                          onClick={() => setPoleDialogOpen(true)}
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Définir Pôle
                        </Button>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Définir Pôle</DialogTitle>
                            <DialogDescription>
                              Assignez un commercial à un pôle pour la période sélectionnée.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handlePoleSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Commercial</Label>
                              <Select
                                value={poleFormData.userId}
                                onValueChange={(v) => setPoleFormData((p) => ({ ...p, userId: v }))}
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
                              <Label>Pôle</Label>
                              <Select
                                value={poleFormData.pole}
                                onValueChange={(v) => setPoleFormData((p) => ({ ...p, pole: v }))}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un pôle" />
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
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPoleDialogOpen(false)}
                              >
                                Annuler
                              </Button>
                              <Button
                                type="submit"
                                disabled={poleSubmitting || !selectedPeriodId}
                                className="bg-violet-600 hover:bg-violet-700"
                              >
                                {poleSubmitting ? (
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
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                            <Building2 className="h-5 w-5 text-violet-600" />
                          </div>
                          Objectifs par Pôle
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                          Vue agrégée des objectifs financiers par pôle pour la période {periodLabel}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    </div>
                  ) : objectifs.length > 0 ? (
                    (() => {
                      const byPole = objectifs.reduce<Record<string, { count: number; totalCA: number }>>(
                        (acc, obj) => {
                          const pole = obj.pole || "Non défini";
                          if (!acc[pole]) acc[pole] = { count: 0, totalCA: 0 };
                          acc[pole].count += 1;
                          acc[pole].totalCA += obj.chiffreAffaire;
                          return acc;
                        },
                        {}
                      );
                      const poleEntries = Object.entries(byPole).sort((a, b) => b[1].totalCA - a[1].totalCA);
                      return (
                        <div className="overflow-hidden rounded-xl border border-slate-100">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Pôle</TableHead>
                                <TableHead>Nombre d&apos;objectifs</TableHead>
                                <TableHead>Chiffre d&apos;affaires total (FCFA)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {poleEntries.map(([pole, { count, totalCA }]) => (
                                <TableRow key={pole}>
                                  <TableCell className="font-medium">{pole}</TableCell>
                                  <TableCell>{count}</TableCell>
                                  <TableCell>{formatNumberWithSpaces(totalCA)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-12 text-center">
                      <p className="text-slate-600">Aucun objectif financier. Les données par pôle apparaîtront ici.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liste des pôles définis par commercial */}
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="h-0.5 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardHeader>
                  <CardTitle className="text-slate-900">Pôles définis par commercial</CardTitle>
                  <CardDescription className="text-slate-500">
                    Assignations commercial → pôle pour la période {periodLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {objectifsPolesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    </div>
                  ) : (() => {
                    const filtered = selectedPeriodId
                      ? objectifsPoles.filter((p) => p.objectifPeriodId === selectedPeriodId)
                      : objectifsPoles;
                    return filtered.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-12 text-center">
                        <p className="text-slate-600">Aucun pôle défini. Cliquez sur &quot;Définir Pôle&quot; pour en ajouter.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-hidden rounded-xl border border-slate-100">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Commercial</TableHead>
                                <TableHead>Pôle</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="font-medium">{p.commercialName}</TableCell>
                                  <TableCell>{p.objectifPoleCible}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openPoleEditDialog(p)}
                                        className="h-8"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePoleDelete(p.id)}
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Dialog
                          open={poleEditDialogOpen}
                          onOpenChange={(open) => {
                            setPoleEditDialogOpen(open);
                            if (!open) setEditingPole(null);
                          }}
                        >
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Modifier le pôle</DialogTitle>
                              <DialogDescription>
                                Modifiez le commercial et/ou le pôle assigné.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handlePoleEditSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Commercial</Label>
                                <Select
                                  value={poleEditFormData.userId}
                                  onValueChange={(v) => setPoleEditFormData((prev) => ({ ...prev, userId: v }))}
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
                                <Label>Pôle</Label>
                                <Select
                                  value={poleEditFormData.pole}
                                  onValueChange={(v) => setPoleEditFormData((prev) => ({ ...prev, pole: v }))}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un pôle" />
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
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setPoleEditDialogOpen(false)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={poleEditSubmitting}
                                  className="bg-violet-600 hover:bg-violet-700"
                                >
                                  {poleEditSubmitting ? (
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
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
