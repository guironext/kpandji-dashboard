"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Eye,
  FolderOpen,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createDossierVeilleJuridique,
  deleteDossierVeilleJuridique,
  updateDossierVeilleJuridique,
  type DossierVeilleJuridiqueListItem,
} from "@/lib/actions/veille-juridique";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  dateOuverture: z.string().min(1, "La date d'ouverture est requise"),
  dateCloture: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type QuickFilter = "all" | "en_cours" | "clos";
type ViewMode = "grid" | "list";

type Props = {
  dossiers: DossierVeilleJuridiqueListItem[];
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function emptyFormValues(): FormValues {
  return {
    titre: "",
    description: "",
    dateOuverture: new Date().toISOString().slice(0, 10),
    dateCloture: "",
  };
}

function isDossierClos(dossier: DossierVeilleJuridiqueListItem) {
  return dossier.dateCloture !== null;
}

function formatDate(date: Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

function StatBadge({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  tone: "amber" | "indigo";
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 ring-1",
        tones[tone]
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <div className="min-w-0">
        <p className="text-sm font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

function DossierCard({
  dossier,
  onEdit,
  onDelete,
}: {
  dossier: DossierVeilleJuridiqueListItem;
  onEdit: (dossier: DossierVeilleJuridiqueListItem) => void;
  onDelete: (dossier: DossierVeilleJuridiqueListItem) => void;
}) {
  const clos = isDossierClos(dossier);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/60">
      <div
        className={cn(
          "h-1 bg-gradient-to-r",
          clos ? "from-emerald-500 to-teal-500" : "from-violet-500 to-indigo-600"
        )}
      />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
                clos ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
              )}
            >
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">{dossier.titre}</h3>
              <Badge
                variant="secondary"
                className={cn(
                  "mt-1.5 border-0 text-[10px] font-semibold",
                  clos
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-sky-100 text-sky-700"
                )}
              >
                {clos ? "Clôturé" : "En cours"}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Modifier le dossier"
              aria-label={`Modifier ${dossier.titre}`}
              onClick={() => onEdit(dossier)}
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-violet-50 hover:text-violet-700"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Supprimer le dossier"
              aria-label={`Supprimer ${dossier.titre}`}
              onClick={() => onDelete(dossier)}
              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {dossier.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatBadge
            icon={AlertTriangle}
            value={dossier._count.typeDossier}
            label="Non-conformités"
            tone="amber"
          />
          <StatBadge
            icon={BookOpen}
            value={dossier._count.nouvellesLoi}
            label="Nouvelles loi"
            tone="indigo"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Ouvert le {formatDate(dossier.dateOuverture)}
          </span>
          {dossier.dateCloture ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <Calendar className="h-3.5 w-3.5" />
              Clôturé le {formatDate(dossier.dateCloture)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function DossiersVeilleJuridiqueTab({ dossiers }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<DossierVeilleJuridiqueListItem | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DossierVeilleJuridiqueListItem | null>(
    null
  );
  const [deletePending, setDeletePending] = useState(false);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyFormValues(),
  });

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) => !isDossierClos(d)).length;
    const clos = dossiers.filter((d) => isDossierClos(d)).length;
    const nonConformites = dossiers.reduce((sum, d) => sum + d._count.typeDossier, 0);
    const nouvellesLoi = dossiers.reduce((sum, d) => sum + d._count.nouvellesLoi, 0);
    return { total: dossiers.length, enCours, clos, nonConformites, nouvellesLoi };
  }, [dossiers]);

  const kpiCards = [
    {
      label: "Total dossiers",
      value: stats.total,
      sub: "Enregistrés dans la veille",
      icon: FolderOpen,
      accent: "from-violet-500 to-indigo-600",
      iconBg: "bg-violet-50 text-violet-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "En cours",
      value: stats.enCours,
      sub: "Dossiers actifs",
      icon: Calendar,
      accent: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-50 text-sky-600",
      filter: "en_cours" as QuickFilter,
    },
    {
      label: "Clôturés",
      value: stats.clos,
      sub: "Dossiers terminés",
      icon: BookOpen,
      accent: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 text-emerald-600",
      filter: "clos" as QuickFilter,
    },
    {
      label: "Non-conformités",
      value: stats.nonConformites,
      sub: `${stats.nouvellesLoi} nouvelle${stats.nouvellesLoi !== 1 ? "s" : ""} loi`,
      icon: AlertTriangle,
      accent: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-50 text-amber-600",
      filter: null,
    },
  ];

  const filteredDossiers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dossiers.filter((dossier) => {
      if (quickFilter === "en_cours" && isDossierClos(dossier)) return false;
      if (quickFilter === "clos" && !isDossierClos(dossier)) return false;
      if (!q) return true;
      return (
        dossier.titre.toLowerCase().includes(q) ||
        dossier.description.toLowerCase().includes(q)
      );
    });
  }, [dossiers, search, quickFilter]);

  const hasFilters = search.trim() !== "" || quickFilter !== "all";

  const openCreateModal = () => {
    setEditingDossier(null);
    form.reset(emptyFormValues());
    setFormOpen(true);
  };

  const openEditModal = (dossier: DossierVeilleJuridiqueListItem) => {
    setEditingDossier(dossier);
    form.reset({
      titre: dossier.titre,
      description: dossier.description,
      dateOuverture: toDateInputValue(dossier.dateOuverture),
      dateCloture: toDateInputValue(dossier.dateCloture),
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingDossier(null);
    form.reset(emptyFormValues());
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        titre: values.titre.trim(),
        description: values.description.trim(),
        dateOuverture: new Date(values.dateOuverture),
        dateCloture: values.dateCloture ? new Date(values.dateCloture) : null,
      };

      const result = editingDossier
        ? await updateDossierVeilleJuridique(editingDossier.id, payload)
        : await createDossierVeilleJuridique(payload);

      if (result.success) {
        toast.success(
          editingDossier ? "Dossier modifié avec succès" : "Dossier créé avec succès"
        );
        closeFormModal();
        router.refresh();
      } else {
        toast.error(result.error ?? "Une erreur est survenue");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      const result = await deleteDossierVeilleJuridique(deleteTarget.id);
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

  const resultLabel =
    filteredDossiers.length === 1
      ? "1 dossier affiché"
      : `${filteredDossiers.length} dossiers affichés`;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const isActive = kpi.filter !== null && quickFilter === kpi.filter;
          const isClickable = kpi.filter !== null;

          return (
            <Card
              key={kpi.label}
              className={cn(
                "overflow-hidden border-0 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-xl transition duration-300",
                isClickable &&
                  "cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70",
                isActive && "ring-2 ring-violet-500 ring-offset-2"
              )}
              onClick={
                isClickable
                  ? () => setQuickFilter(isActive ? "all" : kpi.filter!)
                  : undefined
              }
            >
              <div className={cn("h-1 bg-gradient-to-r", kpi.accent)} />
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                      {kpi.label}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                      {kpi.value}
                    </p>
                    <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{kpi.sub}</p>
                  </div>
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl",
                      kpi.iconBg
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Dossiers de veille</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Gérez vos dossiers de veille juridique et suivez leur avancement.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            size="lg"
            className="w-full shrink-0 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md hover:from-violet-700 hover:to-indigo-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Créer un Dossier
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un dossier…"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 shadow-sm focus-visible:bg-white focus-visible:ring-violet-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setQuickFilter("all");
                }}
                className="gap-1.5 rounded-lg text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" />
                Effacer
              </Button>
            ) : (
              <span className="text-xs text-slate-400 sm:text-sm">{resultLabel}</span>
            )}

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Vue grille"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 w-8 rounded-lg",
                  viewMode === "grid"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Vue liste"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 w-8 rounded-lg",
                  viewMode === "list"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {dossiers.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-violet-200/40 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-200">
                <FolderOpen className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucun dossier pour le moment</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Créez votre premier dossier de veille juridique pour centraliser le suivi des
              non-conformités, écarts et évolutions législatives.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              size="lg"
              className="mt-6 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md hover:from-violet-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Créer un Dossier
            </Button>
          </div>
        </div>
      ) : filteredDossiers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucun dossier ne correspond à votre recherche ou filtre.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-lg"
            onClick={() => {
              setSearch("");
              setQuickFilter("all");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDossiers.map((dossier) => (
            <DossierCard
              key={dossier.id}
              dossier={dossier}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="min-w-[160px] font-semibold text-slate-700">
                    Dossier
                  </TableHead>
                  <TableHead className="hidden min-w-[200px] font-semibold text-slate-700 md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                  <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                    Ouverture
                  </TableHead>
                  <TableHead className="hidden font-semibold text-slate-700 lg:table-cell">
                    Clôture
                  </TableHead>
                  <TableHead className="hidden text-center font-semibold text-slate-700 xl:table-cell">
                    Non-conf.
                  </TableHead>
                  <TableHead className="hidden text-center font-semibold text-slate-700 xl:table-cell">
                    Lois
                  </TableHead>
                  <TableHead className="w-[96px] text-right font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDossiers.map((dossier) => {
                  const clos = isDossierClos(dossier);
                  return (
                    <TableRow
                      key={dossier.id}
                      className="group transition-colors hover:bg-violet-50/40"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              clos ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
                            )}
                          >
                            <FolderOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {dossier.titre}
                            </p>
                            <p className="truncate text-xs text-slate-500 md:hidden">
                              {dossier.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[260px] truncate text-slate-600 md:table-cell">
                        {dossier.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-0 text-[10px] font-semibold",
                            clos
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-sky-100 text-sky-700"
                          )}
                        >
                          {clos ? "Clôturé" : "En cours"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-sm text-slate-600 sm:table-cell">
                        {format(new Date(dossier.dateOuverture), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-sm text-slate-600 lg:table-cell">
                        {dossier.dateCloture
                          ? format(new Date(dossier.dateCloture), "dd/MM/yyyy", { locale: fr })
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden text-center text-sm font-medium text-slate-700 xl:table-cell">
                        {dossier._count.typeDossier}
                      </TableCell>
                      <TableCell className="hidden text-center text-sm font-medium text-slate-700 xl:table-cell">
                        {dossier._count.nouvellesLoi}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Modifier le dossier"
                            aria-label={`Modifier ${dossier.titre}`}
                            onClick={() => openEditModal(dossier)}
                            className="h-8 w-8 rounded-lg text-slate-500 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 hover:bg-violet-50 hover:text-violet-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Supprimer le dossier"
                            aria-label={`Supprimer ${dossier.titre}`}
                            onClick={() => setDeleteTarget(dossier)}
                            className="h-8 w-8 rounded-lg text-red-500 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
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
        </div>
      )}

      {/* Create / Edit modal */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-0 p-0 sm:max-w-lg">
          <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 px-6 pb-5 pt-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <FolderOpen className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl text-white">
                {editingDossier ? "Modifier le dossier" : "Créer un dossier"}
              </DialogTitle>
              <DialogDescription className="text-violet-100">
                {editingDossier
                  ? "Mettez à jour les informations du dossier de veille juridique."
                  : "Renseignez les informations pour créer un nouveau dossier de veille juridique."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input
                          className={inputClass}
                          placeholder="Ex. Veille RGPD 2026"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500"
                          placeholder="Décrivez l'objet et le périmètre de ce dossier…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateOuverture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d&apos;ouverture</FormLabel>
                        <FormControl>
                          <Input className={inputClass} type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateCloture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de clôture (optionnel)</FormLabel>
                        <FormControl>
                          <Input className={inputClass} type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="gap-2 pt-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    onClick={closeFormModal}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="min-w-[7.5rem] gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingDossier ? "Enregistrer" : "Créer"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
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
                  <span className="font-medium text-slate-800">{deleteTarget.titre}</span> et
                  toutes ses données associées seront supprimés.
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
    </div>
  );
}
