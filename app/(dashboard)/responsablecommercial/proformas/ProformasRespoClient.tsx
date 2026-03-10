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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { getProformas, deleteFacture } from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { getUserSignature } from "@/lib/actions/signature";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";

const numberToFrench = (num: number): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
    return "zéro";
  }
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

const escapeHtml = (value?: string | null) => {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const escapeAttr = (value?: string | null) => escapeHtml(value);

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
  client: { nom: string; telephone?: string; entreprise?: string; localisation?: string; commercial?: string } | null;
  clientEntreprise: { nom_entreprise: string; telephone?: string; localisation?: string; commercial?: string } | null;
  voiture: { voitureModel: { model: string; image?: string; description?: string } | null } | null;
  lignes?: Array<{
    id: string;
    voitureModelId: string;
    couleur: string;
    nbr_voiture: number;
    prix_unitaire: number;
    montant_ligne: number;
    transmission?: string;
    motorisation?: string;
    voitureModel: { model: string; image?: string; description?: string } | null;
  }>;
  accessoires?: Array<{ id: string; nom: string; description?: string; prix: number; quantity?: number; image?: string }>;
  user: { id: string; firstName: string; lastName: string; email: string; telephone?: string } | null;
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
  if (prix !== null && prix !== undefined && prix > 0) return prix;
  const matched = accessoiresList.find((acc) => acc.nom === accessoireNom);
  return matched?.prix || 0;
}

type CommercialGroup = {
  commercialId: string;
  commercialName: string;
  factures: Facture[];
};

