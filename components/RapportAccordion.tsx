"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Briefcase,
  Car,
  CheckCircle2,
  Building2,
  UserCircle,
  Search,
  Filter,
  Star,
  TrendingUp,
  AlertCircle,
  Sparkles,
  FileText,
  MessageSquare,
  Target,
  DollarSign,
  ArrowUpRight,
  Package,
} from "lucide-react";

interface Report {
  id: string;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client: string | null;
  type_client: string;
  lieu_rendez_vous: string;
  lieu_autre: string | null;
  profession_societe: string | null;
  degre_interet: string | null;
  motivations_achat: string | null;
  points_positifs: string | null;
  objections_freins: string | null;
  commentaire_global: string | null;
  decision_attendue: string | null;
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  devis_offre_remise: boolean;
  createdAt: Date;
  updatedAt: Date;
  voiture?: {
    id: string;
    couleur: string;
    motorisation: string;
    transmission: string;
    voitureModel?: {
      model: string;
    };
  } | null;
}

interface ReportsByUser {
  conseiller_commercial: string;
  totalReports: number;
  reports: Report[];
}

interface RapportAccordionProps {
  reportsByUser: ReportsByUser[];
}

export const RapportAccordion = ({ reportsByUser }: RapportAccordionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<string>("all");

  // Filter reports based on search and interest level
  const filteredReportsByUser = reportsByUser.map(userGroup => ({
    ...userGroup,
    reports: userGroup.reports.filter((report) => {
      const matchesSearch = 
        report.nom_prenom_client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.telephone_client.includes(searchTerm) ||
        report.email_client?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesInterest = 
        selectedInterest === "all" || 
        report.degre_interet?.toLowerCase().includes(selectedInterest.toLowerCase());
      
      return matchesSearch && matchesInterest;
    })
  })).filter(userGroup => userGroup.reports.length > 0);

  const getInterestBadgeVariant = (interest: string | null) => {
    if (!interest) return "outline";
    const lowerInterest = interest.toLowerCase();
    if (lowerInterest.includes("élevé") || lowerInterest.includes("fort")) return "default";
    if (lowerInterest.includes("moyen")) return "secondary";
    return "outline";
  };

  const getInterestColor = (interest: string | null) => {
    if (!interest) return "text-slate-500";
    const lowerInterest = interest.toLowerCase();
    if (lowerInterest.includes("élevé") || lowerInterest.includes("fort")) return "text-green-600";
    if (lowerInterest.includes("moyen")) return "text-amber-600";
    return "text-slate-500";
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-slate-200 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedInterest("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedInterest === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setSelectedInterest("élevé")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedInterest === "élevé"
                ? "bg-green-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Élevé
          </button>
          <button
            onClick={() => setSelectedInterest("moyen")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedInterest === "moyen"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Moyen
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>
          {filteredReportsByUser.reduce((acc, u) => acc + u.reports.length, 0)} rapport(s) trouvé(s)
        </span>
      </div>

      {/* Accordion */}
      <Accordion type="single" collapsible className="space-y-4">
        {filteredReportsByUser.map((userGroup, index) => (
          <AccordionItem 
            key={index} 
            value={`user-${index}`}
            className="border-0 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                    <UserCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-lg text-slate-800">
                      {userGroup.conseiller_commercial}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Conseiller Commercial
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1"
                >
                  {userGroup.reports.length} rapport{userGroup.reports.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-4">
                {userGroup.reports.map((report) => (
                  <Card
                    key={report.id}
                    className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-xl text-slate-800">
                              {report.nom_prenom_client}
                            </CardTitle>
                          </div>
                          <CardDescription className="flex items-center gap-6 flex-wrap text-base">
                            <span className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {new Date(report.date_rendez_vous).toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </span>
                            <span className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
                              <Clock className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium">{report.heure_rendez_vous}</span>
                            </span>
                            <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                              <Clock className="h-4 w-4 text-slate-600" />
                              <span className="font-medium">{report.duree_rendez_vous}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <Badge
                          variant={report.type_client === "ENTREPRISE" ? "default" : "outline"}
                          className={`${
                            report.type_client === "ENTREPRISE"
                              ? "bg-indigo-600 hover:bg-indigo-700"
                              : "border-slate-300"
                          } px-3 py-1`}
                        >
                          {report.type_client === "ENTREPRISE" ? (
                            <Building2 className="h-3 w-3 mr-1" />
                          ) : (
                            <UserCircle className="h-3 w-3 mr-1" />
                          )}
                          {report.type_client}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Client Contact Information */}
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Phone className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Téléphone</p>
                            <p className="font-medium text-sm">{report.telephone_client}</p>
                          </div>
                        </div>
                        {report.email_client && (
                          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="font-medium text-sm truncate">{report.email_client}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Lieu</p>
                            <p className="font-medium text-sm">
                              {report.lieu_rendez_vous}
                              {report.lieu_autre && ` - ${report.lieu_autre}`}
                            </p>
                          </div>
                        </div>
                        {report.profession_societe && (
                          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Briefcase className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Profession</p>
                              <p className="font-medium text-sm">{report.profession_societe}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Meeting Objectives */}
                      <div>
                        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          Objets du rendez-vous
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {report.presentation_gamme && (
                            <Badge variant="outline" className="gap-1.5 border-green-200 bg-green-50 text-green-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Présentation gamme
                            </Badge>
                          )}
                          {report.essai_vehicule && (
                            <Badge variant="outline" className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700">
                              <Car className="h-3.5 w-3.5" />
                              Essai véhicule
                            </Badge>
                          )}
                          {report.negociation_commerciale && (
                            <Badge variant="outline" className="gap-1.5 border-purple-200 bg-purple-50 text-purple-700">
                              <DollarSign className="h-3.5 w-3.5" />
                              Négociation
                            </Badge>
                          )}
                          {report.livraison_vehicule && (
                            <Badge variant="outline" className="gap-1.5 border-indigo-200 bg-indigo-50 text-indigo-700">
                              <Package className="h-3.5 w-3.5" />
                              Livraison
                            </Badge>
                          )}
                          {report.service_apres_vente && (
                            <Badge variant="outline" className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              SAV
                            </Badge>
                          )}
                          {report.devis_offre_remise && (
                            <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                              <FileText className="h-3.5 w-3.5" />
                              Devis/Offre
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Interest Level - Prominent */}
                      {report.degre_interet && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                report.degre_interet.toLowerCase().includes("élevé") 
                                  ? "bg-green-500" 
                                  : report.degre_interet.toLowerCase().includes("moyen")
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}>
                                <Star className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">Degré d&apos;intérêt</p>
                                <p className={`text-lg font-bold ${getInterestColor(report.degre_interet)}`}>
                                  {report.degre_interet}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={getInterestBadgeVariant(report.degre_interet)}
                              className="text-sm px-3 py-1"
                            >
                              {report.degre_interet}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Information */}
                      {report.voiture && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                            <Car className="h-5 w-5 text-blue-600" />
                            Véhicule discuté
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-white">
                              {report.voiture.voitureModel?.model}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              {report.voiture.couleur}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              {report.voiture.motorisation}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              {report.voiture.transmission}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Key Insights Grid */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {report.motivations_achat && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2 text-green-700">
                              <TrendingUp className="h-4 w-4" />
                              Motivations d&apos;achat
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {report.motivations_achat}
                            </p>
                          </div>
                        )}
                        {report.points_positifs && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2 text-blue-700">
                              <Sparkles className="h-4 w-4" />
                              Points positifs
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {report.points_positifs}
                            </p>
                          </div>
                        )}
                        {report.objections_freins && (
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2 text-red-700">
                              <AlertCircle className="h-4 w-4" />
                              Objections / Freins
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {report.objections_freins}
                            </p>
                          </div>
                        )}
                        {report.decision_attendue && (
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2 text-purple-700">
                              <ArrowUpRight className="h-4 w-4" />
                              Décision attendue
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {report.decision_attendue}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Global Comment */}
                      {report.commentaire_global && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-slate-600" />
                            Commentaire global
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {report.commentaire_global}
                          </p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex gap-4 text-xs text-muted-foreground pt-3 border-t">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Créé le: {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Modifié le: {new Date(report.updatedAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredReportsByUser.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Search className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            Aucun résultat trouvé
          </h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
};

