"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Car,
  ClipboardList,
  Save,
  User,
  Hash,
  CheckCircle2,
  Fuel,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TypeCheckListSAV = "RECEPTION" | "PREPARATION" | "FINALE";

const CHECKLIST_TYPE_OPTIONS: { value: TypeCheckListSAV; label: string }[] = [
  { value: "RECEPTION", label: "Réception" },
  { value: "PREPARATION", label: "Préparation" },
  { value: "FINALE", label: "Finale" },
];

interface VoitureSAV {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  statut: string;
  ClientSAV?: { nom?: string; prenom?: string; contact?: string };
}

type BooleanKey =
  | "pareBrise"
  | "vitresLaterales"
  | "lunetteArriere"
  | "capot"
  | "pareChocsAvant"
  | "pareChocsArriere"
  | "ailesAvant"
  | "ailesArriere"
  | "portes"
  | "toit"
  | "coffre"
  | "retroviseurs"
  | "essuieGlaces"
  | "eclairageAvantArriere"
  | "plaquesImmatriculation"
  | "pressionCorrecte"
  | "usureReguliere"
  | "roueSecoursPresente"
  | "cricPresent"
  | "cleRouePresente"
  | "niveauHuileMoteur"
  | "liquideRefroidissement"
  | "liquideFrein"
  | "liquideDirectionAssistee"
  | "liquideLaveGlace"
  | "batterie"
  | "courroies"
  | "absenceFuite"
  | "tableauBord"
  | "temoinsAllumes"
  | "climatisation"
  | "chauffage"
  | "klaxon"
  | "ceinturesSecurite"
  | "sieges"
  | "leveVitres"
  | "verrouillageCentralise"
  | "autoradio"
  | "feuxPosition"
  | "feuxCroisement"
  | "feuxRoute"
  | "clignotants"
  | "feuxStop"
  | "feuxRecul"
  | "feuxAntibrouillard"
  | "controleMoteur"
  | "controleEmbrayage"
  | "controleBoiteVitesses"
  | "controleDirection"
  | "controleSuspension"
  | "controleFreinage"
  | "controleTransmission"
  | "demarrageNormal"
  | "accelerationCorrecte"
  | "freinageEfficace"
  | "directionStable"
  | "absenceVibrations"
  | "absenceBruitAnormal"
  | "cle1"
  | "cle2"
  | "carteGrise"
  | "accessoireRoueSecours"
  | "accessoireCric"
  | "trousseOutils"
  | "giletSecurite"
  | "triangleSignalisation";

interface CheckListFormState {
  id?: string;
  titre: string;
  type: TypeCheckListSAV;
  statut: "EN_ATTENTE" | "EN_COURS" | "VALIDE" | "TERMINEE" | "ECHEC" | "ANNULE";
  date: string;
  numeroOrdreReparation: string;
  nomClient: string;
  telephone: string;
  marque: string;
  modele: string;
  immatriculation: string;
  numeroChassis: string;
  kilometrage: string;
  niveauCarburant: string;
  observations: string;
  checks: Record<BooleanKey, boolean>;
}

