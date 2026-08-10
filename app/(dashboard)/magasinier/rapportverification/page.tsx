import React from "react";
import Link from "next/link";
import { getRapportVerifications } from "@/lib/actions/conteneur";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  PackageCheck,
  Wrench,
  Box,
  CalendarClock,
} from "lucide-react";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function RapportVerificationPage() {
  const result = await getRapportVerifications();
  const rapports = result.success && Array.isArray(result.data) ? result.data : [];
  const totalReports = rapports.length;
  const totalSpares = rapports.reduce(
    (sum, rapport) => sum + (rapport.verificationConteneur?.counts?.spares ?? 0),
    0
  );
  const totalTools = rapports.reduce(
    (sum, rapport) => sum + (rapport.verificationConteneur?.counts?.tools ?? 0),
    0
  );
  const totalComplements = rapports.reduce(
    (sum, rapport) => sum + (rapport.verificationConteneur?.counts?.pieceComplements ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/10">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">
                    Rapports de Vérification
                  </CardTitle>
                  <CardDescription className="text-slate-200">
                    Tableau de suivi complet des rapports de vérification
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-white/30 text-white">
                {totalReports} rapport{totalReports > 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-0 shadow-lg bg-white/10 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10">
                      <PackageCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">Pièces vérifiées</p>
                      <p className="text-2xl font-semibold">{totalSpares}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/10 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">Outils vérifiés</p>
                      <p className="text-2xl font-semibold">{totalTools}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/10 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10">
                      <Box className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">Compléments</p>
                      <p className="text-2xl font-semibold">{totalComplements}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des rapports</CardTitle>
                <CardDescription>
                  Cliquez sur un rapport pour consulter le détail complet
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                Mis à jour automatiquement
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapport</TableHead>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pièces</TableHead>
                    <TableHead>Outils</TableHead>
                    <TableHead>Compléments</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Aucun rapport de vérification disponible.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rapports.map((rapport) => (
                      <TableRow key={rapport.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium">
                          {rapport.id.slice(0, 8).toUpperCase()}
                        </TableCell>
<TableCell>{rapport.verificationConteneur?.conteneur?.conteneurNumber ?? '-'}</TableCell>
                          <TableCell>{formatDateTime(rapport.createdAt)}</TableCell>
                          <TableCell>{rapport.verificationConteneur?.counts?.spares ?? 0}</TableCell>
                          <TableCell>{rapport.verificationConteneur?.counts?.tools ?? 0}</TableCell>
                          <TableCell>{rapport.verificationConteneur?.counts?.pieceComplements ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm">
                            <Link href={`/magasinier/rapportverification/${rapport.id}`}>
                              Voir
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}