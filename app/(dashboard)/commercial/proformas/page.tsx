"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFacturesByUser, deleteFacture } from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { getUserSignature } from "@/lib/actions/signature";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

const numberToFrench = (num: number): string => {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

  if (num === 0) return "zéro";
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) return tens[ten - 1] + "-" + teens[unit];
    return tens[ten] + (unit ? "-" + units[unit] : "");
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    return (hundred > 1 ? units[hundred] + " " : "") + "cent" + (hundred > 1 && rest === 0 ? "s" : "") + (rest ? " " + numberToFrench(rest) : "");
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    return (thousand > 1 ? numberToFrench(thousand) + " " : "") + "mille" + (rest ? " " + numberToFrench(rest) : "");
  }
  if (num < 1000000000) {
    const million = Math.floor(num / 1000000);
    const rest = num % 1000000;
    return numberToFrench(million) + " million" + (million > 1 ? "s" : "") + (rest ? " " + numberToFrench(rest) : "");
  }
  const milliard = Math.floor(num / 1000000000);
  const rest = num % 1000000000;
  return numberToFrench(milliard) + " milliard" + (milliard > 1 ? "s" : "") + (rest ? " " + numberToFrench(rest) : "");
};

type Facture = {
  id: string;
  date_facture: string;
  date_echeance: string;
  status_facture: string;
  nbr_voiture_commande: number;
  prix_unitaire: number;
  montant_ht: number;
  total_ht: number;
  remise: number;
  montant_remise: number;
  montant_net_ht: number;
  tva: number;
  montant_tva: number;
  total_ttc: number;
  avance_payee: number;
  reste_payer: number;
  accessoire_nom?: string | null;
  accessoire_description?: string | null;
  accessoire_prix?: number | null;
  accessoire_nbr?: number | null;
  accessoire_subtotal?: number | null;
  clientId?: string | null;
  clientEntrepriseId?: string | null;
  client: {
    nom: string;
    telephone?: string;
    entreprise?: string;
    localisation?: string;
    commercial?: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
    telephone?: string;
    localisation?: string;
    commercial?: string;
  } | null;
  voiture: {
    voitureModel: {
      model: string;
      image?: string;
      description?: string;
    } | null;
  } | null;
  lignes?: Array<{
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
  }>;
  accessoires?: Array<{
    id: string;
    nom: string;
    description?: string;
    prix: number;
    quantity?: number;
    image?: string;
  }>;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    telephone?: string;
  } | null;
};

function getAccessoireImage(
  accessoireNom: string | null | undefined,
  accessoiresList: Array<{ id: string; nom: string; image?: string | null }>
) {
  if (!accessoireNom) return null;
  const name = accessoireNom.split(",")[0]?.split(" (x")[0]?.trim();
  const matched = accessoiresList.find((acc) => acc.nom === name);
  return matched?.image || null;
}

function getAccessoirePrice(
  accessoireNom: string,
  prix: number | null | undefined,
  accessoiresList: Array<{ id: string; nom: string; prix?: number | null }>
): number {
  // If prix is already set and valid, use it
  if (prix !== null && prix !== undefined && prix > 0) {
    return prix;
  }
  // Otherwise, try to find it from the master accessoires list
  const matched = accessoiresList.find((acc) => acc.nom === accessoireNom);
  return matched?.prix || 0;
}

