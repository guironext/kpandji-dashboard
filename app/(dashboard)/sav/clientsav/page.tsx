"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, User, FolderOpen, FileText, Sparkles, Wrench } from "lucide-react";
import ClientSAVPage from "./page1";
import VoitureSAVTab from "./VoitureSAVTab";
import CategorieDiagnostiqueTab from "./CategorieDiagnostiqueTab";
import DetailsDiagnostiqueTab from "./DetailsDiagnostiqueTab";

const tabConfig = [
  {
    value: "client",
    label: "Client",
    icon: User,
    description: "Gestion des dossiers clients",
  },
  {
    value: "voiture",
    label: "Voiture",
    icon: Car,
    description: "Parc automobile et véhicules",
  },
  {
    value: "categorie-diagnostique",
    label: "Catégorie Diagnostique",
    icon: FolderOpen,
    description: "Types de diagnostics",
  },
  {
    value: "details-diagnostique",
    label: "Détails Diagnostique",
    icon: FileText,
    description: "Détail des interventions",
  },
];

export default function ClientSavPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pt-8 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-sm font-medium text-emerald-100/90 uppercase tracking-wider">
              Dossiers SAV
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Client SAV
          </h1>
          <p className="mt-2 text-lg text-emerald-100/80 max-w-2xl">
            Gestion centralisée : clients, véhicules et diagnostics
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">Service Après Vente</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="client" className="w-full">
        <div className="mb-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1.5 rounded-xl bg-slate-100/80 p-1.5 border border-slate-200/60 shadow-sm w-full max-w-3xl">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-200/50"
              >
                <tab.icon className="h-4 w-4 mr-2 shrink-0" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="client" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ClientSAVPage embedded />
        </TabsContent>

        <TabsContent value="voiture" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <VoitureSAVTab />
        </TabsContent>

        <TabsContent value="categorie-diagnostique" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <CategorieDiagnostiqueTab />
        </TabsContent>

        <TabsContent value="details-diagnostique" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <DetailsDiagnostiqueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
