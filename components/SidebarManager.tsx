"use client";

import {
  Home,
  Users,
  Warehouse,
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
  CheckSquare,
  Building2
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
    href: "/manager",
    category: "main"
  },
  {
    id: 2,
    icon: <Database className="w-5 h-5" />,
    label: "SISTRE FACTURE",
    href: "/manager/sistre",
    category: "main"
  },
  {
    id: 3,
    icon: <ClipboardList className="w-5 h-5" />,
    label: "commandes",
    href: "/manager/commandes",
    category: "commandes"
  },
  {
    id: 4,
    icon: <ListOrdered className="w-5 h-5" />,
    label: "Tableau Commandes",
    href: "/manager/tableau-commandes",
    category: "commandes"
  },
  {
    id: 5,
    icon: <Container className="w-5 h-5" />,
    label: "Conteneurs Chargés",
    href: "/manager/listeConteneurs",
    category: "commandes"
  },
  {
    id: 6,
    icon: <Ship className="w-5 h-5" />,
    label: "Conteneurs Transit",
    href: "/manager/conteneur-transit",
    category: "commandes"
  },
  {
    id: 7,
    icon: <Truck className="w-5 h-5" />,
    label: "Conteneur Arrivés",
    href: "/manager/conteneur-arrives",
    category: "commandes"
  },
  {
    id: 8,
    icon: <CheckSquare className="w-5 h-5" />,
    label: "Dépotage & Vérification",
    href: "/manager/depotage",
    category: "commandes"
  },
  {
    id: 9,
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Réclamation Pièces",
    href: "/manager/reclamationpieces",
    category: "commandes"
  },
  {
    id: 10,
    icon: <Wrench className="w-5 h-5" />,
    label: "Ordre Montage",
    href: "/manager/montage",
    category: "operations"
  },
  {
    id: 11,
    icon: <FileEdit className="w-5 h-5" />,
    label: "Ordre Correction",
    href: "/manager/correction",
    category: "operations"
  },
  {
    id: 12,
    icon: <CarFront className="w-5 h-5" />,
    label: "Sortie Parking",
    href: "/manager/ajouter-modele",
    category: "operations"
  },
  {
    id: 13,
    icon: <FileSpreadsheet className="w-5 h-5" />,
    label: "Rapport Montages",
    href: "/manager/rapportmontages",
    category: "reports"
  },
  {
    id: 14,
    icon: <ClipboardCheck className="w-5 h-5" />,
    label: "Rapport Vérification",
    href: "/manager/rapportverification",
    category: "reports"
  },
  {
    id: 15,
    icon: <Building2 className="w-5 h-5" />,
    label: "Départements",
    href: "/manager/departements",
    category: "reports"
  },
  {
    id: 16,
    icon: <Settings className="w-5 h-5" />,
    label: "Paramètres",
    href: "/manager/parametres",
    category: "settings"
  }
];

const SidebarManager = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure we only use pathname after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Responsive width calculation
  const responsiveWidth = isOpen ? "md:w-64 w-20" : "w-20";

  // Group items by category for better organization
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const categoryLabels = {
    main: "Principal",
    commandes: "Commandes",
    management: "Gestion",
    inventory: "Inventaire",
    operations: "Opérations",
    reports: "Rapports",
    settings: "Configuration"
  };

  return (
    <aside
      className={clsx(
        "h-full border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out overflow-y-auto -mt-10",
        responsiveWidth
      )}
      role="navigation"
      aria-label="Navigation principale du manager"
    >
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className={clsx(
            "flex items-center transition-all duration-300",
            isOpen ? "justify-start gap-3" : "justify-center"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="hidden md:block">
                <h2 className="text-lg font-bold text-gray-900">Manager</h2>
                <p className="text-xs text-gray-500">Gestion des opérations</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-6" role="navigation">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              {isOpen && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              )}
              
              {items.map((item, index) => {
                // Only check active state after mount to prevent hydration mismatch
                const isActive = mounted && pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      "group flex items-center text-gray-700 duration-200 ease-in-out transform px-3 py-2.5 rounded-xl",
                      "hover:bg-white hover:shadow-sm hover:scale-[1.02] transition-all",
                      isOpen ? "justify-start gap-3" : "justify-center",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]"
                        : "hover:text-gray-900"
                    )}
                    style={{
                      transitionDelay: `${Math.min(index * 20, 200)}ms`,
                    }}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={clsx(
                      "transition-all duration-200 group-hover:scale-110",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600"
                    )}>
                      {item.icon}
                    </div>
                    
                    <span
                      className={clsx(
                        "text-sm font-medium transition-all duration-300 whitespace-nowrap",
                        isOpen 
                          ? "opacity-100" 
                          : "opacity-0 w-0 overflow-hidden"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className={clsx(
            "flex items-center transition-all duration-300",
            isOpen ? "justify-start gap-3" : "justify-center"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-4 h-4 text-white" />
            </div>
            {isOpen && (
              <div className="hidden md:block">
                <p className="text-xs text-gray-500">Session Manager</p>
                <p className="text-xs text-gray-400">Connecté</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarManager;
