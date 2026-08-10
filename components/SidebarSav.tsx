"use client";

import {
  Boxes,
  Home,
  PackagePlus,
  Users,
  ClipboardList,
  Wrench,
  Receipt,
  FileText,
  FileSpreadsheet,
  UserCog,
  CarFront,
  CircleCheck,
  BadgePercent,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  {
    id: 1,
    icon: Home,
    label: "Dashboard",
    href: "/sav",
    category: "main",
  },
  {
    id: 2,
    icon: Users,
    label: "Clients SAV",
    href: "/sav/clientsav",
    category: "operations",
  },
  {
    id: 3,
    icon: ClipboardList,
    label: "Diagnostique Arrivée",
    href: "/sav/diagnostique-arrivee",
    category: "operations",
  },
  {
    id: 4,
    icon: BadgePercent,
    label: "Offre Spéciale",
    href: "/sav/offre-speciale",
    category: "operations",
  },
  {
    id: 5,
    icon: CarFront,
    label: "Voiture Réparation",
    href: "/sav/voiture-reparation",
    category: "operations",
  },
  {
    id: 6,
    icon: FileSpreadsheet,
    label: "Proforma SAV",
    href: "/sav/proforma-sav",
    category: "operations",
  },
  {
    id: 7,
    icon: Wrench,
    label: "Maintenance",
    href: "/sav/maintenance",
    category: "operations",
  },
  {
    id: 8,
    icon: CircleCheck,
    label: "Teste final",
    href: "/sav/teste-final",
    category: "operations",
  },
  {
    id: 9,
    icon: Receipt,
    label: "Facturation SAV",
    href: "/sav/facturation-sav",
    category: "operations",
  },
  {
    id: 10,
    icon: FileText,
    label: "Rapport Maintenance",
    href: "/sav/rapport-maintenance",
    category: "reports",
  },
  {
    id: 11,
    icon: PackagePlus,
    label: "Ajouter Pièces SAV",
    href: "/sav/ajouter-pieces-sav",
    category: "inventory",
  },
  {
    id: 12,
    icon: Boxes,
    label: "Gestion pièces SAV",
    href: "/sav/gestion-pieces-sav",
    category: "inventory",
  },
  {
    id: 13,
    icon: UserCog,
    label: "Personnel SAV",
    href: "/sav/personnel-sav",
    category: "operations",
  },
  {
    id: 14,
    icon: BarChart3,
    label: "Statistiques SAV",
    href: "/sav/statistiques-sav",
    category: "reports",
  },
];

const CATEGORY_ORDER = ["main", "operations", "inventory", "reports"] as const;

const categoryLabels: Record<(typeof CATEGORY_ORDER)[number], string> = {
  main: "Principal",
  inventory: "Inventaire",
  operations: "Opérations",
  reports: "Rapports",
};

const SidebarSav = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const groupedItems = CATEGORY_ORDER.reduce(
    (acc, category) => {
      const items = navItems.filter((item) => item.category === category);
      if (items.length > 0) acc[category] = items;
      return acc;
    },
    {} as Record<string, typeof navItems>
  );

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-slate-200/90 bg-white shadow-[4px_0_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 via-emerald-50/40 to-teal-50/30">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-3 py-4 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-3" : "justify-center"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-md shadow-emerald-600/25">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            {isOpen && (
              <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="truncate text-base font-bold tracking-tight text-slate-900">
                  Services Après Vente
                </h2>
                <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-700/70">
                  Module SAV
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2 py-4 scrollbar-thin"
          aria-label="Navigation SAV"
        >
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-1">
              {isOpen && (
                <h3 className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              )}

              {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={!isOpen ? item.label : undefined}
                    className={clsx(
                      "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isOpen ? "gap-3" : "justify-center",
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm"
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className={clsx(
                        "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-emerald-600"
                      )}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    <span
                      className={clsx(
                        "truncate transition-all duration-300",
                        isOpen
                          ? "max-w-full opacity-100"
                          : "pointer-events-none max-w-0 opacity-0"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center text-[11px] font-medium text-slate-400",
              isOpen ? "justify-between gap-2" : "justify-center"
            )}
          >
            {isOpen ? (
              <>
                <span>KPANDJI SAV</span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  v1.0
                </span>
              </>
            ) : (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                v1
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarSav;
