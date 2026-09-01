"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Car,
  Save,
  User,
  CheckCircle2,
  Fuel,
  Gauge,
  Camera,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CameraCapture, { requestCarCamera } from "./CameraCapture";

type TypeCheckListSAV = "RECEPTION" | "PREPARATION" | "FINALE";

const CHECKLIST_TYPE_OPTIONS: { value: TypeCheckListSAV; label: string }[] = [
  { value: "RECEPTION", label: "Réception" },
  { value: "PREPARATION", label: "Préparation" },
  { value: "FINALE", label: "Teste finale" },
];

const ALL_CHECKLIST_TYPES = CHECKLIST_TYPE_OPTIONS.map((o) => o.value);

interface VoitureSAV {
  id: string;
  model: string;
  immatriculation: string;
  chassisNumber?: string | null;
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
  photos: string[];
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

function generateNumeroOrdreReparation() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OR-${datePart}-${randomPart}`;
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
    numeroOrdreReparation: generateNumeroOrdreReparation(),
    nomClient: clientName,
    telephone: voiture.ClientSAV?.contact || "",
    marque: "KPANDJI",
    modele: voiture.model || "",
    immatriculation: voiture.immatriculation || "",
    numeroChassis: voiture.chassisNumber || "",
    kilometrage: "",
    niveauCarburant: "",
    observations: "",
    photos: [],
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
      typeof data.numeroOrdreReparation === "string" && data.numeroOrdreReparation.trim()
        ? data.numeroOrdreReparation
        : generateNumeroOrdreReparation(),
    nomClient: typeof data.nomClient === "string" ? data.nomClient : base.nomClient,
    telephone: typeof data.telephone === "string" ? data.telephone : base.telephone,
    marque: typeof data.marque === "string" ? data.marque : base.marque,
    modele: typeof data.modele === "string" ? data.modele : base.modele,
    immatriculation:
      typeof data.immatriculation === "string" ? data.immatriculation : base.immatriculation,
    numeroChassis:
      voiture.chassisNumber ||
      (typeof data.numeroChassis === "string" ? data.numeroChassis : ""),
    kilometrage:
      data.kilometrage === null || data.kilometrage === undefined
        ? ""
        : String(data.kilometrage),
    niveauCarburant: typeof data.niveauCarburant === "string" ? data.niveauCarburant : "",
    observations: typeof data.observations === "string" ? data.observations : "",
    photos: Array.isArray(data.photos)
      ? data.photos.filter((p): p is string => typeof p === "string" && p.length > 0)
      : [],
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
    numeroOrdreReparation:
      form.numeroOrdreReparation.trim() || generateNumeroOrdreReparation(),
    nomClient: form.nomClient,
    telephone: form.telephone,
    marque: form.marque,
    modele: form.modele,
    immatriculation: form.immatriculation,
    numeroChassis: form.numeroChassis,
    kilometrage: form.kilometrage === "" ? null : Number(form.kilometrage),
    niveauCarburant: form.niveauCarburant,
    observations: form.observations,
    photos: form.photos,
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
  onSaved,
  defaultType = "RECEPTION",
  allowedTypes,
  validateSuccessMessage,
  footerHint,
  requireAllChecked = false,
  showDraftButton = true,
}: {
  voiture: VoitureSAV;
  onSaved?: (payload?: { observations: string }) => void | Promise<void>;
  defaultType?: TypeCheckListSAV;
  allowedTypes?: TypeCheckListSAV[];
  validateSuccessMessage?: string;
  footerHint?: string;
  requireAllChecked?: boolean;
  showDraftButton?: boolean;
}) {
  const typeOptions = useMemo(() => {
    const allowed = allowedTypes?.length ? allowedTypes : ALL_CHECKLIST_TYPES;
    return CHECKLIST_TYPE_OPTIONS.filter((o) => allowed.includes(o.value));
  }, [allowedTypes]);

  const resolvedDefault: TypeCheckListSAV =
    typeOptions.some((o) => o.value === defaultType)
      ? defaultType
      : (typeOptions[0]?.value ?? "RECEPTION");

  const [checklistType, setChecklistType] =
    useState<TypeCheckListSAV>(resolvedDefault);
  const [form, setForm] = useState<CheckListFormState>(() =>
    buildInitialForm(voiture, resolvedDefault),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const stopCameraTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const replaceCameraStream = (stream: MediaStream | null) => {
    if (cameraStreamRef.current && cameraStreamRef.current !== stream) {
      stopCameraTracks(cameraStreamRef.current);
    }
    cameraStreamRef.current = stream;
    setCameraStream(stream);
  };

  const closeLiveCamera = () => {
    setCameraOpen(false);
    replaceCameraStream(null);
  };

  const closeCameraDialog = () => {
    setCameraDialogOpen(false);
    closeLiveCamera();
  };

  const openLiveCamera = async () => {
    setStartingCamera(true);
    try {
      const stream = await requestCarCamera("environment");
      replaceCameraStream(stream);
      setCameraOpen(true);
    } catch {
      toast.error(
        "Impossible d'accéder à la caméra. Vous pouvez utiliser l'appareil photo natif.",
      );
      cameraInputRef.current?.click();
    } finally {
      setStartingCamera(false);
    }
  };

  const openCameraDialog = () => {
    setCameraDialogOpen(true);
    void openLiveCamera();
  };

  useEffect(() => {
    return () => {
      stopCameraTracks(cameraStreamRef.current);
      cameraStreamRef.current = null;
    };
  }, []);

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

  const uploadCarPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("voitureSAVId", voiture.id);
      formData.append("type", checklistType);
      formData.append("image", file);
      const res = await fetch("/api/sav/checklist-sav/photo", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement de la photo impossible");
      }
      const photos = Array.isArray(json.data?.photos)
        ? (json.data.photos as string[])
        : [...form.photos, json.url as string];
      setForm((prev) => ({
        ...prev,
        id: typeof json.data?.id === "string" ? json.data.id : prev.id,
        photos,
      }));
      toast.success("Photo du véhicule enregistrée");
      closeCameraDialog();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeCarPhoto = async (url: string) => {
    try {
      const res = await fetch("/api/sav/checklist-sav/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voitureSAVId: voiture.id,
          type: checklistType,
          url,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression impossible");
      }
      const photos = Array.isArray(json.data?.photos)
        ? (json.data.photos as string[])
        : form.photos.filter((p) => p !== url);
      setForm((prev) => ({ ...prev, photos }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur suppression");
    }
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
    if (statut === "VALIDE" && requireAllChecked && progress < 100) {
      toast.error("Tous les points de contrôle doivent être validés");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveChecklist(voiture.id, {
        ...form,
        type: checklistType,
        statut,
      });
      setForm(mapApiToForm(saved, voiture, checklistType));
      if (statut === "VALIDE") {
        await onSaved?.({ observations: form.observations });
      }
      toast.success(
        statut === "VALIDE"
          ? (validateSuccessMessage ??
            "Check-list validée — véhicule prêt pour le dispatching")
          : "Check-list enregistrée",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const toggleSectionAll = (sectionItems: { key: BooleanKey }[], targetState: boolean) => {
    setForm((prev) => {
      const nextChecks = { ...prev.checks };
      for (const item of sectionItems) {
        nextChecks[item.key] = targetState;
      }
      return { ...prev, checks: nextChecks };
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-24">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 shadow-inner">
          <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Chargement de la check-list…</p>
      </div>
    );
  }

  const clientName =
    [voiture.ClientSAV?.nom, voiture.ClientSAV?.prenom].filter(Boolean).join(" ") || "Client non renseigné";

  const FUEL_LEVEL_PRESETS = ["RÉSERVE", "1/4", "1/2", "3/4", "PLEIN"];

  return (
    <div className="space-y-4 pb-28 sm:space-y-6 sm:pb-32">
      {/* Vehicle Header & Progress Bar */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Car className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-bold text-slate-900 sm:text-lg">{voiture.model}</p>
                <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-sky-400 shadow-sm">
                  {voiture.immatriculation}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700 truncate">{clientName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl border-sky-200 bg-sky-50 text-sky-700 shadow-sm hover:bg-sky-100 hover:text-sky-900"
              onClick={openCameraDialog}
              disabled={startingCamera || uploadingPhoto}
              aria-label="Photographier le véhicule"
              title="Photographier le véhicule"
            >
              {startingCamera || uploadingPhoto ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </Button>
            <Badge
              variant="secondary"
              className="rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 border border-sky-100"
            >
              {CHECKLIST_TYPE_OPTIONS.find((o) => o.value === checklistType)?.label ??
                checklistType}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-xl bg-sky-100/70 px-3 py-1.5 text-xs font-bold text-sky-900 border border-sky-200/60"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4 text-sky-600" />
              {checkedCount}/{ALL_BOOLEAN_KEYS.length} ({progress}%)
            </Badge>
            {form.statut === "VALIDE" ? (
              <Badge className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                Validée
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Brouillon
              </Badge>
            )}
          </div>
        </div>

        {/* Progress indicator line */}
        <div className="h-2 w-full bg-slate-100">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Photos du véhicule */}
      <Card id="section-photos" className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-slate-900">
                Photos du véhicule
              </CardTitle>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                Photographiez l&apos;état du véhicule pendant le contrôle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="shrink-0 rounded-xl border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800"
            >
              {form.photos.length} photo{form.photos.length > 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 rounded-xl bg-sky-600 text-white shadow-sm hover:bg-sky-700"
              onClick={openCameraDialog}
              disabled={startingCamera || uploadingPhoto}
              aria-label="Prendre une photo"
            >
              {startingCamera || uploadingPhoto ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          {form.photos.length === 0 ? (
            <button
              type="button"
              onClick={openCameraDialog}
              disabled={startingCamera || uploadingPhoto}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 px-4 py-10 text-center transition-all hover:bg-sky-50 active:scale-[0.99] disabled:opacity-70"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md">
                {startingCamera || uploadingPhoto ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </div>
              <p className="text-sm font-bold text-sky-950">Photographier le véhicule</p>
              <p className="text-xs text-sky-700">Ouvrir la caméra pour prendre une photo</p>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {form.photos.map((url) => (
                <div
                  key={url}
                  className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="block w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Photo véhicule"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white"
                    onClick={() => void removeCarPhoto(url)}
                    aria-label="Supprimer la photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={openCameraDialog}
                disabled={startingCamera || uploadingPhoto}
                className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 text-sky-800 transition-all hover:bg-sky-50 active:scale-95"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-semibold">Ajouter</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Quick-Nav Pill Carousel */}
      <div className="sticky top-14 z-20 -mx-1 bg-slate-50/90 py-2 backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none snap-x">
          <button
            type="button"
            onClick={() => scrollToSection("section-photos")}
            className="snap-start shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
          >
            Photos
            {form.photos.length > 0 ? ` ${form.photos.length}` : ""}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-infos")}
            className="snap-start shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
          >
            Infos
          </button>
          {CHECK_SECTIONS.map((section, idx) => {
            const count = section.items.filter((i) => form.checks[i.key]).length;
            const done = count === section.items.length;
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => scrollToSection(`section-${idx}`)}
                className={cn(
                  "snap-start shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95",
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : count > 0
                    ? "border-sky-200 bg-sky-50 text-sky-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <span>{section.short}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.2 text-[10px] font-bold",
                    done ? "bg-emerald-200/80 text-emerald-900" : "bg-slate-100 text-slate-700"
                  )}
                >
                  {count}/{section.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Infos générales */}
      <Card id="section-infos" className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="space-y-1 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5">
          <CardTitle className="text-base font-bold text-slate-800 sm:text-lg">
            Informations générales
          </CardTitle>
          <p className="text-xs text-slate-500 sm:text-sm">
            Identité du dossier et caractéristiques du véhicule
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
          <Field label="Type de check-list">
            <Select
              value={checklistType}
              onValueChange={(v) => handleTypeChange(v as TypeCheckListSAV)}
              disabled={typeOptions.length <= 1}
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm font-medium">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
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
              className="h-11 rounded-xl border-slate-200 bg-white shadow-sm font-medium"
            />
          </Field>

          <Field label="N° ordre de réparation">
            <Input
              value={form.numeroOrdreReparation}
              readOnly
              placeholder="OR-…"
              className="h-11 rounded-xl border-slate-200 bg-slate-100/70 font-mono text-xs font-bold tracking-wide text-slate-700"
            />
          </Field>

          <Field label="Nom du client">
            <Input
              value={form.nomClient}
              onChange={(e) => setField("nomClient", e.target.value)}
              className="h-11 rounded-xl border-slate-200 shadow-sm font-medium"
            />
          </Field>

          <Field label="Téléphone">
            <Input
              value={form.telephone}
              onChange={(e) => setField("telephone", e.target.value)}
              className="h-11 rounded-xl border-slate-200 shadow-sm font-medium"
            />
          </Field>

          <Field label="Marque">
            <Input
              value={form.marque}
              onChange={(e) => setField("marque", e.target.value)}
              className="h-11 rounded-xl border-slate-200 shadow-sm font-medium"
            />
          </Field>

          <Field label="Modèle">
            <Input
              value={form.modele}
              onChange={(e) => setField("modele", e.target.value)}
              className="h-11 rounded-xl border-slate-200 shadow-sm font-medium"
            />
          </Field>

          <Field label="Immatriculation">
            <Input
              value={form.immatriculation}
              onChange={(e) => setField("immatriculation", e.target.value)}
              className="h-11 rounded-xl border-slate-200 font-mono font-bold uppercase tracking-wide shadow-sm"
            />
          </Field>

          <Field label="N° châssis">
            <Input
              value={form.numeroChassis}
              readOnly
              placeholder="—"
              className="h-11 rounded-xl border-slate-200 bg-slate-100/70 font-mono text-xs font-bold tracking-wide text-slate-700 uppercase"
            />
          </Field>

          <Field label="Kilométrage (km)">
            <div className="relative">
              <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                min={0}
                value={form.kilometrage}
                onChange={(e) => setField("kilometrage", e.target.value)}
                placeholder="Ex. 125000"
                className="h-11 rounded-xl border-slate-200 pl-9 shadow-sm font-semibold text-slate-800"
              />
            </div>
          </Field>

          {/* 1-Tap Fuel Selector */}
          <Field label="Niveau de carburant" className="sm:col-span-2 lg:col-span-3">
            <div className="space-y-2">
              <div className="relative">
                <Fuel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={form.niveauCarburant}
                  onChange={(e) => setField("niveauCarburant", e.target.value)}
                  placeholder="Ex. 1/2, 3/4, plein…"
                  className="h-11 rounded-xl border-slate-200 pl-9 shadow-sm font-semibold text-slate-800"
                />
              </div>

              {/* 1-Tap Preset Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Touche rapide:</span>
                {FUEL_LEVEL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setField("niveauCarburant", preset)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-bold transition-all active:scale-95",
                      form.niveauCarburant === preset
                        ? "border-sky-500 bg-sky-500 text-white shadow-sm"
                        : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      <div className="space-y-4">
        {CHECK_SECTIONS.map((section, index) => {
          const sectionChecked = section.items.filter((i) => form.checks[i.key]).length;
          const allDone = sectionChecked === section.items.length;

          return (
            <Card
              key={section.title}
              id={`section-${index}`}
              className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm transition-all hover:border-slate-300"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold shadow-sm",
                      allDone
                        ? "bg-emerald-500 text-white"
                        : "bg-sky-100 text-sky-800"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base font-bold text-slate-900">
                      {section.title}
                    </CardTitle>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold",
                      allDone
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {sectionChecked}/{section.items.length}
                  </Badge>

                  {/* 1-Tap Select All Toggle Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSectionAll(section.items, !allDone)}
                    className="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-semibold hover:bg-sky-50 hover:text-sky-700 active:scale-95"
                  >
                    {allDone ? "Tout décocher" : "Tout cocher"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {section.items.map((item) => {
                    const isChecked = form.checks[item.key];
                    return (
                      <label
                        key={item.key}
                        className={cn(
                          "flex min-h-[48px] touch-manipulation items-center gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-all duration-150 select-none",
                          isChecked
                            ? "border-sky-400/80 bg-sky-50/90 text-sky-950 shadow-sm"
                            : "border-slate-200/90 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-white active:bg-slate-100"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(v) => toggleCheck(item.key, !!v)}
                          className="h-5 w-5 shrink-0 rounded-md border-2 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600"
                        />
                        <span
                          className={cn(
                            "text-sm font-semibold leading-snug",
                            isChecked ? "text-sky-950 font-bold" : "text-slate-700"
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
        <CardHeader className="space-y-1 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5">
          <CardTitle className="text-base font-bold text-slate-800 sm:text-lg">
            Observations & Remarques
          </CardTitle>
          <p className="text-xs text-slate-500 sm:text-sm">
            Anomalies constatées, remarques spécifiques du client ou points d&apos;attention
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Textarea
            value={form.observations}
            onChange={(e) => setField("observations", e.target.value)}
            rows={4}
            placeholder="Écrivez ici les observations ou particularités du véhicule à réception…"
            className="min-h-[120px] resize-y rounded-xl border-slate-200 font-medium text-slate-800 shadow-sm focus:ring-sky-400"
          />
        </CardContent>
      </Card>

      {/* Glassmorphic Floating Bottom Actions Bar */}
      <div className="fixed inset-x-3 bottom-3 z-40 max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 sm:bottom-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
              <p className="truncate text-sm font-bold text-slate-900">
                {checkedCount} / {ALL_BOOLEAN_KEYS.length} points vérifiés ({progress}%)
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {footerHint ?? "Check-list de réception"}
            </p>
          </div>

          <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
              onClick={openCameraDialog}
              disabled={startingCamera || uploadingPhoto}
              aria-label="Photographier le véhicule"
              title="Photographier le véhicule"
            >
              {startingCamera || uploadingPhoto ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </Button>
            {showDraftButton && (
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleSave("EN_ATTENTE")}
                className="h-11 flex-1 rounded-xl border-slate-300 font-semibold shadow-sm sm:flex-none sm:min-w-[9rem] active:scale-95 transition-transform"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">Brouillon</span>
              </Button>
            )}

            <Button
              type="button"
              disabled={saving || (requireAllChecked && progress < 100)}
              onClick={() => handleSave("VALIDE")}
              className="h-11 flex-[1.4] rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/25 hover:from-sky-600 hover:to-indigo-700 sm:flex-none sm:min-w-[13rem] active:scale-95 transition-transform"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span className="ml-2">{saving ? "Enregistrement…" : "Valider Check-list"}</span>
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) void uploadCarPhoto(file);
          e.target.value = "";
        }}
      />

      <Dialog
        open={cameraDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeCameraDialog();
        }}
      >
        <DialogContent className="max-h-[min(92vh,760px)] gap-0 overflow-y-auto rounded-3xl border-slate-200/80 p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/40 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Photographier le véhicule
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 sm:text-sm">
                Prenez une photo de {voiture.model} ({voiture.immatriculation}).
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            {uploadingPhoto ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                <p className="text-sm font-medium text-slate-500">
                  Enregistrement de la photo…
                </p>
              </div>
            ) : cameraOpen && cameraStream ? (
              <CameraCapture
                initialStream={cameraStream}
                onCapture={(file) => {
                  void uploadCarPhoto(file);
                }}
                onCancel={closeCameraDialog}
                onStreamChange={replaceCameraStream}
                onNativeFallback={() => {
                  closeLiveCamera();
                  cameraInputRef.current?.click();
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void openLiveCamera()}
                  disabled={startingCamera}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-6 transition-all hover:bg-sky-50 active:scale-95 disabled:opacity-70"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md">
                    {startingCamera ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-sky-950">
                    {startingCamera ? "Ouverture…" : "Prendre une photo"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 transition-all hover:border-slate-400 hover:bg-slate-100 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white shadow-md">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Galerie / Fichier
                  </span>
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl p-2 sm:p-3">
          <DialogHeader className="sr-only">
            <DialogTitle>Aperçu photo</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="Photo du véhicule"
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

