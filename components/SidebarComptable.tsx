"use client";

import {
  type LucideIcon,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  Wallet,
  PackageCheck,
  ClipboardCheck,
  Truck,
  ShoppingCart,
  ScrollText,
  Mail,
  MessageSquare,
  BookOpen,
  Calculator,
  Landmark,
  HandCoins,
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

type NavCategory =
  | "main"
  | "facturation"
  | "commandes"
  | "locaux"
  | "partenaires"
  | "communication";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  category: NavCategory;
}

const navItems: NavItem[] = [
  { id: "main-dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/comptable", category: "main" },
  { id: "fac-bc", icon: FileText, label: "Bon de Commande", href: "/comptable/bon-de-commande", category: "facturation" },
  { id: "fac-suivi-bc", icon: ClipboardCheck, label: "Suivi Bon Commande", href: "/comptable/suivi-bon-commande", category: "facturation" },
  { id: "fac-bpa", icon: FileCheck2, label: "Bon Pour Accord", href: "/comptable/bon-pour-accord", category: "facturation" },
  { id: "fac-factures", icon: FileSpreadsheet, label: "Factures", href: "/comptable/facture", category: "facturation" },
  { id: "fac-paiement", icon: HandCoins, label: "Point Paiement", href: "/comptable/point-paiement", category: "facturation" },
  { id: "cmd-commandes", icon: PackageCheck, label: "Commandes", href: "/comptable/commandes", category: "commandes" },
  { id: "cmd-suivi", icon: Landmark, label: "Suivi Commandes", href: "/comptable/suivi-commandes", category: "commandes" },
  { id: "loc-bc", icon: Truck, label: "Bon Commande Locaux", href: "/comptable/bon-commande-locaux", category: "locaux" },
  { id: "loc-cmd", icon: ShoppingCart, label: "Commandes Locaux", href: "/comptable/commandes-locaux", category: "locaux" },
  { id: "loc-fourn", icon: Wallet, label: "Fournisseurs Locaux", href: "/comptable/fournisseur-locaux", category: "locaux" },
  { id: "part-clients", icon: Users, label: "Clients", href: "/comptable/clients", category: "partenaires" },
  { id: "part-bl", icon: ScrollText, label: "Bon de Livraison", href: "/comptable/bon-de-livraison", category: "partenaires" },
  { id: "com-courrier", icon: Mail, label: "Numéro Courrier", href: "/comptable/numero-courrier", category: "communication" },
  { id: "com-messages", icon: MessageSquare, label: "Messages", href: "/comptable/messages", category: "communication" },
  { id: "com-doc", icon: BookOpen, label: "Documentation", href: "/comptable/documentation", category: "communication" },
];

const categoryConfig = {
  main: {
    label: "Principal",
    icon: LayoutDashboard,
    color: "from-emerald-500 via-teal-500 to-cyan-600",
    bgColor: "bg-emerald-500/15",
    textColor: "text-emerald-800",
    chipGradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/35",
    focusRing: "focus-visible:ring-emerald-400",
  },
  facturation: {
    label: "Facturation",
    icon: Receipt,
    color: "from-teal-500 via-emerald-500 to-green-600",
    bgColor: "bg-teal-500/15",
    textColor: "text-teal-800",
    chipGradient: "from-teal-500 to-emerald-600",
    glow: "shadow-teal-500/35",
    focusRing: "focus-visible:ring-teal-400",
  },
  commandes: {
    label: "Commandes",
    icon: PackageCheck,
    color: "from-blue-500 via-indigo-500 to-violet-600",
    bgColor: "bg-indigo-500/15",
    textColor: "text-indigo-800",
    chipGradient: "from-blue-500 to-indigo-600",
    glow: "shadow-indigo-500/35",
    focusRing: "focus-visible:ring-indigo-400",
  },
  locaux: {
    label: "Achats Locaux",
    icon: ShoppingCart,
    color: "from-amber-400 via-orange-500 to-amber-600",
    bgColor: "bg-amber-500/15",
    textColor: "text-amber-800",
    chipGradient: "from-amber-500 to-orange-600",
    glow: "shadow-orange-500/30",
    focusRing: "focus-visible:ring-amber-400",
  },
  partenaires: {
    label: "Partenaires",
    icon: Users,
    color: "from-violet-500 via-purple-500 to-fuchsia-600",
    bgColor: "bg-violet-500/15",
    textColor: "text-violet-800",
    chipGradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/35",
    focusRing: "focus-visible:ring-violet-400",
  },
  communication: {
    label: "Communication",
    icon: MessageSquare,
    color: "from-rose-400 via-pink-500 to-fuchsia-600",
    bgColor: "bg-rose-500/15",
    textColor: "text-rose-800",
    chipGradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/35",
    focusRing: "focus-visible:ring-rose-400",
  },
} as const;

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/comptable") return pathname === "/comptable";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SidebarComptable = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const categoryOrder: NavCategory[] = [
    "main",
    "facturation",
    "commandes",
    "locaux",
    "partenaires",
    "communication",
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
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
            ? clsx("bg-gradient-to-r text-white shadow-lg", cfg.color, cfg.glow)
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
          "bg-[linear-gradient(165deg,#f0fdf4_0%,#ffffff_35%,#ecfdf5_100%)]",
          "border-r border-slate-200/70",
          "shadow-[4px_0_32px_-8px_rgba(16,185,129,0.12),2px_0_20px_-4px_rgba(20,184,166,0.08)]",
          "before:pointer-events-none before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-emerald-400/25 before:to-transparent"
        )}
        role="navigation"
        aria-label="Navigation principale comptable"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-200/60 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/40 px-4 py-5 backdrop-blur-sm">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-emerald-300/30 to-teal-400/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-gradient-to-tr from-cyan-300/25 to-transparent blur-2xl"
            aria-hidden
          />
          <div
            className={clsx(
              "relative flex items-center gap-3 transition-all duration-300",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/35 ring-2 ring-white/60">
              <Calculator className="h-5 w-5 drop-shadow-sm" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-emerald-600 shadow-sm" />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <h2 className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 bg-clip-text text-base font-bold tracking-tight text-transparent">
                  Comptable
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-600">
                  Gestion financière
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

              const config = categoryConfig[category];
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
        <div className="relative shrink-0 overflow-hidden border-t border-slate-200/60 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 px-4 py-3 backdrop-blur-sm">
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

export default SidebarComptable;