export default function Page() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;
  const [factures, setFactures] = useState<Facture[]>([]);
  const [accessoires, setAccessoires] = useState<Array<{ id: string; nom: string; prix?: number | null; image?: string | null }>>([]);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const paginationScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!clerkId) return;
      
      console.log("=== FETCHING DATA ===");
      const [facturesResult, accessoiresResult] = await Promise.all([
        getFacturesByUser(clerkId),
        getAllAccessoires(),
      ]);
      
      console.log("Factures result:", facturesResult);
      console.log("Accessoires result:", accessoiresResult);
      
      if (facturesResult.success && facturesResult.data) {
        console.log("Factures with accessoires:", JSON.stringify(facturesResult.data.map(f => ({
          id: f.id,
          accessoires: f.accessoires
        })), null, 2));
        setFactures(facturesResult.data as Facture[]);
      }
      if (accessoiresResult.success && accessoiresResult.data) {
        console.log("All accessoires:", JSON.stringify(accessoiresResult.data, null, 2));
        setAccessoires(accessoiresResult.data.map(acc => ({
          id: acc.id,
          nom: acc.nom,
          prix: acc.prix ?? null,
          image: acc.image || null,
        })));
      }
    };
    fetchData();
  }, [clerkId]);

  const totalPages = Math.ceil(factures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = factures.slice(startIndex, endIndex);

  const handlePrint = () => {
    const currentFacture = currentData[0];
    if (!currentFacture) {
      toast.error("Aucune facture à imprimer");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.");
      return;
    }

    // Get the lignes data
    const lignes = currentFacture.lignes && currentFacture.lignes.length > 0
      ? currentFacture.lignes
      : [{
          id: "1",
          voitureModelId: "",
          couleur: "",
          nbr_voiture: currentFacture.nbr_voiture_commande,
          prix_unitaire: currentFacture.prix_unitaire,
          montant_ligne: currentFacture.montant_ht,
          transmission: "",
          motorisation: "",
          voitureModel: currentFacture.voiture?.voitureModel || null,
        }];

    // Generate table rows for vehicles
    const vehicleRows = lignes.map((ligne, index) => {
      const vehicleImage = ligne.voitureModel?.image 
        ? `<img src="${ligne.voitureModel.image}" alt="${ligne.voitureModel.model || 'Vehicle'}" style="max-width: 110px; max-height: 90px; object-fit: contain;" />`
        : "N/A";
      
      const colorInfo = ligne.couleur 
        ? `<div style="font-size: 8px; color: #92400e;">Couleur: ${ligne.couleur}${ligne.transmission ? ` Transmission: ${ligne.transmission}` : ''}${ligne.motorisation ? ` Motorisation: ${ligne.motorisation}` : ''}</div>`
        : '';

      return `
        <tr style="border-bottom: 1px solid #fed7aa;">
          <td style="padding: 5px; text-align: center; font-weight: 600;">${index + 1}</td>
          <td style="padding: 5px;">${vehicleImage}</td>
          <td style="padding: 5px;">
            <div style="font-size: 13px; font-weight: 600;">${ligne.voitureModel?.model || "N/A"}</div>
            <div style="font-size: 8px; margin-top: 4px;">${ligne.voitureModel?.description || "N/A"}</div>
            ${colorInfo}
          </td>
          <td style="padding: 5px; text-align: center; font-size: 13px;">${ligne.nbr_voiture}</td>
          <td style="padding: 5px; text-align: right; font-size: 13px;">${formatNumberWithSpaces(Number(ligne.prix_unitaire))}</td>
          <td style="padding: 5px; text-align: right; font-size: 13px; white-space: nowrap;">${formatNumberWithSpaces(Number(ligne.montant_ligne))}</td>
        </tr>
      `;
    }).join('');

    // Generate table rows for accessories
    let accessoryRows = '';
    if (currentFacture.accessoires && currentFacture.accessoires.length > 0) {
      accessoryRows = currentFacture.accessoires.map((accessoire, accIndex) => {
        const accessoirePrix = getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires);
        const accessoryImage = accessoire.image 
          ? `<img src="${accessoire.image}" alt="${accessoire.nom}" style="max-width: 100px; max-height: 80px; object-fit: contain;" />`
          : '<div style="font-size: 13px; color: #9ca3af;">Pas d\'image</div>';
        
        return `
          <tr style="border-bottom: 1px solid #fed7aa;">
            <td style="padding: 8px; text-align: center; font-weight: 600;">${lignes.length + accIndex + 1}</td>
            <td style="padding: 5px;">${accessoryImage}</td>
            <td style="padding: 5px;">
              <div style="font-size: 13px; font-weight: 600;">${accessoire.nom}</div>
              ${accessoire.description ? `<div style="font-size: 8px; margin-top: 4px; max-width: 320px;">${accessoire.description}</div>` : ''}
            </td>
            <td style="padding: 5px; text-align: center; font-size: 13px;">${accessoire.quantity || 1}</td>
            <td style="padding: 5px; text-align: right; font-size: 13px;">${formatNumberWithSpaces(accessoirePrix)}</td>
            <td style="padding: 5px; text-align: right; font-size: 13px; white-space: nowrap;">${formatNumberWithSpaces(accessoirePrix * (accessoire.quantity || 1))}</td>
          </tr>
        `;
      }).join('');
    } else if (currentFacture.accessoire_nom) {
      const imagePath = getAccessoireImage(currentFacture.accessoire_nom, accessoires);
      const accessoryImage = imagePath 
        ? `<img src="${imagePath}" alt="${currentFacture.accessoire_nom}" style="max-width: 100px; max-height: 80px; object-fit: contain;" />`
        : '<div style="font-size: 13px; color: #6b7280;">Pas d\'image</div>';
      
      accessoryRows = `
        <tr style="border-bottom: 1px solid #fed7aa;">
          <td style="padding: 5px; text-align: center; font-weight: 600;">${lignes.length + 1}</td>
          <td style="padding: 5px;">${accessoryImage}</td>
          <td style="padding: 5px;">
            <div style="font-size: 13px; font-weight: 600;">${currentFacture.accessoire_nom}</div>
            ${currentFacture.accessoire_description ? `<div style="font-size: 7px; margin-top: 4px; max-width: 320px;">${currentFacture.accessoire_description}</div>` : ''}
          </td>
          <td style="padding: 5px; text-align: center; font-size: 14px;">${currentFacture.accessoire_nbr || 1}</td>
          <td style="padding: 5px; text-align: right; font-size: 14px;">${((currentFacture.accessoire_prix || 0) / (currentFacture.accessoire_nbr || 1)).toLocaleString().replace(/,/g, " ")}</td>
          <td style="padding: 5px; text-align: right; font-size: 14px; white-space: nowrap;">${(currentFacture.accessoire_prix || 0).toLocaleString().replace(/,/g, " ")}</td>
        </tr>
      `;
    }

    // Signature image
    const signatureHtml = showSignature && signatureImage 
      ? `<img src="${signatureImage}" alt="Signature" style="width: 192px; height: 80px; object-fit: contain;" />`
      : '';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma - ${currentFacture.id.slice(-7)}</title>
          <meta charset="UTF-8">
          <meta name="color-scheme" content="light">
          <style>
            @page {
              size: A4;
              margin: 1mm 5mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            @page:first {
              margin-top: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
            }
            .page {
              page-break-after: always;
              min-height: 277mm;
              max-height: 277mm;
              display: flex;
              flex-direction: column;
              padding: 8mm;
              box-sizing: border-box;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .content-wrapper {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 4px solid #d97706;
              padding-bottom: 5px;
              margin-bottom: 5px;
              page-break-inside: avoid;
            }
            .header-left img {
              width: 100px;
              height: 50px;
              object-fit: contain;
            }
            .header-right {
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .header-right h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #000;
            }
            .header-right p {
              font-size: 14px;
              color: #374151;
              font-weight: 300;
              margin: 0;
            }
            .date-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
              font-size: 14px;
              font-weight: 600;
              color: #4b5563;
              page-break-inside: avoid;
            }
            .title-section {
              display: flex;
              justify-content: center;
              margin: 16px 0;
              page-break-inside: avoid;
            }
            .title-section h1 {
              font-size: 20px;
              font-weight: bold;
              color: #000;
              border: 1px solid #000;
              padding: 8px 16px;
              border-radius: 8px;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .info-left, .info-right {
              font-size: 24px;
              font-weight: 600;
              color: #000;
            }
            .info-item {
              display: flex;
              gap: 8px;
              font-size: 12px;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #111827;
            }
            .info-value {
              color: #374151;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            thead {
              display: table-header-group;
            }
            thead tr {
              background-color: #f0fdf4;
              border-bottom: 1px solid #000;
            }
            th {
              padding: 8px;
              text-align: left;
              font-weight: bold;
              color: #000;
              font-size: 14px;
            }
            th.text-center {
              text-align: center;
            }
            th.text-right {
              text-align: right;
            }
            tbody tr {
              border-bottom: 1px solid #fed7aa;
              page-break-inside: avoid;
            }
            tbody tr:last-child {
              page-break-after: auto;
            }
            td {
              padding: 8px;
              font-size: 14px;
              color: #000;
            }
            td.text-center {
              text-align: center;
            }
            td.text-right {
              text-align: right;
            }
            th:nth-child(6), td:nth-child(6) {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            tfoot {
              display: table-footer-group;
            }
            tfoot tr {
              background-color: #f0fdf4;
              page-break-inside: avoid;
            }
            tfoot td {
              padding: 8px;
              font-weight: 600;
            }
            .total-row {
              background-color: #f0fdf4;
              font-weight: 600;
              text-transform: uppercase;
            }
            .amount-text {
              font-size: 14px;
              font-weight: 300;
              color: #000;
              margin-top: 16px;
              page-break-inside: avoid;
            }
            .amount-text span {
              font-weight: 600;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              padding: 0 32px;
              page-break-inside: avoid;
            }
            .signature-right {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }
            .signature-label {
              font-weight: bold;
              font-size: 14px;
              text-transform: uppercase;
              color: #000;
            }
            .notes-section {
              margin-top: 15px;
              font-size: 8px;
              page-break-inside: avoid;
            }
            .notes-section p {
              margin: 4px 0;
            }
            .notes-title {
              font-weight: bold;
              color: #2563eb;
            }
            .footer {
              margin-top: auto;
              padding: 0;
              margin-bottom: 0;
              margin-left: 0;
              margin-right: 0;
              page-break-inside: avoid;
            }
            .footer-conditions {
              margin: 0;
              padding: 0;
            }
            .footer-conditions-title {
              font-weight: bold;
              color: #ea580c;
              margin: 0;
              padding: 0;
            }
            .footer-conditions p {
              color: #000;
              margin: 0;
              padding: 0;
              font-size: 8px;
            }
            .footer-info {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #f0fdf4;
              border-top: 1px solid #000;
              font-size: 8px;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .page-number {
              display: none !important;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .page {
                page-break-after: always;
                min-height: 277mm;
                max-height: 277mm;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .page:last-child {
                page-break-after: auto;
              }
              thead tr {
                background-color: #f0fdf4 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              tfoot tr {
                background-color: #f0fdf4 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .total-row {
                background-color: #f0fdf4 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .footer {
                padding: 0 !important;
                margin: 0 !important;
              }
              .footer-conditions {
                padding: 0 !important;
                margin: 0 !important;
              }
              .footer-conditions-title {
                padding: 0 !important;
                margin: 0 !important;
                color: #ea580c !important;
              }
              .footer-conditions p {
                padding: 0 !important;
                margin: 0 !important;
              }
              .footer-info {
                background-color: #f0fdf4 !important;
                border-top-color: #000 !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .header {
                border-bottom-color: #d97706 !important;
                border-bottom-width: 4px !important;
                border-bottom-style: solid !important;
              }
              .title-section h1 {
                border-color: #000 !important;
                color: #000 !important;
              }
              thead tr {
                border-bottom-color: #000 !important;
              }
              tbody tr {
                border-bottom-color: #fed7aa !important;
              }
              .notes-title {
                color: #2563eb !important;
              }
              img {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
              }
              .page {
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 0 auto 15px;
                max-width: 210mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="content-wrapper">
              <div class="header">
                <div class="header-left">
                  <img src="${window.location.origin}/logo.png" alt="Logo" />
                </div>
                <div class="header-right">
                  <h1>KPANDJI AUTOMOBILES</h1>
                  <p>Constructeur et Assembleur Automobile</p>
                </div>
              </div>

              <div class="date-section">
                <div style="display: flex; gap: 8px;">
                  <span>Date:</span>
                  <span>${new Date(currentFacture.date_facture).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="title-section">
                <h1>FACTURE ${currentFacture.status_facture}</h1>
              </div>

              <div class="info-section">
                <div class="info-left">
                  <div class="info-item">
                    <span class="info-label">Numéro de Proforma:</span>
                    <span class="info-value" style="text-transform: uppercase;">${currentFacture.id.slice(-7)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Créé par:</span>
                    <span class="info-value">${currentFacture.user?.firstName} ${currentFacture.user?.lastName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Contact:</span>
                    <span class="info-value">${currentFacture.user?.email}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Téléphone:</span>
                    <span class="info-value">${currentFacture.user?.telephone || 'N/A'}</span>
                  </div>
                </div>
                <div class="info-right">
                  <div class="info-item">
                    <span class="info-label">Client:</span>
                    <span class="info-value">${currentFacture.client?.nom || currentFacture.clientEntreprise?.nom_entreprise}</span>
                  </div>
                  ${currentFacture.client?.entreprise ? `
                  <div class="info-item">
                    <span class="info-label">Entreprise:</span>
                    <span class="info-value">${currentFacture.client.entreprise}</span>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <span class="info-label">Téléphone:</span>
                    <span class="info-value">${currentFacture.client?.telephone || currentFacture.clientEntreprise?.telephone || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Localisation:</span>
                    <span class="info-value">${currentFacture.client?.localisation || currentFacture.clientEntreprise?.localisation || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Véhicule</th>
                    <th>Description</th>
                    <th class="text-center">Quantité</th>
                    <th class="text-right" style="white-space: nowrap;">Prix Unitaire HT</th>
                    <th class="text-right" style="white-space: nowrap;">Total HT FCFA</th>
                  </tr>
                </thead>
                <tbody>
                  ${vehicleRows}
                  ${accessoryRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4"></td>
                    <td class="text-right" style="font-weight: 600;">Total HT</td>
                    <td class="text-right" style="font-weight: 600; white-space: nowrap;">${formatNumberWithSpaces(currentFacture.total_ht)}</td>
                  </tr>
                  ${currentFacture.remise !== 0 ? `
                  <tr>
                    <td colspan="4"></td>
                    <td class="text-right">Remise (${currentFacture.remise}%)</td>
                    <td class="text-right" style="white-space: nowrap;">${formatNumberWithSpaces(currentFacture.montant_remise)}</td>
                  </tr>
                  <tr>
                    <td colspan="4"></td>
                    <td class="text-right" style="font-weight: 600;">Montant Net HT</td>
                    <td class="text-right" style="font-weight: 600; white-space: nowrap;">${formatNumberWithSpaces(currentFacture.montant_net_ht)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="4"></td>
                    <td class="text-right">TVA(${currentFacture.tva}%)</td>
                    <td class="text-right" style="white-space: nowrap;">${formatNumberWithSpaces(currentFacture.montant_tva)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4"></td>
                    <td class="text-right" style="font-weight: 600; text-transform: uppercase;">Total TTC</td>
                    <td class="text-right" style="font-weight: 600; white-space: nowrap;">${formatNumberWithSpaces(currentFacture.total_ttc)}</td>
                  </tr>
                </tfoot>
              </table>

              <div class="amount-text">
                Arrêter la présente facture à la somme de <span>${numberToFrench(Math.floor(currentFacture.total_ttc))} francs CFA</span>
              </div>

              <div class="signature-section">
                <div></div>
                <div class="signature-right">
                  <div class="signature-label">Direction Commerciale</div>
                  ${signatureHtml}
                </div>
              </div>

              <div class="notes-section">
                <p class="notes-title">Notes</p>
                <p style="font-weight: 500;">date d'échéance: ${new Date(currentFacture.date_echeance).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="footer">
              <div class="footer-conditions">
                <p class="footer-conditions-title">CONDITIONS:</p>
                <p>60% d'accompte à la commande</p>
                <p style="font-weight: 300;">DELAIS DE PRODUCTION ET DE LIVRAISON: 4 MOIS</p>
                <p>SOLDE à la livraison</p>
              </div>
              <div class="footer-info">
                <p>Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03</p>
                <p>Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 – ECOBANK : CI059 01046 121659429001 46</p>
                <p>kpandjiautomobiles@gmail.com / www.kpandji.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.addEventListener('load', () => {
      // Wait for all images to load
      const images = printWindow.document.querySelectorAll('img');
      let imagesLoaded = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        setTimeout(() => {
          printWindow.print();
        }, 500);
        return;
      }
      
      images.forEach((img) => {
        if (img.complete) {
          imagesLoaded++;
        } else {
          img.addEventListener('load', () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
              setTimeout(() => {
                printWindow.print();
              }, 500);
            }
          });
          img.addEventListener('error', () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
              setTimeout(() => {
                printWindow.print();
              }, 500);
            }
          });
        }
      });
      
      if (imagesLoaded === totalImages) {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    });
  };
  
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Calculate which 9 pages to show
  const getVisiblePages = () => {
    const maxVisible = 9;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // Scroll to current page when it changes
  useEffect(() => {
    if (paginationScrollRef.current) {
      const pageElement = paginationScrollRef.current.querySelector(`[data-page="${currentPage}"]`) as HTMLElement;
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentPage]);

  const handleDelete = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture || !clerkId) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer cette facture (${currentFacture.id.slice(-7)}) ?`)) {
      const result = await deleteFacture(currentFacture.id);
      if (result.success) {
        toast.success("Facture supprimée avec succès");
        const updatedFactures = await getFacturesByUser(clerkId);
        if (updatedFactures.success && updatedFactures.data) {
          setFactures(updatedFactures.data as Facture[]);
          if (currentPage > Math.ceil(updatedFactures.data.length / itemsPerPage)) {
            setCurrentPage(Math.max(1, Math.ceil(updatedFactures.data.length / itemsPerPage)));
          }
        }
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleSignature = async () => {
    if (showSignature) {
      setShowSignature(false);
      return;
    }

    const result = await getUserSignature();
    if (result.success && result.data) {
      setSignatureImage(result.data.image);
      setShowSignature(true);
      toast.success("Signature ajoutée au proforma");
    } else {
      toast.error("Aucune signature trouvée. Veuillez d'abord créer votre signature.");
      router.push("./signature");
    }
  };

  return (
    <>
     

      <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="bg-white rounded-lg shadow-2xl p-2">
          <div className="flex w-full justify-between mb-6 print-hide">
            <div className="flex gap-4">
              <Button onClick={() => router.push("./creerFacture")} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg">
                CREER PROFORMA
              </Button>

              <Button onClick={handlePrint} disabled={currentData.length === 0} className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50">
                IMPRIMER
              </Button>
              
              <Button onClick={() => { const currentFacture = currentData[0]; if (currentFacture) router.push(`./creerFacture?id=${currentFacture.id}&mode=edit`); }} disabled={currentData.length === 0} className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50">
                MODIFIER
              </Button>
              <Button onClick={handleDelete} disabled={currentData.length === 0} className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50">
                SUPPRIMER
              </Button>
              <Button onClick={handleSignature} disabled={currentData.length === 0} className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50">
                {showSignature ? "RETIRER SIGNATURE" : "SIGNER"}
              </Button>
            </div>
          </div>

          <div id="printable-area">
            <div className="flex w-full justify-between border-b-4 border-amber-600 pb-4 mb-3">
              <div>
                <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
              </div>
              <div className="flex flex-col justify-center -mb-14">
                <h1 className="text-2xl font-bold text-black">KPANDJI AUTOMOBILES</h1>
                <p className="text-sm text-black font-normal">Constructeur et Assembleur Automobile</p>
              </div>
            </div>

            {currentData.map((facture: Facture) => (
              <div key={facture.id}>
                <div className="flex items-end mt-12 justify-between w-full text-sm font-semibold text-gray-600 gap-x-2">
                  <div></div>
                  <div className="flex text-sm text-black gap-x-2">
                    <p>Date:</p>
                    <p>{new Date(facture.date_facture).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex w-full justify-center my-4">
                  <h1 className="text-xl font-bold text-black border border-black px-4 py-2 rounded-lg">
                    FACTURE {facture.status_facture}
                  </h1>
                </div>

                <div className="flex w-full justify-between mb-10">
                  <div className="text-black font-semibold text-2xl">
                    <div className="flex text-xs text-black gap-x-2 font-bold">
                      <p>Numéro de Proforma:</p>
                      <p className="uppercase">{facture.id.slice(-7)}</p>
                    </div>
                    <div className="flex text-xs text-black gap-x-2">
                      <p>Créé par:</p>
                      <p>{facture.user?.firstName} {facture.user?.lastName}</p>
                    </div>
                    <div className="flex text-xs text-black gap-x-2">
                      <p>Contact:</p>
                      <p>{facture.user?.email}</p>
                    </div>
                    <div className="flex text-xs text-black gap-x-2">
                      <p>Téléphone:</p>
                      <p>{facture.user?.telephone}</p>
                    </div>
                  </div>

                  <div className="text-black font-semibold text-2xl">
                    <div className="flex text-sm font-semibold gap-2">
                      <p>Client:</p>
                      <p>{facture.client?.nom || facture.clientEntreprise?.nom_entreprise}</p>
                    </div>
                    <div className="flex text-xs text-black gap-x-2">
                      {facture.client?.entreprise && (
                        <>
                          <p>Entreprise:</p>
                          <p>{facture.client.entreprise}</p>
                        </>
                      )}
                    </div>
                    <div className="flex text-xs text-black gap-x-2">
                      <p>Téléphone:</p>
                      <p>{facture.client?.telephone || facture.clientEntreprise?.telephone}</p>
                    </div>
                    <div className="flex text-xs text-black gap-x-2">
                      <p>Localisation:</p>
                      <p>{facture.client?.localisation || facture.clientEntreprise?.localisation}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Table className="rounded-lg overflow-hidden">
                    <TableHeader>
                      <TableRow className="bg-green-50 border-b border-black">
                        <TableHead className="text-black font-bold">#</TableHead>
                        <TableHead className="text-black font-bold">Véhicule</TableHead>
                        <TableHead className="text-black font-bold">Description</TableHead>
                        <TableHead className="text-black font-bold text-center">Quantité</TableHead>
                        <TableHead className="text-black font-bold text-right no-wrap">Prix Unitaire HT FCFA</TableHead>
                        <TableHead className="text-right text-black font-bold no-wrap">Total HT FCFA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((factureItem) => {
                        const lignes = factureItem.lignes && factureItem.lignes.length > 0
                          ? factureItem.lignes
                          : [{
                              id: "1",
                              voitureModelId: "",
                              couleur: "",
                              nbr_voiture: factureItem.nbr_voiture_commande,
                              prix_unitaire: factureItem.prix_unitaire,
                              montant_ligne: factureItem.montant_ht,
                              transmission: "",
                              motorisation: "",
                              voitureModel: factureItem.voiture?.voitureModel || null,
                            }];

                        return lignes.map((ligne, index) => (
                          <TableRow key={`${factureItem.id}-${ligne.id}`} className={index % 2 === 0 ? "bg-white border-b border-orange-200" : "bg-white hover:bg-orange-50 border-b border-orange-200"}>
                            <TableCell className="text-black font-semibold">{index + 1}</TableCell>
                            <TableCell className="text-black">
                              {ligne.voitureModel?.image ? (
                                <Image 
                                  src={ligne.voitureModel.image} 
                                  alt={ligne.voitureModel.model || "Vehicle"} 
                                  width={110} 
                                  height={90}
                                  unoptimized
                                  className="object-contain"
                                />
                              ) : "N/A"}
                            </TableCell>
                            <TableCell className="text-black flex flex-col gap-y-1 text-lg font-semibold">
                              {ligne.voitureModel?.model || "N/A"}
                              <p className="text-[10px] font-normal text-black w-full text-wrap max-w-80 ">{ligne.voitureModel?.description || "N/A"}</p>
                              {ligne.couleur && (
                                <div className="flex  gap-x-1">
                                  <p className="text-[10px] font-normal text-amber-700">Couleur: {ligne.couleur}</p>
                                  {ligne.transmission && <p className="text-[10px] font-normal text-amber-700">Transmission: {ligne.transmission}</p>}
                                  {ligne.motorisation && <p className="text-[10px] font-normal text-amber-700">Motorisation: {ligne.motorisation}</p>}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-black text-center text-sm">{ligne.nbr_voiture}</TableCell>
                            <TableCell className="text-right text-black text-sm no-wrap">{formatNumberWithSpaces(Number(ligne.prix_unitaire))}</TableCell>
                            <TableCell className="text-black text-right text-sm pr-6 no-wrap">{formatNumberWithSpaces(Number(ligne.montant_ligne))}</TableCell>
                          </TableRow>
                        ));
                      })}

                      {facture.accessoires && facture.accessoires.length > 0 && facture.accessoires.map((accessoire, accIndex) => {
                        const accessoirePrix = getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires);
                        console.log(`Rendering accessoire ${accIndex}:`, {
                          id: accessoire.id,
                          nom: accessoire.nom,
                          prix: accessoire.prix,
                          calculatedPrix: accessoirePrix,
                          quantity: accessoire.quantity,
                          image: accessoire.image,
                          hasImage: !!accessoire.image
                        });
                        return (
                        <TableRow key={`${facture.id}-accessoire-${accessoire.id}`} className="bg-white border-b border-orange-200">
                          <TableCell className="text-black font-semibold">{(facture.lignes ? facture.lignes.length : 0) + accIndex + 1}</TableCell>
                          <TableCell className="text-black">
                            {accessoire.image ? (
                              <Image 
                                src={accessoire.image} 
                                alt={accessoire.nom || "Accessoire"} 
                                width={100} 
                                height={80}
                                unoptimized
                                className="object-contain"
                              />
                            ) : (
                              <div className="text-xs text-black">Pas d&apos;image</div>
                            )}
                          </TableCell>
                          <TableCell className="text-black flex flex-col gap-y-1 text-lg font-semibold">
                            {accessoire.nom}
                            {accessoire.description && <p className="text-[9px] font-normal text-black max-w-80 text-wrap">{accessoire.description}</p>}
                          </TableCell>
                          <TableCell className="text-black text-center text-sm">{accessoire.quantity || 1}</TableCell>
                          <TableCell className="text-right text-black text-sm">
                            {formatNumberWithSpaces(getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires))}
                          </TableCell>
                          <TableCell className="text-black text-right text-sm pr-6">
                            {formatNumberWithSpaces(getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires) * (accessoire.quantity || 1))}
                          </TableCell>
                        </TableRow>
                      );
                      })}
                      
                      {facture.accessoire_nom && (!facture.accessoires || facture.accessoires.length === 0) && (
                        <TableRow className="bg-white border-b border-orange-200">
                          <TableCell className="text-black font-semibold">{facture.lignes ? facture.lignes.length + 1 : 1}</TableCell>      
                          <TableCell className="text-black">
                            {(() => {
                              const imagePath = getAccessoireImage(facture.accessoire_nom, accessoires);
                              return imagePath ? (
                                <Image 
                                  src={imagePath} 
                                  alt={facture.accessoire_nom || "Accessoire"} 
                                  width={100} 
                                  height={80}
                                  unoptimized
                                  className="object-contain"
                                />
                              ) : (
                                <div className="text-xs text-gray-500">Pas d&apos;image</div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-black flex flex-col gap-y-1 text-lg font-semibold">
                            {facture.accessoire_nom}
                            {facture.accessoire_description && <p className="text-[7px] font-normal text-black max-w-80 text-wrap">{facture.accessoire_description}</p>}
                          </TableCell>
                          <TableCell className="text-black text-center text-sm">{facture.accessoire_nbr || 1}</TableCell>
                          <TableCell className="text-right text-black text-sm">{((facture.accessoire_prix || 0) / (facture.accessoire_nbr || 1)).toLocaleString().replace(/,/g, " ")}</TableCell>
                          <TableCell className="text-black text-right text-sm pr-6">{(facture.accessoire_prix || 0).toLocaleString().replace(/,/g, " ")}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter className="text-sm border-t border-b border-black mt-4">
                      <TableRow className="bg-green-50">
                        <TableCell colSpan={4}></TableCell>
                        <TableCell className="text-right text-black font-semibold">Total HT</TableCell>
                        <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.total_ht)}</TableCell>
                      </TableRow>
                      {facture.remise !== 0 && (      
                      <TableRow className="bg-white">
                        <TableCell colSpan={4}></TableCell>
                        <TableCell className="text-right text-black">Remise ({facture.remise}%)</TableCell>
                        <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.montant_remise)}</TableCell>
                      </TableRow>
                      )}
                      {facture.remise !== 0 && (
                      <TableRow className="bg-green-50">
                        <TableCell colSpan={4}></TableCell>
                        <TableCell className="text-right text-black">Montant Net HT</TableCell>
                        <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.montant_net_ht)}</TableCell>
                      </TableRow>
                      )}
                      <TableRow className="bg-white">
                        <TableCell colSpan={4}></TableCell>
                        <TableCell className="text-right text-black">TVA({facture.tva}%)</TableCell>
                        <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.montant_tva)}</TableCell>
                      </TableRow>
                      
                      <TableRow className="text-sm bg-green-50">
                        <TableCell colSpan={4}></TableCell>
                        <TableCell className="text-right text-black font-semibold uppercase">Total TTC</TableCell>
                        <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.total_ttc)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>

                  <div className="mt-4">
                    <p className="text-sm font-normal text-black">
                      Arrêter la présente facture à la somme de <span className="font-semibold">{numberToFrench(Math.floor(facture.total_ttc))} francs CFA</span>
                    </p>
                  </div>

                  <div className="flex w-full justify-between mt-5 px-8">
                    <div></div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-black font-bold text-sm uppercase">Direction Commerciale</div>
                      {showSignature && signatureImage && (
                        <div className="relative w-48 h-20 -mt-3">
                          <Image 
                            src={signatureImage} 
                            alt="Signature" 
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                      {showSignature && !signatureImage && (
                        <div className="text-xs text-gray-500 italic">Signature en cours de chargement...</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-full rounded-b-lg text-[9px] mt-6">
                  <div className="flex flex-col">
                    <p className="font-bold text-blue-600">Notes</p>
                    <p className="font-semibold">date d&apos;échéance: {new Date(facture.date_echeance).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
{/*footer*/}
            <div className="print-footer flex flex-col w-full bottom-0 right-0 left-0">
              <div className="flex flex-col w-full mb-2 rounded-b-lg text-[9px]">
                <p className="font-bold text-orange-600 mt-2">CONDITIONS:</p>
                <p className="text-black">60% d&apos;accompte à la commande</p>
                <p className="text-black font-semibold">DELAIS DE PRODUCTION ET DE LIVRAISON: 4 MOIS</p>
                <p className="text-black">SOLDE à la livraison</p>
              </div>
              <div className="flex flex-col items-center w-full justify-center bg-green-50 rounded-b-lg text-[10px] border-t border-black text-black">
                <p className="font-normal text-center">Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03</p>
                <p className="font-normal text-center">Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 – ECOBANK : CI059 01046 121659429001 46</p>
                <p className="font-normal text-center">kpandjiautomobiles@gmail.com / www.kpandji.com</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 mt-6 print-hide">
            <Button onClick={goToPrevPage} disabled={currentPage === 1} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold flex-shrink-0">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Page Précédente
            </Button>

            <div ref={paginationScrollRef} className="overflow-x-auto max-w-md scrollbar-hide scroll-smooth">
              <div className="flex items-center gap-2 min-w-max px-2">
                {getVisiblePages().map((pageNum) => (
                  <div 
                    key={pageNum} 
                    data-page={pageNum}
                    onClick={() => setCurrentPage(pageNum)} 
                    role="button" 
                    tabIndex={0} 
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCurrentPage(pageNum); }} 
                    className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer flex-shrink-0 ${currentPage === pageNum ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  >
                    {pageNum}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={goToNextPage} disabled={currentPage === totalPages} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold flex-shrink-0">
              Page Suivante
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}