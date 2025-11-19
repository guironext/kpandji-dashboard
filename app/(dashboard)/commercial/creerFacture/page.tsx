"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createFactureWithMultipleLines, getFactureById, updateFacture } from "@/lib/actions/facture";
import { getClientsByUser } from "@/lib/actions/client";
import { getClientEntreprisesByUser } from "@/lib/actions/client_entreprise";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Image from "next/image";
import { formatNumberWithSpaces } from "@/lib/utils";

type Client = { id: string; nom: string; type: "client" };
type ClientEntreprise = { id: string; nom_entreprise: string; type: "client_entreprise" };
type ClientOrEntreprise = Client | ClientEntreprise;

type VoitureModel = {
  id: string;
  model: string;
  image?: string | null;
  description?: string | null;
  fiche_technique?: string | null;
};

type FactureData = {
  clientId: string;
  date_facture: string;
  date_echeance: string;
  nbr_voiture_commande: number;
  prix_unitaire: number;
  remise: number;
  tva: number;
  avance_payee: number;
  status_facture: "PROFORMA" | "EN_ATTENTE" | "PAYEE" | "ANNULEE";
  voiture?: {
    voitureModelId?: string;
    couleur?: string;
  };
  [key: string]: unknown;
};

type LineItem = {
  id: string;
  voitureModelId: string;
  couleur: string;
  nbr_voiture: number;
  prix_unitaire: number;
  transmission: string;
  motorisation: string;
};

type AccessoryLineItem = {
  id: string;
  nom: string;
  description: string;
  prix_unitaire: number;
  quantity: number;
};

type Accessoire = {
  id: string;
  nom: string;
  image?: string | null;
};

function CreerFacturePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const factureId = searchParams.get("id");
  const mode = searchParams.get("mode");
  const isEditMode = mode === "edit" && factureId;
  
  const { userId: clerkId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientOrEntreprise[]>([]);
  const [voitureModels, setVoitureModels] = useState<VoitureModel[]>([]);
  const [accessoires, setAccessoires] = useState<Accessoire[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Fetch VoitureModels and Accessoires on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelsResponse, accessoiresResult] = await Promise.all([
          fetch('/api/voiture-models'),
          getAllAccessoires()
        ]);
        
        if (modelsResponse.ok) {
          const data = await modelsResponse.json();
          setVoitureModels(data);
        }
        
        if (accessoiresResult.success && accessoiresResult.data) {
          setAccessoires(accessoiresResult.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch database user ID from Clerk ID
  useEffect(() => {
    const fetchUser = async () => {
      if (!clerkId) return;
      try {
        const response = await fetch(`/api/user/${clerkId}`);
        if (response.ok) {
          const user = await response.json();
          setDbUserId(user.id);
        } else if (response.status === 404) {
          toast.error("Votre compte n'est pas configuré. Veuillez compléter l'onboarding.");
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Erreur lors de la récupération de l'utilisateur");
      }
    };
    fetchUser();
  }, [clerkId, router]);

  const [formData, setFormData] = useState({
    clientId: "",
    clientType: "" as "" | "client" | "client_entreprise",
    date_facture: new Date().toISOString().split("T")[0],
    date_echeance: "",
    remise: 0,
    tva: 18,
    avance_payee: 0,
    status_facture: "PROFORMA" as "PROFORMA" | "EN_ATTENTE" | "PAYEE" | "ANNULEE",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), voitureModelId: "", couleur: "", nbr_voiture: 1, prix_unitaire: 0, transmission: "", motorisation: "" }
  ]);

  const [accessoryItems, setAccessoryItems] = useState<AccessoryLineItem[]>([]);

  // Calculated values
  const montant_ht_articles = lineItems.reduce((sum, item) => sum + (item.prix_unitaire * item.nbr_voiture), 0);
  const montant_ht_accessoires = accessoryItems.reduce((sum, item) => sum + (item.prix_unitaire * item.quantity), 0);
  const montant_ht = montant_ht_articles + montant_ht_accessoires;
  const montant_remise = (montant_ht * formData.remise) / 100;
  const montant_net_ht = montant_ht - montant_remise;
  const montant_tva = (montant_net_ht * formData.tva) / 100;
  const total_ttc = montant_net_ht + montant_tva;
  const reste_payer = total_ttc - formData.avance_payee;

  useEffect(() => {
    const fetchData = async () => {
      if (!clerkId) return;
      
      // Fetch both regular clients and client_entreprises
      const [clientsResult, entreprisesResult] = await Promise.all([
        getClientsByUser(clerkId),
        getClientEntreprisesByUser(clerkId)
      ]);
      
      const allClients: ClientOrEntreprise[] = [];
      
      // Add regular clients
      if (clientsResult.success && clientsResult.data) {
        clientsResult.data.forEach(client => {
          allClients.push({ id: client.id, nom: client.nom, type: "client" });
        });
      }
      
      // Add client_entreprises
      if (entreprisesResult.success && entreprisesResult.data) {
        entreprisesResult.data.forEach(entreprise => {
          allClients.push({ id: entreprise.id, nom_entreprise: entreprise.nom_entreprise, type: "client_entreprise" });
        });
      }
      
      setClients(allClients);
    };
    fetchData();
  }, [clerkId]);

  // Load facture data when in edit mode
  useEffect(() => {
    const loadFacture = async () => {
      if (!isEditMode || !factureId) return;
      
      setLoading(true);
      try {
        const result = await getFactureById(factureId);
        if (result.success && result.data) {
          const facture = result.data as unknown as FactureData & {
            clientEntrepriseId?: string;
            lignes?: Array<{
              id: string;
              voitureModelId: string;
              couleur: string;
              nbr_voiture: number;
              prix_unitaire: number;
              transmission?: string;
              motorisation?: string;
            }>;
          };
          
          // Add a small delay to ensure clients and models are loaded first
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Determine client type based on which ID is present
          const clientId = facture.clientId || "";
          const clientEntrepriseId = facture.clientEntrepriseId || "";
          const clientType = clientId ? "client" : (clientEntrepriseId ? "client_entreprise" : "");
          
          setFormData({
            clientId: clientId || clientEntrepriseId,
            clientType: clientType as "client" | "client_entreprise",
            date_facture: facture.date_facture ? new Date(facture.date_facture).toISOString().split("T")[0] : "",
            date_echeance: facture.date_echeance ? new Date(facture.date_echeance).toISOString().split("T")[0] : "",
            remise: facture.remise || 0,
            tva: facture.tva || 18,
            avance_payee: facture.avance_payee || 0,
            status_facture: facture.status_facture || "PROFORMA",
          });

          // Load existing lines or fallback to old single item
          if (facture.lignes && facture.lignes.length > 0) {
            setLineItems(facture.lignes.map(ligne => ({
              id: crypto.randomUUID(),
              voitureModelId: ligne.voitureModelId,
              couleur: ligne.couleur,
              nbr_voiture: ligne.nbr_voiture,
              prix_unitaire: Number(ligne.prix_unitaire) || 0,
              transmission: ligne.transmission || "",
              motorisation: ligne.motorisation || "",
            })));
          } else {
            // Fallback for old factures without lignes
            setLineItems([{
              id: crypto.randomUUID(),
              voitureModelId: facture.voiture?.voitureModelId || "",
              couleur: facture.voiture?.couleur || "",
              nbr_voiture: facture.nbr_voiture_commande || 1,
              prix_unitaire: facture.prix_unitaire || 0,
              transmission: "",
              motorisation: "",
            }]);
          }
        } else {
          toast.error("Facture introuvable");
          router.push("/commercial/proformas");
        }
      } catch (error) {
        console.error("Error loading facture:", error);
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    loadFacture();
  }, [isEditMode, factureId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && !dbUserId) {
      toast.error("Vous devez être connecté");
      return;
    }
  
    if (!formData.clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    if (!formData.date_echeance) {
      toast.error("Veuillez sélectionner une date d'échéance");
      return;
    }

    // Validate line items
    const validItems = lineItems.filter(item => 
      item.voitureModelId && item.couleur && item.prix_unitaire > 0
    );

    if (validItems.length === 0) {
      toast.error("Veuillez ajouter au moins un article valide");
      return;
    }
  
    setLoading(true);
    try {
      if (isEditMode && factureId) {
        // Update existing facture (only first item for now)
        const firstItem = validItems[0];
        
        // Update facture with client information based on type
        // Note: updateFacture only handles clientId for now
        // You may need to extend it to handle clientEntrepriseId
        const result = await updateFacture(factureId, {
          ...(formData.clientType === "client" ? { clientId: formData.clientId } : {}),
          nbr_voiture_commande: firstItem.nbr_voiture,
          prix_unitaire: firstItem.prix_unitaire,
          remise: formData.remise,
          tva: formData.tva,
          avance_payee: formData.avance_payee,
          date_facture: new Date(formData.date_facture),
          date_echeance: new Date(formData.date_echeance),
        });
        
        if (result.success) {
          if (validItems.length > 1) {
            toast.info("Note: Seul le premier article a été sauvegardé (support multi-articles en développement)");
          } else {
            toast.success("Facture modifiée avec succès");
          }
          router.push("/commercial/proformas");
        } else {
          console.error("Error details:", result.error);
          toast.error(result.error || "Erreur lors de la modification");
        }
      } else {
        // Validate and filter accessory items
        const validAccessories = accessoryItems.filter(item => 
          item.nom && item.prix_unitaire > 0 && item.quantity > 0
        );

        // Create one facture with multiple line items
        const result = await createFactureWithMultipleLines({
          ...(formData.clientType === "client" 
            ? { clientId: formData.clientId } 
            : { clientEntrepriseId: formData.clientId }),
          userId: dbUserId!,
          date_facture: new Date(formData.date_facture),
          date_echeance: new Date(formData.date_echeance),
          remise: formData.remise,
          tva: formData.tva,
          avance_payee: formData.avance_payee,
          status_facture: formData.status_facture,
          lignes: validItems.map(item => ({
            voitureModelId: item.voitureModelId,
            couleur: item.couleur,
            nbr_voiture: item.nbr_voiture,
            prix_unitaire: item.prix_unitaire,
            transmission: item.transmission,
            motorisation: item.motorisation
          })),
          accessoires: validAccessories.length > 0 ? validAccessories.map(item => ({
            nom: item.nom,
            description: item.description,
            prix_unitaire: item.prix_unitaire,
            quantity: item.quantity
          })) : undefined
        });
    
        if (result.success) {
          toast.success(`Facture créée avec ${validItems.length} article(s)${validAccessories.length > 0 ? ` et ${validAccessories.length} accessoire(s)` : ''}`);
          router.push("/commercial/proformas");
        } else {
          console.error("Error details:", result.error);
          toast.error(result.error || "Erreur lors de la création");
        }
      }
    } catch (error) {
      console.error("Caught error:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          {isEditMode ? "Modifier la Facture / Proforma" : "Créer une Facture / Proforma"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Selection */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <Label htmlFor="client" className="text-amber-700 font-bold">
                Client / Prospect *
              </Label>
              <Select
                key={`client-${formData.clientId}`}
                value={formData.clientId}
                onValueChange={(value) => {
                  const selectedClient = clients.find(c => c.id === value);
                  setFormData({ 
                    ...formData, 
                    clientId: value,
                    clientType: selectedClient?.type || ""
                  });
                }}
              >
                <SelectTrigger className="border-amber-400">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.type === "client" ? client.nom : client.nom_entreprise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-700">Articles</h3>
              <Button
                type="button"
                onClick={() => setLineItems([...lineItems, { 
                  id: crypto.randomUUID(), 
                  voitureModelId: "", 
                  couleur: "", 
                  nbr_voiture: 1, 
                  prix_unitaire: 0,
                  transmission: "",
                  motorisation: ""
                }])}
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                + Ajouter un article
              </Button>
            </div>

            {lineItems.map((item, index) => {
              const selectedModel = voitureModels.find(m => m.id === item.voitureModelId);
              return (
                <div key={item.id} className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-amber-700">Article {index + 1}</h4>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-amber-700 font-bold">Modèle *</Label>
                      <Select
                        value={item.voitureModelId}
                        onValueChange={(value) => {
                          const updated = [...lineItems];
                          updated[index].voitureModelId = value;
                          setLineItems(updated);
                        }}
                      >
                        <SelectTrigger className="border-amber-300">
                          <SelectValue placeholder="Modèle" />
                        </SelectTrigger>
                        <SelectContent>
                          {voitureModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm text-amber-700 font-bold">Couleur *</Label>
                      <Input
                        value={item.couleur}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].couleur = e.target.value;
                          setLineItems(updated);
                        }}
                        className="border-amber-300"
                        placeholder="Couleur"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-amber-700 font-bold">Qté *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.nbr_voiture}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].nbr_voiture = parseInt(e.target.value) || 1;
                          setLineItems(updated);
                        }}
                        className="border-amber-300"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-amber-700 font-bold">Prix Unit. HT (FCFA) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.prix_unitaire}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].prix_unitaire = parseFloat(e.target.value) || 0;
                          setLineItems(updated);
                        }}
                        className="border-amber-300"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm text-amber-700 font-bold">Transmission</Label>
                      <Input
                        value={item.transmission}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].transmission = e.target.value;
                          setLineItems(updated);
                        }}
                        className="border-amber-300"
                        placeholder="Ex: Manuelle, Automatique"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-amber-700 font-bold">Motorisation</Label>
                      <Input
                        value={item.motorisation}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].motorisation = e.target.value;
                          setLineItems(updated);
                        }}
                        className="border-amber-300"
                        placeholder="Ex: Essence, Diesel, Electrique, Hybride"
                      />
                    </div>
                  </div>

                  {selectedModel && (
                    <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                      <div className="flex gap-3 items-center">
                        {selectedModel.image && (
                          <Image 
                            src={selectedModel.image} 
                            alt={selectedModel.model}
                            width={60}
                            height={60}
                            className="w-16 h-16 object-contain rounded"
                          />
                        )}
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-amber-800">{selectedModel.model}</p>
                          {selectedModel.description && (
                            <p className="text-gray-600 text-xs">{selectedModel.description}</p>
                          )}
                        </div>
                         <div className="text-right">
                           <p className="text-sm text-gray-600">Sous-total:</p>
                           <p className="font-bold text-amber-700">
                             {formatNumberWithSpaces(item.prix_unitaire * item.nbr_voiture)} FCFA
                           </p>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Accessoires Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-700">Accessoires</h3>
              
              <Button
                type="button"
                onClick={() => setAccessoryItems([...accessoryItems, { 
                  id: crypto.randomUUID(), 
                  nom: "", 
                  description: "", 
                  prix_unitaire: 0,
                  quantity: 1
                }])}
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                + Ajouter un accessoire
              </Button>
            </div>

            {accessoryItems.map((item, index) => (
              <div key={item.id} className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-amber-700">Accessoire {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => setAccessoryItems(accessoryItems.filter((_, i) => i !== index))}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-amber-700 font-bold">Nom *</Label>
                    <Select
                      value={accessoires.find(acc => acc.nom === item.nom)?.id || ""}
                      onValueChange={(value) => {
                        const selectedAccessoire = accessoires.find(acc => acc.id === value);
                        if (selectedAccessoire) {
                          const updated = [...accessoryItems];
                          updated[index].nom = selectedAccessoire.nom;
                          setAccessoryItems(updated);
                        }
                      }}
                    >
                      <SelectTrigger className="border-amber-300">
                        <SelectValue placeholder="Accessoire" />
                      </SelectTrigger>
                      <SelectContent>
                        {accessoires.map((accessoire) => (
                          <SelectItem key={accessoire.id} value={accessoire.id}>
                            {accessoire.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm text-amber-700 font-bold">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...accessoryItems];
                        updated[index].description = e.target.value;
                        setAccessoryItems(updated);
                      }}
                      className="border-amber-300"
                      placeholder="Description"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-amber-700 font-bold">Qté *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...accessoryItems];
                        updated[index].quantity = parseInt(e.target.value) || 1;
                        setAccessoryItems(updated);
                      }}
                      className="border-amber-300"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm text-amber-700 font-bold">Prix Unit. HT (FCFA) *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.prix_unitaire}
                      onChange={(e) => {
                        const updated = [...accessoryItems];
                        updated[index].prix_unitaire = parseFloat(e.target.value) || 0;
                        setAccessoryItems(updated);
                      }}
                      className="border-amber-300"
                    />
                  </div>
                </div>
                
                {(() => {
                  const selectedAccessoire = accessoires.find(a => a.nom === item.nom);
                  return (
                    <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                      <div className="flex gap-3 items-center">
                        {selectedAccessoire?.image && (
                          <Image 
                            src={selectedAccessoire.image} 
                            alt={item.nom} 
                            width={60} 
                            height={60} 
                            className="w-16 h-16 object-contain rounded"
                          />
                        )}
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-amber-800">{item.nom || "Accessoire"}</p>
                          {item.description && (
                            <p className="text-gray-600 text-xs">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Sous-total:</p>
                          <p className="font-bold text-amber-700">
                            {formatNumberWithSpaces(item.prix_unitaire * item.quantity)} FCFA
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Facture */}
            <div>
              <Label htmlFor="date_facture" className="text-amber-700 font-bold">
                Date de Facture *
              </Label>
              <Input
                type="date"
                id="date_facture"
                value={formData.date_facture}
                onChange={(e) =>
                  setFormData({ ...formData, date_facture: e.target.value })
                }
                className="border-amber-400"
                required
              />
            </div>

            {/* Date Échéance */}
            <div>
              <Label htmlFor="date_echeance" className="text-amber-700 font-bold">
                Date d&apos;Échéance *
              </Label>
              <Input
                type="date"
                id="date_echeance"
                value={formData.date_echeance}
                onChange={(e) =>
                  setFormData({ ...formData, date_echeance: e.target.value })
                }
                className="border-amber-400"
                required
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="status" className="text-amber-700 font-bold">
                Type *
              </Label>
              <Select
                key={`status-${formData.status_facture}`}
                value={formData.status_facture}
                onValueChange={(value: "PROFORMA" | "EN_ATTENTE" | "PAYEE" | "ANNULEE") =>
                  setFormData({ ...formData, status_facture: value })
                }
              >
                <SelectTrigger className="border-amber-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFORMA">Proforma</SelectItem>
                  <SelectItem value="EN_ATTENTE">En Attente</SelectItem>
                  <SelectItem value="PAYEE">Payée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remise */}
            <div>
              <Label htmlFor="remise" className="text-amber-700 font-bold">
                Remise (%)
              </Label>
              <Input
                type="number"
                id="remise"
                min="0"
                max="100"
                step="0.01"
                value={formData.remise}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remise: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-amber-400"
              />
            </div>

            {/* TVA */}
            <div>
              <Label htmlFor="tva" className="text-amber-700 font-bold">
                TVA (%)
              </Label>
              <Input
                type="number"
                id="tva"
                min="0"
                max="100"
                step="0.01"
                value={formData.tva}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tva: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-amber-400"
              />
            </div>

            {/* Avance Payée */}
            <div>
              <Label htmlFor="avance_payee" className="text-amber-700 font-bold">
                Avance Payée (FCFA)
              </Label>
              <Input
                type="number"
                id="avance_payee"
                min="0"
                step="0.01"
                value={formData.avance_payee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    avance_payee: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-amber-400"
              />
            </div>
          </div>

           {/* Summary Section */}
           <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 rounded-lg border-l-4 border-amber-600 mt-6">
             <h3 className="text-lg font-bold text-black mb-4">Résumé</h3>
             <div className="space-y-2 text-black">
               <p className="flex justify-between">
                 <span>Montant HT:</span>
                 <span className="font-semibold">
                   {formatNumberWithSpaces(montant_ht)} FCFA
                 </span>
               </p>
               <p className="flex justify-between">
                 <span>Remise ({formData.remise}%):</span>
                 <span className="font-semibold text-orange-600">
                   -{formatNumberWithSpaces(montant_remise)} FCFA
                 </span>
               </p>
               <p className="flex justify-between">
                 <span>Montant Net HT:</span>
                 <span className="font-semibold">
                   {formatNumberWithSpaces(montant_net_ht)} FCFA
                 </span>
               </p>
               <p className="flex justify-between">
                 <span>TVA ({formData.tva}%):</span>
                 <span className="font-semibold">
                   {formatNumberWithSpaces(montant_tva)} FCFA
                 </span>
               </p>
               <p className="flex justify-between text-lg font-bold border-t-2 border-amber-600 pt-2">
                 <span>Total TTC:</span>
                 <span className="text-orange-600">
                   {formatNumberWithSpaces(total_ttc)} FCFA
                 </span>
               </p>
               <p className="flex justify-between">
                 <span>Avance Payée:</span>
                 <span className="font-semibold text-green-600">
                   -{formatNumberWithSpaces(formData.avance_payee)} FCFA
                 </span>
               </p>
               <p className="flex justify-between text-lg font-bold border-t-2 border-orange-600 pt-2">
                 <span>Reste à Payer:</span>
                 <span className="text-orange-600">
                   {formatNumberWithSpaces(reste_payer)} FCFA
                 </span>
               </p>
             </div>
           </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
              disabled={loading}
            >
              {loading 
                ? (isEditMode ? "Modification..." : "Création...") 
                : (isEditMode ? "Modifier la Facture Proforma" : "Créer la Facture Proforma")
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreerFacturePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl mx-auto w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    }>
      <CreerFacturePageContent />
    </Suspense>
  );
}