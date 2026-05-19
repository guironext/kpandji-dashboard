"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Printer, FileDown, Plus, Trash2, Loader2 } from "lucide-react";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { getFacturesByUser, deleteFacture } from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import {
  generateNextNumeroLettreCommande,
  getLettreCommandeByFactureId,
  getEvolutionLettreCommandeByFactureId,
  saveEvolutionLettreCommande,
  validateLettreCommande,
  type EvolutionLettreCommandeStep,
} from "@/lib/actions/lettrecommande";
import { updateClientEntreprise } from "@/lib/actions/client_entreprise";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";


type Facture = {
  id: string;
  date_facture: string | Date;
  date_echeance: string | Date;
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
    email?: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
    telephone?: string;
    localisation?: string;
    commercial?: string;
    email?: string;
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

function formatDateDDMMYYYY(value: string | number | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

function getAccessoireImage(
  accessoireNom: string | null | undefined,
  accessoiresList: Array<{ id: string; nom: string; image?: string | null }>
) {
  if (!accessoireNom) return null;
  const name = accessoireNom.split(",")[0]?.split(" (x")[0]?.trim();
  const matched = accessoiresList.find((acc) => acc.nom === name);
  return matched?.image || null;
}

export default function Page() {
  const { userId: clerkId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;
  const [factures, setFactures] = useState<Facture[]>([]);
  const [accessoires, setAccessoires] = useState<
    Array<{ id: string; nom: string; image?: string | null }>
  >([]);
  const [numero, setNumero] = useState<string>("");
  const [showApportInitial, setShowApportInitial] = useState(false);
  const [evolutionDialogOpen, setEvolutionDialogOpen] = useState(false);
  const [evolutionSteps, setEvolutionSteps] = useState<EvolutionLettreCommandeStep[]>([]);
  const [displayEvolutionSteps, setDisplayEvolutionSteps] = useState<
    EvolutionLettreCommandeStep[]
  >([]);
  const [displayEvolutionLoading, setDisplayEvolutionLoading] = useState(false);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [evolutionSaving, setEvolutionSaving] = useState(false);
  const [validiteLettreCommande, setValiditeLettreCommande] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!clerkId) return;

      const [facturesResult, accessoiresResult] = await Promise.all([
        getFacturesByUser(clerkId),
        getAllAccessoires(),
      ]);

      if (facturesResult.success && facturesResult.data) {
        const allFactures = facturesResult.data as unknown as Facture[];
        // Only client_entreprise (company clients) - filter out individual clients
        const clientEntrepriseFactures = allFactures.filter(
          (f) => f.clientEntrepriseId != null
        );
        setFactures(clientEntrepriseFactures);
      }
      if (accessoiresResult.success && accessoiresResult.data) {
        setAccessoires(accessoiresResult.data);
      }
    };
    fetchData();
  }, [clerkId]);

  const totalPages = Math.ceil(factures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = factures.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchNumero = async () => {
      if (factures.length === 0) {
        setNumero("");
        setValiditeLettreCommande(false);
        return;
      }

      const currentFacture = factures.slice(startIndex, endIndex)[0];
      if (!currentFacture) {
        setNumero("");
        setValiditeLettreCommande(false);
        return;
      }

      const result = await getLettreCommandeByFactureId(currentFacture.id);
      if (result.success && result.data) {
        const data = result.data as {
          numero: string;
          validite_lettre_commande?: boolean;
        };
        setNumero(data.numero);
        setValiditeLettreCommande(data.validite_lettre_commande ?? false);
      } else {
        setNumero("");
        setValiditeLettreCommande(false);
      }
    };

    fetchNumero();
  }, [factures, currentPage, startIndex, endIndex]);

  useEffect(() => {
    const fetchEvolution = async () => {
      if (factures.length === 0) {
        setDisplayEvolutionSteps([]);
        return;
      }

      const currentFacture = factures.slice(startIndex, endIndex)[0];
      if (!currentFacture) {
        setDisplayEvolutionSteps([]);
        return;
      }

      setDisplayEvolutionLoading(true);
      const result = await getEvolutionLettreCommandeByFactureId(currentFacture.id);
      if (result.success && result.data) {
        setDisplayEvolutionSteps(
          result.data.steps.filter((s) => s.etape_actuelle.trim() !== "")
        );
      } else {
        setDisplayEvolutionSteps([]);
      }
      setDisplayEvolutionLoading(false);
    };

    fetchEvolution();
  }, [factures, currentPage, startIndex, endIndex]);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerateNumero = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture) return;

    const result = await generateNextNumeroLettreCommande(currentFacture.id);
    if (result.success && result.data) {
      setNumero(result.data.numero);
      toast.success(`Numéro généré: ${result.data.numero}`);

      if (currentFacture.clientEntrepriseId) {
        try {
          const clientEntrepriseUpdateResult = await updateClientEntreprise(
            currentFacture.clientEntrepriseId,
            { status_client: "CLIENT" }
          );
          if (!clientEntrepriseUpdateResult.success) {
            console.error("Failed to update client_entreprise status:", clientEntrepriseUpdateResult.error);
          }
        } catch (error) {
          console.error("Error updating client_entreprise status:", error);
        }
      }
    } else {
      toast.error("Erreur lors de la génération du numéro");
    }
  };

  const openEvolutionDialog = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture) return;

    setEvolutionDialogOpen(true);
    setEvolutionLoading(true);

    const result = await getEvolutionLettreCommandeByFactureId(currentFacture.id);
    if (result.success && result.data) {
      const steps = result.data.steps;
      setEvolutionSteps(
        steps.length > 0
          ? steps
          : [{ etape_actuelle: "", etape_suivante: "" }]
      );
    } else {
      toast.error(result.error ?? "Impossible de charger l'évolution");
      setEvolutionSteps([{ etape_actuelle: "", etape_suivante: "" }]);
    }

    setEvolutionLoading(false);
  };

  const addEvolutionStep = () => {
    setEvolutionSteps((prev) => [
      ...prev,
      { etape_actuelle: "", etape_suivante: "" },
    ]);
  };

  const removeEvolutionStep = (index: number) => {
    setEvolutionSteps((prev) => {
      if (prev.length <= 1) {
        return [{ etape_actuelle: "", etape_suivante: "" }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateEvolutionStep = (
    index: number,
    field: "etape_actuelle" | "etape_suivante",
    value: string
  ) => {
    setEvolutionSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    );
  };

  const handleSaveEvolution = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture) return;

    if (!numero) {
      toast.error("Générez d'abord le numéro de la lettre de commande avant d'enregistrer");
      return;
    }

    setEvolutionSaving(true);
    const result = await saveEvolutionLettreCommande(
      currentFacture.id,
      evolutionSteps
    );
    setEvolutionSaving(false);

    if (result.success) {
      toast.success("Évolution enregistrée avec succès");
      setDisplayEvolutionSteps(
        evolutionSteps.filter((s) => s.etape_actuelle.trim() !== "")
      );
      setEvolutionDialogOpen(false);
    } else {
      toast.error(result.error ?? "Erreur lors de l'enregistrement");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleValidateLettreCommande = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture) return;

    if (!numero) {
      toast.error("Générez d'abord le numéro de la lettre de commande avant de la valider");
      return;
    }

    if (validiteLettreCommande) {
      toast.info("Cette lettre de commande est déjà validée");
      return;
    }

    setValidating(true);
    const result = await validateLettreCommande(currentFacture.id);
    setValidating(false);

    if (result.success) {
      setValiditeLettreCommande(true);
      toast.success("Lettre de commande validée");
      const evolutionResult = await getEvolutionLettreCommandeByFactureId(
        currentFacture.id
      );
      if (evolutionResult.success && evolutionResult.data) {
        setDisplayEvolutionSteps(
          evolutionResult.data.steps.filter((s) => s.etape_actuelle.trim() !== "")
        );
      }
    } else {
      toast.error(result.error ?? "Erreur lors de la validation");
    }
  };

  const handleDelete = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture || !clerkId) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer cette lettre de commande (${currentFacture.id.slice(-7)}) ?`
      )
    ) {
      const result = await deleteFacture(currentFacture.id);
      if (result.success) {
        toast.success("Lettre de commande supprimée avec succès");
        const updatedFactures = await getFacturesByUser(clerkId);
        if (updatedFactures.success && updatedFactures.data) {
          const allFactures = updatedFactures.data as unknown as Facture[];
          const clientEntrepriseFactures = allFactures.filter(
            (f) => f.clientEntrepriseId != null
          );
          setFactures(clientEntrepriseFactures);
          if (currentPage > Math.ceil(clientEntrepriseFactures.length / itemsPerPage)) {
            setCurrentPage(Math.max(1, Math.ceil(clientEntrepriseFactures.length / itemsPerPage)));
          }
        }
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleExportToWord = async () => {
    const facture = currentData[0];
    if (!facture) {
      toast.error("Aucune lettre de commande à exporter");
      return;
    }

    try {
      const lignes =
        facture.lignes && facture.lignes.length > 0
          ? facture.lignes
          : [
              {
                id: "1",
                voitureModelId: "",
                couleur: "",
                nbr_voiture: facture.nbr_voiture_commande,
                prix_unitaire: facture.prix_unitaire,
                montant_ligne: facture.montant_ht,
                transmission: "",
                motorisation: "",
                voitureModel: facture.voiture?.voitureModel || null,
              },
            ];

      const tableRows: DocxTableRow[] = [
        new DocxTableRow({
          children: [
            new DocxTableCell({ children: [new Paragraph({ text: "N°", alignment: AlignmentType.CENTER })] }),
            new DocxTableCell({ children: [new Paragraph({ text: "Description du produit / service" })] }),
            new DocxTableCell({ children: [new Paragraph({ text: "Quantité", alignment: AlignmentType.CENTER })] }),
            new DocxTableCell({ children: [new Paragraph({ text: "Prix Unitaire (FCFA)", alignment: AlignmentType.RIGHT })] }),
            new DocxTableCell({ children: [new Paragraph({ text: "Total (FCFA)", alignment: AlignmentType.RIGHT })] }),
          ],
        }),
      ];

      let rowIndex = 0;
      lignes.forEach((ligne) => {
        rowIndex++;
        const desc = [
          ligne.voitureModel?.model || "N/A",
          ligne.couleur ? `Couleur: ${ligne.couleur}` : "",
          ligne.transmission ? `Transmission: ${ligne.transmission}` : "",
          ligne.motorisation ? `Motorisation: ${ligne.motorisation}` : "",
        ]
          .filter(Boolean)
          .join(" / ");
        tableRows.push(
          new DocxTableRow({
            children: [
              new DocxTableCell({ children: [new Paragraph({ text: String(rowIndex), alignment: AlignmentType.CENTER })] }),
              new DocxTableCell({ children: [new Paragraph({ text: desc })] }),
              new DocxTableCell({ children: [new Paragraph({ text: String(ligne.nbr_voiture), alignment: AlignmentType.CENTER })] }),
              new DocxTableCell({ children: [new Paragraph({ text: formatNumberWithSpaces(Number(ligne.prix_unitaire)), alignment: AlignmentType.RIGHT })] }),
              new DocxTableCell({ children: [new Paragraph({ text: formatNumberWithSpaces(Number(ligne.montant_ligne)), alignment: AlignmentType.RIGHT })] }),
            ],
          })
        );
      });

      if (facture.accessoires && facture.accessoires.length > 0) {
        facture.accessoires.forEach((acc) => {
          rowIndex++;
          tableRows.push(
            new DocxTableRow({
              children: [
                new DocxTableCell({ children: [new Paragraph({ text: String(rowIndex), alignment: AlignmentType.CENTER })] }),
                new DocxTableCell({ children: [new Paragraph({ text: acc.nom })] }),
                new DocxTableCell({ children: [new Paragraph({ text: String(acc.quantity || 1), alignment: AlignmentType.CENTER })] }),
                new DocxTableCell({ children: [new Paragraph({ text: formatNumberWithSpaces(acc.prix), alignment: AlignmentType.RIGHT })] }),
                new DocxTableCell({ children: [new Paragraph({ text: formatNumberWithSpaces(acc.prix * (acc.quantity || 1)), alignment: AlignmentType.RIGHT })] }),
              ],
            })
          );
        });
      } else if (facture.accessoire_nom) {
        rowIndex++;
        tableRows.push(
          new DocxTableRow({
            children: [
              new DocxTableCell({ children: [new Paragraph({ text: String(rowIndex), alignment: AlignmentType.CENTER })] }),
              new DocxTableCell({ children: [new Paragraph({ text: facture.accessoire_nom })] }),
              new DocxTableCell({ children: [new Paragraph({ text: String(facture.accessoire_nbr || 1), alignment: AlignmentType.CENTER })] }),
              new DocxTableCell({ children: [new Paragraph({ text: formatNumberWithSpaces((facture.accessoire_prix || 0) / (facture.accessoire_nbr || 1)), alignment: AlignmentType.RIGHT })] }),
              new DocxTableCell({ children: [new Paragraph({ text: formatNumberWithSpaces(facture.accessoire_prix || 0), alignment: AlignmentType.RIGHT })] }),
            ],
          })
        );
      }

      tableRows.push(
        new DocxTableRow({
          children: [
            new DocxTableCell({ columnSpan: 4, children: [new Paragraph({ text: "Sous-total :", alignment: AlignmentType.RIGHT })] }),
            new DocxTableCell({ children: [new Paragraph({ text: `${formatNumberWithSpaces(facture.total_ht)} FCFA`, alignment: AlignmentType.RIGHT })] }),
          ],
        }),
        new DocxTableRow({
          children: [
            new DocxTableCell({ columnSpan: 4, children: [new Paragraph({ text: `TVA (${facture.tva}%) :`, alignment: AlignmentType.RIGHT })] }),
            new DocxTableCell({ children: [new Paragraph({ text: `${formatNumberWithSpaces(facture.montant_tva)} FCFA`, alignment: AlignmentType.RIGHT })] }),
          ],
        }),
        new DocxTableRow({
          children: [
            new DocxTableCell({ columnSpan: 4, children: [new Paragraph({ text: "Montant Total TTC :", alignment: AlignmentType.RIGHT })] }),
            new DocxTableCell({ children: [new Paragraph({ text: `${formatNumberWithSpaces(facture.total_ttc)} FCFA`, alignment: AlignmentType.RIGHT })] }),
          ],
        })
      );

      const docChildren: (Paragraph | DocxTable)[] = [
        new Paragraph({ text: "KPANDJI AUTOMOBILES", alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: "Constructeur et Assembleur Automobile", alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ text: "LETTRE DE COMMANDE VALANT MARCHÉ", alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
      ];

      if (showApportInitial) {
        docChildren.push(new Paragraph({ text: "En Apport Initial 60% du Montant Total TTC", alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
      }

      docChildren.push(
        new Paragraph({ text: `NUMERO: ${numero || "______"}`, alignment: AlignmentType.RIGHT, spacing: { after: 300 } }),
        new Paragraph({ text: "1️⃣ Informations de l'entreprise (fournisseur)", spacing: { before: 200, after: 100 } }),
        new Paragraph({ text: "Entreprise : KPANDJI AUTOMOBILES" }),
        new Paragraph({ text: "Adresse : Cocody, Riviera Palmerais, Abidjan, Côte d'Ivoire" }),
        new Paragraph({ text: "Téléphone : +225 01 01 04 77 03" }),
        new Paragraph({ text: "Email : info@kpandji.com", spacing: { after: 200 } }),
        new Paragraph({ text: "2️⃣ Informations du client", spacing: { before: 100, after: 100 } }),
        new Paragraph({ text: `Nom du client / Entreprise : ${facture.clientEntreprise?.nom_entreprise}` }),
        new Paragraph({ text: `Téléphone : ${facture.clientEntreprise?.telephone || ""}` }),
        new Paragraph({ text: `Email : ${facture.clientEntreprise?.email || "__________________________"}` }),
        new Paragraph({ text: `Adresse : ${facture.clientEntreprise?.localisation || "_________________________________________"}`, spacing: { after: 200 } }),
        new Paragraph({ text: "3️⃣ Détails de la lettre de commande", spacing: { before: 100, after: 100 } }),
        new DocxTable({ rows: tableRows, width: { size: 100, type: "pct" } }),
        new Paragraph({ text: "4️⃣ Conditions de commande", spacing: { before: 300, after: 100 } }),
        new Paragraph({ text: `Date de la lettre de commande : ${formatDateDDMMYYYY(facture.date_facture)}` }),
        new Paragraph({ text: `Date d'échéance : ${formatDateDDMMYYYY(facture.date_echeance)}` }),
        new Paragraph({ text: "Mode de paiement : Virement bancaire / Chèque / Cache" }),
        new Paragraph({ text: "Délai de livraison : 4 mois" }),
        new Paragraph({ text: "Lieu de livraison : KPANDJI Automobiles - Abidjan" }),
        new Paragraph({ text: "Validité : 15 jours à compter de la date d'émission", spacing: { after: 200 } }),
        new Paragraph({ text: "Remarque : Cette lettre de commande valant marché constitue un engagement contractuel ferme entre les parties dès sa signature.", spacing: { after: 300 } }),
        new Paragraph({ text: "Direction", spacing: { before: 100 } }),
        new Paragraph({ text: `Nom : ${facture.user?.firstName || ""} ${facture.user?.lastName || ""}` }),
        new Paragraph({ text: "Client", spacing: { before: 200 } }),
        new Paragraph({ text: `Nom : ${facture.clientEntreprise?.nom_entreprise}` }),
        new Paragraph({ text: "Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03", alignment: AlignmentType.CENTER, spacing: { before: 300 } }),
        new Paragraph({ text: "Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 – ECOBANK : CI059 01046 121659429001 46", alignment: AlignmentType.CENTER }),
        new Paragraph({ text: "kpandjiautomobiles@gmail.com / www.kpandji.com", alignment: AlignmentType.CENTER }),
      );

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Lettre_Commande_${numero || facture.id.slice(-7)}_${format(new Date(), "yyyy-MM-dd")}.docx`;
      saveAs(blob, fileName);
      toast.success("Document exporté en Word");
    } catch (error) {
      console.error("Export to Word error:", error);
      toast.error("Erreur lors de l'exportation");
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            overflow: visible !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible !important;
          }
          #printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 10mm 8mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
          }
          #printable-area img {
            max-width: 100%;
            height: auto;
          }
          .print-hide {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 10mm 6mm;
          }
        }
      `,
        }}
      />

      <div className="flex flex-col w-full min-w-0 max-w-full bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="bg-white rounded-lg shadow-2xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 min-w-0">
          <div className="flex flex-col gap-4 mb-6 print-hide sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={handleDelete}
                disabled={currentData.length === 0}
                className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                SUPPRIMER
              </Button>
              <Button
                onClick={handleGenerateNumero}
                disabled={!!numero}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                GÉNÉRER NUMÉRO
              </Button>
              <Button
                onClick={() => setShowApportInitial(true)}
                disabled={showApportInitial}
                className="bg-green-600 hidden hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                Apport Initial
              </Button>
              <Button
                onClick={openEvolutionDialog}
                disabled={!numero}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                Definir Evolution
              </Button>

              <div className="flex flex-col justify-center gap-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 min-w-[10rem] max-w-xs">
                <span className="text-[10px] font-bold uppercase tracking-wide text-orange-800">
                  Étape actuelle
                </span>
                {displayEvolutionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                ) : displayEvolutionSteps.length === 0 ? (
                  <span className="text-xs text-gray-500">Non définie</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {displayEvolutionSteps.map((step, index) => (
                      <Badge
                        key={step.id ?? `etape-${index}`}
                        variant="outline"
                        className="border-orange-400 bg-white text-orange-900 text-xs font-semibold"
                      >
                        {step.etape_actuelle}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>


            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleExportToWord}
                disabled={currentData.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <FileDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" />
                EXPORT<span className="hidden sm:inline"> TO WORD</span>
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" />
                IMPRIMER
              </Button>
              <Button
                onClick={handleValidateLettreCommande}
                disabled={!numero || validiteLettreCommande || validating}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : validiteLettreCommande ? (
                  "Déjà validé"
                ) : (
                  "Si Validée ?"
                )}
              </Button>
            </div>
          </div>

          <div id="printable-area" className="min-w-0">
            <div className="flex w-full flex-col gap-3 border-b-2 border-orange-800 pb-4 mb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative shrink-0 min-h-[40px] min-w-[48px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- public/logo.png */}
                <img
                  src="/logo.png"
                  alt="KPANDJI AUTOMOBILES"
                  width={120}
                  height={60}
                  loading="eager"
                  decoding="async"
                  className="block object-contain object-left"
                  style={{ height: "clamp(40px, 8vw, 52px)", width: "auto", maxWidth: "140px" }}
                />
              </div>
              <div className="flex flex-col justify-center sm:-mb-10 sm:text-right">
                <h1 className="text-lg font-bold text-orange-900 sm:text-2xl">
                  KPANDJI AUTOMOBILES
                </h1>
                <p className="text-xs text-black font-normal sm:text-sm">
                  Constructeur et Assembleur Automobile
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="hidden sm:block sm:w-24 shrink-0" aria-hidden />
              <div className="flex flex-col items-center justify-center order-first sm:order-none">
                <h1 className="text-center text-xs font-bold text-orange-800 border-2 border-black px-2 py-2 rounded-lg shadow-lg sm:text-base sm:px-4 md:text-lg">
                  LETTRE DE COMMANDE VALANT MARCHÉ
                </h1>
                {showApportInitial && (
                  <p className="mt-2 text-center text-xs font-bold text-black sm:text-sm">
                    En Apport Initial 60% du Montant Total TTC
                  </p>
                )}
              </div>
              <div className="flex w-full justify-center sm:w-auto sm:justify-end sm:shrink-0">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                  <span className="text-base font-bold text-orange-800 sm:text-xl">NUMERO:</span>
                  <span className="text-base font-bold text-black sm:text-lg break-all">{numero || "______"}</span>
                </div>
              </div>
            </div>

            {currentData.map((facture: Facture) => (
              <div key={facture.id}>
                <div className="mt-4 flex w-full flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-4">
                  <div className="min-w-0 flex-1 bg-blue-50 border-2 border-blue-300 rounded-lg p-2 sm:p-3">
                    <h2 className="text-xs font-bold text-blue-800 mb-3 sm:text-sm">1️⃣ Informations de l&apos;entreprise (fournisseur)</h2>
                    <div className="grid grid-cols-1 gap-2 text-[11px] sm:text-xs">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Entreprise :</p>
                        <p className="min-w-0 break-words">KPANDJI AUTOMOBILES</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Adresse :</p>
                        <p className="min-w-0 break-words">Cocody, Riviera Palmerais, Abidjan, Côte d&apos;Ivoire</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Téléphone :</p>
                        <p className="min-w-0 break-words">+225 01 01 04 77 03</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Email :</p>
                        <p className="min-w-0 break-all">info@kpandji.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 bg-orange-50 border-2 border-orange-300 rounded-lg p-3 sm:p-4">
                    <h2 className="text-xs font-bold text-orange-800 mb-3 sm:text-sm">2️⃣ Informations du client</h2>
                    <div className="grid grid-cols-1 gap-2 text-[11px] sm:text-xs">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Nom du client / Entreprise :</p>
                        <p className="min-w-0 break-words">{facture.clientEntreprise?.nom_entreprise}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Téléphone :</p>
                        <p className="min-w-0 break-words">{facture.clientEntreprise?.telephone}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Email :</p>
                        <p className="min-w-0 break-all">{facture.clientEntreprise?.email || "__________________________"}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                        <p className="shrink-0 font-semibold">Adresse :</p>
                        <p className="min-w-0 break-words">{facture.clientEntreprise?.localisation || "_________________________________________"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-2 min-w-0">
                  <h2 className="text-xs font-bold text-gray-800 mb-2 sm:text-sm">3️⃣ Détails de la lettre de commande</h2>
                  <div className="-mx-1 overflow-x-auto rounded-lg border border-transparent px-1 sm:mx-0 sm:px-0">
                  <Table className="w-full min-w-[600px] rounded-lg overflow-hidden text-[10px] sm:text-xs lg:min-w-0">
                    <TableHeader>
                      <TableRow className="bg-blue-100 border-b-2 border-blue-600">
                        <TableHead className="text-black font-bold text-center">N°</TableHead>
                        <TableHead className="text-black font-bold">Description du produit / service</TableHead>
                        <TableHead className="text-black font-bold text-center">Quantité</TableHead>
                        <TableHead className="text-black font-bold text-right">Prix Unitaire (FCFA)</TableHead>
                        <TableHead className="text-right text-black font-bold">Total (FCFA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((factureItem) => {
                        const lignes =
                          factureItem.lignes && factureItem.lignes.length > 0
                            ? factureItem.lignes
                            : [
                                {
                                  id: "1",
                                  voitureModelId: "",
                                  couleur: "",
                                  nbr_voiture: factureItem.nbr_voiture_commande,
                                  prix_unitaire: factureItem.prix_unitaire,
                                  montant_ligne: factureItem.montant_ht,
                                  transmission: "",
                                  motorisation: "",
                                  voitureModel: factureItem.voiture?.voitureModel || null,
                                },
                              ];

                        return lignes.map((ligne, index) => (
                          <TableRow
                            key={`${factureItem.id}-${ligne.id}`}
                            className={
                              index % 2 === 0
                                ? "bg-white border-b border-orange-200"
                                : "bg-orange-50 hover:bg-orange-100 border-b border-orange-200"
                            }
                          >
                            <TableCell className="text-black font-semibold text-center">{index + 1}</TableCell>
                            <TableCell className="text-black min-w-0">
                              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                {ligne.voitureModel?.image ? (
                                  <Image
                                    src={ligne.voitureModel.image}
                                    alt={ligne.voitureModel.model || "Vehicle"}
                                    width={80}
                                    height={60}
                                    className="mx-auto h-auto w-16 shrink-0 object-contain rounded sm:mx-0 sm:w-20"
                                  />
                                ) : null}
                                <div className="flex flex-col gap-y-1">
                                  <p className="font-semibold">{ligne.voitureModel?.model || "N/A"}</p>
                                  {ligne.voitureModel?.description && (
                                    <p className="text-[8px] text-wrap font-normal text-black sm:max-w-5xl">
                                      {ligne.voitureModel.description}
                                    </p>
                                  )}
                                  <div className="flex gap-y-2">
                                    {ligne.couleur && (
                                      <p className="text-[8px] font-normal text-blue-700 mr-2">
                                        <b className="font-semibold mr-1">Couleur:</b> {ligne.couleur} /
                                      </p>
                                    )}
                                    {ligne.transmission && (
                                      <p className="text-[8px] font-normal text-blue-700 mr-2">
                                        <b className="font-semibold mr-1">Transmission:</b> {ligne.transmission} /
                                      </p>
                                    )}
                                    {ligne.motorisation && (
                                      <p className="text-[8px] font-normal text-blue-700">
                                        <b className="font-semibold mr-1">Motorisation:</b> {ligne.motorisation} /
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-black text-center text-sm">{ligne.nbr_voiture}</TableCell>
                            <TableCell className="text-right text-black text-sm">
                              {formatNumberWithSpaces(Number(ligne.prix_unitaire))}
                            </TableCell>
                            <TableCell className="text-black text-right text-sm">
                              {formatNumberWithSpaces(Number(ligne.montant_ligne))}
                            </TableCell>
                          </TableRow>
                        ));
                      })}

                      {facture.accessoires && facture.accessoires.length > 0 && facture.accessoires.map((accessoire, accIndex) => (
                        <TableRow key={`${facture.id}-accessoire-${accessoire.id}`} className="bg-white border-b border-orange-200">
                          <TableCell className="text-black font-semibold text-center">
                            {(facture.lignes ? facture.lignes.length : 0) + accIndex + 1}
                          </TableCell>
                          <TableCell className="text-black min-w-0">
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                              {accessoire.image ? (
                                <Image
                                  src={accessoire.image}
                                  alt={accessoire.nom || "Accessoire"}
                                  width={80}
                                  height={60}
                                  className="mx-auto h-auto w-16 shrink-0 object-contain rounded sm:mx-0 sm:w-20"
                                />
                              ) : null}
                              <div className="flex flex-col gap-y-1">
                                <p className="font-semibold">{accessoire.nom}</p>
                                {accessoire.description && (
                                  <p className="text-xs font-light text-black text-wrap max-w-5xl">
                                    {accessoire.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-black text-center text-xs">{accessoire.quantity || 1}</TableCell>
                          <TableCell className="text-right text-black text-xs">
                            {formatNumberWithSpaces(accessoire.prix)}
                          </TableCell>
                          <TableCell className="text-black text-right text-xs">
                            {formatNumberWithSpaces(accessoire.prix * (accessoire.quantity || 1))}
                          </TableCell>
                        </TableRow>
                      ))}

                      {facture.accessoire_nom && (!facture.accessoires || facture.accessoires.length === 0) && (
                        <TableRow className="bg-white border-b border-orange-200">
                          <TableCell className="text-black font-semibold text-center">
                            {facture.lignes ? facture.lignes.length + 1 : 1}
                          </TableCell>
                          <TableCell className="text-black min-w-0">
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                              {(() => {
                                const imagePath = getAccessoireImage(
                                  facture.accessoire_nom,
                                  accessoires as Array<{ id: string; nom: string; image?: string | null }>
                                );
                                if (!imagePath) return null;
                                return (
                                  <Image
                                    src={imagePath}
                                    alt={facture.accessoire_nom || "Accessoire"}
                                    width={80}
                                    height={60}
                                    className="mx-auto h-auto w-16 shrink-0 object-contain rounded sm:mx-0 sm:w-20"
                                  />
                                );
                              })()}
                              <div className="flex flex-col gap-y-1">
                                <p className="font-semibold">{facture.accessoire_nom}</p>
                                {facture.accessoire_description && (
                                  <p className="text-xs font-light text-back max-w-80">
                                    {facture.accessoire_description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-black text-center text-sm">{facture.accessoire_nbr || 1}</TableCell>
                          <TableCell className="text-right text-black text-sm">
                            {((facture.accessoire_prix || 0) / (facture.accessoire_nbr || 1))
                              .toLocaleString()
                              .replace(/,/g, " ")}
                          </TableCell>
                          <TableCell className="text-black text-right text-sm">
                            {formatNumberWithSpaces(facture.accessoire_prix || 0)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-blue-100">
                        <TableCell colSpan={4} className="text-right text-black font-semibold">
                          Sous-total :
                        </TableCell>
                        <TableCell className="text-right font-bold text-black">
                          {formatNumberWithSpaces(facture.total_ht)} FCFA
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-white">
                        <TableCell colSpan={4} className="text-right text-black">
                          TVA ({facture.tva}%) :
                        </TableCell>
                        <TableCell className="text-right text-black">
                          {formatNumberWithSpaces(facture.montant_tva)} FCFA
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-orange-100 border-t-2 border-gray-900">
                        <TableCell colSpan={4} className="text-right text-black font-bold text-sm">
                          Montant Total TTC :
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm text-black">
                          {formatNumberWithSpaces(facture.total_ttc) + " FCFA"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  </div>
                </div>

                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 sm:p-4 mb-2">
                  <h2 className="text-xs font-bold text-gray-800 mb-3 sm:text-sm">4️⃣ Conditions de commande</h2>
                  <div className="grid grid-cols-1 gap-3 text-[11px] sm:grid-cols-2 sm:gap-2 sm:text-xs">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                      <p className="shrink-0 font-semibold">Date de la lettre de commande :</p>
                      <p className="min-w-0 break-words">{formatDateDDMMYYYY(facture.date_facture)}</p>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                      <p className="shrink-0 font-semibold">Date d&apos;échéance :</p>
                      <p className="min-w-0 break-words">{formatDateDDMMYYYY(facture.date_echeance)}</p>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2 sm:col-span-2">
                      <p className="shrink-0 font-semibold">Mode de paiement :</p>
                      <p className="min-w-0 break-words">Virement bancaire / Chèque / Cache</p>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                      <p className="shrink-0 font-semibold">Délai de livraison :</p>
                      <p>4 mois</p>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                      <p className="shrink-0 font-semibold">Lieu de livraison :</p>
                      <p className="min-w-0 break-words">KPANDJI Automobiles - Abidjan</p>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2 sm:col-span-2">
                      <p className="shrink-0 font-semibold">Validité :</p>
                      <p className="min-w-0 break-words">15 jours à compter de la date d&apos;émission</p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 border border-green-300 rounded">
                    <p className="text-xs">
                      <span className="font-bold">Remarque :</span> Cette lettre de commande valant marché constitue un engagement contractuel ferme entre les parties dès sa signature.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-2 sm:grid-cols-2 sm:gap-2">
                  <div className="border-2 border-gray-400 rounded-lg p-2 sm:p-3">
                    <h3 className="text-xs font-bold text-black mb-2">Direction</h3>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                        <p className="text-xs font-semibold">Nom :</p>
                        <p className="text-xs text-black break-words">{facture.user?.firstName} {facture.user?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Signature :</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Cachet :</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-gray-400 rounded-lg p-2 sm:p-3">
                    <h3 className="text-xs font-bold text-black mb-2">Client</h3>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                        <p className="text-xs font-semibold">Nom :</p>
                        <p className="text-xs text-black break-words">{facture.clientEntreprise?.nom_entreprise}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Signature :</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Cachet :</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center w-full justify-center bg-blue-50 rounded-b-lg text-[10px] border-t-2 border-orange-800 text-black p-3 mt-4 sm:text-xs sm:p-4">
                  <p className="max-w-prose font-thin text-center leading-relaxed px-1">
                    Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 /
                    Tel : 00225 01 01 04 77 03
                  </p>
                  <p className="max-w-prose font-thin text-center leading-relaxed px-1">
                    Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC
                    :2213233 – ECOBANK : CI059 01046 121659429001 46
                  </p>
                  <p className="max-w-prose font-thin text-center leading-relaxed px-1">
                    kpandjiautomobiles@gmail.com / www.kpandji.com
                  </p>
                </div>
              </div>
            ))}

            {factures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600">Aucune lettre de commande trouvée (client entreprise uniquement)</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-4 print-hide sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="order-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold sm:order-1"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Page Précédente</span>
              <span className="sm:hidden">Précédent</span>
            </Button>

            <div className="order-1 flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:order-2 sm:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setCurrentPage(pageNum);
                    }
                  }}
                  className={`min-w-[2.25rem] px-3 py-1.5 text-sm rounded-lg font-semibold transition-all cursor-pointer sm:px-4 sm:py-2 ${
                    currentPage === pageNum
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </div>
              ))}
            </div>

            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="order-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
            >
              <span className="hidden sm:inline">Page Suivante</span>
              <span className="sm:hidden">Suivant</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 shrink-0" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={evolutionDialogOpen} onOpenChange={setEvolutionDialogOpen}>
        <DialogContent className="max-h-[min(90dvh,90vh)] overflow-y-auto sm:max-w-lg bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-orange-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-orange-900 sm:text-xl">
              Définir l&apos;évolution de la lettre de commande
            </DialogTitle>
            <DialogDescription className="text-orange-800/80">
              {numero
                ? `Lettre n° ${numero} — ajoutez les étapes du parcours.`
                : "Ajoutez les étapes du parcours de la lettre de commande."}
            </DialogDescription>
          </DialogHeader>

          {evolutionLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-orange-900">Étapes</p>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={addEvolutionStep}
                  className="h-8 w-8 shrink-0 rounded-full border-orange-300 text-orange-800 hover:bg-orange-100"
                  aria-label="Ajouter une étape"
                  title="Ajouter une étape"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {evolutionSteps.map((step, index) => (
                  <div
                    key={index}
                    className="rounded-lg border-2 border-orange-200 bg-white/80 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-800">
                        Étape {index + 1}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeEvolutionStep(index)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label="Supprimer l'étape"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`etape-actuelle-${index}`}
                        className="text-xs font-semibold text-orange-900"
                      >
                        Étape actuelle
                      </Label>
                      <Input
                        id={`etape-actuelle-${index}`}
                        value={step.etape_actuelle}
                        onChange={(e) =>
                          updateEvolutionStep(
                            index,
                            "etape_actuelle",
                            e.target.value
                          )
                        }
                        placeholder="Ex. Commande validée"
                        className="border-orange-200 focus-visible:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`etape-suivante-${index}`}
                        className="text-xs font-semibold text-orange-900"
                      >
                        Étape suivante
                      </Label>
                      <Input
                        id={`etape-suivante-${index}`}
                        value={step.etape_suivante}
                        onChange={(e) =>
                          updateEvolutionStep(
                            index,
                            "etape_suivante",
                            e.target.value
                          )
                        }
                        placeholder="Ex. Production en cours"
                        className="border-orange-200 focus-visible:border-orange-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEvolutionDialogOpen(false)}
              disabled={evolutionSaving}
              className="border-orange-300"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSaveEvolution}
              disabled={evolutionLoading || evolutionSaving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {evolutionSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
