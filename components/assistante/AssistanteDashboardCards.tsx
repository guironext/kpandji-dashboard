import Link from "next/link";
import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type IconType = React.ComponentType<{ className?: string }>;

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function LinkCard({
  href,
  title,
  description,
  icon: Icon,
  badge,
  onClick,
  className,
  iconClassName,
}: {
  href: string;
  title: string;
  description?: string;
  icon: IconType;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/25",
        className
      )}
    >
      <Card className="h-full border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/5 ring-1 ring-inset ring-slate-900/10",
                iconClassName
              )}
            >
              <Icon className="h-5 w-5 text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                <div className="flex items-center gap-2">
                  {badge}
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
              {description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

