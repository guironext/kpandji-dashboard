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
  Calendar,
  Eye,
  FolderOpen,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStatutNonConformiteLabel,
  getTypeNonConformiteLabel,
  STATUT_NON_CONFORMITE_OPTIONS,
  statutNonConformiteBadgeClass,
  TYPE_NON_CONFORMITE_OPTIONS,
  typeNonConformiteBadgeClass,
} from "@/lib/veille-juridique-display";
import {
  createNonConformiteJuridique,
  deleteNonConformiteJuridique,
  updateNonConformiteJuridique,
  type DossierVeilleJuridiqueListItem,
  type NonConformiteJuridiqueListItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  typeNonConformite: z.enum([
    "JURIDIQUE",
    "REGLEMENTAIRE",
    "ENVIRONNEMENTALE",
    "HSE",
    "QUALITE",
    "DOCUMENTAIRE",
    "CONTRACTUELLE",
    "DOUANIERE",
    "FISCALE",
    "SOCIALE",
  ]),
  statutNonConformite: z.enum(["MINEURE", "MAJEURE", "CRITIQUE"]),
  dateOuverture: z.string().min(1, "La date d'ouverture est requise"),
  dateCloture: z.string().optional(),
  dossierVeilleJuridiqueId: z.string().min(1, "Le dossier parent est requis"),
});

type FormValues = z.infer<typeof formSchema>;
type QuickFilter = "all" | "mineure" | "majeure" | "critique";
type ViewMode = "grid" | "list";

