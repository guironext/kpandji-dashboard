"use client";

import React, { useMemo, useState, useEffect } from "react";
///import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StorageDialog from "@/components/StorageDialog";
import {
  PackageCheck,
  Archive,
  Search,
  CheckCircle2,
  Edit3,
  Package,
  X,
} from "lucide-react";

type SparePart = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  statusVerification: string;
  etapeSparePart: string;
  commande: {
    id: string;
    voitureModel: { model: string } | null;
    client: { nom: string } | null;
  } | null;
  voiture: {
    voitureModel: { model: string } | null;
  } | null;
  subcase: {
    subcaseNumber: string;
    conteneur: {
      conteneurNumber: string;
    } | null;
  } | null;
};

type Props = {
  spareParts: SparePart[];
};

const statusBadgeStyles: Record<string, string> = {
  RETROUVE: "bg-emerald-100 text-emerald-700",
  MODIFIE: "bg-amber-100 text-amber-700",
  NON_RETROUVE: "bg-rose-100 text-rose-700",
  EN_ATTENTE: "bg-slate-100 text-slate-700",
};

export default function StockageClient({ spareParts }: Props) {
  
  const [selectedSparePart, setSelectedSparePart] = useState<SparePart | null>(
    spareParts[0] || null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "RETROUVE" | "MODIFIE">(
    "ALL"
  );
  const [disabledButtons, setDisabledButtons] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem('disabledButtons');
    if (stored) {
      setDisabledButtons(new Set(JSON.parse(stored)));
    }
  }, []);

  const sparePartsCount = spareParts.length;

  const rows = useMemo(() => {
    return spareParts.map((sparePart) => {
      const source = sparePart.subcase
        ? `Sous-caisse ${sparePart.subcase.subcaseNumber}`
        : "Commande";
      const conteneurNumber = sparePart.subcase?.conteneur?.conteneurNumber || "—";
      const vehicleModel =
        sparePart.voiture?.voitureModel?.model ||
        sparePart.commande?.voitureModel?.model ||
        "—";
      const clientName = sparePart.commande?.client?.nom || "—";

      return {
        sparePart,
        source,
        conteneurNumber,
        vehicleModel,
        clientName,
      };
    });
  }, [spareParts]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter(({ sparePart, source, conteneurNumber, vehicleModel, clientName }) => {
      const matchesStatus =
        statusFilter === "ALL" || sparePart.statusVerification === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;
      const haystack = [
        sparePart.partCode,
        sparePart.partName,
        sparePart.partNameFrench || "",
        sparePart.statusVerification,
        source,
        conteneurNumber,
        vehicleModel,
        clientName,
        sparePart.quantity.toString(),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalQuantity = spareParts.reduce((sum, sp) => sum + sp.quantity, 0);
    const retrouveCount = spareParts.filter((sp) => sp.statusVerification === "RETROUVE").length;
    const modifieCount = spareParts.filter((sp) => sp.statusVerification === "MODIFIE").length;
    return {
      totalQuantity,
      retrouveCount,
      modifieCount,
    };
  }, [spareParts]);

  const openDialogFor = (sparePart: SparePart | null) => {
    if (!sparePart) return;
    setSelectedSparePart(sparePart);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50/40 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/60">
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/25 blur-2xl rounded-3xl"></div>
                <div className="relative p-3 rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-600 shadow-lg">
                  <Archive className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-semibold text-slate-900">
                  Stockage des pièces vérifiées
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Pièces retrouvées ou modifiées prêtes à être rangées
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => openDialogFor(selectedSparePart)}
              disabled={!selectedSparePart}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:from-indigo-700 hover:to-sky-700 shadow-lg"
            >
              <PackageCheck className="h-4 w-4" />
              Ranger
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Badge variant="outline" className="border-slate-200">
                {sparePartsCount}
              </Badge>
              <span>pièce{sparePartsCount > 1 ? "s" : ""} à ranger</span>
              <span className="text-slate-300">•</span>
              <span>Quantité totale: {stats.totalQuantity}</span>
              {selectedSparePart ? (
                <>
                  <span className="text-slate-300">•</span>
                  <span>
                    Sélection:{" "}
                    <span className="font-medium text-slate-700">
                      {selectedSparePart.partCode}
                    </span>
                  </span>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600/80">
                  Retrouvées
                </p>
                <p className="text-3xl font-semibold text-emerald-700">
                  {stats.retrouveCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 via-white to-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-600/80">
                  Modifiées
                </p>
                <p className="text-3xl font-semibold text-amber-700">
                  {stats.modifieCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100">
                <Edit3 className="h-5 w-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500/10 via-white to-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600/80">
                  À ranger
                </p>
                <p className="text-3xl font-semibold text-indigo-700">
                  {sparePartsCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-100">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Pièces prêtes pour le stockage</CardTitle>
                <p className="text-sm text-slate-500">
                  Filtrez rapidement par statut ou recherchez une pièce précise.
                </p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher code, nom, client, conteneur..."
                  className="pl-9 pr-10 bg-white"
                />
                {searchQuery ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-500 hover:text-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-2">
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ALL")}
                className={statusFilter === "ALL" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-white"}
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === "RETROUVE" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("RETROUVE")}
                className={
                  statusFilter === "RETROUVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white"
                }
              >
                Retrouvées
              </Button>
              <Button
                variant={statusFilter === "MODIFIE" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("MODIFIE")}
                className={
                  statusFilter === "MODIFIE" ? "bg-amber-600 hover:bg-amber-700" : "bg-white"
                }
              >
                Modifiées
              </Button>
              <Badge variant="outline" className="ml-auto border-slate-200 bg-white">
                {filteredRows.length} résultat{filteredRows.length > 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Aucune pièce trouvée pour les filtres sélectionnés.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map(
                      ({ sparePart, source, conteneurNumber, vehicleModel, clientName }) => (
                      <TableRow
                        key={sparePart.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                          selectedSparePart?.id === sparePart.id ? "bg-indigo-50/70" : ""
                        }`}
                        onClick={() => setSelectedSparePart(sparePart)}
                      >
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 font-semibold">
                            {sparePart.partCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          {sparePart.partNameFrench || sparePart.partName}
                        </TableCell>
                        <TableCell>{sparePart.quantity}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusBadgeStyles[sparePart.statusVerification] ||
                              statusBadgeStyles.EN_ATTENTE
                            }
                          >
                            {sparePart.statusVerification}
                          </Badge>
                        </TableCell>
                        <TableCell>{conteneurNumber}</TableCell>
                        <TableCell>{source}</TableCell>
                        <TableCell>{vehicleModel}</TableCell>
                        <TableCell>{clientName}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openDialogFor(sparePart)}
                            disabled={disabledButtons.has(sparePart.id)}
                          >
                            Ranger
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

      <StorageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sparePart={
          selectedSparePart
            ? {
                id: selectedSparePart.id,
                partCode: selectedSparePart.partCode,
                partName: selectedSparePart.partName,
                partNameFrench: selectedSparePart.partNameFrench,
                quantity: selectedSparePart.quantity,
                status: selectedSparePart.statusVerification,
                voiture: {
                  voitureModel:
                    selectedSparePart.voiture?.voitureModel ||
                    selectedSparePart.commande?.voitureModel ||
                    undefined,
                },
              }
            : null
        }
        onSuccess={async () => {
          if (selectedSparePart) {
            setDisabledButtons(prev => {
              const newSet = new Set(prev);
              newSet.add(selectedSparePart.id);
              localStorage.setItem('disabledButtons', JSON.stringify([...newSet]));
              return newSet;
            });
          }
        }}
      />
    </div>
  );
}
