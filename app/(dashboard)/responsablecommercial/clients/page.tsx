import React from "react";
import { getClientsByStatusWithVoitures } from "@/lib/actions/client";
import { getClientEntreprisesByStatusWithVoitures } from "@/lib/actions/client_entreprise";
import { Users, Building2, Car } from "lucide-react";
import { ClientsClient } from "./ClientsClient";

interface VoitureWithModel {
  voitureModel?: { model: string } | null;
}

interface ClientWithVoitures {
  id: string;
  nom: string;
  voitures?: VoitureWithModel[];
}

interface ClientEntrepriseWithVoitures {
  id: string;
  nom_entreprise: string;
  sigle?: string | null;
  voitures?: VoitureWithModel[];
}

export default async function ClientsPage() {
  const [clientsResult, clientEntreprisesResult] = await Promise.all([
    getClientsByStatusWithVoitures("CLIENT"),
    getClientEntreprisesByStatusWithVoitures("CLIENT"),
  ]);

  const clients = (clientsResult.success ? clientsResult.data : []) as unknown as ClientWithVoitures[];
  const clientEntreprises = (clientEntreprisesResult.success ? clientEntreprisesResult.data : []) as unknown as ClientEntrepriseWithVoitures[];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c0f14]">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="relative px-6 py-14 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-white/95 border border-white/20">
                  <Car className="h-4 w-4" />
                  Portefeuille clients
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-[2.75rem]">
                  Tous les Clients
                </h1>
                <p className="max-w-lg text-lg text-white/90 leading-relaxed">
                  Visualisez vos clients individuels et entreprises avec leurs véhicules
                </p>
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-8 py-6 min-w-[140px] shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{clients.length}</span>
                  <span className="text-sm font-medium text-white/80 mt-0.5">Individuels</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-8 py-6 min-w-[140px] shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 mb-3">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{clientEntreprises.length}</span>
                  <span className="text-sm font-medium text-white/80 mt-0.5">Entreprises</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ClientsClient clients={clients} clientEntreprises={clientEntreprises} />
    </div>
  );
}
