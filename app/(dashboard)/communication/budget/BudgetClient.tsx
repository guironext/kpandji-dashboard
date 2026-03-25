"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  TableFooter,
} from "@/components/ui/table";
import {
  getBudgetItemsByProjectId,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  type CommunicationBudgetItem,
} from "@/lib/actions/communication-budget";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import { toast } from "sonner";
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Fonction pour formater les nombres avec séparateurs de milliers (sans décimales)
function formatNumber(num: number): string {
  return Math.round(num).toLocaleString("fr-FR");
}

type Props = {
  projects: CommunicationProjectListItem[];
  initialItems: CommunicationBudgetItem[];
  selectedProjectId: string | null;
  error?: string | null;
  embedded?: boolean;
};

export default function BudgetClient({
  projects,
  initialItems,
  selectedProjectId: initialProjectId,
  error,
  embedded,
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId ?? (projects[0]?.id ?? null)
  );
  const [items, setItems] = useState<CommunicationBudgetItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    designation: "",
    prixUnitaire: "",
    quantite: "",
  });

  useEffect(() => {
    if (!selectedProjectId) {
      setItems([]);
      return;
    }
    setLoading(true);
    getBudgetItemsByProjectId(selectedProjectId)
      .then((res) => {
        setItems(res.success ? res.items : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading budget items:", error);
        toast.error("Erreur lors du chargement des éléments de budget. Veuillez réessayer.");
        setItems([]);
        setLoading(false);
      });
  }, [selectedProjectId]);

  const resetForm = () => {
    setForm({ designation: "", prixUnitaire: "", quantite: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    setForm({ designation: "", prixUnitaire: "", quantite: "" });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (item: CommunicationBudgetItem) => {
    setForm({
      designation: item.designation,
      prixUnitaire: item.prixUnitaire.toString(),
      quantite: item.quantite.toString(),
    });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const handleSaveNew = async () => {
    if (!selectedProjectId || !form.designation.trim()) {
      toast.error("Veuillez sélectionner un projet et saisir une désignation.");
      return;
    }
    const prixUnitaire = parseFloat(form.prixUnitaire);
    const quantite = parseFloat(form.quantite);
    if (isNaN(prixUnitaire) || prixUnitaire <= 0) {
      toast.error("Veuillez saisir un prix unitaire valide.");
      return;
    }
    if (isNaN(quantite) || quantite <= 0) {
      toast.error("Veuillez saisir une quantité valide.");
      return;
    }
    try {
      const res = await createBudgetItem({
        projectId: selectedProjectId,
        designation: form.designation.trim(),
        prixUnitaire,
        quantite,
      });
      if (res.success) {
        setItems((prev) => [res.item, ...prev]);
        resetForm();
        toast.success("Élément de budget ajouté.");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      console.error("Error creating budget item:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur: ${error.message}`
          : "Erreur lors de l'ajout de l'élément de budget. Veuillez réessayer.";
      toast.error(errorMessage);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !form.designation.trim()) return;
    const prixUnitaire = parseFloat(form.prixUnitaire);
    const quantite = parseFloat(form.quantite);
    if (isNaN(prixUnitaire) || prixUnitaire <= 0) {
      toast.error("Veuillez saisir un prix unitaire valide.");
      return;
    }
    if (isNaN(quantite) || quantite <= 0) {
      toast.error("Veuillez saisir une quantité valide.");
      return;
    }
    try {
      const res = await updateBudgetItem(editingId, {
        designation: form.designation.trim(),
        prixUnitaire,
        quantite,
      });
      if (res.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? res.item : item))
        );
        resetForm();
        toast.success("Élément de budget mis à jour.");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      console.error("Error updating budget item:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur: ${error.message}`
          : "Erreur lors de la mise à jour de l'élément de budget. Veuillez réessayer.";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteBudgetItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        if (editingId === id) resetForm();
        toast.success("Élément de budget supprimé.");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      console.error("Error deleting budget item:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur: ${error.message}`
          : "Erreur lors de la suppression de l'élément de budget. Veuillez réessayer.";
      toast.error(errorMessage);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const total = items.reduce((sum, item) => sum + item.montant, 0);

  return (
    <div className={cn("space-y-8", embedded ? "p-4 sm:p-6" : "p-6")}>
      {!embedded && (
      <div className="relative overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(1200px 500px at 0% 0%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(900px 450px at 100% 0%, rgba(34,211,238,0.14), transparent 55%), radial-gradient(1000px 500px at 50% 120%, rgba(251,191,36,0.14), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-sm text-slate-700">
                <DollarSign className="size-4 text-violet-600" />
                Gestion budgétaire
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                  <Calculator className="size-5" />
                </span>
                Budget
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Sélectionnez un projet actif et gérez les éléments de budget en définissant la{" "}
                <span className="font-medium text-slate-700">désignation</span>, le{" "}
                <span className="font-medium text-slate-700">prix unitaire</span> et la{" "}
                <span className="font-medium text-slate-700">quantité</span>. Le montant est calculé automatiquement.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {error && (
        <Card className="border-2 border-red-300 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="p-6 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mb-4 shadow-lg">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">Erreur de connexion à la base de données</h3>
            <p className="text-slate-600 text-center max-w-md mb-4">
              {error}
            </p>
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 max-w-2xl">
              <p className="font-semibold mb-2">Solutions possibles :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Vérifiez que votre fichier <code className="bg-slate-200 px-1 rounded">.env.local</code> contient la variable <code className="bg-slate-200 px-1 rounded">DATABASE_URL</code></li>
                <li>Vérifiez que le serveur de base de données est accessible</li>
                <li>Si vous utilisez Neon, vérifiez que la base de données n&apos;est pas en pause</li>
                <li>Vérifiez votre connexion internet</li>
                <li>Attendez quelques instants et rafraîchissez la page</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && (
        <>
          <Card className="bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="size-5" />
                Projet
              </CardTitle>
              <CardDescription>
                Sélectionnez le projet actif pour lequel vous souhaitez gérer le budget.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-slate-600">
                  <div className="font-medium text-slate-800">Aucun projet actif trouvé.</div>
                  <div className="mt-1 text-sm">
                    Créez d&apos;abord un projet actif dans <span className="font-medium">Communication → Projets</span>,
                    puis revenez ici pour gérer le budget.
                  </div>
                </div>
              ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Select
                value={selectedProjectId ?? ""}
                onValueChange={(v) => setSelectedProjectId(v || null)}
              >
                <SelectTrigger className="w-full lg:max-w-xl">
                  <SelectValue placeholder="Choisir un projet actif..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProjectId && (
                <Button
                  onClick={handleAdd}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  <Plus className="size-4" />
                  Ajouter un élément
                </Button>
              )}
            </div>
          )}
          </CardContent>
        </Card>

        {selectedProjectId && (
          <Card className="bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle>
              Éléments de budget
              {selectedProject && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {selectedProject.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Liste des éléments de budget avec calcul automatique du montant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="size-5 animate-spin" />
                Chargement des éléments de budget...
              </div>
            ) : (
              <>
                {isAdding && (
                  <div className="mb-4 rounded-xl border border-dashed border-violet-300 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <Label>Désignation</Label>
                        <Input
                          value={form.designation}
                          onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                          placeholder="Ex. Création graphique"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Prix unitaire</Label>
                        <Input
                          type="number"
                          step="1 000"
                          min="0"
                          value={form.prixUnitaire}
                          onChange={(e) => setForm((f) => ({ ...f, prixUnitaire: e.target.value }))}
                          placeholder="1 000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={form.quantite}
                          onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          onClick={handleSaveNew}
                          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                        >
                          <Save className="size-4 mr-2" />
                          Ajouter
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {items.length === 0 && !isAdding ? (
                  <div className="rounded-xl border border-dashed bg-gradient-to-br from-violet-50/70 to-cyan-50/70 p-6">
                    <div className="flex flex-col gap-2">
                      <div className="font-medium text-slate-900">Commencez votre budget.</div>
                      <div className="text-sm text-slate-600">
                        Ajoutez le premier élément de budget pour commencer.
                      </div>
                      <Button
                        onClick={handleAdd}
                        className="mt-2 w-fit gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                      >
                        <Plus className="size-4" />
                        Ajouter un élément
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Désignation</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) =>
                        editingId === item.id ? (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Input
                                value={form.designation}
                                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="1 000"
                                min="0"
                                value={form.prixUnitaire}
                                onChange={(e) => setForm((f) => ({ ...f, prixUnitaire: e.target.value }))}
                                className="h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                value={form.quantite}
                                onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))}
                                className="h-8 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatNumber(parseFloat(form.prixUnitaire || "0") * parseFloat(form.quantite || "0"))} FCFA
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                >
                                  <Save className="size-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetForm}
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.designation}</TableCell>
                            <TableCell className="text-right">{formatNumber(item.prixUnitaire)} FCFA</TableCell>
                            <TableCell className="text-right">{item.quantite}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(item.montant)} FCFA</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit2 className="size-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-semibold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          {formatNumber(total)} FCFA
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                )}
              </>
            )}
          </CardContent>
          </Card>
        )}
        </>
      )}
    </div>
  );
}
