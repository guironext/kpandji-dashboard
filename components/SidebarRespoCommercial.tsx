"use client";

import {
  Home,
  Users,
  BarChart3,
  Warehouse,
  Car,
  UserCheck,
  Receipt,
  ClipboardList,
  Package,
  FileCheck,
  Target,
  Mail,
  BookOpen,
  FolderOpen,
  FileSignature,
  MessageSquare,
  PenLine,
  Newspaper,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { countBonsAValider } from "@/lib/actions/bondecommande";
import { countContratsAValider } from "@/lib/actions/contrat-vente";
import { countProformasAValider } from "@/lib/actions/facture";

const PROFORMAS_A_VALIDER = "/responsablecommercial/proformas";
const BONS_A_VALIDER = "/responsablecommercial/bon-de-commande";
const CONTRATS_A_VALIDER = "/responsablecommercial/contrat-de-vente";
const ACCORDS_A_VALIDER = "/responsablecommercial/bon-pour-accord";

// Category-first navigation structure with logical grouping
const iconClass = "w-5 h-5";

const navCategories = [
  {
    id: "main",
    label: "Principal",
    color: "#6366f1",
    bg: "#6366f11a",
    items: [
      { id: 1, icon: <Home className={iconClass} />, label: "Dashboard", href: "/responsablecommercial" },
      { id: 2, icon: <Target className={iconClass} />, label: "Objectifs", href: "/responsablecommercial/objectifs" },
      { id: 5, icon: <BarChart3 className={iconClass} />, label: "Performances", href: "/responsablecommercial/performences" },
      { id: 9, icon: <FolderOpen className={iconClass} />, label: "Dossier Clientèle", href: "/responsablecommercial/dossier-clientele" },
    ],
  },
  {
    id: "crm",
    label: "Commercial",
    color: "#22c55e",
    bg: "#22c55e1a",
    items: [
      { id: 13, icon: <UserCheck className={iconClass} />, label: "Prospects", href: "/responsablecommercial/prospects" },
      { id: 14, icon: <Users className={iconClass} />, label: "Clients", href: "/responsablecommercial/clients" },
    ],
  },
  {
    id: "facturation",
    label: "Facturation",
    color: "#ec4899",
    bg: "#ec48991a",
    items: [
      { id: 20, icon: <ClipboardList className={iconClass} />, label: "Proformas à valider", href: "/responsablecommercial/proformas" },
      { id: 21, icon: <FileCheck className={iconClass} />, label: "Proformas déjà validées", href: "/responsablecommercial/proformas-deja-valide" },
      { id: 22, icon: <Receipt className={iconClass} />, label: "Bon à valider", href: "/responsablecommercial/bon-de-commande" },
      { id: 23, icon: <Receipt className={iconClass} />, label: "Bon déjà validé", href: "/responsablecommercial/bon-de-commande-deja-valide" },

      { id: 30, icon: <FileSignature className={iconClass} />, label: "Contrat à valider", href: "/responsablecommercial/contrat-de-vente" },
      { id: 31, icon: <FileSignature className={iconClass} />, label: "Contrat déjà validé", href: "/responsablecommercial/contrat-de-vente-deja-valide" },

      { id: 23, icon: <BadgeCheck className={iconClass} />, label: "Accord à valider", href: "/responsablecommercial/bon-pour-accord" },
      { id: 24, icon: <BadgeCheck className={iconClass} />, label: "Accord déjà validé", href: "/responsablecommercial/bon-pour-accord-deja-valide" },

      { id: 25, icon: <PenLine className={iconClass} />, label: "Signature", href: "/responsablecommercial/signature" },
    ],
  },
  {
    id: "inventory",
    label: "Inventaire",
    color: "#0ea5e9",
    bg: "#0ea5e91a",
    items: [
      { id: 10, icon: <Car className={iconClass} />, label: "Modèles Voitures", href: "/responsablecommercial/ajouter-modele" },
      { id: 11, icon: <Package className={iconClass} />, label: "Accessoires", href: "/responsablecommercial/ajouter-accessoires" },
      { id: 12, icon: <Newspaper className={iconClass} />, label: "Goodies-Brochures", href: "/responsablecommercial/goodies-brochures" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    color: "#8b5cf6",
    bg: "#8b5cf61a",
    items: [
      { id: 26, icon: <MessageSquare className={iconClass} />, label: "Messages", href: "/responsablecommercial/messages" },
      { id: 27, icon: <Mail className={iconClass} />, label: "Numéro Courrier", href: "/responsablecommercial/numero-courrier" },
      { id: 28, icon: <BookOpen className={iconClass} />, label: "Documentation", href: "/responsablecommercial/documentation" },
    ],
  },
];

const SidebarRespoCommercial = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();
  const [proformasAValider, setProformasAValider] = useState(0);
  const [bonsAValider, setBonsAValider] = useState(0);
  const [contratsAValider, setContratsAValider] = useState(0);
  const [accordsAValider, setAccordsAValider] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([countProformasAValider(), countBonsAValider(), countContratsAValider()])
        .then(([proformas, bons, contrats]) => {
          if (cancelled) return;
          setProformasAValider(proformas);
          setBonsAValider(bons);
          setContratsAValider(contrats);
          setAccordsAValider(bons);
        })
        .catch(() => {
          if (cancelled) return;
          setProformasAValider(0);
          setBonsAValider(0);
          setContratsAValider(0);
          setAccordsAValider(0);
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

  return (
    <aside
      className="flex h-full w-full flex-col border-r border-gray-200 bg-white shadow-lg -mt-10"
    >
      <div className="flex h-full min-h-0 flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className={clsx(
            "flex items-center transition-all duration-300",
            isOpen ? "justify-start gap-3" : "justify-center"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="hidden md:block">
                <h2 className="text-lg font-bold text-gray-900">Responsable Commercial</h2>
                <p className="text-xs text-gray-500">Equipe Commercial</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className={clsx("min-h-0 flex-1 space-y-6 overflow-y-auto", isOpen ? "p-4" : "px-2 py-4")}>
          {navCategories.map((category) => (
            <div
              key={category.id}
              className={clsx("space-y-2 rounded-xl", isOpen ? "-mx-1 p-3" : "px-1 py-2")}
              style={{ backgroundColor: category.bg }}
            >
              {isOpen && (
                <h3
                  className="text-xs font-semibold uppercase tracking-wider px-3"
                  style={{ color: category.color }}
                >
                  {category.label}
                </h3>
              )}
              
              {category.items.map((item, index) => {
                const isActive = pathname === item.href;
                const pending =
                  item.href === PROFORMAS_A_VALIDER
                    ? proformasAValider
                    : item.href === BONS_A_VALIDER
                      ? bonsAValider
                      : item.href === CONTRATS_A_VALIDER
                        ? contratsAValider
                        : item.href === ACCORDS_A_VALIDER
                          ? accordsAValider
                          : 0;
                const showBadge =
                  item.href === BONS_A_VALIDER ||
                  item.href === CONTRATS_A_VALIDER ||
                  item.href === ACCORDS_A_VALIDER ||
                  pending > 0;
                const pendingLabel = pending > 99 ? "99+" : String(pending);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "group relative flex items-center text-gray-700 duration-200 ease-in-out transform py-2.5 rounded-xl",
                      "hover:bg-white hover:shadow-sm hover:scale-[1.02] transition-all",
                      isOpen ? "justify-start gap-3 px-3" : "justify-center px-1",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]"
                        : "hover:text-gray-900"
                    )}
                    style={{
                      transitionDelay: `${index * 50}ms`,
                    }}
                    aria-label={showBadge ? `${item.label}, ${pending} à valider` : item.label}
                  >
                    <div className={clsx(
                      "relative shrink-0 transition-all duration-200 group-hover:scale-110",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600"
                    )}>
                      {item.icon}
                      {!isOpen && showBadge && (
                        <span
                          className={clsx(
                            "absolute -right-2 -top-2 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ring-2",
                            isActive ? "ring-indigo-600" : "ring-white",
                            pending === 0 ? "bg-gray-300 text-gray-800" : "bg-rose-500 text-white"
                          )}
                        >
                          {pendingLabel}
                        </span>
                      )}
                    </div>
                    
                    <span
                      className={clsx(
                        "min-w-0 truncate text-sm font-medium transition-all duration-300",
                        isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                      )}
                    >
                      {item.label}
                    </span>
                    {isOpen && showBadge && (
                      <span
                        className={clsx(
                          "ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                          pending === 0
                            ? "bg-gray-200 text-gray-700"
                            : isActive
                              ? "bg-amber-300 text-blue-950"
                              : "bg-rose-500 text-white"
                        )}
                      >
                        {pendingLabel}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className={clsx(
            "flex items-center transition-all duration-300",
            isOpen ? "justify-start gap-3" : "justify-center"
          )}>
            <div className="text-xs text-gray-500">
              {isOpen ? "Version 1.0" : "v1.0"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarRespoCommercial;
