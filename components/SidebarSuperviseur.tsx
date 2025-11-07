"use client";

import {
  Home,
  Users,
  Warehouse,
  CheckCircle,
  FileSpreadsheet,
  CalendarDays,
  TrendingDown,
  PackageCheck,
  ClipboardCheck,
  Receipt,
  Store,
  ShoppingCart,
  Truck
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

// Organized navigation items with corrected IDs and best icons
const navItems = [
  {
    id: 1,
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/superviseur",
    category: "main"
  },
  {
    id: 2,
    icon: <CalendarDays className="w-5 h-5" />,
    label: "Suivi Rendez-vous",
    href: "/superviseur/suivi-rendez-vous",
    category: "operations"
  },
  {
    id: 7,
    icon: <CalendarDays className="w-5 h-5" />,
    label: "Rapport Rendez-vous",
    href: "/superviseur/rapportrendezvous",
    category: "operations"
  },
  {
    id: 3,
    icon: <TrendingDown className="w-5 h-5" />,
    label: "Tableau Chute",
    href: "/superviseur/tableau-chute",
    category: "operations"
  },
  {
    id: 4,
    icon: <ClipboardCheck className="w-5 h-5" />,
    label: "Suivi Bon Commande",
    href: "/superviseur/suivi-bon-commande",
    category: "operations"
  },

  {
    id: 5,
    icon: <Receipt className="w-5 h-5" />,
    label: "Suivi Bon Pour Acquis",
    href: "/superviseur/suivi-bon-pour-acquis",
    category: "operations"
  },

  {
    id: 8,
    icon: <CheckCircle className="w-5 h-5" />,
    label: "Suivi Commandes",
    href: "/superviseur/suivi-commandes",
    category: "commandes"
  },
  {
    id: 9,
    icon: <Store className="w-5 h-5" />,
    label: "Stock disponible",
    href: "/superviseur/stock-disponible",
    category: "commandes"
  },
  {
    id: 10,
    icon: <Truck className="w-5 h-5" />,
    label: "Bon Commande Locaux",
    href: "/superviseur/bon-commande-locaux",
    category: "commandes"
  },
  {
    id: 11,
    icon: <ShoppingCart className="w-5 h-5" />,
    label: "Commandes Locaux",
    href: "/superviseur/commandes-locaux",
    category: "commandes"
  },
 
];

const SidebarComptable = ({ isOpen }: { isOpen: boolean }) => {
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
                <h2 className="text-lg font-bold text-gray-900">Superviseur</h2>
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

export default SidebarComptable;
