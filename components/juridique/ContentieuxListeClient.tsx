"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  FolderPlus,
  Gavel,
  LayoutGrid,
  List,
  Loader2,
  Scale,
  Search,
  Sparkles,
  Trash2Icon,
  Users,
  X,
} from "lucide-react";
import { deleteDossierContentieux } from "@/lib/actions/contentieux";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatEnumLabel,
  statutBadgeClass,
  typeAccentClass,
  typeBadgeClass,
  TYPE_DOSSIER_OPTIONS,
  STATUT_DOSSIER_OPTIONS,
} from "@/lib/contentieux-display";
import PartiesPrenantesDialog from "@/components/juridique/PartiesPrenantesDialog";
import DocumentsContentieuxDialog from "@/components/juridique/DocumentsContentieuxDialog";
import GestionAudiencesDialog from "@/components/juridique/GestionAudiencesDialog";
import GestionDecisionsDialog from "@/components/juridique/GestionDecisionsDialog";
import GestionDossierDialog from "@/components/juridique/GestionDossierDialog";

export type GestionDecisionListeItem = {
  id: string;
  dateDecision: Date;
  heureDecision: string;
  lieuDecision: string;
  statutDecision: string;
};

export type DossierContentieuxListeItem = {
  id: string;
  numeroDossier: string;
  typeDossier: string;
  statutDossier: string;
  objet: string;
  description: string;
  dateOuverture: Date;
  dateCloture: Date | null;
  createdAt: Date;
  gestionDesDecisionsDeJustice: GestionDecisionListeItem[];
  _count: {
    partiesPrenantes: number;
    documentsContentieux: number;
    gestionAudiences: number;
    gestionDesDecisionsDeJustice: number;
  };
};

type ViewMode = "grid" | "table";
type SortKey = "recent" | "numero" | "statut";
type QuickFilter = "all" | "en_cours" | "clos";

type Props = {
  dossiers: DossierContentieuxListeItem[];
};

const EN_COURS_STATUTS = ["EN_COURS", "EN_TRAITEMENT", "AUDIENCE", "EN_ATTENTE"];
const CLOS_STATUTS = ["TERMINEE", "ANNULE"];

function getDossierHref(dossierId: string) {
  return `/juridique/contentieux/nouveau-dossier?tab=parties&dossierId=${dossierId}`;
}

function MetricCell({
  icon: Icon,
  value,
  label,
  onClick,
  title,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  onClick?: () => void;
  title?: string;
}) {
  const clickable = !!onClick;

  if (clickable) {
    return (
      <button
        type="button"
        title={title ?? "Voir et gérer"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "flex w-full flex-col items-center rounded-xl bg-slate-50/90 px-2 py-2.5 ring-1 ring-slate-100",
          "cursor-pointer transition hover:bg-violet-50 hover:ring-violet-200"
        )}
      >
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <p className="mt-1 text-sm font-bold tabular-nums text-violet-700">{value}</p>
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-xl bg-slate-50/90 px-2 py-2.5 ring-1 ring-slate-100">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">{value}</p>
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
    </div>
  );
}

