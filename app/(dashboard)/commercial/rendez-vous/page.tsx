"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RendezVousForm } from "@/components/RendezVousForm";
import { RendezVousList } from "@/components/RendezVousList";
import {
	Loader2,
	Calendar,
	RefreshCw,
	Clock,
	CheckCircle2,
	Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RendezVous } from "@/lib/types/rendezvous";

export default function RendezVousPage() {
	const router = useRouter();
	const { user, isLoaded } = useUser();
	const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const fetchRendezVous = React.useCallback(async () => {
		if (!user?.id) return;

		try {
			const res = await fetch(
				`/api/rendez-vous?userId=${encodeURIComponent(user.id)}`,
			);
			const result = await res.json().catch(() => ({}));
			if (result.success) {
				setRendezVous((result.data || []) as unknown as RendezVous[]);
			} else {
				toast.error(
					result.error || "Erreur lors du chargement des rendez-vous",
				);
			}
		} catch (error) {
			console.error("Error fetching rendez-vous:", error);
			toast.error("Erreur lors du chargement des rendez-vous");
		}
	}, [user?.id]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchRendezVous();
		setRefreshing(false);
	};

	useEffect(() => {
		if (isLoaded && user?.id) {
			fetchRendezVous().finally(() => setLoading(false));
		}
	}, [isLoaded, user?.id, fetchRendezVous]);

	if (!isLoaded || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center">
				<div className="flex flex-col items-center gap-6">
					<div className="relative">
						<div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
						<Loader2 className="h-12 w-12 animate-spin text-amber-600 relative" />
					</div>
					<p className="text-amber-900/70 font-medium">
						Chargement des rendez-vous...
					</p>
				</div>
			</div>
		);
	}

	if (!user?.id) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center">
				<div className="text-center max-w-md mx-auto px-6">
					<div className="p-4 bg-amber-100 rounded-2xl inline-block mb-6">
						<Calendar className="h-12 w-12 text-amber-600" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-3">
						Non autorisé
					</h2>
					<p className="text-gray-600">
						Vous devez être connecté pour accéder à cette page.
					</p>
				</div>
			</div>
		);
	}

	const upcomingRendezVous = rendezVous.filter(
		(rv) =>
			new Date(rv.date) >= new Date() &&
			rv.statut !== "ANNULE" &&
			rv.statut !== "EFFECTUE",
	);

	const completedRendezVous = rendezVous.filter(
		(rv) => rv.statut === "EFFECTUE",
	);

	const todayCount = rendezVous.filter((rv) => {
		const d = new Date(rv.date);
		const today = new Date();
		return (
			d.toDateString() === today.toDateString() &&
			rv.statut !== "ANNULE" &&
			rv.statut !== "EFFECTUE"
		);
	}).length;

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
				<div className="absolute inset-0 bg-black/5" />
				<div className="relative max-w-7xl mx-auto px-6 py-14">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30">
									<Calendar className="h-10 w-10 text-white" />
								</div>
								<div>
									<h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-sm">
										Rendez-vous
									</h1>
									<p className="text-amber-50/95 text-lg mt-1.5 font-medium">
										Gestion professionnelle de vos rendez-vous clients
									</p>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
							<div className="flex gap-3">
								<Button
									variant="secondary"
									size="lg"
									onClick={handleRefresh}
									disabled={refreshing}
									className="bg-white/90 hover:bg-white text-amber-900 border-0 shadow-lg font-medium">
									<RefreshCw
										className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
									/>
									Actualiser
								</Button>
								<RendezVousForm
									clerkUserId={user.id}
									onSuccess={fetchRendezVous}
								/>
							</div>
							<div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/30">
								<div className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
								<span className="text-sm font-medium text-white">
									Système actif
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300">
						<div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/50 rounded-bl-full" />
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-amber-700 uppercase tracking-wider">
										Total
									</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">
										{rendezVous.length}
									</p>
									<p className="text-sm text-gray-500 mt-0.5">Rendez-vous</p>
								</div>
								<div className="p-3 bg-amber-100 rounded-xl">
									<Calendar className="h-8 w-8 text-amber-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300">
						<div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full" />
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
										À venir
									</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">
										{upcomingRendezVous.length}
									</p>
									<p className="text-sm text-gray-500 mt-0.5">Prochains RDV</p>
								</div>
								<div className="p-3 bg-emerald-100 rounded-xl">
									<Clock className="h-8 w-8 text-emerald-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300">
						<div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-bl-full" />
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-rose-700 uppercase tracking-wider">
										Aujourd&apos;hui
									</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">
										{todayCount}
									</p>
									<p className="text-sm text-gray-500 mt-0.5">RDV du jour</p>
								</div>
								<div className="p-3 bg-rose-100 rounded-xl">
									<Calendar className="h-8 w-8 text-rose-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300">
						<div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-bl-full" />
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-violet-700 uppercase tracking-wider">
										Terminés
									</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">
										{completedRendezVous.length}
									</p>
									<p className="text-sm text-gray-500 mt-0.5">Effectués</p>
								</div>
								<div className="p-3 bg-violet-100 rounded-xl">
									<CheckCircle2 className="h-8 w-8 text-violet-600" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Rendez-vous List */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				<Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden">
					<CardHeader className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-b border-amber-100/50 px-8 py-6">
						<CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3 justify-between">
							<div className="p-2.5 bg-amber-100 rounded-xl flex items-center">
								<Calendar className="h-6 w-6 text-amber-600 mr-3.5" />
								Liste des Rendez-vous
							</div>

							<Button
								size="lg"
								onClick={() => router.push("/commercial/reservation-vehicule")}
								variant="outline"
								className="flex items-center gap-2 text-xl font-bold text-gray-900 cursor-pointer">
								<Car className="h-6 w-6 text-amber-600 mr-3.5" />
								Reservation de véhicule
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<RendezVousList
							rendezVous={rendezVous}
							onUpdate={fetchRendezVous}
							clerkUserId={user.id}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
