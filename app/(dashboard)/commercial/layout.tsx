"use client";

import { useLayoutEffect, useState } from "react";
import clsx from "clsx";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import SidebarCommercial from "@/components/SidebarCommercial";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsSidebarOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className={`${inter.variable} h-screen overflow-hidden relative`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-16">
        <Header toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      </div>

      {/* Sidebar — drawer below lg breakpoint, fixed rail on lg+ */}
      <div
        className={clsx(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out",
          "z-50 lg:z-40",
          isSidebarOpen ? "lg:w-64" : "lg:w-20",
          "w-[min(16rem,calc(100vw-1rem))] sm:w-64",
          "lg:translate-x-0",
          isSidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full max-lg:pointer-events-none"
        )}
      >
        <SidebarCommercial isOpen={isSidebarOpen} />
      </div>

      {/* Mobile overlay — behind sidebar so drawer stays interactive */}
      <button
        type="button"
        aria-label="Fermer le menu"
        className={clsx(
          "lg:hidden fixed inset-0 z-40 bg-white/65 backdrop-blur-sm transition-opacity",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Main content — full width on mobile, offset only on lg+ */}
      <main
        className={clsx(
          "pt-16 h-screen overflow-y-auto overflow-x-hidden transition-[margin] duration-300 ease-in-out",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20",
        )}
      >
        <div className="w-full min-w-0 max-lg:px-1">{children}</div>
      </main>
    </div>
  );
}
