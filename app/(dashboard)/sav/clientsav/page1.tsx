"use client";

import React, { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-nom`}>Nom *</Label>
            <Input
              id={`${prefix}-nom`}
              value={formData.nom}
              onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Dupont"
              className="rounded-lg border-slate-200"
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
              className="rounded-lg border-slate-200"
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
              className="rounded-lg border-slate-200"
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
              className="rounded-lg border-slate-200"
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
              className="rounded-lg border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-localisation`}>Localisation</Label>
            <Input
              id={`${prefix}-localisation`}
              value={formData.localisation}
              onChange={(e) => setFormData((p) => ({ ...p, localisation: e.target.value }))}
              placeholder="Paris, France"
              className="rounded-lg border-slate-200"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${prefix}-secteur`}>Secteur d&apos;activité</Label>
            <Input
              id={`${prefix}-secteur`}
              value={formData.secteur_activite}
              onChange={(e) => setFormData((p) => ({ ...p, secteur_activite: e.target.value }))}
              placeholder="Automobile, BTP, Transport..."
              className="rounded-lg border-slate-200"
            />
          </div>
        </div>
      </div>
    </div>
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

      {/* Embedded toolbar - when hero is hidden */}
      {embedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">
              <span className="text-2xl font-bold text-emerald-700">{clients.length}</span>
              <span className="text-sm text-emerald-600 ml-1">clients</span>
            </div>
          </div>
          <Button onClick={handleOpenAdd} size="default" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Client
          </Button>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-slate-500">Chargement des clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Aucun client enregistré</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Commencez par ajouter votre premier client pour gérer les dossiers SAV
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Client
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b-2 border-slate-200 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 py-4">Nom</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Prénom</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden md:table-cell">Email</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden lg:table-cell">Entreprise</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden lg:table-cell">Localisation</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client, i) => (
                  <TableRow
                    key={client.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-emerald-50/30 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    <TableCell className="font-medium text-slate-900 py-3">{client.nom}</TableCell>
                    <TableCell className="text-slate-700 py-3">{client.prenom}</TableCell>
                    <TableCell className="text-slate-700 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {client.contact}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 py-3 hidden md:table-cell">
                      {client.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {client.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 py-3 hidden lg:table-cell">{client.entreprise || "—"}</TableCell>
                    <TableCell className="text-slate-600 py-3 hidden lg:table-cell">{client.localisation || "—"}</TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-emerald-600 hover:bg-emerald-100/80 rounded-lg"
                          onClick={() => handleOpenEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-red-600 hover:bg-red-100/80 rounded-lg"
                          onClick={() => handleOpenDelete(client)}
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

      {/* Add Client Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Plus className="h-6 w-6 text-emerald-600" />
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
            <div className="py-6">
              <ClientFormFields formData={formData} setFormData={setFormData} prefix="add" />
            </div>
            <DialogFooter className="gap-2 pt-4 border-t border-slate-100 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-lg">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6">
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100">
                <Edit className="h-6 w-6 text-teal-600" />
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
            <div className="py-6">
              <ClientFormFields formData={formData} setFormData={setFormData} prefix="edit" />
            </div>
            <DialogFooter className="gap-2 pt-4 border-t border-slate-100 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-lg">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6">
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
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
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100 sm:gap-0">
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