const CHECK_SECTIONS: { title: string; short: string; items: { key: BooleanKey; label: string }[] }[] = [
  {
    title: "État extérieur",
    short: "Extérieur",
    items: [
      { key: "pareBrise", label: "Pare-brise" },
      { key: "vitresLaterales", label: "Vitres latérales" },
      { key: "lunetteArriere", label: "Lunette arrière" },
      { key: "capot", label: "Capot" },
      { key: "pareChocsAvant", label: "Pare-chocs avant" },
      { key: "pareChocsArriere", label: "Pare-chocs arrière" },
      { key: "ailesAvant", label: "Ailes avant" },
      { key: "ailesArriere", label: "Ailes arrière" },
      { key: "portes", label: "Portes" },
      { key: "toit", label: "Toit" },
      { key: "coffre", label: "Coffre" },
      { key: "retroviseurs", label: "Rétroviseurs" },
      { key: "essuieGlaces", label: "Essuie-glaces" },
      { key: "eclairageAvantArriere", label: "Éclairage AV/AR" },
      { key: "plaquesImmatriculation", label: "Plaques" },
    ],
  },
  {
    title: "Pneumatiques",
    short: "Pneus",
    items: [
      { key: "pressionCorrecte", label: "Pression correcte" },
      { key: "usureReguliere", label: "Usure régulière" },
      { key: "roueSecoursPresente", label: "Roue de secours" },
      { key: "cricPresent", label: "Cric présent" },
      { key: "cleRouePresente", label: "Clé de roue" },
    ],
  },
  {
    title: "Compartiment moteur",
    short: "Moteur",
    items: [
      { key: "niveauHuileMoteur", label: "Huile moteur" },
      { key: "liquideRefroidissement", label: "Refroidissement" },
      { key: "liquideFrein", label: "Liquide frein" },
      { key: "liquideDirectionAssistee", label: "Direction assistée" },
      { key: "liquideLaveGlace", label: "Lave-glace" },
      { key: "batterie", label: "Batterie" },
      { key: "courroies", label: "Courroies" },
      { key: "absenceFuite", label: "Absence de fuite" },
    ],
  },
  {
    title: "Habitacle",
    short: "Habitacle",
    items: [
      { key: "tableauBord", label: "Tableau de bord" },
      { key: "temoinsAllumes", label: "Témoins allumés" },
      { key: "climatisation", label: "Climatisation" },
      { key: "chauffage", label: "Chauffage" },
      { key: "klaxon", label: "Klaxon" },
      { key: "ceinturesSecurite", label: "Ceintures" },
      { key: "sieges", label: "Sièges" },
      { key: "leveVitres", label: "Lève-vitres" },
      { key: "verrouillageCentralise", label: "Verrouillage" },
      { key: "autoradio", label: "Autoradio" },
    ],
  },
  {
    title: "Électricité",
    short: "Élec.",
    items: [
      { key: "feuxPosition", label: "Feux de position" },
      { key: "feuxCroisement", label: "Feux de croisement" },
      { key: "feuxRoute", label: "Feux de route" },
      { key: "clignotants", label: "Clignotants" },
      { key: "feuxStop", label: "Feux stop" },
      { key: "feuxRecul", label: "Feux de recul" },
      { key: "feuxAntibrouillard", label: "Antibrouillard" },
    ],
  },
  {
    title: "Contrôle mécanique",
    short: "Mécanique",
    items: [
      { key: "controleMoteur", label: "Moteur" },
      { key: "controleEmbrayage", label: "Embrayage" },
      { key: "controleBoiteVitesses", label: "Boîte de vitesses" },
      { key: "controleDirection", label: "Direction" },
      { key: "controleSuspension", label: "Suspension" },
      { key: "controleFreinage", label: "Freinage" },
      { key: "controleTransmission", label: "Transmission" },
    ],
  },
  {
    title: "Essai routier",
    short: "Essai",
    items: [
      { key: "demarrageNormal", label: "Démarrage normal" },
      { key: "accelerationCorrecte", label: "Accélération" },
      { key: "freinageEfficace", label: "Freinage efficace" },
      { key: "directionStable", label: "Direction stable" },
      { key: "absenceVibrations", label: "Sans vibrations" },
      { key: "absenceBruitAnormal", label: "Sans bruit anormal" },
    ],
  },
  {
    title: "Accessoires remis",
    short: "Accessoires",
    items: [
      { key: "cle1", label: "Clé 1" },
      { key: "cle2", label: "Clé 2" },
      { key: "carteGrise", label: "Carte grise" },
      { key: "accessoireRoueSecours", label: "Roue de secours" },
      { key: "accessoireCric", label: "Cric" },
      { key: "trousseOutils", label: "Trousse à outils" },
      { key: "giletSecurite", label: "Gilet de sécurité" },
      { key: "triangleSignalisation", label: "Triangle" },
    ],
  },
];

const ALL_BOOLEAN_KEYS = CHECK_SECTIONS.flatMap((s) => s.items.map((i) => i.key));

