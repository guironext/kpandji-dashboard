"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import SidebarInfographie from "@/components/SidebarInfographie";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const apply = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };

    apply();
    setHasHydrated(true);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isDesktop]);

  useEffect(() => {
    if (!hasHydrated || isDesktop || !isSidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hasHydrated, isDesktop, isSidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const sidebarExpanded = isDesktop ? isSidebarOpen : true;

  return (
    <div
      className={`${inter.variable} relative h-[100dvh] overflow-hidden`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <div className="fixed inset-x-0 top-0 z-50 h-16">
        <Header toggleSidebar={toggleSidebar} />
      </div>

      <button
        type="button"
        aria-label="Fermer le menu"
        aria-hidden={!isSidebarOpen || isDesktop}
        tabIndex={isSidebarOpen && !isDesktop ? 0 : -1}
        className={clsx(
          "fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />

      <div
        className={clsx(
          "fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] transition-[width,transform] duration-300 ease-in-out",
          "border-r border-violet-200/80 shadow-xl lg:shadow-none",
          hasHydrated
            ? isSidebarOpen
              ? "w-[min(16rem,88vw)] translate-x-0"
              : "-translate-x-full lg:w-24 lg:translate-x-0"
            : "-translate-x-full lg:w-64 lg:translate-x-0"
        )}
        role="dialog"
        aria-modal={!isDesktop && isSidebarOpen}
        aria-label="Menu Infographie"
        aria-hidden={!isDesktop && !isSidebarOpen}
      >
        <SidebarInfographie
          isOpen={sidebarExpanded}
          onNavigate={!isDesktop ? closeSidebar : undefined}
        />
      </div>

      <main
        className={clsx(
          "h-[100dvh] overflow-y-auto overscroll-y-contain pt-16 transition-[margin] duration-300 ease-in-out",
          hasHydrated && (isSidebarOpen ? "lg:ml-64" : "lg:ml-24"),
          "ml-0"
        )}
      >
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
