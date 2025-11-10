"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllStockDisponible, getStockStatistics } from '@/lib/actions/stock';
import {
  Car,
  Search,
  Filter,
  Package,
  TrendingUp,
  Calendar,
  Palette,
  Gauge,
  Settings,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Grid3x3,
  List,
  Plus,
  Download,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface StockItem {
  id: string;
  couleur: string;
  motorisation: string;
  transmission: string;
  quantity: number;
  acquisitionDate: Date;
  voitureModel: {
    id: string;
    model: string;
    description: string | null;
    image: string | null;
    fiche_technique: string | null;
  };
}

interface StockStats {
  totalVehicles: number;
  byModel: number;
  byColor: { couleur: string; _sum: { quantity: number | null } }[];
  byMotorisation: { motorisation: string; _sum: { quantity: number | null } }[];
}

const StockDisponiblePage = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMotorisation, setFilterMotorisation] = useState<string>('all');
  const [filterTransmission, setFilterTransmission] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [stats, setStats] = useState<StockStats | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchStock();
    fetchStatistics();
  }, []);

  const filterStockItems = useCallback(() => {
    let filtered = [...stockItems];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.voitureModel.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.couleur.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Motorisation filter
    if (filterMotorisation !== 'all') {
      filtered = filtered.filter((item) => item.motorisation === filterMotorisation);
    }

    // Transmission filter
    if (filterTransmission !== 'all') {
      filtered = filtered.filter((item) => item.transmission === filterTransmission);
    }

    // Color filter
    if (filterColor !== 'all') {
      filtered = filtered.filter((item) => item.couleur === filterColor);
    }

    setFilteredStock(filtered);
  }, [searchTerm, filterMotorisation, filterTransmission, filterColor, stockItems]);

  useEffect(() => {
    filterStockItems();
  }, [filterStockItems]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const result = await getAllStockDisponible();
      if (result.success && result.data) {
        setStockItems(result.data as StockItem[]);
      } else {
        toast.error('Erreur lors du chargement du stock');
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const result = await getStockStatistics();
      if (result.success && result.data) {
        setStats(result.data as StockStats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const getUniqueColors = () => {
    return Array.from(new Set(stockItems.map((item) => item.couleur)));
  };

  const getMotorisationBadgeColor = (motorisation: string) => {
    switch (motorisation) {
      case 'ELECTRIQUE':
        return 'bg-green-500';
      case 'ESSENCE':
        return 'bg-blue-500';
      case 'DIESEL':
        return 'bg-yellow-600';
      case 'HYBRIDE':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTransmissionBadgeColor = (transmission: string) => {
    return transmission === 'AUTOMATIQUE' ? 'bg-indigo-500' : 'bg-orange-500';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalQuantity = filteredStock.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Car className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <p className="mt-4 text-muted-foreground">Chargement du stock...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Stock Disponible
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Gérez et visualisez tous vos véhicules en temps réel
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4" />
              Ajouter au Stock
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Total Véhicules</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Car className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats?.totalVehicles || 0}</div>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                véhicules en stock
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Modèles Uniques</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats?.byModel || 0}</div>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                modèles différents
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Résultats Filtrés</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Filter className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{totalQuantity}</div>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                <Archive className="h-3 w-3" />
                véhicules affichés
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Types Motorisation</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Gauge className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stats?.byMotorisation.length || 0}</div>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                <Settings className="h-3 w-3" />
                types disponibles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filtres de Recherche
                </CardTitle>
                <CardDescription className="mt-1">
                  Affinez vos résultats avec les filtres ci-dessous
                </CardDescription>
              </div>
              {(searchTerm || filterMotorisation !== 'all' || filterTransmission !== 'all' || filterColor !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterMotorisation('all');
                    setFilterTransmission('all');
                    setFilterColor('all');
                  }}
                  className="gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un modèle ou couleur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Motorisation Filter */}
            <Select value={filterMotorisation} onValueChange={setFilterMotorisation}>
              <SelectTrigger>
                <SelectValue placeholder="Motorisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les motorisations</SelectItem>
                <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                <SelectItem value="ESSENCE">Essence</SelectItem>
                <SelectItem value="DIESEL">Diesel</SelectItem>
                <SelectItem value="HYBRIDE">Hybride</SelectItem>
              </SelectContent>
            </Select>

            {/* Transmission Filter */}
            <Select value={filterTransmission} onValueChange={setFilterTransmission}>
              <SelectTrigger>
                <SelectValue placeholder="Transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les transmissions</SelectItem>
                <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                <SelectItem value="MANUEL">Manuelle</SelectItem>
              </SelectContent>
            </Select>

            {/* Color Filter */}
            <Select value={filterColor} onValueChange={setFilterColor}>
              <SelectTrigger>
                <SelectValue placeholder="Couleur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les couleurs</SelectItem>
                {getUniqueColors().map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active Filters Display */}
            {(searchTerm || filterMotorisation !== 'all' || filterTransmission !== 'all' || filterColor !== 'all') && (
              <div className="col-span-full mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Filtres actifs:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
                    <Search className="h-3 w-3" />
                    {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {filterMotorisation !== 'all' && (
                  <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-200">
                    <Gauge className="h-3 w-3" />
                    {filterMotorisation}
                    <button onClick={() => setFilterMotorisation('all')} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {filterTransmission !== 'all' && (
                  <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                    <Settings className="h-3 w-3" />
                    {filterTransmission}
                    <button onClick={() => setFilterTransmission('all')} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {filterColor !== 'all' && (
                  <Badge variant="secondary" className="gap-1 bg-pink-100 text-pink-700 hover:bg-pink-200">
                    <Palette className="h-3 w-3" />
                    {filterColor}
                    <button onClick={() => setFilterColor('all')} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
          </CardContent>
        </Card>

        {/* Main Content with Grid/Table Toggle */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Véhicules en Stock</CardTitle>
                  <CardDescription>
                    {filteredStock.length} véhicule{filteredStock.length > 1 ? 's' : ''} affiché{filteredStock.length > 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {filteredStock.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aucun véhicule trouvé</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {stockItems.length === 0
                    ? "Le stock est actuellement vide. Ajoutez des véhicules pour commencer."
                    : "Aucun véhicule ne correspond à vos critères de recherche. Essayez de modifier vos filtres."}
                </p>
                {stockItems.length === 0 && (
                  <Button className="mt-6 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus className="h-4 w-4" />
                    Ajouter un véhicule
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStock.map((item) => (
                  <div key={item.id}>
                    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md hover:-translate-y-1">
                      {/* Image Section */}
                      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                        {item.voitureModel.image ? (
                          <Image
                            src={item.voitureModel.image}
                            alt={item.voitureModel.model}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Car className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Quantity Badge */}
                        <div className="absolute top-3 right-3">
                          <div className={`px-3 py-1.5 rounded-full font-bold text-sm shadow-lg ${
                            item.quantity < 3 
                              ? 'bg-red-500 text-white' 
                              : 'bg-green-500 text-white'
                          }`}>
                            {item.quantity} en stock
                          </div>
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Eye className="h-4 w-4" />
                            Voir
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg line-clamp-1">{item.voitureModel.model}</h3>
                          {item.voitureModel.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.voitureModel.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Specs */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Palette className="h-3 w-3" />
                            {item.couleur}
                          </Badge>
                          <Badge className={`${getMotorisationBadgeColor(item.motorisation)} text-white gap-1 text-xs`}>
                            <Gauge className="h-3 w-3" />
                            {item.motorisation}
                          </Badge>
                          <Badge className={`${getTransmissionBadgeColor(item.transmission)} text-white gap-1 text-xs`}>
                            <Settings className="h-3 w-3" />
                            {item.transmission}
                          </Badge>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.acquisitionDate)}
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View */
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                      <TableHead className="font-semibold">Image</TableHead>
                      <TableHead className="font-semibold">Modèle</TableHead>
                      <TableHead className="font-semibold">Couleur</TableHead>
                      <TableHead className="font-semibold">Motorisation</TableHead>
                      <TableHead className="font-semibold">Transmission</TableHead>
                      <TableHead className="text-center font-semibold">Quantité</TableHead>
                      <TableHead className="font-semibold">Date d&apos;acquisition</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell>
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-sm">
                            {item.voitureModel.image ? (
                              <Image
                                src={item.voitureModel.image}
                                alt={item.voitureModel.model}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Car className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="max-w-xs">
                            <div className="font-semibold text-base">{item.voitureModel.model}</div>
                            {item.voitureModel.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.voitureModel.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-medium">
                            <Palette className="h-3 w-3" />
                            {item.couleur}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getMotorisationBadgeColor(item.motorisation)} text-white gap-1`}>
                            <Gauge className="h-3 w-3" />
                            {item.motorisation}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getTransmissionBadgeColor(item.transmission)} text-white gap-1`}>
                            <Settings className="h-3 w-3" />
                            {item.transmission}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg ${
                            item.quantity < 3 
                              ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' 
                              : 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
                          }`}>
                            {item.quantity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded">
                              <Calendar className="h-3.5 w-3.5" />
                            </div>
                            {formatDate(item.acquisitionDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-9 w-9">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 w-9">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockDisponiblePage;