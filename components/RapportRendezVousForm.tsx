"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Calendar,
	User,
	Car,
	Plus,
	Trash2,
	MessageSquare,
	CreditCard,
	ListTodo,
	MessageCircle,
} from "lucide-react";

interface ModeleDiscute {
	modele: string;
	motorisation: string;
	transmission: string;
	couleur: string;
	observation: string;
}

interface ActionSuivi {
	action: string;
	responsable: string;
	echeance: string;
	statut: string;
}

interface RapportRendezVousData {
	rendezVousId: string;
	clientId?: string;
	clientEntrepriseId?: string;
	date_rendez_vous: string;
	heure_rendez_vous: string;
	lieu_rendez_vous: string;
	lieu_autre?: string;
	conseiller_commercial: string;
	duree_rendez_vous: string;
	nom_prenom_client: string;
	telephone_client: string;
	email_client?: string;
	profession_societe?: string;
	type_client: string;
	Com_Pres: boolean;
	Com_Drive: boolean;
	Com_Achat: boolean;
	Com_Livre: boolean;
	Com_APV: boolean;
	Com_Office: boolean;
	Com_Close: boolean;
	PT_Etat: boolean;
	PT_INST: boolean;
	PT_AERO: boolean;
	PT_DIPLO: boolean;
	EV_SALON: boolean;
	EV_SPONSOR: boolean;
	EV_REVEAL: boolean;
	objet_autre?: string;
	modeles_discutes: ModeleDiscute[];
	motivations_achat?: string;
	points_positifs?: string;
	objections_freins?: string;
	degre_interet?: string;
	decision_attendue?: string;
	devis_offre_remise: boolean;
	propositions_faites?: string;
	reference_offre?: string;
	financement_propose?: string;
	assurance_entretien: boolean;
	reprise_ancien_vehicule: boolean;
	suivi_actions?: string;
	actions_suivi: ActionSuivi[];
	commentaire_global?: string;
}

interface RapportRendezVousFormProps {
	rendezVous: {
		id: string;
		date: Date;
		client?: {
			id: string;
			nom: string;
			telephone: string;
			email?: string | null;
			entreprise?: string | null;
		} | null;
		clientEntreprise?: {
			id: string;
			nom_entreprise: string;
			telephone: string;
			email?: string | null;
		} | null;
	};
	onClose: () => void;
	onSubmit: (data: RapportRendezVousData) => void;
	initialData?: Partial<RapportRendezVousData>;
}

export function RapportRendezVousForm({
	rendezVous,
	onClose,
	onSubmit,
	initialData,
}: RapportRendezVousFormProps) {
	const { user, isLoaded } = useUser();

	const [formData, setFormData] = useState({
		// 1. Détails du rendez-vous
		date_rendez_vous:
			initialData?.date_rendez_vous ||
			new Date(rendezVous.date).toISOString().split("T")[0],
		heure_rendez_vous:
			initialData?.heure_rendez_vous ||
			new Date(rendezVous.date).toTimeString().slice(0, 5),
		lieu_rendez_vous: initialData?.lieu_rendez_vous || "Showroom",
		lieu_autre: initialData?.lieu_autre || "",
		conseiller_commercial: initialData?.conseiller_commercial || "",
		duree_rendez_vous: initialData?.duree_rendez_vous || "",

		// 2. Informations sur le client
		nom_prenom_client:
			initialData?.nom_prenom_client ||
			rendezVous.client?.nom ||
			rendezVous.clientEntreprise?.nom_entreprise ||
			"",
		telephone_client:
			initialData?.telephone_client ||
			rendezVous.client?.telephone ||
			rendezVous.clientEntreprise?.telephone ||
			"",
		email_client:
			initialData?.email_client ||
			rendezVous.client?.email ||
			rendezVous.clientEntreprise?.email ||
			"",
		profession_societe:
			initialData?.profession_societe || rendezVous.client?.entreprise || "",
		type_client:
			initialData?.type_client ||
			(rendezVous.client ? "Particulier" : "Professionnel"),

		// 3. Objet du rendez-vous
		Com_Pres: initialData?.Com_Pres ?? false,
		Com_Drive: initialData?.Com_Drive ?? false,
		Com_Achat: initialData?.Com_Achat ?? false,
		Com_Livre: initialData?.Com_Livre ?? false,
		Com_APV: initialData?.Com_APV ?? false,
		Com_Office: initialData?.Com_Office ?? false,
		Com_Close: initialData?.Com_Close ?? false,
		PT_Etat: initialData?.PT_Etat ?? false,
		PT_INST: initialData?.PT_INST ?? false,
		PT_AERO: initialData?.PT_AERO ?? false,
		PT_DIPLO: initialData?.PT_DIPLO ?? false,
		EV_SALON: initialData?.EV_SALON ?? false,
		EV_SPONSOR: initialData?.EV_SPONSOR ?? false,
		EV_REVEAL: initialData?.EV_REVEAL ?? false,
		objet_autre: initialData?.objet_autre || "",

		// 4. Modèles discutés
		modeles_discutes: [] as ModeleDiscute[],

		// 5. Impressions et besoins du client
		motivations_achat: initialData?.motivations_achat || "",
		points_positifs: (() => {
			const raw = initialData?.points_positifs || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			if (!autreMatch) return raw;
			const rest = raw.replace(/,?\s*Autre:\s*.+$/, "").replace(/,\s*$/, "").trim();
			return rest ? `${rest}, Autre` : "Autre";
		})(),
		points_positifs_autre: (() => {
			const raw = initialData?.points_positifs || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			return autreMatch ? autreMatch[1].trim() : "";
		})(),
		objections_freins: (() => {
			const raw = initialData?.objections_freins || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			if (!autreMatch) return raw;
			const rest = raw.replace(/,?\s*Autre:\s*.+$/, "").replace(/,\s*$/, "").trim();
			return rest ? `${rest}, Autre` : "Autre";
		})(),
		objections_freins_autre: (() => {
			const raw = initialData?.objections_freins || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			return autreMatch ? autreMatch[1].trim() : "";
		})(),
		degre_interet: initialData?.degre_interet || "",
		decision_attendue: initialData?.decision_attendue || "",

		// 6. Propositions faites
		devis_offre_remise: initialData?.devis_offre_remise ?? false,
		propositions_faites: (() => {
			const raw = initialData?.propositions_faites || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			if (!autreMatch) return raw;
			const rest = raw.replace(/,?\s*Autre:\s*.+$/, "").replace(/,\s*$/, "").trim();
			return rest ? `${rest}, Autre` : "Autre";
		})(),
		propositions_faites_autre: (() => {
			const raw = initialData?.propositions_faites || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			return autreMatch ? autreMatch[1].trim() : "";
		})(),
		reference_offre: initialData?.reference_offre || "",
		financement_propose: initialData?.financement_propose || "",
		assurance_entretien: initialData?.assurance_entretien ?? false,
		reprise_ancien_vehicule: initialData?.reprise_ancien_vehicule ?? false,

		// 7. Suivi / Actions à entreprendre
		suivi_actions: (() => {
			const raw = initialData?.suivi_actions || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			if (!autreMatch) return raw;
			const rest = raw.replace(/,?\s*Autre:\s*.+$/, "").replace(/,\s*$/, "").trim();
			return rest ? `${rest}, Autre` : "Autre";
		})(),
		suivi_actions_autre: (() => {
			const raw = initialData?.suivi_actions || "";
			const autreMatch = raw.match(/Autre:\s*(.+)$/);
			return autreMatch ? autreMatch[1].trim() : "";
		})(),
		actions_suivi: [] as ActionSuivi[],

		// 8. Commentaire global du conseiller
		commentaire_global: initialData?.commentaire_global || "",
	});

	const [modelesDiscutes, setModelesDiscutes] = useState<ModeleDiscute[]>(
		initialData?.modeles_discutes || [],
	);
	const actionsSuivi = initialData?.actions_suivi || [];

	// Auto-populate conseiller_commercial with current user's name (only if not already set)
	useEffect(() => {
		if (isLoaded && user && !initialData?.conseiller_commercial) {
			const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
			if (fullName) {
				setFormData((prev) => ({
					...prev,
					conseiller_commercial: prev.conseiller_commercial || fullName,
				}));
			}
		}
	}, [isLoaded, user, initialData?.conseiller_commercial]);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const addModeleDiscute = () => {
		setModelesDiscutes((prev) => [
			...prev,
			{
				modele: "",
				motorisation: "",
				transmission: "",
				couleur: "",
				observation: "",
			},
		]);
	};

	const removeModeleDiscute = (index: number) => {
		setModelesDiscutes((prev) => prev.filter((_, i) => i !== index));
	};

	const updateModeleDiscute = (
		index: number,
		field: keyof ModeleDiscute,
		value: string,
	) => {
		setModelesDiscutes((prev) =>
			prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const selectedPoints = (formData.points_positifs || "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const hasAutre = selectedPoints.includes("Autre");
		const pointsPositifsAutre = (formData as { points_positifs_autre?: string }).points_positifs_autre;
		const pointsPositifsValue =
			hasAutre && pointsPositifsAutre
				? selectedPoints
						.map((p) => (p === "Autre" ? `Autre: ${pointsPositifsAutre}` : p))
						.join(", ")
				: formData.points_positifs;

		const selectedObjections = (formData.objections_freins || "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const hasObjectionAutre = selectedObjections.includes("Autre");
		const objectionsFreinsAutre = (formData as { objections_freins_autre?: string }).objections_freins_autre;
		const objectionsFreinsValue =
			hasObjectionAutre && objectionsFreinsAutre
				? selectedObjections
						.map((o) => (o === "Autre" ? `Autre: ${objectionsFreinsAutre}` : o))
						.join(", ")
				: formData.objections_freins;

		const selectedPropositions = (formData.propositions_faites || "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const hasPropositionAutre = selectedPropositions.includes("Autre");
		const propositionsFaitesAutre = (formData as { propositions_faites_autre?: string }).propositions_faites_autre;
		const propositionsFaitesValue =
			hasPropositionAutre && propositionsFaitesAutre
				? selectedPropositions
						.map((p) => (p === "Autre" ? `Autre: ${propositionsFaitesAutre}` : p))
						.join(", ")
				: formData.propositions_faites;

		const selectedSuiviActions = (formData.suivi_actions || "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const hasSuiviAutre = selectedSuiviActions.includes("Autre");
		const suiviActionsAutre = (formData as { suivi_actions_autre?: string }).suivi_actions_autre;
		const suiviActionsValue =
			hasSuiviAutre && suiviActionsAutre
				? selectedSuiviActions
						.map((s) => (s === "Autre" ? `Autre: ${suiviActionsAutre}` : s))
						.join(", ")
				: formData.suivi_actions;

		const internalFields = [
			"points_positifs_autre",
			"objections_freins_autre",
			"propositions_faites_autre",
			"suivi_actions_autre",
		];
		const restFormData = Object.fromEntries(
			Object.entries(formData).filter(([k]) => !internalFields.includes(k)),
		);

		const submitData: RapportRendezVousData = {
			...restFormData,
			points_positifs: pointsPositifsValue ?? "",
			objections_freins: objectionsFreinsValue ?? "",
			propositions_faites: propositionsFaitesValue ?? "",
			suivi_actions: suiviActionsValue ?? "",
			modeles_discutes: modelesDiscutes,
			actions_suivi: actionsSuivi,
			rendezVousId: rendezVous.id,
			clientId: rendezVous.client?.id,
			clientEntrepriseId: rendezVous.clientEntreprise?.id,
		} as RapportRendezVousData;

		onSubmit(submitData);
	};

	const [dialogOpen, setDialogOpen] = useState(true);
	const handleOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) onClose();
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={true}
				className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl">
				<DialogHeader className="px-6 py-5 border-b border-slate-200 shrink-0 bg-slate-900 text-white">
					<div className="flex items-start justify-between gap-4">
						<div>
							<DialogTitle className="text-xl font-bold text-white">
								Fiche de rapport de rendez-vous
							</DialogTitle>
							<DialogDescription className="mt-1 text-slate-400">
								KPANDJI Automobiles — Client / Prospect
							</DialogDescription>
						</div>
						<Button
							onClick={onClose}
							variant="secondary"
							size="sm"
							className="bg-white/10 hover:bg-white/20 text-white border-0">
							Fermer
						</Button>
					</div>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className="flex flex-1 flex-col min-h-0 overflow-hidden bg-slate-50/50">
					<Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
						<TabsList className="mx-6 mt-4 h-auto flex-wrap justify-start gap-1.5 p-2 rounded-xl shrink-0 bg-white border border-slate-200 shadow-sm">
							<TabsTrigger
								value="details"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<Calendar className="size-3.5" /> Détails
							</TabsTrigger>
							<TabsTrigger
								value="client"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<User className="size-3.5" /> Client
							</TabsTrigger>
							<TabsTrigger
								value="objet"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<Car className="size-3.5" /> Objet
							</TabsTrigger>
							<TabsTrigger
								value="modeles"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<Car className="size-3.5" /> Modèles
							</TabsTrigger>
							<TabsTrigger
								value="impressions"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<MessageSquare className="size-3.5" /> Impressions
							</TabsTrigger>
							<TabsTrigger
								value="propositions"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<CreditCard className="size-3.5" /> Propositions
							</TabsTrigger>
							<TabsTrigger
								value="suivi"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<ListTodo className="size-3.5" /> Suivi
							</TabsTrigger>
							<TabsTrigger
								value="commentaire"
								className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
								<MessageCircle className="size-3.5" /> Commentaire
							</TabsTrigger>
						</TabsList>

						<div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
							<TabsContent value="details" className="mt-0 space-y-6">
								{/* 1. Détails du rendez-vous */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<Calendar className="h-4 w-4 text-white" />
											</div>
											1. Détails du rendez-vous
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="grid md:grid-cols-2 gap-4">
											<div className="flex flex-col space-y-2">
												<Label htmlFor="date_rendez_vous">
													Date du rendez-vous
												</Label>
												<Input
													id="date_rendez_vous"
													type="date"
													value={formData.date_rendez_vous}
													onChange={(e) =>
														handleInputChange(
															"date_rendez_vous",
															e.target.value,
														)
													}
													required
												/>
											</div>
											<div className="flex flex-col space-y-2">
												<Label htmlFor="heure_rendez_vous">Heure</Label>
												<Input
													id="heure_rendez_vous"
													type="time"
													value={formData.heure_rendez_vous}
													onChange={(e) =>
														handleInputChange(
															"heure_rendez_vous",
															e.target.value,
														)
													}
													required
												/>
											</div>
										</div>

										<div className="flex flex-col space-y-2">
											<Label>Lieu</Label>
											<RadioGroup
												value={formData.lieu_rendez_vous}
												onValueChange={(value) =>
													handleInputChange("lieu_rendez_vous", value)
												}
												className="flex flex-wrap gap-4 mt-2">
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="Showroom" id="showroom" />
													<Label htmlFor="showroom">Showroom</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="Visite du client au siege"
														id="visiteClientAuSiege"
													/>
													<Label htmlFor="visiteClientAuSiege">
														Visite du client au siège
													</Label>
												</div>

												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="Visite chez le client"
														id="visiteChezClient"
													/>
													<Label htmlFor="visiteChezClient">
														Visite Chez le client
													</Label>
												</div>

												<div className="flex items-center space-x-2">
													<RadioGroupItem value="Appel" id="appel" />
													<Label htmlFor="appel">Phoning</Label>
												</div>

												<div className="flex items-center space-x-2">
													<RadioGroupItem value="Mailing" id="mailing" />
													<Label htmlFor="mailing">Mailing</Label>
												</div>

												<div className="flex items-center space-x-2">
													<RadioGroupItem value="Autre" id="autre" />
													<Label htmlFor="autre">Autre</Label>
												</div>
											</RadioGroup>
											{formData.lieu_rendez_vous === "Autre" && (
												<Input
													placeholder="Précisez..."
													value={formData.lieu_autre}
													onChange={(e) =>
														handleInputChange("lieu_autre", e.target.value)
													}
													className="mt-2"
												/>
											)}
										</div>

										<div className="grid md:grid-cols-2 gap-4">
											<div className="flex flex-col space-y-2">
												<Label htmlFor="conseiller_commercial">
													Conseiller commercial
												</Label>
												<Input
													id="conseiller_commercial"
													value={formData.conseiller_commercial}
													onChange={(e) =>
														handleInputChange(
															"conseiller_commercial",
															e.target.value,
														)
													}
													required
												/>
											</div>
											<div className="flex flex-col space-y-2">
												<Label htmlFor="duree_rendez_vous">
													Durée du rendez-vous
												</Label>
												<Input
													id="duree_rendez_vous"
													placeholder="Ex: 1h30"
													value={formData.duree_rendez_vous}
													onChange={(e) =>
														handleInputChange(
															"duree_rendez_vous",
															e.target.value,
														)
													}
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="client" className="mt-0 space-y-6">
								{/* 2. Informations sur le client */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<User className="h-4 w-4 text-white" />
											</div>
											2. Informations sur le client
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="grid md:grid-cols-2 gap-4">
											<div className="flex flex-col space-y-2">
												<Label htmlFor="nom_prenom_client">
													Nom et prénoms
												</Label>
												<Input
													id="nom_prenom_client"
													value={formData.nom_prenom_client}
													onChange={(e) =>
														handleInputChange(
															"nom_prenom_client",
															e.target.value,
														)
													}
													required
												/>
											</div>
											<div className="flex flex-col space-y-2">
												<Label htmlFor="telephone_client">Téléphone</Label>
												<Input
													id="telephone_client"
													value={formData.telephone_client}
													onChange={(e) =>
														handleInputChange(
															"telephone_client",
															e.target.value,
														)
													}
													required
												/>
											</div>
										</div>

										<div className="grid md:grid-cols-2 gap-4">
											<div className="flex flex-col space-y-2">
												<Label htmlFor="email_client">Email</Label>
												<Input
													id="email_client"
													type="email"
													value={formData.email_client}
													onChange={(e) =>
														handleInputChange("email_client", e.target.value)
													}
												/>
											</div>
											<div className="flex flex-col space-y-2">
												<Label htmlFor="profession_societe">
													Profession / Société
												</Label>
												<Input
													id="profession_societe"
													value={formData.profession_societe}
													onChange={(e) =>
														handleInputChange(
															"profession_societe",
															e.target.value,
														)
													}
												/>
											</div>
										</div>

										<div className="flex flex-col space-y-2">
											<Label>Type de client</Label>
											<RadioGroup
												value={formData.type_client}
												onValueChange={(value) =>
													handleInputChange("type_client", value)
												}
												className="flex gap-6 mt-2">
												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="Particulier"
														id="particulier"
													/>
													<Label htmlFor="particulier">Particulier</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="Professionnel"
														id="professionnel"
													/>
													<Label htmlFor="professionnel">Entreprise</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="Institutionnel"
														id="institutionnel"
													/>
													<Label htmlFor="institutionnel">Institutionnel</Label>
												</div>
											</RadioGroup>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="objet" className="mt-0 space-y-6">
								{/* 3. Objet du rendez-vous */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<Car className="h-4 w-4 text-white" />
											</div>
											3. Objet du rendez-vous
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="grid md:grid-cols-2 gap-4">
											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_Pres"
													checked={formData.Com_Pres}
													onCheckedChange={(checked) =>
														handleInputChange("Com_Pres", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_Pres">Com_Pres</Label>
													<p className="text-xs text-gray-500">
														(Présentation de la gamme)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_Drive"
													checked={formData.Com_Drive}
													onCheckedChange={(checked) =>
														handleInputChange("Com_Drive", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_Drive">Com_Drive</Label>
													<p className="text-xs text-gray-500">
														(Essai du véhicule)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_Achat"
													checked={formData.Com_Achat}
													onCheckedChange={(checked) =>
														handleInputChange("Com_Achat", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_Achat">Com_Achat</Label>
													<p className="text-xs text-gray-500">
														(Négociation commerciale, présentation des offres,
														prix, remise, mode de paiement, etc.)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_Livre"
													checked={formData.Com_Livre}
													onCheckedChange={(checked) =>
														handleInputChange("Com_Livre", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_Livre">Com_Livre</Label>
													<p className="text-xs text-gray-500">
														(Livraison du véhicule)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_APV"
													checked={formData.Com_APV}
													onCheckedChange={(checked) =>
														handleInputChange("Com_APV", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_APV">Com_APV</Label>
													<p className="text-xs text-gray-500">
														(Service après vente, garantie, entretien,
														réparation, etc.)
													</p>
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_Office"
													checked={formData.Com_Office}
													onCheckedChange={(checked) =>
														handleInputChange("Com_Office", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_Office">Com_Office</Label>
													<p className="text-xs text-gray-500">
														(Facture proforma, devis, etc.)
													</p>
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="Com_Close"
													checked={formData.Com_Close}
													onCheckedChange={(checked) =>
														handleInputChange("Com_Close", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="Com_Close">Com_Close</Label>
													<p className="text-xs text-gray-500">
														(Clôture de la vente, paiement, signature du
														contrat, etc.)
													</p>
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="PT_Etat"
													checked={formData.PT_Etat}
													onCheckedChange={(checked) =>
														handleInputChange("PT_Etat", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="PT_Etat">PT_Etat</Label>
													<p className="text-xs text-gray-500">
														(Appels d&apos;offres publics, conventions avec
														Ministères, Mairies et Établissements Publics.)
													</p>
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="PT_INST"
													checked={formData.PT_INST}
													onCheckedChange={(checked) =>
														handleInputChange("PT_INST", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="PT_INST">PT_INST</Label>
													<p className="text-xs text-gray-500">
														(Suivi des accords d&apos;assemblage (Exonérations,
														agréments zone industrielle, etc.).)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="PT_AERO"
													checked={formData.PT_AERO ?? false}
													onCheckedChange={(checked) =>
														handleInputChange("PT_AERO", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="PT_AERO ?? false">
														PT_AERO ?? false{" "}
													</Label>
													<p className="text-xs text-gray-500">
														(Partenariats avec loueurs (Hertz, Avis, Europcar)
														et accès parkings VIP.)
													</p>
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="PT_DIPLO"
													checked={formData.PT_DIPLO}
													onCheckedChange={(checked) =>
														handleInputChange("PT_DIPLO", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="PT_DIPLO">PT_DIPLO</Label>
													<p className="text-xs text-gray-500">
														(Programmes de renouvellement de parcs pour le corps
														diplomatique et les OIG.)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="EV_SALON"
													checked={formData.EV_SALON}
													onCheckedChange={(checked) =>
														handleInputChange("EV_SALON", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="EV_SALON">EV_SALON</Label>
													<p className="text-xs text-gray-500">
														(Tenue de stands au Salon de l&apos;Auto, SARA, et
														foires commerciales nationales.)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="EV_SPONSOR"
													checked={formData.EV_SPONSOR}
													onCheckedChange={(checked) =>
														handleInputChange("EV_SPONSOR", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="EV_SPONSOR">EV_SPONSOR</Label>
													<p className="text-xs text-gray-500">
														(Véhicule officiel pour grands forums (PEF, Africa
														CEO Forum) ou galas..)
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="EV_REVEAL"
													checked={formData.EV_REVEAL}
													onCheckedChange={(checked) =>
														handleInputChange("EV_REVEAL", checked)
													}
												/>
												<div className="flex flex-col items-start space-x-2">
													<Label htmlFor="EV_REVEAL">EV_REVEAL</Label>
													<p className="text-xs text-gray-500">
														(Organisation de soirées VIP pour le lancement des
														nouveaux modèles &quot;Made in CI&quot;).
													</p>
												</div>
											</div>
										</div>

										<div>
											<Label htmlFor="objet_autre">Autre</Label>
											<Input
												id="objet_autre"
												placeholder="Précisez..."
												value={formData.objet_autre}
												onChange={(e) =>
													handleInputChange("objet_autre", e.target.value)
												}
											/>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="modeles" className="mt-0 space-y-6">
								{/* 4. Modèles discutés */}
								<Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-amber-500 p-1.5">
												<Car className="h-4 w-4 text-white" />
											</div>
											4. Modèle(s) discuté(s)
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="rounded-lg border border-slate-200 overflow-hidden bg-white text-xs">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Modèle</TableHead>
														<TableHead>Motorisation</TableHead>
														<TableHead>Transmission</TableHead>
														<TableHead>Couleur</TableHead>
														<TableHead>Observation</TableHead>
														<TableHead className="w-14"></TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{modelesDiscutes.map((modele, index) => (
														<TableRow key={index}>
															<TableCell>
																<Input
																	value={modele.modele}
																	onChange={(e) =>
																		updateModeleDiscute(
																			index,
																			"modele",
																			e.target.value,
																		)
																	}
																	placeholder="Modèle"
																	className="h-9 w-auto"
																/>
															</TableCell>
															<TableCell>
																<Input
																	value={modele.motorisation}
																	onChange={(e) =>
																		updateModeleDiscute(
																			index,
																			"motorisation",
																			e.target.value,
																		)
																	}
																	placeholder="Motorisation"
																	className="h-9"
																/>
															</TableCell>
															<TableCell>
																<Select
																	value={modele.transmission}
																	onValueChange={(value) =>
																		updateModeleDiscute(
																			index,
																			"transmission",
																			value,
																		)
																	}>
																	<SelectTrigger className="h-9">
																		<SelectValue placeholder="Transmission" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="Manuelle">
																			Manuelle
																		</SelectItem>
																		<SelectItem value="Automatique">
																			Automatique
																		</SelectItem>
																	</SelectContent>
																</Select>
															</TableCell>
															<TableCell>
																<Input
																	value={modele.couleur}
																	onChange={(e) =>
																		updateModeleDiscute(
																			index,
																			"couleur",
																			e.target.value,
																		)
																	}
																	placeholder="Couleur"
																	className="h-9"
																/>
															</TableCell>
															<TableCell>
																<Input
																	value={modele.observation}
																	onChange={(e) =>
																		updateModeleDiscute(
																			index,
																			"observation",
																			e.target.value,
																		)
																	}
																	placeholder="Observation"
																	className="h-9"
																/>
															</TableCell>
															<TableCell>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-9 w-9 text-muted-foreground hover:text-destructive"
																	onClick={() => removeModeleDiscute(index)}>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
										<Button
											type="button"
											variant="outline"
											onClick={addModeleDiscute}
											className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50">
											<Plus className="h-4 w-4" />
											Ajouter un modèle
										</Button>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="impressions" className="mt-0 space-y-6">
								{/* 5. Impressions et besoins du client */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<MessageSquare className="h-4 w-4 text-white" />
											</div>
											5. Impressions et besoins du client / prospect
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="flex flex-col space-y-2">
											<Label>Motivation d&apos;achat</Label>
											<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
												{[
													"Personnelle",
													"Entreprise",
													"Flotte",
													"Chantier / Industrie",
													"BTP",
													"Transport",
													"Agriculture",
													"Autre",
												].map((option) => {
													const selected = (formData.motivations_achat || "")
														.split(",")
														.map((s) => s.trim())
														.filter(Boolean)
														.includes(option);
													return (
														<div
															key={option}
															className="flex items-center space-x-2">
															<Checkbox
																id={`motivation_${option.replace(/[\s/]/g, "_")}`}
																checked={selected}
																onCheckedChange={(checked) => {
																	const current = (
																		formData.motivations_achat || ""
																	)
																		.split(",")
																		.map((s) => s.trim())
																		.filter(Boolean);
																	const updated = checked
																		? [...current, option]
																		: current.filter((v) => v !== option);
																	handleInputChange(
																		"motivations_achat",
																		updated.join(", "),
																	);
																}}
															/>
															<Label
																htmlFor={`motivation_${option.replace(/[\s/]/g, "_")}`}
																className="text-sm font-normal cursor-pointer">
																{option}
															</Label>
														</div>
													);
												})}
											</div>
										</div>

										<div className="flex text-xs flex-col space-y-2">
											<Label>Points positifs perçus</Label>
											<div className="grid md:grid-cols-1 lg:grid-cols-2 gap-2 pt-2">
												{[
													"robuste",
													"rapport qualité / prix",
													"adapté à nos routes",
													"conformité du véhicule",
													"disponibilité des pièces",
													"période d'acquisition acceptable",
													"réactivité du service après vente",
													"Autre",
												].map((option, idx) => {
													const selected = (formData.points_positifs || "")
														.split(",")
														.map((s) => s.trim())
														.filter(Boolean)
														.includes(option);
													return (
														<div
															key={option}
															className="flex items-center space-x-2">
															<Checkbox
																id={`points_positifs_${idx}`}
																checked={selected}
																onCheckedChange={(checked) => {
																	const current = (
																		formData.points_positifs || ""
																	)
																		.split(",")
																		.map((s) => s.trim())
																		.filter(Boolean);
																	const updated = checked
																		? [...current, option]
																		: current.filter((v) => v !== option);
																	handleInputChange(
																		"points_positifs",
																		updated.join(", "),
																	);
																}}
															/>
															<Label
																htmlFor={`points_positifs_${idx}`}
																className="text-sm font-normal cursor-pointer">
																{option}
															</Label>
														</div>
													);
												})}
											</div>
											{(formData.points_positifs || "")
												.split(",")
												.map((s) => s.trim())
												.filter(Boolean)
												.includes("Autre") && (
												<div className="mt-3">
													<Label htmlFor="points_positifs_autre">
														Précisez (Autre)
													</Label>
													<Textarea
														id="points_positifs_autre"
														placeholder="Précisez les autres points positifs..."
														value={formData.points_positifs_autre ?? ""}
														onChange={(e) =>
															handleInputChange(
																"points_positifs_autre",
																e.target.value,
															)
														}
														rows={3}
														className="mt-2"
													/>
												</div>
											)}
										</div>

										<div className="flex flex-col space-y-2">
											<Label>Objections / freins</Label>
											<div className="grid md:grid-cols-1 lg:grid-cols-2 gap-2 pt-2">
												{[
													"Prix élevé",
													"Informations non conforme",
													"Pas adapté à nos routes",
													"pas de pièces disponibles",
													"Long délais d'attente",
													"mauvais suivi du SAV",
													"Autre",
												].map((option, idx) => {
													const selected = (formData.objections_freins || "")
														.split(",")
														.map((s) => s.trim())
														.filter(Boolean)
														.includes(option);
													return (
														<div
															key={option}
															className="flex items-center space-x-2">
															<Checkbox
																id={`objections_freins_${idx}`}
																checked={selected}
																onCheckedChange={(checked) => {
																	const current = (
																		formData.objections_freins || ""
																	)
																		.split(",")
																		.map((s) => s.trim())
																		.filter(Boolean);
																	const updated = checked
																		? [...current, option]
																		: current.filter((v) => v !== option);
																	handleInputChange(
																		"objections_freins",
																		updated.join(", "),
																	);
																}}
															/>
															<Label
																htmlFor={`objections_freins_${idx}`}
																className="text-sm font-normal cursor-pointer">
																{option}
															</Label>
														</div>
													);
												})}
											</div>
											{(formData.objections_freins || "")
												.split(",")
												.map((s) => s.trim())
												.filter(Boolean)
												.includes("Autre") && (
												<div className="mt-3">
													<Label htmlFor="objections_freins_autre">
														Précisez (Autre)
													</Label>
													<Textarea
														id="objections_freins_autre"
														placeholder="Précisez les autres objections ou freins..."
														value={(formData as { objections_freins_autre?: string }).objections_freins_autre ?? ""}
														onChange={(e) =>
															handleInputChange(
																"objections_freins_autre",
																e.target.value,
															)
														}
														rows={3}
														className="mt-2"
													/>
												</div>
											)}
										</div>

										<div className="flex flex-col space-y-2 mb-4">
											<div className="flex flex-col space-y-4 mb-4">
												<Label>Degré d&apos;intérêt</Label>
                        <div className="grid md:grid-cols-3 gap-4">

												<RadioGroup
													value={formData.degre_interet}
													onValueChange={(value) =>
														handleInputChange("degre_interet", value)
													}
													className="flex gap-4">
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="Fort" id="fort" />
														<Label htmlFor="fort">Fort</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="Moyen" id="moyen" />
														<Label htmlFor="moyen">Moyen</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="Faible" id="faible" />
														<Label htmlFor="faible">Faible</Label>
													</div>
												</RadioGroup>
                        </div>
											</div>

											<div className="flex flex-col space-y-2">
												<Label>Décision attendue</Label>
												<RadioGroup
													value={formData.decision_attendue}
													onValueChange={(value) =>
														handleInputChange("decision_attendue", value)
													}
													className="flex gap-4 mt-2">
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="Immédiate" id="immediate" />
														<Label htmlFor="immediate">Immédiate</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem
															value="En réflexion"
															id="reflexion"
														/>
														<Label htmlFor="reflexion">En réflexion</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem
															value="Après étude financement"
															id="financement"
														/>
														<Label htmlFor="financement">
															Après étude financement
														</Label>
													</div>
												</RadioGroup>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="propositions" className="mt-0 space-y-6">
								{/* 6. Propositions faites */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<CreditCard className="h-4 w-4 text-white" />
											</div>
											6. Propositions faites
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="flex flex-col space-y-2">
											<Label>Propositions faites</Label>
											<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
												{["Proforma", "Remise", "Autre"].map((option, idx) => {
													const selected = (formData.propositions_faites || "")
														.split(",")
														.map((s) => s.trim())
														.filter(Boolean)
														.includes(option);
													return (
														<div
															key={option}
															className="flex items-center space-x-2">
															<Checkbox
																id={`propositions_faites_${idx}`}
																checked={selected}
																onCheckedChange={(checked) => {
																	const current = (
																		formData.propositions_faites || ""
																	)
																		.split(",")
																		.map((s) => s.trim())
																		.filter(Boolean);
																	const updated = checked
																		? [...current, option]
																		: current.filter((v) => v !== option);
																	handleInputChange(
																		"propositions_faites",
																		updated.join(", "),
																	);
																}}
															/>
															<Label
																htmlFor={`propositions_faites_${idx}`}
																className="text-sm font-normal cursor-pointer">
																{option}
															</Label>
														</div>
													);
												})}
											</div>
											{(formData.propositions_faites || "")
												.split(",")
												.map((s) => s.trim())
												.filter(Boolean)
												.includes("Autre") && (
												<div className="mt-3">
													<Label htmlFor="propositions_faites_autre">
														Précisez (Autre)
													</Label>
													<Textarea
														id="propositions_faites_autre"
														placeholder="Précisez les autres propositions..."
														value={(formData as { propositions_faites_autre?: string }).propositions_faites_autre ?? ""}
														onChange={(e) =>
															handleInputChange(
																"propositions_faites_autre",
																e.target.value,
															)
														}
														rows={3}
														className="mt-2"
													/>
												</div>
											)}
										</div>

										<div className="flex flex-col space-y-2">
											<Label htmlFor="financement_propose">
												Financement proposé
											</Label>
											<Select
												value={formData.financement_propose}
												onValueChange={(value) =>
													handleInputChange("financement_propose", value)
												}>
												<SelectTrigger>
													<SelectValue placeholder="Sélectionnez le type de financement" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="Crédit">Crédit</SelectItem>
													<SelectItem value="Chèque">Chèque</SelectItem>
													<SelectItem value="Virement">Virement</SelectItem>
													<SelectItem value="Especes">Especes</SelectItem>
													<SelectItem value="Leasing">Leasing</SelectItem>
													<SelectItem value="Carplan">Car-Plan</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="grid md:grid-cols-2 gap-4">
											<div className="flex items-center space-x-2">
												<Checkbox
													id="assurance_entretien"
													checked={formData.assurance_entretien}
													onCheckedChange={(checked) =>
														handleInputChange("assurance_entretien", checked)
													}
												/>
												<Label htmlFor="assurance_entretien">
													Entretien proposés
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="reprise_ancien_vehicule"
													checked={formData.reprise_ancien_vehicule}
													onCheckedChange={(checked) =>
														handleInputChange(
															"reprise_ancien_vehicule",
															checked,
														)
													}
												/>
												<Label htmlFor="reprise_ancien_vehicule">
													Reprise d&apos;ancien véhicule
												</Label>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="suivi" className="mt-0 space-y-6">
								{/* 7. Suivi / Actions à entreprendre */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<ListTodo className="h-4 w-4 text-white" />
											</div>
											7. Suivi / Actions à entreprendre
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 pt-0">
										<div className="flex flex-col space-y-2">
											<Label>Suivi / Actions à entreprendre</Label>
											<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
												{[
													"Test Drive (Essaie)",
													"Visite chez le client",
													"Mailing",
													"Phoning",
													"Autre",
												].map((option, idx) => {
													const selected = (formData.suivi_actions || "")
														.split(",")
														.map((s) => s.trim())
														.filter(Boolean)
														.includes(option);
													return (
														<div
															key={option}
															className="flex items-center space-x-2">
															<Checkbox
																id={`suivi_actions_${idx}`}
																checked={selected}
																onCheckedChange={(checked) => {
																	const current = (
																		formData.suivi_actions || ""
																	)
																		.split(",")
																		.map((s) => s.trim())
																		.filter(Boolean);
																	const updated = checked
																		? [...current, option]
																		: current.filter((v) => v !== option);
																	handleInputChange(
																		"suivi_actions",
																		updated.join(", "),
																	);
																}}
															/>
															<Label
																htmlFor={`suivi_actions_${idx}`}
																className="text-sm font-normal cursor-pointer">
																{option}
															</Label>
														</div>
													);
												})}
											</div>
											{(formData.suivi_actions || "")
												.split(",")
												.map((s) => s.trim())
												.filter(Boolean)
												.includes("Autre") && (
												<div className="mt-3">
													<Label htmlFor="suivi_actions_autre">
														Précisez (Autre)
													</Label>
													<Textarea
														id="suivi_actions_autre"
														placeholder="Précisez les autres actions à entreprendre..."
														value={(formData as { suivi_actions_autre?: string }).suivi_actions_autre ?? ""}
														onChange={(e) =>
															handleInputChange(
																"suivi_actions_autre",
																e.target.value,
															)
														}
														rows={3}
														className="mt-2"
													/>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="commentaire" className="mt-0 space-y-6">
								{/* 8. Commentaire global du conseiller */}
								<Card className="border border-slate-200 bg-white shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-base">
											<div className="rounded-lg bg-indigo-600 p-1.5">
												<MessageCircle className="h-4 w-4 text-white" />
											</div>
											8. Votre commentaire global sur ce client / prospect
										</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<Textarea
											placeholder="Vos commentaires généraux sur le rendez-vous..."
											value={formData.commentaire_global}
											onChange={(e) =>
												handleInputChange("commentaire_global", e.target.value)
											}
											rows={4}
											className="w-full"
										/>
									</CardContent>
								</Card>
							</TabsContent>
						</div>
					</Tabs>

					<div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 shrink-0 bg-white">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="border-slate-200">
							Annuler
						</Button>
						<Button
							type="submit"
							className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
							Enregistrer le rapport
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
