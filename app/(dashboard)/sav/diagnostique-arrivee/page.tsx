"use client";

import Link from "next/link";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Car,
  ClipboardCheck,
  Save,
  User,
  Hash,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Upload,
  X,
  Camera,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CheckListVerificationForm from "./CheckListVerificationForm";
import VehiclePicker from "./VehiclePicker";

interface CatergorieDiagnostic {
  id: string;
  nom: string;
}

interface DetailDiagnostic {
  id: string;
  nom: string;
  description?: string | null;
  catergorieDiagnosticId: string;
  catergorieDiagnostic?: CatergorieDiagnostic;
  diagnosticArriveeId?: string | null;
}

interface VoitureSAV {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  statut: string;
  ClientSAV?: { nom?: string; prenom?: string; contact?: string };
}

interface VisuelDefaut {
  id: string;
  nom: string;
  description?: string | null;
  image?: string | null;
  voitureSAVId: string;
  createdAt: string;
}

async function fetchVoituresArrive() {
  const res = await fetch("/api/sav/voiture-sav");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur chargement voitures");
  const data = json.data || [];
  return data.filter((v: VoitureSAV) => v.statut === "ARRIVE");
}

async function fetchDetails() {
  const res = await fetch("/api/sav/detail-diagnostic?catalog=1");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur chargement détails");
  return (json.data || []) as DetailDiagnostic[];
}

