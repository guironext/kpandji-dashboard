"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Printer, 
  Plus, 
  Trash2, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  Truck,
  CreditCard,
  Package,
  Calendar,
  User,
  Phone,
  MapPin,
  Mail
} from "lucide-react";
import { getAllFournisseurCommandeLocal } from "@/lib/actions/fournisseur-commande-local";
import { formatNumberWithSpaces } from "@/lib/utils";
import { toast } from "sonner";

type Fournisseur = {
  id: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  type_Activite?: string | null;
};

type OrderItem = {
  id: string;
  designation: string;
  reference: string;
  quantity: number;
  prixUnitaire: number;
  montantTotal: number;
};

type PurchaseOrder = {
  id: string;
  referenceCommande: string;
  dateCommande: Date;
  fournisseurId: string;
  fournisseur?: Fournisseur;
  items: OrderItem[];
  totalHT: number;
  tvaPercent: number;
  montantTVA: number;
  totalTTC: number;
  adresseLivraison: string;
  dateLivraisonSouhaitee: Date;
  modeLivraison: string;
  contactReception: string;
  telephoneContact: string;
  modePaiement: string;
  delaiPaiement: number;
  remarques: string;
  etabliPar: string;
  fonction: string;
};

function formatDateDDMMYYYY(value: string | number | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BonCommandeLocauxPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Form state
  const [selectedFournisseur, setSelectedFournisseur] = useState("");
  const [dateCommande, setDateCommande] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: "1",
      designation: "",
      reference: "",
      quantity: 1,
      prixUnitaire: 0,
      montantTotal: 0,
    },
  ]);
  const [tvaPercent, setTvaPercent] = useState(18);
  const [adresseLivraison, setAdresseLivraison] = useState("Cocody, Riviera Palmerais, Abidjan, Côte d'Ivoire");
  const [dateLivraisonSouhaitee, setDateLivraisonSouhaitee] = useState("");
  const [modeLivraison, setModeLivraison] = useState("Transporteur");
  const [contactReception, setContactReception] = useState("");
  const [telephoneContact, setTelephoneContact] = useState("+225 01 01 04 77 03");
  const [modePaiement, setModePaiement] = useState("Virement");
  const [delaiPaiement, setDelaiPaiement] = useState(30);
  const [remarques, setRemarques] = useState("");
  const [etabliPar, setEtabliPar] = useState("");
  const [fonction, setFonction] = useState("");

  useEffect(() => {
    loadFournisseurs();
    loadPurchaseOrders();
  }, []);

  const loadFournisseurs = async () => {
    const result = await getAllFournisseurCommandeLocal();
    if (result.success && result.data) {
      setFournisseurs(result.data);
    }
  };

  const loadPurchaseOrders = async () => {
    // Mock data - in production, you'd fetch from database
    setPurchaseOrders([]);
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      designation: "",
      reference: "",
      quantity: 1,
      prixUnitaire: 0,
      montantTotal: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "prixUnitaire") {
            updated.montantTotal = updated.quantity * updated.prixUnitaire;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const totalHT = items.reduce((sum, item) => sum + item.montantTotal, 0);
    const montantTVA = totalHT * (tvaPercent / 100);
    const totalTTC = totalHT + montantTVA;
    return { totalHT, montantTVA, totalTTC };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFournisseur) {
      toast.error("Veuillez sélectionner un fournisseur");
      return;
    }

    const fournisseur = fournisseurs.find((f) => f.id === selectedFournisseur);
    const { totalHT, montantTVA, totalTTC } = calculateTotals();

    const newOrder: PurchaseOrder = {
      id: `CMD-${Date.now()}`,
      referenceCommande: `CMD-${Date.now().toString().slice(-8)}`,
      dateCommande: new Date(dateCommande),
      fournisseurId: selectedFournisseur,
      fournisseur,
      items: [...items],
      totalHT,
      tvaPercent,
      montantTVA,
      totalTTC,
      adresseLivraison,
      dateLivraisonSouhaitee: new Date(dateLivraisonSouhaitee),
      modeLivraison,
      contactReception,
      telephoneContact,
      modePaiement,
      delaiPaiement,
      remarques,
      etabliPar,
      fonction,
    };

    setPurchaseOrders([newOrder, ...purchaseOrders]);
    setShowForm(false);
    toast.success("Bon de commande créé avec succès");
    
    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setSelectedFournisseur("");
    setDateCommande(new Date().toISOString().split("T")[0]);
    setItems([
      {
        id: "1",
        designation: "",
        reference: "",
        quantity: 1,
        prixUnitaire: 0,
        montantTotal: 0,
      },
    ]);
    setDateLivraisonSouhaitee("");
    setContactReception("");
    setRemarques("");
    setEtabliPar("");
    setFonction("");
  };

  const handlePrint = () => {
    window.print();
  };

  const { totalHT, montantTVA, totalTTC } = calculateTotals();
  const totalPages = Math.max(1, Math.ceil(purchaseOrders.length / 1));
  const currentOrder = purchaseOrders[currentPage - 1];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `,
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 print-hide">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Bons de Commande
                </h1>
                <p className="text-gray-600 mt-1">Gestion des fiches de commande de matériel et fournitures</p>
              </div>
              <div className="flex gap-3">
                {currentOrder && !showForm && (
                  <Button
                    onClick={handlePrint}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Printer className="mr-2 h-5 w-5" />
                    Imprimer
                  </Button>
                )}
                <Button
                  onClick={() => setShowForm(!showForm)}
                  size="lg"
                  className={`font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                    showForm 
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800" 
                      : "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                  }`}
                >
                  {showForm ? (
                    <>
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Nouveau Bon
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">{/* Content wrapper */}

          {/* Form Section */}
          {showForm && (
            <div className="p-6 sm:p-8 print-hide">
              <Card className="border-2 border-blue-100 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      Créer un Nouveau Bon de Commande
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Remplissez les informations pour générer une fiche de commande professionnelle
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Informations Générales</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            Date de la commande *
                          </Label>
                          <Input
                            type="date"
                            value={dateCommande}
                            onChange={(e) => setDateCommande(e.target.value)}
                            required
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-medium">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            Fournisseur *
                          </Label>
                          <Select value={selectedFournisseur} onValueChange={setSelectedFournisseur} required>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Sélectionner un fournisseur" />
                            </SelectTrigger>
                            <SelectContent>
                              {fournisseurs.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.nom} {f.ville && `- ${f.ville}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                  {/* Order Items */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Articles / Fournitures</h3>
                      </div>
                      <Button 
                        type="button" 
                        onClick={addItem} 
                        size="sm" 
                        variant="outline"
                        className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une ligne
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="grid grid-cols-12 gap-2 items-end p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="col-span-12 sm:col-span-1 font-bold text-blue-600 text-center flex items-center justify-center h-10">
                            #{index + 1}
                          </div>
                          <div className="col-span-12 sm:col-span-3 space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Désignation *</Label>
                            <Input
                              placeholder="Ex: Pièce automobile"
                              value={item.designation}
                              onChange={(e) => updateItem(item.id, "designation", e.target.value)}
                              required
                              className="h-10 border-gray-300"
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-2 space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Référence</Label>
                            <Input
                              placeholder="REF-001"
                              value={item.reference}
                              onChange={(e) => updateItem(item.id, "reference", e.target.value)}
                              className="h-10 border-gray-300"
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2 space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Quantité *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                              required
                              className="h-10 border-gray-300"
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2 space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Prix unit. (FCFA) *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.prixUnitaire}
                              onChange={(e) => updateItem(item.id, "prixUnitaire", parseFloat(e.target.value) || 0)}
                              required
                              className="h-10 border-gray-300"
                            />
                          </div>
                          <div className="col-span-10 sm:col-span-1 space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Total</Label>
                            <div className="text-sm font-bold text-blue-600 pt-2.5 text-center">
                              {formatNumberWithSpaces(item.montantTotal)}
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-1 space-y-1">
                            <Label className="text-xs opacity-0">X</Label>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-md mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Total HT:</span>
                          <span className="font-bold text-lg text-gray-900">{formatNumberWithSpaces(totalHT)} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 font-medium">TVA:</span>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={tvaPercent}
                              onChange={(e) => setTvaPercent(parseFloat(e.target.value) || 0)}
                              className="w-20 h-9 text-center font-semibold border-2 border-blue-300"
                            />
                            <span className="font-medium">%</span>
                          </div>
                          <span className="font-bold text-lg text-gray-900">{formatNumberWithSpaces(montantTVA)} FCFA</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-blue-700 font-bold text-xl">Total TTC:</span>
                          <span className="font-bold text-2xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            {formatNumberWithSpaces(totalTTC)} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Delivery Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Informations de Livraison</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4 text-green-600" />
                          Adresse de livraison
                        </Label>
                        <Input
                          value={adresseLivraison}
                          onChange={(e) => setAdresseLivraison(e.target.value)}
                          className="h-11 border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-green-600" />
                          Date souhaitée
                        </Label>
                        <Input
                          type="date"
                          value={dateLivraisonSouhaitee}
                          onChange={(e) => setDateLivraisonSouhaitee(e.target.value)}
                          className="h-11 border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Truck className="h-4 w-4 text-green-600" />
                          Mode de livraison
                        </Label>
                        <Select value={modeLivraison} onValueChange={setModeLivraison}>
                          <SelectTrigger className="h-11 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Transporteur">🚛 Transporteur</SelectItem>
                            <SelectItem value="Retrait">📦 Retrait sur place</SelectItem>
                            <SelectItem value="Autre">📮 Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4 text-green-600" />
                          Personne à contacter
                        </Label>
                        <Input
                          value={contactReception}
                          onChange={(e) => setContactReception(e.target.value)}
                          placeholder="Nom du contact"
                          className="h-11 border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-4 w-4 text-green-600" />
                          Téléphone
                        </Label>
                        <Input
                          value={telephoneContact}
                          onChange={(e) => setTelephoneContact(e.target.value)}
                          placeholder="+225 XX XX XX XX XX"
                          className="h-11 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Payment Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Conditions de Paiement</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          Mode de paiement
                        </Label>
                        <Select value={modePaiement} onValueChange={setModePaiement}>
                          <SelectTrigger className="h-11 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Virement">💳 Virement bancaire</SelectItem>
                            <SelectItem value="Chèque">🏦 Chèque</SelectItem>
                            <SelectItem value="Espèces">💵 Espèces</SelectItem>
                            <SelectItem value="Autre">📝 Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          Délai de paiement (jours)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={delaiPaiement}
                          onChange={(e) => setDelaiPaiement(parseInt(e.target.value) || 0)}
                          className="h-11 border-gray-300"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Remarques
                        </Label>
                        <Textarea
                          value={remarques}
                          onChange={(e) => setRemarques(e.target.value)}
                          placeholder="Remarques supplémentaires..."
                          className="min-h-20 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Validation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Validation</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4 text-indigo-600" />
                          Établi par *
                        </Label>
                        <Input
                          value={etabliPar}
                          onChange={(e) => setEtabliPar(e.target.value)}
                          required
                          placeholder="Nom complet"
                          className="h-11 border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                          Fonction *
                        </Label>
                        <Input
                          value={fonction}
                          onChange={(e) => setFonction(e.target.value)}
                          required
                          placeholder="Ex: Responsable Comptable"
                          className="h-11 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <Button 
                      type="submit" 
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Créer le Bon de Commande
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="border-2 h-12"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Purchase Order Display */}
          {!showForm && currentOrder && (
            <div id="printable-area" className="p-8">
              {/* Header */}
              <div className="flex w-full justify-between border-b-4 border-gradient-to-r from-blue-600 to-indigo-600 pb-6 mb-8">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={80}
                    height={40}
                    priority
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center text-right">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    KPANDJI AUTOMOBILES
                  </h1>
                  <p className="text-base text-gray-700 font-medium mt-1">
                    Constructeur et Assembleur Automobile
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                      <MapPin className="h-3 w-3" />
                      Cocody, Riviera Palmerais, Abidjan, Côte d&apos;Ivoire
                    </p>
                    <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                      <Phone className="h-3 w-3" />
                      +225 01 01 04 77 03
                    </p>
                    <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                      <Mail className="h-3 w-3" />
                      info@kpandji.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="flex justify-center mb-6">
                <h1 className="text-3xl font-bold text-blue-800 border-2 border-blue-600 px-8 py-4 rounded-lg shadow-lg">
                  FICHE DE COMMANDE DE MATÉRIEL / FOURNITURE
                </h1>
              </div>

              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Date de la commande:</span>{" "}
                    {formatDateDDMMYYYY(currentOrder.dateCommande)}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Référence de la commande:</span>{" "}
                    {currentOrder.referenceCommande}
                  </p>
                </div>
              </div>

              {/* Company and Supplier Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Company (Buyer) Information */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h2 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    🏢 ENTREPRISE (Acheteur)
                  </h2>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold">Entreprise:</p>
                      <p>KPANDJI AUTOMOBILES SARL</p>
                    </div>
                    <div>
                      <p className="font-semibold">Adresse:</p>
                      <p>Cocody, Riviera Palmerais, Abidjan, Côte d&apos;Ivoire</p>
                    </div>
                    <div>
                      <p className="font-semibold">Téléphone:</p>
                      <p>+225 01 01 04 77 03</p>
                    </div>
                    <div>
                      <p className="font-semibold">Email:</p>
                      <p>info@kpandji.com</p>
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                  <h2 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                    🧰 FOURNISSEUR
                  </h2>
                  {currentOrder.fournisseur ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-semibold">Nom du fournisseur:</p>
                        <p>{currentOrder.fournisseur.nom}</p>
                      </div>
                      {currentOrder.fournisseur.adresse && (
                        <div>
                          <p className="font-semibold">Adresse:</p>
                          <p>{currentOrder.fournisseur.adresse}</p>
                        </div>
                      )}
                      {currentOrder.fournisseur.telephone && (
                        <div>
                          <p className="font-semibold">Téléphone:</p>
                          <p>{currentOrder.fournisseur.telephone}</p>
                        </div>
                      )}
                      {currentOrder.fournisseur.email && (
                        <div>
                          <p className="font-semibold">Email:</p>
                          <p>{currentOrder.fournisseur.email}</p>
                        </div>
                      )}
                      {currentOrder.fournisseur.type_Activite && (
                        <div>
                          <p className="font-semibold">Contact:</p>
                          <p>{currentOrder.fournisseur.type_Activite}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Aucun fournisseur associé</p>
                  )}
                </div>
              </div>

              {/* Order Details Table */}
              <div className="mb-6">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                  📦 DÉTAILS DE LA COMMANDE
                </h2>
                <Table className="rounded-lg overflow-hidden text-xs border-2">
                  <TableHeader>
                    <TableRow className="bg-blue-100">
                      <TableHead className="text-black font-bold text-center border w-12">N°</TableHead>
                      <TableHead className="text-black font-bold border">
                        Désignation du matériel / fourniture
                      </TableHead>
                      <TableHead className="text-black font-bold text-center border">
                        Référence
                      </TableHead>
                      <TableHead className="text-black font-bold text-center border">
                        Quantité
                      </TableHead>
                      <TableHead className="text-black font-bold text-right border">
                        Prix unitaire HT (FCFA)
                      </TableHead>
                      <TableHead className="text-black font-bold text-right border">
                        Montant total HT (FCFA)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrder.items.map((item, index) => (
                      <TableRow key={item.id} className="border">
                        <TableCell className="text-center border font-semibold">
                          {index + 1}
                        </TableCell>
                        <TableCell className="border">{item.designation}</TableCell>
                        <TableCell className="text-center border">{item.reference}</TableCell>
                        <TableCell className="text-center border">{item.quantity}</TableCell>
                        <TableCell className="text-right border">
                          {formatNumberWithSpaces(item.prixUnitaire)}
                        </TableCell>
                        <TableCell className="text-right border">
                          {formatNumberWithSpaces(item.montantTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-gray-100">
                      <TableCell colSpan={5} className="text-right font-bold border">
                        TOTAL HT
                      </TableCell>
                      <TableCell className="text-right font-bold border">
                        {formatNumberWithSpaces(currentOrder.totalHT)} FCFA
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-gray-100">
                      <TableCell colSpan={5} className="text-right font-bold border">
                        TVA ({currentOrder.tvaPercent}%)
                      </TableCell>
                      <TableCell className="text-right font-bold border">
                        {formatNumberWithSpaces(currentOrder.montantTVA)} FCFA
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-100">
                      <TableCell colSpan={5} className="text-right font-bold text-lg border">
                        TOTAL TTC
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg border text-blue-700">
                        {formatNumberWithSpaces(currentOrder.totalTTC)} FCFA
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Delivery and Payment Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Delivery */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h2 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                    🚚 LIVRAISON
                  </h2>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold">Adresse de livraison:</p>
                      <p>{currentOrder.adresseLivraison}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Date souhaitée:</p>
                      <p>{formatDateDDMMYYYY(currentOrder.dateLivraisonSouhaitee)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Mode de livraison:</p>
                      <p>{currentOrder.modeLivraison}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Personne à contacter:</p>
                      <p>{currentOrder.contactReception}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Téléphone:</p>
                      <p>{currentOrder.telephoneContact}</p>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h2 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                    💳 CONDITIONS DE PAIEMENT
                  </h2>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold">Mode de paiement:</p>
                      <p>{currentOrder.modePaiement}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Délai de paiement:</p>
                      <p>{currentOrder.delaiPaiement} jours à réception de facture</p>
                    </div>
                    {currentOrder.remarques && (
                      <div>
                        <p className="font-semibold">Remarques:</p>
                        <p>{currentOrder.remarques}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation Section */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border-2 border-gray-400 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                    ✍️ VALIDATION - ENTREPRISE
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-1">Établi par:</p>
                      <div className="border-b border-gray-300 h-6 flex items-center">
                        {currentOrder.etabliPar}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Fonction:</p>
                      <div className="border-b border-gray-300 h-6 flex items-center">
                        {currentOrder.fonction}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Signature et cachet:</p>
                      <div className="border border-gray-300 h-24 rounded"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Date:</p>
                      <div className="border-b border-gray-300 h-6 flex items-center">
                        {formatDateDDMMYYYY(currentOrder.dateCommande)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-400 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-black mb-3">
                    ACCORD FOURNISSEUR
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-1">Nom:</p>
                      <div className="border-b border-gray-300 h-6"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Fonction:</p>
                      <div className="border-b border-gray-300 h-6"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Signature et cachet:</p>
                      <div className="border border-gray-300 h-24 rounded"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Date:</p>
                      <div className="border-b border-gray-300 h-6"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center w-full justify-center bg-blue-50 rounded-lg text-xs border-t-2 border-blue-800 text-black p-4">
                <p className="font-thin text-center">
                  Abidjan, Cocody – Riviera Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03
                </p>
                <p className="font-thin text-center">
                  Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC : 2213233
                </p>
                <p className="font-thin text-center">
                  ECOBANK : CI059 01046 121659429001 46 / www.kpandji.com
                </p>
              </div>
            </div>
          )}

          {/* No Orders Message */}
          {!showForm && purchaseOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
                <FileText className="relative h-32 w-32 text-blue-300 mx-auto mb-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Aucun bon de commande
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Commencez par créer votre premier bon de commande pour gérer vos achats de matériel et fournitures.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-5 w-5" />
                Créer votre premier bon de commande
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!showForm && purchaseOrders.length > 0 && (
            <div className="flex justify-center items-center gap-4 p-6 print-hide border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="lg"
                className="border-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Précédent
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-lg border-2 border-blue-200">
                  Page <span className="text-blue-600">{currentPage}</span> sur <span className="text-blue-600">{totalPages}</span>
                </span>
              </div>

              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="lg"
                className="border-2 disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}