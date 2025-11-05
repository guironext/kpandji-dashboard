"use client";

import {
  Home,
  Users,
  BarChart3,
  Warehouse,
  Car,
  UserCheck,
  FileText,
  Eye,
  Calendar,
  Receipt,
  ClipboardList,
  Package,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

// Organized navigation items with better icons and logical grouping
const navItems = [
  {
    id: 1,
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/commercial",
    category: "main"
  },
  {
    id: 2,
    icon: <Car className="w-5 h-5" />,
    label: "Modèles Voitures",
    href: "/commercial/ajouter-modele",
    category: "operations"
  },
  {
    id: 3,
    icon: <Package className="w-5 h-5" />,
    label: "Accessoires",
    href: "/commercial/ajouter-accessoires",
    category: "operations"
  },
  {
    id: 4,
    icon: <UserCheck className="w-5 h-5" />,
    label: "Prospects",
    href: "/commercial/prospects",
    category: "operations"
  },
  {
    id: 5,
    icon: <Users className="w-5 h-5" />,
    label: "Clients",
    href: "/commercial/clients",
    category: "operations"
  },
  {
    id: 6,
    icon: <Calendar className="w-5 h-5" />,
    label: "Rendez-vous",
    href: "/commercial/rendez-vous",
    category: "operations"
  },
  {
    id: 7,
    icon: <ClipboardList className="w-5 h-5" />,
    label: "Rapport Rendez-vous",
    href: "/commercial/rapport-rendez-vous",
    category: "operations"
  },
  {
    id: 8,
    icon: <Eye className="w-5 h-5" />,
    label: "Suivi Rendez-vous",
    href: "/commercial/suivi-rendez-vous",
    category: "operations"
  },
  
  {
    id: 10,
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Tableau de Chute",
    href: "/commercial/tableau-chute",
    category: "operations"
  },
  {
    id: 11,
    icon: <TrendingUp className="w-5 h-5" />,
    label: "Suivi Commandes",
    href: "/commercial/suivi-commandes",
    category: "reports"
  },
  {
    id: 12,
    icon: <FileText className="w-5 h-5" />,
    label: "Proformas",
    href: "/commercial/proformas",
    category: "facturation"
  },
  {
    id: 13,
    icon: <Receipt className="w-5 h-5" />,
    label: "Bon de Commande",
    href: "/commercial/bon-de-commande",
    category: "facturation"
  },
  {
    id: 14,
    icon: <FileCheck className="w-5 h-5" />,
    label: "Bon pour Acquis",
    href: "/commercial/bon-pour-acquis",
    category: "facturation"
  }
];

const SidebarCommercial = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

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
    inventory: "Inventaire",
    operations: "Opérations",
    reports: "Rapports",
    facturation: "Facturation"
  };

  return (
    <aside
      className={clsx(
        "h-full border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out overflow-y-auto -mt-10",
        responsiveWidth
      )}
    >
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                <h2 className="text-lg font-bold text-gray-900">Commercial</h2>
                <p className="text-xs text-gray-500">Equipe Commercial</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              {isOpen && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              )}
              
              {items.map((item, index) => {
                const isActive = pathname === item.href;

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
                      transitionDelay: `${index * 50}ms`,
                    }}
                    aria-label={item.label}
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
                        isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                      )}
                    >
                      {item.label}
                    </span>
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

export default SidebarCommercial;