async function fetchDiagnosticArrivee(voitureSAVId: string) {
  const res = await fetch(`/api/sav/diagnostic-arrivee?voitureSAVId=${voitureSAVId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur chargement diagnostic");
  return json.data || [];
}

async function saveDiagnosticArrivee(voitureSAVId: string, checkedDetailIds: string[]) {
  const res = await fetch("/api/sav/diagnostic-arrivee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voitureSAVId, checkedDetailIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur enregistrement");
  return json;
}

async function fetchVisuelDefauts(voitureSAVId: string) {
  const res = await fetch(`/api/sav/visuel-defaut?voitureSAVId=${voitureSAVId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur chargement défauts visuels");
  return (json.data || []) as VisuelDefaut[];
}

async function createVisuelDefaut(
  voitureSAVId: string,
  nom: string,
  description: string,
  image: File
) {
  const formData = new FormData();
  formData.append("voitureSAVId", voitureSAVId);
  formData.append("nom", nom);
  if (description) formData.append("description", description);
  formData.append("image", image);

  const res = await fetch("/api/sav/visuel-defaut", {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur enregistrement défaut visuel");
  return json.data as VisuelDefaut;
}

interface DetailDiagnosticWithCat extends DetailDiagnostic {
  diagnosticArriveeId?: string | null;
}

const CATEGORY_ACCENTS = [
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-500",
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-rose-400 to-pink-500",
  "from-amber-500 to-amber-600",
];

function DiagnostiqueForm({
  voiture,
  details,
  onSaved,
}: {
  voiture: VoitureSAV;
  details: DetailDiagnosticWithCat[];
  onSaved?: () => void;
}): React.ReactNode {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visuelDefauts, setVisuelDefauts] = useState<VisuelDefaut[]>([]);
  const [loadingVisuels, setLoadingVisuels] = useState(true);
  const [visuelDialogOpen, setVisuelDialogOpen] = useState(false);
  const [visuelNom, setVisuelNom] = useState("");
  const [visuelDescription, setVisuelDescription] = useState("");
  const [visuelImage, setVisuelImage] = useState<File | null>(null);
  const [visuelImagePreview, setVisuelImagePreview] = useState<string | null>(null);
  const [savingVisuel, setSavingVisuel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLightboxImage, setSelectedLightboxImage] = useState<VisuelDefaut | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const saved = await fetchDiagnosticArrivee(voiture.id);
        const ids = new Set<string>();
        for (const da of saved) {
          for (const dd of da.DetailDiagnostic || []) {
            const match = details.find(
              (t) =>
                t.nom === dd.nom && t.catergorieDiagnosticId === dd.catergorieDiagnosticId
            );
            if (match) ids.add(match.id);
          }
        }
        if (!cancelled) setChecked(ids);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Erreur chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [voiture.id, details]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingVisuels(true);
      try {
        const data = await fetchVisuelDefauts(voiture.id);
        if (!cancelled) setVisuelDefauts(data);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Erreur chargement défauts visuels");
      } finally {
        if (!cancelled) setLoadingVisuels(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [voiture.id]);

  const resetVisuelForm = () => {
    setVisuelNom("");
    setVisuelDescription("");
    setVisuelImage(null);
    if (visuelImagePreview) URL.revokeObjectURL(visuelImagePreview);
    setVisuelImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleImageSelect = (file: File | null) => {
    if (visuelImagePreview) URL.revokeObjectURL(visuelImagePreview);
    if (!file) {
      setVisuelImage(null);
      setVisuelImagePreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    setVisuelImage(file);
    setVisuelImagePreview(URL.createObjectURL(file));
  };

  const handleAddVisuelDefaut = async (keepOpen: boolean) => {
    if (!visuelNom.trim()) {
      toast.error("Le nom du défaut est requis");
      return;
    }
    if (!visuelImage) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setSavingVisuel(true);
    try {
      const created = await createVisuelDefaut(
        voiture.id,
        visuelNom.trim(),
        visuelDescription.trim(),
        visuelImage
      );
      setVisuelDefauts((prev) => [created, ...prev]);
      toast.success("Défaut visuel ajouté");
      resetVisuelForm();
      if (!keepOpen) setVisuelDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSavingVisuel(false);
    }
  };

  const byCategory = useMemo(() => {
    const map = new Map<string, DetailDiagnosticWithCat[]>();
    for (const d of details) {
      const catId = d.catergorieDiagnosticId;
      if (!map.has(catId)) map.set(catId, []);
      map.get(catId)!.push(d);
    }
    return map;
  }, [details]);

  const checkedCount = checked.size;

  const toggle = (id: string, checkedVal: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (checkedVal) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleCategoryAll = (catItems: DetailDiagnosticWithCat[], targetState: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const item of catItems) {
        if (targetState) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDiagnosticArrivee(voiture.id, Array.from(checked));
      toast.success(
        "Diagnostic enregistré — véhicule prêt pour le dispatching",
      );
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center shadow-inner">
            <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-sm" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Chargement du diagnostic…</p>
      </div>
    );
  }

  const clientName = [voiture.ClientSAV?.nom, voiture.ClientSAV?.prenom].filter(Boolean).join(" ") || "Client non renseigné";

  return (
    <div className="space-y-4 pb-28 sm:space-y-6 sm:pb-32">
      {/* Vehicle Summary Banner */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Car className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-bold text-slate-900 sm:text-lg">{voiture.model}</p>
                <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 shadow-sm">
                  {voiture.immatriculation}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700 truncate">{clientName}</span>
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit rounded-xl bg-amber-100/80 px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-200/60"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4 text-amber-600" />
            {checkedCount} point{checkedCount > 1 ? "s" : ""} d&apos;anomalies noté{checkedCount > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Category blocks */}
      <div className="space-y-4">
        {Array.from(byCategory.entries()).map(([catId, items], catIndex) => {
          const cat = items[0]?.catergorieDiagnostic;
          const catNom = cat?.nom ?? "Sans catégorie";
          const accent = CATEGORY_ACCENTS[catIndex % CATEGORY_ACCENTS.length];
          const catChecked = items.filter((d) => checked.has(d.id)).length;
          const allDone = catChecked === items.length && items.length > 0;

          return (
            <Card
              key={catId}
              className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm transition-all hover:border-slate-300"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn("h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b", accent)} />
                  <CardTitle className="truncate text-base font-bold text-slate-900">
                    {catNom}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold",
                      catChecked > 0 ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {catChecked}/{items.length}
                  </Badge>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCategoryAll(items, !allDone)}
                    className="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-semibold hover:bg-amber-50 hover:text-amber-800 active:scale-95"
                  >
                    {allDone ? "Tout décocher" : "Tout cocher"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {items.map((d) => {
                    const isChecked = checked.has(d.id);
                    return (
                      <label
                        key={d.id}
                        className={cn(
                          "group flex min-h-[48px] touch-manipulation items-start gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all duration-150 select-none",
                          isChecked
                            ? "border-amber-400/90 bg-amber-50/90 text-amber-950 shadow-sm"
                            : "border-slate-200/90 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-white active:bg-slate-100"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(v) => toggle(d.id, !!v)}
                          className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "text-sm font-semibold leading-snug",
                              isChecked ? "text-amber-950 font-bold" : "text-slate-800"
                            )}
                          >
                            {d.nom}
                          </span>
                          {d.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-relaxed">{d.description}</p>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0 opacity-0 transition-opacity",
                            isChecked ? "text-amber-600 opacity-60" : "text-slate-400 group-hover:opacity-40"
                          )}
                        />
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {details.length === 0 && (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="px-4 py-12 text-center sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/80 sm:h-16 sm:w-16">
                <ClipboardCheck className="h-7 w-7 text-slate-400 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-700 sm:text-lg">Aucun détail configuré</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Ajoutez des détails diagnostique dans Client SAV → Détails Diagnostique pour les afficher ici.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visuel défauts gallery */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-slate-900">
                Photos & Défauts visuels
              </CardTitle>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                Documentation des chocs, rayures et dégâts visibles
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 font-bold px-3 py-1 text-xs">
            {visuelDefauts.length} photo{visuelDefauts.length > 1 ? "s" : ""}
          </Badge>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          {loadingVisuels ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
            </div>
          ) : visuelDefauts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-bold text-slate-700">Aucun défaut visuel photographié</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Prenez en photo les rayures, bosses ou imperfections constatées à l&apos;arrivée.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl font-semibold border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => setVisuelDialogOpen(true)}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Ajouter une photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visuelDefauts.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedLightboxImage(v)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition-all hover:border-rose-400 hover:shadow-md active:scale-95"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {v.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.image}
                        alt={v.nom}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImagePlus className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                      <div className="rounded-full bg-white/90 p-2 shadow-md">
                        <Camera className="h-4 w-4 text-slate-800" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-xs font-bold text-slate-900">{v.nom}</p>
                    {v.description && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{v.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Glassmorphic Floating Bottom Dock */}
      <div className="fixed inset-x-3 bottom-3 z-40 max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 sm:bottom-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-bold text-slate-900">
              {checkedCount} anomaly point{checkedCount > 1 ? "s" : ""} sélectionné{checkedCount > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-500">Diagnostic d&apos;arrivée</p>
          </div>

          <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setVisuelDialogOpen(true)}
              className="h-11 flex-1 rounded-xl border-dashed border-rose-300 font-semibold text-rose-800 hover:bg-rose-50 sm:flex-none sm:min-w-[10rem] active:scale-95 transition-transform"
            >
              <ImagePlus className="h-4 w-4 text-rose-600" />
              <span className="ml-2">+ Photo Défaut</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-11 flex-[1.4] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 sm:flex-none sm:min-w-[13rem] active:scale-95 transition-transform"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">{saving ? "Enregistrement…" : "Enregistrer Diagnostic"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Add Visual Defect Photo Modal */}
      <Dialog
        open={visuelDialogOpen}
        onOpenChange={(open) => {
          setVisuelDialogOpen(open);
          if (!open) resetVisuelForm();
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto rounded-3xl border-slate-200/80 p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/40 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Ajouter une photo de défaut
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-xs sm:text-sm">
                Documentez les chocs et rayures pour {voiture.model} ({voiture.immatriculation}).
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="visuel-nom" className="text-slate-700 font-bold text-xs uppercase tracking-wider">
                Nom ou Intitulé du défaut <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="visuel-nom"
                value={visuelNom}
                onChange={(e) => setVisuelNom(e.target.value)}
                placeholder="Ex. Rayure profonde portière arrière gauche"
                className="h-11 rounded-xl border-slate-200 font-medium"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visuel-desc" className="text-slate-700 font-bold text-xs uppercase tracking-wider">
                Description / Localisation
              </Label>
              <Textarea
                id="visuel-desc"
                value={visuelDescription}
                onChange={(e) => setVisuelDescription(e.target.value)}
                rows={3}
                placeholder="Précisez la taille, la gravité ou la position de l'anomalie..."
                className="min-h-[88px] resize-none rounded-xl border-slate-200 font-medium"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">
                Photo du véhicule <span className="text-rose-500">*</span>
              </Label>

              {/* Standard File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
              />

              {/* Mobile Direct Camera Capture Input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
              />

              {visuelImagePreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={visuelImagePreview}
                    alt="Aperçu"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white active:scale-95"
                    onClick={() => handleImageSelect(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-6 transition-all hover:bg-rose-50 active:scale-95"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md">
                      <Camera className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-rose-900">Prendre une photo</span>
                    <span className="text-[10px] text-rose-600">Ouvre l&apos;appareil photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 transition-all hover:border-slate-400 hover:bg-slate-100 active:scale-95"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white shadow-md">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Galerie / Fichier</span>
                    <span className="text-[10px] text-slate-500">Choisir dans l&apos;appareil</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto font-semibold"
              onClick={() => {
                setVisuelDialogOpen(false);
                resetVisuelForm();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={savingVisuel}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-md hover:from-rose-600 hover:to-pink-700 sm:w-auto"
              onClick={() => handleAddVisuelDefaut(false)}
            >
              {savingVisuel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer la photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox Modal */}
      <Dialog
        open={!!selectedLightboxImage}
        onOpenChange={(open) => {
          if (!open) setSelectedLightboxImage(null);
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-3xl p-0 border-slate-200/80 bg-slate-950 text-white">
          <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center">
            {selectedLightboxImage?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedLightboxImage.image}
                alt={selectedLightboxImage.nom}
                className="max-h-full max-w-full object-contain"
              />
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/80"
              onClick={() => setSelectedLightboxImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-5 bg-slate-900 border-t border-slate-800">
            <h3 className="text-lg font-bold text-white">{selectedLightboxImage?.nom}</h3>
            {selectedLightboxImage?.description && (
              <p className="mt-1 text-sm text-slate-300">{selectedLightboxImage.description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DiagnostiqueArriveePage() {
  const [voitures, setVoitures] = useState<VoitureSAV[]>([]);
  const [details, setDetails] = useState<DetailDiagnosticWithCat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [voituresRes, detailsRes] = await Promise.all([
        fetchVoituresArrive(),
        fetchDetails(),
      ]);
      setVoitures(voituresRes);
      setDetails(detailsRes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center shadow-inner">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-amber-400/30 to-orange-500/30 blur-xl animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-medium text-slate-500">Chargement des véhicules…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Hero Header */}
      <div className="relative -mx-3 mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 p-6 text-white shadow-xl sm:-mx-4 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.25),transparent)]" />
        <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -top-10 left-1/4 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur-md ring-1 ring-amber-500/30">
              <ClipboardCheck className="h-3.5 w-3.5 text-amber-400" />
              Contrôle SAV à l&apos;arrivée
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Diagnostique Arrivée
            </h1>
            <p className="max-w-xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Effectuez le contrôle d&apos;arrivée du véhicule et relevez les anomalies visuelles et mécaniques.
            </p>
          </div>

          {voitures.length > 0 && (
            <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md ring-1 ring-white/20 shadow-lg">
              <Car className="h-4 w-4 text-amber-400" />
              <span>{voitures.length} véhicule{voitures.length > 1 ? "s" : ""} en attente</span>
            </div>
          )}
        </div>
      </div>

      {voitures.length === 0 ? (
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center px-4 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 shadow-inner">
              <Car className="h-10 w-10" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-800">Aucun véhicule arrivé</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Les véhicules enregistrés avec le statut{" "}
              <span className="font-bold text-slate-700">ARRIVÉ</span> s&apos;afficheront ici.
              Après diagnostic, ils passent en{" "}
              <span className="font-bold text-slate-700">Diagnostic fini</span> puis au{" "}
              <Link href="/sav/dispatching" className="font-bold text-amber-700 underline">
                Dispatching
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="verification" className="w-full space-y-6">
          {/* Main Segmented Control Switcher */}
          <div className="sticky top-0 z-30 -mx-1 bg-slate-50/90 py-2 backdrop-blur-md">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 rounded-2xl border border-slate-200/90 bg-slate-200/60 p-1.5 shadow-inner sm:mx-auto sm:max-w-xl">
              <TabsTrigger
                value="verification"
                className={cn(
                  "min-h-11 gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm",
                  "data-[state=active]:bg-white data-[state=active]:text-sky-900 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-sky-300"
                )}
              >
                <ClipboardList className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">1. Vérification</span>
                  <span className="hidden sm:inline">1. Vérification Voiture à l&apos;arrivée</span>
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="diagnostic"
                className={cn(
                  "min-h-11 gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm",
                  "data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-amber-300"
                )}
              >
                <ClipboardCheck className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">2. Diagnostic</span>
                  <span className="hidden sm:inline">2. Diagnostic & Photos Arrivée</span>
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="verification" className="mt-0 focus-visible:ring-0">
            <Tabs
              key={`verif-${voitures.map((v) => v.id).join(",")}`}
              defaultValue={voitures[0]?.id}
              className="w-full space-y-4"
            >
              <VehiclePicker voitures={voitures} accent="sky" />
              {voitures.map((v) => (
                <TabsContent key={`verif-${v.id}`} value={v.id} className="mt-0 focus-visible:ring-0">
                  <CheckListVerificationForm voiture={v} onSaved={loadData} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="diagnostic" className="mt-0 focus-visible:ring-0">
            <Tabs
              key={`diag-${voitures.map((v) => v.id).join(",")}`}
              defaultValue={voitures[0]?.id}
              className="w-full space-y-4"
            >
              <VehiclePicker voitures={voitures} accent="amber" />
              {voitures.map((v) => (
                <TabsContent key={`diag-${v.id}`} value={v.id} className="mt-0 focus-visible:ring-0">
                  <DiagnostiqueForm voiture={v} details={details} onSaved={loadData} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

