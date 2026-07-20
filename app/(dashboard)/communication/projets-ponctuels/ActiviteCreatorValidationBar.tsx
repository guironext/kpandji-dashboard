"use client";

import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
  compact?: boolean;
  className?: string;
};

export default function ActiviteCreatorValidationBar({
  onClick,
  compact = false,
  className,
}: Props) {
  const btnClass = compact
    ? "h-8 rounded-lg px-2.5 text-[10px] font-semibold"
    : "h-10 rounded-xl px-3 text-xs font-semibold";

  return (
    <div
      className={cn(
        "flex items-center justify-center border-t border-slate-100 bg-slate-50/80",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          btnClass,
          "w-full border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
        )}
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Voir les documents"
      >
        <Eye className={cn(compact ? "mr-1 h-3 w-3" : "mr-1.5 h-4 w-4")} />
        Voir document
      </Button>
    </div>
  );
}
