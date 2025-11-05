"use client";

import {
  ArrowBigDownDash,
  ContainerIcon,
  DrumIcon,
  Home, 
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const navItems = [
  {id:1, icon: <Home className="w-5 h-5" />, label: "Dashboard", href: "/magasinier" },
  {id:5, icon: <ArrowBigDownDash className="w-5 h-5" />, label: "Pièces en cours", href: "/magasinier/piecesencoursenvoies" },
  {id:6, icon: <DrumIcon className="w-5 h-5" />, label: "Pièces vérifiées", href: "/magasinier/verification" },
  {id:7, icon: <DrumIcon className="w-5 h-5" />, label: "Rapport Vérification", href: "/magasinier/rapportverification" },
  {id:8, icon: <DrumIcon className="w-5 h-5" />, label: "Stockage", href: "/magasinier/stockage" },
  {id:9, icon: <DrumIcon className="w-5 h-5" />, label: "Attribution pièces", href: "/magasinier/attribues" },


  {id:2, icon: <ContainerIcon className="w-5 h-5" />, label: "Ordre Montage", href: "/magasinier/montage" },
  {id:3, icon: <ArrowBigDownDash className="w-5 h-5" />, label: "Ordre Correction", href: "/magasinier/correction" },
  {id:10, icon: <DrumIcon className="w-5 h-5" />, label: "Retour pièces", href: "/magasinier/Retourstock" },
];

const SidebarMag = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

  // Responsive check — sidebar open only on medium screens and above
  const responsiveWidth = isOpen ? "md:w-52 w-20" : "w-20";

  return (
    <aside
      className={clsx(
        "h-full border-r bg-white transition-all duration-500 ease-in-out overflow-y-auto",
        responsiveWidth
      )}
    >
      <div className="flex flex-col p-4 space-y-4 h-full bg-gradient-to-tr from-amber-700 via-orange-300 to-amber-800 shadow-xl backdrop-blur-md">
        {navItems.map((item, id) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "flex items-center text-gray-900 duration-300 ease-in-out transform px-3 py-1 rounded-lg group",
                isOpen ? "justify-start gap-3" : "justify-center",
                isActive
                  ? "bg-amber-600 text-white font-bold shadow-md"
                  : "hover:bg-amber-500 hover:text-white"
              )}
              style={{
                transitionDelay: `${id * 80}ms`,
              }}
            >
              <div className="transition-transform group-hover:scale-110">{item.icon}</div>
              <span
                className={clsx(
                  "text-sm hidden md:flex font-medium transition-opacity duration-300",
                  isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default SidebarMag;
