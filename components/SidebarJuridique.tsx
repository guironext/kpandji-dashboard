"use client";

import {
  Home,
  Users,
  Scale,
  Truck,
  ClipboardList,
  AlertTriangle,
  CarFront,
  Wrench,
  ClipboardCheck,
  FileSpreadsheet,
  Container,
  Settings,
  ListOrdered,
  FileEdit,
  Database,
  Ship,
  Building2,
  Mail,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// Organized navigation items with corrected IDs and best icons
const navItems = [
  {
    id: 1,
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/juridique",
    category: "main"
  },
  {
    id: 2,
    icon: <Database className="w-5 h-5" />,
    label: "SISTRE FACTURE",
    href: "/juridique/sistre",
    category: "main"
  },
  {
    id: 3,  
    icon: <Calendar className="w-5 h-5" />,
    label: "AGENDA",
    href: "/juridique/agenda",
    category: "main"
  },
  {
    id: 4,
    icon: <ClipboardList className="w-5 h-5" />,
    label: "commandes",
    href: "/juridique/commandes",
    category: "commandes"
  },
  {
    id: 5,
    icon: <ListOrdered className="w-5 h-5" />,
    label: "Tableau Commandes",
    href: "/juridique/tableau-commandes",
    category: "commandes"
  },
  {
    id: 6,
    icon: <Container className="w-5 h-5" />,
    label: "Conteneurs Chargés",
    href: "/juridique/listeConteneurs",
    category: "commandes"
  },
  {
    id: 7,
    icon: <Ship className="w-5 h-5" />,
    label: "Conteneurs Transit",
    href: "/juridique/conteneur-transit",
    category: "commandes"
  },
  {
    id: 8,
    icon: <Truck className="w-5 h-5" />,
    label: "Conteneur Arrivés",
    href: "/juridique/conteneur-arrives",
    category: "commandes"
  },
  
  {
    id: 10,
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Réclamation Pièces",
    href: "/juridique/reclamationpieces",
    category: "commandes"
  },
  {
    id: 11,
    icon: <Wrench className="w-5 h-5" />,
    label: "Ordre Montage",
    href: "/juridique/ordre-montage",
    category: "operations"
  },
  {
    id: 12,
    icon: <FileEdit className="w-5 h-5" />,
    label: "Ordre Correction",
    href: "/juridique/correction",
    category: "operations"
  },
  {
    id: 13,
    icon: <CarFront className="w-5 h-5" />,
    label: "Sortie Parking",
    href: "/juridique/ajouter-modele",
    category: "operations"
  },
  {
    id: 14,
    icon: <FileSpreadsheet className="w-5 h-5" />,
    label: "Rapport Montages",
    href: "/juridique/rapportmontages",
    category: "reports"
  },
  {
    id: 15,
    icon: <ClipboardCheck className="w-5 h-5" />,
    label: "Rapport Vérification",
    href: "/juridique/rapportverification",
    category: "reports"
  },
  {
    id: 16,
    icon: <Building2 className="w-5 h-5" />,
    label: "Départements",
    href: "/juridique/departements",
    category: "reports"
  },
  {
    id: 17,
    icon: <Settings className="w-5 h-5" />,
    label: "Paramètres",
    href: "/juridique/parametres",
    category: "settings"
  },
  {
    id: 18,
    icon: <Mail className="w-5 h-5" />,
    label: "Numéro Courrier",
    href: "/juridique/numero-courrier",
    category: "Communication"
  },
  {
    id: 19,
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Messages",
    href: "/juridique/messages",
    category: "Communication"
  },
];

const SidebarJuridique = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure we only use pathname after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedItems = navItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof navItems>
  );

  const categoryLabels: Record<string, string> = {
    main: "Principal",
    commandes: "Commandes",
    operations: "Opérations",
    reports: "Rapports",
    settings: "Configuration",
    Communication: "Communication",
  };

  const categoryOrder = [
    "main",
    "commandes",
    "operations",
    "reports",
    "Communication",
    "settings",
  ] as const;

  return (
    <aside
      className="h-full w-full overflow-y-auto border-r border-slate-200/80 bg-white shadow-xl transition-all duration-300 ease-in-out"
      role="navigation"
      aria-label="Navigation principale juridique"
    >
      <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-50/60">
        <div className="border-b border-slate-200/80 bg-white/90 p-4 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-3" : "justify-center"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-indigo-800 shadow-md shadow-violet-200">
              <Scale className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900">Juriste</h2>
                <p className="truncate text-xs text-slate-500">Gestion juridique</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3 sm:p-4">
          {categoryOrder.map((category) => {
            const items = groupedItems[category];
            if (!items?.length) return null;

            return (
            <div key={category} className="space-y-1">
              {isOpen && categoryLabels[category] && (
                <h3 className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {categoryLabels[category]}
                </h3>
              )}
              
              {items.map((item) => {
                const isActive =
                  mounted &&
                  (pathname === item.href ||
                    (item.href !== "/juridique" && pathname.startsWith(`${item.href}/`)));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      "group flex items-center rounded-xl px-3 py-2.5 text-slate-700 transition-all duration-200",
                      "hover:bg-white hover:text-slate-900 hover:shadow-sm",
                      isOpen ? "justify-start gap-3" : "justify-center",
                      isActive
                        ? "bg-gradient-to-r from-violet-700 to-indigo-700 text-white shadow-md shadow-violet-200/50"
                        : ""
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    title={!isOpen ? item.label : undefined}
                  >
                    <div
                      className={clsx(
                        "shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-500 group-hover:text-violet-700"
                      )}
                    >
                      {item.icon}
                    </div>

                    <span
                      className={clsx(
                        "truncate text-sm font-medium transition-all duration-300",
                        isOpen ? "opacity-100" : "sr-only"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 bg-white/90 p-4 backdrop-blur-sm">
          <div
            className={clsx(
              "flex items-center transition-all duration-300",
              isOpen ? "justify-start gap-3" : "justify-center"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 shadow-md">
              <Users className="h-4 w-4 text-white" />
            </div>
            {isOpen && (
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-600">Session juridique</p>
                <p className="text-xs text-emerald-600">Connecté</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarJuridique;
