"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText as RapportAgendaIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

function activityStartLocal(a: Pick<Activity, "date" | "startTime">): Date | null {
  if (!a.date || !a.startTime) return null;
  const [y, mo, d] = a.date.split("-").map(Number);
  const [h, mi] = a.startTime.split(":").map(Number);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

function playAlertBeep() {
  try {
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const beep = (t: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + duration);
    };

    // Two short beeps.
    beep(now, 880, 0.08);
    beep(now + 0.12, 880, 0.08);

    // Close after playback to avoid keeping audio resources alive.
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 450);
  } catch {
    // ignore (autoplay policies, missing audio, etc.)
  }
}

type ColorDef = {
  key: string;
  label: string;
  dot: string;
  bar: string;
  softBg: string;
  softText: string;
  chipBorder: string;
};

const COLORS: ColorDef[] = [
  {
    key: "indigo",
    label: "Indigo",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    softBg: "bg-indigo-50",
    softText: "text-indigo-700",
    chipBorder: "border-indigo-200",
  },
  {
    key: "sky",
    label: "Bleu",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    softBg: "bg-sky-50",
    softText: "text-sky-700",
    chipBorder: "border-sky-200",
  },
  {
    key: "emerald",
    label: "Vert",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    chipBorder: "border-emerald-200",
  },
  {
    key: "amber",
    label: "Orange",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    softBg: "bg-amber-50",
    softText: "text-amber-700",
    chipBorder: "border-amber-200",
  },
  {
    key: "rose",
    label: "Rose",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    softBg: "bg-rose-50",
    softText: "text-rose-700",
    chipBorder: "border-rose-200",
  },
  {
    key: "slate",
    label: "Gris",
    dot: "bg-slate-500",
    bar: "bg-slate-500",
    softBg: "bg-slate-50",
    softText: "text-slate-700",
    chipBorder: "border-slate-200",
  },
];

function getColor(key: string) {
  return COLORS.find((c) => c.key === key) ?? COLORS[0]!;
}

const START_HOUR = 3;
const END_HOUR = 24;
const MINUTE_HEIGHT = 1.6; // px per minute
const HOUR_HEIGHT = 60 * MINUTE_HEIGHT;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }).map(
  (_, i) => START_HOUR + i
);
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

type FormState = {
  id?: string;
  titre: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  lieu: string;
};

function emptyForm(date?: Date, startTime?: string): FormState {
  const d = date ?? new Date();
  const base = format(d, "yyyy-MM-dd");
  const st = startTime ?? "09:00";
  const end = (() => {
    const [h, m] = st.split(":").map(Number);
    const total = h * 60 + m + 60;
    const eh = Math.min(END_HOUR - 1, Math.floor(total / 60));
    const em = total % 60;
    return `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`;
  })();
  return {
    titre: "",
    description: "",
    date: base,
    startTime: st,
    endTime: end,
    color: COLORS[0]!.key,
    lieu: "",
  };
}

type PositionedActivity = Activity & {
  top: number;
  height: number;
  colIndex: number;
  colCount: number;
};

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Compute side-by-side layout for overlapping activities
function layoutActivities(acts: Activity[]): PositionedActivity[] {
  const sorted = [...acts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const placed: PositionedActivity[] = [];

  // Group into clusters of overlapping activities
  const clusters: Activity[][] = [];
  for (const a of sorted) {
    const s = toMin(a.startTime);
    const e = toMin(a.endTime);
    let found = false;
    for (const cluster of clusters) {
      const overlaps = cluster.some((b) => {
        const bs = toMin(b.startTime);
        const be = toMin(b.endTime);
        return s < be && e > bs;
      });
      if (overlaps) {
        cluster.push(a);
        found = true;
        break;
      }
    }
    if (!found) clusters.push([a]);
  }

  for (const cluster of clusters) {
    const columns: Activity[][] = [];
    for (const a of cluster) {
      let placedInCol = false;
      for (const col of columns) {
        const last = col[col.length - 1]!;
        if (toMin(a.startTime) >= toMin(last.endTime)) {
          col.push(a);
          placedInCol = true;
          break;
        }
      }
      if (!placedInCol) columns.push([a]);
    }
    const colCount = columns.length;
    columns.forEach((col, colIndex) => {
      col.forEach((a) => {
        const s = toMin(a.startTime) - START_HOUR * 60;
        const e = toMin(a.endTime) - START_HOUR * 60;
        const top = Math.max(0, s) * MINUTE_HEIGHT;
        const height = Math.max(28, (e - s) * MINUTE_HEIGHT);
        placed.push({ ...a, top, height, colIndex, colCount });
      });
    });
  }
  return placed;
}

const StatChip = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 px-3 py-2 text-white shadow-sm">
    <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
      {label}
    </div>
    <div className="text-sm font-bold tabular-nums">{value}</div>
  </div>
);

