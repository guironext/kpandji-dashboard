import React from "react";
import { notFound } from "next/navigation";
import { getRapportVerificationDetails } from "@/lib/actions/conteneur";
import {
  Card,
  CardContent,
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
import {
  ClipboardList,
  PackageCheck,
  Wrench,
  Box,
  CalendarClock,
} from "lucide-react";
import PrintButton from "./PrintButton";
import PrintStyles from "./PrintStyles";

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

export default async function RapportVerificationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRapportVerificationDetails(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const { verificationConteneur, createdAt } = result.data;
  const { conteneur, spares, tools, pieceComplements } = verificationConteneur as unknown as {
    conteneur: { conteneurNumber: string; etapeConteneur: string };
    spares: Array<{ id: string; partCode: string; partName: string; partNameFrench?: string | null; quantity?: number; subcaseNumber?: string | null; statusVerification?: string }>;
    tools: Array<{ id: string; toolCode: string; toolName: string; quantity: number; check?: boolean }>;
    pieceComplements: Array<{ id: string; partCode: string; partName: string; partNameFrench?: string; vehicleModel?: string; quantity: number }>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <PrintStyles />
      <div className="max-w-6xl mx-auto space-y-6" id="printable-area">
        <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Rapport de Vérification
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Conteneur {conteneur.conteneurNumber}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {formatDateTime(createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 print-hide">
                <Badge variant="outline" className="border-white/40 text-white">
                  {conteneur.etapeConteneur}
                </Badge>
                <PrintButton />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <PackageCheck className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pièces vérifiées</p>
                  <p className="text-2xl font-semibold text-slate-900">{spares.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Wrench className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outils vérifiés</p>
                  <p className="text-2xl font-semibold text-slate-900">{tools.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <Box className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pièces complémentaires</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {pieceComplements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Pièces de rechange</CardTitle>
            <Badge variant="secondary">{spares.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spares.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucune pièce enregistrée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    spares.map((spare) => (
                      <TableRow key={spare.id} className="hover:bg-slate-50/80">
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
                            {spare.statusVerification}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Outils</CardTitle>
            <Badge variant="secondary">{tools.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Vérifié</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucun outil enregistré.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tools.map((tool) => (
                      <TableRow key={tool.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium">{tool.toolCode}</TableCell>
                        <TableCell>{tool.toolName}</TableCell>
                        <TableCell>{tool.quantity}</TableCell>
                        <TableCell>
                          {tool.check ? (
                            <Badge variant="default">Oui</Badge>
                          ) : (
                            <Badge variant="outline">Non</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Pièces complémentaires</CardTitle>
            <Badge variant="secondary">{pieceComplements.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Modèle</TableHead>
                    <TableHead>Quantité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pieceComplements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucune pièce complémentaire enregistrée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pieceComplements.map((piece) => (
                      <TableRow key={piece.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium">{piece.partCode}</TableCell>
                        <TableCell>
                          {piece.partNameFrench || piece.partName}
                        </TableCell>
                        <TableCell>{piece.vehicleModel}</TableCell>
                        <TableCell>{piece.quantity}</TableCell>
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
