"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/components/ui/table";
import { Loader2, Pencil, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

const AUCUN_CHEF = "__none__";

type ChefLite = {
  id: string;
  nom: string;
  prenom: string;
};

type GroupeRow = {
  id: string;
  nom: string;
  chefGroupeId: string | null;
  createdAt: string;
  chefGroupe: ChefLite | null;
  _count: { personnelSAVs: number };
};

type PersonnelLite = {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
};

type Props = {
  onStatsChange?: () => void;
};

export default function GroupesSavPanel({ onStatsChange }: Props) {
  const [groupes, setGroupes] = useState<GroupeRow[]>([]);
  const [personnels, setPersonnels] = useState<PersonnelLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroupe, setEditingGroupe] = useState<GroupeRow | null>(null);
  const [groupeToDelete, setGroupeToDelete] = useState<GroupeRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nom, setNom] = useState("");
  const [chefGroupeId, setChefGroupeId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gr, pr] = await Promise.all([
        fetch("/api/sav/groupe-personnel").then((r) => r.json()),
        fetch("/api/sav/personnel").then((r) => r.json()),
      ]);
      if (gr.success) setGroupes(gr.data ?? []);
      if (pr.success) setPersonnels(pr.data ?? []);
    } catch {
      toast.error("Impossible de charger les groupes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    void fetch("/api/sav/personnel")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPersonnels(json.data ?? []);
      })
      .catch(() => {});
  }, [dialogOpen]);

  const resetForm = () => {
    setNom("");
    setChefGroupeId("");
    setEditingGroupe(null);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (groupe: GroupeRow) => {
    setEditingGroupe(groupe);
    setNom(groupe.nom);
    setChefGroupeId(groupe.chefGroupeId ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nom.trim();
    if (!n) {
      toast.error("Le nom du groupe est requis");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nom: n,
        chefGroupeId:
          chefGroupeId && chefGroupeId !== AUCUN_CHEF ? chefGroupeId : null,
      };
      const res = await fetch(
        editingGroupe
          ? `/api/sav/groupe-personnel/${editingGroupe.id}`
          : "/api/sav/groupe-personnel",
        {
          method: editingGroupe ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success(
        editingGroupe ? "Groupe mis à jour" : "Groupe enregistré",
      );
      handleOpenChange(false);
      await load();
      onStatsChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupeToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/sav/groupe-personnel/${groupeToDelete.id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression impossible");
      }
      toast.success("Groupe supprimé");
      setGroupeToDelete(null);
      await load();
      onStatsChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const isEditing = Boolean(editingGroupe);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Groupes d&apos;équipe
          </h2>
          <p className="text-sm text-muted-foreground">
            Organisez les équipes par atelier, spécialité ou créneau.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenAdd}
          className="shrink-0 gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md hover:from-emerald-700 hover:to-teal-800"
        >
          <UsersRound className="h-4 w-4" />
          Ajouter Groupe
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le groupe" : "Nouveau groupe"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Mettez à jour le nom et le chef du groupe. Le chef reste facultatif."
                : "Renseignez le nom du groupe. Le chef d'équipe est facultatif et peut être assigné plus tard."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupe-nom">Nom du groupe</Label>
              <Input
                id="groupe-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                placeholder="Ex. Atelier mécanique"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupe-chef">
                Chef de groupe{" "}
                <span className="font-normal text-muted-foreground">
                  (optionnel)
                </span>
              </Label>
              <Select
                value={chefGroupeId || undefined}
                onValueChange={(value) =>
                  setChefGroupeId(value === AUCUN_CHEF ? "" : value)
                }
              >
                <SelectTrigger id="groupe-chef" className="w-full">
                  <SelectValue placeholder="Aucun — à assigner plus tard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUCUN_CHEF}>Aucun chef</SelectItem>
                  {personnels.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                      {p.specialite ? ` — ${p.specialite}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vous pouvez enregistrer le groupe sans chef, puis l&apos;assigner
                plus tard.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(groupeToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setGroupeToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le groupe</DialogTitle>
            <DialogDescription>
              {groupeToDelete ? (
                <>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <strong>{groupeToDelete.nom}</strong> ? Cette action est
                  irréversible.
                  {groupeToDelete._count.personnelSAVs > 0 ? (
                    <>
                      {" "}
                      Les {groupeToDelete._count.personnelSAVs} membre
                      {groupeToDelete._count.personnelSAVs > 1 ? "s" : ""} de
                      ce groupe seront également supprimés.
                    </>
                  ) : null}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setGroupeToDelete(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              className="gap-2"
              onClick={() => void handleConfirmDelete()}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Liste des groupes
          </h3>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Chargement…"
              : `${groupes.length} groupe${groupes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin opacity-50" />
          </div>
        ) : groupes.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-muted-foreground">
            Aucun groupe pour le moment. Utilisez « Ajouter Groupe » pour
            créer le premier.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nom</TableHead>
                <TableHead>Chef de groupe</TableHead>
                <TableHead className="hidden sm:table-cell">Membres</TableHead>
                <TableHead className="hidden md:table-cell">Créé le</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupes.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.nom}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {g.chefGroupe
                      ? `${g.chefGroupe.prenom} ${g.chefGroupe.nom}`
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums text-muted-foreground">
                    {g._count.personnelSAVs}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatDate(g.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-600 hover:bg-emerald-100/80 hover:text-emerald-700"
                        aria-label={`Modifier ${g.nom}`}
                        title="Modifier"
                        onClick={() => handleOpenEdit(g)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-100/80 hover:text-red-600"
                        aria-label={`Supprimer ${g.nom}`}
                        title="Supprimer"
                        onClick={() => setGroupeToDelete(g)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
