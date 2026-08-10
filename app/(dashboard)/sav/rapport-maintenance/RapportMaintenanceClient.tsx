"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Car,
  User,
  FileText,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Sparkles,
  Printer,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildAutoReportPlainText,
  buildAutoReportSections,
  type RapportMaintenanceVoiture,
} from "@/lib/sav/rapportMaintenanceSummary";

type RapportRow = {
  id: string;
  titre: string;
  contenu: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
};

type VoitureRow = RapportMaintenanceVoiture & {
  RapportMaintenanceSAV: RapportRow[];
};

type FormState = {
  titre: string;
  contenu: string;
  observations: string;
};

const emptyForm: FormState = { titre: "", contenu: "", observations: "" };

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function AutoReportView({ voiture }: { voiture: VoitureRow }) {
  const sections = useMemo(
    () => buildAutoReportSections(voiture),
    [voiture],
  );

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">
            {section.title}
          </h4>
          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {section.lines.map((line, i) => (
              <li key={`${section.title}-${i}`} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function RapportMaintenanceClient() {
  const [voitures, setVoitures] = useState<VoitureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRapport, setEditingRapport] = useState<RapportRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RapportRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sav/rapport-maintenance");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Chargement impossible");
      }
      const list: VoitureRow[] = json.data ?? [];
      setVoitures(list);
      setSelectedId((prev) => {
        if (prev && list.some((v) => v.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => voitures.find((v) => v.id === selectedId) ?? null,
    [voitures, selectedId],
  );

  const nbRapportsComplementaires = useMemo(
    () =>
      voitures.reduce(
        (acc, v) => acc + (v.RapportMaintenanceSAV?.length ?? 0),
        0,
      ),
    [voitures],
  );

  const openCreate = () => {
    setEditingRapport(null);
    setForm({
      ...emptyForm,
      titre: `Rapport complémentaire — ${selected?.immatriculation ?? ""}`,
    });
    setDialogOpen(true);
  };

  const openEdit = (rapport: RapportRow) => {
    setEditingRapport(rapport);
    setForm({
      titre: rapport.titre,
      contenu: rapport.contenu ?? "",
      observations: rapport.observations ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    const titre = form.titre.trim();
    if (!titre) {
      toast.error("Le titre est requis");
      return;
    }
    setSaving(true);
    try {
      if (editingRapport) {
        const res = await fetch(
          `/api/sav/rapport-maintenance/${editingRapport.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titre,
              contenu: form.contenu,
              observations: form.observations,
            }),
          },
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Mise à jour impossible");
        }
        toast.success("Rapport mis à jour");
      } else {
        const res = await fetch("/api/sav/rapport-maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voitureSAVId: selected.id,
            titre,
            contenu: form.contenu,
            observations: form.observations,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Création impossible");
        }
        toast.success("Rapport ajouté");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/sav/rapport-maintenance/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression impossible");
      }
      toast.success("Rapport supprimé");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintAuto = () => {
    if (!selected) return;
    const text = buildAutoReportPlainText(selected);
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }
    w.document.write(`
      <!DOCTYPE html><html><head><title>Rapport maintenance</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
        pre { white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
      </style></head><body>
      <pre>${text.replace(/</g, "&lt;")}</pre>
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>`);
    w.document.close();
  };

  const handlePrintRapport = (rapport: RapportRow) => {
    if (!selected) return;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }
    const client = selected.ClientSAV;
    w.document.write(`
      <!DOCTYPE html><html><head><title>${rapport.titre}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .meta { color: #555; font-size: 0.875rem; margin-bottom: 1.5rem; }
        section { margin-bottom: 1.25rem; }
        h2 { font-size: 0.875rem; text-transform: uppercase; color: #059669; margin-bottom: 0.5rem; }
        p { white-space: pre-wrap; line-height: 1.6; font-size: 14px; }
      </style></head><body>
      <h1>${rapport.titre.replace(/</g, "&lt;")}</h1>
      <div class="meta">
        Véhicule : ${selected.model} (${selected.immatriculation})<br/>
        Client : ${client.prenom} ${client.nom}<br/>
        Date : ${formatDate(rapport.createdAt)}
      </div>
      ${rapport.contenu ? `<section><h2>Contenu</h2><p>${rapport.contenu.replace(/</g, "&lt;")}</p></section>` : ""}
      ${rapport.observations ? `<section><h2>Observations</h2><p>${rapport.observations.replace(/</g, "&lt;")}</p></section>` : ""}
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>`);
    w.document.close();
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card px-6 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Chargement des véhicules terminés…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-800 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.45)] ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-90"
          aria-hidden
        />
        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-50/95 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                Service après-vente
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Rapport Maintenance
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-indigo-50/85 sm:text-lg">
                  Synthèse automatique pour chaque véhicule terminé, avec
                  possibilité d&apos;ajouter des rapports complémentaires.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3 sm:justify-end">
              <div className="flex min-w-[140px] flex-col rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-100/80">
                  Véhicules terminés
                </span>
                <span className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                  {voitures.length}
                </span>
              </div>
              <div className="flex min-w-[140px] flex-col rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-100/80">
                  Rapports ajoutés
                </span>
                <span className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                  {nbRapportsComplementaires}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {voitures.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Car className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">Aucun véhicule terminé</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les rapports apparaîtront lorsque des véhicules SAV auront le
                statut « Terminé ».
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vehicle selector */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 flex-1 max-w-lg">
              <Label htmlFor="voiture-select">Véhicule</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="voiture-select" className="h-11">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {voitures.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.immatriculation} — {v.model} ({v.ClientSAV.prenom}{" "}
                      {v.ClientSAV.nom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>

          {selected && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* Auto report */}
              <Card className="overflow-hidden border-primary/15 shadow-sm">
                <CardHeader className="border-b bg-primary/[0.04] pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          Rapport synthèse automatique
                        </CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Généré à partir des diagnostics, réparations et
                        maintenances enregistrés.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={handlePrintAuto}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Car className="h-3 w-3" />
                      {selected.immatriculation}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <User className="h-3 w-3" />
                      {selected.ClientSAV.prenom} {selected.ClientSAV.nom}
                    </Badge>
                    <Badge variant="outline">
                      Terminé le {formatDate(selected.updatedAt)}
                    </Badge>
                  </div>
                  <AutoReportView voiture={selected} />
                </CardContent>
              </Card>

              {/* Additional reports */}
              <Card className="shadow-sm">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          Rapports complémentaires
                        </CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ajoutez des notes ou rapports supplémentaires pour ce
                        véhicule.
                      </p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {selected.RapportMaintenanceSAV.length === 0 ? (
                    <div className="rounded-xl border border-dashed px-6 py-10 text-center">
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium">
                        Aucun rapport complémentaire
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cliquez sur « Ajouter » pour créer un rapport
                        supplémentaire.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {selected.RapportMaintenanceSAV.map((rapport) => (
                        <li
                          key={rapport.id}
                          className={cn(
                            "rounded-xl border bg-card p-4 transition-colors",
                            "hover:border-primary/30 hover:bg-muted/30",
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="font-semibold leading-snug">
                                {rapport.titre}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(rapport.createdAt)}
                              </p>
                              {rapport.contenu && (
                                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                                  {rapport.contenu}
                                </p>
                              )}
                              {rapport.observations && (
                                <p className="mt-1 text-xs italic text-muted-foreground">
                                  Obs. : {rapport.observations}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePrintRapport(rapport)}
                                title="Imprimer"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(rapport)}
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(rapport)}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRapport ? "Modifier le rapport" : "Nouveau rapport"}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.model} — ${selected.immatriculation}`
                : "Rapport complémentaire"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rapport-titre">Titre *</Label>
              <Input
                id="rapport-titre"
                value={form.titre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titre: e.target.value }))
                }
                placeholder="Titre du rapport"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rapport-contenu">Contenu</Label>
              <Textarea
                id="rapport-contenu"
                value={form.contenu}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contenu: e.target.value }))
                }
                placeholder="Description des travaux, constats, recommandations…"
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rapport-obs">Observations</Label>
              <Textarea
                id="rapport-obs"
                value={form.observations}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observations: e.target.value }))
                }
                placeholder="Remarques additionnelles (optionnel)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRapport ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce rapport ?</DialogTitle>
            <DialogDescription>
              « {deleteTarget?.titre} » sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
