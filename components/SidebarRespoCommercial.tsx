"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type LucideIcon,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Car,
  ChevronDown,
  ClipboardList,
  FileCheck,
  FileSignature,
  FolderOpen,
  Handshake,
  Home,
  Mail,
  MessageSquare,
  Newspaper,
  Package,
  PenLine,
  Receipt,
  Search,
  Target,
  UserCheck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { countBonsAValider } from "@/lib/actions/bondecommande";
import { countContratsAValider } from "@/lib/actions/contrat-vente";
import { countProformasAValider } from "@/lib/actions/facture";

const PROFORMAS_A_VALIDER = "/responsablecommercial/proformas";
const BONS_A_VALIDER = "/responsablecommercial/bon-de-commande";
const CONTRATS_A_VALIDER = "/responsablecommercial/contrat-de-vente";
const ACCORDS_A_VALIDER = "/responsablecommercial/bon-pour-accord";

type Leaf = {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  hint?: string;
  badge?: boolean;
};

type Branch = {
  id: string;
  icon: LucideIcon;
  label: string;
  children: Leaf[];
};

type Entry = Leaf | Branch;

type Section = {
  id: string;
  label: string;
  icon: LucideIcon;
  entries: Entry[];
};

function isBranch(entry: Entry): entry is Branch {
  return "children" in entry;
}

