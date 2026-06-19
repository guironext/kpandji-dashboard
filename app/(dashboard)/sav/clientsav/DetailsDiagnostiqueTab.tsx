"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, FileText, Search, Coins, Filter } from "lucide-react";
import { toast } from "sonner";

interface CatergorieDiagnostic {
  id: string;
  nom: string;
}

interface DetailDiagnostic {
  id: string;
  nom: string;
  description?: string | null;
  prix_unitaire?: number | string | null;
  catergorieDiagnosticId: string;
  catergorieDiagnostic?: CatergorieDiagnostic;
  createdAt: string;
}

const emptyForm = { nom: "", description: "", prix_unitaire: "", catergorieDiagnosticId: "" };

async function fetchDetails() {
  const res = await fetch("/api/sav/detail-diagnostic");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch("/api/sav/categorie-diagnostic");
  return res.json();
}

async function createDetailDiagnostic(data: {
  nom: string;
  description?: string;
  prix_unitaire?: number;
  catergorieDiagnosticId: string;
}) {
  const res = await fetch("/api/sav/detail-diagnostic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function updateDetailDiagnostic(
  id: string,
  data: { nom?: string; description?: string; prix_unitaire?: number; catergorieDiagnosticId?: string }
) {
  const res = await fetch(`/api/sav/detail-diagnostic/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function deleteDetailDiagnostic(id: string) {
  const res = await fetch(`/api/sav/detail-diagnostic/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

/** Format number with space as thousands separator for FCFA display */
function formatPrixFCFA(value: number | string | null | undefined): string {
  if (value == null) return "0 FCFA";
  const n = typeof value === "string" ? parseFloat(String(value).replace(/\s/g, "")) : Number(value);
  if (isNaN(n)) return "0 FCFA";
  const parts = Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ").split(".");
  return parts[0] + " FCFA";
}

/** Parse input string (with spaces) to number */
function parsePrixInput(str: string): number {
  const cleaned = str.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Format for input display with thousands separator */
function formatPrixForInput(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = typeof value === "string" ? parseFloat(String(value).replace(/\s/g, "")) : Number(value);
  if (isNaN(n) || n === 0) return "";
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const CATEGORY_COLORS = [
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-violet-100 text-violet-700 border-violet-200",
];

function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export default function DetailsDiagnostiqueTab({ embedded = false }: { embedded?: boolean }) {
  const [details, setDetails] = useState<DetailDiagnostic[]>([]);
  const [categories, setCategories] = useState<CatergorieDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<DetailDiagnostic | null>(null);
  const [editingDetail, setEditingDetail] = useState<DetailDiagnostic | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detailsRes, categoriesRes] = await Promise.all([
        fetchDetails(),
        fetchCategories(),
      ]);
      if (detailsRes.success && detailsRes.data) setDetails(detailsRes.data);
      else toast.error(detailsRes.error || "Erreur chargement détails");
      if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDetails = useMemo(() => {
    let list = details;
    if (categoryFilter !== "all") {
      list = list.filter((d) => d.catergorieDiagnosticId === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.nom.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false) ||
          (d.catergorieDiagnostic?.nom.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [details, categoryFilter, searchQuery]);

  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c, i) => {
      map[c.id] = getCategoryColor(i);
    });
    return map;
  }, [categories]);

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (d: DetailDiagnostic) => {
    setEditingDetail(d);
    const prixVal = d.prix_unitaire != null ? Number(d.prix_unitaire) : 0;
    setFormData({
      nom: d.nom,
      description: d.description || "",
      prix_unitaire: prixVal > 0 ? formatPrixForInput(prixVal) : "",
      catergorieDiagnosticId: d.catergorieDiagnosticId,
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (d: DetailDiagnostic) => {
    setDetailToDelete(d);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!formData.catergorieDiagnosticId) {
      toast.error("La catégorie est requise");
      return;
    }
    setIsSubmitting(true);
    try {
      const prix = parsePrixInput(formData.prix_unitaire);
      const result = await createDetailDiagnostic({
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
        prix_unitaire: prix,
        catergorieDiagnosticId: formData.catergorieDiagnosticId,
      });
      if (result.success) {
        toast.success("Détail ajouté avec succès");
        setAddDialogOpen(false);
        loadData();
      } else toast.error(result.error || "Erreur lors de l'ajout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingDetail || !formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!formData.catergorieDiagnosticId) {
      toast.error("La catégorie est requise");
      return;
    }
    setIsSubmitting(true);
    try {
      const prix = parsePrixInput(formData.prix_unitaire);
      const result = await updateDetailDiagnostic(editingDetail.id, {
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
        prix_unitaire: prix,
        catergorieDiagnosticId: formData.catergorieDiagnosticId,
      });
      if (result.success) {
        toast.success("Détail modifié avec succès");
        setEditDialogOpen(false);
        setEditingDetail(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la modification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!detailToDelete) return;
    try {
      const result = await deleteDetailDiagnostic(detailToDelete.id);
      if (result.success) {
        toast.success("Détail supprimé avec succès");
        setDeleteDialogOpen(false);
        setDetailToDelete(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la suppression");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const renderForm = (prefix: string) => (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor={`${prefix}-nom`} className="text-slate-700 font-medium">Nom de l&apos;intervention *</Label>
        <Input
          id={`${prefix}-nom`}
          value={formData.nom}
          onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
          placeholder="Ex: Vérification freins, Diagnostic électronique..."
          className="rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">Catégorie *</Label>
        <Select
          value={formData.catergorieDiagnosticId}
          onValueChange={(v) => setFormData((p) => ({ ...p, catergorieDiagnosticId: v }))}
        >
          <SelectTrigger className="rounded-xl border-slate-200">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length === 0 && (
          <p className="text-xs text-amber-600 mt-1.5">Ajoutez d&apos;abord une catégorie dans l&apos;onglet Catégorie Diagnostique</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-prix`} className="text-slate-700 font-medium">Prix unitaire (FCFA)</Label>
        <Input
          id={`${prefix}-prix`}
          type="text"
          inputMode="numeric"
          value={formData.prix_unitaire}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            setFormData((p) => ({ ...p, prix_unitaire: raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "" }));
          }}
          onBlur={(e) => {
            const raw = e.target.value.replace(/\s/g, "");
            if (raw) {
              const n = parseInt(raw, 10);
              if (!isNaN(n) && n > 0) {
                setFormData((p) => ({ ...p, prix_unitaire: n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") }));
              }
            }
          }}
          placeholder="1 000 000"
          className="rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor={`${prefix}-description`} className="text-slate-700 font-medium">Description (optionnel)</Label>
        <Textarea
          id={`${prefix}-description`}
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          placeholder="Décrivez brièvement l'intervention..."
          className="rounded-xl min-h-[88px] border-slate-200 focus:ring-2 focus:ring-emerald-500/20 resize-none"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {!embedded && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex min-w-[180px] items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-4 shadow-sm shadow-slate-100 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-800">{filteredDetails.length}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Intervention{filteredDetails.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {details.length > 0 && (
              <div className="flex min-w-[180px] items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-4 shadow-sm shadow-slate-100 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
                  <Coins className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-slate-800">
                    {formatPrixFCFA(details.reduce((sum, d) => sum + (Number(d.prix_unitaire) || 0), 0))}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total catalogue</p>
                </div>
              </div>
            )}
          </div>
        )}

        {embedded && details.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-2.5">
            <Coins className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold tabular-nums text-amber-900">
              Catalogue : {formatPrixFCFA(details.reduce((sum, d) => sum + (Number(d.prix_unitaire) || 0), 0))}
            </span>
          </div>
        )}

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher nom, description, catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[260px] rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={handleOpenAdd}
            size="default"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 rounded-xl px-6 font-medium shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau détail
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/30 overflow-hidden ring-1 ring-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-emerald-500/5 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700">Chargement des détails...</p>
              <p className="text-sm text-slate-500 mt-1">Récupération des interventions</p>
            </div>
          </div>
        ) : filteredDetails.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
              <FileText className="h-12 w-12 text-emerald-500/80" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchQuery || categoryFilter !== "all"
                ? "Aucun résultat"
                : "Aucun détail enregistré"}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              {searchQuery
                ? "Aucun détail ne correspond à votre recherche. Essayez d'autres mots-clés ou réinitialisez les filtres."
                : categoryFilter !== "all"
                  ? "Aucun détail pour cette catégorie. Ajoutez-en ou consultez les autres catégories."
                  : "Créez des détails de diagnostic pour organiser vos interventions et tarifer vos prestations."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {(searchQuery || categoryFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                  }}
                  className="rounded-xl"
                >
                  Réinitialiser les filtres
                </Button>
              )}
              <Button
                onClick={handleOpenAdd}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl px-6 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un détail
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 py-4 pl-6">Intervention</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Catégorie</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden lg:table-cell">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right">Prix</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right w-24 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetails.map((d, i) => (
                  <TableRow
                    key={d.id}
                    className={`border-b border-slate-100/80 transition-all duration-200 hover:bg-emerald-50/40 group ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                    }`}
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-900">{d.nom}</span>
                        {d.description && (
                          <span className="text-xs text-slate-500 truncate max-w-[200px] lg:hidden">
                            {d.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {d.catergorieDiagnostic ? (
                        <Badge
                          variant="outline"
                          className={`border ${categoryColorMap[d.catergorieDiagnosticId] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
                        >
                          {d.catergorieDiagnostic.nom}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 py-4 max-w-[240px] truncate hidden lg:table-cell">
                      {d.description || <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 text-sm font-semibold text-emerald-800 tabular-nums border border-emerald-100/80">
                        <Coins className="h-3.5 w-3.5 text-emerald-600" />
                        {formatPrixFCFA(d.prix_unitaire)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-500 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg"
                          onClick={() => handleOpenEdit(d)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg"
                          onClick={() => handleOpenDelete(d)}
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
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl shadow-slate-300/40 rounded-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800">Nouveau détail</DialogTitle>
                <DialogDescription className="text-slate-500 mt-0.5">Ajoutez une intervention et son tarif à votre catalogue</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-6">{renderForm("add")}</div>
          <DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 gap-3">
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl px-6 shadow-md shadow-emerald-500/20">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl shadow-slate-300/40 rounded-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
                <Edit className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800">Modifier le détail</DialogTitle>
                <DialogDescription className="text-slate-500 mt-0.5">Mettez à jour les informations de l&apos;intervention</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-6">{renderForm("edit")}</div>
          <DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 gap-3">
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl px-6 shadow-md shadow-emerald-500/20">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl shadow-slate-300/40 rounded-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800">Supprimer le détail</DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  {detailToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong className="text-slate-700">{detailToDelete.nom}</strong> ? Cette action est irréversible.
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-xl px-6 bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
