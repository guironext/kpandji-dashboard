"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getClientsWithFacturesGroupedByYearMonth } from "@/lib/actions/client_entreprise";
import { formatNumberWithSpaces } from "@/lib/utils";
import * as XLSX from "xlsx";
import { 
  Calendar, 
  Building2, 
  FileText, 
  Car, 
  Loader2, 
  Printer, 
  Users,
  DollarSign,
  Package,
  MapPin,
  Phone,
  User,
  FileSpreadsheet,
  ArrowLeft
} from "lucide-react";

type FactureLigne = {
  id: string;
  voitureModelId: string;
  couleur: string;
  nbr_voiture: number;
  prix_unitaire: number;
  montant_ligne: number;
  transmission?: string;
  motorisation?: string;
  voitureModel: {
    model: string;
    image?: string;
    description?: string;
  } | null;
};

type Facture = {
  id: string;
  date_facture: Date | string;
  total_ttc: number;
  FactureLigne: FactureLigne[];
};

type Client = {
  id: string;
  nom_entreprise?: string;
  nom?: string;
  sigle?: string;
  telephone?: string;
  localisation?: string | null;
  commercial?: string | null;
  status_client: string;
  user?: unknown;
  isEntreprise?: boolean;
};

type GroupedData = Record<string, Record<string, Array<{
  client: unknown;
  facture: unknown;
}>>>;

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function ProspectsProformasPage() {
  const router = useRouter();
  const [groupedData, setGroupedData] = useState<GroupedData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const result = await getClientsWithFacturesGroupedByYearMonth();
        if (result.success && result.data) {
          setGroupedData(result.data as GroupedData);
        } else {
          setError(result.error || "Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate statistics
  const statistics = useMemo(() => {
    let totalFactures = 0;
    const totalClients = new Set<string>();
    let totalAmount = 0;
    let totalVehicles = 0;

    Object.values(groupedData).forEach((yearData) => {
      Object.values(yearData).forEach((items) => {
        items.forEach((item) => {
          const client = item.client as Client;
          const facture = item.facture as Facture;
          
          totalClients.add(client.id);
          totalFactures++;
          totalAmount += facture.total_ttc || 0;
          
          if (facture.FactureLigne) {
            facture.FactureLigne.forEach((ligne) => {
              totalVehicles += ligne.nbr_voiture || 0;
            });
          }
        });
      });
    });

    return {
      totalFactures,
      totalClients: totalClients.size,
      totalAmount,
      totalVehicles,
    };
  }, [groupedData]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrintMonth = (year: string, month: string) => {
    // Add a class to body to indicate single month print
    document.body.classList.add('printing-single-month');
    
    // Hide all other month cards
    const allCards = document.querySelectorAll('[data-month-card]');
    allCards.forEach((card) => {
      const cardElement = card as HTMLElement;
      if (cardElement.getAttribute('data-month-card') !== `${year}-${month}`) {
        cardElement.style.display = 'none';
      }
    });

    // Hide year headers for other years
    const allYearHeaders = document.querySelectorAll('[data-year-header]');
    allYearHeaders.forEach((header) => {
      const headerElement = header as HTMLElement;
      if (headerElement.getAttribute('data-year-header') !== year) {
        headerElement.style.display = 'none';
      }
    });

    // Print
    window.print();

    // Restore everything after printing
    setTimeout(() => {
      document.body.classList.remove('printing-single-month');
      allCards.forEach((card) => {
        (card as HTMLElement).style.display = '';
      });
      allYearHeaders.forEach((header) => {
        (header as HTMLElement).style.display = '';
      });
    }, 1000);
  };

  const handleExportToExcel = (year: string, month: string) => {
    const items = groupedData[year]?.[month] || [];
    const monthName = monthNames[parseInt(month) - 1];

    // Prepare data for Excel
    const excelData: (string | number)[][] = [];
    
    // Add header row
    excelData.push([
      "Client",
      "Sigle",
      "Téléphone",
      "Localisation",
      "Commercial",
      "Statut",
      "Date Facture",
      "Modèle",
      "Couleur",
      "Transmission",
      "Motorisation",
      "Quantité",
      "Prix Unitaire (FCFA)",
      "Montant Ligne (FCFA)",
      "Total Facture (FCFA)"
    ]);

    // Add data rows
    items.forEach((item) => {
      const client = item.client as Client;
      const facture = item.facture as Facture;
      const date = new Date(facture.date_facture);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      if (facture.FactureLigne && facture.FactureLigne.length > 0) {
        facture.FactureLigne.forEach((ligne, ligneIdx) => {
          excelData.push([
            client.nom_entreprise || client.nom || "",
            client.sigle || "",
            client.telephone || "",
            client.localisation || "",
            client.commercial || "",
            client.status_client === "CLIENT" ? "Client" : "Prospect",
            ligneIdx === 0 ? formattedDate : "", // Only show date on first line
            ligne.voitureModel?.model || "N/A",
            ligne.couleur || "",
            ligne.transmission || "",
            ligne.motorisation || "",
            ligne.nbr_voiture,
            ligne.prix_unitaire,
            ligne.montant_ligne,
            ligneIdx === 0 ? facture.total_ttc : "" // Only show total on first line
          ]);
        });
      } else {
        // If no facture lignes, add a row with facture info
        excelData.push([
          client.nom_entreprise || client.nom || "",
          client.sigle || "",
          client.telephone || "",
          client.localisation || "",
          client.commercial || "",
          client.status_client === "CLIENT" ? "Client" : "Prospect",
          formattedDate,
          "N/A",
          "",
          "",
          "",
          0,
          0,
          0,
          facture.total_ttc
        ]);
      }
    });

    // Calculate totals
    const monthTotal = items.reduce((sum, item) => {
      const facture = item.facture as Facture;
      return sum + (facture.total_ttc || 0);
    }, 0);

    // Add summary row
    excelData.push([]);
    excelData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTAL MOIS:",
      "",
      "",
      monthTotal
    ]);

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // Client
      { wch: 15 }, // Sigle
      { wch: 15 }, // Téléphone
      { wch: 20 }, // Localisation
      { wch: 15 }, // Commercial
      { wch: 12 }, // Statut
      { wch: 12 }, // Date Facture
      { wch: 25 }, // Modèle
      { wch: 12 }, // Couleur
      { wch: 15 }, // Transmission
      { wch: 15 }, // Motorisation
      { wch: 10 }, // Quantité
      { wch: 18 }, // Prix Unitaire
      { wch: 18 }, // Montant Ligne
      { wch: 18 }  // Total Facture
    ];
    ws['!cols'] = colWidths;

    // Style header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "FF6B35" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${year}`);

    // Generate filename
    const filename = `Rapport_${monthName}_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
          <p className="text-gray-600 text-lg font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Card className="max-w-md shadow-xl border-2 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const years = Object.keys(groupedData).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 landscape;
                margin: 1cm 1.5cm;
              }
              
              body * {
                visibility: hidden;
              }
              #printable-area,
              #printable-area * {
                visibility: visible;
              }
              #printable-area {
                position: absolute;
                padding: .5cm .5cm;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
              }
              [data-month-card] {
                visibility: visible !important;
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 2cm;
              }
              [data-month-card][style*="display: none"] {
                display: none !important;
                visibility: hidden !important;
              }
              [data-year-header][style*="display: none"] {
                display: none !important;
                visibility: hidden !important;
              }
              [data-year-header] {
                page-break-after: avoid;
                break-after: avoid;
              }
              .print-hide {
                display: none !important;
              }
              .print-show {
                display: block !important;
              }
              /* When printing single month, show year header */
              body.printing-single-month [data-year-header] {
                visibility: visible !important;
              }
              /* Table styling for print */
              table {
                width: 100%;
                border-collapse: collapse;
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
                break-inside: avoid;
                break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
              tbody {
                display: table-row-group;
              }
              /* Ensure table headers repeat on each page */
              thead tr {
                page-break-inside: avoid;
                page-break-after: avoid;
              }
              /* Page breaks for month cards */
              [data-month-card]:not([style*="display: none"]) {
                page-break-before: auto;
                page-break-after: auto;
                page-break-inside: avoid;
              }
              /* Ensure proper spacing */
              [data-month-card] + [data-month-card] {
                margin-top: 1.5cm;
              }
            }
          `,
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header Section */}
          <div className="print-hide">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push("/manager/departements")}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold shadow-sm px-4 py-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">Prospects et Clients</h1>
                    <p className="text-gray-600 mt-1 text-lg">Factures classées par année et mois</p>
                  </div>
                </div>
                <Button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg px-6 py-6 text-lg"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  IMPRIMER
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">Total Factures</p>
                      <p className="text-3xl font-bold text-blue-900">{statistics.totalFactures}</p>
                    </div>
                    <div className="bg-blue-200 p-3 rounded-xl">
                      <FileText className="h-8 w-8 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 text-sm font-medium mb-1">Total Clients</p>
                      <p className="text-3xl font-bold text-green-900">{statistics.totalClients}</p>
                    </div>
                    <div className="bg-green-200 p-3 rounded-xl">
                      <Users className="h-8 w-8 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-700 text-sm font-medium mb-1">Montant Total</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatNumberWithSpaces(statistics.totalAmount)} FCFA
                      </p>
                    </div>
                    <div className="bg-purple-200 p-3 rounded-xl">
                      <DollarSign className="h-8 w-8 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-700 text-sm font-medium mb-1">Total Véhicules</p>
                      <p className="text-3xl font-bold text-orange-900">{statistics.totalVehicles}</p>
                    </div>
                    <div className="bg-orange-200 p-3 rounded-xl">
                      <Package className="h-8 w-8 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Printable Content */}
          <div id="printable-area">
            {/* Print Header */}
            <div className="print-show hidden mb-6 pb-4 border-b-2 border-gray-300 p-3">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Prospects et Clients - Proformas</h1>
              <p className="text-gray-600">Rapport généré le {new Date().toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            {years.length === 0 ? (
              <Card className="shadow-xl">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 text-lg">Aucune donnée disponible</p>
                </CardContent>
              </Card>
            ) : (
              years.map((year) => {
                const months = Object.keys(groupedData[year]).sort((a, b) => parseInt(b) - parseInt(a));
                return (
                  <div key={year} className="mb-8" data-year-header={year}>
                    {/* Year Header */}
                    <div className="mb-4 print-hide" data-year-header={year}>
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-t-xl shadow-lg">
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                          <Calendar className="h-8 w-8" />
                          Année {year}
                        </h2>
                      </div>
                    </div>
                    
                    {/* Print Year Header */}
                    <div className="print-show hidden mb-4 pb-2 border-b-2 border-gray-400" data-year-header={year}>
                      <h2 className="text-2xl font-bold text-gray-900">Année {year}</h2>
                    </div>

                    {/* Each Month as Separate Card */}
                    {months.map((month) => {
                      const items = groupedData[year][month];
                      const monthName = monthNames[parseInt(month) - 1];
                      
                      // Calculate month statistics
                      const monthTotal = items.reduce((sum, item) => {
                        const facture = item.facture as Facture;
                        return sum + (facture.total_ttc || 0);
                      }, 0);
                      
                      return (
                        <Card 
                          key={`${year}-${month}`} 
                          data-month-card={`${year}-${month}`}
                          className="shadow-xl border-2 border-gray-200 mb-6 print:break-inside-avoid"
                        >
                          <CardHeader className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-b-4 border-orange-600">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                                <Calendar className="h-6 w-6" />
                                {monthName} {year}
                              </CardTitle>
                              <div className="flex items-center gap-4">
                                <Button
                                  onClick={() => handlePrintMonth(year, month)}
                                  className="print-hide bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 shadow-lg px-4 py-2 text-sm font-semibold"
                                  size="sm"
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Imprimer ce mois
                                </Button>
                                <Button
                                  onClick={() => handleExportToExcel(year, month)}
                                  className="print-hide bg-green-500/90 hover:bg-green-600 text-white border-2 border-green-400 shadow-lg px-4 py-2 text-sm font-semibold"
                                  size="sm"
                                >
                                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                                  Exporter Excel
                                </Button>
                                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
                                  {items.length} facture{items.length > 1 ? 's' : ''}
                                </Badge>
                                <div className="text-right bg-white/10 px-4 py-2 rounded-lg">
                                  <p className="text-xs text-white/90">Total du mois</p>
                                  <p className="text-xl font-bold text-white">
                                    {formatNumberWithSpaces(monthTotal)} FCFA
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200">
                                    <TableHead className="font-bold text-gray-800 text-base py-2">Client</TableHead>
                                    <TableHead className="font-bold text-gray-800 text-base py-2">Date</TableHead>
                                    <TableHead className="font-bold text-gray-800 text-base py-2">Modèle</TableHead>
                                    <TableHead className="font-bold text-gray-800 text-center text-base py-2">Quantité</TableHead>
                                    <TableHead className="font-bold text-gray-800 text-right text-base py-2">Prix Unitaire</TableHead>
                                    <TableHead className="font-bold text-gray-800 text-right text-base py-2">Montant Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {items.map((item, idx) => {
                                    const client = item.client as Client;
                                    const facture = item.facture as Facture;
                                    const date = new Date(facture.date_facture);
                                    const formattedDate = date.toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    });

                                    return (
                                      <React.Fragment key={`${facture.id}-${idx}`}>
                                        {facture.FactureLigne && facture.FactureLigne.length > 0 ? (
                                          facture.FactureLigne.map((ligne, ligneIdx) => (
                                            <TableRow 
                                              key={`${facture.id}-${ligne.id}-${ligneIdx}`}
                                              className={`${ligneIdx === 0 ? "bg-white" : "bg-gray-50"} hover:bg-orange-50 transition-colors border-b border-gray-200`}
                                            >
                                              {ligneIdx === 0 && (
                                                <>
                                                  <TableCell 
                                                    rowSpan={facture.FactureLigne.length}
                                                    className="font-medium text-gray-900 align-top p-4"
                                                  >
                                                    <div className="flex flex-col gap-2">
                                                      <div className="flex items-center gap-2">
                                                        <Building2 className="h-5 w-5 text-orange-600 flex-shrink-0" />
                                                        <span className="font-bold text-sm text-wrap max-w-md">
                                                          {client.nom_entreprise || client.nom || "N/A"}
                                                        </span>
                                                      </div>
                                                      {client.sigle && (
                                                        <span className="text-sm text-gray-600 ml-7">({client.sigle})</span>
                                                      )}
                                                      {client.telephone && (
                                                        <span className="text-sm text-gray:!0 ml-7 flex items-center gap-1.5">
                                                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                          {client.telephone}
                                                        </span>
                                                      )}
                                                      {client.localisation && (
                                                        <span className="text-sm text-gray-600 ml-7 flex items-center gap-1.5">
                                                          <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                                          <span className="font-medium ">{client.localisation}</span>
                                                        </span>
                                                      )}
                                                      {client.commercial && (
                                                        <span className="text-sm text-purple-600 ml-7 flex items-center gap-1.5">
                                                          <User className="h-3.5 w-3.5 text-purple-500" />
                                                          <span className="font-semibold w-min text-wrap text-xs">Commercial: {client.commercial}</span>
                                                        </span>
                                                      )}
                                                      <Badge 
                                                        variant={client.status_client === "CLIENT" ? "default" : "secondary"}
                                                        className={`w-fit ml-7 ${
                                                          client.status_client === "CLIENT" 
                                                            ? "bg-green-100 text-green-700 border-green-300" 
                                                            : "bg-blue-100 text-blue-700 border-blue-300"
                                                        }`}
                                                      >
                                                        {client.status_client === "CLIENT" ? "Client" : "Prospect"}
                                                      </Badge>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell 
                                                    rowSpan={facture.FactureLigne.length}
                                                    className="align-top p-4"
                                                  >
                                                    <div className="flex flex-col gap-2">
                                                      <span className="text-gray-900 font-semibold text-xs">{formattedDate}</span>
                                                      <span className="text-sm text-gray-600 font-medium">
                                                        Total: {formatNumberWithSpaces(facture.total_ttc)} FCFA
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                </>
                                              )}
                                              <TableCell className="p-4">
                                                <div className="flex items-center gap-2">
                                                  <div className="print-hide">
                                                    {ligne.voitureModel?.image ? (
                                                      <Image
                                                        src={ligne.voitureModel.image}
                                                        alt={ligne.voitureModel.model || "Vehicle"}
                                                        width={80}
                                                        height={50}
                                                        className="rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                                                      />
                                                    ) : (
                                                      <div className="w-24 h-18 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300">
                                                        <Car className="h-8 w-8 text-gray-400" />
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex flex-col gap-2 flex-1">
                                                    <span className="font-bold text-gray-900 text-sm">
                                                      {ligne.voitureModel?.model || "N/A"}
                                                    </span>
                                                    {ligne.voitureModel?.description && (
                                                      <p className="text-xs text-gray-600 text-wrap max-w-md leading-relaxed">
                                                        {ligne.voitureModel.description}
                                                      </p>
                                                    )}
                                                    <div className="flex gap-2 flex-wrap">
                                                      {ligne.couleur && (
                                                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                                                          Couleur: {ligne.couleur}
                                                        </Badge>
                                                      )}
                                                      {ligne.transmission && (
                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                                          {ligne.transmission}
                                                        </Badge>
                                                      )}
                                                      {ligne.motorisation && (
                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                                          {ligne.motorisation}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-center text-gray-900 font-bold text-sm p-4">
                                                {ligne.nbr_voiture}
                                              </TableCell>
                                              <TableCell className="text-right text-gray-900 font-semibold text-sm py-4">
                                                {formatNumberWithSpaces(ligne.prix_unitaire)} FCFA
                                              </TableCell>
                                              <TableCell className="text-right text-gray-900 font-bold text-sm py-4">
                                                {formatNumberWithSpaces(ligne.montant_ligne)} FCFA
                                              </TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500 p-8">
                                              <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                                <span>Aucune ligne de facture disponible</span>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
   );
}
