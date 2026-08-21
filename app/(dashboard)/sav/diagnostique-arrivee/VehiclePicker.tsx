"use client";

import { useState, useMemo } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Car, User, Search, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VehiclePickerItem {
  id: string;
  model: string;
  immatriculation: string;
  ClientSAV?: { nom?: string; prenom?: string };
}

export default function VehiclePicker({
  voitures,
  accent = "amber",
}: {
  voitures: VehiclePickerItem[];
  accent?: "amber" | "sky";
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVoitures = useMemo(() => {
    if (!searchQuery.trim()) return voitures;
    const q = searchQuery.toLowerCase().trim();
    return voitures.filter((v) => {
      const client = [v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ").toLowerCase();
      const model = (v.model || "").toLowerCase();
      const immat = (v.immatriculation || "").toLowerCase();
      return client.includes(q) || model.includes(q) || immat.includes(q);
    });
  }, [voitures, searchQuery]);

  const activeStyles =
    accent === "sky"
      ? "data-[state=active]:bg-white data-[state=active]:text-sky-950 data-[state=active]:ring-2 data-[state=active]:ring-sky-500 data-[state=active]:shadow-lg data-[state=active]:shadow-sky-500/10"
      : "data-[state=active]:bg-white data-[state=active]:text-amber-950 data-[state=active]:ring-2 data-[state=active]:ring-amber-500 data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/10";

  return (
    <div className="relative space-y-3">
      {/* Header bar with search input */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700 text-xs font-bold">
            {voitures.length}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sélection du véhicule
          </p>
        </div>

        {voitures.length > 3 && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher (Client, immat, modèle)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-xl border-slate-200 bg-white/90 pl-8 pr-3 text-xs focus:bg-white focus:ring-1 focus:ring-amber-400"
            />
          </div>
        )}
      </div>

      {/* Horizontal Snap Scroll Carousel */}
      <div className="-mx-1 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x snap-mandatory">
        <TabsList
          className={cn(
            "inline-flex h-auto min-w-full w-max gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-2 shadow-inner"
          )}
        >
          {filteredVoitures.map((v) => {
            const client =
              [v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") || "Client non renseigné";
            const initials = client
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <TabsTrigger
                key={v.id}
                value={v.id}
                className={cn(
                  "group snap-start flex min-w-[14rem] max-w-[18rem] flex-col items-start gap-2 rounded-xl border border-transparent px-4 py-3 text-left transition-all duration-200 touch-manipulation",
                  "whitespace-normal",
                  "data-[state=inactive]:bg-white/60 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white data-[state=inactive]:hover:shadow-sm",
                  activeStyles
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-[11px] font-bold shadow-sm">
                      {initials || <User className="h-3.5 w-3.5" />}
                    </div>
                    <span className="truncate text-xs font-semibold text-slate-800 group-data-[state=active]:text-slate-950">
                      {client}
                    </span>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 truncate">
                    <Car className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{v.model}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-amber-400 shadow-sm shrink-0">
                    <Hash className="h-2.5 w-2.5 opacity-80" />
                    {v.immatriculation}
                  </span>
                </div>
              </TabsTrigger>
            );
          })}
          {filteredVoitures.length === 0 && (
            <div className="px-6 py-4 text-center text-xs text-slate-500">
              Aucun véhicule ne correspond à votre recherche.
            </div>
          )}
        </TabsList>
      </div>
    </div>
  );
}

