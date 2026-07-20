"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
  hasUnread?: boolean;
  size?: "sm" | "xs";
  className?: string;
};

export default function ActiviteChatButton({
  onClick,
  hasUnread = false,
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
        hasUnread
          ? "border-rose-300 bg-white text-rose-600 shadow-sm hover:bg-rose-50"
          : "border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50",
        className
      )}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MessageSquare
        className={cn(
          isXs ? "mr-1 h-3 w-3" : "mr-1.5 h-4 w-4",
          hasUnread && "text-rose-600"
        )}
      />
      Chat
      {hasUnread && (
        <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-rose-500" aria-hidden />
      )}
    </Button>
  );
}
