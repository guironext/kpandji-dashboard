"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Mail,
  Send,
  Contact,
  UserSearch,
  Briefcase,
  Warehouse,
  FileTextIcon,
  MessageSquare,
  BookOpen,
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
      { id: 1, icon: <LayoutDashboard className={iconClass} />, label: "Dashboard", href: "/assistante" },
      { id: 13, icon: <LayoutDashboard className={iconClass} />, label: "Pointage", href: "/assistante/pointage" },
      { id: 2, icon: <CalendarDays className={iconClass} />, label: "Agenda", href: "/assistante/agenda" },
  
      { id: 5, icon: <FileTextIcon className={iconClass} />, label: "Rapports", href: "/assistante/rapports-activites" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    color: "#0ea5e9",
    bg: "#0ea5e91a", // sky-500 @ 10% opacity
    items: [
      { id: 6, icon: <Mail className={iconClass} />, label: "Courriers", href: "/assistante/numero-courrier" },
      { id: 7, icon: <Send className={iconClass} />, label: "Messages", href: "/assistante/messages" },
      { id: 8, icon: <MessageSquare className={iconClass} />, label: "Suivi Messages", href: "/assistante/suivi-messages" },
      { id: 9, icon: <BookOpen className={iconClass} />, label: "Documentation", href: "/assistante/documentation" },
    ],

  },
  {
    id: "repertoires",
    label: "Repertoires",
    color: "#22c55e",
    bg: "#22c55e1a", // green-500 @ 10% opacity
    items: [
      { id: 10, icon: <Contact className={iconClass} />, label: "Repertoire Clients", href: "/assistante/repertoire-clients" },
      { id: 11, icon: <UserSearch className={iconClass} />, label: "Repertoire Prospects", href: "/assistante/repertoire-prospects" },
      { id: 12, icon: <Briefcase className={iconClass} />, label: "Partenaires", href: "/assistante/repertoire-partenaires" },
      { id: 14, icon: <Briefcase className={iconClass} />, label: "Ajouter Employés", href: "/assistante/employes" },

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
                <h2 className="text-lg font-bold text-gray-900">Assistante Direction</h2>
                <p className="text-xs text-gray-500">Equipe Direction</p>
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
