"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AtSign,
  Briefcase,
  Building2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createPartenaire,
  deletePartenaire,
  updatePartenaire,
} from "@/lib/actions/partenaire";
import { cn } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
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

type TypePartenaire = "FOURNISSEUR" | "CLIENT" | "PARTENAIRE";

export type SerializedPartenaire = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  type_partenaire: TypePartenaire;
  createdAt: string;
  updatedAt: string;
};

const TYPE_LABELS: Record<TypePartenaire, string> = {
  FOURNISSEUR: "Fournisseur",
  CLIENT: "Client",
  PARTENAIRE: "Partenaire",
};

type FormState = {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  type_partenaire: TypePartenaire;
};

const emptyForm = (): FormState => ({
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  ville: "",
  code_postal: "",
  pays: "",
  type_partenaire: "PARTENAIRE",
});

function formFromPartenaire(p: SerializedPartenaire): FormState {
  return {
    nom: p.nom,
    email: p.email ?? "",
    telephone: p.telephone ?? "",
    adresse: p.adresse ?? "",
    ville: p.ville ?? "",
    code_postal: p.code_postal ?? "",
    pays: p.pays ?? "",
    type_partenaire: p.type_partenaire,
  };
}

type Props = {
  initialPartenaires: SerializedPartenaire[];
  loadError?: boolean;
};

