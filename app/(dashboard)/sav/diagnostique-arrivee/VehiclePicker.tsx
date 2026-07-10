"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, User } from "lucide-react";
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
  const active =
    accent === "sky"
      ? "data-[state=active]:bg-white data-[state=active]:text-sky-800 data-[state=active]:ring-sky-200/70"
      : "data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:ring-amber-200/70";

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Véhicules
        </p>
        <p className="text-xs text-slate-400">
          {voitures.length} sélectionnable{voitures.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <TabsList
          className={cn(
            "inline-flex h-auto min-w-full w-max gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-2 shadow-sm"
          )}
        >
          {voitures.map((v) => {
            const client =
              [v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") || "—";
            return (
              <TabsTrigger
                key={v.id}
                value={v.id}
                className={cn(
                  "group flex min-w-[9.5rem] max-w-[14rem] flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left sm:min-w-[12.5rem] sm:px-4 sm:py-3.5",
                  "whitespace-normal transition-all",
                  "data-[state=active]:shadow-md data-[state=active]:ring-1",
                  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white/70",
                  active
                )}
              >
                <span className="flex w-full items-center gap-1.5 text-[13px] font-semibold leading-tight">
                  <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{client}</span>
                </span>
                <span className="flex w-full items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Car className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {v.model}
                    <span className="mx-1 text-slate-300">•</span>
                    <span className="font-mono tracking-wide">{v.immatriculation}</span>
                  </span>
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </div>
  );
}
