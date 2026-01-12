"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  FileText,
  Package,
  Truck,
} from "lucide-react";

type CourrierType = {
  id: string;
  date_livraison: string;
  reference: string;
  numero_conteneur: string;
  vin: string;
  moteur: string;
  createdAt: string;
  updatedAt: string;
  conteneurId: string;
  commandeId: string | null;
  conteneur: {
    id: string;
    conteneurNumber: string;
    sealNumber: string | null;
  };
  commande: {
    id: string;
    voitureModel: {
      model: string;
    } | null;
    client: {
      nom: string;
    } | null;
    clientEntreprise: {
      nom_entreprise: string;
    } | null;
  } | null;
};

type Props = {
  courriers: CourrierType[];
};

const CourriersClient: React.FC<Props> = ({ courriers }) => {
  const router = useRouter();

  // Group courriers by conteneur number - each conteneur is one row
  const groupedCourriers = React.useMemo(() => {
    const groups = new Map<string, typeof courriers>();
    
    courriers.forEach((courrier) => {
      const key = courrier.numero_conteneur;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(courrier);
    });

    const result: Array<{
      conteneurNumber: string;
      conteneur: typeof courriers[0]['conteneur'];
      vins: string[];
      motorisations: string[];
    }> = [];

    groups.forEach((groupCourriers, conteneurNumber) => {
      const vins = groupCourriers.map(c => c.vin);
      const motorisations = groupCourriers.map(c => c.moteur);
      
      result.push({
        conteneurNumber,
        conteneur: groupCourriers[0].conteneur,
        vins,
        motorisations,
      });
    });

    return result;
  }, [courriers]);

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Header Section with Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/manager/listeConteneurs")}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-md hover:bg-white shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                Liste des Courriers
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Gestion des courriers créés
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/manager/listeConteneurs/courriers/nouveau")}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 h-auto font-semibold text-base md:text-lg"
          >
            <Mail className="h-5 w-5 md:h-6 md:w-6 mr-2" />
            Créer Tableau du courrier
          </Button>
        </div>

        {/* Courriers List */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white border-0 pb-8 pt-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-lg">
                  <Mail className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 flex items-center gap-3">
                    Tableaux de courriers Créés
                  </CardTitle>
                  
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {courriers.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-purple-200/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 hover:bg-gradient-to-r hover:from-purple-50 hover:via-blue-50 hover:to-purple-50">
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-purple-600" />
                          <span>Conteneur</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span>VIN</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          <span>Motorisation</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4 text-purple-600" />
                          <span>Action</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedCourriers.map(({ conteneurNumber, vins, motorisations }) => (
                      <TableRow
                        key={conteneurNumber}
                        className="hover:bg-purple-50/50 transition-colors border-b border-purple-100/50"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-gray-900">
                              {conteneurNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-2">
                            {vins.map((vin, index) => (
                              <span key={index} className="font-mono font-semibold text-gray-900">
                                {vin}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-2">
                            {motorisations.map((moteur, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-purple-300 text-purple-700 bg-purple-50 w-fit"
                              >
                                {moteur}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center">
                            <Button
                              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
                              size="sm"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Courrier
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 md:py-32 text-gray-400">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full blur-2xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 p-10 rounded-full shadow-inner">
                    <Mail className="h-24 w-24 text-gray-400" />
                  </div>
                </div>
                <p className="text-center font-extrabold text-2xl md:text-3xl mb-3 text-gray-600">
                  Aucun courrier trouvé
                </p>
                <p className="text-center text-base md:text-lg text-gray-500 max-w-md">
                  Aucun courrier n&apos;a été créé pour le moment. Les
                  courriers apparaîtront ici une fois qu&apos;ils seront créés.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default CourriersClient;

