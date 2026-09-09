"use client";

import {
  type LucideIcon,
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  CalendarDays,
  FileBarChart,
  Landmark,
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

type NavCategory = "main" | "commandes" | "communication";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  category: NavCategory;
}

const navItems: NavItem[] = [
  {
    id: "main-dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/finance",
    category: "main",
  },
  {
    id: "cmd-projet",
    icon: FolderKanban,
    label: "Projet",
    href: "/finance/projet",
    category: "commandes",
  },
  {
    id: "cmd-taches",
    icon: ListChecks,
    label: "Prospectes",
    href: "/finance/prospectes",
    category: "commandes",
  },
  {
    id: "com-planning",
    icon: CalendarDays,
    label: "Planning",
    href: "/finance/planning",
    category: "communication",
  },
  {
    id: "com-rapports",
    icon: FileBarChart,
    label: "Rapports",
    href: "/finance/rapport",
    category: "communication",
  },
];

const categoryConfig = {
  main: {
    label: "Principal",
    icon: LayoutDashboard,
    color: "from-teal-600 via-emerald-600 to-cyan-700",
    textColor: "text-teal-800",
    chipGradient: "from-teal-600 to-emerald-700",
    glow: "shadow-teal-600/35",
    focusRing: "focus-visible:ring-teal-400",
  },
  commandes: {
    label: "Projets",
    icon: FolderKanban,
    color: "from-amber-500 via-yellow-500 to-orange-600",
    textColor: "text-amber-800",
    chipGradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/35",
    focusRing: "focus-visible:ring-amber-400",
  },
  communication: {
    label: "Suivi",
    icon: CalendarDays,
    color: "from-slate-600 via-teal-700 to-emerald-700",
    textColor: "text-slate-700",
    chipGradient: "from-slate-600 to-teal-700",
    glow: "shadow-slate-500/30",
    focusRing: "focus-visible:ring-slate-400",
  },
} as const;

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/finance") return pathname === "/finance";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SidebarFinance = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  const groupedItems = navItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof navItems>
  );

  const categoryOrder: NavCategory[] = ["main", "commandes", "communication"];

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
          "bg-[linear-gradient(165deg,#f0fdfa_0%,#ffffff_38%,#f8fafc_100%)]",
          "border-r border-slate-200/70",
          "shadow-[4px_0_32px_-8px_rgba(13,148,136,0.12),2px_0_20px_-4px_rgba(180,83,9,0.08)]",
          "before:pointer-events-none before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-teal-400/30 before:to-transparent"
        )}
        role="navigation"
        aria-label="Navigation principale finance"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-slate-200/60 bg-gradient-to-br from-white via-teal-50/50 to-amber-50/30 px-4 py-5 backdrop-blur-sm">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-teal-300/30 to-emerald-400/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-gradient-to-tr from-amber-300/20 to-transparent blur-2xl"
            aria-hidden
          />
          <div
            className={clsx(
              "relative flex items-center gap-3 transition-all duration-300",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-slate-800 text-white shadow-lg shadow-teal-600/35 ring-2 ring-white/60">
              <Landmark className="h-5 w-5 drop-shadow-sm" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm" />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <h2 className="bg-gradient-to-r from-teal-800 via-emerald-700 to-slate-800 bg-clip-text text-base font-bold tracking-tight text-transparent">
                  Finance
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-600">
                  Pilotage & suivi financier
                </p>
              </div>
            )}
          </div>
        </div>

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

        <div className="relative shrink-0 overflow-hidden border-t border-slate-200/60 bg-gradient-to-r from-teal-50/80 via-white to-amber-50/50 px-4 py-3 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-2" : "justify-center"
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/90 px-3 py-1.5 shadow-md shadow-teal-500/10",
                isOpen ? "" : "justify-center border-transparent bg-teal-50/80 px-2"
              )}
            >
              <div className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 shadow-sm" />
              </div>
              <span
                className={clsx(
                  "bg-gradient-to-r from-teal-800 to-emerald-700 bg-clip-text text-xs font-semibold text-transparent transition-all duration-300",
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

export default SidebarFinance;