export default function RepertoirePartenairesClient({
  initialPartenaires,
  loadError = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<SerializedPartenaire | null>(
    null
  );
  const [savePending, startSaveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const fieldClassName =
    "h-10 rounded-lg border-slate-200/80 bg-white/90 text-slate-900 shadow-sm transition-[color,box-shadow] focus-visible:border-violet-400/70 focus-visible:ring-2 focus-visible:ring-violet-500/25";
  const selectTriggerClassName =
    "h-10 w-full rounded-lg border-slate-200/80 bg-white/90 focus:ring-2 focus:ring-violet-500/25";

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setForm(emptyForm());
      setEditingId(null);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (p: SerializedPartenaire) => {
    setEditingId(p.id);
    setForm(formFromPartenaire(p));
    setOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startDeleteTransition(async () => {
      const res = await deletePartenaire(id);
      if (res.success) {
        toast.success("Partenaire supprimé");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const payload = {
      nom: form.nom.trim(),
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      ville: form.ville.trim() || null,
      code_postal: form.code_postal.trim() || null,
      pays: form.pays.trim() || null,
      type_partenaire: form.type_partenaire,
    };
    startSaveTransition(async () => {
      if (editingId) {
        const res = await updatePartenaire(editingId, payload);
        if (res.success) {
          toast.success("Partenaire mis à jour");
          setOpen(false);
          setForm(emptyForm());
          setEditingId(null);
          router.refresh();
        } else {
          toast.error(res.error ?? "Erreur");
        }
        return;
      }
      const res = await createPartenaire(payload);
      if (res.success) {
        toast.success("Partenaire enregistré");
        setOpen(false);
        setForm(emptyForm());
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="rounded-2xl border border-red-200/80 bg-white/90 p-8 shadow-lg shadow-red-500/5 backdrop-blur-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Répertoire partenaires
          </h1>
          <p className="mt-2 text-sm text-red-600">
            Impossible de charger les partenaires. Vérifiez la connexion ou
            réessayez plus tard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.1),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 -z-10 h-72 w-72 rounded-full bg-violet-100/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-32 -z-10 h-64 w-64 rounded-full bg-indigo-100/35 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/85 px-3 py-1 text-xs font-medium text-violet-900 shadow-sm backdrop-blur-sm">
              <Briefcase className="h-3.5 w-3.5 text-violet-600" />
              Espace assistante · Partenaires
            </div>
            <h1 className="text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
              Répertoire partenaires
            </h1>
            <p className="max-w-xl text-pretty text-base text-slate-600">
              Gestion des partenaires (fournisseurs, clients réseau, partenaires
              divers).
            </p>
          </div>
          <div className="flex shrink-0 justify-end self-start sm:self-end">
            <Button
              type="button"
              onClick={openCreate}
              className="gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Ajouter Partenaire
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3 px-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Annuaire
            </h2>
            <p className="text-xs text-slate-400">
              {initialPartenaires.length} fiche{initialPartenaires.length === 1 ? "" : "s"}
            </p>
          </div>

          {initialPartenaires.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 p-12 shadow-xl shadow-slate-200/40 md:p-16">
              <div className="relative mx-auto max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
                  <Briefcase className="h-9 w-9 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Aucun partenaire
                </h3>
                <p className="mt-3 text-sm text-slate-600">
                  Utilisez « Ajouter Partenaire » pour créer la première fiche.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="max-h-[min(640px,calc(100vh-18rem))] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 border-b border-slate-200/90 bg-slate-50/95 hover:bg-slate-50/95">
                      <TableHead className="font-semibold text-slate-700">
                        Nom
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        E-mail
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Téléphone
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Ville
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Pays
                      </TableHead>
                      <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                        Créé le
                      </TableHead>
                      <TableHead className="w-[1%] min-w-[5.5rem] text-right font-semibold text-slate-700">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialPartenaires.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium text-slate-900">
                          {p.nom}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {TYPE_LABELS[p.type_partenaire]}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {p.email?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {p.telephone?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {p.ville?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {p.pays?.trim() || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-slate-500">
                          {formatCreated(p.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:text-violet-700"
                              onClick={() => openEdit(p)}
                              disabled={savePending || deletePending}
                              aria-label={`Modifier ${p.nom}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:text-red-600"
                              onClick={() => setDeleteTarget(p)}
                              disabled={savePending || deletePending}
                              aria-label={`Supprimer ${p.nom}`}
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
        </section>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/95 p-0 shadow-xl shadow-slate-300/20 sm:max-w-lg">
          <div className="relative shrink-0 border-b border-slate-200/80 bg-gradient-to-r from-violet-50/95 via-white to-indigo-50/90 px-6 pb-5 pt-6 pr-14">
            <div className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30"
                aria-hidden
              >
                <Building2
                  className="h-6 w-6 text-white"
                  strokeWidth={1.5}
                />
              </div>
              <DialogHeader className="flex-1 space-y-1.5 text-left sm:text-left">
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {editingId ? "Modifier le partenaire" : "Nouveau partenaire"}
                </DialogTitle>
                <DialogDescription className="text-pretty text-slate-600">
                  {editingId ? (
                    "Mettez à jour les champs puis enregistrez. Le nom reste obligatoire."
                  ) : (
                    <>
                      Complétez la fiche. Seul le{" "}
                      <span className="font-medium text-slate-800">nom</span>{" "}
                      est obligatoire.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Building2
                    className="h-3.5 w-3.5 shrink-0 text-violet-600"
                    aria-hidden
                  />
                  Identité
                </p>
                <div className="space-y-2">
                  <Label
                    htmlFor="p-nom"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="p-nom"
                    className={fieldClassName}
                    value={form.nom}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nom: e.target.value }))
                    }
                    required
                    autoComplete="organization"
                    placeholder="Raison sociale ou nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="p-type"
                    className="text-sm font-medium text-slate-700"
                  >
                    Type de partenaire
                  </Label>
                  <Select
                    value={form.type_partenaire}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        type_partenaire: v as TypePartenaire,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="p-type"
                      className={selectTriggerClassName}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABELS) as TypePartenaire[]).map(
                        (k) => (
                          <SelectItem key={k} value={k}>
                            {TYPE_LABELS[k]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-slate-200/90" />

              <div className="space-y-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Mail
                    className="h-3.5 w-3.5 shrink-0 text-violet-600"
                    aria-hidden
                  />
                  Contact
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-1">
                    <Label
                      htmlFor="p-email"
                      className="text-sm font-medium text-slate-700"
                    >
                      E-mail
                    </Label>
                    <div className="relative">
                      <AtSign
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                      <Input
                        id="p-email"
                        className={cn(fieldClassName, "pl-9")}
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        autoComplete="email"
                        placeholder="contact@exemple.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label
                      htmlFor="p-tel"
                      className="text-sm font-medium text-slate-700"
                    >
                      Téléphone
                    </Label>
                    <div className="relative">
                      <Phone
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                      <Input
                        id="p-tel"
                        className={cn(fieldClassName, "pl-9")}
                        value={form.telephone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, telephone: e.target.value }))
                        }
                        autoComplete="tel"
                        placeholder="+225 …"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-200/90" />

              <div className="space-y-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-violet-600"
                    aria-hidden
                  />
                  Adresse
                </p>
                <div className="space-y-2">
                  <Label
                    htmlFor="p-adr"
                    className="text-sm font-medium text-slate-700"
                  >
                    Rue, complément
                  </Label>
                  <Input
                    id="p-adr"
                    className={fieldClassName}
                    value={form.adresse}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, adresse: e.target.value }))
                    }
                    autoComplete="street-address"
                    placeholder="Ligne d’adresse"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="p-ville"
                      className="text-sm font-medium text-slate-700"
                    >
                      Ville
                    </Label>
                    <Input
                      id="p-ville"
                      className={fieldClassName}
                      value={form.ville}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ville: e.target.value }))
                      }
                      autoComplete="address-level2"
                      placeholder="Ville"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="p-cp"
                      className="text-sm font-medium text-slate-700"
                    >
                      Code postal
                    </Label>
                    <Input
                      id="p-cp"
                      className={fieldClassName}
                      value={form.code_postal}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, code_postal: e.target.value }))
                      }
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="p-pays"
                    className="text-sm font-medium text-slate-700"
                  >
                    Pays
                  </Label>
                  <Input
                    id="p-pays"
                    className={fieldClassName}
                    value={form.pays}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pays: e.target.value }))
                    }
                    autoComplete="country-name"
                    placeholder="Côte d’Ivoire"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => handleOpenChange(false)}
                disabled={savePending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="min-w-[8.5rem] gap-2 rounded-lg"
                disabled={savePending}
              >
                {savePending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v && !deletePending) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce partenaire&nbsp;?</DialogTitle>
            <DialogDescription className="text-pretty text-slate-600">
              Cette action est définitive
              {deleteTarget ? (
                <>
                  :{" "}
                  <span className="font-medium text-slate-800">
                    {deleteTarget.nom}
                  </span>{" "}
                  sera retiré de l’annuaire.
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
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
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

function formatCreated(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}