export default function ProformasRespoClient() {
  const router = useRouter();
  const [commercialGroups, setCommercialGroups] = useState<CommercialGroup[]>([]);
  const [selectedCommercialId, setSelectedCommercialId] = useState<string>("");
  const [accessoires, setAccessoires] = useState<Array<{ id: string; nom: string; prix?: number | null; image?: string | null }>>([]);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [editedAmountTexts, setEditedAmountTexts] = useState<Record<string, string>>({});
  const [editingAmountText, setEditingAmountText] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;
  const paginationScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [proformasResult, accessoiresResult] = await Promise.all([
        getProformas(),
        getAllAccessoires(),
      ]);
      if (proformasResult.success && proformasResult.data) {
        const data = proformasResult.data as unknown as Facture[];
        const filtered = data.filter(
          (f) => f.status_facture?.toUpperCase() === "PROFORMA"
        );
        const groupsMap = new Map<string, CommercialGroup>();
        filtered.forEach((f) => {
          const userId = f.user?.id || "unknown";
          const userName = f.user
            ? `${f.user.firstName} ${f.user.lastName}`.trim()
            : "Non attribué";
          if (!groupsMap.has(userId)) {
            groupsMap.set(userId, { commercialId: userId, commercialName: userName, factures: [] });
          }
          groupsMap.get(userId)!.factures.push(f);
        });
        const groups = Array.from(groupsMap.values()).sort((a, b) =>
          a.commercialName.localeCompare(b.commercialName)
        );
        setCommercialGroups(groups);
        if (groups.length > 0 && !selectedCommercialId) {
          setSelectedCommercialId(groups[0].commercialId);
        }
      }
      if (accessoiresResult.success && accessoiresResult.data) {
        setAccessoires(
          accessoiresResult.data.map((acc: { id: string; nom: string; prix?: number | null; image?: string | null }) => ({
            id: acc.id,
            nom: acc.nom,
            prix: acc.prix ?? null,
            image: acc.image || null,
          }))
        );
      }
    };
    fetchData();
  }, []);

  const selectedGroup = commercialGroups.find((g) => g.commercialId === selectedCommercialId);
  const factures = selectedGroup?.factures ?? [];
  const totalPages = Math.ceil(factures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = factures.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCommercialId]);

  useEffect(() => {
    if (paginationScrollRef.current) {
      const pageElement = paginationScrollRef.current.querySelector(`[data-page="${currentPage}"]`) as HTMLElement;
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentPage]);

  const handlePrint = () => {
    const currentFacture = currentData[0];
    if (!currentFacture) {
      toast.error("Aucune facture à imprimer");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.");
      return;
    }
    const lignes =
      currentFacture.lignes && currentFacture.lignes.length > 0
        ? currentFacture.lignes
        : [
            {
              id: "1",
              voitureModelId: "",
              couleur: "",
              nbr_voiture: currentFacture.nbr_voiture_commande,
              prix_unitaire: currentFacture.prix_unitaire,
              montant_ligne: currentFacture.montant_ht,
              transmission: "",
              motorisation: "",
              voitureModel: currentFacture.voiture?.voitureModel || null,
            },
          ];
    const vehicleRows = lignes
      .map((ligne, index) => {
        const vehicleModelName = escapeHtml(ligne.voitureModel?.model || "N/A");
        const vehicleDescription = escapeHtml(ligne.voitureModel?.description || "N/A");
        const vehicleImage = ligne.voitureModel?.image
          ? `<img src="${escapeAttr(ligne.voitureModel.image)}" alt="${vehicleModelName}" style="max-width: 110px; max-height: 90px; object-fit: contain;" />`
          : "N/A";
        const colorInfo = ligne.couleur
          ? `<div style="font-size: 8px; color: #92400e;">Couleur: ${escapeHtml(ligne.couleur)}${ligne.transmission ? ` Transmission: ${escapeHtml(ligne.transmission)}` : ""}${ligne.motorisation ? ` Motorisation: ${escapeHtml(ligne.motorisation)}` : ""}</div>`
          : "";
        return `
          <tr style="border-bottom: 1px solid #fed7aa;">
            <td style="padding: 5px; text-align: center; font-weight: 600;">${index + 1}</td>
            <td style="padding: 5px;">${vehicleImage}</td>
            <td style="padding: 5px;">
              <div style="font-size: 13px; font-weight: 600;">${vehicleModelName}</div>
              <div style="font-size: 8px; margin-top: 4px;">${vehicleDescription}</div>
              ${colorInfo}
            </td>
            <td style="padding: 5px; text-align: center; font-size: 13px;">${ligne.nbr_voiture}</td>
            <td style="padding: 5px; text-align: right; font-size: 13px;">${formatNumberWithSpaces(Number(ligne.prix_unitaire))}</td>
            <td style="padding: 5px; text-align: right; font-size: 13px; white-space: nowrap;">${formatNumberWithSpaces(Number(ligne.montant_ligne))}</td>
          </tr>
        `;
      })
      .join("");
    let accessoryRows = "";
    if (currentFacture.accessoires && currentFacture.accessoires.length > 0) {
      accessoryRows = currentFacture.accessoires
        .map((accessoire, accIndex) => {
          const accessoirePrix = getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires);
          const accessoireName = escapeHtml(accessoire.nom);
          const accessoireDescription = escapeHtml(accessoire.description);
          const accessoryImage = accessoire.image
            ? `<img src="${escapeAttr(accessoire.image)}" alt="${accessoireName}" style="max-width: 100px; max-height: 80px; object-fit: contain;" />`
            : '<div style="font-size: 13px; color: #9ca3af;">Pas d\'image</div>';
          return `
            <tr style="border-bottom: 1px solid #fed7aa;">
              <td style="padding: 8px; text-align: center; font-weight: 600;">${lignes.length + accIndex + 1}</td>
              <td style="padding: 5px;">${accessoryImage}</td>
              <td style="padding: 5px;">
                <div style="font-size: 13px; font-weight: 600;">${accessoireName}</div>
                ${accessoire.description ? `<div style="font-size: 8px; margin-top: 4px; max-width: 320px;">${accessoireDescription}</div>` : ""}
              </td>
              <td style="padding: 5px; text-align: center; font-size: 13px;">${accessoire.quantity || 1}</td>
              <td style="padding: 5px; text-align: right; font-size: 13px;">${formatNumberWithSpaces(accessoirePrix)}</td>
              <td style="padding: 5px; text-align: right; font-size: 13px; white-space: nowrap;">${formatNumberWithSpaces(accessoirePrix * (accessoire.quantity || 1))}</td>
            </tr>
          `;
        })
        .join("");
    } else if (currentFacture.accessoire_nom) {
      const imagePath = getAccessoireImage(currentFacture.accessoire_nom, accessoires);
      const accessoireNom = escapeHtml(currentFacture.accessoire_nom);
      const accessoireDescription = escapeHtml(currentFacture.accessoire_description);
      const accessoryImage = imagePath
        ? `<img src="${escapeAttr(imagePath)}" alt="${accessoireNom}" style="max-width: 100px; max-height: 80px; object-fit: contain;" />`
        : '<div style="font-size: 13px; color: #6b7280;">Pas d\'image</div>';
      accessoryRows = `
        <tr style="border-bottom: 1px solid #fed7aa;">
          <td style="padding: 5px; text-align: center; font-weight: 600;">${lignes.length + 1}</td>
          <td style="padding: 5px;">${accessoryImage}</td>
          <td style="padding: 5px;">
            <div style="font-size: 13px; font-weight: 600;">${accessoireNom}</div>
            ${currentFacture.accessoire_description ? `<div style="font-size: 7px; margin-top: 4px; max-width: 320px;">${accessoireDescription}</div>` : ""}
          </td>
          <td style="padding: 5px; text-align: center; font-size: 14px;">${currentFacture.accessoire_nbr || 1}</td>
          <td style="padding: 5px; text-align: right; font-size: 14px;">${((currentFacture.accessoire_prix || 0) / (currentFacture.accessoire_nbr || 1)).toLocaleString().replace(/,/g, " ")}</td>
          <td style="padding: 5px; text-align: right; font-size: 14px; white-space: nowrap;">${(currentFacture.accessoire_prix || 0).toLocaleString().replace(/,/g, " ")}</td>
        </tr>
      `;
    }
    const signatureHtml =
      showSignature && signatureImage
        ? `<img src="${escapeAttr(signatureImage)}" alt="Signature" style="width: 192px; height: 80px; object-fit: contain;" />`
        : "";
    const factureId = escapeHtml(currentFacture.id.slice(-7));
    const factureStatus = escapeHtml(currentFacture.status_facture);
    const factureDate = escapeHtml(new Date(currentFacture.date_facture).toLocaleDateString());
    const createdByName = escapeHtml(`${currentFacture.user?.firstName || ""} ${currentFacture.user?.lastName || ""}`.trim()) || "N/A";
    const createdByEmail = escapeHtml(currentFacture.user?.email || "N/A");
    const createdByTelephone = escapeHtml(currentFacture.user?.telephone || "N/A");
    const clientName = escapeHtml(currentFacture.client?.nom || currentFacture.clientEntreprise?.nom_entreprise || "N/A");
    const clientEntrepriseName = currentFacture.client?.entreprise ? escapeHtml(currentFacture.client.entreprise) : "";
    const clientTelephone = escapeHtml(currentFacture.client?.telephone || currentFacture.clientEntreprise?.telephone || "N/A");
    const clientLocalisation = escapeHtml(currentFacture.client?.localisation || currentFacture.clientEntreprise?.localisation || "N/A");
    const dateEcheance = escapeHtml(new Date(currentFacture.date_echeance).toLocaleDateString());
    const amountText = escapeHtml(editedAmountTexts?.[currentFacture.id] || numberToFrench(Math.floor(currentFacture.total_ttc || 0)));

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma - ${factureId}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 1mm 5mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
            .page { page-break-after: always; min-height: 277mm; padding: 8mm; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #d97706; padding-bottom: 5px; margin-bottom: 5px; }
            .header-right h1 { font-size: 24px; font-weight: bold; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            thead tr { background-color: #f0fdf4; border-bottom: 1px solid #000; }
            th, td { padding: 8px; font-size: 14px; }
            tbody tr { border-bottom: 1px solid #fed7aa; }
            tfoot tr { background-color: #f0fdf4; }
            .total-row { background-color: #f0fdf4; font-weight: 600; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div><img src="${escapeAttr(typeof window !== "undefined" ? window.location.origin : "")}/logo.png" alt="Logo" style="width: 100px; height: 50px; object-fit: contain;" /></div>
              <div>
                <h1>KPANDJI AUTOMOBILES</h1>
                <p>Constructeur et Assembleur Automobile</p>
              </div>
            </div>
            <div style="text-align: right; margin-top: 20px;">Date: ${factureDate}</div>
            <div style="text-align: center; margin: 16px 0;"><h1 style="border: 1px solid #000; padding: 8px 16px; display: inline-block;">FACTURE ${factureStatus}</h1></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div>
                <div><strong>Numéro:</strong> ${factureId}</div>
                <div><strong>Créé par:</strong> ${createdByName}</div>
                <div><strong>Contact:</strong> ${createdByEmail}</div>
                <div><strong>Téléphone:</strong> ${createdByTelephone}</div>
              </div>
              <div>
                <div><strong>Client:</strong> ${clientName}</div>
                ${currentFacture.client?.entreprise ? `<div><strong>Entreprise:</strong> ${clientEntrepriseName}</div>` : ""}
                <div><strong>Téléphone:</strong> ${clientTelephone}</div>
                <div><strong>Localisation:</strong> ${clientLocalisation}</div>
              </div>
            </div>
            <table>
              <thead><tr><th>#</th><th>Véhicule</th><th>Description</th><th style="text-align: center;">Qté</th><th style="text-align: right;">Prix HT</th><th style="text-align: right;">Total HT</th></tr></thead>
              <tbody>${vehicleRows}${accessoryRows}</tbody>
              <tfoot>
                <tr><td colspan="4"></td><td style="text-align: right;">Total HT</td><td style="text-align: right;">${formatNumberWithSpaces(currentFacture.total_ht)}</td></tr>
                ${currentFacture.remise !== 0 ? `<tr><td colspan="4"></td><td style="text-align: right;">Remise (${currentFacture.remise}%)</td><td style="text-align: right;">${formatNumberWithSpaces(currentFacture.montant_remise)}</td></tr><tr><td colspan="4"></td><td style="text-align: right;">Montant Net HT</td><td style="text-align: right;">${formatNumberWithSpaces(currentFacture.montant_net_ht)}</td></tr>` : ""}
                <tr><td colspan="4"></td><td style="text-align: right;">TVA(${currentFacture.tva}%)</td><td style="text-align: right;">${formatNumberWithSpaces(currentFacture.montant_tva)}</td></tr>
                <tr class="total-row"><td colspan="4"></td><td style="text-align: right;">Total TTC</td><td style="text-align: right;">${formatNumberWithSpaces(currentFacture.total_ttc)}</td></tr>
              </tfoot>
            </table>
            <div style="margin-top: 16px;">Arrêter la présente facture à la somme de <strong>${amountText} francs CFA</strong></div>
            <div style="margin-top: 20px; text-align: right;">${signatureHtml}<div style="font-weight: bold;">Direction Commerciale</div></div>
            <div style="margin-top: 15px; font-size: 8px;"><strong>Notes</strong><br/>Date d'échéance: ${dateEcheance}</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      setTimeout(() => printWindow.print(), 500);
    });
  };

  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const getVisiblePages = () => {
    const maxVisible = 9;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handleDelete = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette facture (${currentFacture.id.slice(-7)}) ?`)) {
      const result = await deleteFacture(currentFacture.id);
      if (result.success) {
        toast.success("Facture supprimée avec succès");
        const proformasResult = await getProformas();
        if (proformasResult.success && proformasResult.data) {
          const data = proformasResult.data as unknown as Facture[];
          const filtered = data.filter((f) => f.status_facture?.toUpperCase() === "PROFORMA");
          const groupsMap = new Map<string, CommercialGroup>();
          filtered.forEach((f) => {
            const userId = f.user?.id || "unknown";
            const userName = f.user ? `${f.user.firstName} ${f.user.lastName}`.trim() : "Non attribué";
            if (!groupsMap.has(userId)) groupsMap.set(userId, { commercialId: userId, commercialName: userName, factures: [] });
            groupsMap.get(userId)!.factures.push(f);
          });
          setCommercialGroups(Array.from(groupsMap.values()).sort((a, b) => a.commercialName.localeCompare(b.commercialName)));
          const newFactures = groupsMap.get(selectedCommercialId)?.factures ?? [];
          if (currentPage > Math.ceil(newFactures.length / itemsPerPage)) {
            setCurrentPage(Math.max(1, Math.ceil(newFactures.length / itemsPerPage)));
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
      router.push("/commercial/signature");
    }
  };

  if (commercialGroups.length === 0) {
    return (
      <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          <p className="text-gray-600">Aucun proforma trouvé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="bg-white rounded-lg shadow-2xl p-2">
        <div className="flex w-full justify-between items-center mb-6 print-hide flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Commercial:</span>
              <Select value={selectedCommercialId} onValueChange={setSelectedCommercialId}>
                <SelectTrigger className="w-[220px] bg-white border-2 border-amber-500">
                  <SelectValue placeholder="Sélectionner un commercial" />
                </SelectTrigger>
                <SelectContent>
                  {commercialGroups.map((g) => (
                    <SelectItem key={g.commercialId} value={g.commercialId}>
                      {g.commercialName} ({g.factures.length} proforma{g.factures.length > 1 ? "s" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handlePrint}
              disabled={currentData.length === 0}
              className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50"
            >
              IMPRIMER
            </Button>
            <Button
              onClick={() => {
                const f = currentData[0];
                if (f) router.push(`/commercial/creerFacture?id=${f.id}&mode=edit`);
              }}
              disabled={currentData.length === 0}
              className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50"
            >
              MODIFIER
            </Button>
            <Button
              onClick={handleDelete}
              disabled={currentData.length === 0}
              className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50"
            >
              SUPPRIMER
            </Button>
            <Button
              onClick={handleSignature}
              disabled={currentData.length === 0}
              className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50"
            >
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

          {currentData.map((facture) => (
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
                  {facture.client?.entreprise && (
                    <div className="flex text-xs text-black gap-x-2">
                      <p>Entreprise:</p>
                      <p>{facture.client.entreprise}</p>
                    </div>
                  )}
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
                      <TableHead className="text-black font-bold text-right">Prix Unitaire HT FCFA</TableHead>
                      <TableHead className="text-right text-black font-bold">Total HT FCFA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(facture.lignes && facture.lignes.length > 0 ? facture.lignes : [
                      { id: "1", voitureModelId: "", couleur: "", nbr_voiture: facture.nbr_voiture_commande, prix_unitaire: facture.prix_unitaire, montant_ligne: facture.montant_ht, transmission: "", motorisation: "", voitureModel: facture.voiture?.voitureModel || null },
                    ]).map((ligne, index) => (
                      <TableRow key={`${facture.id}-${ligne.id}-${index}`} className="bg-white border-b border-orange-200">
                        <TableCell className="text-black font-semibold">{index + 1}</TableCell>
                        <TableCell className="text-black">
                          {ligne.voitureModel?.image ? (
                            <Image src={ligne.voitureModel.image} alt={ligne.voitureModel.model || "Vehicle"} width={110} height={90} unoptimized className="object-contain" />
                          ) : "N/A"}
                        </TableCell>
                        <TableCell className="text-black flex flex-col gap-y-1 text-lg font-semibold">
                          {ligne.voitureModel?.model || "N/A"}
                          <p className="text-[10px] font-normal text-black max-w-80">{ligne.voitureModel?.description || "N/A"}</p>
                          {ligne.couleur && (
                            <div className="flex gap-x-1">
                              <p className="text-[10px] font-normal text-amber-700">Couleur: {ligne.couleur}</p>
                              {ligne.transmission && <p className="text-[10px] font-normal text-amber-700">Transmission: {ligne.transmission}</p>}
                              {ligne.motorisation && <p className="text-[10px] font-normal text-amber-700">Motorisation: {ligne.motorisation}</p>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-black text-center text-sm">{ligne.nbr_voiture}</TableCell>
                        <TableCell className="text-right text-black text-sm">{formatNumberWithSpaces(Number(ligne.prix_unitaire))}</TableCell>
                        <TableCell className="text-black text-right text-sm pr-6">{formatNumberWithSpaces(Number(ligne.montant_ligne))}</TableCell>
                      </TableRow>
                    ))}
                    {facture.accessoires?.map((accessoire, accIndex) => (
                      <TableRow key={`${facture.id}-acc-${accessoire.id}`} className="bg-white border-b border-orange-200">
                        <TableCell className="text-black font-semibold">{(facture.lignes?.length || 0) + accIndex + 1}</TableCell>
                        <TableCell className="text-black">
                          {accessoire.image ? (
                            <Image src={accessoire.image} alt={accessoire.nom} width={100} height={80} unoptimized className="object-contain" />
                          ) : (
                            <div className="text-xs text-black">Pas d&apos;image</div>
                          )}
                        </TableCell>
                        <TableCell className="text-black flex flex-col gap-y-1 text-lg font-semibold">
                          {accessoire.nom}
                          {accessoire.description && <p className="text-[9px] font-normal text-black max-w-80">{accessoire.description}</p>}
                        </TableCell>
                        <TableCell className="text-black text-center text-sm">{accessoire.quantity || 1}</TableCell>
                        <TableCell className="text-right text-black text-sm">{formatNumberWithSpaces(getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires))}</TableCell>
                        <TableCell className="text-black text-right text-sm pr-6">{formatNumberWithSpaces(getAccessoirePrice(accessoire.nom, accessoire.prix, accessoires) * (accessoire.quantity || 1))}</TableCell>
                      </TableRow>
                    ))}
                    {facture.accessoire_nom && (!facture.accessoires || facture.accessoires.length === 0) && (
                      <TableRow className="bg-white border-b border-orange-200">
                        <TableCell className="text-black font-semibold">{(facture.lignes?.length || 0) + 1}</TableCell>
                        <TableCell className="text-black">
                          {(() => {
                            const img = getAccessoireImage(facture.accessoire_nom, accessoires);
                            return img ? <Image src={img} alt={facture.accessoire_nom || ""} width={100} height={80} unoptimized className="object-contain" /> : <div className="text-xs text-gray-500">Pas d&apos;image</div>;
                          })()}
                        </TableCell>
                        <TableCell className="text-black flex flex-col gap-y-1 text-lg font-semibold">
                          {facture.accessoire_nom}
                          {facture.accessoire_description && <p className="text-[7px] font-normal text-black max-w-80">{facture.accessoire_description}</p>}
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
                      <>
                        <TableRow className="bg-white">
                          <TableCell colSpan={4}></TableCell>
                          <TableCell className="text-right text-black">Remise ({facture.remise}%)</TableCell>
                          <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.montant_remise)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-green-50">
                          <TableCell colSpan={4}></TableCell>
                          <TableCell className="text-right text-black">Montant Net HT</TableCell>
                          <TableCell className="text-right font-medium pr-6 text-black">{formatNumberWithSpaces(facture.montant_net_ht)}</TableCell>
                        </TableRow>
                      </>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-normal text-black">Arrêter la présente facture à la somme de</p>
                    {editingAmountText === facture.id ? (
                      <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <Input
                          value={editedAmountTexts[facture.id] || numberToFrench(Math.floor(facture.total_ttc || 0))}
                          onChange={(e) => setEditedAmountTexts({ ...editedAmountTexts, [facture.id]: e.target.value })}
                          className="flex-1 text-sm font-semibold"
                          placeholder="Saisir la somme en lettres"
                          autoFocus
                        />
                        <Button size="sm" variant="outline" onClick={() => { setEditingAmountText(null); if (!editedAmountTexts[facture.id]) { const t = { ...editedAmountTexts }; delete t[facture.id]; setEditedAmountTexts(t); } }}>
                          Valider
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{editedAmountTexts[facture.id] || numberToFrench(Math.floor(facture.total_ttc || 0))} francs CFA</span>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingAmountText(facture.id); if (!editedAmountTexts[facture.id]) setEditedAmountTexts({ ...editedAmountTexts, [facture.id]: numberToFrench(Math.floor(facture.total_ttc || 0)) }); }} className="h-6 w-6 p-0">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full justify-between mt-5 px-8">
                  <div></div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-black font-bold text-sm uppercase">Direction Commerciale</div>
                    {showSignature && signatureImage && (
                      <div className="relative w-48 h-20 -mt-3">
                        <Image src={signatureImage} alt="Signature" fill className="object-contain" unoptimized />
                      </div>
                    )}
                    {showSignature && !signatureImage && <div className="text-xs text-gray-500 italic">Signature en cours de chargement...</div>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full rounded-b-lg text-[9px] mt-6">
                <p className="font-bold text-blue-600">Notes</p>
                <p className="font-semibold">date d&apos;échéance: {new Date(facture.date_echeance).toLocaleDateString()}</p>
              </div>
            </div>
          ))}

          <div className="print-footer flex flex-col w-full bottom-0 right-0 left-0 mt-6">
            <div className="flex flex-col w-full mb-2 rounded-b-lg text-[9px]">
              <p className="font-bold text-orange-600 mt-2">CONDITIONS:</p>
              <p className="text-black">60% d&apos;accompte à la commande</p>
              <p className="text-black font-semibold">DELAIS DE PRODUCTION ET DE LIVRAISON: 4 MOIS</p>
              <p className="text-black">SOLDE avant livraison</p>
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
  );
}
