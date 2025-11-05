"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MapPin,
  Mail,
  Building,
  Briefcase,
  User,
} from "lucide-react";
import { getAllRendezVous } from "@/lib/actions/rendezvous";
import { toast } from "sonner";

interface RendezVous {
  id: string;
  date: Date;
  duree: string;
  resume_rendez_vous?: string | null;
  note?: string | null;
  statut: "EN_ATTENTE" | "CONFIRME" | "ANNULE";
  clientId: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    nom: string;
    telephone: string;
    email?: string | null;
    entreprise?: string | null;
    localisation?: string | null;
    secteur_activite?: string | null;
    status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

const RapportRendezVousPage = () => {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "EN_ATTENTE" | "CONFIRME" | "ANNULE">("ALL");
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRendezVous = useCallback(async () => {
      try {
        const result = await getAllRendezVous();
      
        if (result.success && result.data) {
          setRendezVous(result.data);
        } else {
          toast.error("Erreur lors du chargement des rendez-vous");
        }
      } catch (error) {
      console.error("Error fetching rendez-vous:", error);
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchRendezVous();
  }, [fetchRendezVous]);

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "CONFIRME":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none shadow-sm px-3 py-1.5 text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Confirmé
          </Badge>
        );
      case "ANNULE":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-none shadow-sm px-3 py-1.5 text-sm font-medium">
            <XCircle className="w-4 h-4 mr-1.5" />
            Annulé
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-none shadow-sm px-3 py-1.5 text-sm font-medium">
            <AlertCircle className="w-4 h-4 mr-1.5" />
            En attente
          </Badge>
        );
    }
  };

  const statusOrder = { EN_ATTENTE: 1, CONFIRME: 2, ANNULE: 3 };

  const filteredRendezVous = rendezVous
    .filter((rdv) => filterStatus === "ALL" || rdv.statut === filterStatus)
    .sort((a, b) => {
      const statusDiff = statusOrder[a.statut] - statusOrder[b.statut];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const getStatusCounts = () => {
    const counts = {
    total: rendezVous.length,
    enAttente: rendezVous.filter((rdv) => rdv.statut === "EN_ATTENTE").length,
    confirme: rendezVous.filter((rdv) => rdv.statut === "CONFIRME").length,
    annule: rendezVous.filter((rdv) => rdv.statut === "ANNULE").length,
  };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Rapport des Rendez-vous
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                Vue d&apos;ensemble de tous les rendez-vous
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-500 to-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total</p>
                  <p className="text-4xl font-bold text-white mt-2">{statusCounts.total}</p>
                  <p className="text-xs text-blue-100 mt-1">Rendez-vous</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-yellow-500 to-yellow-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-100">En Attente</p>
                  <p className="text-4xl font-bold text-white mt-2">{statusCounts.enAttente}</p>
                  <p className="text-xs text-yellow-100 mt-1">À confirmer</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-500 to-green-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Confirmés</p>
                  <p className="text-4xl font-bold text-white mt-2">{statusCounts.confirme}</p>
                  <p className="text-xs text-green-100 mt-1">Validés</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-red-500 to-red-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100">Annulés</p>
                  <p className="text-4xl font-bold text-white mt-2">{statusCounts.annule}</p>
                  <p className="text-xs text-red-100 mt-1">Non aboutis</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Table */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <span className="font-bold text-gray-900">Liste des Rendez-vous</span>
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterStatus === "ALL"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  Tous ({statusCounts.total})
                </button>
                <button
                  onClick={() => setFilterStatus("EN_ATTENTE")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterStatus === "EN_ATTENTE"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md hover:shadow-lg"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
                  }`}
                >
                  En attente ({statusCounts.enAttente})
                </button>
                <button
                  onClick={() => setFilterStatus("CONFIRME")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterStatus === "CONFIRME"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  Confirmés ({statusCounts.confirme})
                </button>
                <button
                  onClick={() => setFilterStatus("ANNULE")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterStatus === "ANNULE"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:bg-red-50"
                  }`}
                >
                  Annulés ({statusCounts.annule})
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredRendezVous.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Aucun rendez-vous</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  {filterStatus === "ALL" 
                    ? "Aucun rendez-vous disponible dans le système."
                    : `Aucun rendez-vous avec le statut ${filterStatus.toLowerCase().replace('_', ' ')}.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-50">
                      <TableHead className="font-bold text-gray-700">Client</TableHead>
                      <TableHead className="font-bold text-gray-700">Téléphone</TableHead>
                      <TableHead className="font-bold text-gray-700">Date</TableHead>
                      <TableHead className="font-bold text-gray-700">Heure</TableHead>
                      <TableHead className="font-bold text-gray-700">Durée</TableHead>
                      <TableHead className="font-bold text-gray-700">Statut</TableHead>
                      <TableHead className="font-bold text-gray-700">Résumé</TableHead>
                      <TableHead className="font-bold text-gray-700">Créé le</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRendezVous.map((rdv) => (
                      <TableRow 
                        key={rdv.id} 
                        className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 border-b border-gray-100"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-orange-700 text-sm">
                                {rdv.client?.nom.charAt(0).toUpperCase() || "N"}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{rdv.client?.nom || "N/A"}</div>
                              {rdv.client?.entreprise && (
                                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                  <Building className="w-3 h-3 mr-1" />
                                  {rdv.client.entreprise}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700 font-medium">{rdv.client?.telephone || "N/A"}</span>
                        </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-700">
                        {new Date(rdv.date).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-700">
                        {new Date(rdv.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {rdv.duree} min
                          </span>
                      </TableCell>
                      <TableCell>{getStatutBadge(rdv.statut)}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-gray-600">
                            {rdv.resume_rendez_vous || (
                              <span className="text-gray-400 italic">Aucun résumé</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(rdv.createdAt).toLocaleDateString("fr-FR")}
                        </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRendezVous(rdv);
                            setIsDialogOpen(true);
                          }}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 border-none shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="flex items-center text-2xl font-bold">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Détails du Rendez-vous
                </span>
              </DialogTitle>
            </DialogHeader>

            {selectedRendezVous && (
              <div className="space-y-6 pt-4">
                {/* User Information */}
                <Card className="border-none shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
                    <CardTitle className="text-sm flex items-center font-bold text-gray-900">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      Créé par
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Nom</p>
                        <p className="font-bold text-gray-900 text-sm">
                          {selectedRendezVous.client?.user.firstName} {selectedRendezVous.client?.user.lastName}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Email</p>
                        <p className="font-bold text-gray-900 text-sm">{selectedRendezVous.client?.user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Information */}
                <Card className="border-none shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                    <CardTitle className="text-sm flex items-center font-bold text-gray-900">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      Informations Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Nom</p>
                        <p className="font-bold text-gray-900 text-sm">{selectedRendezVous.client?.nom || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Téléphone</p>
                        <p className="font-bold text-gray-900 text-sm">{selectedRendezVous.client?.telephone || "N/A"}</p>
                    </div>
                    </div>
                    
                    {selectedRendezVous.client?.email && (
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                      <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="font-semibold text-gray-900">{selectedRendezVous.client.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedRendezVous.client?.entreprise && (
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Entreprise</p>
                          <p className="font-semibold text-gray-900">{selectedRendezVous.client.entreprise}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedRendezVous.client?.localisation && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Localisation</p>
                          <p className="font-semibold text-gray-900">{selectedRendezVous.client?.localisation}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedRendezVous.client?.secteur_activite && (
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                        </div>
                      <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Secteur d&apos;activité</p>
                          <p className="font-semibold text-gray-900">{selectedRendezVous.client.secteur_activite}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedRendezVous.client?.status_client && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Statut Client</p>
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none px-4 py-1.5 text-sm">
                          {selectedRendezVous.client.status_client.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Appointment Information */}
                <Card className="border-none shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                    <CardTitle className="text-sm flex items-center font-bold text-gray-900">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      Informations du Rendez-vous
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                      <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                          <p className="font-bold text-gray-900">
                          {new Date(selectedRendezVous.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                              month: "long"
                          })}
                        </p>
                      </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                      <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Heure</p>
                          <p className="font-bold text-gray-900 text-sm">
                          {new Date(selectedRendezVous.date).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                              minute: "2-digit"
                          })}
                        </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Durée</p>
                        <p className="font-bold text-2xl text-purple-700">{selectedRendezVous.duree} <span className="text-sm text-gray-600">minutes</span></p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Statut</p>
                        <div className="mt-1">
                          {getStatutBadge(selectedRendezVous.statut)}
                        </div>
                      </div>
                    </div>
                    
                    {selectedRendezVous.resume_rendez_vous && (
                      <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-200">
                        <p className="text-xs text-orange-600 mb-2 uppercase tracking-wide font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Résumé du rendez-vous
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedRendezVous.resume_rendez_vous}
                        </p>
                      </div>
                    )}
                    
                    {selectedRendezVous.note && (
                      <div className="p-5 bg-gradient-to-br from-yellow-50 to-white rounded-xl border-2 border-yellow-200">
                        <p className="text-xs text-yellow-700 mb-2 uppercase tracking-wide font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Notes
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedRendezVous.note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Metadata */}
                <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl border border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Créé le:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedRendezVous.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Modifié le:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedRendezVous.updatedAt).toLocaleString("fr-FR")}
                      </span>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RapportRendezVousPage;