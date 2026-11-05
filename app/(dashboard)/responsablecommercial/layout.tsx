"use client";

import { useLayoutEffect, useState } from "react";
import clsx from "clsx";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import SidebarRespoCommercial from "@/components/SidebarRespoCommercial";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      const phone = mq.matches;
      setIsPhone(phone);
      if (phone) setHovered(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const expanded = isPhone ? pinned : pinned || hovered;
  const pushesContent = pinned && !isPhone;

  const closeOnPhone = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) setPinned(false);
  };

  return (
    <div
      className={`${inter.variable} h-screen overflow-hidden relative`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <div className="fixed top-0 left-0 right-0 z-[60] h-16">
        <Header toggleSidebar={() => setPinned((prev) => !prev)} />
      </div>

      <div
        onMouseEnter={() => {
          if (window.matchMedia("(min-width: 1024px)").matches) setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        className={clsx(
          "fixed top-16 bottom-0 left-0 transition-all duration-300 ease-in-out",
          expanded ? "z-50" : "z-40",
          "max-lg:overflow-hidden max-lg:rounded-r-3xl max-lg:shadow-[12px_0_40px_rgba(17,17,17,0.18)]",
          expanded && !pushesContent && "lg:shadow-[12px_0_32px_rgba(17,17,17,0.14)]",
          expanded ? "lg:w-72" : "lg:w-20",
          "w-[min(19.5rem,calc(100vw-2.75rem))]",
          "lg:translate-x-0",
          expanded ? "max-lg:translate-x-0" : "max-lg:-translate-x-full max-lg:pointer-events-none"
        )}
      >
        <SidebarRespoCommercial isOpen={expanded} onNavigate={closeOnPhone} />
      </div>

      <button
        type="button"
        aria-label="Fermer le menu"
        className={clsx(
          "lg:hidden fixed inset-0 z-40 bg-[#111]/40 backdrop-blur-[2px] transition-opacity",
          pinned ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setPinned(false)}
      />

      <main
        className={clsx(
          "pt-16 h-screen overflow-y-auto overflow-x-hidden transition-[margin] duration-300 ease-in-out",
          pushesContent ? "lg:ml-72" : "lg:ml-20",
        )}
      >
        <div className="w-full min-w-0 max-lg:px-1">{children}</div>
      </main>
    </div>
  );
}
