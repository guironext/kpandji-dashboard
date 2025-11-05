"use client";
import React, { useEffect, useState } from "react";
import { getConteneursDecharge } from "@/lib/actions/conteneur";
import { markConteneurAsVerifie } from "@/lib/actions/conteneur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Container,
  Wrench,
  Settings,
  Calendar,
  Weight,
  Hash,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Truck, MapPin, Package as PackageIcon, Weight as WeightIcon, Calendar as CalendarIcon, Filter as FilterIcon, Search as SearchIcon } from "lucide-react";
import { getConteneursArrives, markConteneurAsDecharge } from '@/lib/actions/conteneur';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ConteneurData {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  grossWeight: string | null;
  netWeight: string | null;
  totalPackages: string | null;
  etapeConteneur: string;
  createdAt: Date;
  subcases: Array<{
    id: string;
    subcaseNumber: string;
    createdAt: Date;
    spareParts: Array<{
      id: string;
      partCode: string;
      partName: string;
      quantity: number;
      etapeSparePart: string;
    }>;
    tools: Array<{
      id: string;
      toolCode: string;
      toolName: string;
      quantity: number;
      etapeTool: string;
    }>;
  }>;
  commandes: Array<{
    id: string;
    etapeCommande: string;
    client: { nom: string } | null;
    voitureModel: { model: string } | null;
  }>;
}

