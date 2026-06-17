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
  CheckCircle2,
  Eye,
  GraduationCap,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStatutNonConformiteLabel,
  getTypeFormationLabel,
  getTypeNonConformiteLabel,
  statutNonConformiteBadgeClass,
  TYPE_FORMATION_OPTIONS,
  typeFormationBadgeClass,
} from "@/lib/veille-juridique-display";
import {
  createFormation,
  deleteFormation,
  updateFormation,
  type FormationListItem,
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
  nonConformiteJuridiqueId: z.string().min(1, "La non-conformité est requise"),
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  cible: z.string().min(1, "La cible est requise"),
  typeFormation: z.enum(["INTERNE", "EXTERNE", "E_LEARNING", "PRESENTIEL", "HYBRIDE"]).optional(),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateCloture: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type QuickFilter = "all" | "en_cours" | "terminees";
type ViewMode = "grid" | "list";

type Props = {
  formations: FormationListItem[];
  nonConformites: NonConformiteJuridiqueListItem[];
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function emptyCreateFormValues(): FormValues {
  return {
    nonConformiteJuridiqueId: "",
    titre: "",
    description: "",
    cible: "",
    typeFormation: "INTERNE",
    dateDebut: new Date().toISOString().slice(0, 10),
    dateCloture: "",
  };
}

function formatDate(date: Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

function FormationCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FormationListItem;
  onEdit: (item: FormationListItem) => void;
  onDelete: (item: FormationListItem) => void;
}) {
  const isTerminee = !!item.dateCloture;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/60">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 sm:h-11 sm:w-11">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{item.titre}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {item.typeFormation ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border-0 text-[10px] font-semibold",
                      typeFormationBadgeClass(item.typeFormation)
                    )}
                  >
                    {getTypeFormationLabel(item.typeFormation)}
                  </Badge>
                ) : null}
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-[10px] font-semibold",
                    isTerminee ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                  )}
                >
                  {isTerminee ? "Terminée" : "En cours"}
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
              aria-label="Modifier"
              onClick={() => onEdit(item)}
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-700"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Supprimer"
              aria-label="Supprimer"
              onClick={() => onDelete(item)}
              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{item.description}</p>

        <div className="mt-3 rounded-xl bg-sky-50/60 px-3 py-2 ring-1 ring-sky-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">Cible</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-700">{item.cible}</p>
        </div>

        <p className="mt-3 truncate text-xs text-slate-500">
          {item.nonConformiteJuridique.titre} · {item.nonConformiteJuridique.dossierVeilleJuridique.titre}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Début le {formatDate(item.dateDebut)}
          </span>
          {item.dateCloture ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terminée le {formatDate(item.dateCloture)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function FormationTab({ formations, nonConformites }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FormationListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormationListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyCreateFormValues(),
  });

  const selectedNcId = form.watch("nonConformiteJuridiqueId");
  const selectedNc = useMemo(
    () => nonConformites.find((nc) => nc.id === selectedNcId),
    [nonConformites, selectedNcId]
  );

  const stats = useMemo(() => {
    const enCours = formations.filter((f) => !f.dateCloture).length;
    const terminees = formations.filter((f) => !!f.dateCloture).length;
    return { total: formations.length, enCours, terminees };
  }, [formations]);

  const kpiCards = [
    {
      label: "Total",
      value: stats.total,
      sub: "Formations planifiées",
      icon: GraduationCap,
      accent: "from-sky-500 to-indigo-600",
      iconBg: "bg-sky-50 text-sky-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "En cours",
      value: stats.enCours,
      sub: "Sessions actives",
      icon: AlertTriangle,
      accent: "from-blue-500 to-sky-500",
      iconBg: "bg-blue-50 text-blue-600",
      filter: "en_cours" as QuickFilter,
    },
    {
      label: "Terminées",
      value: stats.terminees,
      sub: "Sessions clôturées",
      icon: CheckCircle2,
      accent: "from-indigo-500 to-violet-600",
      iconBg: "bg-indigo-50 text-indigo-700",
      filter: "terminees" as QuickFilter,
    },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return formations.filter((item) => {
      if (quickFilter === "en_cours" && item.dateCloture) return false;
      if (quickFilter === "terminees" && !item.dateCloture) return false;
      if (!q) return true;
      return (
        item.titre.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.cible.toLowerCase().includes(q) ||
        (item.typeFormation?.toLowerCase().includes(q) ?? false) ||
        item.nonConformiteJuridique.titre.toLowerCase().includes(q) ||
        item.nonConformiteJuridique.dossierVeilleJuridique.titre.toLowerCase().includes(q)
      );
    });
  }, [formations, search, quickFilter]);

  const hasFilters = search.trim() !== "" || quickFilter !== "all";
  const canCreate = nonConformites.length > 0;

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Identifiez d'abord une non-conformité dans l'onglet Non conformité.");
      return;
    }
    setEditingItem(null);
    form.reset(emptyCreateFormValues());
    setFormOpen(true);
  };

  const openEditModal = (item: FormationListItem) => {
    setEditingItem(item);
    form.reset({
      nonConformiteJuridiqueId: item.nonConformiteJuridiqueId,
      titre: item.titre,
      description: item.description,
      cible: item.cible,
      typeFormation: (item.typeFormation as FormValues["typeFormation"]) ?? "INTERNE",
      dateDebut: toDateInputValue(item.dateDebut),
      dateCloture: toDateInputValue(item.dateCloture),
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingItem(null);
    form.reset(emptyCreateFormValues());
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        titre: values.titre.trim(),
        description: values.description.trim(),
        cible: values.cible.trim(),
        typeFormation: values.typeFormation ?? null,
        dateDebut: new Date(values.dateDebut),
        dateCloture: values.dateCloture ? new Date(values.dateCloture) : null,
        nonConformiteJuridiqueId: values.nonConformiteJuridiqueId,
      };

      const result = editingItem
        ? await updateFormation(editingItem.id, payload)
        : await createFormation(payload);

      if (result.success) {
        toast.success(
          editingItem ? "Formation modifiée avec succès" : "Formation enregistrée avec succès"
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
      const result = await deleteFormation(deleteTarget.id);
      if (result.success) {
        toast.success("Formation supprimée avec succès");
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
      ? "1 formation affichée"
      : `${filteredItems.length} formations affichées`;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
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
                isActive && "ring-2 ring-sky-500 ring-offset-2"
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
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Formation</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Proposez des formations de sensibilisation pour chaque non-conformité identifiée.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            size="lg"
            disabled={!canCreate}
            className="w-full shrink-0 gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 shadow-md hover:from-sky-600 hover:to-indigo-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Proposer une formation
          </Button>
        </div>

        {!canCreate ? (
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            Aucune non-conformité disponible. Identifiez d&apos;abord une non-conformité dans
            l&apos;onglet <strong>Non conformité</strong>.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une formation, une cible…"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 shadow-sm focus-visible:bg-white focus-visible:ring-sky-500"
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
                    ? "bg-white text-sky-700 shadow-sm"
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
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {formations.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-sky-200/40 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-200">
                <GraduationCap className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucune formation planifiée</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Organisez des sessions de formation pour sensibiliser les équipes aux non-conformités
              identifiées.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={!canCreate}
              size="lg"
              className="mt-6 gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 shadow-md hover:from-sky-600 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Proposer une formation
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucune formation ne correspond à votre recherche ou filtre.
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
            <FormationCard
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
                    Non-conformité
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                    Statut
                  </TableHead>
                  <TableHead className="w-[96px] text-right font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="group transition-colors hover:bg-sky-50/40">
                    <TableCell>
                      <p className="truncate font-semibold text-slate-900">{item.titre}</p>
                      <p className="truncate text-xs text-slate-500 md:hidden">
                        {item.nonConformiteJuridique.titre}
                      </p>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-sm text-slate-600 md:table-cell">
                      {item.nonConformiteJuridique.titre}
                    </TableCell>
                    <TableCell>
                      {item.typeFormation ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-0 text-[10px] font-semibold",
                            typeFormationBadgeClass(item.typeFormation)
                          )}
                        >
                          {getTypeFormationLabel(item.typeFormation)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 text-[10px] font-semibold",
                          item.dateCloture
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-sky-100 text-sky-700"
                        )}
                      >
                        {item.dateCloture ? "Terminée" : "En cours"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Modifier"
                          onClick={() => openEditModal(item)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-700"
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
        <DialogContent className="max-h-[90vh] overflow-y-auto border-0 p-0 sm:max-w-2xl">
          <div className="bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 px-6 pb-5 pt-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl text-white">
                {editingItem ? "Modifier la formation" : "Proposer une formation"}
              </DialogTitle>
              <DialogDescription className="text-sky-50">
                Planifiez une session de formation liée à une non-conformité existante.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Non-conformité concernée
                  </p>
                  <FormField
                    control={form.control}
                    name="nonConformiteJuridiqueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choisir une non-conformité existante</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue placeholder="Sélectionner une non-conformité…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nonConformites.map((nc) => (
                              <SelectItem key={nc.id} value={nc.id}>
                                {nc.titre} — {nc.dossierVeilleJuridique.titre} (
                                {getStatutNonConformiteLabel(nc.statutNonConformite)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedNc ? (
                    <div className="mt-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-amber-100">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-0 text-[10px] font-semibold",
                            statutNonConformiteBadgeClass(selectedNc.statutNonConformite)
                          )}
                        >
                          {getStatutNonConformiteLabel(selectedNc.statutNonConformite)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="border-0 bg-slate-100 text-[10px] font-semibold text-slate-600"
                        >
                          {getTypeNonConformiteLabel(selectedNc.typeNonConformite)}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-700">{selectedNc.description}</p>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Dossier : {selectedNc.dossierVeilleJuridique.titre}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">
                      Sélectionnez une non-conformité déjà identifiée dans l&apos;onglet Non
                      conformité.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                  <p className="mb-3 text-sm font-semibold text-sky-800">Détails de la formation</p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="titre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder="Ex. Sensibilisation RGPD pour les équipes RH"
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
                              className="min-h-[80px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-sky-500"
                              placeholder="Objectifs et contenu de la formation…"
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
                        name="cible"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cible</FormLabel>
                            <FormControl>
                              <Input
                                className={inputClass}
                                placeholder="Ex. Équipe RH, managers…"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="typeFormation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de formation</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TYPE_FORMATION_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
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
                        name="dateDebut"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de début</FormLabel>
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
                  </div>
                </div>

                {selectedNc ? (
                  <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Cette formation sera rattachée à la non-conformité « {selectedNc.titre} ». Vous
                      pouvez en proposer plusieurs pour la même non-conformité.
                    </span>
                  </div>
                ) : null}

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
                    disabled={submitting || !selectedNcId}
                    className="min-w-[7.5rem] gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Enregistrer
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
            <DialogTitle>Supprimer cette formation ?</DialogTitle>
            <DialogDescription className="text-pretty text-slate-600">
              Cette action est définitive
              {deleteTarget ? (
                <>
                  : <span className="font-medium text-slate-800">{deleteTarget.titre}</span> sera
                  supprimée.
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
