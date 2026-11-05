"use client";

import { useMemo, useState } from "react";
import {
  type LucideIcon,
  Activity,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  Car,
  ChevronDown,
  CircleCheck,
  FileCheck,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  Mail,
  MailCheck,
  Megaphone,
  MessageSquare,
  Package,
  PenLine,
  Receipt,
  ScrollText,
  Search,
  ShoppingCart,
  Stamp,
  Target,
  Truck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
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

type Leaf = {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  hint?: string;
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
    icon: LayoutDashboard,
    entries: [
      { id: "main-dashboard", icon: Home, label: "Dashboard", href: "/commercial" },
    ],
  },
  {
    id: "objectifs",
    label: "Objectifs",
    icon: Target,
    entries: [
      { id: "obj-objectifs", icon: Target, label: "Mes Objectifs", href: "/commercial/objectifs" },
      { id: "obj-stats", icon: Activity, label: "Mes Performances", href: "/commercial/statistiques" },
    ],
  },
  {
    id: "operations",
    label: "Opérations",
    icon: ShoppingCart,
    entries: [
      { id: "op-prospects", icon: UserCheck, label: "Prospects", href: "/commercial/prospects" },
      { id: "op-clients", icon: Users, label: "Clients", href: "/commercial/clients" },
      { id: "op-rdv", icon: CalendarDays, label: "Visite en clientèle", href: "/commercial/visite-en-clientele" },
      { id: "op-clientele", icon: FolderOpen, label: "Dossier clientèle", href: "/commercial/dossier-clientele" },
      { id: "op-stock", icon: Warehouse, label: "Voitures Disponibles", href: "/commercial/stock-disponible" },
    ],
  },
  {
    id: "facturation",
    label: "Facturation",
    icon: Receipt,
    entries: [
      {
        id: "fac-proformas",
        icon: FileText,
        label: "Proformas",
        children: [
          { id: "fac-proforma", icon: FileText, label: "Proformas", href: "/commercial/proformas" },
          { id: "fac-proformas-multi", icon: FileSpreadsheet, label: "Proformas-multi", href: "/commercial/profoma-multi" },
          { id: "fac-proformas-validees", icon: FileCheck, label: "Proformas validées", href: "/commercial/proformas-validees" },
        ],
      },
      {
        id: "fac-bons",
        icon: Receipt,
        label: "Bon de commande",
        children: [
          { id: "fac-bon-commande", icon: Receipt, label: "À valider", hint: "Bon à valider", href: "/commercial/bon-de-commande" },
          { id: "fac-bon-commande-deja-valide", icon: BadgeCheck, label: "Déjà validé", hint: "Bon déjà validé", href: "/commercial/bon-de-commande-deja-valide" },
        ],
      },
      {
        id: "fac-contrats",
        icon: FileSignature,
        label: "Contrat de vente",
        children: [
          { id: "fac-contract-vente", icon: FileSignature, label: "À valider", hint: "Contrat à valider", href: "/commercial/contract-vente" },
          { id: "fac-contract-vente-deja-valide", icon: ScrollText, label: "Déjà validé", hint: "Contrat déjà validé", href: "/commercial/contract-vente-deja-valide" },
        ],
      },
      {
        id: "fac-accords",
        icon: Handshake,
        label: "Bon pour accord",
        children: [
          { id: "fac-bon-accord", icon: Stamp, label: "À valider", hint: "Accord à valider", href: "/commercial/bon-pour-accord" },
          { id: "fac-bon-accord-deja-valide", icon: BadgeCheck, label: "Déjà validé", hint: "Accord déjà validé", href: "/commercial/bon-pour-accord-deja-valide" },
        ],
      },
      {
        id: "fac-lettres",
        icon: PenLine,
        label: "Lettre de commande",
        children: [
          { id: "fac-lettre-commande", icon: PenLine, label: "À valider", hint: "Lettre à valider", href: "/commercial/lettre-commande" },
          { id: "fac-lettre-commande-deja-valide", icon: MailCheck, label: "Déjà validée", hint: "Lettre déjà validée", href: "/commercial/lettre-commande-deja-valide" },
        ],
      },
      {
        id: "fac-appels",
        icon: Megaphone,
        label: "Appel d'offre",
        children: [
          { id: "fac-appel-offre", icon: Megaphone, label: "À valider", hint: "Appel d'offre à valider", href: "/commercial/appel-offre" },
          { id: "fac-appel-offre-deja-valide", icon: CircleCheck, label: "Déjà validé", hint: "Appel d'offre déjà validé", href: "/commercial/appel-offre-deja-valide" },
        ],
      },
    ],
  },
  {
    id: "logistique",
    label: "Logistique",
    icon: Truck,
    entries: [
      { id: "log-modeles", icon: Car, label: "Modèles Voitures", href: "/commercial/ajouter-modele" },
      { id: "log-accessoires", icon: Package, label: "Accessoires", href: "/commercial/ajouter-accessoires" },
    ],
  },
  {
    id: "reports",
    label: "Rapports",
    icon: BarChart3,
    entries: [
      { id: "rep-commandes", icon: TrendingUp, label: "Suivi commandes", href: "/commercial/suivi-commandes" },
      { id: "rep-versement", icon: Landmark, label: "Suivi versement", href: "/commercial/versement" },
    ],
  },
  {
    id: "demande",
    label: "Décaissement",
    icon: Wallet,
    entries: [
      { id: "fac-demande-de-decaissement", icon: Wallet, label: "Demande Décaissement", href: "/commercial/demande-de-decaissement" },
    ],
  },
  {
    id: "documentation",
    label: "Documentation",
    icon: BookOpen,
    entries: [
      { id: "fac-numero-courrier", icon: Mail, label: "Numéro courrier", href: "/commercial/numero-courrier" },
      { id: "fac-messages", icon: MessageSquare, label: "Messages", href: "/commercial/messages" },
      { id: "fac-documentation", icon: BookOpen, label: "Documentation", href: "/commercial/documentation" },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/commercial") return pathname === "/commercial";
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

const SidebarCommercial = ({
  isOpen,
  onNavigate,
}: {
  isOpen: boolean;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});
  const normalizedQuery = query.trim().toLowerCase();

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

  const LeafLink = ({ item, nested = false }: { item: Leaf; nested?: boolean }) => {
    const active = isRouteActive(pathname, item.href);
    const accessibleName = !isOpen && item.hint ? item.hint : item.label;
    const link = (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-label={accessibleName}
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
        <ItemIcon icon={item.icon} active={active} />
        {isOpen && (
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
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
          {accessibleName}
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
              <Car className="h-5 w-5" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#f7f4ee] bg-[#1f9d55]" />
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e36a12]">
                  Kpandji
                </p>
                <h2 className="truncate text-base font-semibold leading-tight text-[#111]">Commercial</h2>
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

export default SidebarCommercial;
