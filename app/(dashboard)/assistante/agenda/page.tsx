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
      (window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
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

    beep(now, 880, 0.08);
    beep(now + 0.12, 880, 0.08);

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
  chipBg: string;
  chipText: string;
  chipBorder: string;
  bar: string;
  solidBg: string;
  softBg: string;
  softText: string;
  ring: string;
  gradient: string;
};

const COLOR_PALETTE: ColorDef[] = [
  {
    key: "indigo",
    label: "Indigo",
    dot: "bg-indigo-500",
    chipBg: "bg-indigo-100",
    chipText: "text-indigo-800",
    chipBorder: "border-indigo-300",
    bar: "bg-indigo-600",
    solidBg: "bg-indigo-500",
    softBg: "bg-indigo-50",
    softText: "text-indigo-700",
    ring: "ring-indigo-300",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    key: "sky",
    label: "Bleu ciel",
    dot: "bg-sky-500",
    chipBg: "bg-sky-100",
    chipText: "text-sky-800",
    chipBorder: "border-sky-300",
    bar: "bg-sky-600",
    solidBg: "bg-sky-500",
    softBg: "bg-sky-50",
    softText: "text-sky-700",
    ring: "ring-sky-300",
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    key: "emerald",
    label: "Émeraude",
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-800",
    chipBorder: "border-emerald-300",
    bar: "bg-emerald-600",
    solidBg: "bg-emerald-500",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    ring: "ring-emerald-300",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    key: "amber",
    label: "Ambre",
    dot: "bg-amber-500",
    chipBg: "bg-amber-100",
    chipText: "text-amber-800",
    chipBorder: "border-amber-300",
    bar: "bg-amber-600",
    solidBg: "bg-amber-500",
    softBg: "bg-amber-50",
    softText: "text-amber-700",
    ring: "ring-amber-300",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    key: "rose",
    label: "Rose",
    dot: "bg-rose-500",
    chipBg: "bg-rose-100",
    chipText: "text-rose-800",
    chipBorder: "border-rose-300",
    bar: "bg-rose-600",
    solidBg: "bg-rose-500",
    softBg: "bg-rose-50",
    softText: "text-rose-700",
    ring: "ring-rose-300",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    key: "violet",
    label: "Violet",
    dot: "bg-violet-500",
    chipBg: "bg-violet-100",
    chipText: "text-violet-800",
    chipBorder: "border-violet-300",
    bar: "bg-violet-600",
    solidBg: "bg-violet-500",
    softBg: "bg-violet-50",
    softText: "text-violet-700",
    ring: "ring-violet-300",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    key: "teal",
    label: "Teal",
    dot: "bg-teal-500",
    chipBg: "bg-teal-100",
    chipText: "text-teal-800",
    chipBorder: "border-teal-300",
    bar: "bg-teal-600",
    solidBg: "bg-teal-500",
    softBg: "bg-teal-50",
    softText: "text-teal-700",
    ring: "ring-teal-300",
    gradient: "from-teal-500 to-emerald-500",
  },
  {
    key: "fuchsia",
    label: "Fuchsia",
    dot: "bg-fuchsia-500",
    chipBg: "bg-fuchsia-100",
    chipText: "text-fuchsia-800",
    chipBorder: "border-fuchsia-300",
    bar: "bg-fuchsia-600",
    solidBg: "bg-fuchsia-500",
    softBg: "bg-fuchsia-50",
    softText: "text-fuchsia-700",
    ring: "ring-fuchsia-300",
    gradient: "from-fuchsia-500 to-pink-500",
  },
];

const getColor = (key: string) =>
  COLOR_PALETTE.find((c) => c.key === key) ?? COLOR_PALETTE[0];

// ===== TIME WINDOW: 03:00 → 24:00 =====
const START_HOUR = 3;
const END_HOUR = 24;
const HOUR_HEIGHT = 64; // px per hour
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i
);

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

function addHourToTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  // HTML time inputs do not accept 24:00; clamp to 23:59 for UX consistency.
  const endMinutes = Math.min((h + 1) * 60 + (m || 0), END_HOUR * 60 - 1);
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
}

