"use client";

import { useState, useEffect, useMemo } from "react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ChevronLeft,
	ChevronRight,
	Printer,
	FileDown,
	Plus,
	Trash2,
	Loader2,
	FileText,
	Library,
	FolderOpen,
	AlertTriangle,
	Inbox,
	CheckCircle2,
	BadgeCheck,
	FileSignature,
	Landmark,
	ScrollText,
	UsersRound,
	CreditCard,
	Layers,
	Presentation,
	Wrench,
	IdCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
	DOCUMENTATION_CATEGORY_STYLES,
	type DocumentationCategoryId,
	fileExtensionBadgeClass,
	fileExtensionOf,
} from "@/lib/documentation-categories";
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
import { getFacturesByUser, deleteFacture } from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import {
	generateNextNumeroAppelOffre,
	getAppelOffreByFactureId,
	getInformationAppelOffreByFactureId,
	saveEvolutionAppelOffre,
	saveInformationAppelOffre,
	getAppelOffreDocumentsSelectionData,
	saveAppelOffreDocuments,
	validateAppelOffre,
	type AppelOffreDocumentCategoryGroup,
	type AppelOffreDocumentOption,
	type EvolutionAppelOffreStep,
	type InformationAppelOffreFormData,
} from "@/lib/actions/appeloffre";
import { updateClientEntreprise } from "@/lib/actions/client_entreprise";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { fr as frLocale } from "date-fns/locale";

const CATEGORY_ICONS: Record<DocumentationCategoryId, LucideIcon> = {
	agrement: BadgeCheck,
	arf: FileSignature,
	rccm: Landmark,
	dfe: ScrollText,
	cnps: UsersRound,
	rib: CreditCard,
	catalogue: Layers,
	presentation: Presentation,
	"fiche-technique": Wrench,
	cni: IdCard,
};

