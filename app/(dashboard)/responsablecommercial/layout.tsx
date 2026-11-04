"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Header from "@/components/Header";
import SidebarRespoCommercial from "@/components/SidebarRespoCommercial";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  useEffect(() => () => clearCloseTimer(), []);

  const handlePointerEnter = () => {
    clearCloseTimer();
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setIsHovered(false), 160);
  };

  const isExpanded = isPinned || isHovered;

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        <Header toggleSidebar={() => setIsPinned((prev) => !prev)} />
      </div>

      {/* Sidebar: rail by default, expands over the page while the pointer is on it */}
      <div
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onFocus={handlePointerEnter}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            handlePointerLeave();
          }
        }}
        className={clsx(
          "fixed top-24 left-0 h-[calc(100vh-4rem)] z-40 transition-[width] duration-300 ease-in-out",
          isExpanded ? "w-[17rem]" : "w-20"
        )}
      >
        <SidebarRespoCommercial isOpen={isExpanded} />
      </div>

      {/* Mobile overlay */}
      <div
        className={clsx(
          "lg:hidden fixed inset-0 z-30 bg-white/65 backdrop-blur-sm transition-opacity",
          isPinned ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsPinned(false)}
      />

      {/* Main content stays on the collapsed rail so a hover does not shift the page */}
      <main
        className={clsx(
          "pt-16 h-screen overflow-y-auto transition-all duration-300 ease-in-out",
          isPinned ? "ml-[17rem]" : "ml-20"
        )}
      >
        <div className={clsx("h-full", isPinned ? "ml-13" : "ml-1")}>{children}</div>
      </main>
    </div>
  );
}
