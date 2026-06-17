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
  BookOpen,
  Calendar,
  Eye,
  FileText,
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
import { getNiveauRisqueLabel, niveauRisqueBadgeClass } from "@/lib/veille-juridique-display";
import {
  createNouvelleLoi,
  deleteNouvelleLoi,
  updateNouvelleLoi,
  type DossierVeilleJuridiqueListItem,
  type EcartRisqueJuridiqueListItem,
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
  titre: z.string().min(1, "Le titre est requis"),
  chapitre: z.string().min(1, "Le chapitre est requis"),
  article: z.string().min(1, "L'article est requis"),
  paragraphe: z.string().optional(),
  dateOuverture: z.string().min(1, "La date d'ouverture est requise"),
  dateCloture: z.string().optional(),
  ecartJuridiqueId: z.string().min(1, "L'écart juridique est requis"),
  risqueJuridiqueId: z.string().optional(),
  dossierVeilleJuridiqueId: z.string().min(1, "Le dossier est requis"),
});

type FormValues = z.infer<typeof formSchema>;
type QuickFilter = "all" | "en_cours" | "clos";
type ViewMode = "grid" | "list";

type Props = {
  nouvellesLoi: NouvelleLoiListItem[];
  ecartsRisques: EcartRisqueJuridiqueListItem[];
  dossiers: DossierVeilleJuridiqueListItem[];
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-indigo-500";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function emptyFormValues(ecartId?: string, dossierId?: string): FormValues {
  return {
    titre: "",
    chapitre: "",
    article: "",
    paragraphe: "",
    dateOuverture: new Date().toISOString().slice(0, 10),
    dateCloture: "",
    ecartJuridiqueId: ecartId ?? "",
    risqueJuridiqueId: "",
    dossierVeilleJuridiqueId: dossierId ?? "",
  };
}

