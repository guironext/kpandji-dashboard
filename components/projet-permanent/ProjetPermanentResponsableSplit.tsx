"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  LayoutPanelLeft,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  terminerTache,
  updateTacheStatut,
  validateTache,
  type TacheActiviteProjetRoutineListItem,
} from "@/lib/actions/tache-activite-projet-routine";
import { isTacheCreatorUser } from "@/lib/tache-activite-projet-routine-creator";
import {
  getUsersForProjectActors,
  type UserForActorOption,
} from "@/lib/actions/communication-actor";
import { getOrCreateUser } from "@/lib/actions/user";
import {
  TACHE_STATUT_COLUMNS,
  getTacheStatutConfig,
  getTacheStatutProgress,
  getTacheTimeProgress,
  type StatutTacheActiviteProjetRoutine,
} from "@/lib/tache-activite-projet-routine-statut";
import { getEnAttenteChatPromptTacheIds } from "@/lib/actions/tache-activite-projet-routine-chat";
import ActiviteChatButton from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteChatButton";
import ActiviteStatutActionBar from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteStatutActionBar";
import ActiviteLoadDocumentButton from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteLoadDocumentButton";
import ActiviteValidateButton from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteValidateButton";
import ActiviteCreatorValidationBar from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteCreatorValidationBar";
import ClickableActiviteDescription from "@/app/(dashboard)/communication/projets-ponctuels/ClickableActiviteDescription";
import TacheChatDialog from "@/components/projet-permanent/TacheChatDialog";
import TacheDocumentUploadDialog from "@/components/projet-permanent/TacheDocumentUploadDialog";
import TacheViewDocumentsDialog from "@/components/projet-permanent/TacheViewDocumentsDialog";
import TransferTacheDialog from "@/components/projet-permanent/TransferTacheDialog";

type Props = {
  initialTaches: TacheActiviteProjetRoutineListItem[];
};

type ActivityGroup = {
  key: string;
  libelle: string;
  roleMissionLibelle: string;
  mois: string | null;
  taches: TacheActiviteProjetRoutineListItem[];
};

type MobilePane = "list" | "detail";

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function isTacheResponsable(
  tache: TacheActiviteProjetRoutineListItem,
  currentUserId: string | null
) {
  if (!currentUserId) return false;
  return tache.responsables.some((r) => r.userId === currentUserId);
}

function isTacheCreator(
  tache: TacheActiviteProjetRoutineListItem,
  currentUserId: string | null
) {
  return isTacheCreatorUser(tache, currentUserId);
}

