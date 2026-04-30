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
  FileSpreadsheet,
  ClipboardList,
  Package,
  TrendingUp,
  FileCheck,
  Receipt,
  Mail,
  MessageSquare,
  LayoutDashboard,
  ShoppingCart,
  Radio,
  Target,
  Truck,
  Activity,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CarFront,
  FileSignature,
  Landmark,
  ScrollText,
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
  | "communication"
  | "documentation";

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
  { id: "op-rdv", icon: CalendarDays, label: "Rendez-vous", href: "/commercial/rendez-vous", category: "operations" },
  { id: "op-calendrier-sortie", icon: CalendarRange, label: "Calendrier sortie", href: "/commercial/calendrier-sortie", category: "operations" },
  { id: "op-reservation", icon: CarFront, label: "Réservation véhicule", href: "/commercial/reservation-vehicule", category: "operations" },
  { id: "op-rapport-rdv", icon: ClipboardList, label: "Rapport Rendez-vous", href: "/commercial/rapport-rendez-vous", category: "operations" },
  { id: "op-suivi-rdv", icon: Eye, label: "Suivi Rendez-vous", href: "/commercial/suivi-rendez-vous", category: "operations" },
  { id: "op-tableau-chute", icon: BarChart3, label: "Tableau de Chute", href: "/commercial/tableau-chute", category: "operations" },

  // Rapports
  { id: "rep-commandes", icon: TrendingUp, label: "Suivi commandes", href: "/commercial/suivi-commandes", category: "reports" },
  { id: "rep-versement", icon: Landmark, label: "Suivi versement", href: "/commercial/versement", category: "reports" },

  // Facturation
  { id: "fac-proformas", icon: FileText, label: "Proformas", href: "/commercial/proformas", category: "facturation" },
  { id: "fac-proformas-multi", icon: FileSpreadsheet, label: "Proformas-multi", href: "/commercial/profoma-multi", category: "facturation" },
  { id: "fac-bon-commande", icon: Receipt, label: "Bon de Commande", href: "/commercial/bon-de-commande", category: "facturation" },
  { id: "fac-bon-accord", icon: FileCheck, label: "Bon pour accord", href: "/commercial/bon-pour-accord", category: "facturation" },

  // Documentation
  { id: "fac-signature", icon: FileSignature, label: "Signature", href: "/commercial/signature", category: "documentation" },
  { id: "fac-numero-courrier", icon: Mail, label: "Numéro courrier", href: "/commercial/numero-courrier", category: "documentation" },
  { id: "fac-messages", icon: MessageSquare, label: "Messages", href: "/commercial/messages", category: "documentation" },
  { id: "fac-documentation", icon: BookOpen, label: "Documentation", href: "/commercial/documentation", category: "documentation" },
];