function emptyChecks(): Record<BooleanKey, boolean> {
  return ALL_BOOLEAN_KEYS.reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<BooleanKey, boolean>
  );
}

function toDateInputValue(value?: string | Date | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function buildInitialForm(
  voiture: VoitureSAV,
  type: TypeCheckListSAV = "RECEPTION",
): CheckListFormState {
  const clientName =
    [voiture.ClientSAV?.nom, voiture.ClientSAV?.prenom].filter(Boolean).join(" ") || "";
  return {
    titre: "Check-list de réception et de contrôle du véhicule",
    type,
    statut: "EN_ATTENTE",
    date: toDateInputValue(new Date()),
    numeroOrdreReparation: "",
    nomClient: clientName,
    telephone: voiture.ClientSAV?.contact || "",
    marque: "KPANDJI",
    modele: voiture.model || "",
    immatriculation: voiture.immatriculation || "",
    numeroChassis: "",
    kilometrage: "",
    niveauCarburant: "",
    observations: "",
    checks: emptyChecks(),
  };
}

function mapApiToForm(
  data: Record<string, unknown>,
  voiture: VoitureSAV,
  fallbackType: TypeCheckListSAV = "RECEPTION",
): CheckListFormState {
  const type: TypeCheckListSAV =
    data.type === "RECEPTION" || data.type === "PREPARATION" || data.type === "FINALE"
      ? data.type
      : fallbackType;
  const base = buildInitialForm(voiture, type);
  const checks = emptyChecks();
  for (const key of ALL_BOOLEAN_KEYS) {
    checks[key] = Boolean(data[key]);
  }
  return {
    ...base,
    id: typeof data.id === "string" ? data.id : undefined,
    titre: typeof data.titre === "string" && data.titre ? data.titre : base.titre,
    type,
    statut:
      data.statut === "VALIDE" ||
      data.statut === "TERMINEE" ||
      data.statut === "EN_ATTENTE" ||
      data.statut === "EN_COURS" ||
      data.statut === "ECHEC" ||
      data.statut === "ANNULE"
        ? data.statut
        : "EN_ATTENTE",
    date: toDateInputValue((data.date as string | Date | null) ?? null),
    numeroOrdreReparation:
      typeof data.numeroOrdreReparation === "string" ? data.numeroOrdreReparation : "",
    nomClient: typeof data.nomClient === "string" ? data.nomClient : base.nomClient,
    telephone: typeof data.telephone === "string" ? data.telephone : base.telephone,
    marque: typeof data.marque === "string" ? data.marque : base.marque,
    modele: typeof data.modele === "string" ? data.modele : base.modele,
    immatriculation:
      typeof data.immatriculation === "string" ? data.immatriculation : base.immatriculation,
    numeroChassis: typeof data.numeroChassis === "string" ? data.numeroChassis : "",
    kilometrage:
      data.kilometrage === null || data.kilometrage === undefined
        ? ""
        : String(data.kilometrage),
    niveauCarburant: typeof data.niveauCarburant === "string" ? data.niveauCarburant : "",
    observations: typeof data.observations === "string" ? data.observations : "",
    checks,
  };
}

async function fetchChecklist(voitureSAVId: string, type: TypeCheckListSAV) {
  const res = await fetch(
    `/api/sav/checklist-sav?voitureSAVId=${voitureSAVId}&type=${type}`,
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur chargement check-list");
  return json.data as Record<string, unknown> | null;
}

async function saveChecklist(voitureSAVId: string, form: CheckListFormState) {
  const payload = {
    voitureSAVId,
    type: form.type,
    titre: form.titre,
    statut: form.statut,
    date: form.date,
    numeroOrdreReparation: form.numeroOrdreReparation,
    nomClient: form.nomClient,
    telephone: form.telephone,
    marque: form.marque,
    modele: form.modele,
    immatriculation: form.immatriculation,
    numeroChassis: form.numeroChassis,
    kilometrage: form.kilometrage === "" ? null : Number(form.kilometrage),
    niveauCarburant: form.niveauCarburant,
    observations: form.observations,
    ...form.checks,
  };

  const res = await fetch("/api/sav/checklist-sav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Erreur enregistrement");
  return json.data as Record<string, unknown>;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label className="text-[13px] font-medium text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

export default function CheckListVerificationForm({
  voiture,
}: {
  voiture: VoitureSAV;
}) {
  const [checklistType, setChecklistType] = useState<TypeCheckListSAV>("RECEPTION");
  const [form, setForm] = useState<CheckListFormState>(() =>
    buildInitialForm(voiture, "RECEPTION"),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchChecklist(voiture.id, checklistType);
        if (cancelled) return;
        setForm(
          data
            ? mapApiToForm(data, voiture, checklistType)
            : buildInitialForm(voiture, checklistType),
        );
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Erreur chargement");
          setForm(buildInitialForm(voiture, checklistType));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [voiture, checklistType]);

  const checkedCount = useMemo(
    () => ALL_BOOLEAN_KEYS.filter((k) => form.checks[k]).length,
    [form.checks]
  );

  const progress = Math.round((checkedCount / ALL_BOOLEAN_KEYS.length) * 100);

  const setField = <K extends keyof CheckListFormState>(key: K, value: CheckListFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (type: TypeCheckListSAV) => {
    setChecklistType(type);
  };

  const toggleCheck = (key: BooleanKey, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      checks: { ...prev.checks, [key]: value },
    }));
  };

  const handleSave = async (statut: "EN_ATTENTE" | "EN_COURS" | "VALIDE") => {
    setSaving(true);
    try {
      const saved = await saveChecklist(voiture.id, {
        ...form,
        type: checklistType,
        statut,
      });
      setForm(mapApiToForm(saved, voiture, checklistType));
      toast.success(
        statut === "VALIDE"
          ? "Check-list validée et enregistrée"
          : "Check-list enregistrée"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-24">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
          <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Chargement de la check-list…</p>
      </div>
    );
  }

  const clientName =
    [voiture.ClientSAV?.nom, voiture.ClientSAV?.prenom].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-4 pb-24 sm:space-y-5 sm:pb-28">
      {/* Compact vehicle strip */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <Car className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">{voiture.model}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {clientName}
                </span>
                <span className="hidden text-slate-300 sm:inline">•</span>
                <span className="inline-flex items-center gap-1 font-mono tracking-wide text-slate-700">
                  <Hash className="h-3 w-3" />
                  {voiture.immatriculation}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-lg bg-sky-50 px-2.5 py-1 text-sky-800 border-sky-100"
            >
              {CHECKLIST_TYPE_OPTIONS.find((o) => o.value === checklistType)?.label ??
                checklistType}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-lg bg-sky-50 px-2.5 py-1 text-sky-800 border-sky-100"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {checkedCount}/{ALL_BOOLEAN_KEYS.length}
            </Badge>
            {form.statut === "VALIDE" ? (
              <Badge className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 border-emerald-100 hover:bg-emerald-50">
                Validée
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600"
              >
                Brouillon
              </Badge>
            )}
          </div>
        </div>

        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Infos générales */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="space-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-5">
          <CardTitle className="text-base font-semibold text-slate-800 sm:text-lg">
            Informations générales
          </CardTitle>
          <p className="text-xs text-slate-500 sm:text-sm">
            Identité du dossier et du véhicule à réception
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
          <Field label="Type de check-list">
            <Select
              value={checklistType}
              onValueChange={(v) => handleTypeChange(v as TypeCheckListSAV)}
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                {CHECKLIST_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              className="h-11 rounded-xl border-slate-200 bg-white"
            />
          </Field>
          <Field label="N° ordre de réparation">
            <Input
              value={form.numeroOrdreReparation}
              onChange={(e) => setField("numeroOrdreReparation", e.target.value)}
              placeholder="OR-…"
              className="h-11 rounded-xl border-slate-200"
            />
          </Field>
          <Field label="Nom du client">
            <Input
              value={form.nomClient}
              onChange={(e) => setField("nomClient", e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </Field>
          <Field label="Téléphone">
            <Input
              value={form.telephone}
              onChange={(e) => setField("telephone", e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </Field>
          <Field label="Marque">
            <Input
              value={form.marque}
              onChange={(e) => setField("marque", e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </Field>
          <Field label="Modèle">
            <Input
              value={form.modele}
              onChange={(e) => setField("modele", e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </Field>
          <Field label="Immatriculation">
            <Input
              value={form.immatriculation}
              onChange={(e) => setField("immatriculation", e.target.value)}
              className="h-11 rounded-xl border-slate-200 font-mono tracking-wide"
            />
          </Field>
          <Field label="N° châssis">
            <Input
              value={form.numeroChassis}
              onChange={(e) => setField("numeroChassis", e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </Field>
          <Field label="Kilométrage">
            <div className="relative">
              <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                min={0}
                value={form.kilometrage}
                onChange={(e) => setField("kilometrage", e.target.value)}
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>
          </Field>
          <Field label="Niveau de carburant" className="sm:col-span-2 lg:col-span-3">
            <div className="relative">
              <Fuel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={form.niveauCarburant}
                onChange={(e) => setField("niveauCarburant", e.target.value)}
                placeholder="Ex. 1/2, 3/4, plein…"
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>
          </Field>
        </CardContent>
      </Card>

      {/* Checklist sections */}
      <div className="space-y-3 sm:space-y-4">
        {CHECK_SECTIONS.map((section, index) => {
          const sectionChecked = section.items.filter((i) => form.checks[i.key]).length;
          const allDone = sectionChecked === section.items.length;
          return (
            <Card
              key={section.title}
              className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      allDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sky-100 text-sky-700"
                    )}
                  >
                    {index + 2}
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-[15px] font-semibold text-slate-800 sm:text-base">
                      <span className="sm:hidden">{section.short}</span>
                      <span className="hidden sm:inline">{section.title}</span>
                    </CardTitle>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-0.5 text-xs",
                    allDone
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {sectionChecked}/{section.items.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {section.items.map((item) => {
                    const isChecked = form.checks[item.key];
                    return (
                      <label
                        key={item.key}
                        className={cn(
                          "flex min-h-[48px] touch-manipulation items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                          isChecked
                            ? "border-sky-300/70 bg-sky-50/90"
                            : "border-slate-200/90 bg-slate-50/40 active:bg-slate-100 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(v) => toggleCheck(item.key, !!v)}
                          className="h-5 w-5 shrink-0 rounded-md border-2 data-[state=checked]:border-sky-500 data-[state=checked]:bg-sky-500"
                        />
                        <span
                          className={cn(
                            "text-sm font-medium leading-snug",
                            isChecked ? "text-sky-950" : "text-slate-700"
                          )}
                        >
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Observations */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="space-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-5">
          <CardTitle className="text-base font-semibold text-slate-800 sm:text-lg">
            Observations
          </CardTitle>
          <p className="text-xs text-slate-500 sm:text-sm">
            Anomalies, remarques client, points à suivre
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Textarea
            value={form.observations}
            onChange={(e) => setField("observations", e.target.value)}
            rows={4}
            placeholder="Observations, anomalies, remarques du client…"
            className="min-h-[110px] resize-y rounded-xl border-slate-200"
          />
        </CardContent>
      </Card>

      {/* Sticky bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3">
          <div className="mr-auto hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium text-slate-800">
              {checkedCount} points contrôlés
            </p>
            <p className="text-xs text-slate-500">{progress}% de la check-list</p>
          </div>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => handleSave("EN_ATTENTE")}
            className="h-11 flex-1 rounded-xl sm:flex-none sm:min-w-[8.5rem]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-2">Brouillon</span>
          </Button>
          <Button
            onClick={() => handleSave("VALIDE")}
            disabled={saving}
            className="h-11 flex-[1.4] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-600 hover:to-blue-700 sm:flex-none sm:min-w-[12rem]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            <span className="ml-2">{saving ? "Enregistrement…" : "Enregistrer"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
