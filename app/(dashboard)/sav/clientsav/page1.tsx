"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Users,
  Phone,
  Mail,
  Building2,
  User,
  Sparkles,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ClientSAV {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  contact: string;
  entreprise?: string | null;
  localisation?: string | null;
  secteur_activite?: string | null;
  createdAt: Date;
}

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  contact: "",
  entreprise: "",
  localisation: "",
  secteur_activite: "",
};

async function fetchClients() {
  const res = await fetch("/api/sav/client-sav");
  return res.json();
}

async function createClientSAV(data: Record<string, string>) {
  let res: Response;
  try {
    res = await fetch("/api/sav/client-sav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    const msg = e instanceof Error && (e.message.toLowerCase().includes("fetch") || e.message.toLowerCase().includes("network"))
      ? "Impossible de joindre le serveur. Vérifiez que l'application est démarrée (npm run dev)."
      : e instanceof Error ? e.message : "Erreur réseau";
    throw new Error(msg);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Erreur ${res.status}`);
  }
  return json;
}

async function updateClientSAV(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/sav/client-sav/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Erreur ${res.status}`);
  }
  return json;
}

async function deleteClientSAV(id: string) {
  const res = await fetch(`/api/sav/client-sav/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Erreur ${res.status}`);
  }
  return json;
}

