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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Printer, FileDown } from "lucide-react";
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
import {
	getAllFacturesForResponsableCommercial,
	deleteFacture,
} from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import {
	generateNextNumero,
	getBonDeCommandeByFactureId,
	updateBonDeCommandeStatus,
} from "@/lib/actions/bondecommande";
import { updateClient } from "@/lib/actions/client";
import { updateClientEntreprise } from "@/lib/actions/client_entreprise";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";

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
	accessoiresList: Array<{ id: string; nom: string; image?: string | null }>,
) {
	if (!accessoireNom) return null;
	const name = accessoireNom.split(",")[0]?.split(" (x")[0]?.trim();
	const matched = accessoiresList.find((acc) => acc.nom === name);
	return matched?.image || null;
}

export default function Page() {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 1;
	const [selectedCommercialId, setSelectedCommercialId] =
		useState<string>("all");
	const [factures, setFactures] = useState<Facture[]>([]);
	const [accessoires, setAccessoires] = useState<
		Array<{ id: string; nom: string; image?: string | null }>
	>([]);
	const [numero, setNumero] = useState<string>("");
	const [bonDeCommandeStatus, setBonDeCommandeStatus] = useState<
		string | null
	>(null);
	const [sousReserveSubmitting, setSousReserveSubmitting] = useState(false);
	const [showApportInitial, setShowApportInitial] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			const [facturesResult, accessoiresResult] = await Promise.all([
				getAllFacturesForResponsableCommercial(),
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

	// Unique commercials from factures
	const uniqueCommercials = Array.from(
		new Map(
			factures
				.filter((f) => (f.userId || (f.user as { id?: string })?.id) && f.user)
				.map((f) => {
					const uid = f.userId || (f.user as { id?: string })?.id || "";
					return [
						uid,
						{
							id: uid,
							label:
								`${f.user?.firstName || ""} ${f.user?.lastName || ""}`.trim() ||
								f.user?.email ||
								uid,
						},
					];
				}),
		).values(),
	);

	// Filter factures by selected commercial
	const filteredFactures =
		selectedCommercialId === "all"
			? factures
			: factures.filter(
					(f) =>
						(f.userId || (f.user as { id?: string })?.id) ===
						selectedCommercialId,
				);

	const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentData = filteredFactures.slice(startIndex, endIndex);

	// Reset to page 1 when commercial filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCommercialId]);

	useEffect(() => {
		const fetchNumero = async () => {
			if (filteredFactures.length === 0) {
				setNumero("");
				return;
			}

			const currentFacture = filteredFactures.slice(startIndex, endIndex)[0];
			if (!currentFacture) {
				setNumero("");
				return;
			}

			const result = await getBonDeCommandeByFactureId(currentFacture.id);
			if (result.success && result.data) {
				setNumero(result.data.numero);
				setBonDeCommandeStatus(result.data.status_bon_de_commande);
			} else {
				setNumero("");
				setBonDeCommandeStatus(null);
			}
		};

		fetchNumero();
	}, [filteredFactures, currentPage, startIndex, endIndex]);

	const goToNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	};

	const goToPrevPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1));
	};

	const handleGenerateNumero = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		const result = await generateNextNumero(currentFacture.id);
		if (result.success && result.data) {
			setNumero(result.data.numero);
			const bonResult = await getBonDeCommandeByFactureId(currentFacture.id);
			if (bonResult.success && bonResult.data) {
				setBonDeCommandeStatus(bonResult.data.status_bon_de_commande);
			}
			toast.success(`Numéro généré: ${result.data.numero}`);

			if (currentFacture.clientId) {
				try {
					await updateClient(currentFacture.clientId, {
						status_client: "CLIENT",
					});
				} catch (error) {
					console.error("Error updating client status:", error);
				}
			}

			if (currentFacture.clientEntrepriseId) {
				try {
					await updateClientEntreprise(currentFacture.clientEntrepriseId, {
						status_client: "CLIENT",
					});
				} catch (error) {
					console.error("Error updating client_entreprise status:", error);
				}
			}
		} else {
			toast.error("Erreur lors de la génération du numéro");
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const handleSousReserve = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		setSousReserveSubmitting(true);
		try {
			const result = await updateBonDeCommandeStatus(
				currentFacture.id,
				"SOUS_RESERVE",
			);
			if (result.success) {
				setBonDeCommandeStatus("SOUS_RESERVE");
				toast.success("Statut mis à jour : SOUS RÉSERVE");
			} else {
				toast.error(result.error || "Erreur lors de la mise à jour");
			}
		} finally {
			setSousReserveSubmitting(false);
		}
	};

	const handleDelete = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		if (
			confirm(
				`Êtes-vous sûr de vouloir supprimer ce bon de commande (${currentFacture.id.slice(
					-7,
				)}) ?`,
			)
		) {
			const result = await deleteFacture(currentFacture.id);
			if (result.success) {
				toast.success("Bon de commande supprimé avec succès");
				const updatedResult = await getAllFacturesForResponsableCommercial();
				if (updatedResult.success && updatedResult.data) {
					const updated = updatedResult.data as unknown as Facture[];
					setFactures(updated);
					const filtered =
						selectedCommercialId === "all"
							? updated
							: updated.filter(
									(f) =>
										(f.userId || (f.user as { id?: string })?.id) ===
										selectedCommercialId,
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
			toast.error("Aucun bon de commande à exporter");
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
							children: [
								new Paragraph({ text: "N°", alignment: AlignmentType.CENTER }),
							],
						}),
						new DocxTableCell({
							children: [
								new Paragraph({ text: "Description du produit / service" }),
							],
						}),
						new DocxTableCell({
							children: [
								new Paragraph({
									text: "Quantité",
									alignment: AlignmentType.CENTER,
								}),
							],
						}),
						new DocxTableCell({
							children: [
								new Paragraph({
									text: "Prix Unitaire (FCFA)",
									alignment: AlignmentType.RIGHT,
								}),
							],
						}),
						new DocxTableCell({
							children: [
								new Paragraph({
									text: "Total (FCFA)",
									alignment: AlignmentType.RIGHT,
								}),
							],
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
									new Paragraph({
										text: String(rowIndex),
										alignment: AlignmentType.CENTER,
									}),
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
					}),
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
										new Paragraph({
											text: String(rowIndex),
											alignment: AlignmentType.CENTER,
										}),
									],
								}),
								new DocxTableCell({
									children: [new Paragraph({ text: acc.nom })],
								}),
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
											text: formatNumberWithSpaces(
												acc.prix * (acc.quantity || 1),
											),
											alignment: AlignmentType.RIGHT,
										}),
									],
								}),
							],
						}),
					);
				});
			} else if (facture.accessoire_nom) {
				rowIndex++;
				tableRows.push(
					new DocxTableRow({
						children: [
							new DocxTableCell({
								children: [
									new Paragraph({
										text: String(rowIndex),
										alignment: AlignmentType.CENTER,
									}),
								],
							}),
							new DocxTableCell({
								children: [new Paragraph({ text: facture.accessoire_nom })],
							}),
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
											(facture.accessoire_prix || 0) /
												(facture.accessoire_nbr || 1),
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
					}),
				);
			}

			tableRows.push(
				new DocxTableRow({
					children: [
						new DocxTableCell({
							columnSpan: 4,
							children: [
								new Paragraph({
									text: "Sous-total :",
									alignment: AlignmentType.RIGHT,
								}),
							],
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
								new Paragraph({
									text: `TVA (${facture.tva}%) :`,
									alignment: AlignmentType.RIGHT,
								}),
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
								new Paragraph({
									text: "Montant Total TTC :",
									alignment: AlignmentType.RIGHT,
								}),
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
				}),
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
					text: "BON DE COMMANDE",
					alignment: AlignmentType.CENTER,
					spacing: { after: 100 },
				}),
			];

			if (showApportInitial) {
				docChildren.push(
					new Paragraph({
						text: "En Apport Initial 60% du Montant Total TTC",
						alignment: AlignmentType.CENTER,
						spacing: { after: 200 },
					}),
				);
			}

			docChildren.push(
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
				new Paragraph({
					text: "Adresse : Cocody, Riviera Palmerais, Abidjan, Côte d'Ivoire",
				}),
				new Paragraph({ text: "Téléphone : +225 01 01 04 77 03" }),
				new Paragraph({
					text: "Email : info@kpandji.com",
					spacing: { after: 200 },
				}),
				new Paragraph({
					text: "2️⃣ Informations du client",
					spacing: { before: 100, after: 100 },
				}),
				new Paragraph({
					text: `Nom du client / Entreprise : ${facture.client?.nom || facture.clientEntreprise?.nom_entreprise}`,
				}),
				new Paragraph({
					text: `Téléphone : ${facture.client?.telephone || facture.clientEntreprise?.telephone || ""}`,
				}),
				new Paragraph({
					text: `Email : ${facture.client?.email || facture.clientEntreprise?.email || "__________________________"}`,
				}),
				new Paragraph({
					text: `Adresse : ${facture.client?.localisation || facture.clientEntreprise?.localisation || "_________________________________________"}`,
					spacing: { after: 200 },
				}),
				new Paragraph({
					text: "3️⃣ Détails du bon de commande",
					spacing: { before: 100, after: 100 },
				}),
				new DocxTable({ rows: tableRows, width: { size: 100, type: "pct" } }),
				new Paragraph({
					text: "4️⃣ Conditions de commande",
					spacing: { before: 300, after: 100 },
				}),
				new Paragraph({
					text: `Date du bon de commande : ${formatDateDDMMYYYY(facture.date_facture)}`,
				}),
				new Paragraph({
					text: `Date d'échéance : ${formatDateDDMMYYYY(facture.date_echeance)}`,
				}),
				new Paragraph({
					text: "Mode de paiement : Virement bancaire / Chèque / Cache",
				}),
				new Paragraph({ text: "Délai de livraison : 4 mois" }),
				new Paragraph({
					text: "Lieu de livraison : KPANDJI Automobiles - Abidjan",
				}),
				new Paragraph({
					text: "Validité : 15 jours à compter de la date d'émission",
					spacing: { after: 200 },
				}),
				new Paragraph({
					text: "Remarque : Ce bon de commande vaut engagement d'achat ferme une fois signé par le client.",
					spacing: { after: 300 },
				}),
				new Paragraph({ text: "Direction", spacing: { before: 100 } }),
				new Paragraph({
					text: `Nom : ${facture.user?.firstName || ""} ${facture.user?.lastName || ""}`,
				}),
				new Paragraph({ text: "Client", spacing: { before: 200 } }),
				new Paragraph({
					text: `Nom : ${facture.client?.nom || facture.clientEntreprise?.nom_entreprise}`,
				}),
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
			const fileName = `Bon_Commande_${numero || facture.id.slice(-7)}_${format(new Date(), "yyyy-MM-dd")}.docx`;
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
          /* SOUS RESERVE stamp: always top layer when printing */
          #printable-area .sous-reserve-stamp {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            top: auto !important;
            z-index: 50 !important;
            pointer-events: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 10mm 6mm;
          }
        }
      `,
				}}
			/>

			<div className="flex flex-col w-full min-h-0 bg-gradient-to-br from-amber-50 via-white to-orange-50">
				<div className="flex flex-col flex-1 min-h-0 bg-white rounded-lg shadow-2xl px-4 py-8">
					<div className="flex shrink-0 w-full justify-between mb-6 print-hide">
						<div className="flex gap-4 items-center">
							<div className="flex items-center gap-2">
								<label
									htmlFor="commercial-filter"
									className="text-sm font-semibold text-gray-700">
									Commercial :
								</label>
								<Select
									value={selectedCommercialId}
									onValueChange={(v) => setSelectedCommercialId(v)}>
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
							</div>
							<Button
								onClick={handleDelete}
								disabled={currentData.length === 0}
								className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
								SUPPRIMER
							</Button>

							<Button
								type="button"
								onClick={handleSousReserve}
								disabled={
									currentData.length === 0 ||
									bonDeCommandeStatus === null ||
									bonDeCommandeStatus === "SOUS_RESERVE" ||
									sousReserveSubmitting
								}
								className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
								{sousReserveSubmitting ? "…" : "SOUS RESERVE"}
							</Button>

							<Button className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
								VALIDE{" "}
							</Button>

							<Button className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
								VALIDE + APPORT INITIAL{" "}
							</Button>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={handleExportToWord}
								disabled={currentData.length === 0}
								className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
								<FileDown className="w-5 h-5 mr-2" />
								EXPORT TO WORD
							</Button>
							<Button
								onClick={handlePrint}
								className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
								<Printer className="w-5 h-5 mr-2" />
								IMPRIMER
							</Button>
						</div>
					</div>

					<div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-260px)] print:max-h-none print:overflow-visible">
						<div id="printable-area" className="relative">
							<div className="flex w-full justify-between border-b-2 border-orange-800 pb-4 mb-3">
								<div>
									<Image
										src="/logo.png"
										alt="Logo"
										width={60}
										height={30}
										priority
									/>
								</div>
								<div className="flex flex-col justify-center -mb-10">
									<h1 className="text-2xl font-bold text-orange-900">
										KPANDJI AUTOMOBILES
									</h1>
									<p className="text-sm text-black font-normal">
										Constructeur et Assembleur Automobile
									</p>
								</div>
							</div>

							<div className="flex justify-between items-center">
								<div></div>
								<div className="flex flex-col items-center justify-center ">
									<h1 className="text-xl font-bold text-orange-800 border-2 border-black px-4 py-2 rounded-lg shadow-lg">
										BON DE COMMANDE
									</h1>
									{showApportInitial && (
										<h1 className="text-sm font-bold text-black  py-2 ">
											{" "}
											En Apport Initial 60% du Montant Total TTC{" "}
										</h1>
									)}
								</div>

								<div className="flex justify-end  ">
									<div className="flex gap-2 items-center">
										<h1 className="text-xl font-bold text-orange-800 ">
											NUMERO:
										</h1>
										<h1 className="text-lg font-bold text-black ">
											{numero || "______"}
										</h1>
									</div>
								</div>
							</div>

							{currentData.map((facture: Facture) => (
								<div key={facture.id}>
									{/* Commercial badge - shows who created this bon de commande */}
									<div className="mb-3 print-hide">
										<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-300">
											Commercial : {facture.user?.firstName}{" "}
											{facture.user?.lastName}
										</span>
									</div>

									<div className="w-full flex items-center justify-between">
										<div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 ">
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
													<p>
														Cocody, Riviera Palmerais, Abidjan, Côte
														d&apos;Ivoire
													</p>
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

										<div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 ">
											<h2 className="text-sm font-bold text-orange-800 mb-3">
												2️⃣ Informations du client
											</h2>
											<div className="grid grid-cols-1 gap-2 text-xs">
												<div className="flex gap-2">
													<p className="font-semibold">
														Nom du client / Entreprise :
													</p>
													<p>
														{facture.client?.nom ||
															facture.clientEntreprise?.nom_entreprise}
													</p>
												</div>
												{facture.client?.entreprise && (
													<div className="flex gap-2">
														<p className="font-semibold">Entreprise :</p>
														<p>{facture.client.entreprise}</p>
													</div>
												)}
												<div className="flex gap-2">
													<p className="font-semibold">Téléphone :</p>
													<p>
														{facture.client?.telephone ||
															facture.clientEntreprise?.telephone}
													</p>
												</div>
												<div className="flex gap-2">
													<p className="font-semibold">Email :</p>
													<p>
														{facture.client?.email ||
															facture.clientEntreprise?.email ||
															"__________________________"}
													</p>
												</div>
												<div className="flex gap-2">
													<p className="font-semibold">Adresse :</p>
													<p>
														{facture.client?.localisation ||
															facture.clientEntreprise?.localisation ||
															"_________________________________________"}
													</p>
												</div>
											</div>
										</div>
									</div>

									<div
										className={`relative mb-2 ${
											bonDeCommandeStatus === "SOUS_RESERVE"
												? "pb-28 sm:pb-36 print:pb-28"
												: ""
										}`}>
										<h2 className="text-sm font-bold text-gray-800 mb-1">
											3️⃣ Détails du bon de commande
										</h2>
										<Table className="rounded-lg overflow-visible text-xs">
											<TableHeader>
												<TableRow className="bg-blue-100 border-b-2 border-blue-600">
													<TableHead className="text-black font-bold text-center">
														N°
													</TableHead>
													<TableHead className="text-black font-bold">
														Description du produit / service
													</TableHead>
													<TableHead className="text-black font-bold text-center">
														Quantité
													</TableHead>
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
																		nbr_voiture:
																			factureItem.nbr_voiture_commande,
																		prix_unitaire: factureItem.prix_unitaire,
																		montant_ligne: factureItem.montant_ht,
																		transmission: "",
																		motorisation: "",
																		voitureModel:
																			factureItem.voiture?.voitureModel || null,
																	},
																];

													return lignes.map((ligne, index) => (
														<TableRow
															key={`${factureItem.id}-${ligne.id}`}
															className={
																index % 2 === 0
																	? "bg-white border-b border-orange-200"
																	: "bg-orange-50 hover:bg-orange-100 border-b border-orange-200"
															}>
															<TableCell className="text-black font-semibold text-center">
																{index + 1}
															</TableCell>
															<TableCell className="text-black">
																<div className="flex gap-3">
																	{ligne.voitureModel?.image ? (
																		<Image
																			src={ligne.voitureModel.image}
																			alt={
																				ligne.voitureModel.model || "Vehicle"
																			}
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
																			<p className="text-[8px] text-wrap max-w-5xl font-normal text-black ">
																				{ligne.voitureModel.description}
																			</p>
																		)}
																		<div className="flex gap-y-2">
																			{ligne.couleur && (
																				<p className="text-[8px] font-normal text-blue-700 mr-2">
																					<b className="font-semibold mr-1">
																						Couleur:
																					</b>{" "}
																					{ligne.couleur} /
																				</p>
																			)}
																			{ligne.transmission && (
																				<p className="text-[8px] font-normal text-blue-700 mr-2">
																					<b className="font-semibold mr-1">
																						Transmission:
																					</b>{" "}
																					{ligne.transmission} /
																				</p>
																			)}
																			{ligne.motorisation && (
																				<p className="text-[8px] font-normal text-blue-700">
																					<b className="font-semibold mr-1">
																						Motorisation:
																					</b>{" "}
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
																{formatNumberWithSpaces(
																	Number(ligne.prix_unitaire),
																)}
															</TableCell>
															<TableCell className="text-black text-right text-sm">
																{formatNumberWithSpaces(
																	Number(ligne.montant_ligne),
																)}
															</TableCell>
														</TableRow>
													));
												})}

												{facture.accessoires &&
													facture.accessoires.length > 0 &&
													facture.accessoires.map((accessoire, accIndex) => (
														<TableRow
															key={`${facture.id}-accessoire-${accessoire.id}`}
															className="bg-white border-b border-orange-200">
															<TableCell className="text-black font-semibold text-center">
																{(facture.lignes ? facture.lignes.length : 0) +
																	accIndex +
																	1}
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
																		<p className="font-semibold">
																			{accessoire.nom}
																		</p>
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
																	accessoire.prix * (accessoire.quantity || 1),
																)}
															</TableCell>
														</TableRow>
													))}

												{facture.accessoire_nom &&
													(!facture.accessoires ||
														facture.accessoires.length === 0) && (
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
																			}>,
																		);
																		if (!imagePath) return null;
																		return (
																			<Image
																				src={imagePath}
																				alt={
																					facture.accessoire_nom || "Accessoire"
																				}
																				width={80}
																				height={60}
																				className="object-contain rounded"
																			/>
																		);
																	})()}
																	<div className="flex flex-col gap-y-1">
																		<p className="font-semibold">
																			{facture.accessoire_nom}
																		</p>
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
																	(facture.accessoire_prix || 0) /
																	(facture.accessoire_nbr || 1)
																)
																	.toLocaleString()
																	.replace(/,/g, " ")}
															</TableCell>
															<TableCell className="text-black text-right text-sm">
																{formatNumberWithSpaces(
																	facture.accessoire_prix || 0,
																)}
															</TableCell>
														</TableRow>
													)}
											</TableBody>
											<TableFooter>
												<TableRow className="bg-blue-100">
													<TableCell
														colSpan={4}
														className="text-right text-black font-semibold">
														Sous-total :
													</TableCell>
													<TableCell className="text-right font-bold text-black">
														{formatNumberWithSpaces(facture.total_ht)} FCFA
													</TableCell>
												</TableRow>
												<TableRow className="bg-white">
													<TableCell
														colSpan={4}
														className="text-right text-black">
														TVA ({facture.tva}%) :
													</TableCell>
													<TableCell className="text-right text-black">
														{formatNumberWithSpaces(facture.montant_tva)} FCFA
													</TableCell>
												</TableRow>
												<TableRow className="bg-orange-100 border-t-2 border-gray-900">
													<TableCell
														colSpan={4}
														className="text-right text-black font-bold text-sm">
														Montant Total TTC :
													</TableCell>
													<TableCell className="text-right font-bold text-sm text-black">
														{formatNumberWithSpaces(facture.total_ttc) +
															" FCFA"}
													</TableCell>
												</TableRow>
											</TableFooter>
										</Table>
										{bonDeCommandeStatus === "SOUS_RESERVE" && (
											<div
												className="sous-reserve-stamp pointer-events-none absolute inset-x-0 bottom-0 z-50 flex items-end justify-center px-2 pb-0"
												aria-hidden
											>
												<span
													className="inline-block select-none text-center font-black uppercase tracking-[0.12em] text-red-700"
													style={{
														fontSize: "clamp(2.75rem, 12vw, 5.5rem)",
														lineHeight: 1.05,
														transform:
															"perspective(560px) rotate(-22deg) rotateX(-18deg) translateY(2px)",
														transformOrigin: "center bottom",
														textShadow: `
															0 -2px 0 #fca5a5,
															0 -4px 0 #f87171,
															0 -6px 0 #ef4444,
															0 -8px 0 #dc2626,
															0 -10px 0 #b91c1c,
															0 -12px 0 #991b1b,
															0 -14px 0 #7f1d1d,
															0 -18px 20px rgba(0,0,0,0.35),
															0 -28px 40px rgba(0,0,0,0.2)
														`,
													}}>
													SOUS RESERVE
												</span>
											</div>
										)}
									</div>

									<div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-2">
										<h2 className="text-sm font-bold text-gray-800 mb-3">
											4️⃣ Conditions de commande
										</h2>
										<div className="grid grid-cols-2 gap-2 text-xs">
											<div className="flex gap-2">
												<p className="font-semibold">
													Date du bon de commande :
												</p>
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
												<span className="font-bold">Remarque :</span> Ce bon de
												commande vaut engagement d&apos;achat ferme une fois
												signé par le client.
											</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-2 mb-2">
										<div className="border-2 border-gray-400 rounded-lg p-2">
											<h3 className="text-xs font-bold text-black mb-2">
												Direction
											</h3>
											<div className="space-y-2">
												<div className="flex gap-2 items-center text-white">
													<p className="text-xs font-semibold mb-1">Nom :</p>
													<p className="text-white">
														{facture.user?.firstName} {facture.user?.lastName}
													</p>
												</div>
												<div>
													<p className="text-xs font-semibold mb-1">
														Signature :
													</p>
												</div>
												<div>
													<p className="text-xs font-semibold mb-1">Cachet :</p>
												</div>
											</div>
										</div>
										<div className="border-2 border-gray-400 rounded-lg p-2">
											<h3 className="text-xs font-bold text-black mb-2">
												Client
											</h3>
											<div className="space-y-2">
												<div className="flex gap-2 items-center">
													<p className="text-xs font-semibold mb-1">Nom :</p>
													<p className="text-black">
														{facture.client?.nom ||
															facture.clientEntreprise?.nom_entreprise}
													</p>
												</div>
												<div>
													<p className="text-xs font-semibold mb-1">
														Signature :
													</p>
												</div>
												<div>
													<p className="text-xs font-semibold mb-1">Cachet :</p>
												</div>
											</div>
										</div>
									</div>

									<div className="flex flex-col items-center w-full justify-center bg-blue-50 rounded-b-lg text-xs border-t-2 border-orange-800 text-black p-4 mt-4">
										<p className="font-thin text-center">
											Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan
											06 / Tel : 00225 01 01 04 77 03
										</p>
										<p className="font-thin text-center">
											Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 /
											CC :2213233 – ECOBANK : CI059 01046 121659429001 46
										</p>
										<p className="font-thin text-center">
											kpandjiautomobiles@gmail.com / www.kpandji.com
										</p>
									</div>
								</div>
							))}

							{filteredFactures.length === 0 && (
								<div className="text-center py-12">
									<p className="text-lg text-gray-600">
										Aucun bon de commande trouvé
									</p>
								</div>
							)}
						</div>
					</div>

					<div className="flex shrink-0 justify-center items-center gap-4 mt-6 print-hide">
						<Button
							onClick={goToPrevPage}
							disabled={currentPage === 1}
							className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold">
							<ChevronLeft className="w-5 h-5 mr-2" />
							Page Précédente
						</Button>

						<div className="flex items-center gap-2">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map(
								(pageNum) => (
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
										}`}>
										{pageNum}
									</div>
								),
							)}
						</div>

						<Button
							onClick={goToNextPage}
							disabled={currentPage === totalPages}
							className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold">
							Page Suivante
							<ChevronRight className="w-5 h-5 ml-2" />
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
