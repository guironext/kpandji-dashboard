"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Gift, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type StatutGarantie =
  | "EN_ATTENTE"
  | "EN_TRAITEMENT"
  | "TESTE"
  | "TERMINE"
  | "ANNULE"
  | "EN_MAINTENANCE";

const STATUTS: { value: StatutGarantie; label: string }[] = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_TRAITEMENT", label: "En traitement" },
  { value: "TESTE", label: "Testé" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
  { value: "EN_MAINTENANCE", label: "En maintenance" },
];

const STATUT_BADGE: Record<StatutGarantie, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700 border-slate-200",
  EN_TRAITEMENT: "bg-amber-100 text-amber-800 border-amber-200",
  TESTE: "bg-sky-100 text-sky-800 border-sky-200",
  TERMINE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ANNULE: "bg-red-100 text-red-700 border-red-200",
  EN_MAINTENANCE: "bg-violet-100 text-violet-800 border-violet-200",
};

interface CategorieDiagnostic {
  id: string;
  nom: string;
}

interface DetailDiagnostic {
  id: string;
  nom: string;
  prix_unitaire?: number | string | null;
  catergorieDiagnostic?: CategorieDiagnostic | null;
}

interface GarantieSAV {
  id: string;
  categorie_garantie: string;
  nom_garantie?: string | null;
  quantite_garantie_offert?: number | null;
  prix_unitaire?: number | string | null;
  statut: StatutGarantie;
  createdAt: string;
}

const emptyForm = {
  categorie_garantie: "",
  nom_garantie: "",
  quantite_garantie_offert: "",
  prix_unitaire: "",
};

function parsePrixInput(str: string): number | "" {
  const cleaned = str.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return "";
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? "" : n;
}

