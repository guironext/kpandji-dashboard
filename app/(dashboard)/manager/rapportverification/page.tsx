import React from "react";
import { getVerificationSparesByConteneur } from "@/lib/actions/conteneur";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Box, ClipboardList, CalendarClock } from "lucide-react";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusVariant = (status: string) => {
  switch (status) {
    case "RETROUVE":
      return "default";
    case "MODIFIE":
      return "secondary";
    case "NON_RETROUVE":
      return "destructive";
    case "EN_ATTENTE":
    default:
      return "outline";
  }
};

type VerificationSpare = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench?: string | null;
  quantity?: number;
  subcaseNumber?: string | null;
  statusVerification?: string;
};

type VerificationItem = {
  id: string;
  createdAt: string;
  conteneur: { conteneurNumber: string; sealNumber: string | null };
  spares: VerificationSpare[];
};

export default async function RapportVerificationManagerPage() {
  const result = await getVerificationSparesByConteneur();
  const conteneurs = (result.success && Array.isArray(result.data) ? result.data : []) as unknown as VerificationItem[];
  const conteneursWithSpares = conteneurs.filter((conteneur) => conteneur.spares.length > 0);
  const totalSpares = conteneursWithSpares.reduce(
    (sum, conteneur) => sum + conteneur.spares.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-700 text-white">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/15 ring-1 ring-white/30">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">
                    Rapport des pièces vérifiées
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Pièces par conteneur, regroupées par statut de vérification
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/15 text-white">
                  {conteneursWithSpares.length} conteneur
                  {conteneursWithSpares.length > 1 ? "s" : ""}
                </Badge>
                <Badge className="border-0 bg-white/15 text-white">
                  {totalSpares} pièce{totalSpares > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {conteneursWithSpares.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardContent className="p-10 text-center text-slate-500">
              Aucune pièce vérifiée disponible.
            </CardContent>
          </Card>
        ) : (
          conteneursWithSpares.map((verification) => {
            const grouped = verification.spares.reduce<Record<string, typeof verification.spares>>(
              (acc, spare) => {
                const key = (spare as { statusVerification?: string }).statusVerification || "EN_ATTENTE";
                if (!acc[key]) acc[key] = [];
                acc[key].push(spare);
                return acc;
              },
              {} as Record<string, typeof verification.spares>
            );

            return (
              <Card key={verification.id} className="border-0 shadow-xl bg-white/85 backdrop-blur">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-sky-50 to-indigo-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Conteneur {verification.conteneur.conteneurNumber}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/60 px-3 py-1 text-emerald-700">
                          <Box className="h-4 w-4" />
                          {verification.conteneur.sealNumber}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100/60 px-3 py-1 text-sky-700">
                          <CalendarClock className="h-4 w-4" />
                          {formatDateTime(verification.createdAt)}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="border-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow">
                      {verification.spares.length} pièce(s)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(grouped).map(([status, spares]) => (
                    <div key={status} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-slate-800">
                          Statut: <span className="text-slate-900">{status}</span>
                        </div>
                        <Badge variant={statusVariant(status)} className="shadow-sm">
                          {spares.length}
                        </Badge>
                      </div>
                      <div className="rounded-xl border bg-white shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead>Code</TableHead>
                              <TableHead>Désignation</TableHead>
                              <TableHead>Quantité</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {spares.map((spare) => (
                              <TableRow key={spare.id} className="hover:bg-indigo-50/60">
                                <TableCell className="font-medium">{spare.partCode}</TableCell>
                                <TableCell>
                                  {spare.partNameFrench || spare.partName}
                                </TableCell>
                                <TableCell>{spare.quantity}</TableCell>
                                <TableCell>
                                  {spare.subcaseNumber
                                    ? `Subcase ${spare.subcaseNumber}`
                                    : "Commande"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(spare.statusVerification ?? "EN_ATTENTE")}>
                                    {spare.statusVerification ?? "EN_ATTENTE"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}