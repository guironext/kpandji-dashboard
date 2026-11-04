"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  Library,
  BadgeCheck,
  FileSignature,
  Landmark,
  ScrollText,
  UsersRound,
  CreditCard,
  Layers,
  Presentation,
  Wrench,
  CloudUpload,
  Inbox,
  Loader2,
  AlertTriangle,
  IdCard,
  Scale,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getCommercialDocumentationRecords,
  uploadCommercialDocumentation,
  deleteCommercialDocumentation,
} from "@/lib/actions/documentation";
import { downloadCommercialDocumentationFile } from "@/lib/documentation-download";

const CATEGORIES = [
  { id: "agrement", label: "Agrement" },
  { id: "arf", label: "ARF" },
  { id: "rccm", label: "RCCM" },
  { id: "dfe", label: "DFE" },
  { id: "cnps", label: "CNPS" },
  { id: "rib", label: "RIB" },
  { id: "catalogue", label: "Catalogue" },
  { id: "presentation", label: "Presentation" },
  { id: "fiche-technique", label: "Fiche Technique" },
  { id: "cni", label: "CNI" },
  { id: "conditions-generales-de-vente", label: "Condition Générales de vente" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/** Prisma TypeDocumentation → UI tab id */
const TYPE_TO_CATEGORY: Record<string, CategoryId> = {
  AGREMENT: "agrement",
  ARF: "arf",
  RCCM: "rccm",
  DFE: "dfe",
  CNPS: "cnps",
  RIB: "rib",
  CATALOGUE: "catalogue",
  PRESENTATION: "presentation",
  FICHE_TECHNIQUE: "fiche-technique",
  CNI: "cni",
  CONDITION_GENERALES_DE_VENTE: "conditions-generales-de-vente",
};

function fileNameFromPath(fichier: string): string {
  try {
    if (fichier.startsWith("http://") || fichier.startsWith("https://")) {
      const u = new URL(fichier);
      const seg = u.pathname.split("/").filter(Boolean).pop() ?? "document";
      return decodeURIComponent(seg);
    }
    const seg = fichier.split("/").filter(Boolean).pop() ?? "document";
    return decodeURIComponent(seg);
  } catch {
    return "document";
  }
}

function groupDocumentsByCategory(
  rows: {
    id: string;
    nom: string;
    fichier: string;
    type: string;
    createdAt: Date | string;
  }[]
): Record<CategoryId, StoredDocument[]> {
  const next: Record<CategoryId, StoredDocument[]> = Object.fromEntries(
    CATEGORIES.map(({ id }) => [id, [] as StoredDocument[]])
  ) as Record<CategoryId, StoredDocument[]>;

  for (const row of rows) {
    const cat = TYPE_TO_CATEGORY[row.type];
    if (!cat) continue;
    next[cat].push({
      id: row.id,
      displayName: row.nom,
      fileName: fileNameFromPath(row.fichier),
      fileUrl: row.fichier,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : row.createdAt.toISOString(),
    });
  }

  for (const { id } of CATEGORIES) {
    next[id].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return next;
}
type CategoryPresentation = {
  description: string;
  /** Decorative gradient overlay for the category hero */
  gradient: string;
  /** Tint behind the hero icon */
  iconTint: string;
  Icon: LucideIcon;
};

const CATEGORY_PRESENTATION: Record<CategoryId, CategoryPresentation> = {
  agrement: {
    description:
      "Agréments et autorisations officielles nécessaires à l’activité commerciale.",
    gradient:
      "from-sky-500/[0.12] via-blue-600/[0.06] to-violet-500/[0.04]",
    iconTint: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    Icon: BadgeCheck,
  },
  arf: {
    description:
      "Attestation de régularité fiscale et documents fiscaux associés.",
    gradient:
      "from-emerald-500/[0.12] via-teal-500/[0.06] to-cyan-500/[0.04]",
    iconTint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Icon: FileSignature,
  },
  rccm: {
    description:
      "Extrait RCCM et immatriculation au registre du commerce.",
    gradient:
      "from-amber-500/[0.14] via-orange-500/[0.06] to-rose-500/[0.04]",
    iconTint: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
    Icon: Landmark,
  },
  dfe: {
    description:
      "Déclaration fiscale d’existence et pièces liées aux impôts.",
    gradient:
      "from-violet-500/[0.12] via-purple-500/[0.06] to-fuchsia-500/[0.04]",
    iconTint: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    Icon: ScrollText,
  },
  cnps: {
    description:
      "Cotisations sociales et documents CNPS.",
    gradient:
      "from-rose-500/[0.12] via-red-500/[0.05] to-orange-500/[0.04]",
    iconTint: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    Icon: UsersRound,
  },
  rib: {
    description:
      "Relevés d’identité bancaires et informations de paiement.",
    gradient:
      "from-slate-500/[0.12] via-blue-950/[0.06] to-slate-500/[0.04]",
    iconTint:
      "bg-slate-600/15 text-slate-800 dark:text-slate-300",
    Icon: CreditCard,
  },
  catalogue: {
    description:
      "Catalogues produits et offres commerciales à partager avec les clients.",
    gradient:
      "from-indigo-500/[0.12] via-blue-500/[0.06] to-teal-500/[0.04]",
    iconTint: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
    Icon: Layers,
  },
  presentation: {
    description:
      "Présentations, plaquettes et supports de démonstration.",
    gradient:
      "from-fuchsia-500/[0.11] via-pink-500/[0.06] to-violet-500/[0.04]",
    iconTint: "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-400",
    Icon: Presentation,
  },
  "fiche-technique": {
    description:
      "Fiches techniques véhicules, équipements et spécifications détaillées.",
    gradient:
      "from-lime-500/[0.11] via-green-500/[0.06] to-emerald-500/[0.04]",
    iconTint: "bg-lime-600/15 text-lime-900 dark:text-lime-400",
    Icon: Wrench,
  },
  cni: {
    description:
      "Cartes nationales d'identité et pièces d'identification officielles.",
    gradient:
      "from-cyan-500/[0.12] via-sky-500/[0.06] to-blue-500/[0.04]",
    iconTint: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
    Icon: IdCard,
  },
  "conditions-generales-de-vente": {
    description:
      "Conditions générales de vente applicables aux dossiers et contrats clients.",
    gradient:
      "from-orange-500/[0.12] via-amber-500/[0.06] to-yellow-500/[0.04]",
    iconTint: "bg-orange-500/15 text-orange-800 dark:text-orange-400",
    Icon: Scale,
  },
};

type StoredDocument = {
  id: string;
  displayName: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
};

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "—";
}

function extensionBadgeClass(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "pdf")
    return "border-red-200/80 bg-red-500/10 text-red-700 dark:border-red-500/25 dark:text-red-400";
  if (["doc", "docx"].includes(e))
    return "border-blue-200/80 bg-blue-500/10 text-blue-700 dark:border-blue-500/25 dark:text-blue-400";
  if (["xls", "xlsx", "csv"].includes(e))
    return "border-emerald-200/80 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/25 dark:text-emerald-400";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(e))
    return "border-violet-200/80 bg-violet-500/10 text-violet-800 dark:border-violet-500/25 dark:text-violet-300";
  if (e === "ppt" || e === "pptx")
    return "border-amber-200/80 bg-amber-500/10 text-amber-900 dark:border-amber-500/25 dark:text-amber-400";
  return "border-border/70 bg-muted/50 text-muted-foreground";
}

function formatDocumentDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: frLocale });
  } catch {
    return "";
  }
}

export default function CommercialDocumentationPage() {
  const [documentsByCategory, setDocumentsByCategory] = useState<
    Record<CategoryId, StoredDocument[]>
  >(
    () =>
      Object.fromEntries(
        CATEGORIES.map(({ id }) => [id, [] as StoredDocument[]])
      ) as Record<CategoryId, StoredDocument[]>
  );

  const [loadingList, setLoadingList] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(
    CATEGORIES[0].id
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      const res = await getCommercialDocumentationRecords();
      if (cancelled) return;
      if (res.success) {
        setDocumentsByCategory(groupDocumentsByCategory(res.data));
      } else {
        toast.error(res.message ?? "Impossible de charger les documents.");
      }
      setLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategoryId, setUploadCategoryId] = useState<CategoryId | null>(
    null
  );
  const [docDisplayName, setDocDisplayName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadCategoryLabel = useMemo(() => {
    const c = CATEGORIES.find((x) => x.id === uploadCategoryId);
    return c?.label ?? "";
  }, [uploadCategoryId]);

  const uploadPresentation = uploadCategoryId
    ? CATEGORY_PRESENTATION[uploadCategoryId]
    : null;

  const totalDocuments = useMemo(
    () =>
      Object.values(documentsByCategory).reduce((sum, list) => sum + list.length, 0),
    [documentsByCategory]
  );

  const openUpload = (categoryId: CategoryId) => {
    setUploadCategoryId(categoryId);
    setDocDisplayName("");
    setFile(null);
    setUploadOpen(true);
  };

  const closeUpload = () => {
    setUploadOpen(false);
    setUploadCategoryId(null);
    setDocDisplayName("");
    setFile(null);
    setDragActive(false);
    setSaving(false);
  };

  const handleConfirmUpload = async () => {
    if (!uploadCategoryId || !file?.name) return;
    const trimmed = docDisplayName.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("category", uploadCategoryId);
      fd.append("nom", trimmed);
      fd.append("file", file);

      const result = await uploadCommercialDocumentation(fd);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      closeUpload();

      const refresh = await getCommercialDocumentationRecords();
      if (refresh.success) {
        setDocumentsByCategory(groupDocumentsByCategory(refresh.data));
      }
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    Boolean(uploadCategoryId && file && docDisplayName.trim().length > 0);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteCommercialDocumentation(deleteTarget.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setDeleteTarget(null);

      const refresh = await getCommercialDocumentationRecords();
      if (refresh.success) {
        setDocumentsByCategory(groupDocumentsByCategory(refresh.data));
      }
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const onDialogDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDialogDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDialogDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const filledCategories = CATEGORIES.filter(
    (category) => documentsByCategory[category.id].length > 0
  ).length;

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
              Commercial
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Documentation
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Choisissez un onglet pour voir les fichiers de cette catégorie.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 grid grid-cols-3 gap-2 sm:max-w-md">
          <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Documents
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {loadingList ? "—" : totalDocuments}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-amber-200">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
              Avec fichiers
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {loadingList ? "—" : filledCategories}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Onglets
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {CATEGORIES.length}
            </p>
          </div>
        </div>

        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as CategoryId)}
          className="w-full"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Onglets détaillés
          </p>
          <TabsList
            className={cn(
              "grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 text-left sm:grid-cols-3 xl:grid-cols-4",
              loadingList && "pointer-events-none opacity-70"
            )}
          >
            {CATEGORIES.map(({ id, label }) => {
              const { Icon } = CATEGORY_PRESENTATION[id];
              const count = documentsByCategory[id].length;
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn(
                    "group h-auto min-h-[4.5rem] w-full items-start justify-start gap-3 whitespace-normal rounded-2xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-200",
                    "data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:ring-slate-950",
                    "data-[state=inactive]:text-slate-800"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-data-[state=active]:bg-white/10 group-data-[state=active]:text-amber-300">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-snug">
                      {label}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-slate-400 group-data-[state=active]:text-amber-200">
                      {count} fichier{count !== 1 ? "s" : ""}
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATEGORIES.map(({ id, label }) => {
            const { Icon, description } = CATEGORY_PRESENTATION[id];
            const docs = documentsByCategory[id];
            const count = docs.length;

            return (
              <TabsContent
                key={id}
                value={id}
                className="mt-5 focus-visible:outline-none"
              >
                <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                          {label}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          {count} fichier{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => openUpload(id)}
                    className="h-11 w-full bg-slate-950 text-amber-200 hover:bg-slate-800 sm:w-auto"
                  >
                    <Upload className="h-4 w-4" />
                    Nouveau document
                  </Button>
                </div>

                {loadingList ? (
                  <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement des documents...
                  </div>
                ) : count === 0 ? (
                  <div className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm ring-1 ring-slate-200">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <p className="mt-4 font-medium text-slate-900">
                      Aucun fichier dans « {label} »
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                      Importez un PDF ou une image. Il apparaîtra ici avec le nom que vous choisissez.
                    </p>
                    <Button
                      type="button"
                      onClick={() => openUpload(id)}
                      className="mt-5 bg-slate-950 text-amber-200 hover:bg-slate-800"
                    >
                      <Upload className="h-4 w-4" />
                      Nouveau document
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {docs.map((doc) => {
                      const ext = extensionOf(doc.fileName);
                      return (
                        <article
                          key={doc.id}
                          className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[10px] font-bold uppercase",
                                extensionBadgeClass(ext)
                              )}
                            >
                              {ext.slice(0, 4)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-950">
                                {doc.displayName}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{doc.fileName}</span>
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Ajouté le {formatDocumentDate(doc.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 flex-1 border-slate-200 text-slate-800"
                              disabled={downloadingId === doc.id}
                              onClick={async () => {
                                setDownloadingId(doc.id);
                                try {
                                  await downloadCommercialDocumentationFile(
                                    doc.id,
                                    doc.fileName
                                  );
                                } catch {
                                  toast.error("Impossible de télécharger le fichier.");
                                  if (
                                    doc.fileUrl.startsWith("http://") ||
                                    doc.fileUrl.startsWith("https://")
                                  ) {
                                    window.open(
                                      doc.fileUrl,
                                      "_blank",
                                      "noopener,noreferrer"
                                    );
                                  }
                                } finally {
                                  setDownloadingId(null);
                                }
                              }}
                            >
                              {downloadingId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Télécharger
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open) closeUpload();
        }}
      >
        <DialogContent
          showCloseButton
          className="gap-0 overflow-hidden border-border/70 p-0 sm:max-w-lg"
        >
          {uploadPresentation && uploadCategoryLabel && (() => {
            const PreviewIcon = uploadPresentation.Icon;
            return (
            <div
              className={cn(
                "border-b border-border/60 px-6 py-8 sm:px-8",
                "bg-gradient-to-br from-muted/40 via-background to-muted/20",
                uploadPresentation.gradient
              )}
            >
              <DialogHeader className="space-y-4 text-left sm:text-left">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 dark:ring-white/10",
                      uploadPresentation.iconTint
                    )}
                  >
                    <PreviewIcon className="size-6" />
                  </div>
                  <div className="min-w-0 space-y-1.5 pt-1">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                      Nouveau document
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                      Déposez un fichier dans la zone ou parcourez vos dossiers,
                      puis indiquez le nom affiché dans la liste.
                    </DialogDescription>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit font-medium">
                  {uploadCategoryLabel}
                </Badge>
              </DialogHeader>
            </div>
            );
          })()}

          <div className="grid gap-5 px-6 pb-6 pt-6 sm:px-8">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-name`} className="text-muted-foreground">
                Nom du document
              </Label>
              <Input
                id={`${formId}-name`}
                placeholder="Ex. Agrément CNPS validé juin 2025"
                value={docDisplayName}
                onChange={(e) => setDocDisplayName(e.target.value)}
                autoComplete="off"
                className="h-11 rounded-xl border-border/80"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground">Fichier</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={onDialogDragOver}
                onDragOver={onDialogDragOver}
                onDragLeave={onDialogDragLeave}
                onDrop={onDialogDrop}
                className={cn(
                  "flex min-h-[152px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragActive
                    ? "border-primary/50 bg-primary/5"
                    : "border-muted-foreground/20 bg-muted/20 hover:border-muted-foreground/35 hover:bg-muted/35"
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl bg-background shadow-inner ring-1 ring-border/60 transition-transform",
                    dragActive && "scale-105 ring-primary/25"
                  )}
                >
                  {file ? (
                    <FileText className="size-6 text-primary" />
                  ) : (
                    <CloudUpload className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-foreground">
                    {file
                      ? "Fichier sélectionné"
                      : "Glissez-déposez votre fichier"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {file ? (
                      <span className="block max-w-full truncate">{file.name}</span>
                    ) : (
                      "PDF, Word, Excel, images — ou cliquez pour parcourir"
                    )}
                  </p>
                </div>
                {!file && (
                  <span className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                    Parcourir les fichiers
                  </span>
                )}
              </button>
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-border/60 bg-muted/30 px-6 py-4 sm:border-t sm:bg-transparent">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl sm:flex-none"
              type="button"
              onClick={closeUpload}
            >
              Annuler
            </Button>
            <Button
              disabled={!canSubmit || saving}
              className="h-11 flex-1 items-center gap-2 rounded-xl shadow-md sm:flex-none"
              type="button"
              onClick={() => void handleConfirmUpload()}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent
          showCloseButton={!deleting}
          className="gap-0 overflow-hidden border-border/70 p-0 sm:max-w-md"
        >
          <div className="border-b border-border/60 bg-gradient-to-br from-destructive/10 via-background to-background px-6 py-7 sm:px-8">
            <DialogHeader className="space-y-4 text-left sm:text-left">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                  <AlertTriangle className="size-6" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1.5 pt-1">
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Supprimer le document ?
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                    Cette action est définitive. Le fichier sera retiré du
                    centre documentaire et ne pourra pas être restauré.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {deleteTarget && (
            <div className="px-6 py-5 sm:px-8">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                    extensionBadgeClass(extensionOf(deleteTarget.fileName))
                  )}
                >
                  <span className="font-mono text-[10px] font-bold uppercase leading-none tracking-tighter">
                    {extensionOf(deleteTarget.fileName)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold">
                    {deleteTarget.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {deleteTarget.fileName}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 border-t border-border/60 bg-muted/30 px-6 py-4 sm:border-t sm:bg-transparent">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl sm:flex-none"
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              className="h-11 flex-1 items-center gap-2 rounded-xl shadow-md sm:flex-none"
              type="button"
              onClick={() => void handleConfirmDelete()}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
