"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Header from "@/components/Header";
import SidebarJuridique from "@/components/SidebarJuridique";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const syncSidebar = () => {
      if (mq.matches) setIsSidebarOpen(false);
    };
    syncSidebar();
    mq.addEventListener("change", syncSidebar);
    return () => mq.removeEventListener("change", syncSidebar);
  }, []);

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        <Header toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      </div>

      <div
        className={clsx(
          "fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <div
        className={clsx(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarJuridique isOpen={isSidebarOpen} />
      </div>

      <main
        className={clsx(
          "h-screen overflow-y-auto pt-16 transition-[margin] duration-300 ease-in-out",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {children}
      </main>
    </div>
  );
}
