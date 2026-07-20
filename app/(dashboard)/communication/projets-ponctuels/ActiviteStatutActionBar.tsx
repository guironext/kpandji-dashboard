"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { StatutProjetPonctuelActivite } from "@/lib/projet-ponctuel-activite-statut";

type Props = {
  statutActivite: StatutProjetPonctuelActivite;
  isUpdating?: boolean;
  compact?: boolean;
  onTransfer?: () => void;
  onTerminer?: () => void;
  className?: string;
};

export default function ActiviteStatutActionBar({
  statutActivite,
  isUpdating = false,
  compact = false,
  onTransfer,
  onTerminer,
  className,
}: Props) {
  if (statutActivite !== "VALIDEE") {
    return null;
  }

  const btnClass = compact
    ? "h-8 rounded-lg px-2.5 text-[10px] font-semibold"
    : "h-10 rounded-xl px-3 text-xs font-semibold";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/80",
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
          "flex-1 border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
        )}
        onClick={onTransfer}
        disabled={isUpdating}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Transférer l'activité"
      >
        {isUpdating ? (
          <Loader2 className={cn("animate-spin", compact ? "h-3 w-3" : "h-4 w-4")} />
        ) : (
          <>
            <ArrowRightLeft className={cn(compact ? "mr-1 h-3 w-3" : "mr-1.5 h-4 w-4")} />
            Transférer
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          btnClass,
          "flex-1 border-teal-200 bg-white text-teal-700 hover:bg-teal-50"
        )}
        onClick={onTerminer}
        disabled={isUpdating}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Terminer l'activité"
      >
        {isUpdating ? (
          <Loader2 className={cn("animate-spin", compact ? "h-3 w-3" : "h-4 w-4")} />
        ) : (
          <>
            <CheckCircle2 className={cn(compact ? "mr-1 h-3 w-3" : "mr-1.5 h-4 w-4")} />
            Terminer
          </>
        )}
      </Button>
    </div>
  );
}
