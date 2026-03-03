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
  { id: "fac-bon-acquis", icon: FileCheck, label: "Bon pour Acquis", href: "/commercial/bon-pour-acquis", category: "facturation" },
  { id: "fac-signature", icon: Pen, label: "Signature", href: "/commercial/signature", category: "facturation" },
  { id: "fac-numero-courrier", icon: Mail, label: "Numéro Courrier", href: "/commercial/numero-courrier", category: "facturation" },
  { id: "fac-messages", icon: MessageSquare, label: "Messages", href: "/commercial/messages", category: "facturation" },

  ];

const categoryConfig = {
  main: {
    label: "Principal",
    icon: LayoutDashboard,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-700",
  },
  objectifs: {
    label: "Objectifs",
    icon: Target,
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-700",
  },
  operations: {
    label: "Opérations",
    icon: ShoppingCart,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-700",
  },
  reports: {
    label: "Rapports",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-700",
  },
  facturation: {
    label: "Facturation",
    icon: Receipt,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-700",
  },
  communication: {
    label: "Communication",
    icon: Radio,
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-500/10",
    textColor: "text-rose-700",
  },
  logistique: {
    label: "Logistique",
    icon: Truck,
    color: "from-slate-600 to-slate-800",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-700",
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
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
          "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
          isOpen ? "justify-start" : "justify-center",
          isActive
            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25"
            : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
        )}
        aria-label={item.label}
      >
        <div
          className={clsx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-white/20"
              : "bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-600"
          )}
        >
          <Icon className="h-4 w-4" />
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
          <TooltipContent side="right" sideOffset={12} className="font-medium">
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
          "h-full flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-out overflow-hidden",
          "shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)]"
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/50 px-4 py-5">
          <div
            className={clsx(
              "flex items-center gap-3 transition-all duration-300",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
              <Car className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  Commercial
                </h2>
                <p className="text-xs text-slate-500">Espace de vente</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 custom-scrollbar">
          <div className="space-y-8">
            {categoryOrder.map((category) => {
              const items = groupedItems[category];
              if (!items?.length) return null;

              const config = categoryConfig[category as keyof typeof categoryConfig];
              if (!config) return null;

              const CategoryIcon = config.icon;

              return (
                <div key={category} className="space-y-2">
                  {isOpen && (
                    <div className="flex items-center gap-2 px-3 mb-2">
                      <div
                        className={clsx(
                          "flex h-6 w-6 items-center justify-center rounded-md",
                          config.bgColor,
                          config.textColor
                        )}
                      >
                        <CategoryIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {config.label}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
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
        <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-2" : "justify-center"
            )}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className={clsx(
                "text-xs text-slate-500 transition-all duration-300",
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
