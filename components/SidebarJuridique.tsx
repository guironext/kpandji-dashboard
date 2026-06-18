"use client";

import {
  LayoutDashboard,
  Users,
  Scale,
  Handshake,
  MessageSquare,
  type LucideIcon,
  ScrollText,
  FilePlus2,
  Gavel,
  Newspaper,
  Mail,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const categoryConfig = {
  main: {
    label: "Principal",
    color: "from-violet-500 via-violet-600 to-indigo-600",
    textColor: "text-violet-800",
    glow: "shadow-violet-500/35",
    focusRing: "focus-visible:ring-violet-400",
    divider: "from-violet-200/80",
  },
  contentieux: {
    label: "Contentieux",
    color: "from-indigo-500 via-purple-600 to-fuchsia-600",
    textColor: "text-indigo-800",
    glow: "shadow-purple-500/35",
    focusRing: "focus-visible:ring-purple-400",
    divider: "from-purple-200/80",
  },
  veille_juridique: {
    label: "Veille Juridique",
    color: "from-sky-500 via-cyan-500 to-teal-500",
    textColor: "text-sky-800",
    glow: "shadow-purple-500/35",
    focusRing: "focus-visible:ring-purple-400",
    divider: "from-purple-200/80",
  },
  communication: {
    label: "Communication",
    color: "from-rose-400 via-pink-500 to-fuchsia-500",
    textColor: "text-rose-800",
    glow: "shadow-rose-500/35",
    focusRing: "focus-visible:ring-rose-400",
    divider: "from-rose-200/80",
  },
} as const;

type NavCategory = keyof typeof categoryConfig;

type NavItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  href: string;
  category: NavCategory;
};

const navItems: NavItem[] = [
  {
    id: "main-dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    description: "Vue d'ensemble",
    href: "/juridique",
    category: "main",
  },
  {
    id: "main-contrats",
    icon: Handshake,
    label: "Contrats & Partenariats",
    description: "Gestion des accords",
    href: "/juridique/contrats-et-partenariats",
    category: "main",
  },
  {
    id: "main-liste-contrats",
    icon: ScrollText,
    label: "Liste des contrats",
    description: "Registre des accords",
    href: "/juridique/contrats-et-partenariats/liste-contrats",
    category: "main",
  },
  {
    id: "ctx-create",
    icon: FilePlus2,
    label: "Nouveau dossier",
    description: "Créer un contentieux",
    href: "/juridique/contentieux/nouveau-dossier",
    category: "contentieux",
  },
  {
    id: "ctx-list",
    icon: Gavel,
    label: "Liste des contentieux",
    description: "Dossiers en cours",
    href: "/juridique/contentieux/liste-contentieux",
    category: "contentieux",
  },
  {
    id: "ops-veille",
    icon: Newspaper,
    label: "Veille juridique",
    description: "Actualités & jurisprudence",
    href: "/juridique/veille-juridique",
    category: "veille_juridique",
  },
  {
    id: "ops-liste-veilles",
    icon: ScrollText,
    label: "Liste des veilles juridiques",
    description: "Registre des dossiers",
    href: "/juridique/veille-juridique/liste-veilles-juridiques",
    category: "veille_juridique",
  },
  {
    id: "com-messages",
    icon: MessageSquare,
    label: "Messages",
    description: "Échanges internes",
    href: "/juridique/messages",
    category: "communication",
  },
  {
    id: "com-courriers",
    icon: Mail,
    label: "Courriers",
    description: "Numérotation & suivi",
    href: "/juridique/numero-courrier",
    category: "communication",
  },
];

const categoryOrder: NavCategory[] = [
  "main",
  "contentieux",
  "veille_juridique",
  "communication",
];

function isNavActive(
  pathname: string,
  href: string,
  searchParams: URLSearchParams
) {
  const [path, query] = href.split("?");

  if (pathname !== path) return false;

  if (query) {
    const expected = new URLSearchParams(query);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
  }

  return true;
}