const categoryConfig = {
  main: {
    label: "Principal",
    icon: LayoutDashboard,
    color: "from-amber-400 via-orange-500 to-rose-500",
    bgColor: "bg-amber-500/15",
    textColor: "text-amber-800",
    chipGradient: "from-amber-400 to-orange-600",
    glow: "shadow-orange-500/35",
    focusRing: "focus-visible:ring-amber-400",
  },
  objectifs: {
    label: "Objectifs",
    icon: Target,
    color: "from-cyan-400 via-sky-500 to-blue-600",
    bgColor: "bg-sky-500/15",
    textColor: "text-sky-800",
    chipGradient: "from-cyan-500 to-blue-600",
    glow: "shadow-sky-500/35",
    focusRing: "focus-visible:ring-sky-400",
  },
  operations: {
    label: "Opérations",
    icon: ShoppingCart,
    color: "from-blue-500 via-indigo-500 to-violet-600",
    bgColor: "bg-indigo-500/15",
    textColor: "text-indigo-800",
    chipGradient: "from-blue-500 to-indigo-600",
    glow: "shadow-indigo-500/35",
    focusRing: "focus-visible:ring-indigo-400",
  },
  reports: {
    label: "Rapports",
    icon: BarChart3,
    color: "from-emerald-400 via-teal-500 to-cyan-600",
    bgColor: "bg-emerald-500/15",
    textColor: "text-emerald-800",
    chipGradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/35",
    focusRing: "focus-visible:ring-emerald-400",
  },
  facturation: {
    label: "Facturation",
    icon: Receipt,
    color: "from-violet-500 via-fuchsia-500 to-pink-500",
    bgColor: "bg-violet-500/15",
    textColor: "text-violet-800",
    chipGradient: "from-violet-500 to-fuchsia-600",
    glow: "shadow-fuchsia-500/35",
    focusRing: "focus-visible:ring-fuchsia-400",
  },
  communication: {
    label: "Communication",
    icon: Radio,
    color: "from-rose-400 via-pink-500 to-fuchsia-600",
    bgColor: "bg-rose-500/15",
    textColor: "text-rose-800",
    chipGradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/35",
    focusRing: "focus-visible:ring-rose-400",
  },
  logistique: {
    label: "Logistique",
    icon: Truck,
    color: "from-orange-400 via-amber-500 to-yellow-500",
    bgColor: "bg-orange-500/15",
    textColor: "text-orange-900",
    chipGradient: "from-orange-500 to-amber-600",
    glow: "shadow-orange-500/30",
    focusRing: "focus-visible:ring-orange-400",
  },
  documentation: {
    label: "Documentation",
    icon: BookOpen,
    color: "from-indigo-500 via-violet-500 to-purple-600",
    bgColor: "bg-indigo-500/12",
    textColor: "text-indigo-900",
    chipGradient: "from-indigo-500 to-purple-600",
    glow: "shadow-violet-500/35",
    focusRing: "focus-visible:ring-violet-400",
  },
} as const;

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/commercial") return pathname === "/commercial";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SidebarCommercial = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const categoryOrder = [
    "main",
    "objectifs",
    "logistique",
    "operations",
    "reports",
    "facturation",
    "communication",
    "documentation",
  ];

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const cfg = categoryConfig[item.category];
    const isActive = isRouteActive(pathname, item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={clsx(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          cfg.focusRing,
          isOpen ? "justify-start" : "justify-center",
          isActive
            ? clsx(
                "bg-gradient-to-r text-white shadow-lg",
                cfg.color,
                cfg.glow
              )
            : clsx(
                "text-slate-700",
                "hover:bg-white/90 hover:shadow-md hover:shadow-slate-200/40 hover:ring-1 hover:ring-slate-200/60",
                "active:scale-[0.98]"
              )
        )}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white/50 shadow-sm"
            aria-hidden
          />
        )}
        <div
          className={clsx(
            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-white/20 text-white shadow-inner"
              : clsx(
                  "bg-white/95 shadow-sm ring-1 ring-slate-200/70",
                  cfg.textColor,
                  "group-hover:scale-[1.03] group-hover:ring-slate-300/80"
                )
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
            className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 font-medium text-white shadow-xl shadow-slate-900/30"
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
          "relative h-full min-h-0 flex flex-col overflow-hidden transition-all duration-300 ease-out",
          "bg-[linear-gradient(165deg,#fafafa_0%,#ffffff_35%,#f0f4ff_100%)]",
          "border-r border-slate-200/70",
          "shadow-[4px_0_32px_-8px_rgba(99,102,241,0.12),2px_0_20px_-4px_rgba(245,158,11,0.08)]",
          "before:pointer-events-none before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-amber-400/25 before:to-transparent"
        )}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-200/60 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30 px-4 py-5 backdrop-blur-sm">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-amber-300/30 to-fuchsia-400/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-gradient-to-tr from-sky-300/25 to-transparent blur-2xl"
            aria-hidden
          />
          <div
            className={clsx(
              "relative flex items-center gap-3 transition-all duration-300",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/35 ring-2 ring-white/60">
              <Car className="h-5 w-5 drop-shadow-sm" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm" />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <h2 className="bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 bg-clip-text text-base font-bold tracking-tight text-transparent">
                  Commercial
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-600">
                  Espace de vente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-5">
            {categoryOrder.map((category) => {
              const items = groupedItems[category];
              if (!items?.length) return null;

              const config = categoryConfig[category as keyof typeof categoryConfig];
              if (!config) return null;

              const CategoryIcon = config.icon;

              return (
                <div key={category} className="space-y-1.5">
                  {isOpen && (
                    <div className="mb-1 flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white/60 px-2.5 py-2 shadow-sm shadow-slate-200/20 backdrop-blur-sm">
                      <div
                        className={clsx(
                          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md",
                          config.chipGradient,
                          config.glow
                        )}
                      >
                        <CategoryIcon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span
                        className={clsx(
                          "text-[11px] font-bold uppercase tracking-[0.14em]",
                          config.textColor
                        )}
                      >
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
        <div className="relative shrink-0 overflow-hidden border-t border-slate-200/60 bg-gradient-to-r from-emerald-50/80 via-white to-cyan-50/60 px-4 py-3 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-2" : "justify-center"
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1.5 shadow-md shadow-emerald-500/10",
                isOpen ? "" : "justify-center border-transparent bg-emerald-50/80 px-2"
              )}
            >
              <div className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
              </div>
              <span
                className={clsx(
                  "bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-xs font-semibold text-transparent transition-all duration-300",
                  isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}
              >
                En ligne
              </span>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SidebarCommercial;