function ClientFormFields({
  formData,
  setFormData,
  prefix,
}: {
  formData: typeof emptyForm;
  setFormData: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  prefix: string;
}) {
  return (
    <div className="space-y-5">
      {/* Identité */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <User className="h-4 w-4 text-emerald-600" />
          Identité
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-nom`}>Nom *</Label>
            <Input
              id={`${prefix}-nom`}
              value={formData.nom}
              onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Dupont"
              className="h-11 rounded-xl border-slate-200 sm:h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-prenom`}>Prénom *</Label>
            <Input
              id={`${prefix}-prenom`}
              value={formData.prenom}
              onChange={(e) => setFormData((p) => ({ ...p, prenom: e.target.value }))}
              placeholder="Jean"
              className="h-11 rounded-xl border-slate-200 sm:h-10"
              required
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Phone className="h-4 w-4 text-emerald-600" />
          Contact
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-contact`}>Téléphone *</Label>
            <Input
              id={`${prefix}-contact`}
              value={formData.contact}
              onChange={(e) => setFormData((p) => ({ ...p, contact: e.target.value }))}
              placeholder="+33 6 12 34 56 78"
              className="h-11 rounded-xl border-slate-200 sm:h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-email`}>Email</Label>
            <Input
              id={`${prefix}-email`}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="jean.dupont@example.com"
              className="h-11 rounded-xl border-slate-200 sm:h-10"
            />
          </div>
        </div>
      </div>

      {/* Entreprise */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Building2 className="h-4 w-4 text-emerald-600" />
          Entreprise & localisation
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-entreprise`}>Entreprise</Label>
            <Input
              id={`${prefix}-entreprise`}
              value={formData.entreprise}
              onChange={(e) => setFormData((p) => ({ ...p, entreprise: e.target.value }))}
              placeholder="Nom de l&apos;entreprise"
              className="h-11 rounded-xl border-slate-200 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-localisation`}>Localisation</Label>
            <Input
              id={`${prefix}-localisation`}
              value={formData.localisation}
              onChange={(e) => setFormData((p) => ({ ...p, localisation: e.target.value }))}
              placeholder="Paris, France"
              className="h-11 rounded-xl border-slate-200 sm:h-10"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${prefix}-secteur`}>Secteur d&apos;activité</Label>
            <Input
              id={`${prefix}-secteur`}
              value={formData.secteur_activite}
              onChange={(e) => setFormData((p) => ({ ...p, secteur_activite: e.target.value }))}
              placeholder="Automobile, BTP, Transport..."
              className="h-11 rounded-xl border-slate-200 sm:h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
      <div className="h-1 bg-slate-100" />
      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100 sm:h-14 sm:w-14" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-2/3 animate-pulse rounded-md bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
        <div className="mt-4 h-11 animate-pulse rounded-2xl bg-slate-50" />
        <div className="mt-4 h-11 animate-pulse rounded-xl bg-slate-50" />
      </div>
    </div>
  );
}

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: ClientSAV;
  onEdit: (client: ClientSAV) => void;
  onDelete: (client: ClientSAV) => void;
}) {
  const initials =
    `${client.prenom?.[0] || ""}${client.nom?.[0] || ""}`.toUpperCase() || "?";
  const phoneHref = `tel:${client.contact.replace(/\s+/g, "")}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 transition-all duration-200 sm:hover:-translate-y-1 sm:hover:shadow-[0_12px_32px_rgba(13,148,136,0.12)]">
      <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-400" />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold tracking-wide text-white shadow-md shadow-teal-500/25 sm:h-14 sm:w-14 sm:text-base">
            {initials}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-900 sm:text-base">
              {client.prenom} {client.nom}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{client.entreprise || "Particulier"}</span>
            </p>
            {client.secteur_activite && (
              <span className="mt-1.5 inline-flex max-w-full truncate rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-teal-100">
                {client.secteur_activite}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-2">
          <a
            href={phoneHref}
            className="flex min-h-11 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 transition-colors active:bg-teal-50 sm:hover:bg-teal-50 sm:hover:ring-teal-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
              <Phone className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
              {client.contact}
            </span>
          </a>

          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex min-h-11 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 transition-colors active:bg-cyan-50 sm:hover:bg-cyan-50 sm:hover:ring-cyan-100"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                {client.email}
              </span>
            </a>
          )}

          {client.localisation && (
            <p className="flex items-center gap-3 px-3 py-1 text-sm text-slate-500">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 truncate">{client.localisation}</span>
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(client)}
            className="h-11 flex-1 rounded-xl border-slate-200 text-slate-700 touch-manipulation hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 sm:h-10"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-label={`Supprimer ${client.prenom} ${client.nom}`}
            onClick={() => onDelete(client)}
            className="h-11 w-11 shrink-0 rounded-xl border-slate-200 text-slate-500 touch-manipulation hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:h-10 sm:w-10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function ClientSAVPage({ embedded }: { embedded?: boolean }) {
  const [clients, setClients] = useState<ClientSAV[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientSAV | null>(null);
  const [editingClient, setEditingClient] = useState<ClientSAV | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  const loadClients = async () => {
    setLoading(true);
    try {
      const result = await fetchClients();
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        toast.error(result.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [
        client.nom,
        client.prenom,
        client.contact,
        client.email,
        client.entreprise,
        client.localisation,
        client.secteur_activite,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [clients, query]);

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (client: ClientSAV) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email || "",
      contact: client.contact,
      entreprise: client.entreprise || "",
      localisation: client.localisation || "",
      secteur_activite: client.secteur_activite || "",
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (client: ClientSAV) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.contact.trim()) {
      toast.error("Nom, prénom et contact sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createClientSAV(formData);
      if (result.success) {
        toast.success("Client ajouté avec succès");
        setAddDialogOpen(false);
        loadClients();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingClient || !formData.nom.trim() || !formData.prenom.trim() || !formData.contact.trim()) {
      toast.error("Nom, prénom et contact sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateClientSAV(editingClient.id, formData);
      if (result.success) {
        toast.success("Client modifié avec succès");
        setEditDialogOpen(false);
        setEditingClient(null);
        loadClients();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      const result = await deleteClientSAV(clientToDelete.id);
      if (result.success) {
        toast.success("Client supprimé avec succès");
        setDeleteDialogOpen(false);
        setClientToDelete(null);
        loadClients();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen"}>
      {/* Hero Header - only when not embedded */}
      {!embedded && (
        <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pt-8 pb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span className="text-sm font-medium text-emerald-100/90">Gestion clients</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Clients SAV
              </h1>
              <p className="mt-2 text-lg text-emerald-100/80 max-w-xl">
                Gérer les clients du service après-vente : ajout, modification et suivi
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/20">
                <div className="text-2xl font-bold text-white">{clients.length}</div>
                <div className="text-sm text-emerald-100/90">Clients</div>
              </div>
              <Button
                onClick={handleOpenAdd}
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shrink-0 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter Client
              </Button>
            </div>
          </div>
        </div>
      )}

      {embedded && (loading || clients.length > 0) && (
        <div className="mb-3 flex items-center gap-2 sm:mb-5 sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client..."
              aria-label="Rechercher un client"
              disabled={loading}
              className="h-12 rounded-2xl border-slate-200 bg-white pl-10 pr-10 text-base shadow-sm ring-1 ring-slate-200/60 sm:h-11 md:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={handleOpenAdd}
            size="default"
            aria-label="Ajouter un client"
            className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 shadow-md shadow-teal-500/20 touch-manipulation hover:from-teal-700 hover:to-cyan-700 sm:h-11 sm:w-auto sm:px-5"
          >
            <Plus className="h-5 w-5 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Ajouter Client</span>
          </Button>
        </div>
      )}

      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ClientCardSkeleton key={i} />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/80 sm:py-24">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Users className="h-10 w-10 text-teal-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Aucun client enregistré</h3>
            <p className="mx-auto mb-6 max-w-sm text-slate-500">
              Commencez par ajouter votre premier client pour gérer les dossiers SAV
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="h-12 rounded-2xl bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter Client
            </Button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/80">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-800">Aucun résultat</h3>
            <p className="mx-auto mb-5 max-w-sm text-sm text-slate-500">
              Aucun client ne correspond à « {query} ».
            </p>
            <Button
              variant="outline"
              onClick={() => setQuery("")}
              className="h-11 rounded-xl border-slate-200"
            >
              Effacer la recherche
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs font-medium tabular-nums text-slate-400 sm:mb-4">
              {filteredClients.length === clients.length
                ? `${clients.length} client${clients.length > 1 ? "s" : ""}`
                : `${filteredClients.length} sur ${clients.length} client${clients.length > 1 ? "s" : ""}`}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[min(90dvh,90vh)] w-[calc(100%-1.25rem)] max-w-lg overflow-y-auto rounded-3xl border-0 p-4 shadow-2xl shadow-slate-300/50 sm:p-6">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-100 p-2.5">
                <Plus className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nouveau client</DialogTitle>
                <DialogDescription>
                  Renseignez les informations du client pour créer son dossier SAV
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitAdd();
            }}
          >
            <div className="py-4 sm:py-6">
              <ClientFormFields formData={formData} setFormData={setFormData} prefix="add" />
            </div>
            <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="h-11 rounded-xl sm:h-10"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-teal-600 px-6 hover:bg-teal-700 sm:h-10"
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[min(90dvh,90vh)] w-[calc(100%-1.25rem)] max-w-lg overflow-y-auto rounded-3xl border-0 p-4 shadow-2xl shadow-slate-300/50 sm:p-6">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-100 p-2.5">
                <Edit className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Modifier le client</DialogTitle>
                <DialogDescription>
                  Mettez à jour les informations du client
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitEdit();
            }}
          >
            <div className="py-4 sm:py-6">
              <ClientFormFields formData={formData} setFormData={setFormData} prefix="edit" />
            </div>
            <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-11 rounded-xl sm:h-10"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-teal-600 px-6 hover:bg-teal-700 sm:h-10"
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-1.25rem)] max-w-md rounded-3xl border-0 p-4 shadow-2xl shadow-slate-300/50 sm:p-6">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Supprimer le client</DialogTitle>
                <DialogDescription>
                  {clientToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong>{clientToDelete.prenom} {clientToDelete.nom}</strong> ? Cette action est irréversible.
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-11 rounded-xl sm:h-10"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="h-11 rounded-xl bg-red-600 px-6 hover:bg-red-700 sm:h-10"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
