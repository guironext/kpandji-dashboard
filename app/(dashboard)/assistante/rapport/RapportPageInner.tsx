"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Flag,
  ListOrdered,
  Loader2,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type StructuredReport,
  normalizeReport,
} from "@/lib/assistante/rapport-structured";
import type { RapportPageInitial } from "@/lib/assistante/load-rapport-page-initial";

type Activity = {
  id: string;
  titre: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  lieu?: string | null;
};

type Rapport = {
  id: string | null;
  rapport: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type RegisteredParticipant = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  createdAt: string;
};

const inputClassName =
  "rounded-xl border-slate-200/90 bg-white shadow-sm transition-[box-shadow,border-color] placeholder:text-slate-400 focus-visible:border-indigo-400/80 focus-visible:ring-2 focus-visible:ring-indigo-500/20";
const textareaClassName =
  "rounded-xl border-slate-200/90 bg-white shadow-sm min-h-[2.75rem] placeholder:text-slate-400 focus-visible:border-indigo-400/80 focus-visible:ring-2 focus-visible:ring-indigo-500/20";

type ColorTheme = {
  bar: string;
  soft: string;
  softText: string;
  gradient: string;
  hero: string;
  iconBtn: string;
  glow: string;
};

const COLOR_MAP: Record<string, ColorTheme> = {
  indigo: {
    bar: "bg-indigo-600",
    soft: "bg-indigo-50/90",
    softText: "text-indigo-900",
    gradient: "from-indigo-600 to-blue-600",
    hero: "from-indigo-600 via-violet-600 to-blue-700",
    iconBtn: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-500/25",
  },
  sky: {
    bar: "bg-sky-600",
    soft: "bg-sky-50/90",
    softText: "text-sky-900",
    gradient: "from-sky-600 to-cyan-600",
    hero: "from-sky-600 via-cyan-600 to-blue-700",
    iconBtn: "from-sky-500 to-cyan-600",
    glow: "shadow-sky-500/25",
  },
  emerald: {
    bar: "bg-emerald-600",
    soft: "bg-emerald-50/90",
    softText: "text-emerald-900",
    gradient: "from-emerald-600 to-teal-600",
    hero: "from-emerald-600 via-teal-600 to-cyan-800",
    iconBtn: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/25",
  },
  amber: {
    bar: "bg-amber-600",
    soft: "bg-amber-50/90",
    softText: "text-amber-950",
    gradient: "from-amber-600 to-orange-600",
    hero: "from-amber-600 via-orange-600 to-rose-700",
    iconBtn: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/25",
  },
  rose: {
    bar: "bg-rose-600",
    soft: "bg-rose-50/90",
    softText: "text-rose-950",
    gradient: "from-rose-600 to-pink-600",
    hero: "from-rose-600 via-fuchsia-600 to-purple-800",
    iconBtn: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/25",
  },
};

function getColor(key: string): ColorTheme {
  return COLOR_MAP[key] ?? COLOR_MAP.indigo;
}

function createEmptyReport(activity: Activity | null): StructuredReport {
  return {
    version: 1,
    header: {
      lieu: activity?.lieu ?? "",
      organisateur: "",
      redacteur: "",
    },
    participants: { presents: [], absents: [] },
    objectif: { contexte: "", butPrincipal: "" },
    ordreDuJour: [],
    deroulement: [],
    decisions: [],
    actions: [],
    difficultes: { problemes: "", risques: "" },
    prochainesEtapes: { actionsFutures: "", dateProchaine: "" },
    conclusion: { resume: "", impression: "", importance: "" },
  };
}

function parseReportPayload(
  raw: string,
  activity: Activity | null,
  redacteurDefault: string
): StructuredReport {
  const base = createEmptyReport(activity);
  if (redacteurDefault) base.header.redacteur = redacteurDefault;
  if (!raw.trim()) return base;
  try {
    const n = normalizeReport(JSON.parse(raw));
    if (activity?.lieu && !n.header.lieu.trim()) {
      n.header.lieu = activity.lieu;
    }
    if (redacteurDefault && !n.header.redacteur.trim()) {
      n.header.redacteur = redacteurDefault;
    }
    return n;
  } catch {
    return base;
  }
}

