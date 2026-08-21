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
import { cn } from "@/lib/utils";
import { Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type GroupeLite = {
  id: string;
  nom: string;
  chefGroupeId: string | null;
  _count: { personnelSAVs: number };
};

type PersonnelRow = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  groupePersonnelSAVId: string;
  groupePersonnelSAV: { id: string; nom: string };
};

type Props = {
  onStatsChange?: () => void;
};

export default function TravailleursSavPanel({ onStatsChange }: Props) {
  const [personnels, setPersonnels] = useState<PersonnelRow[]>([]);
  const [groupes, setGroupes] = useState<GroupeLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<PersonnelRow | null>(
    null,
  );
  const [personnelToDelete, setPersonnelToDelete] =
    useState<PersonnelRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nouveauGroupeNom, setNouveauGroupeNom] = useState("");
  const [creatingGroupe, setCreatingGroupe] = useState(false);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [groupeId, setGroupeId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, gr] = await Promise.all([
        fetch("/api/sav/personnel").then((r) => r.json()),
        fetch("/api/sav/groupe-personnel").then((r) => r.json()),
      ]);
      if (pr.success) setPersonnels(pr.data ?? []);
      if (gr.success) setGroupes(gr.data ?? []);
    } catch {
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    void fetch("/api/sav/groupe-personnel")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setGroupes(json.data ?? []);
      })
      .catch(() => {});
  }, [dialogOpen]);

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setEmail("");
    setTelephone("");
    setSpecialite("");
    setGroupeId("");
    setEditingPersonnel(null);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (personnel: PersonnelRow) => {
    setEditingPersonnel(personnel);
    setNom(personnel.nom);
    setPrenom(personnel.prenom);
    setEmail(personnel.email);
    setTelephone(personnel.telephone);
    setSpecialite(personnel.specialite);
    setGroupeId(personnel.groupePersonnelSAVId);
    setDialogOpen(true);
  };

  const handleCreateGroupeRapide = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nouveauGroupeNom.trim();
    if (!n) {
      toast.error("Indiquez un nom de groupe");
      return;
    }
    setCreatingGroupe(true);
    try {
      const res = await fetch("/api/sav/groupe-personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: n }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Création impossible");
      }
      toast.success("Groupe créé");
      setNouveauGroupeNom("");
      await load();
      onStatsChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreatingGroupe(false);
    }
  };

  const handleSubmitPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupeId) {
      toast.error("Sélectionnez un groupe");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editingPersonnel
          ? `/api/sav/personnel/${editingPersonnel.id}`
          : "/api/sav/personnel",
        {
          method: editingPersonnel ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom,
            prenom,
            email,
            telephone,
            specialite,
            groupePersonnelSAVId: groupeId,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success(
        editingPersonnel
          ? "Travailleur mis à jour"
          : "Travailleur enregistré",
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
    if (!personnelToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sav/personnel/${personnelToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression impossible");
      }
      toast.success("Travailleur supprimé");
      setPersonnelToDelete(null);
      await load();
      onStatsChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const hasGroupes = groupes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Équipe terrain & atelier
          </h2>
          <p className="text-sm text-muted-foreground">
            Ajoutez des membres et affectez-les à un groupe.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenAdd}
          disabled={!hasGroupes}
          className="shrink-0 gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md hover:from-emerald-700 hover:to-teal-800 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un Travailleur
        </Button>
      </div>

      {!hasGroupes && !loading && (
        <div
          className={cn(
            "rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20",
          )}
        >
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Créez d&apos;abord au moins un groupe pour pouvoir enregistrer un
            travailleur.
          </p>
          <form
            onSubmit={handleCreateGroupeRapide}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="nouveau-groupe">Nom du premier groupe</Label>
              <Input
                id="nouveau-groupe"
                value={nouveauGroupeNom}
                onChange={(e) => setNouveauGroupeNom(e.target.value)}
                placeholder="Ex. Atelier mécanique"
                className="max-w-md"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={creatingGroupe}
              className="gap-2 shrink-0"
            >
              {creatingGroupe ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Créer le groupe
            </Button>
          </form>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPersonnel
                ? "Modifier le travailleur"
                : "Nouveau travailleur"}
            </DialogTitle>
            <DialogDescription>
              {editingPersonnel
                ? "Mettez à jour les informations du membre du personnel SAV."
                : "Renseignez les informations du membre du personnel SAV. Tous les champs sont obligatoires."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPersonnel} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input
                id="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec">Spécialité</Label>
              <Input
                id="spec"
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
                required
                placeholder="Ex. Électricité auto"
              />
            </div>
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select value={groupeId} onValueChange={setGroupeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groupes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={saving || !groupeId}
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
        open={Boolean(personnelToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setPersonnelToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le travailleur</DialogTitle>
            <DialogDescription>
              {personnelToDelete ? (
                <>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <strong>
                    {personnelToDelete.prenom} {personnelToDelete.nom}
                  </strong>{" "}
                  ? Cette action est irréversible.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setPersonnelToDelete(null)}
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
            Liste des travailleurs
          </h3>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Chargement…"
              : `${personnels.length} enregistrement${personnels.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin opacity-50" />
          </div>
        ) : personnels.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-muted-foreground">
            Aucun travailleur pour le moment. Utilisez le bouton ci-dessus
            lorsqu&apos;un groupe existe.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead className="hidden sm:table-cell">Groupe</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnels.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.prenom} {p.nom}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        {p.email}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {p.telephone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{p.specialite}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.groupePersonnelSAV.nom}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-600 hover:bg-emerald-100/80 hover:text-emerald-700"
                        aria-label={`Modifier ${p.prenom} ${p.nom}`}
                        title="Modifier"
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-100/80 hover:text-red-600"
                        aria-label={`Supprimer ${p.prenom} ${p.nom}`}
                        title="Supprimer"
                        onClick={() => setPersonnelToDelete(p)}
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
