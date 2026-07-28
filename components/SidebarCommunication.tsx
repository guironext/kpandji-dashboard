"use client";

import {
  LayoutDashboard,
  FolderKanban,
  Target,
  ListTodo,
  Megaphone,

  type LucideIcon,
  BarChart,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
type NavItem = {
  id: number;
  icon: LucideIcon;
  label: string;
  href: string;
  category:
    | "main"
    | "projets"
    | "operations"
    | "courriers-messages"
    | "documentation";
};

const navItems: NavItem[] = [
  {
    id: 1,
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/communication",
    category: "main",
  },
  {
    id: 2,
    icon: FolderKanban,
    label: "Projets Ponctuels",
    href: "/communication/projets-ponctuels",
    category: "projets",
  },
  {
    id: 3,
    icon: Target,
    label: "Activités Routinières",
    href: "/communication/activites-routinees",
    category: "projets",
  },
  {
    id: 4,
    icon: ListTodo,
    label: "Tâches en cours",
    href: "/communication/taches-en-cours",
    category: "courriers-messages",
  },
  {
    id: 5,
    icon: BarChart,
    label: "Indicateurs",
    href: "/communication/indicateurs",
    category: "documentation",
  },
  {
    id: 6,
    icon: MailIcon, 
    label: "Courriers et Messages ",
    href: "/communication/courriers-et-messages",
    category: "documentation",
  },
 
];

const categoryLabels: Record<NavItem["category"], string> = {
  main: "Principal",
  projets: "Projets",
  operations: "Opérations",
  "courriers-messages": "Courriers Messages",
  documentation: "Documentation",
};

const categoryOrder: NavItem["category"][] = [
  "main",
  "projets",
  "operations",
  "courriers-messages",
  "documentation",
];

const categoryThemes: Record<
  NavItem["category"],
  { label: string; border: string; dot: string }
> = {
  main: {
    label: "text-sky-600",
    border: "border-sky-200/80",
    dot: "bg-sky-500",
  },
  projets: {
    label: "text-violet-600",
    border: "border-violet-200/80",
    dot: "bg-violet-500",
  },
  operations: {
    label: "text-emerald-600",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  "courriers-messages": {
    label: "text-amber-600",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  documentation: {
    label: "text-fuchsia-600",
    border: "border-fuchsia-200/80",
    dot: "bg-fuchsia-500",
  },
};

const itemThemes: Record<
  number,
  {
    active: string;
    idle: string;
    iconBg: string;
    iconText: string;
    iconHover: string;
    label: string;
  }
> = {
  1: {
    active: "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 shadow-lg shadow-sky-500/30",
    idle: "hover:bg-sky-50/90 hover:shadow-md hover:shadow-sky-200/50",
    iconBg: "bg-gradient-to-br from-sky-400 to-cyan-500",
    iconText: "text-white",
    iconHover: "group-hover:from-sky-500 group-hover:to-cyan-600",
    label: "text-sky-800 group-hover:text-sky-900",
  },
  2: {
    active: "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-violet-500/30",
    idle: "hover:bg-violet-50/90 hover:shadow-md hover:shadow-violet-200/50",
    iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
    iconText: "text-white",
    iconHover: "group-hover:from-violet-500 group-hover:to-purple-600",
    label: "text-violet-800 group-hover:text-violet-900",
  },
  3: {
    active: "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 shadow-lg shadow-emerald-500/30",
    idle: "hover:bg-emerald-50/90 hover:shadow-md hover:shadow-emerald-200/50",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    iconText: "text-white",
    iconHover: "group-hover:from-emerald-500 group-hover:to-teal-600",
    label: "text-emerald-800 group-hover:text-emerald-900",
  },
  4: {
    active: "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 shadow-lg shadow-orange-500/30",
    idle: "hover:bg-orange-50/90 hover:shadow-md hover:shadow-orange-200/50",
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    iconText: "text-white",
    iconHover: "group-hover:from-orange-500 group-hover:to-amber-600",
    label: "text-orange-800 group-hover:text-orange-900",
  },
  5: {
    active: "bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 shadow-lg shadow-rose-500/30",
    idle: "hover:bg-rose-50/90 hover:shadow-md hover:shadow-rose-200/50",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
    iconText: "text-white",
    iconHover: "group-hover:from-rose-500 group-hover:to-pink-600",
    label: "text-rose-800 group-hover:text-rose-900",
  },
  6: {
    active: "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 shadow-lg shadow-blue-500/30",
    idle: "hover:bg-blue-50/90 hover:shadow-md hover:shadow-blue-200/50",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    iconText: "text-white",
    iconHover: "group-hover:from-blue-500 group-hover:to-indigo-600",
    label: "text-blue-800 group-hover:text-blue-900",
  },
  7: {
    active: "bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-600 shadow-lg shadow-indigo-500/30",
    idle: "hover:bg-indigo-50/90 hover:shadow-md hover:shadow-indigo-200/50",
    iconBg: "bg-gradient-to-br from-indigo-400 to-blue-500",
    iconText: "text-white",
    iconHover: "group-hover:from-indigo-500 group-hover:to-blue-600",
    label: "text-indigo-800 group-hover:text-indigo-900",
  },
  8: {
    active: "bg-gradient-to-r from-amber-500 via-yellow-500 to-lime-500 shadow-lg shadow-amber-500/30",
    idle: "hover:bg-amber-50/90 hover:shadow-md hover:shadow-amber-200/50",
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500",
    iconText: "text-white",
    iconHover: "group-hover:from-amber-500 group-hover:to-yellow-600",
    label: "text-amber-900 group-hover:text-amber-950",
  },
  9: {
    active: "bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 shadow-lg shadow-lime-500/30",
    idle: "hover:bg-lime-50/90 hover:shadow-md hover:shadow-lime-200/50",
    iconBg: "bg-gradient-to-br from-lime-400 to-green-500",
    iconText: "text-white",
    iconHover: "group-hover:from-lime-500 group-hover:to-green-600",
    label: "text-lime-900 group-hover:text-lime-950",
  },
  10: {
    active: "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-600 shadow-lg shadow-fuchsia-500/30",
    idle: "hover:bg-fuchsia-50/90 hover:shadow-md hover:shadow-fuchsia-200/50",
    iconBg: "bg-gradient-to-br from-fuchsia-400 to-purple-500",
    iconText: "text-white",
    iconHover: "group-hover:from-fuchsia-500 group-hover:to-purple-600",
    label: "text-fuchsia-800 group-hover:text-fuchsia-900",
  },
};

const defaultItemTheme = itemThemes[1];

function isNavActive(pathname: string, href: string) {
  if (href === "/communication") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarCommunicationProps = {
  isOpen: boolean;
  onNavigate?: () => void;
};

const SidebarCommunication = ({ isOpen, onNavigate }: SidebarCommunicationProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedItems = categoryOrder
    .map((category) => ({
      category,
      items: navItems.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  if (!mounted) {
    return (
      <aside
        className="h-full w-full shrink-0 border-r border-violet-200/60 bg-gradient-to-b from-violet-50 to-fuchsia-50"
        aria-hidden
      />
    );
  }

  return (
    <aside
      className="flex h-full w-full flex-col overflow-hidden border-r border-violet-200/50 shadow-lg shadow-violet-200/30"
      role="navigation"
      aria-label="Navigation Communication"
    >
        <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-100 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-cyan-400/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-8 -left-6 h-36 w-36 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute right-0 top-1/3 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" aria-hidden />

          <header className="relative shrink-0 border-b border-white/40 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-3 py-3 shadow-lg shadow-fuchsia-500/20 sm:px-4 sm:py-4">
            <div
              className={clsx(
                "flex items-center transition-all duration-300",
                isOpen ? "justify-start gap-3" : "justify-center"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner ring-2 ring-white/50 backdrop-blur-sm sm:h-9 sm:w-9">
                <Megaphone className="h-5 w-5 text-white drop-shadow sm:h-[18px] sm:w-[18px]" aria-hidden />
              </div>
              <div
                className={clsx(
                  "min-w-0 overflow-hidden transition-all duration-300",
                  isOpen ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
                )}
              >
                <h2 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                  Communication
                </h2>
                <p className="truncate text-[11px] text-white/80 sm:text-xs">
                  Équipe Communication
                </p>
              </div>
            </div>
          </header>

          <nav
            className="relative flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-3 [scrollbar-color:rgb(167_139_250)_transparent] [scrollbar-width:thin] sm:px-3 sm:py-4"
            aria-label="Menu Communication"
          >
            {groupedItems.map(({ category, items }, groupIndex) => {
              const catTheme = categoryThemes[category];

              return (
                <div
                  key={category}
                  className={clsx(
                    groupIndex > 0 && clsx("mt-3 border-t pt-3 sm:mt-4 sm:pt-4", catTheme.border)
                  )}
                >
                  <h3
                    className={clsx(
                      "mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 sm:text-[11px]",
                      catTheme.label,
                      isOpen ? "h-4 opacity-100" : "h-0 overflow-hidden opacity-0"
                    )}
                  >
                    <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", catTheme.dot)} />
                    {categoryLabels[category]}
                  </h3>

                  <ul className="space-y-1" role="list">
                    {items.map((item) => {
                      const isActive = isNavActive(pathname, item.href);
                      const Icon = item.icon;
                      const theme = itemThemes[item.id] ?? defaultItemTheme;

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            prefetch={false}
                            onClick={onNavigate}
                            title={item.label}
                            className={clsx(
                              "group relative flex rounded-xl transition-all duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2",
                              "active:scale-[0.98]",
                              isOpen
                                ? "min-h-10 items-center gap-3 px-2.5 py-2"
                                : "mx-auto w-full flex-col items-center gap-1.5 px-1.5 py-2",
                              isActive ? theme.active : theme.idle
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {isActive && (
                              <span
                                className={clsx(
                                  "absolute rounded-full bg-white/90 shadow-sm",
                                  isOpen
                                    ? "left-0 top-1/2 h-5 w-1 -translate-y-1/2"
                                    : "bottom-0 left-1/2 h-1 w-5 -translate-x-1/2"
                                )}
                                aria-hidden
                              />
                            )}

                            <span
                              className={clsx(
                                "flex shrink-0 items-center justify-center rounded-lg shadow-md transition-all duration-200 group-hover:scale-110",
                                isOpen ? "h-8 w-8" : "h-9 w-9",
                                isActive
                                  ? "bg-white/25 ring-1 ring-white/40"
                                  : clsx(theme.iconBg, theme.iconHover)
                              )}
                            >
                              <Icon
                                className={clsx(
                                  "transition-transform duration-200",
                                  isOpen ? "h-4 w-4" : "h-[18px] w-[18px]",
                                  isActive ? "text-white" : theme.iconText
                                )}
                                aria-hidden
                              />
                            </span>

                            <span
                              className={clsx(
                                "font-semibold leading-tight transition-all duration-300",
                                isOpen ? "truncate text-sm" : "line-clamp-2 w-full text-center text-[10px]",
                                isActive ? "text-white" : theme.label
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <footer className="relative shrink-0 border-t border-violet-200/50 bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-violet-400/20 px-3 py-3 backdrop-blur-md sm:px-4">
            <div
              className={clsx(
                "flex items-center transition-all duration-300",
                isOpen ? "justify-start gap-2" : "justify-center"
              )}
            >
              <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-lime-500 ring-2 ring-white/80" />
              </span>
              <p
                className={clsx(
                  "bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-[11px] font-semibold text-transparent sm:text-xs",
                  isOpen ? "opacity-100" : "sr-only"
                )}
              >
                En ligne · v1.0
              </p>
            </div>
          </footer>
        </div>
    </aside>
  );
};

export default SidebarCommunication;