const SidebarJuridique = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedItems = navItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<NavCategory, NavItem[]>
  );

  const NavLink = ({ item }: { item: NavItem }) => {
    const cfg = categoryConfig[item.category];
    const Icon = item.icon;
    const isActive = mounted && isNavActive(pathname, item.href, searchParams);

    const linkContent = (
      <Link
        href={item.href}
        className={clsx(
          "group relative flex items-center rounded-xl px-2.5 py-2 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          cfg.focusRing,
          isOpen ? "gap-2.5" : "justify-center px-0",
          isActive
            ? clsx("bg-gradient-to-r text-white shadow-lg", cfg.color, cfg.glow)
            : "text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm hover:ring-1 hover:ring-slate-200/60 active:scale-[0.98]"
        )}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90 shadow-sm"
            aria-hidden
          />
        )}

        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-white/20 text-white shadow-inner"
              : clsx(
                  "bg-white/95 shadow-sm ring-1 ring-slate-200/70",
                  cfg.textColor,
                  "group-hover:scale-[1.03] group-hover:ring-slate-300/80"
                )
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 2} />
        </span>

        {isOpen && (
          <span className="min-w-0 flex-1">
            <span
              className={clsx(
                "block truncate text-[13px] font-medium leading-tight",
                isActive && "font-semibold"
              )}
            >
              {item.label}
            </span>
            {item.description && (
              <span
                className={clsx(
                  "block truncate text-[10px] leading-tight",
                  isActive ? "text-white/75" : "text-slate-400"
                )}
              >
                {item.description}
              </span>
            )}
          </span>
        )}
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
            <p>{item.label}</p>
            {item.description && (
              <p className="text-[11px] font-normal text-slate-300">
                {item.description}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider delayDuration={0}>
    <aside
      className="relative h-full w-full overflow-hidden border-r border-slate-200/70 bg-white shadow-[4px_0_24px_-4px_rgba(15,23,42,0.08)]"
      role="navigation"
      aria-label="Navigation principale juridique"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/80 via-violet-50/30 to-indigo-50/40" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <header className="shrink-0 border-b border-slate-200/70 bg-white/70 px-3 py-4 backdrop-blur-md">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "gap-3" : "justify-center"
            )}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 shadow-lg shadow-violet-300/40 ring-1 ring-white/20">
              <Scale className="h-5 w-5 text-white" strokeWidth={2} />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            {isOpen && (
              <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                  Juriste
                </h2>
                <p className="truncate text-[11px] font-medium text-violet-600/80">
                  Gestion juridique
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Navigation */}
        <nav className="sidebar-juridique-scroll flex-1 space-y-5 overflow-y-auto px-2.5 py-4 sm:px-3">
          {categoryOrder.map((category) => {
            const items = groupedItems[category];
            if (!items?.length) return null;
            const cfg = categoryConfig[category];

            return (
              <section key={category} className="space-y-0.5">
                {isOpen ? (
                  <div className="mb-2 flex items-center gap-2 px-2">
                    <span
                      className={clsx(
                        "text-[10px] font-bold uppercase tracking-[0.14em]",
                        cfg.textColor
                      )}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className={clsx(
                        "h-px flex-1 bg-gradient-to-r to-transparent",
                        cfg.divider
                      )}
                    />
                  </div>
                ) : (
                  <div
                    className={clsx(
                      "mx-auto mb-2 h-px w-6 bg-gradient-to-r",
                      cfg.divider
                    )}
                    aria-hidden
                  />
                )}

                <ul className="space-y-0.5" role="list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <NavLink item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </nav>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-200/70 bg-white/70 px-3 py-3.5 backdrop-blur-md">
          <div
            className={clsx(
              "flex items-center rounded-xl bg-slate-50/80 p-2 ring-1 ring-slate-200/60 transition-all duration-300",
              isOpen ? "gap-2.5" : "justify-center"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-slate-600">
                  Session juridique
                </p>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Connecté
                </p>
              </div>
            )}
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .sidebar-juridique-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.25) transparent;
        }
        .sidebar-juridique-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-juridique-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-juridique-scroll::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.25);
          border-radius: 9999px;
        }
        .sidebar-juridique-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </aside>
    </TooltipProvider>
  );
};

export default SidebarJuridique;