function formatPrixForInput(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = typeof value === "string" ? parseFloat(String(value).replace(/\s/g, "")) : Number(value);
  if (Number.isNaN(n) || n === 0) return "";
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function statutLabel(statut: StatutGarantie): string {
  return STATUTS.find((s) => s.value === statut)?.label ?? statut;
}

async function fetchGaranties() {
  const res = await fetch("/api/sav/garantie-sav");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch("/api/sav/categorie-diagnostic");
  return res.json();
}

async function fetchDetails() {
  const res = await fetch("/api/sav/detail-diagnostic?catalog=1");
  return res.json();
}

async function createGarantie(data: Record<string, unknown>) {
  const res = await fetch("/api/sav/garantie-sav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function updateGarantie(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/sav/garantie-sav/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function deleteGarantie(id: string) {
  const res = await fetch(`/api/sav/garantie-sav/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

export default function DiagnostiqueOffertTab({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<GarantieSAV[]>([]);
  const [categories, setCategories] = useState<CategorieDiagnostic[]>([]);
  const [details, setDetails] = useState<DetailDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GarantieSAV | null>(null);
  const [editingItem, setEditingItem] = useState<GarantieSAV | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [garantieRes, categorieRes, detailRes] = await Promise.all([
        fetchGaranties(),
        fetchCategories(),
        fetchDetails(),
      ]);
      if (garantieRes.success && garantieRes.data) setItems(garantieRes.data);
      else toast.error(garantieRes.error || "Erreur lors du chargement");
      if (categorieRes.success && categorieRes.data) setCategories(categorieRes.data);
      if (detailRes.success && detailRes.data) setDetails(detailRes.data);
    } catch (error) {
      console.error("Error fetching garanties:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const payload = () => {
    const prix = parsePrixInput(formData.prix_unitaire);
    const quantite = formData.quantite_garantie_offert.trim();
    return {
      categorie_garantie: formData.categorie_garantie.trim(),
      nom_garantie: formData.nom_garantie.trim(),
      quantite_garantie_offert: quantite === "" ? null : Number(quantite),
      prix_unitaire: prix === "" ? null : prix,
    };
  };

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: GarantieSAV) => {
    setEditingItem(item);
    setFormData({
      categorie_garantie: item.categorie_garantie,
      nom_garantie: item.nom_garantie || "",
      quantite_garantie_offert:
        item.quantite_garantie_offert != null ? String(item.quantite_garantie_offert) : "",
      prix_unitaire: formatPrixForInput(item.prix_unitaire),
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (item: GarantieSAV) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.categorie_garantie.trim()) {
      toast.error("La catégorie de garantie est requise");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createGarantie(payload());
      if (result.success) {
        toast.success("Garantie ajoutée avec succès");
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
    if (!editingItem || !formData.categorie_garantie.trim()) {
      toast.error("La catégorie de garantie est requise");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateGarantie(editingItem.id, payload());
      if (result.success) {
        toast.success("Garantie modifiée avec succès");
        setEditDialogOpen(false);
        setEditingItem(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la modification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const result = await deleteGarantie(itemToDelete.id);
      if (result.success) {
        toast.success("Garantie supprimée");
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la suppression");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const categoryNames = Array.from(
    new Set([
      ...categories.map((c) => c.nom),
      ...(formData.categorie_garantie ? [formData.categorie_garantie] : []),
    ]),
  );

  const detailsForCategory = formData.categorie_garantie
    ? details.filter((d) => d.catergorieDiagnostic?.nom === formData.categorie_garantie)
    : [];

  const nomOptions = Array.from(
    new Map(
      [
        ...detailsForCategory,
        ...(formData.nom_garantie &&
        !detailsForCategory.some((d) => d.nom === formData.nom_garantie)
          ? [{ id: `current-${formData.nom_garantie}`, nom: formData.nom_garantie }]
          : []),
      ].map((d) => [d.nom, d]),
    ).values(),
  );

  const handleSelectDetail = (nom: string) => {
    const detail = detailsForCategory.find((d) => d.nom === nom);
    setFormData((p) => ({
      ...p,
      nom_garantie: nom,
      ...(detail?.prix_unitaire != null
        ? { prix_unitaire: formatPrixForInput(detail.prix_unitaire) }
        : {}),
    }));
  };

  const renderForm = (prefix: string) => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-categorie`}>Catégorie de garantie *</Label>
        {categoryNames.length > 0 ? (
          <Select
            value={formData.categorie_garantie || undefined}
            onValueChange={(v) =>
              setFormData((p) => ({ ...p, categorie_garantie: v, nom_garantie: "" }))
            }
          >
            <SelectTrigger id={`${prefix}-categorie`} className="rounded-lg">
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categoryNames.map((nom) => (
                <SelectItem key={nom} value={nom}>
                  {nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={`${prefix}-categorie`}
            value={formData.categorie_garantie}
            onChange={(e) =>
              setFormData((p) => ({ ...p, categorie_garantie: e.target.value, nom_garantie: "" }))
            }
            placeholder="Ex: Moteur, Freinage…"
            className="rounded-lg"
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-nom`}>Nom de la garantie</Label>
        <Select
          value={formData.nom_garantie || undefined}
          onValueChange={handleSelectDetail}
          disabled={!formData.categorie_garantie}
        >
          <SelectTrigger id={`${prefix}-nom`} className="rounded-lg">
            <SelectValue
              placeholder={
                formData.categorie_garantie
                  ? nomOptions.length > 0
                    ? "Choisir un détail diagnostic"
                    : "Aucun détail pour cette catégorie"
                  : "Choisir d'abord une catégorie"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {nomOptions.map((d) => (
              <SelectItem key={d.id} value={d.nom}>
                {d.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-quantite`}>Quantité offerte</Label>
          <Input
            id={`${prefix}-quantite`}
            type="number"
            min={0}
            value={formData.quantite_garantie_offert}
            onChange={(e) =>
              setFormData((p) => ({ ...p, quantite_garantie_offert: e.target.value }))
            }
            placeholder="0"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-prix`}>Prix unitaire (FCFA)</Label>
          <Input
            id={`${prefix}-prix`}
            value={formData.prix_unitaire}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d\s]/g, "");
              setFormData((p) => ({
                ...p,
                prix_unitaire: raw ? raw.replace(/\s/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "",
              }));
            }}
            placeholder="0"
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2">
            <span className="text-2xl font-bold text-amber-700">{items.length}</span>
            <span className="ml-1 text-sm text-amber-600">garantie(s)</span>
          </div>
        </div>
        <Button
          onClick={handleOpenAdd}
          size="default"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 shadow-md shadow-amber-500/20 hover:from-amber-700 hover:to-orange-700 sm:h-10 sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter Nouvelle garantie
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
            <p className="text-slate-500">Chargement des garanties...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
              <Gift className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Aucune garantie enregistrée</h3>
            <p className="mx-auto mb-6 max-w-sm text-slate-500">
              Ajoutez une garantie offerte (catégorie, nom, quantité et tarif)
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter Nouvelle garantie
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 p-2 md:hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {item.nom_garantie || item.categorie_garantie}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.categorie_garantie}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={STATUT_BADGE[item.statut] ?? "bg-slate-100 text-slate-700"}
                        >
                          {statutLabel(item.statut)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleOpenDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/80 hover:bg-slate-50">
                    <TableHead className="py-4 font-semibold text-slate-700">Catégorie</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-700">Nom</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-700">Quantité</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="w-28 py-4 text-right font-semibold text-slate-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow
                      key={item.id}
                      className={`border-b border-slate-100 transition-colors hover:bg-amber-50/30 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <TableCell className="py-3 font-medium text-slate-900">
                        {item.categorie_garantie}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600">
                        {item.nom_garantie || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-slate-600">
                        {item.quantite_garantie_offert ?? "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={STATUT_BADGE[item.statut] ?? "bg-slate-100 text-slate-700"}
                        >
                          {statutLabel(item.statut)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-600 hover:bg-amber-100/80 hover:text-amber-600"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-100/80 hover:text-red-600"
                            onClick={() => handleOpenDelete(item)}
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
          </>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl shadow-slate-300/50">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5">
                <Plus className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nouvelle garantie</DialogTitle>
                <DialogDescription>
                  Renseigner la catégorie, le nom, la quantité et le tarif de la garantie offerte
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("add")}</div>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={isSubmitting}
              className="rounded-lg bg-amber-600 px-6 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl shadow-slate-300/50">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-2.5">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Modifier la garantie</DialogTitle>
                <DialogDescription>Mettez à jour les informations de la garantie SAV</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("edit")}</div>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmitting}
              className="rounded-lg bg-amber-600 px-6 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl shadow-slate-300/50">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2.5">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Supprimer la garantie</DialogTitle>
                <DialogDescription>
                  {itemToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong>
                        {itemToDelete.nom_garantie || itemToDelete.categorie_garantie}
                      </strong>{" "}
                      ? Cette action est irréversible.
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-lg bg-red-600 px-6 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
