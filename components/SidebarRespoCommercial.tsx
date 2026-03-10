"use client";

import {
  Home,
  Users,
  BarChart3,
  Warehouse,
  Car,
  UserCheck,
  FileText,
  Calendar,
  Receipt,
  ClipboardList,
  Package,
  TrendingUp,
  FileCheck,
  Pen,
  Target,
  CalendarRange,
  KeyRound,
  Activity,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

// Category-first navigation structure with logical grouping
const iconClass = "w-5 h-5";

const navCategories = [
  {
    id: "main",
    label: "Principal",
    color: "#6366f1",
    bg: "#6366f11a", // indigo-500 @ 10% opacity
    items: [
      { id: 1, icon: <Home className={iconClass} />, label: "Dashboard", href: "/responsablecommercial" },
      { id: 2, icon: <Target className={iconClass} />, label: "Objectifs", href: "/responsablecommercial/objectifs" },
      { id: 3, icon: <CalendarRange className={iconClass} />, label: "Calendrier Sortie", href: "/responsablecommercial/calendrier-sortie" },
      { id: 4, icon: <KeyRound className={iconClass} />, label: "Reservation Véhicule", href: "/responsablecommercial/reservation-vehicule" },
      { id: 5, icon: <Activity className={iconClass} />, label: "Performences", href: "/responsablecommercial/performences" },
    ],
  },
  {
    id: "inventory",
    label: "Inventaire",
    color: "#0ea5e9",
    bg: "#0ea5e91a", // sky-500 @ 10% opacity
    items: [
      { id: 6, icon: <Car className={iconClass} />, label: "Modèles Voitures", href: "/responsablecommercial/ajouter-modele" },
      { id: 7, icon: <Package className={iconClass} />, label: "Accessoires", href: "/responsablecommercial/ajouter-accessoires" },
      { id: 8, icon: <Warehouse className={iconClass} />, label: "Goodies-Brochures", href: "/responsablecommercial/goodies-brochures" },
    ],
  },
  {
    id: "crm",
    label: "Commercial",
    color: "#22c55e",
    bg: "#22c55e1a", // green-500 @ 10% opacity
    items: [
      { id: 9, icon: <UserCheck className={iconClass} />, label: "Prospects", href: "/responsablecommercial/prospects" },
      { id: 10, icon: <Users className={iconClass} />, label: "Clients", href: "/responsablecommercial/clients" },
    ],
  },
  {
    id: "appointments",
    label: "Rendez-vous",
    color: "#f59e0b",
    bg: "#f59e0b1a", // amber-500 @ 10% opacity
    items: [
      { id: 11, icon: <Calendar className={iconClass} />, label: "Coût Rendez-vous", href: "/responsablecommercial/cout-rendez-vous" },
      { id: 12, icon: <ClipboardList className={iconClass} />, label: "Rapport Rendez-vous", href: "/responsablecommercial/rapport-rendez-vous" },
      
    ],
  },
  {
    id: "reports",
    label: "Rapports",
    color: "#8b5cf6",
    bg: "#8b5cf61a", // violet-500 @ 10% opacity
    items: [
      { id: 14, icon: <BarChart3 className={iconClass} />, label: "Tableau de Chute", href: "/responsablecommercial/tableau-chute" },
      { id: 15, icon: <TrendingUp className={iconClass} />, label: "Suivi Commandes", href: "/responsablecommercial/suivi-commandes" },
    ],
  },
  {
    id: "facturation",
    label: "Facturation",
    color: "#ec4899",
    bg: "#ec48991a", // pink-500 @ 10% opacity
    items: [
      { id: 16, icon: <FileText className={iconClass} />, label: "Proformas", href: "/responsablecommercial/proformas" },
      { id: 18, icon: <Receipt className={iconClass} />, label: "Bon de Commande", href: "/responsablecommercial/bon-de-commande" },
      { id: 19, icon: <FileCheck className={iconClass} />, label: "Bon pour Accord", href: "/responsablecommercial/bon-pour-accord" },
      { id: 20, icon: <Pen className={iconClass} />, label: "Signature", href: "/responsablecommercial/signature" },
    ],
  },
];

const SidebarRespoCommercial = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  // Responsive width calculation
  const responsiveWidth = isOpen ? "md:w-64 w-20" : "w-20";

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
                <h2 className="text-lg font-bold text-gray-900">Responsable Commercial</h2>
                <p className="text-xs text-gray-500">Equipe Commercial</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-6">
          {navCategories.map((category) => (
            <div
              key={category.id}
              className="space-y-2 rounded-xl p-3 -mx-1"
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

                return (
                  <Link
                    key={item.href}
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

export default SidebarRespoCommercial;