function clampHM(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const minutes = Math.max(
    START_HOUR * 60,
    Math.min(END_HOUR * 60 - 1, (h || 0) * 60 + (m || 0))
  );
  const H = Math.floor(minutes / 60);
  const M = minutes % 60;
  return `${H.toString().padStart(2, "0")}:${M.toString().padStart(2, "0")}`;
}

const emptyForm = (date?: Date, startTime?: string): FormState => ({
  titre: "",
  description: "",
  date: format(date ?? new Date(), "yyyy-MM-dd"),
  startTime: startTime ?? "09:00",
  endTime: startTime ? addHourToTime(startTime) : "10:00",
  color: "indigo",
  lieu: "",
});

// Compute side-by-side layout for overlapping activities
type PositionedActivity = Activity & {
  top: number;
  height: number;
  colIndex: number;
  colCount: number;
};

function layoutActivities(list: Activity[]): PositionedActivity[] {
  const sorted = [...list].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  // Group into clusters of overlapping activities
  const clusters: Activity[][] = [];
  let current: Activity[] = [];
  let clusterEnd = -1;
  for (const a of sorted) {
    const s = toMin(a.startTime);
    const e = toMin(a.endTime);
    if (current.length === 0 || s < clusterEnd) {
      current.push(a);
      clusterEnd = Math.max(clusterEnd, e);
    } else {
      clusters.push(current);
      current = [a];
      clusterEnd = e;
    }
  }
  if (current.length) clusters.push(current);

  const placed: PositionedActivity[] = [];
  for (const cluster of clusters) {
    const columns: Activity[][] = [];
    for (const a of cluster) {
      const s = toMin(a.startTime);
      let placedCol = -1;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const last = col[col.length - 1];
        if (toMin(last.endTime) <= s) {
          col.push(a);
          placedCol = i;
          break;
        }
      }
      if (placedCol === -1) {
        columns.push([a]);
        placedCol = columns.length - 1;
      }
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

const AgendaPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const alertedRef = useRef<Set<string>>(new Set());

  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  // Reminders: toast (and optional desktop notification) ~1h before start.
  useEffect(() => {
    const tick = () => {
      const current = new Date();
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
          } catch {}
        }
      }
    };

    tick();
    const i = setInterval(tick, 60_000);
    return () => clearInterval(i);
  }, [activities]);

  const fetchActivities = useCallback(
    async (signal?: AbortSignal) => {
      const maxAttempts = 2;
      let lastErr: unknown = null;
      try {
        setIsLoading(true);
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const res = await fetch("/api/agenda", {
              cache: "no-store",
              signal,
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
            // Abort (unmount / HMR) — silently exit, do not toast
            if (
              signal?.aborted ||
              (err instanceof DOMException && err.name === "AbortError")
            ) {
              return;
            }
            // Transient network hiccup (Turbopack HMR, Neon P1017) — retry once
            const isTransient =
              err instanceof TypeError &&
              /failed to fetch|network/i.test(err.message);
            if (attempt < maxAttempts && isTransient) {
              await new Promise((r) => setTimeout(r, 500));
              continue;
            }
            throw err;
          }
        }
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }
        const isNetErr =
          err instanceof TypeError &&
          /failed to fetch|network|load failed/i.test(err.message);
        if (!isNetErr) console.error(err);
        else console.warn("[Agenda] load network hiccup");
        toast.error(
          lastErr instanceof Error
            ? lastErr.message
            : "Impossible de charger l'agenda"
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchActivities(controller.signal);
    return () => controller.abort();
  }, [fetchActivities]);

  // Scroll the time column so that 08:00 is near the top on first load
  useEffect(() => {
    if (gridScrollRef.current) {
      const targetHour = 8;
      gridScrollRef.current.scrollTop =
        (targetHour - START_HOUR) * HOUR_HEIGHT - 12;
    }
  }, []);

  const activitiesForDay = useCallback(
    (day: Date) =>
      activities
        .filter((a) => isSameDay(parseISO(a.date), day))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities]
  );

  // ===== WEEK (Mon → Sun) =====
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
    if (eh * 60 + em > END_HOUR * 60)
      e.endTime = `Fin maximum ${END_HOUR}:00`;
    return e;
  };

  // Retries on transient network / Turbopack-HMR / Neon-cold-start failures.
  // Turbopack middleware recompiles can stall the dev server for 1-3s, during
  // which the browser sees `TypeError: Failed to fetch`. We use exponential
  // backoff so the retry window comfortably spans the recompile.
  const fetchWithRetry = async (
    url: string,
    init: RequestInit,
    maxAttempts = 4
  ): Promise<Response> => {
    let lastErr: unknown = null;
    const backoffs = [400, 900, 1800, 3200];
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, init);
        // 502/503/504 from dev proxy during recompile: treat as transient too
        if (
          (res.status === 502 || res.status === 503 || res.status === 504) &&
          attempt < maxAttempts
        ) {
          await new Promise((r) =>
            setTimeout(r, backoffs[attempt - 1] ?? 1500)
          );
          continue;
        }
        return res;
      } catch (err) {
        lastErr = err;
        const isTransient =
          err instanceof TypeError &&
          /failed to fetch|network|load failed/i.test(err.message);
        if (attempt < maxAttempts && isTransient) {
          await new Promise((r) =>
            setTimeout(r, backoffs[attempt - 1] ?? 1500)
          );
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error("Erreur réseau");
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
      console.log("[Agenda] submitting", { method, url, payload });
      const res = await fetchWithRetry(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
        cache: "no-store",
      });
      console.log("[Agenda] response", res.status, res.statusText);
      const text = await res.text();
      let json: { success?: boolean; data?: Activity; error?: string };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        console.error("[Agenda] non-JSON response body:", text);
        throw new Error(
          `Réponse invalide du serveur (HTTP ${res.status}). Vérifiez la console serveur.`
        );
      }
      if (!res.ok || !json.success) {
        throw new Error(
          json.error || `Erreur lors de l'enregistrement (HTTP ${res.status})`
        );
      }

      const saved = json.data as Activity;
      setActivities((prev) =>
        isEdit
          ? prev.map((a) => (a.id === saved.id ? saved : a))
          : [...prev, saved]
      );
      toast.success(isEdit ? "Activité mise à jour" : "Activité ajoutée");
      setSelectedDate(parseISO(saved.date));
      setIsDialogOpen(false);
    } catch (err) {
      const isNetErr =
        err instanceof TypeError &&
        /failed to fetch|network|load failed/i.test(err.message);
      // Only log non-network errors as console.error so Next.js dev overlay
      // doesn't pop up for transient Turbopack socket drops we already handle.
      if (!isNetErr) console.error(err);
      else console.warn("[Agenda] submit network hiccup, reconciling...");

      // Dev-env Turbopack sometimes drops the response socket even though the
      // server persisted the write. Reconcile by refetching server state.
      if (isNetErr) {
        try {
          const res2 = await fetchWithRetry(
            "/api/agenda",
            { cache: "no-store" },
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
              toast.success(
                isEdit ? "Activité mise à jour" : "Activité ajoutée"
              );
              setSelectedDate(parseISO(matched.date));
              setIsDialogOpen(false);
              return;
            }
          }
        } catch (reconcileErr) {
          console.warn("[Agenda] reconcile fetch failed:", reconcileErr);
        }
        toast.error(
          "Connexion instable (serveur en recompilation ?). Réessayez dans un instant."
        );
        return;
      }

      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      console.log("[Agenda] deleting", id);
      const res = await fetchWithRetry(`/api/agenda/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });
      console.log("[Agenda] delete response", res.status, res.statusText);
      const text = await res.text();
      let json: { success?: boolean; error?: string };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        console.error("[Agenda] non-JSON delete body:", text);
        throw new Error(
          `Réponse invalide du serveur (HTTP ${res.status}).`
        );
      }
      if (!res.ok || !json.success) {
        // 404 means it's already gone — treat as success
        if (res.status === 404) {
          setActivities((prev) => prev.filter((a) => a.id !== id));
          toast.success("Activité supprimée");
          setIsDialogOpen(false);
          return;
        }
        throw new Error(
          json.error || `Erreur lors de la suppression (HTTP ${res.status})`
        );
      }
      setActivities((prev) => prev.filter((a) => a.id !== id));
      toast.success("Activité supprimée");
      setIsDialogOpen(false);
    } catch (err) {
      const isNetErr =
        err instanceof TypeError &&
        /failed to fetch|network|load failed/i.test(err.message);
      if (!isNetErr) console.error(err);
      else console.warn("[Agenda] delete network hiccup, reconciling...");

      // Dev-env socket drop: the DELETE may have still landed. Refetch and
      // reconcile — if the item is gone from the server, it was deleted.
      if (isNetErr) {
        try {
          const res2 = await fetchWithRetry(
            "/api/agenda",
            { cache: "no-store" },
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
        } catch (reconcileErr) {
          console.warn("[Agenda] reconcile fetch failed:", reconcileErr);
        }
        toast.error(
          "Connexion instable (serveur en recompilation ?). Réessayez dans un instant."
        );
        return;
      }

      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const goPrevWeek = () => setSelectedDate((d) => addDays(d, -7));
  const goNextWeek = () => setSelectedDate((d) => addDays(d, 7));
  const goToday = () => {
    setSelectedDate(new Date());
  };

  // Now indicator (anchored to whichever day matches today, if any in the week)
  const nowMinutes = useMemo(() => {
    const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
    if (mins < 0 || mins > (END_HOUR - START_HOUR) * 60) return null;
    return mins * MINUTE_HEIGHT;
  }, [now]);

  // ===== Week stats =====
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

  const handleDayClick = (day: Date) =>
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
        {/* ===== HERO HEADER ===== */}
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
                  Agenda hebdomadaire · 03:00 → 24:00
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-1 capitalize">
                  Semaine du {format(weekStart, "d MMM", { locale: fr })} —{" "}
                  {format(weekEnd, "d MMM yyyy", { locale: fr })}
                </h1>
                <p className="text-sm text-white/80 mt-1 max-w-lg">
                  Visualisez toute votre semaine par créneau horaire. Cliquez
                  sur une heure dans n&apos;importe quel jour pour créer une
                  activité.
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
        </section>

        {/* ===== WEEK NAVIGATOR ===== */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrevWeek}
              aria-label="Semaine précédente"
              className="h-9 w-9 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              className="rounded-lg font-medium"
            >
              <CalendarRange className="w-4 h-4 mr-1.5" />
              Aujourd&apos;hui
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goNextWeek}
              aria-label="Semaine suivante"
              className="h-9 w-9 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm md:text-base font-bold text-gray-800 capitalize">
              {format(weekStart, "d MMM", { locale: fr })} —{" "}
              {format(weekEnd, "d MMM yyyy", { locale: fr })}
            </div>
            <Input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(parseISO(e.target.value));
                }
              }}
              className="h-9 rounded-lg w-[150px]"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            {COLOR_PALETTE.slice(0, 6).map((c) => (
              <span
                key={c.key}
                title={c.label}
                className={clsx(
                  "w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm",
                  c.dot
                )}
              />
            ))}
            <span className="text-[11px] text-gray-500 ml-1">Palette</span>
          </div>
        </section>

        {/* ===== WEEK TIME GRID (03:00 → 24:00) ===== */}
        <section className="bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl shadow-lg shadow-indigo-500/5 overflow-hidden">
          {/* Scrollable time grid */}
          <div
            ref={gridScrollRef}
            className="relative overflow-y-auto custom-scroll"
            style={{ maxHeight: "76vh" }}
          >
            {/* Sticky week day headers */}
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
                      isToday &&
                        "bg-gradient-to-b from-indigo-50 to-transparent",
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
                        {Array.from({ length: Math.min(dayCount, 4) }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="w-1 h-1 rounded-full bg-indigo-400"
                            />
                          )
                        )}
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

            {/* Time + 7 day columns */}
            <div
              className="relative grid grid-cols-[72px_repeat(7,minmax(0,1fr))]"
              style={{ height: TOTAL_HEIGHT }}
            >
              {/* Time labels column */}
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

              {/* 7 day columns */}
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
                    {/* Hour lines */}
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
                    {/* Half-hour dashed lines */}
                    {HOURS.slice(0, -1).map((h, idx) => (
                      <div
                        key={`half-${h}`}
                        className="absolute left-0 right-0 border-t border-dashed border-gray-100 pointer-events-none"
                        style={{
                          top: idx * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                        }}
                      />
                    ))}

                    {/* Now indicator (only on today's column) */}
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

                    {/* Activities */}
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
                          <div
                            className={clsx(
                              "absolute left-0 top-0 bottom-0 w-1",
                              c.bar
                            )}
                          />
                          <div className="pl-2 pr-1.5 py-1 h-full flex flex-col overflow-hidden">
                            <div
                              className={clsx(
                                "inline-flex items-center gap-0.5 text-[9px] font-bold leading-tight",
                                c.softText
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span className="tabular-nums">
                                {a.startTime}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] font-semibold text-gray-900 leading-tight line-clamp-2">
                              {a.titre}
                            </div>
                            {a.height >= 60 && a.lieu && (
                              <div className="mt-auto text-[9px] text-gray-500 flex items-center gap-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{a.lieu}</span>
                              </div>
                            )}
                          </div>

                          {/* Hover actions */}
                          <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5 opacity-0 group-hover/act:opacity-100 transition-opacity">
                            <Link
                              href={`/assistante/agenda/${a.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-0.5 rounded-md bg-white/90 hover:bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer inline-flex"
                              title="Rapport"
                            >
                              <RapportAgendaIcon className="w-2.5 h-2.5" />
                            </Link>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(a);
                              }}
                              className="p-0.5 rounded-md bg-white/90 hover:bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer"
                              title="Modifier"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(a.id);
                              }}
                              className="p-0.5 rounded-md bg-white/90 hover:bg-white text-gray-600 hover:text-rose-600 border border-gray-200 shadow-sm cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Empty state hint (only if whole week is empty) */}
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
          </div>
        </section>
      </div>

      {/* ===== DIALOG ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 px-6 py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold text-white">
                {form.id ? "Modifier l'activité" : "Nouvelle activité"}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {form.id
                  ? "Mettez à jour les informations de votre activité."
                  : "Planifiez une nouvelle activité (entre 03:00 et 24:00)."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre" className="text-sm font-semibold">
                Titre <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titre: e.target.value }))
                }
                placeholder="Ex : Réunion équipe commerciale"
                className={clsx(errors.titre && "border-rose-400")}
              />
              {errors.titre && (
                <p className="text-xs text-rose-600">{errors.titre}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="date" className="text-sm font-semibold">
                  Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
                {errors.date && (
                  <p className="text-xs text-rose-600">{errors.date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold">
                  Début <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  min="03:00"
                  max="23:59"
                  value={form.startTime}
                  onChange={(e) => {
                    const v = clampHM(e.target.value);
                    setForm((f) => ({
                      ...f,
                      startTime: v,
                      endTime:
                        f.endTime && f.endTime > v
                          ? f.endTime
                          : addHourToTime(v),
                    }));
                  }}
                />
                {errors.startTime && (
                  <p className="text-xs text-rose-600">{errors.startTime}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold">
                  Fin <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  min="03:00"
                  max="23:59"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      endTime: clampHM(e.target.value),
                    }))
                  }
                  className={clsx(errors.endTime && "border-rose-400")}
                />
                {errors.endTime && (
                  <p className="text-xs text-rose-600">{errors.endTime}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu" className="text-sm font-semibold">
                Lieu
              </Label>
              <Input
                id="lieu"
                value={form.lieu}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lieu: e.target.value }))
                }
                placeholder="Ex : Salle de réunion, en ligne…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Notes, ordre du jour, participants…"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => {
                  const active = form.color === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, color: c.key }))
                      }
                      className={clsx(
                        "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                        c.solidBg,
                        active
                          ? "ring-2 ring-offset-2 ring-gray-800 scale-110 shadow-md"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      )}
                      title={c.label}
                      aria-label={c.label}
                    >
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-white shadow" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-2 flex-row justify-between sm:justify-between">
              <div>
                {form.id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.id && handleDelete(form.id)}
                    disabled={isDeleting || isSubmitting}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1.5" />
                    )}
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting || isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  )}
                  {form.id ? "Enregistrer" : "Créer l'activité"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.25);
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
};

const StatChip = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 px-3 py-2 text-white min-w-[86px] text-center">
    <div className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">
      {label}
    </div>
    <div className="text-lg font-bold leading-tight">{value}</div>
  </div>
);

export default AgendaPage;