function formatDate(date: Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

function NouvelleLoiCard({
  item,
  onEdit,
  onDelete,
}: {
  item: NouvelleLoiListItem;
  onEdit: (item: NouvelleLoiListItem) => void;
  onDelete: (item: NouvelleLoiListItem) => void;
}) {
  const isClos = !!item.dateCloture;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-11 sm:w-11">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{item.titre}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge
                  variant="secondary"
                  className="border-0 bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                >
                  Ch. {item.chapitre} · Art. {item.article}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-[10px] font-semibold",
                    isClos ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
                  )}
                >
                  {isClos ? "Clôturée" : "En cours"}
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
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
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

        {item.paragraphe ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{item.paragraphe}</p>
        ) : null}

        <div className="mt-3 space-y-2">
          <div className="rounded-xl bg-indigo-50/60 px-3 py-2 ring-1 ring-indigo-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
              Écart lié
            </p>
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-700">
              {item.ecartJuridique.obligationJuridique}
            </p>
          </div>
          {item.risqueJuridique ? (
            <div className="rounded-xl bg-violet-50/60 px-3 py-2 ring-1 ring-violet-100">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                  Risque lié
                </p>
                {item.risqueJuridique.niveauRisque ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border-0 text-[10px] font-semibold",
                      niveauRisqueBadgeClass(item.risqueJuridique.niveauRisque)
                    )}
                  >
                    {getNiveauRisqueLabel(item.risqueJuridique.niveauRisque)}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-slate-700">
                {item.risqueJuridique.descriptionRisque}
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-3 truncate text-xs text-slate-500">
          {item.dossierVeilleJuridique.titre}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Depuis le {formatDate(item.dateOuverture)}
          </span>
          {item.dateCloture ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <Calendar className="h-3.5 w-3.5" />
              Clôturée le {formatDate(item.dateCloture)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function NouvellesLoiTab({ nouvellesLoi, ecartsRisques, dossiers }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NouvelleLoiListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NouvelleLoiListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyFormValues(ecartsRisques[0]?.id, dossiers[0]?.id),
  });

  const selectedEcartId = form.watch("ecartJuridiqueId");
  const selectedEcart = useMemo(
    () => ecartsRisques.find((e) => e.id === selectedEcartId),
    [ecartsRisques, selectedEcartId]
  );

  useEffect(() => {
    if (!selectedEcart || editingItem) return;
    const dossierId = selectedEcart.nonConformiteJuridique.dossierVeilleJuridique.id;
    const risqueId = selectedEcart.risqueJuridique?.id ?? "";
    if (form.getValues("dossierVeilleJuridiqueId") !== dossierId) {
      form.setValue("dossierVeilleJuridiqueId", dossierId);
    }
    if (form.getValues("risqueJuridiqueId") !== risqueId) {
      form.setValue("risqueJuridiqueId", risqueId);
    }
  }, [selectedEcart, form, editingItem]);

  const stats = useMemo(() => {
    const enCours = nouvellesLoi.filter((n) => !n.dateCloture).length;
    const clos = nouvellesLoi.filter((n) => !!n.dateCloture).length;
    return { total: nouvellesLoi.length, enCours, clos };
  }, [nouvellesLoi]);

  const kpiCards = [
    {
      label: "Total",
      value: stats.total,
      sub: "Lois référencées",
      icon: BookOpen,
      accent: "from-indigo-500 to-violet-600",
      iconBg: "bg-indigo-50 text-indigo-600",
      filter: "all" as QuickFilter,
    },
    {
      label: "En cours",
      value: stats.enCours,
      sub: "Veille active",
      icon: FileText,
      accent: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50 text-violet-600",
      filter: "en_cours" as QuickFilter,
    },
    {
      label: "Clôturées",
      value: stats.clos,
      sub: "Analyse terminée",
      icon: Scale,
      accent: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-50 text-emerald-700",
      filter: "clos" as QuickFilter,
    },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return nouvellesLoi.filter((item) => {
      if (quickFilter === "en_cours" && item.dateCloture) return false;
      if (quickFilter === "clos" && !item.dateCloture) return false;
      if (!q) return true;
      return (
        item.titre.toLowerCase().includes(q) ||
        item.chapitre.toLowerCase().includes(q) ||
        item.article.toLowerCase().includes(q) ||
        (item.paragraphe?.toLowerCase().includes(q) ?? false) ||
        item.ecartJuridique.obligationJuridique.toLowerCase().includes(q) ||
        (item.risqueJuridique?.descriptionRisque.toLowerCase().includes(q) ?? false) ||
        item.dossierVeilleJuridique.titre.toLowerCase().includes(q)
      );
    });
  }, [nouvellesLoi, search, quickFilter]);

  const hasFilters = search.trim() !== "" || quickFilter !== "all";
  const canCreate = ecartsRisques.length > 0 && dossiers.length > 0;

  const openCreateModal = () => {
    if (!canCreate) {
      toast.error("Documentez d'abord un écart et un risque dans l'onglet Écarts & risques.");
      return;
    }
    setEditingItem(null);
    const firstEcart = ecartsRisques[0];
    form.reset(
      emptyFormValues(
        firstEcart?.id,
        firstEcart?.nonConformiteJuridique.dossierVeilleJuridique.id ?? dossiers[0]?.id
      )
    );
    if (firstEcart?.risqueJuridique?.id) {
      form.setValue("risqueJuridiqueId", firstEcart.risqueJuridique.id);
    }
    setFormOpen(true);
  };

  const openEditModal = (item: NouvelleLoiListItem) => {
    setEditingItem(item);
    form.reset({
      titre: item.titre,
      chapitre: item.chapitre,
      article: item.article,
      paragraphe: item.paragraphe ?? "",
      dateOuverture: toDateInputValue(item.dateOuverture),
      dateCloture: toDateInputValue(item.dateCloture),
      ecartJuridiqueId: item.ecartJuridiqueId,
      risqueJuridiqueId: item.risqueJuridiqueId ?? "",
      dossierVeilleJuridiqueId: item.dossierVeilleJuridiqueId,
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingItem(null);
    const firstEcart = ecartsRisques[0];
    form.reset(
      emptyFormValues(
        firstEcart?.id,
        firstEcart?.nonConformiteJuridique.dossierVeilleJuridique.id ?? dossiers[0]?.id
      )
    );
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        titre: values.titre.trim(),
        chapitre: values.chapitre.trim(),
        article: values.article.trim(),
        paragraphe: values.paragraphe?.trim() || undefined,
        dateOuverture: new Date(values.dateOuverture),
        dateCloture: values.dateCloture ? new Date(values.dateCloture) : null,
        ecartJuridiqueId: values.ecartJuridiqueId,
        risqueJuridiqueId: values.risqueJuridiqueId || null,
        dossierVeilleJuridiqueId: values.dossierVeilleJuridiqueId,
      };

      const result = editingItem
        ? await updateNouvelleLoi(editingItem.id, payload)
        : await createNouvelleLoi(payload);

      if (result.success) {
        toast.success(
          editingItem ? "Nouvelle loi modifiée avec succès" : "Nouvelle loi enregistrée avec succès"
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
      const result = await deleteNouvelleLoi(deleteTarget.id);
      if (result.success) {
        toast.success("Nouvelle loi supprimée avec succès");
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
      ? "1 nouvelle loi affichée"
      : `${filteredItems.length} nouvelles lois affichées`;

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
                isActive && "ring-2 ring-indigo-500 ring-offset-2"
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
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Nouvelles loi</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Référencez les textes législatifs applicables à chaque écart et risque identifié.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            size="lg"
            disabled={!canCreate}
            className="w-full shrink-0 gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md hover:from-indigo-600 hover:to-violet-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Proposer une nouvelle loi
          </Button>
        </div>

        {!canCreate ? (
          <p className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            Aucun écart disponible. Documentez d&apos;abord un écart et un risque dans l&apos;onglet{" "}
            <strong>Écarts & risques</strong>.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une loi, un article, un écart…"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 shadow-sm focus-visible:bg-white focus-visible:ring-indigo-500"
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
                    ? "bg-white text-indigo-700 shadow-sm"
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
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {nouvellesLoi.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-indigo-200/40 blur-xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                <BookOpen className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucune nouvelle loi référencée</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Pour chaque écart et risque identifié, proposez le texte législatif applicable.
            </p>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={!canCreate}
              size="lg"
              className="mt-6 gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md hover:from-indigo-600 hover:to-violet-700"
            >
              <Plus className="h-4 w-4" />
              Proposer une nouvelle loi
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucune loi ne correspond à votre recherche ou filtre.
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
            <NouvelleLoiCard
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
                  <TableHead className="font-semibold text-slate-700">Référence</TableHead>
                  <TableHead className="hidden min-w-[140px] font-semibold text-slate-700 md:table-cell">
                    Écart lié
                  </TableHead>
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
                  <TableRow key={item.id} className="group transition-colors hover:bg-indigo-50/40">
                    <TableCell>
                      <p className="truncate font-semibold text-slate-900">{item.titre}</p>
                      <p className="truncate text-xs text-slate-500 md:hidden">
                        {item.ecartJuridique.obligationJuridique}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">
                      Ch. {item.chapitre} · Art. {item.article}
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-sm text-slate-600 md:table-cell">
                      {item.ecartJuridique.obligationJuridique}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 text-[10px] font-semibold",
                          item.dateCloture
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-violet-100 text-violet-700"
                        )}
                      >
                        {item.dateCloture ? "Clôturée" : "En cours"}
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
                          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
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
          <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-6 pb-5 pt-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl text-white">
                {editingItem ? "Modifier la nouvelle loi" : "Proposer une nouvelle loi"}
              </DialogTitle>
              <DialogDescription className="text-indigo-50">
                Référencez le texte législatif applicable à un écart et son risque associé.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-800">
                    <Scale className="h-4 w-4" />
                    Lien avec écart & risque
                  </p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ecartJuridiqueId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Écart juridique</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className={inputClass}>
                                <SelectValue placeholder="Sélectionner un écart" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ecartsRisques.map((ecart) => (
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

                    {selectedEcart ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-indigo-100">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                            Situation observée
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                            {selectedEcart.situationObservee}
                          </p>
                        </div>
                        {selectedEcart.risqueJuridique ? (
                          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-violet-100">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                              Risque associé
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                              {selectedEcart.risqueJuridique.descriptionRisque}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
                            <p className="text-xs text-slate-400">Aucun risque associé à cet écart</p>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <FormField
                      control={form.control}
                      name="dossierVeilleJuridiqueId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dossier de veille</FormLabel>
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
                  </div>
                </div>

                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-800">
                    <FileText className="h-4 w-4" />
                    Texte législatif
                  </p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="titre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre de la loi</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder="Ex. Loi n° 2016-1321 relative à la transparence"
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
                        name="chapitre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chapitre</FormLabel>
                            <FormControl>
                              <Input className={inputClass} placeholder="Ex. II" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="article"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Article</FormLabel>
                            <FormControl>
                              <Input className={inputClass} placeholder="Ex. 32" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paragraphe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paragraphe (optionnel)</FormLabel>
                            <FormControl>
                              <Input className={inputClass} placeholder="Ex. 2" {...field} />
                            </FormControl>
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
                  </div>
                </div>

                {selectedEcart?.risqueJuridique ? (
                  <div className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Le risque juridique « {selectedEcart.risqueJuridique.descriptionRisque.slice(0, 80)}
                      {selectedEcart.risqueJuridique.descriptionRisque.length > 80 ? "…" : ""} » sera
                      automatiquement lié à cette nouvelle loi.
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
                    disabled={submitting}
                    className="min-w-[7.5rem] gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
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
            <DialogTitle>Supprimer cette nouvelle loi ?</DialogTitle>
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