const sections: Section[] = [
  {
    id: "main",
    label: "Principal",
    icon: Home,
    entries: [
      { id: "dash", icon: Home, label: "Dashboard", href: "/responsablecommercial" },
      { id: "objectifs", icon: Target, label: "Objectifs", href: "/responsablecommercial/objectifs" },
      { id: "perf", icon: BarChart3, label: "Performances", href: "/responsablecommercial/performences" },
      { id: "dossiers", icon: FolderOpen, label: "Dossier clientèle", href: "/responsablecommercial/dossier-clientele" },
    ],
  },
  {
    id: "crm",
    label: "Commercial",
    icon: Users,
    entries: [
      { id: "prospects", icon: UserCheck, label: "Prospects", href: "/responsablecommercial/prospects" },
      { id: "clients", icon: Users, label: "Clients", href: "/responsablecommercial/clients" },
    ],
  },
  {
    id: "facturation",
    label: "Facturation",
    icon: Receipt,
    entries: [
      {
        id: "proformas",
        icon: ClipboardList,
        label: "Proformas",
        children: [
          { id: "proformas-wait", icon: ClipboardList, label: "À valider", hint: "Proformas à valider", href: PROFORMAS_A_VALIDER, badge: true },
          { id: "proformas-done", icon: FileCheck, label: "Déjà validées", hint: "Proformas déjà validées", href: "/responsablecommercial/proformas-deja-valide" },
        ],
      },
      {
        id: "bons",
        icon: Receipt,
        label: "Bon de commande",
        children: [
          { id: "bons-wait", icon: Receipt, label: "À valider", hint: "Bon à valider", href: BONS_A_VALIDER, badge: true },
          { id: "bons-done", icon: BadgeCheck, label: "Déjà validé", hint: "Bon déjà validé", href: "/responsablecommercial/bon-de-commande-deja-valide" },
        ],
      },
      {
        id: "contrats",
        icon: FileSignature,
        label: "Contrat de vente",
        children: [
          { id: "contrats-wait", icon: FileSignature, label: "À valider", hint: "Contrat à valider", href: CONTRATS_A_VALIDER, badge: true },
          { id: "contrats-done", icon: FileSignature, label: "Déjà validé", hint: "Contrat déjà validé", href: "/responsablecommercial/contrat-de-vente-deja-valide" },
        ],
      },
      {
        id: "accords",
        icon: Handshake,
        label: "Bon pour accord",
        children: [
          { id: "accords-wait", icon: BadgeCheck, label: "À valider", hint: "Accord à valider", href: ACCORDS_A_VALIDER, badge: true },
          { id: "accords-done", icon: BadgeCheck, label: "Déjà validé", hint: "Accord déjà validé", href: "/responsablecommercial/bon-pour-accord-deja-valide" },
        ],
      },
      { id: "signature", icon: PenLine, label: "Signature", href: "/responsablecommercial/signature" },
    ],
  },
  {
    id: "inventory",
    label: "Inventaire",
    icon: Warehouse,
    entries: [
      { id: "modeles", icon: Car, label: "Modèles voitures", href: "/responsablecommercial/ajouter-modele" },
      { id: "accessoires", icon: Package, label: "Accessoires", href: "/responsablecommercial/ajouter-accessoires" },
      { id: "goodies", icon: Newspaper, label: "Goodies-brochures", href: "/responsablecommercial/goodies-brochures" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: MessageSquare,
    entries: [
      { id: "messages", icon: MessageSquare, label: "Messages", href: "/responsablecommercial/messages" },
      { id: "courrier", icon: Mail, label: "Numéro courrier", href: "/responsablecommercial/numero-courrier" },
      { id: "docs", icon: BookOpen, label: "Documentation", href: "/responsablecommercial/documentation" },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/responsablecommercial") return pathname === "/responsablecommercial";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function leafMatches(leaf: Leaf, query: string) {
  return (
    leaf.label.toLowerCase().includes(query) ||
    leaf.hint?.toLowerCase().includes(query) === true
  );
}

function entryMatches(entry: Entry, query: string): Entry | null {
  if (isBranch(entry)) {
    if (entry.label.toLowerCase().includes(query)) return entry;
    const children = entry.children.filter((child) => leafMatches(child, query));
    return children.length ? { ...entry, children } : null;
  }
  return leafMatches(entry, query) ? entry : null;
}

const SidebarRespoCommercial = ({
  isOpen,
  onNavigate,
}: {
  isOpen: boolean;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState({ proformas: 0, bons: 0, contrats: 0, accords: 0 });
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([countProformasAValider(), countBonsAValider(), countContratsAValider()])
        .then(([proformas, bons, contrats]) => {
          if (cancelled) return;
          setCounts({ proformas, bons, contrats, accords: bons });
        })
        .catch(() => {
          if (cancelled) return;
          setCounts({ proformas: 0, bons: 0, contrats: 0, accords: 0 });
        });
    };
    load();
    window.addEventListener("proformas-a-valider-changed", load);
    window.addEventListener("bons-a-valider-changed", load);
    window.addEventListener("contrats-a-valider-changed", load);
    window.addEventListener("accords-a-valider-changed", load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("proformas-a-valider-changed", load);
      window.removeEventListener("bons-a-valider-changed", load);
      window.removeEventListener("contrats-a-valider-changed", load);
      window.removeEventListener("accords-a-valider-changed", load);
      window.removeEventListener("focus", load);
    };
  }, [pathname]);

  const pendingFor = (href: string) => {
    if (href === PROFORMAS_A_VALIDER) return counts.proformas;
    if (href === BONS_A_VALIDER) return counts.bons;
    if (href === CONTRATS_A_VALIDER) return counts.contrats;
    if (href === ACCORDS_A_VALIDER) return counts.accords;
    return 0;
  };

  const visibleSections = useMemo(() => {
    if (!isOpen || !normalizedQuery) return sections;
    return sections.flatMap((section) => {
      if (section.label.toLowerCase().includes(normalizedQuery)) return [section];
      const entries = section.entries.flatMap((entry) => {
        const match = entryMatches(entry, normalizedQuery);
        return match ? [match] : [];
      });
      return entries.length ? [{ ...section, entries }] : [];
    });
  }, [isOpen, normalizedQuery]);

  const branchIsOpen = (branch: Branch) => {
    if (isOpen && normalizedQuery) return true;
    if (branch.id in manualOpen) return manualOpen[branch.id];
    return branch.children.some((child) => isRouteActive(pathname, child.href));
  };

  const ItemIcon = ({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) => (
    <span
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        active ? "bg-white/10 text-[#e7b84a]" : "bg-white text-[#111] ring-1 ring-[#ead7a2]"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );

  const CountBadge = ({ count, active, compact = false }: { count: number; active: boolean; compact?: boolean }) => {
    if (count <= 0) return null;
    const label = count > 99 ? "99+" : String(count);
    return (
      <span
        className={clsx(
          "inline-flex items-center justify-center rounded-full font-bold tabular-nums leading-none",
          compact
            ? clsx(
                "absolute -right-1.5 -top-1.5 z-10 h-4 min-w-4 px-1 text-[10px] ring-2",
                active ? "bg-[#e7b84a] text-[#111] ring-[#111]" : "bg-[#e36a12] text-white ring-[#f7f4ee]"
              )
            : clsx(
                "ml-auto h-5 min-w-5 px-1.5 text-[11px]",
                active ? "bg-[#e7b84a] text-[#111]" : "bg-[#e36a12] text-white"
              )
        )}
      >
        {label}
      </span>
    );
  };

  const LeafLink = ({ item, nested = false }: { item: Leaf; nested?: boolean }) => {
    const active = isRouteActive(pathname, item.href);
    const pending = item.badge ? pendingFor(item.href) : 0;
    const accessibleName = !isOpen && item.hint ? item.hint : item.label;
    const named = pending > 0 ? `${accessibleName}, ${pending} à valider` : accessibleName;
    const link = (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-label={named}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "group flex min-h-11 items-center rounded-xl text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7b84a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ee]",
          isOpen ? "gap-3 px-2.5" : "justify-center px-1.5",
          nested && isOpen && "ml-3 min-h-10",
          active
            ? "bg-[#111] text-white shadow-sm"
            : "text-[#3f3a33] hover:bg-white active:bg-[#fff4d6]"
        )}
      >
        <span className="relative shrink-0">
          <ItemIcon icon={item.icon} active={active} />
          {!isOpen && <CountBadge count={pending} active={active} compact />}
        </span>
        {isOpen && (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
            <CountBadge count={pending} active={active} />
          </>
        )}
      </Link>
    );

    if (isOpen) return link;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="border-0 bg-[#111] font-medium text-white shadow-lg"
        >
          {named}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full min-h-0 flex-col bg-[#f7f4ee] text-[#111]">
        <div className="shrink-0 border-b border-[#ead7a2] px-3 py-3.5">
          <div className={clsx("flex items-center gap-3", isOpen ? "justify-start" : "justify-center")}>
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#111] text-[#e7b84a] shadow-sm">
              <Warehouse className="h-5 w-5" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#f7f4ee] bg-[#1f9d55]" />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e36a12]">
                  Kpandji
                </p>
                <h2 className="truncate text-base font-semibold leading-tight text-[#111]">Responsable</h2>
              </div>
            )}
            {isOpen && onNavigate && (
              <button
                type="button"
                onClick={onNavigate}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#3f3a33] hover:bg-white lg:hidden"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {isOpen && (
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8175]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un menu"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-[#ead7a2] bg-white pl-9 pr-3 text-sm text-[#111] outline-none placeholder:text-[#8a8175] focus:border-[#e36a12]"
              />
            </label>
          )}
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2.5 py-3">
          {visibleSections.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#8a8175]">Aucun menu pour « {query.trim()} »</p>
          ) : (
            <div className="space-y-4">
              {visibleSections.map((section, index) => {
                const SectionIcon = section.icon;
                return (
                  <div key={section.id}>
                    {isOpen ? (
                      <div className="mb-1.5 flex items-center gap-2 px-2.5">
                        <SectionIcon className="h-3.5 w-3.5 text-[#e36a12]" strokeWidth={2.25} />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8175]">
                          {section.label}
                        </p>
                      </div>
                    ) : (
                      index > 0 && <div className="mx-auto mb-2 h-px w-6 bg-[#ead7a2]" aria-hidden />
                    )}

                    <div className="space-y-1">
                      {section.entries.map((entry) => {
                        if (!isBranch(entry) || !isOpen) {
                          const leaves = isBranch(entry) ? entry.children : [entry];
                          return leaves.map((leaf) => <LeafLink key={leaf.id} item={leaf} />);
                        }

                        const open = branchIsOpen(entry);
                        const childActive = entry.children.some((child) => isRouteActive(pathname, child.href));
                        const branchPending = entry.children.reduce(
                          (sum, child) => sum + (child.badge ? pendingFor(child.href) : 0),
                          0
                        );
                        const BranchIcon = entry.icon;

                        return (
                          <div key={entry.id}>
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() =>
                                setManualOpen((current) => ({
                                  ...current,
                                  [entry.id]: !open,
                                }))
                              }
                              className={clsx(
                                "flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7b84a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ee]",
                                childActive && !open
                                  ? "bg-[#fff4d6] text-[#111]"
                                  : "text-[#3f3a33] hover:bg-white"
                              )}
                            >
                              <ItemIcon icon={BranchIcon} active={false} />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.label}</span>
                              {!open && branchPending > 0 && (
                                <CountBadge count={branchPending} active={false} />
                              )}
                              <ChevronDown
                                className={clsx(
                                  "h-4 w-4 shrink-0 text-[#8a8175] transition-transform",
                                  open && "rotate-180"
                                )}
                              />
                            </button>
                            {open && (
                              <div className="mt-1 space-y-0.5 border-l border-[#ead7a2] pl-1">
                                {entry.children.map((child) => (
                                  <LeafLink key={child.id} item={child} nested />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-[#ead7a2] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className={clsx("flex", isOpen ? "justify-start" : "justify-center")}>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-[#ead7a2]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1f9d55] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1f9d55]" />
              </span>
              {isOpen && <span className="text-xs font-semibold text-[#111]">En ligne</span>}
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SidebarRespoCommercial;