function FormSection({
  title,
  description,
  icon: Icon,
  theme,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  theme: ColorTheme;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm">
      <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-white to-slate-50/50 px-4 py-3.5 sm:px-5">
        <div
          className={clsx(
            "pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-2xl",
            theme.bar
          )}
        />
        <div className="flex min-w-0 flex-1 items-start gap-3 pl-2.5">
          <div
            className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br",
              theme.iconBtn
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

function isTransientFetchError(err: unknown): boolean {
  if (err == null || isAbortError(err)) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  const full = `${name} ${msg}`;
  return (
    /failed to fetch|load failed|fetch failed|network|NetworkError|ECONNRESET|ETIMEDOUT|ECONNREFUSED|reset by peer|connection.*refused|Failed to load resource/i.test(
      full
    ) &&
    !/corps de requête|JSON|syntax|401|403|404|Unauthorized|Forbidden|Not Found/i.test(
      full
    )
  );
}

async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  maxAttempts = 10
): Promise<Response> {
  const backoffs = [800, 1500, 2500, 4000, 5500, 7000, 9000, 11000, 12000, 15000];
  const merged: RequestInit = {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  };
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (merged.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      const res = await fetch(url, merged);
      if (
        (res.status === 502 || res.status === 503 || res.status === 504) &&
        attempt < maxAttempts
      ) {
        await new Promise((r) => setTimeout(r, backoffs[attempt - 1] ?? 2000));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (isAbortError(err)) throw err;
      if (attempt < maxAttempts && isTransientFetchError(err)) {
        await new Promise((r) => setTimeout(r, backoffs[attempt - 1] ?? 2000));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Erreur réseau");
}

async function parseResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Réponse invalide du serveur (HTTP ${res.status}). Essayez de vous reconnecter ou rafraîchir la page.`
    );
  }
}

function formatFetchError(e: unknown): string {
  if (isAbortError(e)) return "";
  if (isTransientFetchError(e)) {
    return "Chargement impossible. Vérifiez hôte:port, un seul `next dev` — « Réessayer ».";
  }
  if (e instanceof Error) return e.message;
  return "Erreur de chargement";
}

function toastFetchError(e: unknown) {
  const msg = formatFetchError(e);
  if (msg) toast.error(msg);
}

function apiUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function initialErrorFromServer(
  serverInitial: RapportPageInitial | null
): string | null {
  if (serverInitial == null) return null;
  if (serverInitial.status === "unauthorized")
    return "Non autorisé. Veuillez vous reconnecter.";
  if (serverInitial.status === "not_found") return "Activité introuvable.";
  return null;
}

export const RapportPageInner = ({
  activityIdFromRoute = null,
  serverInitial = null,
}: {
  activityIdFromRoute?: string | null;
  serverInitial?: RapportPageInitial | null;
} = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId =
    (activityIdFromRoute && activityIdFromRoute.trim()) ||
    searchParams.get("activityId");

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const currentUserFullName = useMemo(() => {
    if (!clerkUser) return "";
    const parts = [clerkUser.firstName, clerkUser.lastName]
      .map((p) => (p ?? "").trim())
      .filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    return (clerkUser.fullName ?? "").trim();
  }, [clerkUser]);

  const [activity, setActivity] = useState<Activity | null>(() =>
    serverInitial?.status === "ok" ? serverInitial.activity : null
  );
  const [rapport, setRapport] = useState<Rapport | null>(() =>
    serverInitial?.status === "ok"
      ? {
          id: serverInitial.rapport.id,
          rapport: serverInitial.rapport.rapport,
          createdAt: serverInitial.rapport.createdAt,
          updatedAt: serverInitial.rapport.updatedAt,
        }
      : null
  );
  const [report, setReport] = useState<StructuredReport>(() => {
    if (serverInitial?.status === "ok") {
      return parseReportPayload(
        serverInitial.rapport.rapport,
        serverInitial.activity,
        ""
      );
    }
    return createEmptyReport(null);
  });
  const [initialSerialized, setInitialSerialized] = useState(() => {
    if (serverInitial?.status === "ok") {
      return JSON.stringify(
        parseReportPayload(
          serverInitial.rapport.rapport,
          serverInitial.activity,
          ""
        )
      );
    }
    return "";
  });
  const [loading, setLoading] = useState(() => serverInitial == null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    initialErrorFromServer(serverInitial ?? null)
  );

  const [qrOpen, setQrOpen] = useState(false);
  const [registered, setRegistered] = useState<RegisteredParticipant[]>([]);
  const [registeredLoading, setRegisteredLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");

  const [manualNom, setManualNom] = useState("");
  const [manualPrenom, setManualPrenom] = useState("");
  const [manualTelephone, setManualTelephone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  const loadDataAbortRef = useRef<AbortController | null>(null);
  const transientSurfaceRetryRef = useRef(0);
  const surfaceRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const redacteurDefaultRef = useRef("");
  useEffect(() => {
    redacteurDefaultRef.current = currentUserFullName;
  }, [currentUserFullName]);

  useEffect(() => {
    if (typeof window === "undefined" || !activityId) return;
    setPublicUrl(`${window.location.origin}/participer/${activityId}`);
  }, [activityId]);

  const color = useMemo(
    () => (activity ? getColor(activity.color) : getColor("indigo")),
    [activity]
  );

  const serialized = useMemo(() => JSON.stringify(report), [report]);
  const isDirty = serialized !== initialSerialized;

  const loadData = useCallback(async () => {
    if (!activityId) {
      setLoading(false);
      return;
    }
    if (!clerkLoaded) {
      return;
    }
    loadDataAbortRef.current?.abort();
    const ac = new AbortController();
    loadDataAbortRef.current = ac;
    const signal = ac.signal;

    setLoading(true);
    setError(null);
    let deferLoadingEndForSurfaceRetry = false;
    const maxSurfaceWaits = 2;
    try {
      const actRes = await fetchWithRetry(
        apiUrl(`/api/agenda/${activityId}`),
        { signal }
      );
      const actJson = await parseResponseJson<{
        success: boolean;
        error?: string;
        data?: Activity;
      }>(actRes);
      if (!actRes.ok || !actJson.success) {
        throw new Error(actJson.error || "Activité introuvable.");
      }
      const rapRes = await fetchWithRetry(
        apiUrl(`/api/agenda/${activityId}/rapport`),
        { signal }
      );
      const rapJson = await parseResponseJson<{
        success: boolean;
        error?: string;
        data?: Rapport;
      }>(rapRes);
      if (!rapRes.ok || !rapJson.success) {
        throw new Error(rapJson.error || "Rapport introuvable.");
      }
      const act = actJson.data as Activity;
      const rap = rapJson.data as Rapport;
      setActivity(act);
      setRapport(rap);
      const parsed = parseReportPayload(
        rap.rapport ?? "",
        act,
        redacteurDefaultRef.current
      );
      setReport(parsed);
      setInitialSerialized(JSON.stringify(parsed));
      transientSurfaceRetryRef.current = 0;
    } catch (e) {
      if (isAbortError(e)) {
        return;
      }
      if (
        isTransientFetchError(e) &&
        transientSurfaceRetryRef.current < maxSurfaceWaits
      ) {
        transientSurfaceRetryRef.current += 1;
        deferLoadingEndForSurfaceRetry = true;
        if (surfaceRetryTimeoutRef.current) {
          clearTimeout(surfaceRetryTimeoutRef.current);
        }
        const waitMs = 5000 * transientSurfaceRetryRef.current;
        surfaceRetryTimeoutRef.current = setTimeout(() => {
          surfaceRetryTimeoutRef.current = null;
          void loadData();
        }, waitMs);
        return;
      }
      transientSurfaceRetryRef.current = 0;
      const msg = formatFetchError(e);
      if (msg) {
        setError(msg);
        setActivity(null);
        setRapport(null);
      }
    } finally {
      if (!ac.signal.aborted && !deferLoadingEndForSurfaceRetry) {
        setLoading(false);
      }
    }
  }, [activityId, clerkLoaded]);

  useEffect(() => {
    if (serverInitial?.status === "ok") return;
    if (
      serverInitial?.status === "unauthorized" ||
      serverInitial?.status === "not_found"
    ) {
      return;
    }
    void loadData();
    return () => {
      loadDataAbortRef.current?.abort();
      if (surfaceRetryTimeoutRef.current) {
        clearTimeout(surfaceRetryTimeoutRef.current);
        surfaceRetryTimeoutRef.current = null;
      }
    };
  }, [loadData, serverInitial]);

  const loadRegistered = useCallback(async () => {
    if (!activityId) return;
    setRegisteredLoading(true);
    try {
      const res = await fetchWithRetry(
        apiUrl(`/api/public/participants/${activityId}`)
      );
      const json = await parseResponseJson<{
        success: boolean;
        error?: string;
        data?: { participants: RegisteredParticipant[] };
      }>(res);
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Liste indisponible");
      }
      setRegistered(json.data?.participants ?? []);
    } catch (e) {
      toastFetchError(e);
    } finally {
      setRegisteredLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (!activityId) return;
    void loadRegistered();
  }, [activityId, loadRegistered]);

  useEffect(() => {
    if (!qrOpen || !activityId) return;
    void loadRegistered();
  }, [qrOpen, activityId, loadRegistered]);

  const handleSave = async () => {
    if (!activityId) return;
    const body = JSON.stringify(report);
    if (!body.trim()) {
      toast.error("Rapport vide");
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithRetry(
        apiUrl(`/api/agenda/${activityId}/rapport`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rapport: body }),
        }
      );
      const json = await parseResponseJson<{
        success: boolean;
        error?: string;
        data?: Rapport;
      }>(res);
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement échoué");
      }
      setRapport(json.data as Rapport);
      setInitialSerialized(body);
      toast.success("Rapport enregistré");
      void loadRegistered();
    } catch (e) {
      toastFetchError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRapport = async () => {
    if (!activityId || !rapport?.id) return;
    if (!confirm("Supprimer définitivement ce rapport ?")) return;
    setDeleting(true);
    try {
      const res = await fetchWithRetry(
        apiUrl(`/api/agenda/${activityId}/rapport`),
        { method: "DELETE" }
      );
      const json = await parseResponseJson<{
        success: boolean;
        error?: string;
      }>(res);
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression échouée");
      }
      const empty = parseReportPayload("", activity, currentUserFullName);
      setReport(empty);
      setInitialSerialized(JSON.stringify(empty));
      setRapport({ id: null, rapport: "", createdAt: null, updatedAt: null });
      toast.success("Rapport supprimé");
      void loadRegistered();
    } catch (e) {
      toastFetchError(e);
    } finally {
      setDeleting(false);
    }
  };

  const addManualParticipant = async () => {
    if (!activityId) return;
    setAddingManual(true);
    try {
      const res = await fetchWithRetry(
        apiUrl(`/api/public/participants/${activityId}`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: manualNom,
            prenom: manualPrenom,
            telephone: manualTelephone,
            email: manualEmail || undefined,
          }),
        }
      );
      const json = await parseResponseJson<{ success: boolean; error?: string }>(
        res
      );
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Ajout impossible");
      }
      setManualNom("");
      setManualPrenom("");
      setManualTelephone("");
      setManualEmail("");
      toast.success("Participant ajouté");
      void loadRegistered();
    } catch (e) {
      toastFetchError(e);
    } finally {
      setAddingManual(false);
    }
  };

  const activityDateLabel = useMemo(() => {
    if (!activity?.date) return "";
    try {
      return format(parseISO(activity.date), "EEEE d MMMM yyyy", { locale: fr });
    } catch {
      return activity.date;
    }
  }, [activity?.date]);

  const rapportUpdatedLabel = useMemo(() => {
    if (!rapport?.updatedAt) return null;
    try {
      return format(new Date(rapport.updatedAt), "d MMM yyyy · HH:mm", {
        locale: fr,
      });
    } catch {
      return null;
    }
  }, [rapport?.updatedAt]);

  if (!activityId) {
    return (
      <div className="relative min-h-[70vh] overflow-hidden bg-gradient-to-br from-slate-100 via-white to-indigo-50/60 px-4 py-16">
        <div className="relative mx-auto max-w-md rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-xl">
          <h1 className="text-lg font-semibold text-slate-900">
            Aucune activité sélectionnée
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Ouvrez une activité depuis l’agenda, ou{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">?activityId=…</code>
          </p>
          <Button className="mt-8 rounded-xl" asChild>
            <Link href="/assistante/agenda">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l’agenda
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-600">Chargement du rapport…</p>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="relative min-h-[60vh] overflow-hidden bg-gradient-to-br from-rose-50/80 via-white to-slate-50 px-4 py-16">
        <div className="relative mx-auto max-w-md rounded-3xl border border-rose-100/80 bg-white/90 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-rose-800">
            {error || "Activité introuvable."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {activityId ? (
              <Button
                className="rounded-xl"
                onClick={() => void loadData()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            ) : null}
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/assistante/agenda">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Agenda
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-100 via-white to-indigo-50/45">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 shrink-0 rounded-xl"
              onClick={() => router.push("/assistante/agenda")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Agenda
            </Button>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            <Badge
              variant="secondary"
              className={clsx(
                "rounded-lg border-0",
                isDirty
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-100 text-emerald-900"
              )}
            >
              {isDirty ? "Modifications non enregistrées" : "Enregistré"}
            </Badge>
            {rapportUpdatedLabel ? (
              <span className="text-xs text-slate-500">{rapportUpdatedLabel}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="mr-1 h-4 w-4" />
              QR
            </Button>
            {rapport?.id ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-rose-700"
                onClick={() => void handleDeleteRapport()}
                disabled={deleting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Supprimer
              </Button>
            ) : null}
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <div
          className={clsx(
            "overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br p-6 text-white shadow-lg",
            "bg-gradient-to-br",
            color.hero
          )}
        >
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {activity.titre}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {activityDateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {activity.startTime} – {activity.endTime}
            </span>
            {activity.lieu ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {activity.lieu}
              </span>
            ) : null}
          </div>
        </div>

        <FormSection
          title="En-tête"
          icon={FileText}
          theme={color}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Lieu (réunion)</Label>
              <Input
                className={clsx("mt-1.5", inputClassName)}
                value={report.header.lieu}
                onChange={(e) =>
                  setReport((r) => ({
                    ...r,
                    header: { ...r.header, lieu: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Organisateur</Label>
              <Input
                className={clsx("mt-1.5", inputClassName)}
                value={report.header.organisateur}
                onChange={(e) =>
                  setReport((r) => ({
                    ...r,
                    header: { ...r.header, organisateur: e.target.value },
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Rédacteur</Label>
              <Input
                className={clsx("mt-1.5", inputClassName)}
                value={report.header.redacteur}
                onChange={(e) =>
                  setReport((r) => ({
                    ...r,
                    header: { ...r.header, redacteur: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Objectif"
          icon={Target}
          theme={color}
        >
          <div className="space-y-4">
            <div>
              <Label>Contexte</Label>
              <Textarea
                className={clsx("mt-1.5 min-h-[88px]", textareaClassName)}
                value={report.objectif.contexte}
                onChange={(e) =>
                  setReport((r) => ({
                    ...r,
                    objectif: { ...r.objectif, contexte: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>But principal</Label>
              <Textarea
                className={clsx("mt-1.5 min-h-[88px]", textareaClassName)}
                value={report.objectif.butPrincipal}
                onChange={(e) =>
                  setReport((r) => ({
                    ...r,
                    objectif: { ...r.objectif, butPrincipal: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Participants"
          description="Présents (une ligne = un nom) et absents"
          icon={Users}
          theme={color}
        >
          <div className="space-y-2">
            {report.participants.presents.map((name, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className={inputClassName}
                  value={name}
                  placeholder="Nom"
                  onChange={(e) => {
                    const next = [...report.participants.presents];
                    next[i] = e.target.value;
                    setReport((r) => ({
                      ...r,
                      participants: { ...r.participants, presents: next },
                    }));
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setReport((r) => ({
                      ...r,
                      participants: {
                        ...r.participants,
                        presents: r.participants.presents.filter(
                          (_, j) => j !== i
                        ),
                      },
                    }));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setReport((r) => ({
                  ...r,
                  participants: {
                    ...r.participants,
                    presents: [...r.participants.presents, ""],
                  },
                }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un présent
            </Button>
            <div className="mt-4 space-y-2">
              {report.participants.absents.map((a, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <Input
                    className={inputClassName + " min-w-[200px] flex-1"}
                    value={a.name}
                    onChange={(e) => {
                      const next = [...report.participants.absents];
                      next[i] = { ...next[i]!, name: e.target.value };
                      setReport((r) => ({
                        ...r,
                        participants: { ...r.participants, absents: next },
                      }));
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={a.excused}
                      onChange={(e) => {
                        const next = [...report.participants.absents];
                        next[i] = { ...next[i]!, excused: e.target.checked };
                        setReport((r) => ({
                          ...r,
                          participants: { ...r.participants, absents: next },
                        }));
                      }}
                    />
                    Excusé
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setReport((r) => ({
                        ...r,
                        participants: {
                          ...r.participants,
                          absents: r.participants.absents.filter(
                            (_, j) => j !== i
                          ),
                        },
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setReport((r) => ({
                  ...r,
                  participants: {
                    ...r.participants,
                    absents: [
                      ...r.participants.absents,
                      { name: "", excused: false },
                    ],
                  },
                }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un absent
            </Button>
          </div>
        </FormSection>

        <FormSection
          title="Ordre du jour"
          icon={ListOrdered}
          theme={color}
        >
          {report.ordreDuJour.map((o, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Input
                className={inputClassName}
                value={o.titre}
                onChange={(e) => {
                  const next = [...report.ordreDuJour];
                  next[i] = { titre: e.target.value };
                  setReport((r) => ({ ...r, ordreDuJour: next }));
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setReport((r) => ({
                    ...r,
                    ordreDuJour: r.ordreDuJour.filter((_, j) => j !== i),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setReport((r) => ({
                ...r,
                ordreDuJour: [...r.ordreDuJour, { titre: "" }],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Point
          </Button>
        </FormSection>

        <FormSection
          title="Déroulement"
          icon={ClipboardList}
          theme={color}
        >
          {report.deroulement.map((d, i) => (
            <div
              key={i}
              className="mb-4 space-y-2 rounded-xl border border-slate-200/80 p-3"
            >
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setReport((r) => ({
                      ...r,
                      deroulement: r.deroulement.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                className={inputClassName}
                placeholder="Titre"
                value={d.titre}
                onChange={(e) => {
                  const next = [...report.deroulement];
                  next[i] = { ...next[i]!, titre: e.target.value };
                  setReport((r) => ({ ...r, deroulement: next }));
                }}
              />
              <Textarea
                className={textareaClassName}
                placeholder="Résumé"
                value={d.resume}
                onChange={(e) => {
                  const next = [...report.deroulement];
                  next[i] = { ...next[i]!, resume: e.target.value };
                  setReport((r) => ({ ...r, deroulement: next }));
                }}
              />
              <Textarea
                className={textareaClassName}
                placeholder="Problèmes"
                value={d.problemes}
                onChange={(e) => {
                  const next = [...report.deroulement];
                  next[i] = { ...next[i]!, problemes: e.target.value };
                  setReport((r) => ({ ...r, deroulement: next }));
                }}
              />
              <Textarea
                className={textareaClassName}
                placeholder="Propositions"
                value={d.propositions}
                onChange={(e) => {
                  const next = [...report.deroulement];
                  next[i] = { ...next[i]!, propositions: e.target.value };
                  setReport((r) => ({ ...r, deroulement: next }));
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setReport((r) => ({
                ...r,
                deroulement: [
                  ...r.deroulement,
                  { titre: "", resume: "", problemes: "", propositions: "" },
                ],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Bloc
          </Button>
        </FormSection>

        <FormSection title="Décisions" icon={CheckCircle2} theme={color}>
          {report.decisions.map((d, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Textarea
                className={textareaClassName}
                value={d}
                onChange={(e) => {
                  const next = [...report.decisions];
                  next[i] = e.target.value;
                  setReport((r) => ({ ...r, decisions: next }));
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setReport((r) => ({
                    ...r,
                    decisions: r.decisions.filter((_, j) => j !== i),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setReport((r) => ({
                ...r,
                decisions: [...r.decisions, ""],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Décision
          </Button>
        </FormSection>

        <FormSection title="Actions" icon={ListOrdered} theme={color}>
          {report.actions.map((a, i) => (
            <div
              key={i}
              className="mb-3 grid gap-2 rounded-xl border border-slate-200/80 p-3 sm:grid-cols-3"
            >
              <Input
                className={inputClassName}
                placeholder="Action"
                value={a.action}
                onChange={(e) => {
                  const next = [...report.actions];
                  next[i] = { ...next[i]!, action: e.target.value };
                  setReport((r) => ({ ...r, actions: next }));
                }}
              />
              <Input
                className={inputClassName}
                placeholder="Responsable"
                value={a.responsable}
                onChange={(e) => {
                  const next = [...report.actions];
                  next[i] = { ...next[i]!, responsable: e.target.value };
                  setReport((r) => ({ ...r, actions: next }));
                }}
              />
              <div className="flex gap-2 sm:col-span-1">
                <Input
                  type="date"
                  className={inputClassName}
                  value={a.echeance}
                  onChange={(e) => {
                    const next = [...report.actions];
                    next[i] = { ...next[i]!, echeance: e.target.value };
                    setReport((r) => ({ ...r, actions: next }));
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setReport((r) => ({
                      ...r,
                      actions: r.actions.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setReport((r) => ({
                ...r,
                actions: [
                  ...r.actions,
                  { action: "", responsable: "", echeance: "" },
                ],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Action
          </Button>
        </FormSection>

        <FormSection
          title="Difficultés & risques"
          icon={Flag}
          theme={color}
        >
          <div>
            <Label>Problèmes</Label>
            <Textarea
              className={clsx("mt-1.5 min-h-[80px]", textareaClassName)}
              value={report.difficultes.problemes}
              onChange={(e) =>
                setReport((r) => ({
                  ...r,
                  difficultes: {
                    ...r.difficultes,
                    problemes: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div>
            <Label>Risques</Label>
            <Textarea
              className={clsx("mt-1.5 min-h-[80px]", textareaClassName)}
              value={report.difficultes.risques}
              onChange={(e) =>
                setReport((r) => ({
                  ...r,
                  difficultes: { ...r.difficultes, risques: e.target.value },
                }))
              }
            />
          </div>
        </FormSection>

        <FormSection
          title="Prochaines étapes"
          description="Prochaine date de suivi (optionnel)"
          icon={Clock}
          theme={color}
        >
          <div>
            <Label>Actions à venir (texte libre)</Label>
            <Textarea
              className={clsx("mt-1.5 min-h-[80px]", textareaClassName)}
              value={report.prochainesEtapes.actionsFutures}
              onChange={(e) =>
                setReport((r) => ({
                  ...r,
                  prochainesEtapes: {
                    ...r.prochainesEtapes,
                    actionsFutures: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div>
            <Label>Date prochaine</Label>
            <Input
              type="date"
              className={clsx("mt-1.5 w-full max-w-xs", inputClassName)}
              value={report.prochainesEtapes.dateProchaine}
              onChange={(e) =>
                setReport((r) => ({
                  ...r,
                  prochainesEtapes: {
                    ...r.prochainesEtapes,
                    dateProchaine: e.target.value,
                  },
                }))
              }
            />
          </div>
        </FormSection>

        <FormSection title="Conclusion" icon={FileText} theme={color}>
          {(["resume", "impression", "importance"] as const).map((key) => (
            <div key={key}>
              <Label className="capitalize">{key}</Label>
              <Textarea
                className={clsx("mt-1.5 min-h-[88px]", textareaClassName)}
                value={report.conclusion[key]}
                onChange={(e) =>
                  setReport((r) => ({
                    ...r,
                    conclusion: { ...r.conclusion, [key]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
        </FormSection>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inscription participants (QR)</DialogTitle>
            <DialogDescription>
              Partagez le lien. Les inscrits apparaissent ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {publicUrl ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={publicUrl} size={180} />
              </div>
              <p className="break-all text-center text-xs text-slate-500">
                {publicUrl}
              </p>
            </div>
          ) : null}
          <div className="space-y-2 text-sm">
            <p className="font-medium text-slate-700">Inscrits</p>
            {registeredLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-slate-600">
                {registered.map((p) => (
                  <li key={p.id}>
                    {p.prenom} {p.nom} — {p.telephone}
                  </li>
                ))}
                {registered.length === 0 ? (
                  <li className="text-slate-400">Aucun pour l’instant</li>
                ) : null}
              </ul>
            )}
            <p className="pt-2 font-medium text-slate-700">Ajout manuel</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Nom"
                value={manualNom}
                onChange={(e) => setManualNom(e.target.value)}
              />
              <Input
                placeholder="Prénom"
                value={manualPrenom}
                onChange={(e) => setManualPrenom(e.target.value)}
              />
              <Input
                placeholder="Téléphone"
                value={manualTelephone}
                onChange={(e) => setManualTelephone(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={() => void addManualParticipant()}
              disabled={addingManual}
            >
              {addingManual ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