function DossierCard({
  dossier,
  onPartiesClick,
  onDocumentsClick,
  onAudiencesClick,
  onDecisionsClick,
  onDossierClick,
  onDeleteClick,
}: {
  dossier: DossierContentieuxListeItem;
  onPartiesClick?: (dossier: { id: string; numeroDossier: string }) => void;
  onDocumentsClick?: (dossier: { id: string; numeroDossier: string }) => void;
  onAudiencesClick?: (dossier: { id: string; numeroDossier: string }) => void;
  onDecisionsClick?: (dossier: { id: string; numeroDossier: string }) => void;
  onDossierClick?: (dossier: { id: string; numeroDossier: string }) => void;
  onDeleteClick?: (dossier: { id: string; numeroDossier: string }) => void;
}) {
  const accent = typeAccentClass(dossier.typeDossier);
  const isClosed = CLOS_STATUTS.includes(dossier.statutDossier);

  return (
    <Link href={getDossierHref(dossier.id)} className="group block">
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300",
          "hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/60"
        )}
      >
        <div className={cn("h-1 bg-gradient-to-r", accent)} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold tracking-tight text-slate-900 group-hover:text-violet-700">
                  {dossier.numeroDossier}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 border-0 text-[10px] font-semibold uppercase tracking-wide",
                    typeBadgeClass(dossier.typeDossier)
                  )}
                >
                  {formatEnumLabel(dossier.typeDossier)}
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-1 text-sm font-medium text-slate-700">
                {dossier.objet}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-105",
                accent
              )}
            >
              <Gavel className="h-4 w-4" />
            </div>
          </div>

          {dossier.description ? (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {dossier.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge className={cn("border-0 text-[10px]", statutBadgeClass(dossier.statutDossier))}>
              {formatEnumLabel(dossier.statutDossier)}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="h-3 w-3" />
              {isClosed && dossier.dateCloture
                ? `Clôturé le ${format(new Date(dossier.dateCloture), "dd MMM yyyy", { locale: fr })}`
                : `Ouvert le ${format(new Date(dossier.dateOuverture), "dd MMM yyyy", { locale: fr })}`}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <MetricCell
              icon={Users}
              value={dossier._count.partiesPrenantes}
              label="Parties"
              title="Voir et gérer les parties prenantes"
              onClick={() =>
                onPartiesClick?.({
                  id: dossier.id,
                  numeroDossier: dossier.numeroDossier,
                })
              }
            />
            <MetricCell
              icon={FileText}
              value={dossier._count.documentsContentieux}
              label="Docs"
              title="Voir et gérer les documents"
              onClick={() =>
                onDocumentsClick?.({
                  id: dossier.id,
                  numeroDossier: dossier.numeroDossier,
                })
              }
            />
            <MetricCell
              icon={Calendar}
              value={dossier._count.gestionAudiences}
              label="Audiences"
              title="Voir et gérer les audiences"
              onClick={() =>
                onAudiencesClick?.({
                  id: dossier.id,
                  numeroDossier: dossier.numeroDossier,
                })
              }
            />
            <MetricCell
              icon={Scale}
              value={dossier._count.gestionDesDecisionsDeJustice}
              label="Décisions"
              title="Voir et gérer les décisions"
              onClick={() =>
                onDecisionsClick?.({
                  id: dossier.id,
                  numeroDossier: dossier.numeroDossier,
                })
              }
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              title="Modifier les informations du dossier"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDossierClick?.({
                  id: dossier.id,
                  numeroDossier: dossier.numeroDossier,
                });
              }}
              className="cursor-pointer text-xs font-medium text-slate-500 transition hover:text-violet-700"
            >
              Gérer le dossier
            </button>
            <button
              type="button"
              title="Supprimer le dossier"
              aria-label={`Supprimer le dossier ${dossier.numeroDossier}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteClick?.({
                  id: dossier.id,
                  numeroDossier: dossier.numeroDossier,
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function ContentieuxListeClient({ dossiers }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [partiesDialogDossier, setPartiesDialogDossier] = useState<{
    id: string;
    numeroDossier: string;
  } | null>(null);
  const [documentsDialogDossier, setDocumentsDialogDossier] = useState<{
    id: string;
    numeroDossier: string;
  } | null>(null);
  const [audiencesDialogDossier, setAudiencesDialogDossier] = useState<{
    id: string;
    numeroDossier: string;
  } | null>(null);
  const [decisionsDialogDossier, setDecisionsDialogDossier] = useState<{
    id: string;
    numeroDossier: string;
  } | null>(null);
  const [gestionDossierDialog, setGestionDossierDialog] = useState<{
    id: string;
    numeroDossier: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    numeroDossier: string;
  } | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      const result = await deleteDossierContentieux(deleteTarget.id);
      if (result.success) {
        toast.success("Dossier supprimé avec succès");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression du dossier");
      }
    } catch {
      toast.error("Erreur lors de la suppression du dossier");
    } finally {
      setDeletePending(false);
    }
  };

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) => EN_COURS_STATUTS.includes(d.statutDossier)).length;
    const termines = dossiers.filter((d) => CLOS_STATUTS.includes(d.statutDossier)).length;
    const types = new Set(dossiers.map((d) => d.typeDossier)).size;
    const parties = dossiers.reduce((sum, d) => sum + d._count.partiesPrenantes, 0);
    return { total: dossiers.length, enCours, termines, types, parties };
  }, [dossiers]);

  const kpiCards = [
    {
      label: "Total dossiers",
      value: stats.total,
      sub: "Enregistrés dans le système",
      icon: FolderOpen,
      accent: "from-indigo-500 to-violet-600",
      iconBg: "bg-indigo-50 text-indigo-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "En cours",
      value: stats.enCours,
      sub: "Dossiers actifs",
      icon: Gavel,
      accent: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-50 text-sky-600",
      filter: "en_cours" as QuickFilter,
    },
    {
      label: "Clôturés",
      value: stats.termines,
      sub: "Terminés ou annulés",
      icon: Scale,
      accent: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 text-emerald-600",
      filter: "clos" as QuickFilter,
    },
    {
      label: "Parties",
      value: stats.parties,
      sub: `${stats.types} type${stats.types !== 1 ? "s" : ""} de litige`,
      icon: Users,
      accent: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50 text-violet-600",
      filter: null,
    },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = dossiers.filter((d) => {
      if (typeFilter !== "all" && d.typeDossier !== typeFilter) return false;
      if (statutFilter !== "all" && d.statutDossier !== statutFilter) return false;
      if (quickFilter === "en_cours" && !EN_COURS_STATUTS.includes(d.statutDossier)) return false;
      if (quickFilter === "clos" && !CLOS_STATUTS.includes(d.statutDossier)) return false;
      if (!q) return true;
      return (
        d.numeroDossier.toLowerCase().includes(q) ||
        d.objet.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    });

    result = [...result].sort((a, b) => {
      if (sortKey === "numero") {
        return a.numeroDossier.localeCompare(b.numeroDossier);
      }
      if (sortKey === "statut") {
        return a.statutDossier.localeCompare(b.statutDossier);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [dossiers, search, typeFilter, statutFilter, quickFilter, sortKey]);

  const hasFilters =
    search || typeFilter !== "all" || statutFilter !== "all" || quickFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatutFilter("all");
    setQuickFilter("all");
  };

  const resultLabel =
    filtered.length === 1 ? "1 dossier affiché" : `${filtered.length} dossiers affichés`;

  return (
    <div className="min-h-full bg-slate-50/80">
      <PartiesPrenantesDialog
        open={!!partiesDialogDossier}
        onOpenChange={(open) => {
          if (!open) setPartiesDialogDossier(null);
        }}
        dossierId={partiesDialogDossier?.id ?? ""}
        numeroDossier={partiesDialogDossier?.numeroDossier ?? ""}
        onPartieAdded={() => router.refresh()}
      />
      <DocumentsContentieuxDialog
        open={!!documentsDialogDossier}
        onOpenChange={(open) => {
          if (!open) setDocumentsDialogDossier(null);
        }}
        dossierId={documentsDialogDossier?.id ?? ""}
        numeroDossier={documentsDialogDossier?.numeroDossier ?? ""}
        onDocumentAdded={() => router.refresh()}
      />
      <GestionAudiencesDialog
        open={!!audiencesDialogDossier}
        onOpenChange={(open) => {
          if (!open) setAudiencesDialogDossier(null);
        }}
        dossierId={audiencesDialogDossier?.id ?? ""}
        numeroDossier={audiencesDialogDossier?.numeroDossier ?? ""}
        onAudienceAdded={() => router.refresh()}
      />
      <GestionDecisionsDialog
        open={!!decisionsDialogDossier}
        onOpenChange={(open) => {
          if (!open) setDecisionsDialogDossier(null);
        }}
        dossierId={decisionsDialogDossier?.id ?? ""}
        numeroDossier={decisionsDialogDossier?.numeroDossier ?? ""}
        onDecisionAdded={() => router.refresh()}
      />
      <GestionDossierDialog
        open={!!gestionDossierDialog}
        onOpenChange={(open) => {
          if (!open) setGestionDossierDialog(null);
        }}
        dossierId={gestionDossierDialog?.id ?? ""}
        numeroDossier={gestionDossierDialog?.numeroDossier ?? ""}
        onDossierUpdated={() => router.refresh()}
      />
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce dossier ?</DialogTitle>
            <DialogDescription className="text-pretty text-slate-600">
              Cette action est définitive
              {deleteTarget ? (
                <>
                  : le dossier{" "}
                  <span className="font-medium text-slate-800">
                    {deleteTarget.numeroDossier}
                  </span>{" "}
                  et toutes ses données associées (parties, documents, audiences, décisions)
                  seront supprimés.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setDeleteTarget(null)}
              disabled={deletePending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-w-[7.5rem] gap-2 rounded-lg"
              onClick={confirmDelete}
              disabled={deletePending}
            >
              {deletePending ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.1),transparent_30%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                Service Juridique · Contentieux
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Gavel className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Dossiers actifs
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Consultez, filtrez et suivez vos litiges — parties, documents, audiences et
                    décisions regroupés par dossier.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm">
                  <FolderOpen className="h-3.5 w-3.5 text-violet-300" />
                  {stats.total} dossier{stats.total !== 1 ? "s" : ""} au total
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                  </span>
                  {stats.enCours} en cours de traitement
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-violet-950 shadow-xl shadow-black/20 hover:bg-violet-50 sm:w-auto"
              >
                <Link href="/juridique/contentieux/nouveau-dossier">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Nouveau dossier
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/juridique">
                  Retour au tableau de bord
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards overlapping hero */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            const isActive = kpi.filter !== null && quickFilter === kpi.filter;
            const isClickable = kpi.filter !== null;

            return (
              <Card
                key={kpi.label}
                className={cn(
                  "group overflow-hidden border-0 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300",
                  isClickable && "cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70",
                  isActive && "ring-2 ring-violet-500 ring-offset-2"
                )}
                onClick={
                  isClickable
                    ? () => setQuickFilter(isActive ? "all" : kpi.filter!)
                    : undefined
                }
              >
                <div className={cn("h-1 bg-gradient-to-r", kpi.accent)} />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {kpi.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-3xl">
                        {kpi.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11",
                        kpi.iconBg
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="relative mt-8 space-y-5 pb-10 sm:mt-10 sm:space-y-6 sm:pb-12">
          <div
            className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl"
            aria-hidden
          />

          {/* Section header */}
          <div className="relative flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">
                Vos dossiers
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recherchez, filtrez et ouvrez un dossier pour gérer ses éléments.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">{resultLabel}</p>
          </div>

          {/* Toolbar */}
          <div
            className="sticky top-0 z-10 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-md sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par numéro, objet ou description…"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 shadow-sm focus-visible:ring-violet-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 w-full min-w-[140px] rounded-xl border-slate-200 sm:w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {TYPE_DOSSIER_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {formatEnumLabel(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger className="h-11 w-full min-w-[140px] rounded-xl border-slate-200 sm:w-[160px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {STATUT_DOSSIER_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {formatEnumLabel(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="h-11 w-full min-w-[130px] rounded-xl border-slate-200 sm:w-[150px]">
                    <SelectValue placeholder="Tri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Plus récents</SelectItem>
                    <SelectItem value="numero">N° dossier</SelectItem>
                    <SelectItem value="statut">Statut</SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFilters}
                    className="h-11 w-11 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100"
                    title="Réinitialiser les filtres"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}

                <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "h-9 w-9 rounded-lg",
                      viewMode === "grid" && "bg-violet-600 text-white hover:bg-violet-700"
                    )}
                    title="Vue grille"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "h-9 w-9 rounded-lg",
                      viewMode === "table" && "bg-violet-600 text-white hover:bg-violet-700"
                    )}
                    title="Vue tableau"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {hasFilters ? (
              <p className="mt-3 text-xs font-medium text-violet-600">Filtres actifs</p>
            ) : null}
          </div>

          {/* Content */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white/90 px-6 py-16 text-center shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 shadow-inner">
                <FolderOpen className="h-10 w-10 text-violet-500" />
              </div>
              <h2 className="mt-6 text-lg font-semibold text-slate-900">
                {dossiers.length === 0 ? "Aucun dossier enregistré" : "Aucun résultat"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {dossiers.length === 0
                  ? "Commencez par ouvrir votre premier dossier contentieux pour centraliser le suivi de vos litiges."
                  : "Aucun dossier ne correspond à vos critères. Modifiez les filtres ou réinitialisez-les."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-11 rounded-xl"
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : null}
                <Button
                  asChild
                  className="h-11 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-white shadow-md hover:opacity-95"
                >
                  <Link href="/juridique/contentieux/nouveau-dossier">
                    <FolderPlus className="h-4 w-4" />
                    Créer un dossier
                  </Link>
                </Button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((dossier) => (
                <DossierCard
                  key={dossier.id}
                  dossier={dossier}
                  onPartiesClick={setPartiesDialogDossier}
                  onDocumentsClick={setDocumentsDialogDossier}
                  onAudiencesClick={setAudiencesDialogDossier}
                  onDecisionsClick={setDecisionsDialogDossier}
                  onDossierClick={setGestionDossierDialog}
                  onDeleteClick={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700">N° dossier</TableHead>
                      <TableHead className="font-semibold text-slate-700">Objet</TableHead>
                      <TableHead className="font-semibold text-slate-700">Type</TableHead>
                      <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                      <TableHead className="font-semibold text-slate-700">Ouverture</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Parties</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Docs</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Audiences</TableHead>
                      <TableHead className="font-semibold text-slate-700">Décision</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((dossier) => (
                      <TableRow
                        key={dossier.id}
                        className="group cursor-pointer transition-colors hover:bg-violet-50/40"
                        onClick={() => router.push(getDossierHref(dossier.id))}
                      >
                        <TableCell className="font-semibold text-slate-900">
                          {dossier.numeroDossier}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-slate-600">
                          {dossier.objet}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("border-0 text-[10px]", typeBadgeClass(dossier.typeDossier))}
                          >
                            {formatEnumLabel(dossier.typeDossier)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn("border-0 text-[10px]", statutBadgeClass(dossier.statutDossier))}
                          >
                            {formatEnumLabel(dossier.statutDossier)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {format(new Date(dossier.dateOuverture), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell
                          className="text-center text-sm font-medium text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPartiesDialogDossier({
                              id: dossier.id,
                              numeroDossier: dossier.numeroDossier,
                            });
                          }}
                        >
                          <button
                            type="button"
                            className="inline-flex min-w-[2rem] items-center justify-center rounded-lg px-2 py-1 text-violet-700 transition hover:bg-violet-100 hover:text-violet-900"
                            title="Voir et gérer les parties prenantes"
                          >
                            {dossier._count.partiesPrenantes}
                          </button>
                        </TableCell>
                        <TableCell
                          className="text-center text-sm font-medium text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentsDialogDossier({
                              id: dossier.id,
                              numeroDossier: dossier.numeroDossier,
                            });
                          }}
                        >
                          <button
                            type="button"
                            className="inline-flex min-w-[2rem] items-center justify-center rounded-lg px-2 py-1 text-sky-700 transition hover:bg-sky-100 hover:text-sky-900"
                            title="Voir et gérer les documents"
                          >
                            {dossier._count.documentsContentieux}
                          </button>
                        </TableCell>
                        <TableCell
                          className="text-center text-sm font-medium text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAudiencesDialogDossier({
                              id: dossier.id,
                              numeroDossier: dossier.numeroDossier,
                            });
                          }}
                        >
                          <button
                            type="button"
                            className="inline-flex min-w-[2rem] items-center justify-center rounded-lg px-2 py-1 text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
                            title="Voir et gérer les audiences"
                          >
                            {dossier._count.gestionAudiences}
                          </button>
                        </TableCell>
                        <TableCell
                          className="max-w-[240px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDecisionsDialogDossier({
                              id: dossier.id,
                              numeroDossier: dossier.numeroDossier,
                            });
                          }}
                        >
                          <button
                            type="button"
                            className="w-full text-left transition hover:opacity-80"
                            title="Voir et gérer les décisions"
                          >
                            {dossier.gestionDesDecisionsDeJustice.length === 0 ? (
                              <span className="text-xs text-violet-600">0</span>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                {dossier.gestionDesDecisionsDeJustice.map((decision) => (
                                  <div
                                    key={decision.id}
                                    className="flex flex-wrap items-center gap-1.5"
                                    title={`${formatEnumLabel(decision.statutDecision)} — ${decision.lieuDecision} (${decision.heureDecision})`}
                                  >
                                    <Badge
                                      className={cn(
                                        "shrink-0 border-0 text-[10px]",
                                        statutBadgeClass(decision.statutDecision)
                                      )}
                                    >
                                      {formatEnumLabel(decision.statutDecision)}
                                    </Badge>
                                    <span className="text-[10px] text-slate-500">
                                      {format(new Date(decision.dateDecision), "dd/MM/yyyy", {
                                        locale: fr,
                                      })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-violet-600 hover:bg-violet-50"
                          >
                            <Link href={getDossierHref(dossier.id)}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