function formatDocumentDate(iso: string): string {
	try {
		return format(new Date(iso), "d MMM yyyy", { locale: frLocale });
	} catch {
		return "";
	}
}

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
	accessoiresList: Array<{ id: string; nom: string; image?: string | null }>,
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
	const [validiteAppelOffre, setValiditeAppelOffre] = useState(false);
	const [validating, setValidating] = useState(false);
	const [showApportInitial, setShowApportInitial] = useState(false);
	const [evolutionDialogOpen, setEvolutionDialogOpen] = useState(false);
	const [evolutionSteps, setEvolutionSteps] = useState<
		EvolutionAppelOffreStep[]
	>([]);
	const [evolutionSaving, setEvolutionSaving] = useState(false);
	const [informationDialogOpen, setInformationDialogOpen] = useState(false);
	const [informationLoading, setInformationLoading] = useState(false);
	const [informationSaving, setInformationSaving] = useState(false);
	const [informationForm, setInformationForm] =
		useState<InformationAppelOffreFormData>({
			nomStrctureEmettrice: "",
			domaineActivite: "",
			telephone: "",
			email: "",
			numeroAppelOffre: "",
		});
	const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
	const [documentsLoading, setDocumentsLoading] = useState(false);
	const [documentsSaving, setDocumentsSaving] = useState(false);
	const [documentOptions, setDocumentOptions] = useState<
		AppelOffreDocumentOption[]
	>([]);
	const [documentCategories, setDocumentCategories] = useState<
		AppelOffreDocumentCategoryGroup[]
	>([]);
	const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(
		[],
	);
	const [hasInformationForDocuments, setHasInformationForDocuments] =
		useState(false);
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
					(f) => f.clientEntrepriseId != null,
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
				setValiditeAppelOffre(false);
				return;
			}

			const currentFacture = factures.slice(startIndex, endIndex)[0];
			if (!currentFacture) {
				setNumero("");
				setValiditeAppelOffre(false);
				return;
			}

			const result = await getAppelOffreByFactureId(currentFacture.id);
			if (result.success && result.data) {
				const data = result.data as {
					numero: string;
					validite_appel_offre: boolean;
				};
				setNumero(data.numero);
				setValiditeAppelOffre(data.validite_appel_offre);
			} else {
				setNumero("");
				setValiditeAppelOffre(false);
			}
		};

		fetchNumero();
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

		const result = await generateNextNumeroAppelOffre(currentFacture.id);
		if (result.success && result.data) {
			setNumero(result.data.numero);
			toast.success(`Numéro généré: ${result.data.numero}`);

			if (currentFacture.clientEntrepriseId) {
				try {
					const clientEntrepriseUpdateResult = await updateClientEntreprise(
						currentFacture.clientEntrepriseId,
						{ status_client: "CLIENT" },
					);
					if (!clientEntrepriseUpdateResult.success) {
						console.error(
							"Failed to update client_entreprise status:",
							clientEntrepriseUpdateResult.error,
						);
					}
				} catch (error) {
					console.error("Error updating client_entreprise status:", error);
				}
			}
		} else {
			toast.error("Erreur lors de la génération du numéro");
		}
	};

	const handleValidate = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture || !numero || validiteAppelOffre) return;

		setValidating(true);
		try {
			const result = await validateAppelOffre(currentFacture.id);
			if (result.success) {
				setValiditeAppelOffre(true);
				toast.success("Appel d'offre validé avec succès");
			} else {
				toast.error(
					result.error ?? "Impossible de valider l'appel d'offre",
				);
			}
		} finally {
			setValidating(false);
		}
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
		value: string,
	) => {
		setEvolutionSteps((prev) =>
			prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
		);
	};

	const handleOpenInformationDialog = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		if (!numero) {
			toast.error(
				"Générez d'abord le numéro de l'appel d'offre avant d'ajouter les informations",
			);
			return;
		}

		setInformationDialogOpen(true);
		setInformationLoading(true);

		const result = await getInformationAppelOffreByFactureId(
			currentFacture.id,
		);

		if (result.success && result.data) {
			setInformationForm(result.data);
		} else if (result.success) {
			setInformationForm({
				nomStrctureEmettrice:
					currentFacture.clientEntreprise?.nom_entreprise ?? "",
				domaineActivite: "",
				telephone: currentFacture.clientEntreprise?.telephone ?? "",
				email: currentFacture.clientEntreprise?.email ?? "",
				numeroAppelOffre: numero,
			});
		} else {
			toast.error(result.error ?? "Erreur lors du chargement");
			setInformationDialogOpen(false);
		}

		setInformationLoading(false);
	};

	const updateInformationField = (
		field: keyof Omit<InformationAppelOffreFormData, "id">,
		value: string,
	) => {
		setInformationForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveInformation = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		setInformationSaving(true);
		const result = await saveInformationAppelOffre(
			currentFacture.id,
			informationForm,
		);
		setInformationSaving(false);

		if (result.success) {
			toast.success("Informations enregistrées avec succès");
			setInformationDialogOpen(false);
		} else {
			toast.error(result.error ?? "Erreur lors de l'enregistrement");
		}
	};

	const handleOpenDocumentsDialog = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		if (!numero) {
			toast.error(
				"Générez d'abord le numéro de l'appel d'offre avant d'ajouter des documents",
			);
			return;
		}

		setDocumentsDialogOpen(true);
		setDocumentsLoading(true);

		const result = await getAppelOffreDocumentsSelectionData(
			currentFacture.id,
		);

		if (result.success && result.data) {
			setDocumentCategories(result.data.categories);
			setDocumentOptions(result.data.documents);
			setSelectedDocumentIds(result.data.selectedDocumentationIds);
			setHasInformationForDocuments(result.data.hasInformation);
		} else {
			toast.error(result.error ?? "Erreur lors du chargement");
			setDocumentsDialogOpen(false);
		}

		setDocumentsLoading(false);
	};

	const toggleDocumentSelection = (documentId: string, checked: boolean) => {
		setSelectedDocumentIds((prev) => {
			if (checked) {
				return prev.includes(documentId)
					? prev
					: [...prev, documentId];
			}
			return prev.filter((id) => id !== documentId);
		});
	};

	const handleSelectAllDocuments = () => {
		setSelectedDocumentIds(documentOptions.map((doc) => doc.id));
	};

	const handleClearDocumentSelection = () => {
		setSelectedDocumentIds([]);
	};

	const documentSelectionStats = useMemo(() => {
		const availableCount = documentOptions.length;
		const selectedCount = selectedDocumentIds.length;
		const categoriesWithFiles = documentCategories.filter(
			(c) => c.documents.length > 0,
		).length;
		return { availableCount, selectedCount, categoriesWithFiles };
	}, [documentOptions.length, selectedDocumentIds.length, documentCategories]);

	const toggleCategorySelection = (
		category: AppelOffreDocumentCategoryGroup,
		checked: boolean,
	) => {
		const ids = category.documents.map((doc) => doc.id);
		setSelectedDocumentIds((prev) => {
			if (checked) {
				return [...new Set([...prev, ...ids])];
			}
			return prev.filter((id) => !ids.includes(id));
		});
	};

	const isCategoryFullySelected = (
		category: AppelOffreDocumentCategoryGroup,
	) =>
		category.documents.length > 0 &&
		category.documents.every((doc) => selectedDocumentIds.includes(doc.id));

	const isCategoryPartiallySelected = (
		category: AppelOffreDocumentCategoryGroup,
	) => {
		const selectedInCategory = category.documents.filter((doc) =>
			selectedDocumentIds.includes(doc.id),
		).length;
		return (
			selectedInCategory > 0 &&
			selectedInCategory < category.documents.length
		);
	};

	const handleSaveDocuments = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		if (!hasInformationForDocuments) {
			toast.error(
				"Enregistrez d'abord les informations de l'appel d'offre avant d'ajouter des documents",
			);
			return;
		}

		if (selectedDocumentIds.length === 0) {
			toast.error("Sélectionnez au moins un document");
			return;
		}

		setDocumentsSaving(true);
		const result = await saveAppelOffreDocuments(
			currentFacture.id,
			selectedDocumentIds,
		);
		setDocumentsSaving(false);

		if (result.success) {
			toast.success("Documents enregistrés avec succès");
			setDocumentsDialogOpen(false);
		} else {
			toast.error(result.error ?? "Erreur lors de l'enregistrement");
		}
	};

	const handleSaveEvolution = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture) return;

		if (!numero) {
			toast.error(
				"Générez d'abord le numéro de l'appel d'offre avant d'enregistrer",
			);
			return;
		}

		setEvolutionSaving(true);
		const result = await saveEvolutionAppelOffre(
			currentFacture.id,
			evolutionSteps,
		);
		setEvolutionSaving(false);

		if (result.success) {
			toast.success("Évolution enregistrée avec succès");
			setEvolutionDialogOpen(false);
		} else {
			toast.error(result.error ?? "Erreur lors de l'enregistrement");
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const handleDelete = async () => {
		const currentFacture = currentData[0];
		if (!currentFacture || !clerkId) return;

		if (
			confirm(
				`Êtes-vous sûr de vouloir supprimer cet appel d'offre (${currentFacture.id.slice(-7)}) ?`,
			)
		) {
			const result = await deleteFacture(currentFacture.id);
			if (result.success) {
				toast.success("Appel d'offre supprimé avec succès");
				const updatedFactures = await getFacturesByUser(clerkId);
				if (updatedFactures.success && updatedFactures.data) {
					const allFactures = updatedFactures.data as unknown as Facture[];
					const clientEntrepriseFactures = allFactures.filter(
						(f) => f.clientEntrepriseId != null,
					);
					setFactures(clientEntrepriseFactures);
					if (
						currentPage >
						Math.ceil(clientEntrepriseFactures.length / itemsPerPage)
					) {
						setCurrentPage(
							Math.max(
								1,
								Math.ceil(clientEntrepriseFactures.length / itemsPerPage),
							),
						);
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
			toast.error("Aucun appel d'offre à exporter");
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
					text: "APPEL D'OFFRE",
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
					text: `Nom du client / Entreprise : ${facture.clientEntreprise?.nom_entreprise}`,
				}),
				new Paragraph({
					text: `Téléphone : ${facture.clientEntreprise?.telephone || ""}`,
				}),
				new Paragraph({
					text: `Email : ${facture.clientEntreprise?.email || "__________________________"}`,
				}),
				new Paragraph({
					text: `Adresse : ${facture.clientEntreprise?.localisation || "_________________________________________"}`,
					spacing: { after: 200 },
				}),
				new Paragraph({
					text: "3️⃣ Détails de l'appel d'offre",
					spacing: { before: 100, after: 100 },
				}),
				new DocxTable({ rows: tableRows, width: { size: 100, type: "pct" } }),
				new Paragraph({
					text: "4️⃣ Conditions de l'offre",
					spacing: { before: 300, after: 100 },
				}),
				new Paragraph({
					text: `Date de l'appel d'offre : ${formatDateDDMMYYYY(facture.date_facture)}`,
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
					text: "Validité de l'offre : 30 jours à compter de la date d'émission",
					spacing: { after: 200 },
				}),
				new Paragraph({
					text: "Remarque : Cette offre constitue notre proposition commerciale en réponse à votre appel d'offres. Elle engage KPANDJI AUTOMOBILES dès sa signature.",
					spacing: { after: 300 },
				}),
				new Paragraph({ text: "Direction", spacing: { before: 100 } }),
				new Paragraph({
					text: `Nom : ${facture.user?.firstName || ""} ${facture.user?.lastName || ""}`,
				}),
				new Paragraph({ text: "Client", spacing: { before: 200 } }),
				new Paragraph({
					text: `Nom : ${facture.clientEntreprise?.nom_entreprise}`,
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
			const fileName = `Appel_Offre_${numero || facture.id.slice(-7)}_${format(new Date(), "yyyy-MM-dd")}.docx`;
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
								className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								SUPPRIMER
							</Button>
							<Button
								onClick={handleGenerateNumero}
								disabled={!!numero}
								className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								GÉNÉRER NUMÉRO
							</Button>
							<Button
								onClick={() => setShowApportInitial(true)}
								disabled={showApportInitial}
								className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								Apport Initial
							</Button>
							<Button
								onClick={handleValidate}
								disabled={!numero || validiteAppelOffre || validating}
								className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								{validating ? (
									<>
										<Loader2 className="w-4 h-4 mr-1 sm:mr-2 shrink-0 animate-spin" />
										Validation...
									</>
								) : validiteAppelOffre ? (
									"Validé"
								) : (
									"Valider"
								)}
							</Button>

							<Button
								onClick={handleOpenInformationDialog}
								disabled={!numero}
								className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								Ajouter Information
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								onClick={handleOpenDocumentsDialog}
								disabled={!numero}
								className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								Ajouter Document
							</Button>

							<Button
								onClick={handleExportToWord}
								disabled={currentData.length === 0}
								className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								<FileDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" />
								EXPORT<span className="hidden sm:inline"> TO WORD</span>
							</Button>
							<Button
								onClick={handlePrint}
								className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
								<Printer className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" />
								IMPRIMER
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
									style={{
										height: "clamp(40px, 8vw, 52px)",
										width: "auto",
										maxWidth: "140px",
									}}
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
									APPEL D&apos;OFFRE
								</h1>
								{showApportInitial && (
									<p className="mt-2 text-center text-xs font-bold text-black sm:text-sm">
										En Apport Initial 60% du Montant Total TTC
									</p>
								)}
							</div>
							<div className="flex w-full justify-center sm:w-auto sm:justify-end sm:shrink-0">
								<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
									<span className="text-base font-bold text-orange-800 sm:text-xl">
										NUMERO:
									</span>
									<span className="text-base font-bold text-black sm:text-lg break-all">
										{numero || "______"}
									</span>
								</div>
							</div>
						</div>

						{currentData.map((facture: Facture) => (
							<div key={facture.id}>
								<div className="mt-4 flex w-full flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-4">
									<div className="min-w-0 flex-1 bg-blue-50 border-2 border-blue-300 rounded-lg p-2 sm:p-3">
										<h2 className="text-xs font-bold text-blue-800 mb-3 sm:text-sm">
											1️⃣ Informations de l&apos;entreprise (fournisseur)
										</h2>
										<div className="grid grid-cols-1 gap-2 text-[11px] sm:text-xs">
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Entreprise :</p>
												<p className="min-w-0 break-words">
													KPANDJI AUTOMOBILES
												</p>
											</div>
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Adresse :</p>
												<p className="min-w-0 break-words">
													Cocody, Riviera Palmerais, Abidjan, Côte d&apos;Ivoire
												</p>
											</div>
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Téléphone :</p>
												<p className="min-w-0 break-words">
													+225 01 01 04 77 03
												</p>
											</div>
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Email :</p>
												<p className="min-w-0 break-all">info@kpandji.com</p>
											</div>
										</div>
									</div>

									<div className="min-w-0 flex-1 bg-orange-50 border-2 border-orange-300 rounded-lg p-3 sm:p-4">
										<h2 className="text-xs font-bold text-orange-800 mb-3 sm:text-sm">
											2️⃣ Informations du client
										</h2>
										<div className="grid grid-cols-1 gap-2 text-[11px] sm:text-xs">
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">
													Nom du client / Entreprise :
												</p>
												<p className="min-w-0 break-words">
													{facture.clientEntreprise?.nom_entreprise}
												</p>
											</div>
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Téléphone :</p>
												<p className="min-w-0 break-words">
													{facture.clientEntreprise?.telephone}
												</p>
											</div>
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Email :</p>
												<p className="min-w-0 break-all">
													{facture.clientEntreprise?.email ||
														"__________________________"}
												</p>
											</div>
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
												<p className="shrink-0 font-semibold">Adresse :</p>
												<p className="min-w-0 break-words">
													{facture.clientEntreprise?.localisation ||
														"_________________________________________"}
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className="mb-2 min-w-0">
									<h2 className="text-xs font-bold text-gray-800 mb-2 sm:text-sm">
										3️⃣ Détails de l&apos;appel d&apos;offre
									</h2>
									<div className="-mx-1 overflow-x-auto rounded-lg border border-transparent px-1 sm:mx-0 sm:px-0">
										<Table className="w-full min-w-[600px] rounded-lg overflow-hidden text-[10px] sm:text-xs lg:min-w-0">
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
															<TableCell className="text-black min-w-0">
																<div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
																	{ligne.voitureModel?.image ? (
																		<Image
																			src={ligne.voitureModel.image}
																			alt={
																				ligne.voitureModel.model || "Vehicle"
																			}
																			width={80}
																			height={60}
																			className="mx-auto h-auto w-16 shrink-0 object-contain rounded sm:mx-0 sm:w-20"
																		/>
																	) : null}
																	<div className="flex flex-col gap-y-1">
																		<p className="font-semibold">
																			{ligne.voitureModel?.model || "N/A"}
																		</p>
																		{ligne.voitureModel?.description && (
																			<p className="text-[8px] text-wrap font-normal text-black sm:max-w-5xl">
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
															<TableCell className="text-black min-w-0">
																<div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
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
																				className="mx-auto h-auto w-16 shrink-0 object-contain rounded sm:mx-0 sm:w-20"
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
									</div>
								</div>

								<div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 sm:p-4 mb-2">
									<h2 className="text-xs font-bold text-gray-800 mb-3 sm:text-sm">
										4️⃣ Conditions de l&apos;offre
									</h2>
									<div className="grid grid-cols-1 gap-3 text-[11px] sm:grid-cols-2 sm:gap-2 sm:text-xs">
										<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
											<p className="shrink-0 font-semibold">
												Date de l&apos;appel d&apos;offre :
											</p>
											<p className="min-w-0 break-words">
												{formatDateDDMMYYYY(facture.date_facture)}
											</p>
										</div>
										<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
											<p className="shrink-0 font-semibold">
												Date d&apos;échéance :
											</p>
											<p className="min-w-0 break-words">
												{formatDateDDMMYYYY(facture.date_echeance)}
											</p>
										</div>
										<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2 sm:col-span-2">
											<p className="shrink-0 font-semibold">
												Mode de paiement :
											</p>
											<p className="min-w-0 break-words">
												Virement bancaire / Chèque / Cache
											</p>
										</div>
										<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
											<p className="shrink-0 font-semibold">
												Délai de livraison :
											</p>
											<p>4 mois</p>
										</div>
										<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
											<p className="shrink-0 font-semibold">
												Lieu de livraison :
											</p>
											<p className="min-w-0 break-words">
												KPANDJI Automobiles - Abidjan
											</p>
										</div>
										<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2 sm:col-span-2">
											<p className="shrink-0 font-semibold">
												Validité de l&apos;offre :
											</p>
											<p className="min-w-0 break-words">
												30 jours à compter de la date d&apos;émission
											</p>
										</div>
									</div>
									<div className="mt-3 p-2 bg-green-50 border border-green-300 rounded">
										<p className="text-xs">
											<span className="font-bold">Remarque :</span> Cette offre
											constitue notre proposition commerciale en réponse à votre
											appel d&apos;offres. Elle engage KPANDJI AUTOMOBILES dès
											sa signature.
										</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-3 mb-2 sm:grid-cols-2 sm:gap-2">
									<div className="border-2 border-gray-400 rounded-lg p-2 sm:p-3">
										<h3 className="text-xs font-bold text-black mb-2">
											Direction
										</h3>
										<div className="space-y-2">
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
												<p className="text-xs font-semibold">Nom :</p>
												<p className="text-xs text-black break-words">
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
									<div className="border-2 border-gray-400 rounded-lg p-2 sm:p-3">
										<h3 className="text-xs font-bold text-black mb-2">
											Client
										</h3>
										<div className="space-y-2">
											<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
												<p className="text-xs font-semibold">Nom :</p>
												<p className="text-xs text-black break-words">
													{facture.clientEntreprise?.nom_entreprise}
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

								<div className="flex flex-col items-center w-full justify-center bg-blue-50 rounded-b-lg text-[10px] border-t-2 border-orange-800 text-black p-3 mt-4 sm:text-xs sm:p-4">
									<p className="max-w-prose font-thin text-center leading-relaxed px-1">
										Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06
										/ Tel : 00225 01 01 04 77 03
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
								<p className="text-lg text-gray-600">
									Aucun appel d&apos;offre trouvé (client entreprise uniquement)
								</p>
							</div>
						)}
					</div>

					<div className="mt-6 flex flex-col items-stretch justify-center gap-4 print-hide sm:flex-row sm:flex-wrap sm:items-center">
						<Button
							onClick={goToPrevPage}
							disabled={currentPage === 1}
							className="order-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold sm:order-1">
							<ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" />
							<span className="hidden sm:inline">Page Précédente</span>
							<span className="sm:hidden">Précédent</span>
						</Button>

						<div className="order-1 flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:order-2 sm:gap-2">
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
										className={`min-w-[2.25rem] px-3 py-1.5 text-sm rounded-lg font-semibold transition-all cursor-pointer sm:px-4 sm:py-2 ${
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
							className="order-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold">
							<span className="hidden sm:inline">Page Suivante</span>
							<span className="sm:hidden">Suivant</span>
							<ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 shrink-0" />
						</Button>
					</div>
				</div>
			</div>

			<Dialog
				open={documentsDialogOpen}
				onOpenChange={setDocumentsDialogOpen}>
				<DialogContent className="flex max-h-[min(92dvh,92vh)] flex-col gap-0 overflow-hidden border-0 p-0 sm:max-w-2xl">
					<div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-amber-500 to-orange-400 px-6 pb-6 pt-8 text-white">
						<div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
						<div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
						<div className="relative flex items-start gap-4">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
								<Library className="h-6 w-6" />
							</div>
							<div className="min-w-0 flex-1 space-y-2">
								<DialogHeader className="space-y-2 text-left">
									<DialogTitle className="text-xl font-bold tracking-tight text-white sm:text-2xl">
										Joindre des documents
									</DialogTitle>
									<DialogDescription className="text-sm leading-relaxed text-white/85">
										Sélectionnez les pièces de la documentation commerciale à
										associer à cet appel d&apos;offre.
									</DialogDescription>
								</DialogHeader>
								{numero ? (
									<Badge className="border-white/25 bg-white/15 text-white hover:bg-white/15">
										Appel d&apos;offre · {numero}
									</Badge>
								) : null}
							</div>
						</div>
					</div>

					{documentsLoading ? (
						<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
							<Loader2 className="h-10 w-10 animate-spin text-orange-500" />
							<p className="text-sm text-muted-foreground">
								Chargement de la documentation...
							</p>
						</div>
					) : (
						<>
							<div className="space-y-4 border-b border-orange-100 bg-gradient-to-b from-amber-50/80 to-white px-6 py-4">
								{!hasInformationForDocuments && (
									<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
										<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
										<p>
											Enregistrez d&apos;abord les informations via{" "}
											<span className="font-semibold">
												Ajouter Information
											</span>{" "}
											avant de joindre des documents.
										</p>
									</div>
								)}

								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant="outline"
											className="border-orange-200 bg-white text-orange-900">
											<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
											{documentSelectionStats.selectedCount} sélectionné
											{documentSelectionStats.selectedCount > 1 ? "s" : ""}
										</Badge>
										<Badge
											variant="outline"
											className="border-orange-200/80 bg-white/80 text-orange-800/80">
											<FolderOpen className="h-3.5 w-3.5" />
											{documentSelectionStats.availableCount} fichier
											{documentSelectionStats.availableCount > 1 ? "s" : ""}{" "}
											disponible
											{documentSelectionStats.availableCount > 1 ? "s" : ""}
										</Badge>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleSelectAllDocuments}
											disabled={documentOptions.length === 0}
											className="border-orange-200 bg-white text-orange-900 hover:bg-orange-50">
											Tout sélectionner
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleClearDocumentSelection}
											disabled={selectedDocumentIds.length === 0}
											className="border-orange-200 bg-white text-orange-900 hover:bg-orange-50">
											Tout effacer
										</Button>
									</div>
								</div>
							</div>

							<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
								{documentOptions.length === 0 ? (
									<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-6 py-14 text-center">
										<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
											<Inbox className="h-7 w-7" />
										</div>
										<p className="text-base font-semibold text-orange-950">
											Aucun document disponible
										</p>
										<p className="mt-2 max-w-sm text-sm text-orange-800/70">
											Ajoutez des fichiers dans la page Documentation
											commerciale pour les retrouver ici.
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{documentCategories.map((category) => {
											const categoryId =
												category.categoryId as DocumentationCategoryId;
											const styles =
												DOCUMENTATION_CATEGORY_STYLES[categoryId];
											const CategoryIcon = CATEGORY_ICONS[categoryId];
											const hasFiles = category.documents.length > 0;
											const fullySelected =
												isCategoryFullySelected(category);
											const partiallySelected =
												isCategoryPartiallySelected(category);

											return (
												<div
													key={category.categoryId}
													className={cn(
														"overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
														hasFiles
															? "border-orange-100"
															: "border-dashed border-orange-100/80 opacity-80",
													)}>
													<div
														className={cn(
															"flex items-start gap-3 bg-gradient-to-r px-4 py-3",
															styles.gradient,
														)}>
														<div
															className={cn(
																"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
																styles.iconTint,
																styles.ring,
															)}>
															<CategoryIcon className="h-5 w-5" />
														</div>
														<div className="min-w-0 flex-1">
															<div className="flex flex-wrap items-center gap-2">
																<p className="font-semibold text-gray-900">
																	{category.label}
																</p>
																<Badge
																	variant="outline"
																	className="border-orange-200/70 bg-white/70 text-[11px] text-orange-800/80">
																	{category.documents.length} fichier
																	{category.documents.length > 1
																		? "s"
																		: ""}
																</Badge>
															</div>
															<p className="mt-0.5 text-xs text-gray-600">
																{styles.description}
															</p>
														</div>
														{hasFiles ? (
															<button
																type="button"
																onClick={() =>
																	toggleCategorySelection(
																		category,
																		!fullySelected,
																	)
																}
																className={cn(
																	"mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
																	fullySelected
																		? "border-orange-600 bg-orange-600 text-white"
																		: partiallySelected
																			? "border-orange-500 bg-orange-100 text-orange-700"
																			: "border-orange-300 bg-white hover:bg-orange-50",
																)}
																aria-label={`Sélectionner toute la catégorie ${category.label}`}>
																{fullySelected ? (
																	<CheckCircle2 className="h-3.5 w-3.5" />
																) : partiallySelected ? (
																	<span className="text-[10px] font-bold">
																		−
																	</span>
																) : null}
															</button>
														) : null}
													</div>

													{hasFiles ? (
														<div className="divide-y divide-orange-50">
															{category.documents.map((doc) => {
																const isSelected =
																	selectedDocumentIds.includes(doc.id);
																const ext = fileExtensionOf(doc.fileName);

																return (
																	<label
																		key={doc.id}
																		className={cn(
																			"flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors",
																			isSelected
																				? "bg-orange-50/80"
																				: "hover:bg-orange-50/40",
																		)}>
																		<Checkbox
																			checked={isSelected}
																			onCheckedChange={(checked) =>
																				toggleDocumentSelection(
																					doc.id,
																					checked === true,
																				)
																			}
																			className="border-orange-300 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
																		/>
																		<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100/80 text-orange-700">
																			<FileText className="h-4 w-4" />
																		</div>
																		<div className="min-w-0 flex-1">
																			<p className="truncate font-medium text-gray-900">
																				{doc.nom}
																			</p>
																			<p className="truncate text-xs text-gray-500">
																				{doc.fileName}
																			</p>
																		</div>
																		<div className="flex shrink-0 flex-col items-end gap-1">
																			<Badge
																				variant="outline"
																				className={cn(
																					"text-[10px] font-semibold",
																					fileExtensionBadgeClass(ext),
																				)}>
																				{ext}
																			</Badge>
																			{doc.createdAt ? (
																				<span className="text-[10px] text-gray-400">
																					{formatDocumentDate(doc.createdAt)}
																				</span>
																			) : null}
																		</div>
																	</label>
																);
															})}
														</div>
													) : (
														<div className="flex items-center gap-2 px-4 py-3 text-xs italic text-gray-400">
															<Inbox className="h-3.5 w-3.5" />
															Aucun fichier dans cette catégorie
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>

							<Separator className="bg-orange-100" />
							<DialogFooter className="gap-2 bg-white px-6 py-4 sm:justify-between">
								<p className="hidden text-xs text-muted-foreground sm:block">
									{documentSelectionStats.categoriesWithFiles} catégories avec
									fichiers
								</p>
								<div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
									<Button
										type="button"
										variant="outline"
										onClick={() => setDocumentsDialogOpen(false)}
										disabled={documentsSaving}
										className="border-orange-200 text-orange-900 hover:bg-orange-50">
										Annuler
									</Button>
									<Button
										type="button"
										onClick={handleSaveDocuments}
										disabled={
											documentsLoading ||
											documentsSaving ||
											documentOptions.length === 0
										}
										className="bg-gradient-to-r from-green-600 to-emerald-600 font-bold text-white shadow-md hover:from-green-700 hover:to-emerald-700">
										{documentsSaving ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Enregistrement...
											</>
										) : (
											<>
												<CheckCircle2 className="mr-2 h-4 w-4" />
												Enregistrer ({documentSelectionStats.selectedCount})
											</>
										)}
									</Button>
								</div>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={informationDialogOpen}
				onOpenChange={setInformationDialogOpen}>
				<DialogContent className="max-h-[min(90dvh,90vh)] overflow-y-auto sm:max-w-lg bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-orange-200">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-orange-900 sm:text-xl">
							Informations de l&apos;appel d&apos;offre
						</DialogTitle>
						<DialogDescription className="text-orange-800/80">
							{numero
								? `Appel d'offre n° ${numero} — renseignez les informations de la structure émettrice.`
								: "Renseignez les informations de la structure émettrice."}
						</DialogDescription>
					</DialogHeader>

					{informationLoading ? (
						<div className="flex items-center justify-center py-10">
							<Loader2 className="h-8 w-8 animate-spin text-orange-600" />
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="info-nom-structure"
									className="text-xs font-semibold text-orange-900">
									Nom de la structure émettrice
								</Label>
								<Input
									id="info-nom-structure"
									value={informationForm.nomStrctureEmettrice}
									onChange={(e) =>
										updateInformationField(
											"nomStrctureEmettrice",
											e.target.value,
										)
									}
									placeholder="Ex. Ministère des Transports"
									className="border-orange-200 focus-visible:border-orange-500"
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="info-domaine"
									className="text-xs font-semibold text-orange-900">
									Domaine d&apos;activité
								</Label>
								<Input
									id="info-domaine"
									value={informationForm.domaineActivite}
									onChange={(e) =>
										updateInformationField("domaineActivite", e.target.value)
									}
									placeholder="Ex. Transport public"
									className="border-orange-200 focus-visible:border-orange-500"
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="info-telephone"
									className="text-xs font-semibold text-orange-900">
									Téléphone
								</Label>
								<Input
									id="info-telephone"
									value={informationForm.telephone}
									onChange={(e) =>
										updateInformationField("telephone", e.target.value)
									}
									placeholder="Ex. +225 01 02 03 04 05"
									className="border-orange-200 focus-visible:border-orange-500"
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="info-email"
									className="text-xs font-semibold text-orange-900">
									Email
								</Label>
								<Input
									id="info-email"
									type="email"
									value={informationForm.email}
									onChange={(e) =>
										updateInformationField("email", e.target.value)
									}
									placeholder="Ex. contact@structure.ci"
									className="border-orange-200 focus-visible:border-orange-500"
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="info-numero"
									className="text-xs font-semibold text-orange-900">
									Numéro appel d&apos;offre
								</Label>
								<Input
									id="info-numero"
									value={informationForm.numeroAppelOffre}
									onChange={(e) =>
										updateInformationField("numeroAppelOffre", e.target.value)
									}
									readOnly={!!numero}
									className="border-orange-200 focus-visible:border-orange-500 read-only:bg-orange-50/80 read-only:cursor-default"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setInformationDialogOpen(false)}
							disabled={informationSaving}
							className="border-orange-300">
							Annuler
						</Button>
						<Button
							type="button"
							onClick={handleSaveInformation}
							disabled={informationLoading || informationSaving}
							className="bg-green-600 hover:bg-green-700 text-white font-bold">
							{informationSaving ? (
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

			<Dialog open={evolutionDialogOpen} onOpenChange={setEvolutionDialogOpen}>
				<DialogContent className="max-h-[min(90dvh,90vh)] overflow-y-auto sm:max-w-lg bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-orange-200">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-orange-900 sm:text-xl">
							Définir l&apos;évolution de l&apos;appel d&apos;offre
						</DialogTitle>
						<DialogDescription className="text-orange-800/80">
							{numero
								? `Appel d'offre n° ${numero} — ajoutez les étapes du parcours.`
								: "Ajoutez les étapes du parcours de l'appel d'offre."}
						</DialogDescription>
					</DialogHeader>

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
								title="Ajouter une étape">
								<Plus className="h-4 w-4" />
							</Button>
						</div>

						<div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
							{evolutionSteps.map((step, index) => (
								<div
									key={index}
									className="rounded-lg border-2 border-orange-200 bg-white/80 p-3 space-y-3">
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
											aria-label="Supprimer l'étape">
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor={`etape-actuelle-${index}`}
											className="text-xs font-semibold text-orange-900">
											Étape actuelle
										</Label>
										<Input
											id={`etape-actuelle-${index}`}
											value={step.etape_actuelle}
											onChange={(e) =>
												updateEvolutionStep(
													index,
													"etape_actuelle",
													e.target.value,
												)
											}
											placeholder="Ex. Commande validée"
											className="border-orange-200 focus-visible:border-orange-500"
										/>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor={`etape-suivante-${index}`}
											className="text-xs font-semibold text-orange-900">
											Étape suivante
										</Label>
										<Input
											id={`etape-suivante-${index}`}
											value={step.etape_suivante}
											onChange={(e) =>
												updateEvolutionStep(
													index,
													"etape_suivante",
													e.target.value,
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

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setEvolutionDialogOpen(false)}
							disabled={evolutionSaving}
							className="border-orange-300">
							Annuler
						</Button>
						<Button
							type="button"
							onClick={handleSaveEvolution}
							disabled={evolutionSaving}
							className="bg-green-600 hover:bg-green-700 text-white font-bold">
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
