"use client";

import React, { useState, useMemo } from "react";
import { Users, Building2, Car, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

function getVoitureModeles(voitures?: VoitureWithModel[]) {
  if (!voitures?.length) return [];
  const models = voitures
    .map((v) => v.voitureModel?.model)
    .filter((m): m is string => Boolean(m));
  return [...new Set(models)];
}

interface ClientsClientProps {
  clients: ClientWithVoitures[];
  clientEntreprises: ClientEntrepriseWithVoitures[];
}

export function ClientsClient({ clients, clientEntreprises }: ClientsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("individual");

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c) => {
      const modeles = getVoitureModeles(c.voitures).join(" ").toLowerCase();
      return c.nom.toLowerCase().includes(q) || modeles.includes(q);
    });
  }, [clients, searchQuery]);

  const filteredClientEntreprises = useMemo(() => {
    if (!searchQuery.trim()) return clientEntreprises;
    const q = searchQuery.toLowerCase();
    return clientEntreprises.filter((ce) => {
      const modeles = getVoitureModeles(ce.voitures).join(" ").toLowerCase();
      return (
        ce.nom_entreprise.toLowerCase().includes(q) ||
        (ce.sigle?.toLowerCase().includes(q) ?? false) ||
        modeles.includes(q)
      );
    });
  }, [clientEntreprises, searchQuery]);

  const ClientCard = ({
    name,
    modeles,
    type,
    index,
  }: {
    name: string;
    modeles: string[];
    type: "individual" | "entreprise";
    index: number;
  }) => {
    const isIndividual = type === "individual";
    const accent = isIndividual
      ? "from-emerald-500 to-teal-500"
      : "from-cyan-500 to-blue-500";
    const bgAccent = isIndividual
      ? "from-emerald-500/15 to-teal-500/10"
      : "from-cyan-500/15 to-blue-500/10";
    const iconBg = isIndividual
      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-emerald-500/10"
      : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 ring-cyan-500/10";

    return (
      <div
        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:-translate-y-0.5"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`}
        />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${bgAccent} ring-1 ${iconBg}`}
            >
              {isIndividual ? (
                <Users className="h-7 w-7" />
              ) : (
                <Building2 className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate">
                {name}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {modeles.length > 0 ? (
                  modeles.map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      className="text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    >
                      <Car className="h-3 w-3 mr-1" />
                      {m}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Aucun véhicule
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({
    type,
  }: {
    type: "individual" | "entreprise";
  }) => (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
        {type === "individual" ? (
          <Users className="h-10 w-10 text-slate-400" />
        ) : (
          <Building2 className="h-10 w-10 text-slate-400" />
        )}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        Aucun client trouvé
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
        {searchQuery
          ? `Aucun résultat pour « ${searchQuery} ». Modifiez votre recherche.`
          : type === "individual"
            ? "Aucun client individuel avec le statut CLIENT pour le moment."
            : "Aucun client entreprise avec le statut CLIENT pour le moment."}
      </p>
    </div>
  );

  return (
    <main className="relative -mt-6 px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom ou modèle véhicule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                />
              </div>
              <TabsList className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1.5 gap-1 shrink-0">
                <TabsTrigger
                  value="individual"
                  className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-emerald-400"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Individuels ({clients.length})
                </TabsTrigger>
                <TabsTrigger
                  value="entreprise"
                  className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-emerald-400"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Entreprises ({clientEntreprises.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="individual" className="mt-0 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Clients Individuels
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {filteredClients.length} client
                  {filteredClients.length !== 1 ? "s" : ""} affiché
                  {filteredClients.length !== 1 ? "s" : ""}
                  {searchQuery && ` pour « ${searchQuery} »`}
                </p>
              </div>
              {filteredClients.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredClients.map((client, index) => (
                    <ClientCard
                      key={client.id}
                      name={client.nom}
                      modeles={getVoitureModeles(client.voitures)}
                      type="individual"
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState type="individual" />
              )}
            </TabsContent>

            <TabsContent value="entreprise" className="mt-0 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Clients Entreprises
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {filteredClientEntreprises.length} client
                  {filteredClientEntreprises.length !== 1 ? "s" : ""} affiché
                  {filteredClientEntreprises.length !== 1 ? "s" : ""}
                  {searchQuery && ` pour « ${searchQuery} »`}
                </p>
              </div>
              {filteredClientEntreprises.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredClientEntreprises.map((ce, index) => (
                    <ClientCard
                      key={ce.id}
                      name={
                        ce.sigle
                          ? `${ce.nom_entreprise} (${ce.sigle})`
                          : ce.nom_entreprise
                      }
                      modeles={getVoitureModeles(ce.voitures)}
                      type="entreprise"
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState type="entreprise" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
