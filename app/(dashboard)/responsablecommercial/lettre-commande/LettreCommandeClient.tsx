"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChevronLeft, ChevronRight, Printer, FileDown, Loader2, Package, FileText, User, Car, Palette, DoorClosed, Cog } from "lucide-react";
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { getAllFacturesForLettreCommande, deleteFacture } from "@/lib/actions/facture";
import {
  validateLettreCommande,
  type EvolutionLettreCommandeStep,
} from "@/lib/actions/lettrecommande";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { createCommande } from "@/lib/actions/commande";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";
import { normalizeUserRole } from "@/lib/user-role";

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
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    telephone?: string;
  } | null;
  userId?: string;
  lettreCommande?: {
    numero: string;
    validite?: boolean;
    evolution?: EvolutionLettreCommandeStep[];
  } | null;
  commandes?: Array<{ id: string; etapeCommande: string }>;
};

function getEvolutionStepsForFacture(facture: Facture | undefined) {
  return (facture?.lettreCommande?.evolution ?? []).filter(
    (step) => step.etape_actuelle.trim() !== ""
  );
}

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

export default function LettreCommandeClient({
  embedded = false,
  managerMode = false,
}: {
  embedded?: boolean;
  managerMode?: boolean;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const isManagerView =
    managerMode ||
    (userLoaded &&
      normalizeUserRole(user?.publicMetadata?.role) === UserRole.MANAGER);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;
  const [selectedCommercialId, setSelectedCommercialId] = useState<string>("all");
  const [factures, setFactures] = useState<Facture[]>([]);
  const [accessoires, setAccessoires] = useState<
    Array<{ id: string; nom: string; image?: string | null }>
  >([]);
  const [validating, setValidating] = useState(false);
  const [evolutionDialogOpen, setEvolutionDialogOpen] = useState(false);
  const [isCommandeDialogOpen, setIsCommandeDialogOpen] = useState(false);
  const [creatingCommande, setCreatingCommande] = useState(false);
  const [commandeFormData, setCommandeFormData] = useState({
    couleur: "",
    nbr_portes: "4",
    transmission: "AUTOMATIQUE" as "AUTOMATIQUE" | "MANUEL",
    motorisation: "ESSENCE" as "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE",
    date_livraison: "",
    etapeCommande: "PROPOSITION" as
      | "PROPOSITION"
      | "VALIDE"
      | "TRANSITE"
      | "RENSEIGNEE"
      | "ARRIVE"
      | "VERIFIER"
      | "MONTAGE"
      | "TESTE"
      | "PARKING"
      | "CORRECTION"
      | "VENTE"
      | "DECHARGE",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [facturesResult, accessoiresResult] = await Promise.all([
        getAllFacturesForLettreCommande(),
        getAllAccessoires(),
      ]);

      if (facturesResult.success && facturesResult.data) {
        setFactures(facturesResult.data as unknown as Facture[]);
      }
      if (accessoiresResult.success && accessoiresResult.data) {
        setAccessoires(accessoiresResult.data);
      }
    };
    fetchData();
  }, []);

  const facturesWithNumero = factures.filter((f) => f.lettreCommande?.numero);

  const uniqueCommercials = Array.from(
    new Map(
      facturesWithNumero
        .filter((f) => (f.userId || (f.user as { id?: string })?.id) && f.user)
        .map((f) => {
          const uid = f.userId || (f.user as { id?: string })?.id || "";
          return [
            uid,
            {
              id: uid,
              label:
                `${f.user?.firstName || ""} ${f.user?.lastName || ""}`.trim() ||
                (f.user?.email ?? "") ||
                uid,
            },
          ];
        })
    ).values()
  );

  const filteredFactures =
    selectedCommercialId === "all"
      ? facturesWithNumero
      : facturesWithNumero.filter(
          (f) =>
            (f.userId || (f.user as { id?: string })?.id) === selectedCommercialId
        );

  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredFactures.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCommercialId]);

  const currentFacture = currentData[0];
  const numero = currentFacture?.lettreCommande?.numero ?? "";
  const isValide = currentFacture?.lettreCommande?.validite === true;
  const currentEvolutionSteps = useMemo(
    () => getEvolutionStepsForFacture(currentFacture),
    [currentFacture]
  );

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleValider = async () => {
    const facture = currentData[0];
    if (!facture) return;

    if (isValide) {
      toast.info("Cette lettre de commande est déjà validée");
      return;
    }

    setValidating(true);
    const result = await validateLettreCommande(facture.id);
    setValidating(false);

    if (result.success) {
      toast.success("Lettre de commande validée");
      const updatedResult = await getAllFacturesForLettreCommande();
      if (updatedResult.success && updatedResult.data) {
        setFactures(updatedResult.data as unknown as Facture[]);
      } else {
        setFactures((prev) =>
          prev.map((f) =>
            f.id === facture.id
              ? {
                  ...f,
                  lettreCommande: f.lettreCommande
                    ? {
                        ...f.lettreCommande,
                        validite: true,
                        evolution: [
                          ...(f.lettreCommande.evolution ?? []),
                          { etape_actuelle: "valide", etape_suivante: "" },
                        ],
                      }
                    : f.lettreCommande,
                }
              : f
          )
        );
      }
    } else {
      toast.error(result.error || "Erreur lors de la validation");
    }
  };

  const handleGenererCommande = () => {
    const facture = currentData[0];
    if (!facture) {
      toast.error("Aucune lettre de commande sélectionnée");
      return;
    }

    if (facture.lettreCommande?.validite !== true) {
      toast.error("Validez la lettre de commande avant de générer une commande");
      return;
    }

    const firstLigne = facture.lignes?.[0];
    setCommandeFormData({
      couleur: firstLigne?.couleur || "",
      nbr_portes: "4",
      transmission: (firstLigne?.transmission as "AUTOMATIQUE" | "MANUEL") || "AUTOMATIQUE",
      motorisation:
        (firstLigne?.motorisation as "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE") ||
        "ESSENCE",
      date_livraison: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      etapeCommande: "PROPOSITION",
    });
    setIsCommandeDialogOpen(true);
  };

  const handleSubmitCommande = async () => {
    const facture = currentData[0];
    if (!facture) return;

    if (!commandeFormData.couleur.trim()) {
      toast.error("Veuillez saisir la couleur du véhicule");
      return;
    }

    if (!commandeFormData.date_livraison) {
      toast.error("Veuillez sélectionner la date de livraison");
      return;
    }

    if (!facture.clientId && !facture.clientEntrepriseId) {
      toast.error("Aucun client associé à cette lettre de commande");
      return;
    }

    setCreatingCommande(true);
    try {
      const accessoireIds = facture.accessoires?.map((acc) => acc.id) || [];
      const result = await createCommande({
        couleur: commandeFormData.couleur.trim(),
        nbr_portes: commandeFormData.nbr_portes,
        transmission: commandeFormData.transmission,
        motorisation: commandeFormData.motorisation,
        date_livraison: new Date(commandeFormData.date_livraison),
        etapeCommande: commandeFormData.etapeCommande,
        clientId: facture.clientId || undefined,
        clientEntrepriseId: facture.clientEntrepriseId || undefined,
        voitureModelId: facture.lignes?.[0]?.voitureModelId || undefined,
        factureId: facture.id,
        prix_unitaire: Number(facture.prix_unitaire),
        accessoireIds: accessoireIds.length > 0 ? accessoireIds : undefined,
      });

      if (result.success) {
        toast.success("Commande créée avec succès");
        setIsCommandeDialogOpen(false);
        const updatedResult = await getAllFacturesForLettreCommande();
        if (updatedResult.success && updatedResult.data) {
          setFactures(updatedResult.data as unknown as Facture[]);
        }
      } else {
        toast.error(result.error || "Erreur lors de la création de la commande");
      }
    } catch {
      toast.error("Erreur lors de la création de la commande");
    } finally {
      setCreatingCommande(false);
    }
  };

  const handleDelete = async () => {
    const facture = currentData[0];
    if (!facture) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer cette lettre de commande (${facture.id.slice(-7)}) ?`
      )
    ) {
      const result = await deleteFacture(facture.id);
      if (result.success) {
        toast.success("Lettre de commande supprimée avec succès");
        const updatedResult = await getAllFacturesForLettreCommande();
        if (updatedResult.success && updatedResult.data) {
          const data = (updatedResult.data as unknown as Facture[]).filter(
            (f) => f.lettreCommande?.numero
          );
          setFactures(updatedResult.data as unknown as Facture[]);
          const filtered =
            selectedCommercialId === "all"
              ? data
              : data.filter(
                  (f) =>
                    (f.userId || (f.user as { id?: string })?.id) ===
                    selectedCommercialId
                );
          const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
          if (currentPage > newTotalPages) {
            setCurrentPage(Math.max(1, newTotalPages));
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
            new DocxTableCell({
              children: [new Paragraph({ text: "N°", alignment: AlignmentType.CENTER })],
            }),
            new DocxTableCell({
              children: [new Paragraph({ text: "Description du produit / service" })],
            }),
            new DocxTableCell({
              children: [new Paragraph({ text: "Quantité", alignment: AlignmentType.CENTER })],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({ text: "Prix Unitaire (FCFA)", alignment: AlignmentType.RIGHT }),
              ],
            }),
            new DocxTableCell({
              children: [new Paragraph({ text: "Total (FCFA)", alignment: AlignmentType.RIGHT })],
            }),
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
              new DocxTableCell({
                children: [
                  new Paragraph({ text: String(rowIndex), alignment: AlignmentType.CENTER }),
                ],
              }),
              new DocxTableCell({ children: [new Paragraph({ text: desc })] }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    text: String(ligne.nbr_voiture),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    text: formatNumberWithSpaces(Number(ligne.prix_unitaire)),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    text: formatNumberWithSpaces(Number(ligne.montant_ligne)),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
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
                new DocxTableCell({
                  children: [
                    new Paragraph({ text: String(rowIndex), alignment: AlignmentType.CENTER }),
                  ],
                }),
                new DocxTableCell({ children: [new Paragraph({ text: acc.nom })] }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: String(acc.quantity || 1),
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: formatNumberWithSpaces(acc.prix),
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: formatNumberWithSpaces(acc.prix * (acc.quantity || 1)),
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                }),
              ],
            })
          );
        });
      } else if (facture.accessoire_nom) {
        rowIndex++;
        tableRows.push(
          new DocxTableRow({
            children: [
              new DocxTableCell({
                children: [
                  new Paragraph({ text: String(rowIndex), alignment: AlignmentType.CENTER }),
                ],
              }),
              new DocxTableCell({ children: [new Paragraph({ text: facture.accessoire_nom })] }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    text: String(facture.accessoire_nbr || 1),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    text: formatNumberWithSpaces(
                      (facture.accessoire_prix || 0) / (facture.accessoire_nbr || 1)
                    ),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    text: formatNumberWithSpaces(facture.accessoire_prix || 0),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          })
        );
      }

      tableRows.push(
        new DocxTableRow({
          children: [
            new DocxTableCell({
              columnSpan: 4,
              children: [new Paragraph({ text: "Sous-total :", alignment: AlignmentType.RIGHT })],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: `${formatNumberWithSpaces(facture.total_ht)} FCFA`,
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          ],
        }),
        new DocxTableRow({
          children: [
            new DocxTableCell({
              columnSpan: 4,
              children: [
                new Paragraph({ text: `TVA (${facture.tva}%) :`, alignment: AlignmentType.RIGHT }),
              ],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: `${formatNumberWithSpaces(facture.montant_tva)} FCFA`,
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          ],
        }),
        new DocxTableRow({
          children: [
            new DocxTableCell({
              columnSpan: 4,
              children: [
                new Paragraph({ text: "Montant Total TTC :", alignment: AlignmentType.RIGHT }),
              ],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: `${formatNumberWithSpaces(facture.total_ttc)} FCFA`,
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          ],
        })
      );

      const docChildren: (Paragraph | DocxTable)[] = [
        new Paragraph({
          text: "KPANDJI AUTOMOBILES",
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: "Constructeur et Assembleur Automobile",
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: "LETTRE DE COMMANDE VALANT MARCHÉ",
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `NUMERO: ${numero || "______"}`,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 300 },
        }),
        new Paragraph({
          text: "1️⃣ Informations de l'entreprise (fournisseur)",
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({ text: "Entreprise : KPANDJI AUTOMOBILES" }),
        new Paragraph({ text: "Adresse : Cocody, Riviera Palmerais, Abidjan, Côte d'Ivoire" }),
        new Paragraph({ text: "Téléphone : +225 01 01 04 77 03" }),
        new Paragraph({ text: "Email : info@kpandji.com", spacing: { after: 200 } }),
        new Paragraph({
          text: "2️⃣ Informations du client",
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          text: `Nom du client / Entreprise : ${facture.clientEntreprise?.nom_entreprise}`,
        }),
        new Paragraph({ text: `Téléphone : ${facture.clientEntreprise?.telephone || ""}` }),
        new Paragraph({
          text: `Email : ${facture.clientEntreprise?.email || "__________________________"}`,
        }),
        new Paragraph({
          text: `Adresse : ${facture.clientEntreprise?.localisation || "_________________________________________"}`,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: "3️⃣ Détails de la lettre de commande",
          spacing: { before: 100, after: 100 },
        }),
        new DocxTable({ rows: tableRows, width: { size: 100, type: "pct" } }),
        new Paragraph({
          text: "4️⃣ Conditions de commande",
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          text: `Date de la lettre de commande : ${formatDateDDMMYYYY(facture.date_facture)}`,
        }),
        new Paragraph({
          text: `Date d'échéance : ${formatDateDDMMYYYY(facture.date_echeance)}`,
        }),
        new Paragraph({ text: "Mode de paiement : Virement bancaire / Chèque / Cache" }),
        new Paragraph({ text: "Délai de livraison : 4 mois" }),
        new Paragraph({ text: "Lieu de livraison : KPANDJI Automobiles - Abidjan" }),
        new Paragraph({
          text: "Validité : 15 jours à compter de la date d'émission",
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: "Remarque : Cette lettre de commande valant marché constitue un engagement contractuel ferme entre les parties dès sa signature.",
          spacing: { after: 300 },
        }),
        new Paragraph({ text: "Direction", spacing: { before: 100 } }),
        new Paragraph({
          text: `Nom : ${facture.user?.firstName || ""} ${facture.user?.lastName || ""}`,
        }),
        new Paragraph({ text: "Client", spacing: { before: 200 } }),
        new Paragraph({ text: `Nom : ${facture.clientEntreprise?.nom_entreprise}` }),
        new Paragraph({
          text: "Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03",
          alignment: AlignmentType.CENTER,
          spacing: { before: 300 },
        }),
        new Paragraph({
          text: "Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 – ECOBANK : CI059 01046 121659429001 46",
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "kpandjiautomobiles@gmail.com / www.kpandji.com",
          alignment: AlignmentType.CENTER,
        }),
      ];

      const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
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

      <div
        className={`flex flex-col w-full ${
          embedded ? "" : "bg-gradient-to-br from-amber-50 via-white to-orange-50"
        }`}
      >
        <div
          className={`bg-white px-4 py-8 ${
            embedded ? "rounded-lg shadow-sm" : "rounded-lg shadow-2xl"
          }`}
        >
          <div className="flex w-full justify-between mb-6 print-hide">
            <div className="flex gap-4 items-center flex-wrap">
              <Select
                value={selectedCommercialId}
                onValueChange={(v) => setSelectedCommercialId(v)}
              >
                <SelectTrigger id="commercial-filter" className="w-[220px]">
                  <SelectValue placeholder="Tous les commerciaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les commerciaux</SelectItem>
                  {uniqueCommercials.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isManagerView && (
                <Button
                  onClick={handleDelete}
                  disabled={currentData.length === 0}
                  className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SUPPRIMER
                </Button>
              )}
              {!isManagerView && (
                <>
                  <Button
                    onClick={handleValider}
                    disabled={currentData.length === 0 || isValide || validating}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isValide ? (
                      "VALIDÉE"
                    ) : (
                      "VALIDER"
                    )}
                  </Button>
                  <div className="flex flex-col justify-center gap-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 min-w-[10rem] max-w-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-orange-800">
                      Étape actuelle
                    </span>
                    {currentEvolutionSteps.length === 0 ? (
                      <span className="text-xs text-gray-500">Non définie</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {currentEvolutionSteps.map((step, index) => (
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
                </>
              )}
            </div>
            {isManagerView ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  onClick={handleValider}
                  disabled={currentData.length === 0 || isValide || validating}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isValide ? (
                    "VALIDÉE"
                  ) : (
                    "VALIDER"
                  )}
                </Button>
                <div className="flex flex-col justify-center gap-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 min-w-[10rem] max-w-md">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-orange-800">
                    Évolution
                  </span>
                  {currentEvolutionSteps.length === 0 ? (
                    <span className="text-xs text-gray-500">Aucune étape définie</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {currentEvolutionSteps.map((step, index) => (
                        <Badge
                          key={step.id ?? `manager-etape-${index}`}
                          variant="outline"
                          className="border-orange-400 bg-white text-orange-900 text-xs font-semibold"
                        >
                          {step.etape_actuelle}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setEvolutionDialogOpen(true)}
                  disabled={currentData.length === 0}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Détails évolution
                </Button>
                <Button
                  onClick={handleGenererCommande}
                  disabled={
                    currentData.length === 0 ||
                    !isValide ||
                    (currentData[0]?.commandes && currentData[0].commandes.length > 0)
                  }
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Package className="w-5 h-5 mr-2" />
                  {currentData[0]?.commandes && currentData[0].commandes.length > 0
                    ? "Commande déjà créée"
                    : !isValide
                      ? "Validez la lettre d'abord"
                      : "Générer Commande"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleExportToWord}
                  disabled={currentData.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="w-5 h-5 mr-2" />
                  EXPORT TO WORD
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  IMPRIMER
                </Button>
              </div>
            )}
          </div>

          <div id="printable-area">
            <div className="flex w-full justify-between border-b-2 border-orange-800 pb-4 mb-3">
              <div>
                <Image src="/logo.png" alt="Logo" width={60} height={30} priority />
              </div>
              <div className="flex flex-col justify-center -mb-10">
                <h1 className="text-2xl font-bold text-orange-900">KPANDJI AUTOMOBILES</h1>
                <p className="text-sm text-black font-normal">
                  Constructeur et Assembleur Automobile
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div></div>
              <div className="flex flex-col items-center justify-center">
                <h1
                  className={`text-xl font-bold border-2 border-black px-4 py-2 rounded-lg shadow-lg ${
                    isValide ? "bg-green-600 text-white" : "text-orange-800"
                  }`}
                >
                  {isValide
                    ? "LETTRE DE COMMANDE VALIDÉE"
                    : "LETTRE DE COMMANDE VALANT MARCHÉ"}
                </h1>
              </div>
              <div className="flex justify-end">
                <div className="flex gap-2 items-center">
                  <h1 className="text-xl font-bold text-orange-800">NUMERO:</h1>
                  <h1 className="text-lg font-bold text-black">{numero || "______"}</h1>
                  {numero && (
                    <span className="text-xs text-gray-500 print-hide">
                      (généré par commercial)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {currentData.map((facture: Facture) => {
              const factureEvolutionSteps = getEvolutionStepsForFacture(facture);

              return (
              <div key={facture.id}>
                <div className="w-full flex items-center justify-between mt-4">
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2">
                    <h2 className="text-sm font-bold text-blue-800 mb-3">
                      1️⃣ Informations de l&apos;entreprise (fournisseur)
                    </h2>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex gap-2">
                        <p className="font-semibold">Entreprise :</p>
                        <p>KPANDJI AUTOMOBILES</p>
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Adresse :</p>
                        <p>Cocody, Riviera Palmerais, Abidjan, Côte d&apos;Ivoire</p>
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Téléphone :</p>
                        <p>+225 01 01 04 77 03</p>
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Email :</p>
                        <p>info@kpandji.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                    <h2 className="text-sm font-bold text-orange-800 mb-3">
                      2️⃣ Informations du client
                    </h2>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex gap-2">
                        <p className="font-semibold">Nom du client / Entreprise :</p>
                        <p>{facture.clientEntreprise?.nom_entreprise}</p>
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Téléphone :</p>
                        <p>{facture.clientEntreprise?.telephone}</p>
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Email :</p>
                        <p>{facture.clientEntreprise?.email || "__________________________"}</p>
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Adresse :</p>
                        <p>
                          {facture.clientEntreprise?.localisation ||
                            "_________________________________________"}
                        </p>
                      </div>
                      {facture.user && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-orange-200">
                          <p className="font-semibold">Commercial :</p>
                          <p>
                            {facture.user.firstName} {facture.user.lastName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <h2 className="text-sm font-bold text-gray-800 mb-1">
                    3️⃣ Détails de la lettre de commande
                  </h2>
                  <Table className="rounded-lg overflow-hidden text-xs">
                    <TableHeader>
                      <TableRow className="bg-blue-100 border-b-2 border-blue-600">
                        <TableHead className="text-black font-bold text-center">N°</TableHead>
                        <TableHead className="text-black font-bold">
                          Description du produit / service
                        </TableHead>
                        <TableHead className="text-black font-bold text-center">Quantité</TableHead>
                        <TableHead className="text-black font-bold text-right">
                          Prix Unitaire (FCFA)
                        </TableHead>
                        <TableHead className="text-right text-black font-bold">
                          Total (FCFA)
                        </TableHead>
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
                            <TableCell className="text-black font-semibold text-center">
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-black">
                              <div className="flex gap-3">
                                {ligne.voitureModel?.image ? (
                                  <Image
                                    src={ligne.voitureModel.image}
                                    alt={ligne.voitureModel.model || "Vehicle"}
                                    width={80}
                                    height={60}
                                    className="object-contain rounded"
                                  />
                                ) : null}
                                <div className="flex flex-col gap-y-1">
                                  <p className="font-semibold">
                                    {ligne.voitureModel?.model || "N/A"}
                                  </p>
                                  {ligne.voitureModel?.description && (
                                    <p className="text-[8px] text-wrap max-w-5xl font-normal text-black">
                                      {ligne.voitureModel.description}
                                    </p>
                                  )}
                                  <div className="flex gap-y-2">
                                    {ligne.couleur && (
                                      <p className="text-[8px] font-normal text-blue-700 mr-2">
                                        <b className="font-semibold mr-1">Couleur:</b>{" "}
                                        {ligne.couleur} /
                                      </p>
                                    )}
                                    {ligne.transmission && (
                                      <p className="text-[8px] font-normal text-blue-700 mr-2">
                                        <b className="font-semibold mr-1">Transmission:</b>{" "}
                                        {ligne.transmission} /
                                      </p>
                                    )}
                                    {ligne.motorisation && (
                                      <p className="text-[8px] font-normal text-blue-700">
                                        <b className="font-semibold mr-1">Motorisation:</b>{" "}
                                        {ligne.motorisation} /
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-black text-center text-sm">
                              {ligne.nbr_voiture}
                            </TableCell>
                            <TableCell className="text-right text-black text-sm">
                              {formatNumberWithSpaces(Number(ligne.prix_unitaire))}
                            </TableCell>
                            <TableCell className="text-black text-right text-sm">
                              {formatNumberWithSpaces(Number(ligne.montant_ligne))}
                            </TableCell>
                          </TableRow>
                        ));
                      })}

                      {facture.accessoires &&
                        facture.accessoires.length > 0 &&
                        facture.accessoires.map((accessoire, accIndex) => (
                          <TableRow
                            key={`${facture.id}-accessoire-${accessoire.id}`}
                            className="bg-white border-b border-orange-200"
                          >
                            <TableCell className="text-black font-semibold text-center">
                              {(facture.lignes ? facture.lignes.length : 0) + accIndex + 1}
                            </TableCell>
                            <TableCell className="text-black">
                              <div className="flex gap-3">
                                {accessoire.image ? (
                                  <Image
                                    src={accessoire.image}
                                    alt={accessoire.nom || "Accessoire"}
                                    width={80}
                                    height={60}
                                    className="object-contain rounded"
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
                            <TableCell className="text-black text-center text-xs">
                              {accessoire.quantity || 1}
                            </TableCell>
                            <TableCell className="text-right text-black text-xs">
                              {formatNumberWithSpaces(accessoire.prix)}
                            </TableCell>
                            <TableCell className="text-black text-right text-xs">
                              {formatNumberWithSpaces(
                                accessoire.prix * (accessoire.quantity || 1)
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                      {facture.accessoire_nom &&
                        (!facture.accessoires || facture.accessoires.length === 0) && (
                          <TableRow className="bg-white border-b border-orange-200">
                            <TableCell className="text-black font-semibold text-center">
                              {facture.lignes ? facture.lignes.length + 1 : 1}
                            </TableCell>
                            <TableCell className="text-black">
                              <div className="flex gap-3">
                                {(() => {
                                  const imagePath = getAccessoireImage(
                                    facture.accessoire_nom,
                                    accessoires as Array<{
                                      id: string;
                                      nom: string;
                                      image?: string | null;
                                    }>
                                  );
                                  if (!imagePath) return null;
                                  return (
                                    <Image
                                      src={imagePath}
                                      alt={facture.accessoire_nom || "Accessoire"}
                                      width={80}
                                      height={60}
                                      className="object-contain rounded"
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
                            <TableCell className="text-black text-center text-sm">
                              {facture.accessoire_nbr || 1}
                            </TableCell>
                            <TableCell className="text-right text-black text-sm">
                              {(
                                (facture.accessoire_prix || 0) / (facture.accessoire_nbr || 1)
                              )
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

                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-2">
                  <h2 className="text-sm font-bold text-gray-800 mb-3">
                    4️⃣ Conditions de commande
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex gap-2">
                      <p className="font-semibold">Date de la lettre de commande :</p>
                      <p>{formatDateDDMMYYYY(facture.date_facture)}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Date d&apos;échéance :</p>
                      <p>{formatDateDDMMYYYY(facture.date_echeance)}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Mode de paiement :</p>
                      <p>Virement bancaire / Chèque / Cache</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Délai de livraison :</p>
                      <p>4 mois</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Lieu de livraison :</p>
                      <p>KPANDJI Automobiles - Abidjan</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Validité :</p>
                      <p>15 jours à compter de la date d&apos;émission</p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 border border-green-300 rounded">
                    <p className="text-xs">
                      <span className="font-bold">Remarque :</span> Cette lettre de commande
                      valant marché constitue un engagement contractuel ferme entre les parties
                      dès sa signature.
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-2">
                  <h2 className="text-sm font-bold text-orange-800 mb-3">
                    5️⃣ Évolution de la lettre de commande
                  </h2>
                  {factureEvolutionSteps.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune étape définie</p>
                  ) : (
                    <div className="space-y-2">
                      {factureEvolutionSteps.map((step, index) => (
                        <div
                          key={step.id ?? `evolution-${facture.id}-${index}`}
                          className="rounded-lg border border-orange-200 bg-white/80 p-3"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                            Étape {index + 1}
                          </span>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                            <div>
                              <p className="font-semibold text-orange-800">Étape actuelle</p>
                              <p className="text-black">{step.etape_actuelle}</p>
                            </div>
                            {step.etape_suivante.trim() !== "" && (
                              <div>
                                <p className="font-semibold text-orange-800">Étape suivante</p>
                                <p className="text-black">{step.etape_suivante}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="border-2 border-gray-400 rounded-lg p-2">
                    <h3 className="text-xs font-bold text-black mb-2">Direction</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <p className="text-xs font-semibold mb-1">Nom :</p>
                        <p className="text-black">
                          {facture.user?.firstName} {facture.user?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Signature :</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Cachet :</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-gray-400 rounded-lg p-2">
                    <h3 className="text-xs font-bold text-black mb-2">Client</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <p className="text-xs font-semibold mb-1">Nom :</p>
                        <p className="text-black">{facture.clientEntreprise?.nom_entreprise}</p>
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

                <div className="flex flex-col items-center w-full justify-center bg-blue-50 rounded-b-lg text-xs border-t-2 border-orange-800 text-black p-4 mt-4">
                  <p className="font-thin text-center">
                    Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01
                    01 04 77 03
                  </p>
                  <p className="font-thin text-center">
                    Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 –
                    ECOBANK : CI059 01046 121659429001 46
                  </p>
                  <p className="font-thin text-center">
                    kpandjiautomobiles@gmail.com / www.kpandji.com
                  </p>
                </div>
              </div>
            );
            })}

            {filteredFactures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600">
                  Aucune lettre de commande trouvée (toutes les lettres des commerciaux)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center items-center gap-4 mt-6 print-hide">
            <Button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Page Précédente
            </Button>

            <div className="flex items-center gap-2">
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
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
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
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
            >
              Page Suivante
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {isManagerView && (
        <Dialog open={evolutionDialogOpen} onOpenChange={setEvolutionDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-orange-900">
                Évolution de la lettre de commande
              </DialogTitle>
              <DialogDescription className="text-orange-800/80">
                {numero ? `Lettre n° ${numero}` : "Lettre de commande"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg border-2 border-orange-200 bg-white px-4 py-3">
                <span className="text-sm font-semibold text-orange-900">Validité</span>
                <Badge
                  className={
                    isValide
                      ? "bg-green-600 text-white hover:bg-green-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-200"
                  }
                >
                  {isValide ? "Validé" : "Non validé"}
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-orange-900">Étapes</p>
                {currentEvolutionSteps.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-orange-200 bg-white/80 px-4 py-6 text-center text-sm text-gray-500">
                    Aucune étape définie
                  </p>
                ) : (
                  currentEvolutionSteps.map((step, index) => (
                    <div
                      key={step.id ?? `manager-etape-${index}`}
                      className="rounded-lg border-2 border-orange-200 bg-white/80 p-4 space-y-2"
                    >
                      <span className="text-xs font-bold text-orange-800">
                        Étape {index + 1}
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                            Étape actuelle
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {step.etape_actuelle}
                          </p>
                        </div>
                        {step.etape_suivante.trim() !== "" && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                              Étape suivante
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {step.etape_suivante}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEvolutionDialogOpen(false)}
                className="border-orange-300"
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isManagerView && (
        <Dialog open={isCommandeDialogOpen} onOpenChange={setIsCommandeDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[92vh] overflow-y-auto bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <DialogHeader className="space-y-3 pb-4 border-b-2 border-amber-400">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Générer Commande
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    Créer une commande à partir de la lettre{" "}
                    <span className="font-semibold text-amber-600">
                      {currentData[0]?.lettreCommande?.numero || "—"}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-5 py-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base text-gray-900">Informations client</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 font-medium">Numéro lettre</Label>
                    <div className="text-sm font-bold text-gray-900 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                      {currentData[0]?.lettreCommande?.numero || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Client
                    </Label>
                    <div className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      {currentData[0]?.clientEntreprise?.nom_entreprise ||
                        currentData[0]?.client?.nom ||
                        "Non spécifié"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-base text-gray-900">Modèle véhicule</h3>
                </div>
                <div className="text-base font-bold text-gray-900 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 rounded-lg border-2 border-orange-300">
                  {currentData[0]?.lignes?.[0]?.voitureModel?.model ||
                    currentData[0]?.voiture?.voitureModel?.model ||
                    "Non spécifié"}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 shadow-sm border-2 border-amber-300">
                <div className="flex items-center gap-2 mb-5">
                  <Cog className="w-5 h-5 text-amber-700" />
                  <h3 className="font-bold text-base text-gray-900">Configuration</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-couleur" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-600" />
                      Couleur
                    </Label>
                    <Input
                      id="manager-couleur"
                      value={commandeFormData.couleur}
                      onChange={(e) =>
                        setCommandeFormData({ ...commandeFormData, couleur: e.target.value })
                      }
                      className="bg-white border-2 border-amber-300"
                      placeholder="Ex: Blanc, Noir, Rouge..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-nbr_portes" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <DoorClosed className="w-4 h-4 text-amber-600" />
                      Nombre de portes
                    </Label>
                    <Select
                      value={commandeFormData.nbr_portes}
                      onValueChange={(value) =>
                        setCommandeFormData({ ...commandeFormData, nbr_portes: value })
                      }
                    >
                      <SelectTrigger className="bg-white border-2 border-amber-300">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 portes</SelectItem>
                        <SelectItem value="4">4 portes</SelectItem>
                        <SelectItem value="5">5 portes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Transmission</Label>
                    <Select
                      value={commandeFormData.transmission}
                      onValueChange={(value: "AUTOMATIQUE" | "MANUEL") =>
                        setCommandeFormData({ ...commandeFormData, transmission: value })
                      }
                    >
                      <SelectTrigger className="bg-white border-2 border-amber-300">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                        <SelectItem value="MANUEL">Manuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Motorisation</Label>
                    <Select
                      value={commandeFormData.motorisation}
                      onValueChange={(value: "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE") =>
                        setCommandeFormData({ ...commandeFormData, motorisation: value })
                      }
                    >
                      <SelectTrigger className="bg-white border-2 border-amber-300">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESSENCE">Essence</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                        <SelectItem value="HYBRIDE">Hybride</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="manager-date_livraison" className="text-sm font-semibold text-gray-700">
                      Date de livraison
                    </Label>
                    <Input
                      id="manager-date_livraison"
                      type="date"
                      value={commandeFormData.date_livraison}
                      onChange={(e) =>
                        setCommandeFormData({
                          ...commandeFormData,
                          date_livraison: e.target.value,
                        })
                      }
                      className="bg-white border-2 border-amber-300"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t-2 border-amber-300 pt-4 gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCommandeDialogOpen(false)}
                className="border-2 border-gray-300"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitCommande}
                disabled={creatingCommande}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-6"
              >
                {creatingCommande ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                Créer la commande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
