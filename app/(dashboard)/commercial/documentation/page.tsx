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
  FolderOpen,
  Sparkles,
  Trash2,
  AlertTriangle,
  IdCard,
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
import { Separator } from "@/components/ui/separator";
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
  const tabsAnchorRef = useRef<HTMLDivElement>(null);

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

  const goToCategory = (id: CategoryId) => {
    setActiveCategory(id);
    requestAnimationFrame(() => {
      tabsAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

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

  return (
    <div className="relative min-h-full w-full overflow-x-hidden pb-16">
      {/* Ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(480px,60vh)]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,hsl(var(--primary)/0.11),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_45%_at_100%_0%,hsl(280_90%_60%/0.07),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,hsl(var(--background))_100%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        {/* Page header */}
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-500" aria-hidden />
              <Library className="size-3.5 text-primary" aria-hidden />
              <span>Centre documentaire commercial</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-balance bg-gradient-to-br from-foreground via-foreground to-foreground/65 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
                Documentation
              </h1>
              <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Centralisez les pièces administratives et commerciales par
                type. Déposez, nommez et retrouvez chaque fichier en un clic —
                prêt à partager avec vos équipes et partenaires.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <div className="flex min-w-[148px] flex-col rounded-2xl border border-border/70 bg-gradient-to-br from-card/95 to-muted/25 px-5 py-4 shadow-sm backdrop-blur-sm">
              <span className="flex min-h-[2.25rem] items-center gap-2 text-2xl font-semibold tabular-nums tracking-tight">
                {loadingList ? (
                  <Loader2
                    className="size-7 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : (
                  totalDocuments
                )}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <FolderOpen className="size-3.5 opacity-70" aria-hidden />
                Documents
              </span>
            </div>
            <div className="flex min-w-[148px] flex-col rounded-2xl border border-border/70 bg-gradient-to-br from-card/95 to-muted/25 px-5 py-4 shadow-sm backdrop-blur-sm">
              <span className="text-2xl font-semibold tabular-nums tracking-tight">
                {CATEGORIES.length}
              </span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Types de pièces
              </span>
            </div>
          </div>
        </header>

        {/* Category overview — quick navigation */}
        <section
          className="space-y-3"
          aria-label="Aperçu des catégories"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Parcourir par type
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Sélectionnez une catégorie pour afficher les fichiers et importer.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {loadingList
              ? CATEGORIES.map(({ id }) => (
                  <div
                    key={id}
                    className="h-[88px] animate-pulse rounded-2xl border border-border/40 bg-muted/40"
                  />
                ))
              : CATEGORIES.map(({ id, label }) => {
                  const preset = CATEGORY_PRESENTATION[id];
                  const { Icon, gradient, iconTint } = preset;
                  const count = documentsByCategory[id].length;
                  const isActive = activeCategory === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => goToCategory(id)}
                      className={cn(
                        "group relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isActive
                          ? "border-primary/35 bg-primary/[0.06] shadow-md shadow-primary/5 ring-1 ring-primary/15"
                          : "border-border/65 bg-card/70 backdrop-blur-sm hover:border-border hover:bg-muted/40 hover:shadow-sm"
                      )}
                    >
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                          "bg-gradient-to-br",
                          gradient
                        )}
                        aria-hidden
                      />
                      <div className="relative flex items-start gap-3">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/[0.04] dark:ring-white/10",
                            iconTint
                          )}
                        >
                          <Icon className="size-[18px]" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="truncate text-xs font-semibold leading-tight sm:text-[13px]">
                            {label}
                          </p>
                          <p className="mt-1 text-[11px] font-medium tabular-nums text-muted-foreground">
                            {count} fichier{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
          </div>
        </section>

        <div ref={tabsAnchorRef} className="scroll-mt-24" />

        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as CategoryId)}
          className="w-full space-y-6"
        >
          {/* Sticky segmented control */}
          <div className="sticky top-0 z-20 -mx-4 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 sm:-mx-6 sm:px-6">
            <p className="mb-2.5 hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
              Onglets détaillés
            </p>
            <TabsList
              className={cn(
                "relative flex h-auto w-full gap-1 rounded-2xl border border-border/80 bg-muted/50 p-1.5 shadow-sm",
                "flex-wrap md:flex-nowrap md:justify-start md:gap-1",
                "[&::-webkit-scrollbar]:hidden md:overflow-x-auto",
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
                      "group relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                      "data-[state=active]:border data-[state=active]:border-border/90 data-[state=active]:bg-background data-[state=active]:shadow-md",
                      "data-[state=inactive]:shadow-none md:justify-center md:gap-2"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg bg-muted/80 transition-colors",
                        "group-data-[state=active]:bg-primary/10"
                      )}
                    >
                      <Icon className="size-4 shrink-0 opacity-90 group-data-[state=active]:opacity-100" />
                    </span>
                    <span className="whitespace-nowrap sm:inline">{label}</span>
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-1 shrink-0 px-1.5 py-0 text-[10px] font-semibold tabular-nums",
                          "group-data-[state=active]:border-primary/20 group-data-[state=active]:bg-primary/10"
                        )}
                      >
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {CATEGORIES.map(({ id, label }) => {
            const preset = CATEGORY_PRESENTATION[id];
            const { Icon, description, gradient, iconTint } = preset;
            const docs = documentsByCategory[id];
            const count = docs.length;

            return (
              <TabsContent
                key={id}
                value={id}
                className="mt-0 animate-in fade-in-50 duration-200 focus-visible:outline-none"
              >
                <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(15,23,42,0.14)] dark:border-border/80 dark:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.45)]">
                  {/* Hero band */}
                  <div
                    className={cn(
                      "relative border-b border-border/50 bg-gradient-to-br px-5 py-6 sm:px-8 sm:py-10",
                      gradient,
                      "from-background via-transparent to-muted/25"
                    )}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
                      aria-hidden
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='1.5' cy='1.5' r='0.75' fill='%23000000' fill-opacity='0.05'/%3E%3C/svg%3E\")",
                        backgroundSize: "20px 20px",
                      }}
                    />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-5">
                        <div
                          className={cn(
                            "flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ring-black/5 dark:ring-white/10 sm:size-[4.25rem]",
                            iconTint
                          )}
                        >
                          <Icon className="size-7 sm:size-8" aria-hidden />
                        </div>
                        <div className="min-w-0 space-y-2 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                              {label}
                            </h2>
                            <Badge
                              variant="outline"
                              className="border-border/80 font-medium"
                            >
                              {count} fichier{count !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            {description}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className={cn(
                          "h-11 shrink-0 gap-2 rounded-xl px-5 shadow-lg shadow-black/8",
                          "bg-foreground text-background hover:bg-foreground/90 dark:shadow-black/50"
                        )}
                        type="button"
                        onClick={() => openUpload(id)}
                      >
                        <Upload className="size-[18px]" />
                        Nouveau document
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card px-5 py-6 sm:px-8 sm:py-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold tracking-tight">
                          Pièces enregistrées
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Nom affiché, fichier source, date d&apos;ajout et
                          téléchargement.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit gap-2 rounded-xl border-dashed"
                        type="button"
                        onClick={() => openUpload(id)}
                      >
                        <Upload className="size-4" />
                        Importer
                      </Button>
                    </div>

                    <Separator className="my-6 bg-border/50" />

                    {count === 0 ? (
                      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-muted/20 via-muted/10 to-transparent px-6 py-16 text-center">
                        <div
                          className="pointer-events-none absolute inset-0 opacity-[0.35]"
                          aria-hidden
                          style={{
                            background:
                              "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--primary) / 0.08), transparent 65%)",
                          }}
                        />
                        <div className="relative mb-5 flex size-[4.5rem] items-center justify-center rounded-full bg-background/90 shadow-md ring-4 ring-muted/30">
                          <Inbox
                            className="size-8 text-muted-foreground"
                            aria-hidden
                          />
                        </div>
                        <p className="relative max-w-sm text-base font-semibold text-foreground">
                          Aucune pièce pour « {label} »
                        </p>
                        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                          Déposez un PDF, une image ou tout autre document.
                          Celui-ci apparaîtra ici avec le nom que vous choisissez.
                        </p>
                        <Button
                          variant="secondary"
                          className="relative mt-7 gap-2 rounded-xl px-6 "
                          type="button"
                          onClick={() => openUpload(id)}
                        >
                          <Upload className="size-4" />
                          Ajouter le premier fichier
                        </Button>
                      </div>
                    ) : (
                      <ul className="grid gap-3">
                        {docs.map((doc) => {
                          const ext = extensionOf(doc.fileName);
                          return (
                            <li key={doc.id}>
                              <div
                                className={cn(
                                  "group relative flex flex-col gap-4 rounded-2xl border border-border/55 bg-muted/10 p-4",
                                  "transition-all duration-200 hover:border-primary/20 hover:bg-muted/[0.18] hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5"
                                )}
                              >
                                <div className="flex min-w-0 flex-1 gap-4">
                                  <div
                                    className={cn(
                                      "flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                                      extensionBadgeClass(ext)
                                    )}
                                  >
                                    <span className="font-mono text-[10px] font-bold uppercase leading-none tracking-tighter">
                                      {ext}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <p className="truncate font-semibold leading-tight tracking-tight text-foreground">
                                      {doc.displayName}
                                    </p>
                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-x-3 sm:gap-y-0">
                                      <span className="flex min-w-0 items-center gap-1.5">
                                        <FileText
                                          className="size-3 shrink-0 opacity-70"
                                          aria-hidden
                                        />
                                        <span className="truncate">
                                          {doc.fileName}
                                        </span>
                                      </span>
                                      <span className="hidden h-1 w-1 rounded-full bg-border sm:inline" />
                                      <time
                                        className="shrink-0 tabular-nums text-[11px] sm:text-xs"
                                        dateTime={doc.createdAt}
                                      >
                                        Ajouté le{" "}
                                        {formatDocumentDate(doc.createdAt)}
                                      </time>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "h-9 shrink-0 gap-2 rounded-xl border-border/70",
                                      "hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
                                    )}
                                    disabled={downloadingId === doc.id}
                                    onClick={async () => {
                                      setDownloadingId(doc.id);
                                      try {
                                        await downloadCommercialDocumentationFile(
                                          doc.id,
                                          doc.fileName
                                        );
                                      } catch {
                                        toast.error(
                                          "Impossible de télécharger le fichier."
                                        );
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
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Download className="size-4" />
                                    )}
                                    Télécharger
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "h-9 shrink-0 gap-2 rounded-xl border-border/70 text-destructive",
                                      "hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                                    )}
                                    disabled={
                                      deleting && deleteTarget?.id === doc.id
                                    }
                                    onClick={() => setDeleteTarget(doc)}
                                  >
                                    <Trash2 className="size-4" />
                                    Supprimer
                                  </Button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <Separator className="my-8 bg-border/50" />

                    <div className="flex justify-center pb-1">
                      <Button
                        type="button"
                        size="lg"
                        variant="secondary"
                        className="gap-2 rounded-xl px-8 shadow-sm "
                        onClick={() => openUpload(id)}
                      >
                        <Upload className="size-[18px]" />
                        Ajouter un document
                      </Button>
                    </div>
                  </div>
                </article>
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
                      Ajouter un document
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
                <>
                  <Trash2 className="size-4" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
