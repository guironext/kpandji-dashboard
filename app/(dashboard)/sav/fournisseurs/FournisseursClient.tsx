"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createFournisseur } from "@/lib/actions/fournisseur";

export type FournisseurRow = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  type_Activite: string | null;
  createdAt: string;
  updatedAt: string;
};

const emptyForm = {
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  ville: "",
  code_postal: "",
  pays: "",
  type_Activite: "",
};

const fieldClass =
  "h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function dash(value: string | null | undefined) {
  const t = value?.trim();
  return t ? t : "—";
}

export default function FournisseursClient({
  initialFournisseurs,
  loadError = null,
}: {
  initialFournisseurs: FournisseurRow[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const [fournisseurs, setFournisseurs] = useState(initialFournisseurs);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setFournisseurs(initialFournisseurs);
  }, [initialFournisseurs]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return fournisseurs;
    return fournisseurs.filter((f) => {
      const hay = [
        f.nom,
        f.email,
        f.telephone,
        f.adresse,
        f.ville,
        f.code_postal,
        f.pays,
        f.type_Activite,
      ]
        .filter(Boolean)
        .join(" ");
      return normalize(hay).includes(q);
    });
  }, [fournisseurs, search]);

  const stats = useMemo(() => {
    return {
      total: fournisseurs.length,
      withEmail: fournisseurs.filter((f) => f.email).length,
      withPhone: fournisseurs.filter((f) => f.telephone).length,
      cities: new Set(fournisseurs.map((f) => f.ville).filter(Boolean)).size,
    };
  }, [fournisseurs]);

  function resetForm() {
    setForm(emptyForm);
  }

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) {
      toast.error("Saisissez le nom du fournisseur.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createFournisseur({
        nom: form.nom.trim(),
        email: form.email,
        telephone: form.telephone,
        adresse: form.adresse,
        ville: form.ville,
        code_postal: form.code_postal,
        pays: form.pays,
        type_Activite: form.type_Activite,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Erreur lors de l'enregistrement.");
        return;
      }

      const created = result.data as FournisseurRow;
      setFournisseurs((prev) => [created, ...prev]);
      toast.success("Fournisseur enregistré.");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-10">
      <div className="relative mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-emerald-200/40",
            "bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950",
            "px-6 py-8 shadow-[0_24px_48px_-12px_rgba(6,78,59,0.35)] md:px-10 md:py-10"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-100/90 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                Approvisionnement atelier
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Fournisseurs
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-slate-300/95 md:text-base">
                Enregistrez vos fournisseurs et consultez leurs coordonnées,
                adresses et types d&apos;activité.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 shrink-0 gap-2 self-stretch border-0 shadow-lg shadow-emerald-900/40",
                "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-teal-400",
                "lg:self-end"
              )}
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
              Nouveau Fournisseur
            </Button>
          </div>

          <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Fournisseurs
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-200">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Avec email
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.withEmail}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-slate-200">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Avec téléphone
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.withPhone}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-100">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Villes
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.cities}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-4 md:px-6">
        {loadError ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chargement impossible</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Liste des fournisseurs
                </CardTitle>
                <CardDescription className="mt-1.5 text-slate-600">
                  Tous les fournisseurs enregistrés, du plus récent au plus
                  ancien.
                </CardDescription>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Rechercher un fournisseur…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 shadow-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Réf.
                    </TableHead>
                    <TableHead className="min-w-[160px] font-semibold text-slate-700">
                      Nom
                    </TableHead>
                    <TableHead className="min-w-[140px] font-semibold text-slate-700">
                      Activité
                    </TableHead>
                    <TableHead className="min-w-[180px] font-semibold text-slate-700">
                      Email
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Téléphone
                    </TableHead>
                    <TableHead className="min-w-[140px] font-semibold text-slate-700">
                      Adresse
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Ville
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Pays
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center font-semibold text-slate-700">
                      Créé le
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 p-0">
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
                            <Building2 className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {fournisseurs.length === 0
                              ? "Aucun fournisseur"
                              : "Aucun résultat"}
                          </h3>
                          <p className="mt-2 max-w-sm text-sm text-slate-500">
                            {fournisseurs.length === 0
                              ? "Créez votre premier fournisseur avec le bouton « Nouveau Fournisseur »."
                              : "Modifiez votre recherche ou effacez le filtre."}
                          </p>
                          {fournisseurs.length > 0 && search.trim() ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-4 rounded-full"
                              onClick={() => setSearch("")}
                            >
                              Effacer la recherche
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((f, idx) => (
                      <TableRow
                        key={f.id}
                        className={cn(
                          "border-slate-100 transition-colors",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                          "hover:bg-emerald-50/50"
                        )}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-full bg-emerald-50 font-mono text-[11px] text-emerald-800"
                          >
                            #{f.id.slice(-7).toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {f.nom}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {f.type_Activite ? (
                            <Badge
                              variant="secondary"
                              className="font-normal"
                            >
                              {f.type_Activite}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-slate-600">
                          {f.email ? (
                            <a
                              href={`mailto:${f.email}`}
                              className="hover:text-emerald-700 hover:underline"
                            >
                              {f.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-700">
                          {f.telephone ? (
                            <a
                              href={`tel:${f.telephone}`}
                              className="hover:text-emerald-700 hover:underline"
                            >
                              {f.telephone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-slate-600">
                          {dash(f.adresse)}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {dash(f.ville)}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {dash(f.pays)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500">
                          {formatDate(f.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[min(94vh,920px)] flex-col gap-0 overflow-hidden rounded-[28px] border-0 p-0 sm:max-w-xl",
            "shadow-[0_24px_80px_-12px_rgba(6,78,59,0.35)]",
            "[&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5",
            "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/10",
            "[&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white",
            "[&_[data-slot=dialog-close]]:hover:bg-white/20 [&_[data-slot=dialog-close]]:hover:text-white"
          )}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 px-6 py-6 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <DialogHeader className="relative space-y-1 text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Building2 className="h-5 w-5 text-emerald-200" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                Nouveau Fournisseur
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-100/80">
                Renseignez les informations du fournisseur. Seul le nom est
                obligatoire.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col bg-slate-50/40"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Building2 className="h-3.5 w-3.5" />
                  Identité
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="fourn-nom" className="text-slate-700">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fourn-nom"
                      value={form.nom}
                      onChange={(e) => updateField("nom", e.target.value)}
                      placeholder="Ex. ABC Supplies"
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="fourn-activite" className="text-slate-700">
                      Type d&apos;activité
                    </Label>
                    <div className="relative">
                      <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="fourn-activite"
                        value={form.type_Activite}
                        onChange={(e) =>
                          updateField("type_Activite", e.target.value)
                        }
                        placeholder="Ex. Pièces auto, fournitures…"
                        className={cn(fieldClass, "pl-10")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Phone className="h-3.5 w-3.5" />
                  Coordonnées
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fourn-email" className="text-slate-700">
                      Email
                    </Label>
                    <Input
                      id="fourn-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="contact@fournisseur.com"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fourn-tel" className="text-slate-700">
                      Téléphone
                    </Label>
                    <Input
                      id="fourn-tel"
                      value={form.telephone}
                      onChange={(e) =>
                        updateField("telephone", e.target.value)
                      }
                      placeholder="+225 XX XX XX XX XX"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Adresse
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="fourn-adresse" className="text-slate-700">
                      Adresse
                    </Label>
                    <Input
                      id="fourn-adresse"
                      value={form.adresse}
                      onChange={(e) => updateField("adresse", e.target.value)}
                      placeholder="123 Rue Example"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fourn-ville" className="text-slate-700">
                      Ville
                    </Label>
                    <Input
                      id="fourn-ville"
                      value={form.ville}
                      onChange={(e) => updateField("ville", e.target.value)}
                      placeholder="Ex. Abidjan"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fourn-cp" className="text-slate-700">
                      Code postal
                    </Label>
                    <Input
                      id="fourn-cp"
                      value={form.code_postal}
                      onChange={(e) =>
                        updateField("code_postal", e.target.value)
                      }
                      placeholder="Ex. 01 BP 1234"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="fourn-pays" className="text-slate-700">
                      Pays
                    </Label>
                    <Input
                      id="fourn-pays"
                      value={form.pays}
                      onChange={(e) => updateField("pays", e.target.value)}
                      placeholder="Ex. Côte d'Ivoire"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer le fournisseur"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
