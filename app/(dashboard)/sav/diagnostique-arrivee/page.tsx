"use client";

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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  ClientSAV?: { nom?: string; prenom?: string };
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
  const res = await fetch("/api/sav/detail-diagnostic");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur chargement détails");
  return (json.data || []).filter((d: DetailDiagnostic) => !d.diagnosticArriveeId);
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
}) {
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDiagnosticArrivee(voiture.id, Array.from(checked));
      toast.success("Diagnostic enregistré avec succès");
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
          <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-sm" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Chargement du diagnostic…</p>
      </div>
    );
  }

  const clientName = [voiture.ClientSAV?.nom, voiture.ClientSAV?.prenom].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      {/* Vehicle summary bar — sticky on scroll */}
      <div className="sticky top-0 z-10 -mx-2 px-2 py-3 -mt-2 mb-2 bg-gradient-to-r from-slate-50/95 via-white/95 to-slate-50/95 backdrop-blur-md border-b border-slate-200/80 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Client</p>
                <p className="font-semibold text-slate-800">{clientName}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/15">
                <Car className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Véhicule</p>
                <p className="font-semibold text-slate-800">{voiture.model}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Hash className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Immatriculation</p>
                <p className="font-mono font-semibold text-slate-800">{voiture.immatriculation}</p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {checkedCount} sélectionné{checkedCount > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisuelDialogOpen(true)}
              className="rounded-xl border-dashed border-slate-300 bg-white/80 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-all"
            >
              <ImagePlus className="h-4 w-4 shrink-0" />
              <span className="ml-2 hidden sm:inline">Ajouter défaut visuel</span>
              <span className="ml-2 sm:hidden">Défaut visuel</span>
            </Button>
            <div className="hidden sm:block h-8 w-px bg-slate-200" aria-hidden="true" />
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 transition-all disabled:opacity-70 disabled:shadow-none min-w-[11.5rem]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Save className="h-4 w-4 shrink-0" />
              )}
              <span className="ml-2">
                {saving ? "Enregistrement…" : "Enregistrer le diagnostic"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Category blocks */}
      <div className="space-y-6">
        {Array.from(byCategory.entries()).map(([catId, items], catIndex) => {
          const cat = items[0]?.catergorieDiagnostic;
          const catNom = cat?.nom ?? "Sans catégorie";
          const accent = CATEGORY_ACCENTS[catIndex % CATEGORY_ACCENTS.length];

          return (
            <Card
              key={catId}
              className={cn(
                "overflow-hidden rounded-2xl border-slate-200/80 shadow-sm",
                "transition-all duration-200 hover:shadow-md hover:border-slate-300/60"
              )}
            >
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn("h-1 w-1 rounded-full bg-gradient-to-r", accent)} />
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-400/40 to-orange-500/40" />
                  <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">
                    {catNom}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((d) => {
                    const isChecked = checked.has(d.id);
                    return (
                      <label
                        key={d.id}
                        className={cn(
                          "group flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200",
                          isChecked
                            ? "border-amber-300/60 bg-amber-50/80 shadow-sm"
                            : "border-slate-200 bg-slate-50/30 hover:bg-slate-100/60 hover:border-slate-300"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(v) => toggle(d.id, !!v)}
                          className="mt-0.5 h-5 w-5 rounded-md border-2 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "font-medium transition-colors",
                              isChecked ? "text-amber-900" : "text-slate-800"
                            )}
                          >
                            {d.nom}
                          </span>
                          {d.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 opacity-0 transition-opacity",
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
            <CardContent className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80">
                <ClipboardCheck className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucun détail configuré</h3>
              <p className="mt-2 max-w-sm mx-auto text-slate-500 text-sm">
                Ajoutez des détails diagnostique dans Client SAV → Détails Diagnostique pour les afficher ici.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visuel défauts gallery */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="pb-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/15 to-pink-500/15">
                <Camera className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">
                  Défauts visuels
                </CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">
                  Photos des défauts constatés sur ce véhicule
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">
              {visuelDefauts.length} photo{visuelDefauts.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          {loadingVisuels ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
            </div>
          ) : visuelDefauts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">Aucun défaut visuel</p>
              <p className="mt-1 text-xs text-slate-500">
                Cliquez sur &quot;Ajouter défaut visuel&quot; pour documenter les anomalies.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl"
                onClick={() => setVisuelDialogOpen(true)}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Ajouter une photo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visuelDefauts.map((v) => (
                <div
                  key={v.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300"
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
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-slate-800 line-clamp-1">{v.nom}</p>
                    {v.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{v.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Ajouter un défaut visuel
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Documentez les anomalies visuelles du véhicule {voiture.model} ({voiture.immatriculation}).
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="visuel-nom" className="text-slate-700">
                Nom du défaut <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visuel-nom"
                value={visuelNom}
                onChange={(e) => setVisuelNom(e.target.value)}
                placeholder="Ex. Rayure portière avant droite"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visuel-desc" className="text-slate-700">
                Description
              </Label>
              <Textarea
                id="visuel-desc"
                value={visuelDescription}
                onChange={(e) => setVisuelDescription(e.target.value)}
                rows={3}
                placeholder="Détails, localisation, gravité…"
                className="min-h-[88px] resize-none rounded-xl border-slate-200"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-slate-700">
                Photo <span className="text-red-500">*</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
              />
              {visuelImagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-200">
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
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white"
                    onClick={() => handleImageSelect(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-10 transition-colors hover:border-rose-300 hover:bg-rose-50/30"
                >
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Cliquez pour charger une image</span>
                  <span className="text-xs text-slate-400">JPG, PNG — max 10 Mo</span>
                </button>
              )}
              {visuelImagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer l&apos;image
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => {
                setVisuelDialogOpen(false);
                resetVisuelForm();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={savingVisuel}
              className="w-full rounded-xl sm:w-auto"
              onClick={() => handleAddVisuelDefaut(true)}
            >
              {savingVisuel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              <span className="ml-2">Ajouter et continuer</span>
            </Button>
            <Button
              type="button"
              disabled={savingVisuel}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md hover:from-rose-600 hover:to-pink-600 sm:w-auto"
              onClick={() => handleAddVisuelDefaut(false)}
            >
              {savingVisuel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Terminé"
              )}
            </Button>
          </DialogFooter>
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
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-[1.75rem] bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-6 pt-10 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.25),transparent)]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-400/15 rounded-full blur-3xl -translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <ClipboardCheck className="h-4 w-4 text-amber-100" />
            </div>
            <span className="text-sm font-semibold text-amber-100/95 uppercase tracking-widest">
              Contrôle à l&apos;arrivée
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Diagnostique Arrivée
          </h1>
          <p className="mt-3 text-lg text-amber-100/90 max-w-xl">
            Sélectionnez les contrôles effectués pour chaque véhicule en statut ARRIVÉ.
          </p>
          {voitures.length > 0 && (
            <p className="mt-4 text-sm text-amber-200/90">
              {voitures.length} véhicule{voitures.length > 1 ? "s" : ""} en attente
            </p>
          )}
        </div>
      </div>

      {voitures.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 px-6 py-8">
            <CardContent className="flex flex-col items-center text-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200/80">
                <Car className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-700">Aucun véhicule arrivé</h3>
              <p className="mt-2 text-slate-500 max-w-md">
                Les véhicules avec le statut <span className="font-medium text-slate-600">ARRIVÉ</span> apparaîtront ici pour le diagnostic.
              </p>
            </CardContent>
          </div>
        </Card>
      ) : (
        <Tabs key={voitures.map((v) => v.id).join(",")} defaultValue={voitures[0]?.id} className="w-full">
          <div className="mb-6">
            <TabsList
              className={cn(
                "inline-flex flex-nowrap gap-2 h-auto p-2 rounded-2xl",
                "bg-slate-100/90 border border-slate-200/80 shadow-sm",
                "overflow-x-auto overflow-y-hidden max-w-full"
              )}
            >
              {voitures.map((v) => (
                <TabsTrigger
                  key={v.id}
                  value={v.id}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-xl px-5 py-3.5 min-w-[200px]",
                    "text-left whitespace-nowrap",
                    "data-[state=active]:bg-white data-[state=active]:text-amber-800",
                    "data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80",
                    "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/60"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {[v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") || "—"}
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Car className="h-3 w-3 shrink-0" />
                    {v.model} • {v.immatriculation}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {voitures.map((v) => (
            <TabsContent key={v.id} value={v.id} className="mt-0 focus-visible:ring-0">
              <DiagnostiqueForm voiture={v} details={details} onSaved={loadData} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
