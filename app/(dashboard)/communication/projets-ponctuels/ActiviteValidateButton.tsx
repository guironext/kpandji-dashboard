"use client";

import { BadgeCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
  isUpdating?: boolean;
  size?: "sm" | "xs";
  className?: string;
};

export default function ActiviteValidateButton({
  onClick,
  isUpdating = false,
  size = "sm",
  className,
}: Props) {
  const isXs = size === "xs";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        isXs
          ? "h-7 rounded-lg px-2 text-[10px] font-semibold"
          : "h-10 rounded-xl",
        "border-amber-300 bg-white text-amber-800 shadow-sm hover:bg-amber-50",
        className
      )}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={isUpdating}
      aria-label="Valider l'activité"
    >
      {isUpdating ? (
        <Loader2 className={cn("animate-spin", isXs ? "h-3 w-3" : "h-4 w-4")} />
      ) : (
        <>
          <BadgeCheck className={cn(isXs ? "mr-1 h-3 w-3" : "mr-1.5 h-4 w-4")} />
          Valider
        </>
      )}
    </Button>
  );
}