export default function AgendaManagerPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTodayDialogOpen, setIsTodayDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const alertedRef = useRef<Set<string>>(new Set());

  const gridScrollRef = useRef<HTMLDivElement>(null);

  const todayActivities = useMemo(() => {
    const list = activities.filter((a) => {
      const d = parseISO(a.date);
      return isSameDay(d, now);
    });
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activities, now]);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  // Reminders: toast (and optional desktop notification) ~1h before start.
  useEffect(() => {
    const tick = () => {
      const current = new Date();

      // Optional desktop notification (only if user already granted it).
      const canNotify =
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted";

      for (const a of activities) {
        const start = activityStartLocal(a);
        if (!start) continue;
        const diffMs = start.getTime() - current.getTime();
        if (diffMs <= 0) continue;

        const diffMinutes = Math.round(diffMs / 60_000);
        // "About one hour": trigger once when we're in the 60→59 minutes window.
        if (diffMinutes < 59 || diffMinutes > 60) continue;

        const key = `${a.id}:${a.date}:${a.startTime}`;
        if (alertedRef.current.has(key)) continue;
        alertedRef.current.add(key);

        const label = `${a.startTime} · ${a.titre}`;
        toast(`Rappel dans 1 heure`, {
          description: a.lieu ? `${label} · ${a.lieu}` : label,
        });
        playAlertBeep();

        if (canNotify) {
          try {
            new Notification("Rappel agenda (dans 1h)", {
              body: a.lieu ? `${label} · ${a.lieu}` : label,
            });
          } catch {
            // ignore browser notification errors
          }
        }
      }
    };

    tick();
    const i = setInterval(tick, 60_000);
    return () => clearInterval(i);
  }, [activities]);

  const fetchActivities = useCallback(async (signal?: AbortSignal) => {
    const maxAttempts = 2;
    let lastErr: unknown = null;
    try {
      setIsLoading(true);
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch("/api/agenda?all=1", {
            cache: "no-store",
            signal,
            credentials: "include",
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || "Erreur de chargement");
          }
          if (signal?.aborted) return;
          setActivities(json.data as Activity[]);
          return;
        } catch (err) {
          lastErr = err;
          if (
            signal?.aborted ||
            (err instanceof DOMException && err.name === "AbortError")
          ) {
            return;
          }
          const isTransient =
            err instanceof TypeError && /failed to fetch|network/i.test(err.message);
          if (attempt < maxAttempts && isTransient) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }
          throw err;
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const isNetErr =
        err instanceof TypeError && /failed to fetch|network|load failed/i.test(err.message);
      if (!isNetErr) console.error(err);
      else console.warn("[Agenda] load network hiccup");
      toast.error(
        lastErr instanceof Error ? lastErr.message : "Impossible de charger l'agenda"
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchActivities(controller.signal);
    return () => controller.abort();
  }, [fetchActivities]);

  useEffect(() => {
    if (gridScrollRef.current) {
      const targetHour = 8;
      gridScrollRef.current.scrollTop = (targetHour - START_HOUR) * HOUR_HEIGHT - 12;
    }
  }, []);

  const activitiesForDay = useCallback(
    (day: Date) =>
      activities
        .filter((a) => isSameDay(parseISO(a.date), day))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities]
  );

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const positionedByDay = useMemo(() => {
    const map: Record<string, PositionedActivity[]> = {};
    for (const d of weekDays) {
      const key = format(d, "yyyy-MM-dd");
      map[key] = layoutActivities(activitiesForDay(d));
    }
    return map;
  }, [weekDays, activitiesForDay]);

  const openCreate = (date?: Date, startTime?: string) => {
    setForm(emptyForm(date ?? selectedDate, startTime));
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setForm({
      id: activity.id,
      titre: activity.titre,
      description: activity.description ?? "",
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      color: activity.color,
      lieu: activity.lieu ?? "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const validate = (f: FormState) => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!f.titre.trim()) e.titre = "Le titre est requis";
    if (!f.date) e.date = "La date est requise";
    if (!f.startTime) e.startTime = "Heure de début requise";
    if (!f.endTime) e.endTime = "Heure de fin requise";
    if (f.startTime && f.endTime && f.endTime <= f.startTime) {
      e.endTime = "La fin doit être après le début";
    }
    const [sh] = f.startTime.split(":").map(Number);
    const [eh, em] = f.endTime.split(":").map(Number);
    if (sh < START_HOUR) e.startTime = `Début minimum ${START_HOUR}:00`;
    if (eh * 60 + em > END_HOUR * 60) e.endTime = `Fin maximum ${END_HOUR}:00`;
    return e;
  };

  const fetchWithRetry = async (url: string, init: RequestInit, maxAttempts = 4) => {
    let lastErr: unknown = null;
    const backoffs = [400, 900, 1800, 3200];
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, init);
        if (
          (res.status === 502 || res.status === 503 || res.status === 504) &&
          attempt < maxAttempts
        ) {
          await new Promise((r) => setTimeout(r, backoffs[attempt - 1] ?? 1500));
          continue;
        }
        return res;
      } catch (err) {
        lastErr = err;
        const isTransient =
          err instanceof TypeError && /failed to fetch|network|load failed/i.test(err.message);
        if (attempt < maxAttempts && isTransient) {
          await new Promise((r) => setTimeout(r, backoffs[attempt - 1] ?? 1500));
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Erreur réseau");
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
      lieu: form.lieu.trim() || null,
    };

    const isEdit = !!form.id;
    try {
      setIsSubmitting(true);
      const url = isEdit ? `/api/agenda/${form.id}` : "/api/agenda";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetchWithRetry(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      let json: { success?: boolean; data?: Activity; error?: string };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        throw new Error(
          `Réponse invalide du serveur (HTTP ${res.status}). Vérifiez la console serveur.`
        );
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Erreur lors de l'enregistrement (HTTP ${res.status})`);
      }

      const saved = json.data as Activity;
      setActivities((prev) =>
        isEdit ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved]
      );
      toast.success(isEdit ? "Activité mise à jour" : "Activité ajoutée");
      setSelectedDate(parseISO(saved.date));
      setIsDialogOpen(false);
    } catch (err) {
      const isNetErr =
        err instanceof TypeError && /failed to fetch|network|load failed/i.test(err.message);
      if (!isNetErr) console.error(err);

      if (isNetErr) {
        try {
          const res2 = await fetchWithRetry(
            "/api/agenda?all=1",
            { cache: "no-store", credentials: "include" },
            4
          );
          const json2 = await res2.json();
          if (res2.ok && json2.success) {
            const list = json2.data as Activity[];
            setActivities(list);
            const matched = isEdit
              ? list.find((a) => a.id === form.id)
              : list.find(
                  (a) =>
                    a.titre === payload.titre &&
                    a.date === payload.date &&
                    a.startTime === payload.startTime &&
                    a.endTime === payload.endTime
                );
            if (matched) {
              toast.success(isEdit ? "Activité mise à jour" : "Activité ajoutée");
              setSelectedDate(parseISO(matched.date));
              setIsDialogOpen(false);
              return;
            }
          }
        } catch {}
        toast.error(
          "Connexion instable (serveur en recompilation ?). Réessayez dans un instant."
        );
        return;
      }

      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await fetchWithRetry(`/api/agenda/${id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      let json: { success?: boolean; error?: string };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        throw new Error(`Réponse invalide du serveur (HTTP ${res.status}).`);
      }
      if (!res.ok || !json.success) {
        if (res.status === 404) {
          setActivities((prev) => prev.filter((a) => a.id !== id));
          toast.success("Activité supprimée");
          setIsDialogOpen(false);
          return;
        }
        throw new Error(json.error || `Erreur lors de la suppression (HTTP ${res.status})`);
      }
      setActivities((prev) => prev.filter((a) => a.id !== id));
      toast.success("Activité supprimée");
      setIsDialogOpen(false);
    } catch (err) {
      const isNetErr =
        err instanceof TypeError && /failed to fetch|network|load failed/i.test(err.message);
      if (!isNetErr) console.error(err);

      if (isNetErr) {
        try {
          const res2 = await fetchWithRetry(
            "/api/agenda?all=1",
            { cache: "no-store", credentials: "include" },
            4
          );
          const json2 = await res2.json();
          if (res2.ok && json2.success) {
            const list = json2.data as Activity[];
            setActivities(list);
            if (!list.some((a) => a.id === id)) {
              toast.success("Activité supprimée");
              setIsDialogOpen(false);
              return;
            }
          }
        } catch {}
        toast.error(
          "Connexion instable (serveur en recompilation ?). Réessayez dans un instant."
        );
        return;
      }

      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const goPrevWeek = () => setSelectedDate((d) => addDays(d, -7));
  const goNextWeek = () => setSelectedDate((d) => addDays(d, 7));
  const goToday = () => setSelectedDate(new Date());

  const nowMinutes = useMemo(() => {
    const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
    if (mins < 0 || mins > (END_HOUR - START_HOUR) * 60) return null;
    return mins * MINUTE_HEIGHT;
  }, [now]);

  const weekActivities = useMemo(
    () =>
      activities.filter((a) =>
        isWithinInterval(parseISO(a.date), {
          start: startOfDay(weekStart),
          end: weekEnd,
        })
      ),
    [activities, weekStart, weekEnd]
  );
  const weekCount = weekActivities.length;
  const weekMinutes = useMemo(
    () =>
      weekActivities.reduce((acc, a) => {
        const [sh, sm] = a.startTime.split(":").map(Number);
        const [eh, em] = a.endTime.split(":").map(Number);
        return acc + (eh * 60 + em - (sh * 60 + sm));
      }, 0),
    [weekActivities]
  );
  const todayCount = useMemo(
    () => activities.filter((a) => isSameDay(parseISO(a.date), now)).length,
    [activities, now]
  );
  const monthCount = useMemo(() => {
    const s = startOfMonth(selectedDate);
    const e = endOfMonth(selectedDate);
    return activities.filter((a) => {
      const d = parseISO(a.date);
      return d >= s && d <= e;
    }).length;
  }, [activities, selectedDate]);

  const handleDayClick =
    (day: Date) =>
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutes = Math.max(0, Math.round(y / MINUTE_HEIGHT / 15) * 15);
      const total = START_HOUR * 60 + minutes;
      const H = Math.min(END_HOUR - 1, Math.floor(total / 60));
      const M = total % 60;
      const start = `${H.toString().padStart(2, "0")}:${M.toString().padStart(2, "0")}`;
      openCreate(day, start);
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-6 md:p-8 shadow-xl shadow-indigo-500/20">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center shadow-lg">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-white/70">
                  <Sparkles className="w-3.5 h-3.5" />
                  Agenda manager · 03:00 → 24:00
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-1 capitalize">
                  Semaine du {format(weekStart, "d MMM", { locale: fr })} —{" "}
                  {format(weekEnd, "d MMM yyyy", { locale: fr })}
                </h1>
                <p className="text-sm text-white/80 mt-1 max-w-lg">
                  Visualisez toute votre semaine par créneau horaire. Cliquez sur une
                  heure dans n&apos;importe quel jour pour créer une activité.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <StatChip label="Aujourd'hui" value={todayCount} />
                <StatChip label="Semaine" value={weekCount} />
                <StatChip
                  label="Durée"
                  value={`${Math.floor(weekMinutes / 60)}h${(weekMinutes % 60)
                    .toString()
                    .padStart(2, "0")}`}
                />
              </div>

              <Button
                onClick={() => openCreate()}
                size="lg"
                className="bg-white text-indigo-700 hover:bg-white/90 font-semibold shadow-xl shadow-black/20 h-12 px-6 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Ajouter Activité
              </Button>
            </div>
          </div>

          <div className="md:hidden mt-6 grid grid-cols-3 gap-2 relative">
            <StatChip label="Aujourd'hui" value={todayCount} />
            <StatChip label="Semaine" value={weekCount} />
            <StatChip label="Mois" value={monthCount} />
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={goPrevWeek}
                className="rounded-xl bg-white/15 text-white hover:bg-white/20 ring-1 ring-white/20"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Semaine -1
              </Button>
              <Button
                variant="secondary"
                onClick={goToday}
                className="rounded-xl bg-white/15 text-white hover:bg-white/20 ring-1 ring-white/20"
              >
                <CalendarRange className="w-4 h-4 mr-2" />
                Aujourd&apos;hui
              </Button>
              <Button
                variant="secondary"
                onClick={goNextWeek}
                className="rounded-xl bg-white/15 text-white hover:bg-white/20 ring-1 ring-white/20"
              >
                Semaine +1
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsTodayDialogOpen(true)}
                  className="rounded-xl bg-white/15 text-white hover:bg-white/20 ring-1 ring-white/20"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Rendez-Vous du jour
                  <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-white/20 text-[11px] font-bold tabular-nums">
                    {todayActivities.length}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl shadow-lg shadow-indigo-500/5 overflow-hidden">
          <div
            ref={gridScrollRef}
            className="relative overflow-y-auto custom-scroll"
            style={{ maxHeight: "76vh" }}
          >
            <div className="sticky top-0 z-30 grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-gray-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 backdrop-blur">
              <div className="border-r border-gray-200 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  GMT
                </span>
              </div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, now);
                const dayCount = activitiesForDay(day).length;
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={clsx(
                      "py-2.5 text-center border-r border-gray-200 last:border-r-0 transition-all group relative",
                      isToday && "bg-gradient-to-b from-indigo-50 to-transparent",
                      isSelected && !isToday && "bg-indigo-50/40"
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      {format(day, "EEE", { locale: fr })}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                          isToday
                            ? "bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/40"
                            : "text-gray-800 group-hover:bg-gray-100"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                    {dayCount > 0 && (
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        {Array.from({ length: Math.min(dayCount, 4) }).map((_, i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-indigo-400" />
                        ))}
                        {dayCount > 4 && (
                          <span className="text-[9px] text-indigo-500 font-bold">
                            +{dayCount - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              className="relative grid grid-cols-[72px_repeat(7,minmax(0,1fr))]"
              style={{ height: TOTAL_HEIGHT }}
            >
              <div className="relative border-r border-gray-200 bg-gradient-to-b from-slate-50 to-white">
                {HOURS.map((h, idx) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 flex items-start justify-end pr-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                    style={{
                      top: idx * HOUR_HEIGHT - 6,
                      height: HOUR_HEIGHT,
                    }}
                  >
                    <span className="bg-white px-1 rounded">
                      {h.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayPos = positionedByDay[key] ?? [];
                const isToday = isSameDay(day, now);
                return (
                  <div
                    key={key}
                    className={clsx(
                      "relative border-r border-gray-200 last:border-r-0 group/col",
                      isToday && "bg-indigo-50/20"
                    )}
                    onClick={handleDayClick(day)}
                  >
                    {HOURS.map((h, idx) => (
                      <div
                        key={h}
                        className={clsx(
                          "absolute left-0 right-0 border-t pointer-events-none",
                          idx === 0 ? "border-transparent" : "border-gray-100"
                        )}
                        style={{ top: idx * HOUR_HEIGHT }}
                      />
                    ))}
                    {HOURS.slice(0, -1).map((h, idx) => (
                      <div
                        key={`half-${h}`}
                        className="absolute left-0 right-0 border-t border-dashed border-gray-100 pointer-events-none"
                        style={{
                          top: idx * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                        }}
                      />
                    ))}

                    {isToday && nowMinutes !== null && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: nowMinutes }}
                      >
                        <div className="flex items-center">
                          <div className="w-2.5 h-2.5 -ml-1.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/40" />
                          <div className="flex-1 h-px bg-rose-500/80" />
                        </div>
                      </div>
                    )}

                    {dayPos.map((a) => {
                      const c = getColor(a.color);
                      const widthPct = 100 / a.colCount;
                      const leftPct = widthPct * a.colIndex;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(a);
                          }}
                          className={clsx(
                            "absolute rounded-lg border overflow-hidden text-left group/act",
                            "transition-all hover:shadow-lg hover:-translate-y-px hover:z-10",
                            c.chipBorder,
                            c.softBg
                          )}
                          style={{
                            top: a.top + 2,
                            height: a.height - 4,
                            left: `calc(${leftPct}% + 4px)`,
                            width: `calc(${widthPct}% - 8px)`,
                          }}
                          title={`${a.startTime} - ${a.endTime} · ${a.titre}`}
                        >
                          <div className={clsx("absolute left-0 top-0 bottom-0 w-1", c.bar)} />
                          <div className="pl-2 pr-1.5 py-1 h-full flex flex-col overflow-hidden">
                            <div
                              className={clsx(
                                "inline-flex items-center gap-0.5 text-[9px] font-bold leading-tight",
                                c.softText
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span className="tabular-nums">{a.startTime}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] font-semibold text-gray-900 leading-tight line-clamp-2">
                              {a.titre}
                            </div>
                            {a.height >= 60 && a.owner && (
                              <div className="text-[9px] text-gray-500 truncate">
                                {a.owner}
                              </div>
                            )}
                            {a.height >= 60 && a.lieu && (
                              <div className="mt-auto text-[9px] text-gray-500 flex items-center gap-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{a.lieu}</span>
                              </div>
                            )}
                          </div>

                          <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5 opacity-0 group-hover/act:opacity-100 transition-opacity">
                            <Link
                              href={`/manager/agenda/${a.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-0.5 rounded-md bg-white/90 hover:bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer inline-flex"
                              title="Rapport"
                            >
                              <RapportAgendaIcon className="w-2.5 h-2.5" />
                            </Link>

                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(a);
                              }}
                              className="p-0.5 rounded-md bg-white/90 hover:bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer"
                              title="Modifier"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(a.id);
                              }}
                              className="p-0.5 rounded-md bg-white/90 hover:bg-white text-gray-600 hover:text-rose-600 border border-gray-200 shadow-sm cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {!isLoading && weekCount === 0 && (
              <div className="pointer-events-none absolute inset-x-0 top-24 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 mx-auto flex items-center justify-center mb-2">
                    <CalendarDays className="w-7 h-7 text-indigo-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Cliquez sur une heure pour ajouter une activité
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                  <div className="text-xs text-gray-600 font-medium">Chargement…</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[560px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {form.id ? "Modifier l'activité" : "Nouvelle activité"}
              </DialogTitle>
              <DialogDescription>
                Planifiez un rendez-vous, une tâche ou un événement.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titre">Titre</Label>
                  <Input
                    id="titre"
                    value={form.titre}
                    onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
                    className={errors.titre ? "border-rose-300" : ""}
                    placeholder="Ex: Réunion équipe"
                  />
                  {errors.titre && <p className="text-xs text-rose-600">{errors.titre}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className={errors.date ? "border-rose-300" : ""}
                  />
                  {errors.date && <p className="text-xs text-rose-600">{errors.date}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Début</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startTime: e.target.value }))
                    }
                    className={errors.startTime ? "border-rose-300" : ""}
                  />
                  {errors.startTime && (
                    <p className="text-xs text-rose-600">{errors.startTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                    className={errors.endTime ? "border-rose-300" : ""}
                  />
                  {errors.endTime && <p className="text-xs text-rose-600">{errors.endTime}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lieu">Lieu</Label>
                  <Input
                    id="lieu"
                    value={form.lieu}
                    onChange={(e) => setForm((p) => ({ ...p, lieu: e.target.value }))}
                    placeholder="Optionnel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.key}
                        onClick={() => setForm((p) => ({ ...p, color: c.key }))}
                        className={clsx(
                          "px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                          form.color === c.key
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                        )}
                        title={c.label}
                      >
                        <span className={clsx("inline-block w-2 h-2 rounded-full mr-2", c.dot)} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Notes, ordre du jour, informations utiles…"
                  rows={4}
                />
              </div>

              <DialogFooter className="gap-2">
                {form.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(form.id!)}
                    disabled={isDeleting || isSubmitting}
                    className="rounded-xl"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Suppression…
                      </>
                    ) : (
                      "Supprimer"
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting || isDeleting}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement…
                    </>
                  ) : form.id ? (
                    "Mettre à jour"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isTodayDialogOpen} onOpenChange={setIsTodayDialogOpen}>
          <DialogContent className="sm:max-w-[640px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Rendez-Vous du jour</DialogTitle>
              <DialogDescription>
                {format(now, "EEEE d MMMM yyyy", { locale: fr })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {todayActivities.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-600">
                  Aucun rendez-vous aujourd&apos;hui.
                </div>
              ) : (
                todayActivities.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gray-200 bg-white p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-lg bg-indigo-50 text-indigo-700 px-2 py-1 text-xs font-bold tabular-nums">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {a.startTime}–{a.endTime}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">{a.titre}</span>
                      </div>
                      {(a.lieu || a.description) && (
                        <div className="mt-1 text-xs text-gray-600 space-y-1">
                          {a.lieu && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate">{a.lieu}</span>
                            </div>
                          )}
                          {a.description && (
                            <div className="line-clamp-2">{a.description}</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "w-2.5 h-2.5 rounded-full ring-4 ring-white",
                          COLORS.find((c) => c.key === a.color)?.dot ?? "bg-indigo-500"
                        )}
                        title="Couleur"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsTodayDialogOpen(false)}
                className="rounded-xl"
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}