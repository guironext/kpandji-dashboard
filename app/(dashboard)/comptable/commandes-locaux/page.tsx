"use client";

import { useState, useEffect } from "react";
import { getAllCommandeLocaux } from "@/lib/actions/fournisseur-commande-local";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, TrendingUp, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CommandeLocal = {
  id: string;
  article: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  date_livraison: Date;
  createdAt: Date;
  updatedAt: Date;
};

export default function CommandesLocauxPage() {
  const [commandesLocaux, setCommandesLocaux] = useState<CommandeLocal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommandesLocaux = async () => {
      const result = await getAllCommandeLocaux();
      if (result.success && result.data) {
        setCommandesLocaux(result.data);
      }
      setLoading(false);
    };
    fetchCommandesLocaux();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const calculateTotals = () => {
    const totalQuantity = commandesLocaux.reduce((sum, cmd) => sum + cmd.quantity, 0);
    const totalAmount = commandesLocaux.reduce((sum, cmd) => sum + cmd.total, 0);
    return { totalQuantity, totalAmount };
  };

  const { totalQuantity, totalAmount } = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Chargement des commandes locales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Commandes Locales
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Vue d&apos;ensemble de toutes les commandes locales
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card className="bg-white shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Commandes
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {commandesLocaux.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Commandes enregistrées
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quantité Totale
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalQuantity}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Articles commandés
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xl border-2 border-purple-200 hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Montant Total
            </CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valeur totale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commands Table */}
      {commandesLocaux.length === 0 ? (
        <Card className="bg-white shadow-xl border-2 border-blue-200">
          <CardContent className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucune commande locale
            </h3>
            <p className="text-gray-500">Les commandes locales apparaîtront ici</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white shadow-xl border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Liste des Commandes Locales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Article</TableHead>
                    <TableHead className="font-bold">Description</TableHead>
                    <TableHead className="font-bold text-center">Quantité</TableHead>
                    <TableHead className="font-bold text-right">Prix Unitaire</TableHead>
                    <TableHead className="font-bold text-right">Total</TableHead>
                    <TableHead className="font-bold text-center">Date Livraison</TableHead>
                    <TableHead className="font-bold text-center">Créée le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commandesLocaux.map((cmd) => (
                    <TableRow key={cmd.id} className="hover:bg-blue-50 transition-colors">
                      <TableCell className="font-mono text-xs">
                        <Badge variant="outline" className="bg-blue-50">
                          #{cmd.id.slice(-7).toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {cmd.article}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {cmd.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-500 text-white">
                          {cmd.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-700">
                        {formatCurrency(cmd.price)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(cmd.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          {formatDate(cmd.date_livraison)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(cmd.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}