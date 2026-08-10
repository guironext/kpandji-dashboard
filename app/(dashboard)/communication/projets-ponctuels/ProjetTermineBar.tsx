"use client";

import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  compact?: boolean;
  className?: string;
};

export default function ProjetTermineBar({ compact = false, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 border-t border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        className
      )}
      role="status"
      aria-label="Projet terminé"
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white font-semibold text-emerald-700 shadow-sm",
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        )}
      >
        <Flag
          className={cn("shrink-0 text-emerald-600", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
          aria-hidden
        />
        Terminé
      </span>
    </div>
  );
}