const Page = () => {
  const router = useRouter();
  const [conteneurs, setConteneurs] = useState<ConteneurData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedConteneurs, setExpandedConteneurs] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingConteneur, setProcessingConteneur] = useState<string | null>(null);

  useEffect(() => {
    const fetchConteneurs = async () => {
      try {
        const result = await getConteneursDecharge();
        if (result.success) {
          setConteneurs(result.data || []);
        } else {
          setError(result.error || "Erreur de chargement");
        }
      } catch (err) {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchConteneurs();
  }, []);

  const handleViewDetails = (subcaseId: string) => {
    router.push(`/magasinier/verification/subcase/${subcaseId}`);
  };

  const handleTerminer = async (conteneurId: string) => {
    setProcessing(conteneurId);
    try {
      const result = await markConteneurAsVerifie(conteneurId);
      if (result.success) {
        const updatedResult = await getConteneursDecharge();
        if (updatedResult.success) {
          setConteneurs(updatedResult.data || []);
        }
      } else {
        setError(result.error || "Erreur lors de la vérification");
      }
    } catch (err) {
      setError("Erreur lors de la vérification");
    } finally {
      setProcessing(null);
    }
  };

  const toggleExpanded = (conteneurId: string) => {
    const newExpanded = new Set(expandedConteneurs);
    if (newExpanded.has(conteneurId)) {
      newExpanded.delete(conteneurId);
    } else {
      newExpanded.add(conteneurId);
    }
    setExpandedConteneurs(newExpanded);
  };

  const filteredConteneurs = conteneurs.filter((conteneur) => {
    const matchesSearch = conteneur.conteneurNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conteneur.sealNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || conteneur.etapeConteneur === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DECHARGE": return "bg-orange-100 text-orange-800 border-orange-200";
      case "VERIFIE": return "bg-green-100 text-green-800 border-green-200";
      case "EN_COURS": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DECHARGE": return <Clock className="h-3 w-3" />;
      case "VERIFIE": return <CheckCircle2 className="h-3 w-3" />;
      case "EN_COURS": return <RefreshCw className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleCommandeAction = (action: string, commandeId: string) => {
    console.log(`Action: ${action} for commande: ${commandeId}`);
    // Implement specific actions here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-blue-600 font-medium">Chargement des conteneurs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-6 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Container className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Vérification des Conteneurs
                </h1>
                <p className="text-slate-600 text-lg mt-1">
                  Gestion et vérification des conteneurs déchargés
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
                <Package className="h-4 w-4 mr-2" />
                {conteneurs.length} conteneur{conteneurs.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                <Settings className="h-4 w-4 mr-2" />
                Statut: DECHARGE
              </Badge>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par numéro de conteneur ou sceau..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-11">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
              <Button variant="outline" size="sm" className="h-11">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>

        {conteneurs.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Container className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                Aucun conteneur déchargé
              </h3>
              <p className="text-slate-500 text-lg max-w-md mx-auto">
                Aucun conteneur avec le statut DECHARGE n&apos;a été trouvé dans le système.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredConteneurs.map((conteneur, index) => {
              const isExpanded = expandedConteneurs.has(conteneur.id);
              const totalItems = conteneur.subcases.reduce((acc, subcase) => 
                acc + subcase.spareParts.length + subcase.tools.length, 0
              );
              
              return (
                <Card
                  key={conteneur.id}
                  className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border-slate-200/60"
                >
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200/60">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                          <Container className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-slate-900 mb-1">
                            Conteneur {conteneur.conteneurNumber}
                          </CardTitle>
                          <p className="text-slate-600">
                            Sceau: <span className="font-mono font-semibold text-slate-800">{conteneur.sealNumber}</span>
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className={`px-3 py-1 text-sm font-medium ${getStatusColor(conteneur.etapeConteneur)}`}>
                              {getStatusIcon(conteneur.etapeConteneur)}
                              <span className="ml-1">{conteneur.etapeConteneur}</span>
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {totalItems} éléments • {conteneur.subcases.length} sous-cas
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpanded(conteneur.id)}
                          className="h-9"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Réduire
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Détails
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleTerminer(conteneur.id)}
                          disabled={processing === conteneur.id}
                          className="h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                        >
                          {processing === conteneur.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              En cours...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Terminer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-slate-200/60">
                        <Weight className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Poids brut</p>
                          <p className="font-bold text-slate-900">{conteneur.grossWeight || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-slate-200/60">
                        <Weight className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Poids net</p>
                          <p className="font-bold text-slate-900">{conteneur.netWeight || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-slate-200/60">
                        <Hash className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Total colis</p>
                          <p className="font-bold text-slate-900">{conteneur.totalPackages || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-slate-200/60">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Créé le</p>
                          <p className="font-bold text-slate-900">
                            {new Date(conteneur.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="p-8 space-y-8">
                      {/* Subcases Section */}
                      {conteneur.subcases.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                              Sous-cas ({conteneur.subcases.length})
                            </h3>
                          </div>

                          <div className="grid gap-6">
                            {conteneur.subcases.map((subcase, subIndex) => (
                              <Card
                                key={subcase.id}
                                className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent"
                              >
                                <CardContent className="p-6">
                                  <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-sm font-bold text-white">
                                          {subIndex + 1}
                                        </span>
                                      </div>
                                      <div>
                                        <h4 className="text-lg font-bold text-slate-900">
                                          Sous-cas {subcase.subcaseNumber}
                                        </h4>
                                        <p className="text-slate-500">
                                          Créé le {new Date(subcase.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                      onClick={() => handleViewDetails(subcase.id)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir détails
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Spare Parts */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-4">
                                        <Settings className="h-5 w-5 text-green-600" />
                                        <h5 className="font-bold text-slate-900">
                                          Pièces détachées ({subcase.spareParts.length})
                                        </h5>
                                      </div>
                                      {subcase.spareParts.length > 0 ? (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-slate-50">
                                                <TableHead className="font-semibold text-slate-700">Code</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Nom</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Qté</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                                                <TableHead className="font-semibold text-slate-700 text-center">Action</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {subcase.spareParts.map((part) => (
                                                <TableRow key={part.id} className="hover:bg-slate-50">
                                                  <TableCell className="font-mono text-sm font-medium text-slate-600">
                                                    {part.partCode}
                                                  </TableCell>
                                                  <TableCell className="text-slate-900">{part.partName}</TableCell>
                                                  <TableCell className="font-bold text-slate-900">{part.quantity}</TableCell>
                                                  <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                      {part.etapeSparePart}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-center">
                                                    <Button 
                                                      size="sm" 
                                                      variant="outline"
                                                      className="h-7 px-3"
                                                      onClick={() => console.log('Action for part:', part.id)}
                                                    >
                                                      <Eye className="h-3 w-3 mr-1" />
                                                      Voir
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
                                          <Settings className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                          <p className="text-slate-500">Aucune pièce détachée</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Tools */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-4">
                                        <Wrench className="h-5 w-5 text-orange-600" />
                                        <h5 className="font-bold text-slate-900">
                                          Outils ({subcase.tools.length})
                                        </h5>
                                      </div>
                                      {subcase.tools.length > 0 ? (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-slate-50">
                                                <TableHead className="font-semibold text-slate-700">Code</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Nom</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Qté</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                                                <TableHead className="font-semibold text-slate-700 text-center">Action</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {subcase.tools.map((tool) => (
                                                <TableRow key={tool.id} className="hover:bg-slate-50">
                                                  <TableCell className="font-mono text-sm font-medium text-slate-600">
                                                    {tool.toolCode}
                                                  </TableCell>
                                                  <TableCell className="text-slate-900">{tool.toolName}</TableCell>
                                                  <TableCell className="font-bold text-slate-900">{tool.quantity}</TableCell>
                                                  <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                      {tool.etapeTool}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-center">
                                                    <Button 
                                                      size="sm" 
                                                      variant="outline"
                                                      className="h-7 px-3"
                                                      onClick={() => console.log('Action for tool:', tool.id)}
                                                    >
                                                      <Eye className="h-3 w-3 mr-1" />
                                                      Voir
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
                                          <Wrench className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                          <p className="text-slate-500">Aucun outil</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Associated Commands */}
                      {conteneur.commandes.length > 0 && (
                        <>
                          <Separator className="my-8" />
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Package className="h-5 w-5 text-purple-600" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-900">
                                Commandes associées ({conteneur.commandes.length})
                              </h3>
                            </div>
                            <div className="grid gap-3">
                              {conteneur.commandes.map((commande) => (
                                <div
                                  key={commande.id}
                                  className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                    <div>
                                      <span className="font-semibold text-slate-900">
                                        {commande.client?.nom || "Client inconnu"}
                                      </span>
                                      {commande.voitureModel && (
                                        <span className="text-slate-500 ml-2">
                                          - {commande.voitureModel.model}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-sm">
                                    {commande.etapeCommande}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
