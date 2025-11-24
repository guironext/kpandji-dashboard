"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  User,
  Building2,
  DollarSign,
  Calendar,
  CreditCard,
  Search,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  Receipt,
  Sparkles,
} from "lucide-react";
import { getAllPaiementsGroupedByClient } from "@/lib/actions/paiement";
import { formatNumberWithSpaces } from "@/lib/utils";
import { toast } from "sonner";

type Paiement = {
  id: string;
  avance_payee: number;
  reste_payer: number;
  date_paiement: Date | string;
  mode_paiement: "CB" | "CHEQUE" | "VIREMENT" | "CASH";
  status_paiement: "EN_ATTENTE" | "PAYE" | "ANNULE";
  createdAt: Date | string;
  facture: {
    id: string;
    date_facture: Date | string;
    total_ttc: number;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  numeroEntreeCaisse?: {
    numero: string;
    prefix_numero: string;
  } | null;
};

type ClientGroup = {
  clientId: string;
  client: {
    id: string;
    nom: string;
    telephone?: string | null;
    email?: string | null;
    entreprise?: string | null;
    localisation?: string | null;
    commercial?: string | null;
  };
  paiements: Paiement[];
  totalAmount: number;
};

type ClientEntrepriseGroup = {
  clientEntrepriseId: string;
  clientEntreprise: {
    id: string;
    nom_entreprise: string;
    sigle?: string | null;
    telephone?: string | null;
    email?: string | null;
    localisation?: string | null;
    commercial?: string | null;
  };
  paiements: Paiement[];
  totalAmount: number;
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "PAYE":
      return "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm";
    case "EN_ATTENTE":
      return "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm";
    case "ANNULE":
      return "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-sm";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getModePaiementBadgeColor = (mode: string) => {
  switch (mode) {
    case "CASH":
      return "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-sm";
    case "CB":
      return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm";
    case "VIREMENT":
      return "bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-sm";
    case "CHEQUE":
      return "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-sm";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

export default function PointPaiementPage() {
  const [clients, setClients] = useState<ClientGroup[]>([]);
  const [clientEntreprises, setClientEntreprises] = useState<ClientEntrepriseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllPaiementsGroupedByClient();

      if (result.success && result.data) {
        setClients(result.data.clients as ClientGroup[]);
        setClientEntreprises(result.data.clientEntreprises as ClientEntrepriseGroup[]);
      } else {
        toast.error(result.error || "Erreur lors du chargement des paiements");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredClients = clients.filter((group) =>
    group.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.client.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClientEntreprises = clientEntreprises.filter(
    (group) =>
      group.clientEntreprise.nom_entreprise
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      group.clientEntreprise.sigle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      group.clientEntreprise.telephone
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      group.clientEntreprise.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClientsAmount = filteredClients.reduce(
    (sum, group) => sum + group.totalAmount,
    0
  );
  const totalClientEntreprisesAmount = filteredClientEntreprises.reduce(
    (sum, group) => sum + group.totalAmount,
    0
  );
  const grandTotal = totalClientsAmount + totalClientEntreprisesAmount;
  const totalPaiements = filteredClients.reduce(
    (sum, group) => sum + group.paiements.length,
    0
  ) + filteredClientEntreprises.reduce(
    (sum, group) => sum + group.paiements.length,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <Sparkles className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">Chargement des paiements...</p>
              <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Point de Paiement
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 mt-1">
                    Vue d&apos;ensemble complète de tous les paiements
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Paiements</p>
                  <p className="text-lg font-bold text-gray-900">{totalPaiements}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Clients Individuels
                </CardTitle>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-xs font-semibold">{filteredClients.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl md:text-5xl font-bold mb-2">{filteredClients.length}</p>
                  <p className="text-sm opacity-90 font-medium">
                    {formatNumberWithSpaces(totalClientsAmount)} FCFA
                  </p>
                </div>
                <User className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clients Entreprises
                </CardTitle>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-xs font-semibold">{filteredClientEntreprises.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl md:text-5xl font-bold mb-2">
                    {filteredClientEntreprises.length}
                  </p>
                  <p className="text-sm opacity-90 font-medium">
                    {formatNumberWithSpaces(totalClientEntreprisesAmount)} FCFA
                  </p>
                </div>
                <Building2 className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Général
                </CardTitle>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-xs font-semibold">
                    {filteredClients.length + filteredClientEntreprises.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl md:text-5xl font-bold mb-2">
                    {filteredClients.length + filteredClientEntreprises.length}
                  </p>
                  <p className="text-sm opacity-90 font-medium">
                    {formatNumberWithSpaces(grandTotal)} FCFA
                  </p>
                </div>
                <DollarSign className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Rechercher par nom, téléphone, email ou sigle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
                />
                {searchTerm && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {filteredClients.length + filteredClientEntreprises.length} résultat(s)
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Individuels */}
        {filteredClients.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Clients Individuels
              </h2>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {filteredClients.length}
              </Badge>
            </div>
            <div className="grid gap-5">
              {filteredClients.map((group, index) => (
                <Card
                  key={group.clientId}
                  className="group border-0 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 via-blue-100/50 to-indigo-50 border-b border-blue-200/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                              {group.client.nom}
                            </CardTitle>
                            <CardDescription>
                              <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
                                {group.client.telephone && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Phone className="h-4 w-4 text-blue-600" />
                                    <span className="text-gray-700 font-medium">{group.client.telephone}</span>
                                  </div>
                                )}
                                {group.client.email && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    <span className="text-gray-700 font-medium">{group.client.email}</span>
                                  </div>
                                )}
                                {group.client.localisation && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    <span className="text-gray-700 font-medium">{group.client.localisation}</span>
                                  </div>
                                )}
                                {group.client.commercial && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Briefcase className="h-4 w-4 text-blue-600" />
                                    <span className="text-gray-700 font-medium">{group.client.commercial}</span>
                                  </div>
                                )}
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg md:text-xl px-5 py-2.5 shadow-lg border-0">
                          {formatNumberWithSpaces(group.totalAmount)} FCFA
                        </Badge>
                        <p className="text-sm text-gray-600 font-medium">
                          {group.paiements.length} paiement{group.paiements.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto -mx-6 px-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b-2 border-gray-200">
                            <TableHead className="font-bold text-gray-900 py-4">Date</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Reçu de caisse</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4 text-right">Montant</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4 text-right">Reste à Payer</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Mode</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Statut</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Créé par</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.paiements.map((paiement) => (
                            <TableRow 
                              key={paiement.id} 
                              className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors border-b border-gray-100"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-gray-900">{formatDate(paiement.date_paiement)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {paiement.numeroEntreeCaisse ? (
                                  <Badge variant="outline" className="font-mono bg-white border-2 border-blue-200 text-blue-700 px-3 py-1">
                                    {paiement.numeroEntreeCaisse.prefix_numero}-{paiement.numeroEntreeCaisse.numero}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm font-medium">-</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <span className="font-bold text-gray-900 text-lg">
                                  {formatNumberWithSpaces(paiement.avance_payee)} FCFA
                                </span>
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <span className="font-bold text-orange-600 text-lg">
                                  {formatNumberWithSpaces(paiement.reste_payer)} FCFA
                                </span>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className={getModePaiementBadgeColor(paiement.mode_paiement)}>
                                  {paiement.mode_paiement}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className={getStatusBadgeColor(paiement.status_paiement)}>
                                  {paiement.status_paiement}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <span className="text-sm text-gray-700 font-medium">
                                  {paiement.user.firstName} {paiement.user.lastName}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Clients Entreprises */}
        {filteredClientEntreprises.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Clients Entreprises
              </h2>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                {filteredClientEntreprises.length}
              </Badge>
            </div>
            <div className="grid gap-5">
              {filteredClientEntreprises.map((group, index) => (
                <Card
                  key={group.clientEntrepriseId}
                  className="group border-0 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="bg-gradient-to-r from-purple-50 via-purple-100/50 to-violet-50 border-b border-purple-200/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                              {group.clientEntreprise.nom_entreprise}
                              {group.clientEntreprise.sigle && (
                                <span className="text-gray-600 ml-2 font-normal">
                                  ({group.clientEntreprise.sigle})
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
                                {group.clientEntreprise.telephone && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Phone className="h-4 w-4 text-purple-600" />
                                    <span className="text-gray-700 font-medium">{group.clientEntreprise.telephone}</span>
                                  </div>
                                )}
                                {group.clientEntreprise.email && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Mail className="h-4 w-4 text-purple-600" />
                                    <span className="text-gray-700 font-medium">{group.clientEntreprise.email}</span>
                                  </div>
                                )}
                                {group.clientEntreprise.localisation && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                    <span className="text-gray-700 font-medium">{group.clientEntreprise.localisation}</span>
                                  </div>
                                )}
                                {group.clientEntreprise.commercial && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Briefcase className="h-4 w-4 text-purple-600" />
                                    <span className="text-gray-700 font-medium">{group.clientEntreprise.commercial}</span>
                                  </div>
                                )}
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white text-lg md:text-xl px-5 py-2.5 shadow-lg border-0">
                          {formatNumberWithSpaces(group.totalAmount)} FCFA
                        </Badge>
                        <p className="text-sm text-gray-600 font-medium">
                          {group.paiements.length} paiement{group.paiements.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto -mx-6 px-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50/50 border-b-2 border-gray-200">
                            <TableHead className="font-bold text-gray-900 py-4">Date</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Reçu de caisse</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4 text-right">Montant</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4 text-right">Reste à Payer</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Mode</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Statut</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Créé par</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.paiements.map((paiement) => (
                            <TableRow 
                              key={paiement.id} 
                              className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-violet-50/50 transition-colors border-b border-gray-100"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium text-gray-900">{formatDate(paiement.date_paiement)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {paiement.numeroEntreeCaisse ? (
                                  <Badge variant="outline" className="font-mono bg-white border-2 border-purple-200 text-purple-700 px-3 py-1">
                                    {paiement.numeroEntreeCaisse.prefix_numero}-{paiement.numeroEntreeCaisse.numero}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm font-medium">-</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <span className="font-bold text-gray-900 text-lg">
                                  {formatNumberWithSpaces(paiement.avance_payee)} FCFA
                                </span>
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <span className="font-bold text-orange-600 text-lg">
                                  {formatNumberWithSpaces(paiement.reste_payer)} FCFA
                                </span>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className={getModePaiementBadgeColor(paiement.mode_paiement)}>
                                  {paiement.mode_paiement}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className={getStatusBadgeColor(paiement.status_paiement)}>
                                  {paiement.status_paiement}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <span className="text-sm text-gray-700 font-medium">
                                  {paiement.user.firstName} {paiement.user.lastName}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {filteredClients.length === 0 &&
          filteredClientEntreprises.length === 0 && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-16 pb-16 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
                  <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full">
                    <CreditCard className="h-16 w-16 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm ? "Aucun résultat trouvé" : "Aucun paiement enregistré"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm
                    ? "Aucun paiement ne correspond à votre recherche. Essayez avec d'autres termes."
                    : "Les paiements apparaîtront ici une fois qu'ils auront été enregistrés dans le système."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Réinitialiser la recherche
                  </button>
                )}
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
