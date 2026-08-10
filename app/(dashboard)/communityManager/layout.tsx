"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import SidebarCommunityManager from "@/components/SidebarCommunityManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname, isDesktop]);

  useEffect(() => {
    if (isDesktop || !isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, isMobileMenuOpen]);

  const toggleSidebar = useCallback(() => {
    if (isDesktop) return;
    setIsMobileMenuOpen((prev) => !prev);
  }, [isDesktop]);

  const closeSidebar = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const sidebarVisible = isDesktop || isMobileMenuOpen;

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
        aria-hidden={!isMobileMenuOpen || isDesktop}
        tabIndex={isMobileMenuOpen && !isDesktop ? 0 : -1}
        className={clsx(
          "fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />

      <div
        className={clsx(
          "fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] w-64 transition-transform duration-300 ease-in-out",
          "border-r border-rose-200/80 shadow-xl lg:translate-x-0 lg:shadow-none",
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal={!isDesktop && isMobileMenuOpen}
        aria-label="Menu Community Manager"
        aria-hidden={!isDesktop && !isMobileMenuOpen}
      >
        <SidebarCommunityManager isOpen />
      </div>

      <main className="h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-y-contain pt-16 transition-[margin] duration-300 ease-in-out lg:ml-64">
        <div className="w-full min-w-0">{children}</div>
      </main>
    </div>
  );
}