type Props = {
  nonConformites: NonConformiteJuridiqueListItem[];
  dossiers: DossierVeilleJuridiqueListItem[];
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-amber-500";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function emptyFormValues(dossierId?: string): FormValues {
  return {
    titre: "",
    description: "",
    typeNonConformite: "JURIDIQUE",
    statutNonConformite: "MINEURE",
    dateOuverture: new Date().toISOString().slice(0, 10),
    dateCloture: "",
    dossierVeilleJuridiqueId: dossierId ?? "",
  };
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
  tone: "rose" | "emerald";
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 ring-1", tones[tone])}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <div className="min-w-0">
        <p className="text-sm font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

function NonConformiteCard({
  item,
  onEdit,
  onDelete,
}: {
  item: NonConformiteJuridiqueListItem;
  onEdit: (item: NonConformiteJuridiqueListItem) => void;
  onDelete: (item: NonConformiteJuridiqueListItem) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/60">
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-11 sm:w-11">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">{item.titre}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-[10px] font-semibold",
                    typeNonConformiteBadgeClass(item.typeNonConformite)
                  )}
                >
                  {getTypeNonConformiteLabel(item.typeNonConformite)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-[10px] font-semibold",
                    statutNonConformiteBadgeClass(item.statutNonConformite)
                  )}
                >
                  {getStatutNonConformiteLabel(item.statutNonConformite)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Modifier"
              aria-label={`Modifier ${item.titre}`}
              onClick={() => onEdit(item)}
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Supprimer"
              aria-label={`Supprimer ${item.titre}`}
              onClick={() => onDelete(item)}
              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {item.description}
        </p>

        <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{item.dossierVeilleJuridique.titre}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatBadge
            icon={Scale}
            value={item._count.ecartJuridique}
            label="Écarts juridiques"
            tone="rose"
          />
          <StatBadge
            icon={ShieldCheck}
            value={item._count.actionCorrective}
            label="Actions correctives"
            tone="emerald"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Ouvert le {formatDate(item.dateOuverture)}
          </span>
          {item.dateCloture ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <Calendar className="h-3.5 w-3.5" />
              Clôturé le {formatDate(item.dateCloture)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function NonConformiteJuridiqueTab({ nonConformites, dossiers }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NonConformiteJuridiqueListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NonConformiteJuridiqueListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyFormValues(dossiers[0]?.id),
  });

  const stats = useMemo(() => {
    const mineure = nonConformites.filter((n) => n.statutNonConformite === "MINEURE").length;
    const majeure = nonConformites.filter((n) => n.statutNonConformite === "MAJEURE").length;
    const critique = nonConformites.filter((n) => n.statutNonConformite === "CRITIQUE").length;
    return { total: nonConformites.length, mineure, majeure, critique };
  }, [nonConformites]);

  const kpiCards = [
    {
      label: "Total",
      value: stats.total,
      sub: "Non-conformités identifiées",
      icon: AlertTriangle,
      accent: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-50 text-amber-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "Mineure",
      value: stats.mineure,
      sub: "Gravité faible",
      icon: ShieldCheck,
      accent: "from-yellow-500 to-amber-500",
      iconBg: "bg-yellow-50 text-yellow-700",
      filter: "mineure" as QuickFilter,
    },
    {
      label: "Majeure",
      value: stats.majeure,
      sub: "Gravité élevée",
      icon: AlertTriangle,
      accent: "from-orange-500 to-red-500",
      iconBg: "bg-orange-50 text-orange-600",
      filter: "majeure" as QuickFilter,
    },
    {
      label: "Critique",
      value: stats.critique,
      sub: "Action urgente requise",
      icon: Scale,
      accent: "from-red-500 to-rose-600",
      iconBg: "bg-red-50 text-red-600",
      filter: "critique" as QuickFilter,
    },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return nonConformites.filter((item) => {
      if (quickFilter === "mineure" && item.statutNonConformite !== "MINEURE") return false;
      if (quickFilter === "majeure" && item.statutNonConformite !== "MAJEURE") return false;
      if (quickFilter === "critique" && item.statutNonConformite !== "CRITIQUE") return false;
      if (!q) return true;
      return (
        item.titre.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.dossierVeilleJuridique.titre.toLowerCase().includes(q) ||
        getTypeNonConformiteLabel(item.typeNonConformite).toLowerCase().includes(q) ||
        getStatutNonConformiteLabel(item.statutNonConformite).toLowerCase().includes(q)
      );
    });
  }, [nonConformites, search, quickFilter]);

  const hasFilters = search.trim() !== "" || quickFilter !== "all";
  const canCreate = dossiers.length > 0;

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Créez d'abord un dossier de veille dans l'onglet Dossiers.");
      return;
    }
    setEditingItem(null);
    form.reset(emptyFormValues(dossiers[0]?.id));
    setFormOpen(true);
  };

  const openEditModal = (item: NonConformiteJuridiqueListItem) => {
    setEditingItem(item);
    form.reset({
      titre: item.titre,
      description: item.description,
      typeNonConformite: item.typeNonConformite as FormValues["typeNonConformite"],
      statutNonConformite: item.statutNonConformite as FormValues["statutNonConformite"],
      dateOuverture: toDateInputValue(item.dateOuverture),
      dateCloture: toDateInputValue(item.dateCloture),
      dossierVeilleJuridiqueId: item.dossierVeilleJuridiqueId,
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingItem(null);
    form.reset(emptyFormValues(dossiers[0]?.id));
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        titre: values.titre.trim(),
        description: values.description.trim(),
        typeNonConformite: values.typeNonConformite,
        statutNonConformite: values.statutNonConformite,
        dateOuverture: new Date(values.dateOuverture),
        dateCloture: values.dateCloture ? new Date(values.dateCloture) : null,
        dossierVeilleJuridiqueId: values.dossierVeilleJuridiqueId,
      };

      const result = editingItem
        ? await updateNonConformiteJuridique(editingItem.id, payload)
        : await createNonConformiteJuridique(payload);

      if (result.success) {
        toast.success(
          editingItem
            ? "Non-conformité modifiée avec succès"
            : "Non-conformité identifiée avec succès"
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
      const result = await deleteNonConformiteJuridique(deleteTarget.id);
      if (result.success) {
        toast.success("Non-conformité supprimée avec succès");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletePending(false);
    }
  };

  const resultLabel =
    filteredItems.length === 1
      ? "1 non-conformité affichée"
      : `${filteredItems.length} non-conformités affichées`;

  return (
    <div className="space-y-5 sm:space-y-6">
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
                isActive && "ring-2 ring-amber-500 ring-offset-2"
              )}
              onClick={
                isClickable ? () => setQuickFilter(isActive ? "all" : kpi.filter!) : undefined
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

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Non-conformités et pratiques actuelles
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Identifiez et suivez les écarts de conformité rattachés à vos dossiers.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            size="lg"
            disabled={!canCreate}
            className="w-full shrink-0 gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-md hover:from-amber-600 hover:to-orange-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Identifier Non conformité
          </Button>
        </div>

        {!canCreate ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Aucun dossier disponible. Créez d&apos;abord un dossier dans l&apos;onglet{" "}
            <strong>Dossiers</strong>.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une non-conformité…"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 shadow-sm focus-visible:bg-white focus-visible:ring-amber-500"
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
                    ? "bg-white text-amber-700 shadow-sm"
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
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {nonConformites.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-amber-200/40 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Aucune non-conformité identifiée
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Documentez les écarts de conformité et les pratiques actuelles pour alimenter votre
              veille juridique.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={!canCreate}
              size="lg"
              className="mt-6 gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-md hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4" />
              Identifier Non conformité
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucune non-conformité ne correspond à votre recherche ou filtre.
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
          {filteredItems.map((item) => (
            <NonConformiteCard
              key={item.id}
              item={item}
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
                  <TableHead className="min-w-[160px] font-semibold text-slate-700">Titre</TableHead>
                  <TableHead className="hidden min-w-[140px] font-semibold text-slate-700 md:table-cell">
                    Dossier
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                  <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                    Ouverture
                  </TableHead>
                  <TableHead className="hidden text-center font-semibold text-slate-700 lg:table-cell">
                    Écarts
                  </TableHead>
                  <TableHead className="w-[96px] text-right font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group transition-colors hover:bg-amber-50/40"
                  >
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.titre}</p>
                        <p className="truncate text-xs text-slate-500 md:hidden">
                          {item.dossierVeilleJuridique.titre}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-sm text-slate-600 md:table-cell">
                      {item.dossierVeilleJuridique.titre}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 text-[10px] font-semibold",
                          typeNonConformiteBadgeClass(item.typeNonConformite)
                        )}
                      >
                        {getTypeNonConformiteLabel(item.typeNonConformite)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 text-[10px] font-semibold",
                          statutNonConformiteBadgeClass(item.statutNonConformite)
                        )}
                      >
                        {getStatutNonConformiteLabel(item.statutNonConformite)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-slate-600 sm:table-cell">
                      {format(new Date(item.dateOuverture), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="hidden text-center text-sm font-medium text-slate-700 lg:table-cell">
                      {item._count.ecartJuridique}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Modifier"
                          onClick={() => openEditModal(item)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          onClick={() => setDeleteTarget(item)}
                          className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
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
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-0 p-0 sm:max-w-lg">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-6 pb-5 pt-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl text-white">
                {editingItem ? "Modifier la non-conformité" : "Identifier une non-conformité"}
              </DialogTitle>
              <DialogDescription className="text-amber-50">
                {editingItem
                  ? "Mettez à jour les informations de cette non-conformité."
                  : "Renseignez les détails pour documenter un écart ou une pratique actuelle."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dossierVeilleJuridiqueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dossier parent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Sélectionner un dossier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dossiers.map((dossier) => (
                            <SelectItem key={dossier.id} value={dossier.id}>
                              {dossier.titre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input
                          className={inputClass}
                          placeholder="Ex. Absence de registre des traitements"
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
                          className="min-h-[100px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-amber-500"
                          placeholder="Décrivez la non-conformité ou la pratique observée…"
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
                    name="typeNonConformite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de non-conformité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TYPE_NON_CONFORMITE_OPTIONS.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="statutNonConformite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gravité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUT_NON_CONFORMITE_OPTIONS.map((statut) => (
                              <SelectItem key={statut.value} value={statut.value}>
                                {statut.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    className="min-w-[7.5rem] gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingItem ? "Enregistrer" : "Identifier"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette non-conformité ?</DialogTitle>
            <DialogDescription className="text-pretty text-slate-600">
              Cette action est définitive
              {deleteTarget ? (
                <>
                  :{" "}
                  <span className="font-medium text-slate-800">{deleteTarget.titre}</span> et
                  toutes ses données associées seront supprimées.
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