export default function ProjetPermanentResponsableSplit({ initialTaches }: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [allTaches, setAllTaches] = useState(initialTaches);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTaches[0]?.id ?? null
  );
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [chatTache, setChatTache] = useState<TacheActiviteProjetRoutineListItem | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEnAttentePrompt, setChatEnAttentePrompt] = useState(false);
  const [chatOpenRequestId, setChatOpenRequestId] = useState(0);
  const [transferTache, setTransferTache] = useState<TacheActiviteProjetRoutineListItem | null>(
    null
  );
  const [transferOpen, setTransferOpen] = useState(false);
  const [documentTache, setDocumentTache] = useState<TacheActiviteProjetRoutineListItem | null>(
    null
  );
  const [documentOpen, setDocumentOpen] = useState(false);
  const [viewDocumentsTache, setViewDocumentsTache] =
    useState<TacheActiviteProjetRoutineListItem | null>(null);
  const [viewDocumentsOpen, setViewDocumentsOpen] = useState(false);
  const [users, setUsers] = useState<UserForActorOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const autoPromptedRef = useRef(false);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAllTaches(initialTaches);
    setSelectedId((prev) => {
      if (prev && initialTaches.some((t) => t.id === prev)) return prev;
      return initialTaches[0]?.id ?? null;
    });
  }, [initialTaches]);

  useEffect(() => {
    if (!clerkLoaded || !clerkUser?.id) return;
    let cancelled = false;
    void getOrCreateUser(clerkUser.id).then((result) => {
      if (!cancelled && result.success && result.data) {
        setCurrentUserId(result.data.id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkUser?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const result = await getUsersForProjectActors();
        if (!cancelled && result.success) setUsers(result.users);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };
    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo((): ActivityGroup[] => {
    const map = new Map<string, ActivityGroup>();
    for (const tache of allTaches) {
      const key = tache.activiteProjetRoutineId;
      const existing = map.get(key);
      if (existing) {
        existing.taches.push(tache);
      } else {
        map.set(key, {
          key,
          libelle: tache.activiteLibelle,
          roleMissionLibelle: tache.roleMissionLibelle,
          mois: tache.activiteMois,
          taches: [tache],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  }, [allTaches]);

  const selectedTache = useMemo(
    () => allTaches.find((t) => t.id === selectedId) ?? null,
    [allTaches, selectedId]
  );

  const globalProgress = useMemo(() => {
    if (allTaches.length === 0) return 0;
    const total = allTaches.reduce((sum, t) => sum + getTacheStatutProgress(t.statutTache), 0);
    return Math.round(total / allTaches.length);
  }, [allTaches]);

  const nouvellesCount = useMemo(
    () => allTaches.filter((t) => t.statutTache === "NOUVEAU").length,
    [allTaches]
  );

  const enCoursCount = useMemo(
    () => allTaches.filter((t) => t.statutTache === "EN_COURS").length,
    [allTaches]
  );

  const updateTacheInList = useCallback((updated: TacheActiviteProjetRoutineListItem) => {
    setAllTaches((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const selectTache = useCallback((tacheId: string) => {
    setSelectedId(tacheId);
    setMobilePane("detail");
    requestAnimationFrame(() => {
      detailScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const backToList = useCallback(() => {
    setMobilePane("list");
  }, []);

  const handleValidate = useCallback(
    async (tache: TacheActiviteProjetRoutineListItem) => {
      if (!clerkLoaded || !clerkUser?.id) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      setUpdatingId(tache.id);
      try {
        const result = await validateTache(
          tache.id,
          tache.activiteProjetRoutineId,
          clerkUser.id
        );
        if (result.success) {
          updateTacheInList(result.tache);
          toast.success("Tâche validée.");
        } else {
          toast.error(result.error ?? "Erreur lors de la validation.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors de la validation.");
      } finally {
        setUpdatingId(null);
      }
    },
    [clerkLoaded, clerkUser?.id, updateTacheInList]
  );

  const handleTerminer = useCallback(
    async (tache: TacheActiviteProjetRoutineListItem) => {
      if (!clerkLoaded || !clerkUser?.id) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      if (!confirm("Marquer cette tâche comme terminée ?")) return;
      setUpdatingId(tache.id);
      try {
        const result = await terminerTache(
          tache.id,
          tache.activiteProjetRoutineId,
          clerkUser.id
        );
        if (result.success) {
          updateTacheInList(result.tache);
          toast.success("Tâche terminée.");
        } else {
          toast.error(result.error ?? "Erreur lors de la clôture.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors de la clôture.");
      } finally {
        setUpdatingId(null);
      }
    },
    [clerkLoaded, clerkUser?.id, updateTacheInList]
  );

  const handleTacheStatutUpdated = useCallback(
    (tacheId: string, statutTache: StatutTacheActiviteProjetRoutine) => {
      setAllTaches((prev) => prev.map((t) => (t.id === tacheId ? { ...t, statutTache } : t)));
      setChatTache((prev) => (prev?.id === tacheId ? { ...prev, statutTache } : prev));
    },
    []
  );

  const openViewDocumentsDialog = useCallback((tache: TacheActiviteProjetRoutineListItem) => {
    setViewDocumentsTache(tache);
    setViewDocumentsOpen(true);
  }, []);

  const openDocumentDialog = useCallback((tache: TacheActiviteProjetRoutineListItem) => {
    setDocumentTache(tache);
    setDocumentOpen(true);
  }, []);

  const openTransferDialog = useCallback((tache: TacheActiviteProjetRoutineListItem) => {
    setTransferTache(tache);
    setTransferOpen(true);
  }, []);

  const openChatDialog = useCallback(
    (tache: TacheActiviteProjetRoutineListItem, enAttentePrompt = false) => {
      setChatTache(tache);
      setChatEnAttentePrompt(enAttentePrompt);
      setChatOpenRequestId((id) => id + 1);
      setChatOpen(true);
    },
    []
  );

  const promptEnAttenteChat = useCallback(
    async (tache: TacheActiviteProjetRoutineListItem) => {
      const promptIds = await getEnAttenteChatPromptTacheIds([tache.id], clerkUser?.id);
      if (promptIds.includes(tache.id)) {
        openChatDialog(tache, true);
      }
    },
    [clerkUser?.id, openChatDialog]
  );

  useEffect(() => {
    if (autoPromptedRef.current || allTaches.length === 0 || chatOpen || !clerkUser?.id) return;

    const run = async () => {
      const promptIds = await getEnAttenteChatPromptTacheIds(
        allTaches.map((t) => t.id),
        clerkUser.id
      );
      if (promptIds.length === 0) return;
      const tache = allTaches.find((t) => t.id === promptIds[0]);
      if (tache) {
        autoPromptedRef.current = true;
        openChatDialog(tache, true);
      }
    };

    void run();
  }, [allTaches, chatOpen, clerkUser?.id, openChatDialog]);

  const handleStatutChange = useCallback(
    async (tache: TacheActiviteProjetRoutineListItem, targetStatut: StatutTacheActiviteProjetRoutine) => {
      if (!clerkLoaded || !clerkUser?.id) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      if (tache.statutTache === targetStatut) return;

      setUpdatingId(tache.id);
      const previous = allTaches;
      setAllTaches((prev) =>
        prev.map((t) => (t.id === tache.id ? { ...t, statutTache: targetStatut } : t))
      );

      try {
        const result = await updateTacheStatut(
          tache.id,
          tache.activiteProjetRoutineId,
          targetStatut,
          clerkUser.id
        );
        if (result.success) {
          updateTacheInList(result.tache);
          toast.success("Statut de la tâche mis à jour.");
          if (targetStatut === "EN_ATTENTE") {
            void promptEnAttenteChat(result.tache);
          }
        } else {
          setAllTaches(previous);
          toast.error(result.error ?? "Erreur lors de la mise à jour.");
        }
      } catch (error) {
        console.error(error);
        setAllTaches(previous);
        toast.error("Erreur lors de la mise à jour.");
      } finally {
        setUpdatingId(null);
      }
    },
    [allTaches, clerkLoaded, clerkUser?.id, promptEnAttenteChat, updateTacheInList]
  );

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isUpdating = selectedTache ? updatingId === selectedTache.id : false;
  const statutConfig = selectedTache ? getTacheStatutConfig(selectedTache.statutTache) : null;
  const statusProgress = selectedTache
    ? getTacheStatutProgress(selectedTache.statutTache)
    : 0;
  const timeProgress = selectedTache
    ? getTacheTimeProgress(selectedTache.dateDebut, selectedTache.dateCloture)
    : null;
  const isEnAttenteValidation = selectedTache?.statutTache === "EN_ATTENTE_VALIDATION";
  const isValidee = selectedTache?.statutTache === "VALIDEE";
  const isTerminee = selectedTache?.statutTache === "TERMINEE";
  const statusLocked = isValidee || isTerminee;
  const isCreator = selectedTache ? isTacheCreator(selectedTache, currentUserId) : false;
  const isResponsable = selectedTache
    ? isTacheResponsable(selectedTache, currentUserId)
    : false;

  const showMobileList = mobilePane === "list";
  const showMobileDetail = mobilePane === "detail";

  return (
    <div className="relative flex min-h-[calc(100dvh-5.5rem)] flex-col bg-gradient-to-b from-violet-50/40 via-white to-fuchsia-50/30 lg:h-[calc(100vh-5.5rem)] lg:min-h-[32rem] lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.12),transparent)]"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-6 lg:py-5">
        {/* Header — compact on mobile, fuller on desktop */}
        <header
          className={cn(
            "mb-3 shrink-0 overflow-hidden rounded-2xl border border-violet-200/50 bg-white/80 shadow-sm shadow-violet-100/40 backdrop-blur-sm sm:mb-4",
            showMobileDetail && "hidden lg:block"
          )}
        >
          <div className="bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/40 p-3.5 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 sm:h-11 sm:w-11 sm:rounded-2xl">
                <LayoutPanelLeft className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700 hover:bg-violet-100 sm:text-xs">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Mes tâches
                  </Badge>
                </div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-xl">
                  Projets permanents
                </h1>
                <p className="mt-0.5 hidden text-sm text-slate-600 sm:block">
                  Sélectionnez une tâche pour voir le détail et agir.
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
              <div className="rounded-xl border border-violet-100/80 bg-white/90 px-2.5 py-2 sm:px-4 sm:py-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  Total
                </p>
                <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                  {allTaches.length}
                </p>
              </div>
              <div className="rounded-xl border border-indigo-100/80 bg-white/90 px-2.5 py-2 sm:px-4 sm:py-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600 sm:text-[10px]">
                  Nouvelles
                </p>
                <p className="text-lg font-bold tabular-nums text-indigo-700 sm:text-xl">
                  {nouvellesCount}
                </p>
              </div>
              <div className="rounded-xl border border-sky-100/80 bg-white/90 px-2.5 py-2 sm:px-4 sm:py-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-600 sm:text-[10px]">
                  En cours
                </p>
                <p className="text-lg font-bold tabular-nums text-sky-700 sm:text-xl">
                  {enCoursCount}
                </p>
              </div>
            </div>

            <div className="mt-2.5 sm:mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500 sm:text-xs">
                <span className="font-medium">Avancement global</span>
                <span className="font-semibold tabular-nums text-slate-700">{globalProgress}%</span>
              </div>
              <Progress value={globalProgress} className="h-1.5 sm:h-2" />
            </div>
          </div>
        </header>

        {allTaches.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-white/60 px-6 py-16 text-center backdrop-blur-sm">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <ClipboardList className="h-7 w-7 text-violet-500" />
              </div>
              <p className="text-base font-semibold text-slate-800">Aucune tâche</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Vous n&apos;avez pas encore été désigné responsable d&apos;une tâche.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(17rem,22rem)_1fr] lg:gap-4">
            {/* LIST PANE */}
            <aside
              className={cn(
                "min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm",
                showMobileList ? "flex" : "hidden",
                "lg:flex"
              )}
            >
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Activités · {groups.length}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 lg:hidden">
                  Touchez une tâche pour ouvrir le détail
                </p>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-2.5">
                {groups.map((group) => {
                  const collapsed = collapsedGroups[group.key];
                  return (
                    <div key={group.key} className="mb-1.5">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition-colors active:bg-violet-50 hover:bg-violet-50/80"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 text-violet-500 transition-transform duration-200",
                            !collapsed && "rotate-90"
                          )}
                        />
                        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                          {group.libelle}
                        </span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-violet-50 text-[10px] text-violet-700"
                        >
                          {group.taches.length}
                        </Badge>
                      </button>

                      {!collapsed && (
                        <ul className="space-y-1 pb-1 pl-1 sm:ml-2 sm:border-l sm:border-violet-100 sm:pl-2">
                          {group.taches.map((tache) => {
                            const cfg = getTacheStatutConfig(tache.statutTache);
                            const active = tache.id === selectedId;
                            return (
                              <li key={tache.id}>
                                <button
                                  type="button"
                                  onClick={() => selectTache(tache.id)}
                                  className={cn(
                                    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 active:scale-[0.99]",
                                    active
                                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20"
                                      : "border border-slate-100 bg-slate-50/60 text-slate-700 hover:border-violet-200 hover:bg-white lg:border-transparent lg:bg-transparent lg:hover:bg-slate-50"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2",
                                      active
                                        ? "bg-white/90 ring-white/30"
                                        : cn(cfg.dotClass, "ring-transparent")
                                    )}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={cn(
                                        "block text-sm font-medium leading-snug",
                                        active ? "text-white" : "text-slate-800"
                                      )}
                                    >
                                      {tache.libelle}
                                    </span>
                                    <span
                                      className={cn(
                                        "mt-1 flex items-center gap-1.5 text-[11px]",
                                        active ? "text-white/75" : "text-slate-500"
                                      )}
                                    >
                                      <span>{cfg.shortLabel}</span>
                                      {tache.dateCloture ? (
                                        <>
                                          <span className={active ? "text-white/40" : "text-slate-300"}>
                                            ·
                                          </span>
                                          <span className="tabular-nums">
                                            {formatDate(tache.dateCloture)}
                                          </span>
                                        </>
                                      ) : null}
                                    </span>
                                  </span>
                                  <ChevronRight
                                    className={cn(
                                      "mt-1 h-4 w-4 shrink-0 lg:hidden",
                                      active ? "text-white/80" : "text-slate-300"
                                    )}
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* DETAIL PANE */}
            <section
              className={cn(
                "min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm",
                showMobileDetail ? "flex" : "hidden",
                "lg:flex",
                isUpdating && "opacity-70"
              )}
            >
              {!selectedTache || !statutConfig ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                  <FolderKanban className="h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    Sélectionnez une tâche pour voir son détail.
                  </p>
                </div>
              ) : (
                <>
                  <header className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-violet-50/70 via-white to-fuchsia-50/40 px-3 py-3 sm:px-6 sm:py-4">
                    <button
                      type="button"
                      onClick={backToList}
                      className="mb-2.5 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-violet-700 transition-colors active:bg-violet-100 hover:bg-violet-50 lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour à la liste
                    </button>

                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                      <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{selectedTache.activiteLibelle}</span>
                      {selectedTache.activiteMois ? (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 normal-case tracking-normal">
                            {selectedTache.activiteMois}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <h2 className="text-lg font-bold leading-snug text-slate-900 sm:text-2xl">
                      {selectedTache.libelle}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      {selectedTache.roleMissionLibelle}
                    </p>
                  </header>

                  <div
                    ref={detailScrollRef}
                    className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5"
                  >
                    {/* Status + progress — stacked on mobile, 3-col on sm+ */}
                    <div className="mb-5 grid gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-3.5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Statut
                        </p>
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statutConfig.dotClass)}
                          />
                          <span className="text-sm font-semibold text-slate-800">
                            {statutConfig.label}
                          </span>
                        </div>
                        {!statusLocked ? (
                          <Select
                            value={selectedTache.statutTache}
                            onValueChange={(value) =>
                              void handleStatutChange(
                                selectedTache,
                                value as StatutTacheActiviteProjetRoutine
                              )
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-violet-200 bg-white text-sm font-medium text-violet-800 sm:h-9 sm:text-xs">
                              <SelectValue placeholder="Changer le statut" />
                            </SelectTrigger>
                            <SelectContent>
                              {TACHE_STATUT_COLUMNS.filter(
                                (col) => col.value !== "VALIDEE" && col.value !== "TERMINEE"
                              ).map((col) => (
                                <SelectItem key={col.value} value={col.value} className="text-sm">
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:contents">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Progression
                          </p>
                          <p className="mb-2 text-2xl font-bold tabular-nums text-slate-900">
                            {statusProgress}%
                          </p>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                statutConfig.barClass
                              )}
                              style={{ width: `${statusProgress}%` }}
                            />
                          </div>
                          {timeProgress !== null && (
                            <div className="mt-3">
                              <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                                <span>Temps écoulé</span>
                                <span className="tabular-nums">{timeProgress}%</span>
                              </div>
                              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/60">
                                <div
                                  className="h-full rounded-full bg-violet-400/80"
                                  style={{ width: `${timeProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Période
                          </p>
                          <div className="flex items-start gap-2 text-sm text-slate-700">
                            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                            <span className="leading-snug">
                              {formatDate(selectedTache.dateDebut)}
                              {selectedTache.dateCloture
                                ? ` → ${formatDate(selectedTache.dateCloture)}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 sm:mb-6">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Description
                      </p>
                      <ClickableActiviteDescription
                        titre={selectedTache.libelle}
                        description={selectedTache.description ?? ""}
                        className="text-sm leading-relaxed text-slate-700"
                        lineClamp={8}
                      />
                    </div>

                    {selectedTache.responsables.length > 0 && (
                      <div className="mb-5 sm:mb-6">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          <Users className="h-3 w-3" />
                          Responsables
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTache.responsables.map((r) => (
                            <Badge
                              key={r.id}
                              variant="outline"
                              className="border-violet-100 bg-violet-50/50 text-xs font-medium text-violet-800"
                            >
                              {r.userName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Desktop / inline actions */}
                    <div className="mb-20 flex flex-wrap gap-2 lg:mb-0">
                      {!isTerminee && (
                        <ActiviteChatButton onClick={() => openChatDialog(selectedTache)} />
                      )}
                      {isEnAttenteValidation && isResponsable && (
                        <ActiviteLoadDocumentButton
                          onClick={() => openDocumentDialog(selectedTache)}
                        />
                      )}
                      {isEnAttenteValidation && isCreator && !isResponsable && (
                        <ActiviteValidateButton
                          onClick={() => void handleValidate(selectedTache)}
                          isUpdating={isUpdating}
                        />
                      )}
                    </div>
                  </div>

                  {/* Sticky footer actions — mobile-friendly */}
                  <div className="shrink-0 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
                    {isEnAttenteValidation && (
                      <ActiviteCreatorValidationBar
                        onClick={() => openViewDocumentsDialog(selectedTache)}
                        compact
                      />
                    )}
                    {isValidee && (
                      <ActiviteStatutActionBar
                        statutActivite="VALIDEE"
                        isUpdating={isUpdating}
                        compact
                        onTransfer={() => openTransferDialog(selectedTache)}
                        onTerminer={() => void handleTerminer(selectedTache)}
                      />
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>

      <TransferTacheDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        tache={transferTache}
        users={users}
        isLoadingUsers={isLoadingUsers}
        excludeUserIds={transferTache?.responsables.map((r) => r.userId) ?? []}
        onTransferredAway={() => {
          if (transferTache) {
            setAllTaches((prev) => {
              const next = prev.filter((t) => t.id !== transferTache.id);
              setSelectedId(next[0]?.id ?? null);
              setMobilePane("list");
              return next;
            });
          }
        }}
      />

      <TacheViewDocumentsDialog
        open={viewDocumentsOpen}
        onOpenChange={setViewDocumentsOpen}
        tache={viewDocumentsTache}
      />

      <TacheDocumentUploadDialog
        open={documentOpen}
        onOpenChange={setDocumentOpen}
        tache={documentTache}
      />

      <TacheChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        tache={chatTache}
        openRequestId={chatOpenRequestId}
        enAttentePrompt={chatEnAttentePrompt}
        onTacheUpdated={handleTacheStatutUpdated}
      />
    </div>
  );
}
