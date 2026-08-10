"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type AccentTheme = {
  hero: string;
  badge: string;
  button: string;
  shadow: string;
  ring: string;
  chipActive: string;
  chipInactive: string;
  loader: string;
  statIcon: string;
  sidebarHeader: string;
};

export const EMBEDDED_ACCENT: AccentTheme = {
  hero: "from-rose-500 via-pink-500 to-fuchsia-600",
  badge: "bg-rose-100 text-rose-800 border-rose-200",
  button: "from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700",
  shadow: "shadow-rose-500/25",
  ring: "focus:ring-rose-500/20",
  chipActive:
    "border-rose-400 bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30",
  chipInactive:
    "border-slate-200 bg-white text-slate-800 hover:border-rose-200 hover:bg-rose-50/50",
  loader: "text-rose-500",
  statIcon: "bg-rose-100 text-rose-600",
  sidebarHeader: "from-rose-500 via-pink-500 to-fuchsia-600",
};

export const STANDALONE_ACCENT: AccentTheme = {
  hero: "from-blue-600 via-blue-600 to-indigo-700",
  badge: "bg-blue-100 text-blue-800 border-blue-200",
  button: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
  shadow: "shadow-blue-500/25",
  ring: "focus:ring-blue-500/20",
  chipActive:
    "border-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30",
  chipInactive:
    "border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50/50",
  loader: "text-blue-600",
  statIcon: "bg-blue-100 text-blue-600",
  sidebarHeader: "from-blue-600 to-indigo-700",
};

export function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {value}
      </p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailSection({
  title,
  icon: Icon,
  borderClass,
  iconClass,
  fields,
  defaultOpen = false,
}: {
  title: string;
  icon: LucideIcon;
  borderClass: string;
  iconClass: string;
  fields: { label: string; value: string | null | undefined }[];
  defaultOpen?: boolean;
}) {
  const visibleFields = fields.filter((f) => f.value?.trim());
  if (visibleFields.length === 0) return null;

  return (
    <Collapsible defaultOpen={defaultOpen} className="group">
      <div className={cn("relative rounded-2xl border-l-4 bg-white/60 pl-1", borderClass)}>
        <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-white/80 sm:px-5 sm:py-4">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
              iconClass
            )}
          >
            <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <span className="flex-1 text-base font-bold text-slate-900 sm:text-lg">
            {title}
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
            {visibleFields.map((field) => (
              <DetailField
                key={field.label}
                label={field.label}
                value={field.value!}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
