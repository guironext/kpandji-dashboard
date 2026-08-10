"use client";

import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
  size?: "sm" | "xs";
  className?: string;
};

export default function ActiviteLoadDocumentButton({
  onClick,
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
        "border-sky-300 bg-white text-sky-800 shadow-sm hover:bg-sky-50",
        className
      )}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      aria-label="Charger un document"
    >
      <FileUp className={cn(isXs ? "mr-1 h-3 w-3" : "mr-1.5 h-4 w-4")} />
      Document
    </Button>
  );
}
