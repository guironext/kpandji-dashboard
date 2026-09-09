"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Camera,
  Car,
  Check,
  ImageIcon,
  Loader2,
  PackagePlus,
  Package,
  Boxes,
  Hash,
  Pencil,
  Eye,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import CameraCapture, {
  requestCarCamera,
} from "@/app/(dashboard)/sav/diagnostique-arrivee/CameraCapture";

export type PieceSAVRow = {
  id: string;
  nom: string;
  model_voiture: string | null;
  marque_piece: string | null;
  part_code: string | null;
  description: string | null;
  image: string | null;
  emplacement: string | null;
  origine: string | null;
  prix_achat: number | null;
  prix_vente: number | null;
  quantite_entree: number;
};

const priceFmt = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const MODEL_SEP = " · ";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function parseModelVoiture(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\s*[·|,;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeModelVoiture(models: string[]): string {
  return models.join(MODEL_SEP);
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

function emptyDash(value: React.ReactNode) {
  if (value == null || value === "") {
    return <span className="font-normal text-slate-400">—</span>;
  }
  return value;
}

const ORIGINE_OPTIONS = ["Achat local", "Usine"] as const;

const fieldClass =
  "h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20";

function stopCameraTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function PieceImageField({
  id,
  file,
  preview,
  inputKey,
  onFile,
  onClear,
}: {
  id: string;
  file: File | null;
  preview: string | null;
  inputKey: number;
  onFile: (file: File | null) => void;
  onClear: () => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);

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

  const openLiveCamera = async () => {
    setStartingCamera(true);
    try {
      const stream = await requestCarCamera("environment");
      replaceCameraStream(stream);
      setCameraOpen(true);
    } catch {
      toast.error(
        "Impossible d'accéder à la caméra. Ouverture de l'appareil photo."
      );
      cameraInputRef.current?.click();
    } finally {
      setStartingCamera(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCameraTracks(cameraStreamRef.current);
      cameraStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    setCameraOpen(false);
    if (cameraStreamRef.current) {
      stopCameraTracks(cameraStreamRef.current);
      cameraStreamRef.current = null;
      setCameraStream(null);
    }
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [inputKey]);

  return (
    <div className="grid gap-2">
      <Label className="text-slate-700">Photo</Label>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          closeLiveCamera();
        }}
      />

      {cameraOpen && cameraStream ? (
        <CameraCapture
          initialStream={cameraStream}
          fileNamePrefix="piece-sav"
          onCapture={(captured) => {
            onFile(captured);
            closeLiveCamera();
          }}
          onCancel={closeLiveCamera}
          onStreamChange={replaceCameraStream}
          onNativeFallback={() => {
            closeLiveCamera();
            cameraInputRef.current?.click();
          }}
        />
      ) : preview ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Aperçu de la pièce"
            className="h-40 w-full object-contain"
          />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 rounded-full bg-white/90 px-3 text-xs font-semibold shadow-md hover:bg-white"
              disabled={startingCamera}
              onClick={() => void openLiveCamera()}
            >
              {startingCamera ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="mr-1.5 h-3.5 w-3.5" />
              )}
              Reprendre
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/90 shadow-sm"
              onClick={onClear}
              aria-label="Retirer la photo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {file ? (
            <p className="truncate border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
              {file.name}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          id={id}
          disabled={startingCamera}
          onClick={() => void openLiveCamera()}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99] disabled:opacity-70"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            {startingCamera ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </div>
          <span className="text-sm font-semibold text-emerald-950">
            {startingCamera ? "Ouverture…" : "Prendre une photo"}
          </span>
          <span className="text-xs text-emerald-700">
            Utiliser la caméra de cet appareil
          </span>
        </button>
      )}
    </div>
  );
}

