"use client";

import { useEffect, useMemo, useState } from "react";
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
  CheckCircle2,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStatutNonConformiteLabel,
  getTypeNonConformiteLabel,
  statutNonConformiteBadgeClass,
} from "@/lib/veille-juridique-display";
import {
  createActionCorrective,
  deleteActionCorrective,
  updateActionCorrective,
  type ActionCorrectiveListItem,
  type EcartRisqueJuridiqueListItem,
  type NonConformiteJuridiqueListItem,
  type NouvelleLoiListItem,
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
  ecartJuridiqueId: z.string().min(1, "L'écart juridique est requis"),
  nouvelleLoiId: z.string().min(1, "La nouvelle loi est requise"),
  risqueJuridiqueId: z.string().optional(),
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  actionCorrective: z.string().min(1, "L'action corrective est requise"),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateCloture: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type QuickFilter = "all" | "en_cours" | "terminees";
type ViewMode = "grid" | "list";

type Props = {
  actionsCorrectives: ActionCorrectiveListItem[];
  nonConformites: NonConformiteJuridiqueListItem[];
  ecartsRisques: EcartRisqueJuridiqueListItem[];
  nouvellesLoi: NouvelleLoiListItem[];
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-emerald-500";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function emptyCreateFormValues(): FormValues {
  return {
    nonConformiteJuridiqueId: "",
    ecartJuridiqueId: "",
    nouvelleLoiId: "",
    risqueJuridiqueId: "",
    titre: "",
    description: "",
    actionCorrective: "",
    dateDebut: new Date().toISOString().slice(0, 10),
    dateCloture: "",
  };
}

function formatDate(date: Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

function ActionCorrectiveCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ActionCorrectiveListItem;
  onEdit: (item: ActionCorrectiveListItem) => void;
  onDelete: (item: ActionCorrectiveListItem) => void;
}) {
  const isTerminee = !!item.dateCloture;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/60">
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-11 sm:w-11">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{item.titre}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-[10px] font-semibold",
                    statutNonConformiteBadgeClass(item.nonConformiteJuridique.statutNonConformite)
                  )}
                >
                  {getStatutNonConformiteLabel(item.nonConformiteJuridique.statutNonConformite)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-[10px] font-semibold",
                    isTerminee
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-cyan-100 text-cyan-700"
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
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
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

        <div className="mt-3 rounded-xl bg-emerald-50/60 px-3 py-2 ring-1 ring-emerald-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Action corrective
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-700">{item.actionCorrective}</p>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-slate-500">
          <p className="truncate">
            <span className="font-medium text-slate-600">Non-conformité :</span>{" "}
            {item.nonConformiteJuridique.titre}
          </p>
          <p className="truncate">
            <span className="font-medium text-slate-600">Écart :</span>{" "}
            {item.ecartJuridique.obligationJuridique}
          </p>
          <p className="truncate">
            <span className="font-medium text-slate-600">Loi :</span> {item.nouvelleLoi.titre} (Ch.{" "}
            {item.nouvelleLoi.chapitre} · Art. {item.nouvelleLoi.article})
          </p>
        </div>

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

export default function ActionsCorrectivesTab({
  actionsCorrectives,
  nonConformites,
  ecartsRisques,
  nouvellesLoi,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionCorrectiveListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActionCorrectiveListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyCreateFormValues(),
  });

  const selectedNcId = form.watch("nonConformiteJuridiqueId");
  const selectedEcartId = form.watch("ecartJuridiqueId");

  const selectedNc = useMemo(
    () => nonConformites.find((nc) => nc.id === selectedNcId),
    [nonConformites, selectedNcId]
  );

  const ecartsForNc = useMemo(
    () => ecartsRisques.filter((e) => e.nonConformiteJuridiqueId === selectedNcId),
    [ecartsRisques, selectedNcId]
  );

  const selectedEcart = useMemo(
    () => ecartsForNc.find((e) => e.id === selectedEcartId),
    [ecartsForNc, selectedEcartId]
  );

  const loisForEcart = useMemo(
    () => nouvellesLoi.filter((l) => l.ecartJuridiqueId === selectedEcartId),
    [nouvellesLoi, selectedEcartId]
  );

  useEffect(() => {
    if (editingItem) return;

    const currentEcart = form.getValues("ecartJuridiqueId");
    const ecartStillValid = ecartsForNc.some((e) => e.id === currentEcart);

    if (!ecartStillValid) {
      const firstEcart = ecartsForNc[0];
      form.setValue("ecartJuridiqueId", firstEcart?.id ?? "");
      if (firstEcart?.risqueJuridique?.id) {
        form.setValue("risqueJuridiqueId", firstEcart.risqueJuridique.id);
      } else {
        form.setValue("risqueJuridiqueId", "");
      }
    }
  }, [selectedNcId, ecartsForNc, form, editingItem]);

  useEffect(() => {
    if (editingItem) return;

    const currentLoi = form.getValues("nouvelleLoiId");
    const loiStillValid = loisForEcart.some((l) => l.id === currentLoi);

    if (!loiStillValid) {
      form.setValue("nouvelleLoiId", loisForEcart[0]?.id ?? "");
    }

    if (selectedEcart?.risqueJuridique?.id) {
      form.setValue("risqueJuridiqueId", selectedEcart.risqueJuridique.id);
    } else {
      form.setValue("risqueJuridiqueId", "");
    }
  }, [selectedEcartId, loisForEcart, selectedEcart, form, editingItem]);

  const stats = useMemo(() => {
    const enCours = actionsCorrectives.filter((a) => !a.dateCloture).length;
    const terminees = actionsCorrectives.filter((a) => !!a.dateCloture).length;
    return { total: actionsCorrectives.length, enCours, terminees };
  }, [actionsCorrectives]);

  const kpiCards = [
    {
      label: "Total",
      value: stats.total,
      sub: "Actions planifiées",
      icon: ShieldCheck,
      accent: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 text-emerald-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "En cours",
      value: stats.enCours,
      sub: "À suivre",
      icon: AlertTriangle,
      accent: "from-cyan-500 to-teal-500",
      iconBg: "bg-cyan-50 text-cyan-600",
      filter: "en_cours" as QuickFilter,
    },
    {
      label: "Terminées",
      value: stats.terminees,
      sub: "Actions clôturées",
      icon: CheckCircle2,
      accent: "from-teal-500 to-emerald-600",
      iconBg: "bg-teal-50 text-teal-700",
      filter: "terminees" as QuickFilter,
    },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return actionsCorrectives.filter((item) => {
      if (quickFilter === "en_cours" && item.dateCloture) return false;
      if (quickFilter === "terminees" && !item.dateCloture) return false;
      if (!q) return true;
      return (
        item.titre.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.actionCorrective.toLowerCase().includes(q) ||
        item.nonConformiteJuridique.titre.toLowerCase().includes(q) ||
        item.ecartJuridique.obligationJuridique.toLowerCase().includes(q) ||
        item.nouvelleLoi.titre.toLowerCase().includes(q)
      );
    });
  }, [actionsCorrectives, search, quickFilter]);

  const hasFilters = search.trim() !== "" || quickFilter !== "all";

  const hasChainData = useMemo(() => {
    return nonConformites.some((nc) => {
      const ecarts = ecartsRisques.filter((e) => e.nonConformiteJuridiqueId === nc.id);
      return ecarts.some((ecart) =>
        nouvellesLoi.some((l) => l.ecartJuridiqueId === ecart.id)
      );
    });
  }, [nonConformites, ecartsRisques, nouvellesLoi]);

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

  const openEditModal = (item: ActionCorrectiveListItem) => {
    setEditingItem(item);
    form.reset({
      nonConformiteJuridiqueId: item.nonConformiteJuridiqueId,
      ecartJuridiqueId: item.ecartJuridiqueId,
      nouvelleLoiId: item.nouvelleLoiId,
      risqueJuridiqueId: item.risqueJuridiqueId ?? "",
      titre: item.titre,
      description: item.description,
      actionCorrective: item.actionCorrective,
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
        actionCorrective: values.actionCorrective.trim(),
        dateDebut: new Date(values.dateDebut),
        dateCloture: values.dateCloture ? new Date(values.dateCloture) : null,
        nonConformiteJuridiqueId: values.nonConformiteJuridiqueId,
        ecartJuridiqueId: values.ecartJuridiqueId,
        risqueJuridiqueId: values.risqueJuridiqueId || null,
        nouvelleLoiId: values.nouvelleLoiId,
      };

      const result = editingItem
        ? await updateActionCorrective(editingItem.id, payload)
        : await createActionCorrective(payload);

      if (result.success) {
        toast.success(
          editingItem
            ? "Action corrective modifiée avec succès"
            : "Action corrective enregistrée avec succès"
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
      const result = await deleteActionCorrective(deleteTarget.id);
      if (result.success) {
        toast.success("Action corrective supprimée avec succès");
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
      ? "1 action affichée"
      : `${filteredItems.length} actions affichées`;

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
                isActive && "ring-2 ring-emerald-500 ring-offset-2"
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
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Actions correctives</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Proposez des actions correctives pour chaque non-conformité identifiée.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            size="lg"
            disabled={!canCreate}
            className="w-full shrink-0 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:from-emerald-600 hover:to-teal-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Proposer une action corrective
          </Button>
        </div>

        {!canCreate ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Aucune non-conformité disponible. Identifiez d&apos;abord une non-conformité dans
            l&apos;onglet <strong>Non conformité</strong>.
          </p>
        ) : !hasChainData ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Vous pouvez choisir une non-conformité existante. Pour enregistrer une action, il faut
            aussi un <strong>écart & risque</strong> et une <strong>nouvelle loi</strong> liés à
            cette non-conformité.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une action, une non-conformité…"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 shadow-sm focus-visible:bg-white focus-visible:ring-emerald-500"
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
                    ? "bg-white text-emerald-700 shadow-sm"
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
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {actionsCorrectives.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-emerald-200/40 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200">
                <ShieldCheck className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucune action corrective</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Définissez les mesures à mettre en œuvre pour corriger chaque non-conformité
              identifiée.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={!canCreate}
              size="lg"
              className="mt-6 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:from-emerald-600 hover:to-teal-700"
            >
              <Plus className="h-4 w-4" />
              Proposer une action corrective
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucune action ne correspond à votre recherche ou filtre.
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
            <ActionCorrectiveCard
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
                  <TableHead className="hidden font-semibold text-slate-700 lg:table-cell">
                    Loi liée
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                  <TableHead className="w-[96px] text-right font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group transition-colors hover:bg-emerald-50/40"
                  >
                    <TableCell>
                      <p className="truncate font-semibold text-slate-900">{item.titre}</p>
                      <p className="truncate text-xs text-slate-500 md:hidden">
                        {item.nonConformiteJuridique.titre}
                      </p>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-sm text-slate-600 md:table-cell">
                      {item.nonConformiteJuridique.titre}
                    </TableCell>
                    <TableCell className="hidden max-w-[160px] truncate text-sm text-slate-600 lg:table-cell">
                      {item.nouvelleLoi.titre}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 text-[10px] font-semibold",
                          item.dateCloture
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-cyan-100 text-cyan-700"
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
                          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
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
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 pb-5 pt-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl text-white">
                {editingItem
                  ? "Modifier l'action corrective"
                  : "Proposer une action corrective"}
              </DialogTitle>
              <DialogDescription className="text-emerald-50">
                Définissez une action corrective rattachée à une non-conformité et à sa chaîne
                juridique.
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
                    <div className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-amber-100">
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
                        <Badge variant="secondary" className="border-0 bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {getTypeNonConformiteLabel(selectedNc.typeNonConformite)}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-700">{selectedNc.description}</p>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Dossier : {selectedNc.dossierVeilleJuridique.titre}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">
                      Sélectionnez une non-conformité déjà identifiée dans l&apos;onglet Non
                      conformité.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <p className="mb-3 text-sm font-semibold text-emerald-800">
                    Contexte juridique lié
                  </p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ecartJuridiqueId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Écart juridique</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={ecartsForNc.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className={inputClass}>
                                <SelectValue
                                  placeholder={
                                    ecartsForNc.length === 0
                                      ? "Aucun écart pour cette non-conformité"
                                      : "Sélectionner un écart"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ecartsForNc.map((ecart) => (
                                <SelectItem key={ecart.id} value={ecart.id}>
                                  {ecart.obligationJuridique}
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
                      name="nouvelleLoiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nouvelle loi applicable</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loisForEcart.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className={inputClass}>
                                <SelectValue
                                  placeholder={
                                    loisForEcart.length === 0
                                      ? "Aucune loi pour cet écart"
                                      : "Sélectionner une loi"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loisForEcart.map((loi) => (
                                <SelectItem key={loi.id} value={loi.id}>
                                  {loi.titre} — Ch. {loi.chapitre} · Art. {loi.article}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedNc && ecartsForNc.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Aucun écart documenté pour cette non-conformité. Ajoutez-en un dans
                        l&apos;onglet <strong>Écarts & risques</strong>.
                      </p>
                    ) : null}

                    {selectedEcart && loisForEcart.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Aucune nouvelle loi liée à cet écart. Référencez-en une dans l&apos;onglet{" "}
                        <strong>Nouvelles loi</strong>.
                      </p>
                    ) : null}

                    {selectedEcart?.risqueJuridique ? (
                      <div className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-emerald-100">
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <p className="text-xs text-slate-600">
                          Risque associé : {selectedEcart.risqueJuridique.descriptionRisque}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
                  <p className="mb-3 text-sm font-semibold text-teal-800">Détails de l&apos;action</p>
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
                              placeholder="Ex. Mise en place du registre des traitements"
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
                              className="min-h-[80px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-emerald-500"
                              placeholder="Contexte et objectif de l'action corrective…"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actionCorrective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action corrective</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[90px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-emerald-500"
                              placeholder="Décrivez précisément l'action à mener…"
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
                    disabled={
                      submitting ||
                      !selectedNcId ||
                      ecartsForNc.length === 0 ||
                      loisForEcart.length === 0
                    }
                    className="min-w-[7.5rem] gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
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
            <DialogTitle>Supprimer cette action corrective ?</DialogTitle>
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
