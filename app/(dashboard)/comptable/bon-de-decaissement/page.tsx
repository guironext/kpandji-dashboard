"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  endOfWeek,
  format,
  getISOWeek,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  CalendarDays,
  HandCoins,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBonsDeDecaissement,
  type DecaissementItem,
} from "@/lib/actions/decaissement";

function parseMontant(value: string | null | undefined): number {
  if (!value?.trim()) return 0;
  const cleaned = value.replace(/f\s*cfa|fcfa|xaf|cfa|francs?/gi, "").trim();
  const compact = cleaned.replace(/\s/g, "");
  let normalized = compact;
  if (/^\d{1,3}(\.\d{3})+$/.test(compact)) {
    normalized = compact.replace(/\./g, "");
  } else if (compact.includes(",") && compact.includes(".")) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = compact.replace(",", ".");
  }
  const numeric = normalized.replace(/[^\d.-]/g, "");
  const amount = Number(numeric);
  return Number.isFinite(amount) ? amount : 0;
}

function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount))} F CFA`;
}

function montantEffectif(item: DecaissementItem) {
  return parseMontant(item.montantDecaisse || item.montant);
}

type WeekGroup = {
  key: string;
  start: Date;
  end: Date;
  items: DecaissementItem[];
  total: number;
};

function groupByWeek(items: DecaissementItem[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>();

  for (const item of items) {
    const date = new Date(item.updatedAt);
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const key = format(start, "yyyy-MM-dd");
    const amount = montantEffectif(item);
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      existing.total += amount;
    } else {
      groups.set(key, {
        key,
        start,
        end,
        items: [item],
        total: amount,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    }))
    .sort((a, b) => b.start.getTime() - a.start.getTime());
}

function weekTitle(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const from = format(start, sameYear ? "d MMMM" : "d MMMM yyyy", {
    locale: fr,
  });
  const to = format(end, "d MMMM yyyy", { locale: fr });
  return `Semaine ${getISOWeek(start)} · ${from} – ${to}`;
}

export default function BonDeDecaissementPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DecaissementItem[]>([]);

  const load = useCallback(async () => {
    const result = await getBonsDeDecaissement();
    if (result.success) {
      setItems(result.data);
    } else {
      toast.error(result.error || "Erreur lors du chargement des décaissements");
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const weeks = useMemo(() => groupByWeek(items), [items]);
  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + montantEffectif(item), 0),
    [items]
  );

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_42%,_#f1f5f9_100%)]">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-5 shadow-lg shadow-emerald-900/10 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start gap-3 sm:gap-4">
            <div className="shrink-0 rounded-2xl border border-white/30 bg-white/15 p-2.5 backdrop-blur-md sm:p-3">
              <HandCoins className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-4xl">
                Bons de décaissement
              </h1>
              <p className="mt-1.5 text-sm text-emerald-50/95 sm:text-base">
                Décaissements effectués, regroupés par semaine
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 lg:grid-cols-3">
          {[
            {
              label: "Décaissements",
              value: loading ? "—" : String(items.length),
            },
            {
              label: "Semaines",
              value: loading ? "—" : String(weeks.length),
            },
            {
              label: "Total général",
              value: loading ? "—" : formatFcfa(grandTotal),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm sm:px-4 sm:py-4"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-5 space-y-5 sm:mt-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des décaissements
            </div>
          ) : weeks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
              <Wallet className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-base font-medium text-slate-700">
                Aucun décaissement effectué
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Les bons apparaîtront ici dès qu&apos;un décaissement sera validé.
              </p>
            </div>
          ) : (
            weeks.map((week) => (
              <article
                key={week.key}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <header className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
                      <CalendarDays className="h-4 w-4 shrink-0 text-emerald-700" />
                      <span className="truncate">{weekTitle(week.start, week.end)}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {week.items.length} décaissement
                      {week.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-white shadow-sm">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-100">
                      Total de la semaine
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
                      {formatFcfa(week.total)}
                    </p>
                  </div>
                </header>

                <div className="hidden md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Demandeur</th>
                        <th className="px-5 py-3 font-medium">Département</th>
                        <th className="px-5 py-3 font-medium">Raison</th>
                        <th className="px-5 py-3 text-right font-medium">
                          Montant décaissé
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                            {format(new Date(item.updatedAt), "d MMM yyyy", {
                              locale: fr,
                            })}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {item.demandeur}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {item.departement}
                            {item.service ? ` · ${item.service}` : ""}
                          </td>
                          <td className="max-w-xs px-5 py-3.5 text-slate-600">
                            {item.raison}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-emerald-800">
                            {formatFcfa(montantEffectif(item))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-slate-100 md:hidden">
                  {week.items.map((item) => (
                    <li key={item.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {item.demandeur}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {item.departement}
                              {item.service ? ` · ${item.service}` : ""}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">
                          {format(new Date(item.updatedAt), "d MMM", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {item.raison}
                      </p>
                      <p className="mt-2 text-base font-bold tabular-nums text-emerald-800">
                        {formatFcfa(montantEffectif(item))}
                      </p>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
