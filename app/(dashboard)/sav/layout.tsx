"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Header from "@/components/Header";
import SidebarSav from "@/components/SidebarSav";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile, pathname]);

  return (
    <div className="relative h-screen h-[100dvh] overflow-hidden bg-slate-50/50 text-slate-900 antialiased">
      <div className="fixed left-0 right-0 top-0 z-50 h-16">
        <Header toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      </div>

      {/* Mobile overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isSidebarOpen && isMobile
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen || !isMobile}
      />

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] transition-all duration-300 ease-out",
          isMobile
            ? clsx(
                "w-[min(18rem,85vw)]",
                isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
              )
            : clsx(isSidebarOpen ? "w-52" : "w-[4.5rem]")
        )}
      >
        <SidebarSav isOpen={isMobile ? true : isSidebarOpen} />
      </div>

      {/* Main content */}
      <main
        className={clsx(
          "h-screen h-[100dvh] overflow-y-auto pt-16 transition-[margin] duration-300 ease-out scrollbar-thin",
          isMobile ? "ml-0" : isSidebarOpen ? "ml-52" : "ml-[4.5rem]"
        )}
      >
        <div className="min-h-full pb-10">{children}</div>
      </main>
    </div>
  );
}

