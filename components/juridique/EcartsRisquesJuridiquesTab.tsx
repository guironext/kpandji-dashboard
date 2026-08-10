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
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Scale,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNiveauRisqueLabel,
  getStatutNonConformiteLabel,
  IMPACT_RISQUE_OPTIONS,
  NIVEAU_RISQUE_OPTIONS,
  niveauRisqueBadgeClass,
  PROBABILITE_RISQUE_OPTIONS,
} from "@/lib/veille-juridique-display";
import {
  createEcartRisqueJuridique,
  deleteEcartRisqueJuridique,
  updateEcartRisqueJuridique,
  type EcartRisqueJuridiqueListItem,
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
  nonConformiteJuridiqueId: z.string().min(1, "La non-conformité parente est requise"),
  obligationJuridique: z.string().min(1, "L'obligation juridique est requise"),
  situationObservee: z.string().min(1, "La situation observée est requise"),
  descriptionEcart: z.string().optional(),
  dateDetection: z.string().optional(),
  serviceConcerne: z.string().optional(),
  descriptionRisque: z.string().min(1, "La description du risque est requise"),
  probabilite: z.enum(["FAIBLE", "MOYENNE", "ELEVEE"]).optional(),
  impact: z.enum(["FAIBLE", "MOYEN", "ELEVE", "CRITIQUE"]).optional(),
  niveauRisque: z.enum(["FAIBLE", "MODERE", "ELEVE", "CRITIQUE"]).optional(),
  mesurePreventive: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type QuickFilter = "all" | "faible" | "modere" | "eleve" | "critique";
type ViewMode = "grid" | "list";

type Props = {
  ecartsRisques: EcartRisqueJuridiqueListItem[];
  nonConformites: NonConformiteJuridiqueListItem[];
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-rose-500";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function emptyFormValues(nonConformiteId?: string): FormValues {
  return {
    nonConformiteJuridiqueId: nonConformiteId ?? "",
    obligationJuridique: "",
    situationObservee: "",
    descriptionEcart: "",
    dateDetection: new Date().toISOString().slice(0, 10),
    serviceConcerne: "",
    descriptionRisque: "",
    probabilite: "MOYENNE",
    impact: "MOYEN",
    niveauRisque: "MODERE",
    mesurePreventive: "",
  };
}

function formatDate(date: Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

function EcartRisqueCard({
  item,
  onEdit,
  onDelete,
}: {
  item: EcartRisqueJuridiqueListItem;
  onEdit: (item: EcartRisqueJuridiqueListItem) => void;
  onDelete: (item: EcartRisqueJuridiqueListItem) => void;
}) {
  const risque = item.risqueJuridique;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/60">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 sm:h-11 sm:w-11">
              <Scale className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                {item.obligationJuridique}
              </h3>
              {risque?.niveauRisque ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-1.5 border-0 text-[10px] font-semibold",
                    niveauRisqueBadgeClass(risque.niveauRisque)
                  )}
                >
                  Risque {getNiveauRisqueLabel(risque.niveauRisque)}
                </Badge>
              ) : null}
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
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"
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

        <div className="mt-3 space-y-2">
          <div className="rounded-xl bg-rose-50/60 px-3 py-2 ring-1 ring-rose-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
              Situation observée
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-700">{item.situationObservee}</p>
          </div>
          {risque ? (
            <div className="rounded-xl bg-red-50/50 px-3 py-2 ring-1 ring-red-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                Risque associé
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-slate-700">
                {risque.descriptionRisque}
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-3 truncate text-xs text-slate-500">
          {item.nonConformiteJuridique.titre} · {item.nonConformiteJuridique.dossierVeilleJuridique.titre}
        </p>

        {item.dateDetection ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Détecté le {formatDate(item.dateDetection)}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function EcartsRisquesJuridiquesTab({ ecartsRisques, nonConformites }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EcartRisqueJuridiqueListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EcartRisqueJuridiqueListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyFormValues(),
  });

  const stats = useMemo(() => {
    const faible = ecartsRisques.filter(
      (e) => e.risqueJuridique?.niveauRisque === "FAIBLE"
    ).length;
    const modere = ecartsRisques.filter(
      (e) => e.risqueJuridique?.niveauRisque === "MODERE"
    ).length;
    const eleve = ecartsRisques.filter(
      (e) => e.risqueJuridique?.niveauRisque === "ELEVE"
    ).length;
    const critique = ecartsRisques.filter(
      (e) => e.risqueJuridique?.niveauRisque === "CRITIQUE"
    ).length;
    return { total: ecartsRisques.length, faible, modere, eleve, critique };
  }, [ecartsRisques]);

  const kpiCards = [
    {
      label: "Total",
      value: stats.total,
      sub: "Écarts documentés",
      icon: Scale,
      accent: "from-rose-500 to-red-600",
      iconBg: "bg-rose-50 text-rose-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "Faible",
      value: stats.faible,
      sub: "Risque limité",
      icon: ShieldAlert,
      accent: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-50 text-emerald-700",
      filter: "faible" as QuickFilter,
    },
    {
      label: "Modéré",
      value: stats.modere,
      sub: "Surveillance requise",
      icon: AlertTriangle,
      accent: "from-yellow-500 to-amber-500",
      iconBg: "bg-yellow-50 text-yellow-700",
      filter: "modere" as QuickFilter,
    },
    {
      label: "Élevé / Critique",
      value: stats.eleve + stats.critique,
      sub: "Action prioritaire",
      icon: AlertTriangle,
      accent: "from-red-500 to-rose-600",
      iconBg: "bg-red-50 text-red-600",
      filter: "eleve" as QuickFilter,
    },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ecartsRisques.filter((item) => {
      const niveau = item.risqueJuridique?.niveauRisque;
      if (quickFilter === "faible" && niveau !== "FAIBLE") return false;
      if (quickFilter === "modere" && niveau !== "MODERE") return false;
      if (quickFilter === "eleve" && niveau !== "ELEVE" && niveau !== "CRITIQUE") return false;
      if (quickFilter === "critique" && niveau !== "CRITIQUE") return false;
      if (!q) return true;
      return (
        item.obligationJuridique.toLowerCase().includes(q) ||
        item.situationObservee.toLowerCase().includes(q) ||
        (item.descriptionEcart?.toLowerCase().includes(q) ?? false) ||
        (item.serviceConcerne?.toLowerCase().includes(q) ?? false) ||
        (item.risqueJuridique?.descriptionRisque.toLowerCase().includes(q) ?? false) ||
        item.nonConformiteJuridique.titre.toLowerCase().includes(q)
      );
    });
  }, [ecartsRisques, search, quickFilter]);

  const hasFilters = search.trim() !== "" || quickFilter !== "all";
  const canCreate = nonConformites.length > 0;

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Identifiez d'abord une non-conformité dans l'onglet Non conformité.");
      return;
    }
    setEditingItem(null);
    form.reset(emptyFormValues());
    setFormOpen(true);
  };

  const openEditModal = (item: EcartRisqueJuridiqueListItem) => {
    const risque = item.risqueJuridique;
    setEditingItem(item);
    form.reset({
      nonConformiteJuridiqueId: item.nonConformiteJuridiqueId,
      obligationJuridique: item.obligationJuridique,
      situationObservee: item.situationObservee,
      descriptionEcart: item.descriptionEcart ?? "",
      dateDetection: toDateInputValue(item.dateDetection),
      serviceConcerne: item.serviceConcerne ?? "",
      descriptionRisque: risque?.descriptionRisque ?? "",
      probabilite: (risque?.probabilite as FormValues["probabilite"]) ?? "MOYENNE",
      impact: (risque?.impact as FormValues["impact"]) ?? "MOYEN",
      niveauRisque: (risque?.niveauRisque as FormValues["niveauRisque"]) ?? "MODERE",
      mesurePreventive: risque?.mesurePreventive ?? "",
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingItem(null);
    form.reset(emptyFormValues());
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        nonConformiteJuridiqueId: values.nonConformiteJuridiqueId,
        obligationJuridique: values.obligationJuridique.trim(),
        situationObservee: values.situationObservee.trim(),
        descriptionEcart: values.descriptionEcart?.trim() || undefined,
        dateDetection: values.dateDetection ? new Date(values.dateDetection) : null,
        serviceConcerne: values.serviceConcerne?.trim() || undefined,
        descriptionRisque: values.descriptionRisque.trim(),
        probabilite: values.probabilite ?? null,
        impact: values.impact ?? null,
        niveauRisque: values.niveauRisque ?? null,
        mesurePreventive: values.mesurePreventive?.trim() || undefined,
      };

      const result = editingItem
        ? await updateEcartRisqueJuridique(editingItem.id, payload)
        : await createEcartRisqueJuridique(payload);

      if (result.success) {
        toast.success(
          editingItem
            ? "Écart et risque modifiés avec succès"
            : "Écart et risque enregistrés avec succès"
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
      const result = await deleteEcartRisqueJuridique(deleteTarget.id);
      if (result.success) {
        toast.success("Écart et risque supprimés avec succès");
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
      ? "1 écart affiché"
      : `${filteredItems.length} écarts affichés`;

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
                isActive && "ring-2 ring-rose-500 ring-offset-2"
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
              Écarts et risques juridiques
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Documentez chaque écart de conformité et le risque juridique qui lui est associé.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            size="lg"
            disabled={!canCreate}
            className="w-full shrink-0 gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 shadow-md hover:from-rose-600 hover:to-red-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Ajouter écart & risque
          </Button>
        </div>

        {!canCreate ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
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
              placeholder="Rechercher un écart ou un risque…"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 shadow-sm focus-visible:bg-white focus-visible:ring-rose-500"
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
                    ? "bg-white text-rose-700 shadow-sm"
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
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {ecartsRisques.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-rose-200/40 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-200">
                <Scale className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucun écart documenté</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Pour chaque écart identifié, associez le risque juridique correspondant pour
              compléter votre analyse.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={!canCreate}
              size="lg"
              className="mt-6 gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 shadow-md hover:from-rose-600 hover:to-red-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter écart & risque
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucun écart ne correspond à votre recherche ou filtre.
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
            <EcartRisqueCard
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
                  <TableHead className="min-w-[160px] font-semibold text-slate-700">
                    Obligation
                  </TableHead>
                  <TableHead className="hidden min-w-[140px] font-semibold text-slate-700 md:table-cell">
                    Non-conformité
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Niveau risque</TableHead>
                  <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                    Détection
                  </TableHead>
                  <TableHead className="w-[96px] text-right font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="group transition-colors hover:bg-rose-50/40">
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {item.obligationJuridique}
                        </p>
                        <p className="truncate text-xs text-slate-500 md:hidden">
                          {item.nonConformiteJuridique.titre}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-sm text-slate-600 md:table-cell">
                      {item.nonConformiteJuridique.titre}
                    </TableCell>
                    <TableCell>
                      {item.risqueJuridique?.niveauRisque ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-0 text-[10px] font-semibold",
                            niveauRisqueBadgeClass(item.risqueJuridique.niveauRisque)
                          )}
                        >
                          {getNiveauRisqueLabel(item.risqueJuridique.niveauRisque)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-slate-600 sm:table-cell">
                      {item.dateDetection
                        ? format(new Date(item.dateDetection), "dd/MM/yyyy", { locale: fr })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Modifier"
                          onClick={() => openEditModal(item)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"
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
          <div className="bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 px-6 pb-5 pt-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Scale className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl text-white">
                {editingItem ? "Modifier l'écart et le risque" : "Documenter un écart et son risque"}
              </DialogTitle>
              <DialogDescription className="text-rose-50">
                Renseignez l&apos;écart juridique identifié et le risque qui en découle.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-800">
                    <Scale className="h-4 w-4" />
                    Écart juridique
                  </p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="obligationJuridique"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Obligation juridique</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder="Ex. Tenue d'un registre des traitements RGPD"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="situationObservee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Situation observée</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[80px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-rose-500"
                              placeholder="Décrivez la situation constatée sur le terrain…"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descriptionEcart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description de l&apos;écart (optionnel)</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[70px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-rose-500"
                              placeholder="Précisions complémentaires sur l'écart…"
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
                        name="dateDetection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de détection</FormLabel>
                            <FormControl>
                              <Input className={inputClass} type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serviceConcerne"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service concerné (optionnel)</FormLabel>
                            <FormControl>
                              <Input
                                className={inputClass}
                                placeholder="Ex. RH, Commercial…"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
                    <ShieldAlert className="h-4 w-4" />
                    Risque juridique associé
                  </p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="descriptionRisque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description du risque</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[80px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-rose-500"
                              placeholder="Quel risque juridique découle de cet écart ?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="probabilite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Probabilité</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PROBABILITE_RISQUE_OPTIONS.map((opt) => (
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

                      <FormField
                        control={form.control}
                        name="impact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impact</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {IMPACT_RISQUE_OPTIONS.map((opt) => (
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

                      <FormField
                        control={form.control}
                        name="niveauRisque"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Niveau de risque</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NIVEAU_RISQUE_OPTIONS.map((opt) => (
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

                    <FormField
                      control={form.control}
                      name="mesurePreventive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesure préventive (optionnel)</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[70px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-rose-500"
                              placeholder="Actions préventives envisagées…"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    disabled={submitting}
                    className="min-w-[7.5rem] gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingItem ? "Enregistrer" : "Enregistrer"}
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
            <DialogTitle>Supprimer cet écart et son risque ?</DialogTitle>
            <DialogDescription className="text-pretty text-slate-600">
              Cette action est définitive
              {deleteTarget ? (
                <>
                  :{" "}
                  <span className="font-medium text-slate-800">
                    {deleteTarget.obligationJuridique}
                  </span>{" "}
                  et le risque associé seront supprimés.
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