function ModelesVoitureField({
  models,
  selected,
  onChange,
}: {
  models: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return models;
    return models.filter((m) => normalize(m).includes(q));
  }, [models, query]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.includes(m));

  function toggle(model: string) {
    onChange(
      selected.includes(model)
        ? selected.filter((m) => m !== model)
        : [...selected, model]
    );
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      const drop = new Set(filtered);
      onChange(selected.filter((m) => !drop.has(m)));
    } else {
      onChange(Array.from(new Set([...selected, ...filtered])));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-slate-700">
          Modèle voiture
          <span className="ml-1.5 font-normal text-slate-400">
            (plusieurs possibles)
          </span>
        </Label>
        {filtered.length > 0 ? (
          <button
            type="button"
            onClick={toggleAllFiltered}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((model) => (
            <Badge
              key={model}
              className="gap-1 rounded-full border-0 bg-emerald-100 px-2.5 py-1 font-medium text-emerald-900 hover:bg-emerald-100"
            >
              {model}
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-200"
                onClick={() => toggle(model)}
                aria-label={`Retirer ${model}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative border-b border-slate-100">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un modèle…"
            className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-44 space-y-1 overflow-y-auto p-2">
          {models.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              Aucun modèle enregistré.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              Aucun modèle ne correspond.
            </p>
          ) : (
            filtered.map((model) => {
              const checked = selected.includes(model);
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggle(model)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                    checked
                      ? "bg-emerald-50 ring-1 ring-emerald-200"
                      : "hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      checked
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {checked ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <Car
                    className={cn(
                      "h-4 w-4 shrink-0",
                      checked ? "text-emerald-700" : "text-slate-400"
                    )}
                  />
                  <span className="truncate text-sm font-medium text-slate-800">
                    {model}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AjouterPiecesSavClient({
  initialPieces,
  voitureModels,
}: {
  initialPieces: PieceSAVRow[];
  voitureModels: string[];
}) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [active, setActive] = useState<PieceSAVRow | null>(null);
  const [search, setSearch] = useState("");

  const [nom, setNom] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [marquePiece, setMarquePiece] = useState("");
  const [partCode, setPartCode] = useState("");
  const [emplacement, setEmplacement] = useState("");
  const [origine, setOrigine] = useState("");
  const [description, setDescription] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [quantiteEntree, setQuantiteEntree] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);

  useEffect(() => {
    setPieces(initialPieces);
  }, [initialPieces]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const stats = useMemo(() => {
    const n = pieces.length;
    const units = pieces.reduce((acc, p) => acc + (p.quantite_entree ?? 0), 0);
    return { references: n, units };
  }, [pieces]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return pieces;
    return pieces.filter((p) => {
      const hay = [
        p.nom,
        p.model_voiture,
        p.marque_piece,
        p.part_code,
        p.emplacement,
        p.origine,
        p.description,
      ]
        .filter(Boolean)
        .join(" ");
      return normalize(hay).includes(q);
    });
  }, [pieces, search]);

  function resetForm() {
    setNom("");
    setSelectedModels([]);
    setMarquePiece("");
    setPartCode("");
    setEmplacement("");
    setOrigine("");
    setDescription("");
    setPrixAchat("");
    setPrixVente("");
    setQuantiteEntree("0");
    setImageFile(null);
    setImagePreview(null);
    setImageInputKey((k) => k + 1);
  }

  function resetEditForm() {
    setActive(null);
    resetForm();
  }

  function openView(p: PieceSAVRow) {
    setActive(p);
    setViewOpen(true);
  }

  function openEdit(p: PieceSAVRow) {
    setActive(p);
    setNom(p.nom);
    setSelectedModels(parseModelVoiture(p.model_voiture));
    setMarquePiece(p.marque_piece ?? "");
    setPartCode(p.part_code ?? "");
    setEmplacement(p.emplacement ?? "");
    setOrigine(p.origine ?? "");
    setDescription(p.description ?? "");
    setPrixAchat(p.prix_achat != null ? String(p.prix_achat) : "");
    setPrixVente(p.prix_vente != null ? String(p.prix_vente) : "");
    setQuantiteEntree(String(p.quantite_entree));
    setImageFile(null);
    setImagePreview(p.image ?? null);
    setImageInputKey((k) => k + 1);
    setEditOpen(true);
  }

  function openDelete(p: PieceSAVRow) {
    setActive(p);
    setDeleteOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Saisissez le nom de la pièce.");
      return;
    }
    const qe = parseInt(quantiteEntree, 10);
    if (Number.isNaN(qe) || qe < 0) {
      toast.error("La quantité entrée doit être un entier positif ou zéro.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("nom", nom.trim());
      fd.append("model_voiture", serializeModelVoiture(selectedModels));
      fd.append("marque_piece", marquePiece.trim());
      fd.append("part_code", partCode.trim());
      fd.append("emplacement", emplacement.trim());
      fd.append("origine", origine);
      fd.append("description", description.trim());
      fd.append("prix_achat", prixAchat.trim());
      fd.append("prix_vente", prixVente.trim());
      fd.append("quantite_entree", String(qe));
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/sav/piece-sav", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success("Pièce enregistrée.");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    if (!nom.trim()) {
      toast.error("Saisissez le nom de la pièce.");
      return;
    }
    const qe = parseInt(quantiteEntree, 10);
    if (Number.isNaN(qe) || qe < 0) {
      toast.error("La quantité entrée doit être un entier positif ou zéro.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("nom", nom.trim());
      fd.append("model_voiture", serializeModelVoiture(selectedModels));
      fd.append("marque_piece", marquePiece.trim());
      fd.append("part_code", partCode.trim());
      fd.append("emplacement", emplacement.trim());
      fd.append("origine", origine);
      fd.append("description", description.trim());
      fd.append("prix_achat", prixAchat.trim());
      fd.append("prix_vente", prixVente.trim());
      fd.append("quantite_entree", String(qe));
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch(`/api/sav/piece-sav/${active.id}`, {
        method: "PATCH",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      toast.success("Pièce mise à jour.");
      setEditOpen(false);
      resetEditForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!active) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sav/piece-sav/${active.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression impossible");
      }
      toast.success("Pièce supprimée.");
      setDeleteOpen(false);
      setActive(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  }

  const renderFormFields = () => (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[minmax(0,240px)_1fr] md:items-start">
        <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-b from-emerald-50/90 to-white p-3 shadow-sm">
          <PieceImageField
            id={editOpen ? "edit-image" : "image"}
            file={imageFile}
            preview={imagePreview}
            inputKey={imageInputKey}
            onFile={setImageFile}
            onClear={() => {
              setImageFile(null);
              setImagePreview(editOpen ? active?.image ?? null : null);
              setImageInputKey((k) => k + 1);
            }}
          />
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="piece-nom" className="text-slate-700">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="piece-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex. Filtre à huile"
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="piece-marque" className="text-slate-700">
                Marque pièce
              </Label>
              <Input
                id="piece-marque"
                value={marquePiece}
                onChange={(e) => setMarquePiece(e.target.value)}
                placeholder="Optionnel"
                className={fieldClass}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="piece-code" className="text-slate-700">
                Part code
              </Label>
              <Input
                id="piece-code"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                placeholder="Référence constructeur"
                className={cn(fieldClass, "font-mono text-sm")}
              />
            </div>
          </div>
        </div>
      </div>

      <ModelesVoitureField
        models={voitureModels}
        selected={selectedModels}
        onChange={setSelectedModels}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="piece-emplacement" className="text-slate-700">
            Emplacement
          </Label>
          <Input
            id="piece-emplacement"
            value={emplacement}
            onChange={(e) => setEmplacement(e.target.value)}
            placeholder="Ex. Étagère A3, atelier"
            className={fieldClass}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-slate-700">Origine</Label>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {ORIGINE_OPTIONS.map((option) => {
              const active = origine === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOrigine(active ? "" : option)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Stock &amp; prix
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="piece-qe" className="text-slate-700">
              Quantité entrée <span className="text-red-500">*</span>
            </Label>
            <Input
              id="piece-qe"
              type="number"
              min={0}
              step={1}
              value={quantiteEntree}
              onChange={(e) => setQuantiteEntree(e.target.value)}
              required
              className={fieldClass}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="piece-achat" className="text-slate-700">
              Prix d&apos;achat
            </Label>
            <Input
              id="piece-achat"
              type="number"
              min={0}
              step="0.01"
              value={prixAchat}
              onChange={(e) => setPrixAchat(e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="piece-vente" className="text-slate-700">
              Prix de vente
            </Label>
            <Input
              id="piece-vente"
              type="number"
              min={0}
              step="0.01"
              value={prixVente}
              onChange={(e) => setPrixVente(e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="piece-desc" className="text-slate-700">
          Description
        </Label>
        <Textarea
          id="piece-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Notes, condition…"
          className="min-h-[88px] resize-none rounded-xl border-slate-200 bg-white shadow-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-10">
      {/* Hero */}
      <div className="relative mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-emerald-200/40",
            "bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950",
            "px-6 py-8 shadow-[0_24px_48px_-12px_rgba(6,78,59,0.35)] md:px-10 md:py-10"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-100/90 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                Stock atelier SAV
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Pièces de rechange
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-slate-300/95 md:text-base">
                Référencez les pièces, suivez les quantités entrées et les prix
                d&apos;achat et de vente pour un inventaire clair et à jour.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 shrink-0 gap-2 self-stretch border-0 shadow-lg shadow-emerald-900/40",
                "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-teal-400",
                "lg:self-end"
              )}
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <PackagePlus className="h-5 w-5" />
              Ajouter une pièce
            </Button>
          </div>

          <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Références
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.references}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-200">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Unités (entrées)
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.units}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-slate-200">
                  <Hash className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Recherche active
                  </p>
                  <p className="truncate text-sm text-slate-200">
                    {search.trim()
                      ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`
                      : "Tout l’inventaire"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-4 md:px-6">
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Inventaire
                </CardTitle>
                <CardDescription className="mt-1.5 text-slate-600">
                  Filtrez par nom, modèle ou emplacement.
                </CardDescription>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 shadow-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="w-[72px] font-semibold text-slate-700">
                      Image
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Modèle
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-slate-700">
                      Nom
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Emplacement
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Qté
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      P. vente
                    </TableHead>
                    <TableHead className="min-w-[120px] text-center font-semibold text-slate-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 p-0">
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
                            <Package className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {pieces.length === 0
                              ? "Aucune pièce pour l’instant"
                              : "Aucun résultat"}
                          </h3>
                          <p className="mt-2 max-w-sm text-sm text-slate-500">
                            {pieces.length === 0
                              ? "Ajoutez votre première pièce avec le bouton ci-dessus."
                              : "Modifiez votre recherche ou effacez le filtre."}
                          </p>
                          {pieces.length > 0 && search.trim() && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-4 rounded-full"
                              onClick={() => setSearch("")}
                            >
                              Effacer la recherche
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        className={cn(
                          "border-slate-100 transition-colors",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                          "hover:bg-emerald-50/50"
                        )}
                      >
                        <TableCell>
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt={p.nom}
                              className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <ImageIcon className="h-4 w-4" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          {parseModelVoiture(p.model_voiture).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {parseModelVoiture(p.model_voiture).map((m) => (
                                <Badge
                                  key={m}
                                  variant="secondary"
                                  className="rounded-full font-normal text-slate-700"
                                >
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {p.nom}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {p.emplacement ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex min-w-[2rem] justify-end rounded-lg bg-emerald-50 px-2 py-0.5 font-semibold tabular-nums text-emerald-900">
                            {p.quantite_entree}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {p.prix_vente != null
                            ? priceFmt.format(p.prix_vente)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              aria-label={`Voir ${p.nom}`}
                              onClick={() => openView(p)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Supprimer ${p.nom}`}
                              onClick={() => openDelete(p)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={viewOpen}
        onOpenChange={(o) => {
          setViewOpen(o);
          if (!o && !editOpen && !deleteOpen) setActive(null);
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[min(94vh,880px)] flex-col gap-0 overflow-hidden rounded-[28px] border-0 p-0 sm:max-w-2xl",
            "shadow-[0_24px_80px_-12px_rgba(6,78,59,0.35)]",
            "[&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5",
            "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/10",
            "[&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white",
            "[&_[data-slot=dialog-close]]:hover:bg-white/20 [&_[data-slot=dialog-close]]:hover:text-white"
          )}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 px-6 py-6 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <DialogHeader className="relative space-y-1 text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Eye className="h-5 w-5 text-emerald-200" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                {active?.nom ?? "Détail de la pièce"}
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-100/80">
                Fiche complète de la pièce sélectionnée.
              </DialogDescription>
            </DialogHeader>
          </div>

          {active ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-6 py-5">
              <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-start">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {active.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={active.image}
                      alt={active.nom}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Nom">{active.nom}</DetailField>
                  <DetailField label="Marque pièce">
                    {emptyDash(active.marque_piece)}
                  </DetailField>
                  <DetailField label="Part code">
                    {active.part_code ? (
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800">
                        {active.part_code}
                      </code>
                    ) : (
                      emptyDash(null)
                    )}
                  </DetailField>
                  <DetailField label="Emplacement">
                    {emptyDash(active.emplacement)}
                  </DetailField>
                  <DetailField label="Origine">
                    {active.origine ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal",
                          active.origine === "Usine"
                            ? "bg-sky-50 text-sky-800"
                            : "bg-amber-50 text-amber-800"
                        )}
                      >
                        {active.origine}
                      </Badge>
                    ) : (
                      emptyDash(null)
                    )}
                  </DetailField>
                  <DetailField label="Quantité entrée">
                    <span className="tabular-nums">{active.quantite_entree}</span>
                  </DetailField>
                  <DetailField label="Prix d'achat">
                    {active.prix_achat != null
                      ? priceFmt.format(active.prix_achat)
                      : emptyDash(null)}
                  </DetailField>
                  <DetailField label="Prix de vente">
                    {active.prix_vente != null
                      ? priceFmt.format(active.prix_vente)
                      : emptyDash(null)}
                  </DetailField>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <DetailField label="Modèles voiture">
                  {parseModelVoiture(active.model_voiture).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {parseModelVoiture(active.model_voiture).map((m) => (
                        <Badge
                          key={m}
                          variant="secondary"
                          className="rounded-full font-normal text-slate-700"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    emptyDash(null)
                  )}
                </DetailField>
                <DetailField label="Description">
                  <p className="whitespace-pre-wrap font-normal leading-relaxed text-slate-700">
                    {active.description?.trim() ? active.description : "—"}
                  </p>
                </DetailField>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => setViewOpen(false)}
            >
              Fermer
            </Button>
            {active ? (
              <Button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 sm:w-auto"
                onClick={() => {
                  setViewOpen(false);
                  openEdit(active);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) resetEditForm();
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[min(94vh,920px)] flex-col gap-0 overflow-hidden rounded-[28px] border-0 p-0 sm:max-w-2xl",
            "shadow-[0_24px_80px_-12px_rgba(6,78,59,0.35)]",
            "[&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5",
            "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/10",
            "[&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white",
            "[&_[data-slot=dialog-close]]:hover:bg-white/20 [&_[data-slot=dialog-close]]:hover:text-white"
          )}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 px-6 py-6 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <DialogHeader className="relative space-y-1 text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Pencil className="h-5 w-5 text-emerald-200" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                Modifier la pièce
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-100/80">
                Mettez à jour l&apos;identification, les modèles, le stock et la photo.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleEditSubmit}
            className="flex min-h-0 flex-1 flex-col bg-slate-50/40"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {editOpen ? renderFormFields() : null}
            </div>
            <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setEditOpen(false);
                  resetEditForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl border-slate-200/80">
          <DialogHeader>
            <DialogTitle>Supprimer la pièce ?</DialogTitle>
            <DialogDescription className="text-slate-600">
              {active ? (
                <>
                  Cette action est définitive. La référence{" "}
                  <span className="font-semibold text-slate-800">
                    {active.nom}
                  </span>{" "}
                  sera retirée de l&apos;inventaire.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[min(94vh,920px)] flex-col gap-0 overflow-hidden rounded-[28px] border-0 p-0 sm:max-w-2xl",
            "shadow-[0_24px_80px_-12px_rgba(6,78,59,0.35)]",
            "[&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5",
            "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/10",
            "[&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white",
            "[&_[data-slot=dialog-close]]:hover:bg-white/20 [&_[data-slot=dialog-close]]:hover:text-white"
          )}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 px-6 py-6 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <DialogHeader className="relative space-y-1 text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <PackagePlus className="h-5 w-5 text-emerald-200" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                Nouvelle pièce
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-100/80">
                Identification, modèles compatibles, stock et photo de la pièce.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col bg-slate-50/40"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {dialogOpen ? renderFormFields() : null}
            </div>
            <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer la pièce"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
