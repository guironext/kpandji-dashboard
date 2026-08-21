"use client";

import React, { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface CatergorieDiagnostic {
  id: string;
  nom: string;
  description?: string | null;
  createdAt: string;
}

const emptyForm = { nom: "", description: "" };

async function fetchCategories() {
  const res = await fetch("/api/sav/categorie-diagnostic");
  return res.json();
}

async function createCategorieDiagnostic(data: { nom: string; description?: string }) {
  const res = await fetch("/api/sav/categorie-diagnostic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function updateCategorieDiagnostic(id: string, data: { nom?: string; description?: string }) {
  const res = await fetch(`/api/sav/categorie-diagnostic/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function deleteCategorieDiagnostic(id: string) {
  const res = await fetch(`/api/sav/categorie-diagnostic/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

export default function CategorieDiagnostiqueTab({ embedded = false }: { embedded?: boolean }) {
  const [categories, setCategories] = useState<CatergorieDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categorieToDelete, setCategorieToDelete] = useState<CatergorieDiagnostic | null>(null);
  const [editingCategorie, setEditingCategorie] = useState<CatergorieDiagnostic | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await fetchCategories();
      if (result.success && result.data) setCategories(result.data);
      else toast.error(result.error || "Erreur lors du chargement");
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (c: CatergorieDiagnostic) => {
    setEditingCategorie(c);
    setFormData({
      nom: c.nom,
      description: c.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (c: CatergorieDiagnostic) => {
    setCategorieToDelete(c);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createCategorieDiagnostic({
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
      });
      if (result.success) {
        toast.success("Catégorie ajoutée avec succès");
        setAddDialogOpen(false);
        loadCategories();
      } else toast.error(result.error || "Erreur lors de l'ajout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingCategorie || !formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateCategorieDiagnostic(editingCategorie.id, {
        nom: formData.nom.trim(),
        description: formData.description.trim() || undefined,
      });
      if (result.success) {
        toast.success("Catégorie modifiée avec succès");
        setEditDialogOpen(false);
        setEditingCategorie(null);
        loadCategories();
      } else toast.error(result.error || "Erreur lors de la modification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categorieToDelete) return;
    try {
      const result = await deleteCategorieDiagnostic(categorieToDelete.id);
      if (result.success) {
        toast.success("Catégorie supprimée avec succès");
        setDeleteDialogOpen(false);
        setCategorieToDelete(null);
        loadCategories();
      } else toast.error(result.error || "Erreur lors de la suppression");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const renderForm = (prefix: string) => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-nom`}>Nom *</Label>
        <Input
          id={`${prefix}-nom`}
          value={formData.nom}
          onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
          placeholder="Ex: Moteur, Freinage..."
          className="rounded-lg"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-description`}>Description</Label>
        <Textarea
          id={`${prefix}-description`}
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description optionnelle de la catégorie"
          className="rounded-lg min-h-[80px]"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className={embedded ? "mb-3 flex justify-end sm:mb-5" : "mb-6 flex items-center justify-between"}>
        {!embedded && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2">
              <span className="text-2xl font-bold text-emerald-700">{categories.length}</span>
              <span className="ml-1 text-sm text-emerald-600">catégorie(s)</span>
            </div>
          </div>
        )}
        <Button
          onClick={handleOpenAdd}
          size="default"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 shadow-md shadow-sky-500/20 hover:from-sky-700 hover:to-blue-700 sm:h-10 sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Nouvelle catégorie</span>
          <span className="hidden sm:inline">Ajouter une catégorie</span>
        </Button>
      </div>

      <div
        className={
          embedded
            ? "overflow-hidden rounded-xl border border-slate-100"
            : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50"
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 sm:py-24">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-slate-500">Chargement des catégories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6 sm:py-24">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
              <FolderOpen className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Aucune catégorie enregistrée</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Ajoutez une catégorie de diagnostic pour organiser vos interventions
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Nouvelle Catégorie
            </Button>
          </div>
        ) : (
          <>
          <div className="space-y-2.5 p-2 md:hidden">
            {categories.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{c.nom}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {c.description || "Aucune description"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => handleOpenEdit(c)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleOpenDelete(c)}
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
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b-2 border-slate-200 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 py-4">Nom</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c, i) => (
                  <TableRow
                    key={c.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-emerald-50/30 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <TableCell className="font-medium text-slate-900 py-3">{c.nom}</TableCell>
                    <TableCell className="text-slate-600 py-3 max-w-xs truncate">{c.description || "—"}</TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-emerald-600 hover:bg-emerald-100/80 rounded-lg"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-red-600 hover:bg-red-100/80 rounded-lg"
                          onClick={() => handleOpenDelete(c)}
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nouvelle catégorie</DialogTitle>
                <DialogDescription>Créer une catégorie de diagnostic pour les interventions SAV</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("add")}</div>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6">
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
        <DialogContent className="max-w-lg border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100">
                <Edit className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Modifier la catégorie</DialogTitle>
                <DialogDescription>Mettez à jour les informations de la catégorie</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("edit")}</div>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6">
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
        <DialogContent className="max-w-md border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Supprimer la catégorie</DialogTitle>
                <DialogDescription>
                  {categorieToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong>{categorieToDelete.nom}</strong> ? Cette action est irréversible.
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-lg px-6 bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
