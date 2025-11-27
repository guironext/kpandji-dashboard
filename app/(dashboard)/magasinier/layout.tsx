"use client";


import { useState } from "react";
import clsx from "clsx";
import Header from "@/components/Header";
import SidebarMagasinier from "@/components/SidebarMagasinier";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        <Header toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      </div>

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed top-24 left-0 h-[calc(100vh-4rem)] z-40 transition-all duration-500 ease-in-out",
          isSidebarOpen ? "w-52" : "w-20"
        )}
      >
        <SidebarMagasinier isOpen={isSidebarOpen} />
      </div>

      {/* Mobile overlay */}
      <div
        className={clsx(
          "lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <main
        className={clsx(
          "pt-16 h-screen overflow-y-auto transition-all duration-500 ease-in-out",
          isSidebarOpen ? "ml-52" : "ml-20"
        )}
      >
        <div className={clsx(isSidebarOpen ? "ml-13" : "ml-1")}>{children}</div>
      </main>
    </div>
  );
}
