"use client";

import {
  type LucideIcon,
  Home,
  Users,
  BarChart3,
  Warehouse,
  Car,
  UserCheck,
  FileText,
  Eye,
  Calendar,
  Receipt,
  ClipboardList,
  Package,
  TrendingUp,
  FileCheck,
  Pen,
  Mail,
  MessageSquare,
  LayoutDashboard,
  ShoppingCart,
  FileSpreadsheet,
  Radio,
  Target,
  Truck,
  Activity,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
// ─────────────────────────────────────────────────────────────────────────────
// Navigation items — type-safe, grouped by category, ordered for sidebar
// ─────────────────────────────────────────────────────────────────────────────

type NavCategory =
  | "main"
  | "objectifs"
  | "logistique"
  | "operations"
  | "reports"
  | "facturation"
  | "communication";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  category: NavCategory;
}

/** Flattened nav items for rendering — order matches categoryOrder */
const navItems: NavItem[] = [
  // Principal
  { id: "main-dashboard", icon: Home, label: "Dashboard", href: "/commercial", category: "main" },

  // Objectifs
  { id: "obj-objectifs", icon: Target, label: "Mes Objectifs", href: "/commercial/objectifs", category: "objectifs" },
  { id: "obj-stats", icon: Activity, label: "Mes Performances", href: "/commercial/statistiques", category: "objectifs" },

  // Logistique
  { id: "log-modeles", icon: Car, label: "Modèles Voitures", href: "/commercial/ajouter-modele", category: "logistique" },
  { id: "log-accessoires", icon: Package, label: "Accessoires", href: "/commercial/ajouter-accessoires", category: "logistique" },
  { id: "log-stock", icon: Warehouse, label: "Stock disponible", href: "/commercial/stock-disponible", category: "logistique" },

  // Opérations
  { id: "op-prospects", icon: UserCheck, label: "Prospects", href: "/commercial/prospects", category: "operations" },
  { id: "op-clients", icon: Users, label: "Clients", href: "/commercial/clients", category: "operations" },
  { id: "op-rdv", icon: Calendar, label: "Rendez-vous", href: "/commercial/rendez-vous", category: "operations" },
  { id: "op-calendrier-sortie", icon: Calendar, label: "Calendrier Sortie", href: "/commercial/calendrier-sortie", category: "operations" },
  { id: "op-reservation", icon: Calendar, label: "Reservation Véhicule", href: "/commercial/reservation-vehicule", category: "operations" },
  { id: "op-rapport-rdv", icon: ClipboardList, label: "Rapport Rendez-vous", href: "/commercial/rapport-rendez-vous", category: "operations" },
  { id: "op-suivi-rdv", icon: Eye, label: "Suivi Rendez-vous", href: "/commercial/suivi-rendez-vous", category: "operations" },
  { id: "op-tableau-chute", icon: BarChart3, label: "Tableau de Chute", href: "/commercial/tableau-chute", category: "operations" },

  // Rapports
  { id: "rep-commandes", icon: TrendingUp, label: "Suivi Commandes", href: "/commercial/suivi-commandes", category: "reports" },

  // Facturation
  { id: "fac-proformas", icon: FileText, label: "Proformas", href: "/commercial/proformas", category: "facturation" },
  { id: "fac-proformas-multi", icon: FileSpreadsheet, label: "Proformas-multi", href: "/commercial/profoma-multi", category: "facturation" },
  { id: "fac-bon-commande", icon: Receipt, label: "Bon de Commande", href: "/commercial/bon-de-commande", category: "facturation" },
  { id: "fac-bon-acccord", icon: FileCheck, label: "Bon pour Accord", href: "/commercial/bon-pour-accord", category: "facturation" },
  { id: "fac-signature", icon: Pen, label: "Signature", href: "/commercial/signature", category: "facturation" },
  { id: "fac-numero-courrier", icon: Mail, label: "Numéro Courrier", href: "/commercial/numero-courrier", category: "facturation" },
  { id: "fac-messages", icon: MessageSquare, label: "Messages", href: "/commercial/messages", category: "facturation" },

  ];

const categoryConfig = {
  main: {
    label: "Principal",
    icon: LayoutDashboard,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/12",
    textColor: "text-amber-600",
  },
  objectifs: {
    label: "Objectifs",
    icon: Target,
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/12",
    textColor: "text-cyan-600",
  },
  operations: {
    label: "Opérations",
    icon: ShoppingCart,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/12",
    textColor: "text-blue-600",
  },
  reports: {
    label: "Rapports",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/12",
    textColor: "text-emerald-600",
  },
  facturation: {
    label: "Facturation",
    icon: Receipt,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/12",
    textColor: "text-violet-600",
  },
  communication: {
    label: "Communication",
    icon: Radio,
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-500/12",
    textColor: "text-rose-600",
  },
  logistique: {
    label: "Logistique",
    icon: Truck,
    color: "from-slate-600 to-slate-800",
    bgColor: "bg-slate-500/12",
    textColor: "text-slate-600",
  },
} as const;

const SidebarCommercial = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const categoryOrder = ["main", "objectifs", "operations", "reports", "facturation", "communication", "logistique"];

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={clsx(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          isOpen ? "justify-start" : "justify-center",
          isActive
            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
            : "text-slate-600 hover:bg-slate-50/90 hover:text-slate-900 active:scale-[0.98]"
        )}
        aria-label={item.label}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/40 rounded-r-full" />
        )}
        <div
          className={clsx(
            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-white/20"
              : "bg-slate-100/80 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-600"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <span
          className={clsx(
            "text-sm font-medium whitespace-nowrap transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          {item.label}
        </span>
      </Link>
    );

    if (!isOpen) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={14}
            className="font-medium bg-slate-900 text-white border-0 shadow-lg"
          >
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={clsx(
          "h-full flex flex-col overflow-hidden transition-all duration-300 ease-out",
          "bg-gradient-to-b from-white via-slate-50/30 to-slate-50/50",
          "border-r border-slate-200/60",
          "shadow-[2px_0_20px_-2px_rgba(0,0,0,0.06)]"
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-5 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center gap-3 transition-all duration-300",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20">
              <Car className="h-5 w-5 text-white drop-shadow-sm" strokeWidth={2} />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900 truncate tracking-tight">
                  Commercial
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Espace de vente</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 custom-scrollbar min-h-0">
          <div className="space-y-6">
            {categoryOrder.map((category) => {
              const items = groupedItems[category];
              if (!items?.length) return null;

              const config = categoryConfig[category as keyof typeof categoryConfig];
              if (!config) return null;

              const CategoryIcon = config.icon;

              return (
                <div key={category} className="space-y-2">
                  {isOpen && (
                    <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                      <div
                        className={clsx(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                          config.bgColor,
                          config.textColor
                        )}
                      >
                        <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>
                      <span className={clsx("text-xs font-semibold uppercase tracking-wider", config.textColor)}>
                        {config.label}
                      </span>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <NavLink key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-2" : "justify-center"
            )}
          >
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span
              className={clsx(
                "text-xs font-medium text-slate-500 transition-all duration-300",
                isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}
            >
              En ligne
            </span>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SidebarCommercial;
