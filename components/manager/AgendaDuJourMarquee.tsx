"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Clock, Loader2, MapPin } from "lucide-react";

type CssVars = React.CSSProperties & {
  ["--duration"]?: string;
};

type Activity = {
  id: string;
  titre: string;
  description?: string | null;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string;
  lieu?: string | null;
  owner?: string | null;
};

function localYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function AgendaDuJourMarquee({ basePath = "/manager" }: { basePath?: string }) {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/agenda?all=1", {
          cache: "no-store",
          signal: controller.signal,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "Erreur de chargement");
        }
        setActivities((json.data ?? []) as Activity[]);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Impossible de charger l'agenda");
      } finally {
        setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const today = React.useMemo(() => localYmd(new Date()), []);
  const todayActivities = React.useMemo(() => {
    return activities
      .filter((a) => a.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activities, today]);

  const shouldScroll = todayActivities.length >= 3;
  const durationSeconds = Math.min(60, Math.max(18, todayActivities.length * 6));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-indigo-50 via-white to-sky-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Agenda du jour</p>
            <p className="text-xs text-slate-600">Les activités prévues aujourd’hui</p>
          </div>
        </div>
        <Link
          href={`${basePath}/agenda`}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-800"
        >
          Voir tout →
        </Link>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            Chargement des activités…
          </div>
        ) : error ? (
          <div className="text-sm text-rose-700">
            {error}{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-semibold underline underline-offset-2"
            >
              Réessayer
            </button>
          </div>
        ) : todayActivities.length === 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <Chip className="border-indigo-200 bg-indigo-50 text-indigo-800">
              <CalendarDays className="h-3.5 w-3.5" />
              Aucun rendez-vous aujourd’hui
            </Chip>
            <span className="text-xs text-slate-500">
              Vous pouvez en ajouter depuis l’agenda.
            </span>
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/90 to-transparent" />

            <div
              className={[
                "group overflow-hidden",
                shouldScroll ? "" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "flex w-max items-stretch gap-3",
                  shouldScroll ? "animate-[agenda-marquee_var(--duration)_linear_infinite] group-hover:[animation-play-state:paused]" : "",
                ].join(" ")}
                style={
                  shouldScroll
                    ? ({ ["--duration"]: `${durationSeconds}s` } as CssVars)
                    : undefined
                }
              >
                {[...todayActivities, ...(shouldScroll ? todayActivities : [])].map((a, idx) => (
                  <Link
                    key={`${a.id}-${idx}`}
                    href={`${basePath}/agenda/${a.id}`}
                    className="flex min-w-[280px] max-w-[360px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-md"
                    title="Ouvrir le rapport"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {a.titre}
                        </p>
                        {a.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {a.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: a.color || "#6366F1" }}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Chip>
                        <Clock className="h-3.5 w-3.5 text-slate-600" />
                        {a.startTime}–{a.endTime}
                      </Chip>
                      {a.lieu ? (
                        <Chip className="max-w-full">
                          <MapPin className="h-3.5 w-3.5 text-slate-600" />
                          <span className="truncate">{a.lieu}</span>
                        </Chip>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <style jsx global>{`
              @keyframes agenda-marquee {
                from {
                  transform: translateX(0);
                }
                to {
                  transform: translateX(-50%);
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

