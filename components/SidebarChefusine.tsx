"use client";

import {
  ContainerIcon,
  DrumIcon,
  Home,
  Package,
  BarChart3,
  RotateCcw,
  Warehouse,
  ClipboardCheck,
  Truck,
  Users,
  FileText
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
    href: "/chefusine",
    category: "main"
  },
  
  {
    id: 2,
    icon: <ContainerIcon className="w-5 h-5" />,
    label: "Opérations Montage",
    href: "/chefusine/montage",
    category: "operations"
  },
  {
    id: 3,
    icon: <Users className="w-5 h-5" />,
    label: "Création Equipe",
    href: "/chefusine/equipe",
    category: "operations"
  },
  {
    id: 4,
    icon: <RotateCcw className="w-5 h-5" />,
    label: "Opérations Correction",
    href: "/chefusine/correction",
    category: "operations"
  },
  {
    id: 5,
    icon: <Truck className="w-5 h-5" />,
    label: "Retour pièces",
    href: "/chefusine/Retourstock",
    category: "operations"
  },
 
  {
    id: 6,
    icon: <ClipboardCheck className="w-5 h-5" />,
    label: "Commandes en Transit",
    href: "/chefusine/piecesencoursenvoies",
    category: "inventory"
  },
  {
    id: 7,
    icon: <DrumIcon className="w-5 h-5" />,
    label: "Pièces vérifiées",
    href: "/chefusine/verification",
    category: "inventory"
  },
  {
    id: 8,
    icon: <Package className="w-5 h-5" />,
    label: "Stockage",
    href: "/chefusine/stockage",
    category: "inventory"
  },
  {
    id: 9,
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Rapport Montages",
    href: "/chefusine/rapportmontage",
    category: "reports"
  },
  {
    id: 10,
    icon: <FileText className="w-5 h-5" />,
    label: "Rapport Vérification",
    href: "/chefusine/rapportverification",
    category: "reports"
  },
  
];

const SidebarChefusine = ({ isOpen }: { isOpen: boolean }) => {
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
    reports: "Rapports"
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
                <h2 className="text-lg font-bold text-gray-900">Chef d&apos;Usine</h2>
                <p className="text-xs text-gray-500">Gestion des opérations</p>
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

export default SidebarChefusine;
