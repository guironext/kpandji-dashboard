"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  titre: string;
  description: string;
  className?: string;
  lineClamp?: 1 | 2 | 3 | "none";
};

export default function ClickableActiviteDescription({
  titre,
  description,
  className,
  lineClamp = 3,
}: Props) {
  const [open, setOpen] = useState(false);
  const trimmed = description.trim();

  if (!trimmed) {
    return (
      <p className={cn("text-sm italic text-slate-400", className)}>Aucune description</p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "block w-full cursor-pointer text-left leading-relaxed text-slate-600 transition-colors hover:text-sky-700",
          lineClamp === 1 && "line-clamp-1",
          lineClamp === 2 && "line-clamp-2",
          lineClamp === 3 && "line-clamp-3",
          className
        )}
        aria-label={`Voir la description complète de ${titre}`}
      >
        {description}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden rounded-2xl border-slate-200/80 p-0 shadow-xl">
          <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 via-white to-teal-50/50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 text-white shadow-md">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-slate-900">{titre}</DialogTitle>
                <DialogDescription className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description de l&apos;activité
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
