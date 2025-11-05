"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAllBonDeCommandeWithProformasByUser } from "@/lib/actions/bondecommande";
import { formatNumberWithSpaces } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  Phone,
  Building2,
  User,
  Eye,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";

type ProformaData = {
  bonDeCommande: {
    id: string;
    numero: string;
    createdAt: Date;
    updatedAt: Date;
  };
  proforma: {
    id: string;
    date_facture: Date;
    date_echeance: Date;
    status_facture: string;
    total_ttc: number;
    client: {
      nom: string;
      telephone?: string;
    } | null;
    clientEntreprise: {
      nom_entreprise: string;
      telephone?: string;
    } | null;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; className: string; icon: React.ReactNode }> = {
    "Proforma": {
      variant: "secondary",
      className: "bg-blue-100 text-blue-800 border-blue-300",
      icon: <FileText className="w-3 h-3" />,
    },
    "Facture": {
      variant: "secondary",
      className: "bg-green-100 text-green-800 border-green-300",
      icon: <Receipt className="w-3 h-3" />,
    },
    "Payée": {
      variant: "secondary",
      className: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: <TrendingUp className="w-3 h-3" />,
    },
    "En Attente": {
      variant: "outline",
      className: "bg-amber-100 text-amber-800 border-amber-300",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    "Annulée": {
      variant: "destructive",
      className: "bg-red-100 text-red-800 border-red-300",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = statusMap[status] || {
    variant: "outline" as const,
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <FileText className="w-3 h-3" />,
  };

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      {config.icon}
      {status}
    </Badge>
  );
};

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, ProformaData[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllBonDeCommandeWithProformasByUser();
      if (result.success && result.data) {
        setData(result.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const allItems = Object.values(data).flat();
    const totalOrders = allItems.length;
    const totalAmount = allItems.reduce((sum, item) => sum + item.proforma.total_ttc, 0);
    const uniqueClients = new Set(
      allItems.map((item) =>
        item.proforma.client?.nom || item.proforma.clientEntreprise?.nom_entreprise || ""
      )
    ).size;
    const uniqueUsers = Object.keys(data).length;

    return {
      totalOrders,
      totalAmount,
      uniqueClients,
      uniqueUsers,
    };
  }, [data]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, ProformaData[]> = {};

    Object.entries(data).forEach(([userId, userData]) => {
      const matches = userData.filter(
        (item) =>
          item.bonDeCommande.numero.toLowerCase().includes(query) ||
          item.proforma.client?.nom?.toLowerCase().includes(query) ||
          item.proforma.clientEntreprise?.nom_entreprise?.toLowerCase().includes(query) ||
          item.user.firstName.toLowerCase().includes(query) ||
          item.user.lastName.toLowerCase().includes(query) ||
          item.proforma.status_facture.toLowerCase().includes(query)
      );

      if (matches.length > 0) {
        filtered[userId] = matches;
      }
    });

    return filtered;
  }, [data, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const users = Object.keys(filteredData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Suivi des Bons de Commande et Proformas
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez et suivez tous les bons de commande avec leurs proformas associées
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Bons de Commande</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalOrders}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Receipt className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Montant Total</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatNumberWithSpaces(stats.totalAmount)} FCFA
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Clients</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{stats.uniqueClients}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Users className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Utilisateurs</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stats.uniqueUsers}</p>
                </div>
                <div className="p-3 bg-amber-200 rounded-full">
                  <User className="w-6 h-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher par numéro, client, utilisateur ou statut..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-base"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Effacer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? "Aucun résultat trouvé" : "Aucun bon de commande avec proforma trouvé"}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Essayez de modifier vos critères de recherche"
                  : "Les bons de commande avec proformas apparaîtront ici"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Groups */}
      {users.map((userId) => {
        const userData = filteredData[userId];
        const firstItem = userData[0];
        const userName = firstItem
          ? `${firstItem.user.firstName} ${firstItem.user.lastName}`
          : "Utilisateur inconnu";
        const userTotal = userData.reduce((sum, item) => sum + item.proforma.total_ttc, 0);

        return (
          <Card key={userId} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {userName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Receipt className="w-4 h-4" />
                        {userData.length} {userData.length === 1 ? "bon de commande" : "bons de commande"}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {formatNumberWithSpaces(userTotal)} FCFA
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-blue-50">
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          N° Bon de Commande
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date Facture
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date Échéance
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Client
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Téléphone
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Total TTC
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="text-center font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.map((item, index) => (
                      <TableRow
                        key={item.bonDeCommande.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        <TableCell className="font-semibold text-blue-700">
                          {item.bonDeCommande.numero}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {format(new Date(item.proforma.date_facture), "dd/MM/yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {format(new Date(item.proforma.date_echeance), "dd/MM/yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {item.proforma.client?.nom ||
                              item.proforma.clientEntreprise?.nom_entreprise ||
                              "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {item.proforma.client?.telephone ||
                              item.proforma.clientEntreprise?.telephone ||
                              "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-700">
                            {formatNumberWithSpaces(item.proforma.total_ttc)} FCFA
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.proforma.status_facture)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            onClick={() => router.push(`/comptable/proforma/${item.proforma.id}`)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
