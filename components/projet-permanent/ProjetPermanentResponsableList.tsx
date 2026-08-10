"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  ClipboardList,
  FolderKanban,
  ListChecks,
  Sparkles,
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

type StatutFilter = "all" | StatutTacheActiviteProjetRoutine;

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

function TacheListRow({
  tache,
  isUpdating,
  currentUserId,
  onStatutChange,
  onChat,
  onLoadDocument,
  onValidate,
  onViewDocuments,
  onTransfer,
  onTerminer,
}: {
  tache: TacheActiviteProjetRoutineListItem;
  isUpdating: boolean;
  currentUserId: string | null;
  onStatutChange: (statut: StatutTacheActiviteProjetRoutine) => void;
  onChat: () => void;
  onLoadDocument: () => void;
  onValidate: () => void;
  onViewDocuments: () => void;
  onTransfer: () => void;
  onTerminer: () => void;
}) {
  const statutConfig = getTacheStatutConfig(tache.statutTache);
  const statusProgress = getTacheStatutProgress(tache.statutTache);
  const timeProgress = getTacheTimeProgress(tache.dateDebut, tache.dateCloture);
  const isEnAttenteValidation = tache.statutTache === "EN_ATTENTE_VALIDATION";
  const isValidee = tache.statutTache === "VALIDEE";
  const isTerminee = tache.statutTache === "TERMINEE";
  const isCreator = isTacheCreator(tache, currentUserId);
  const isResponsable = isTacheResponsable(tache, currentUserId);
  const statusLocked = isValidee || isTerminee;
  const showChat = !isTerminee;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md",
        isUpdating && "pointer-events-none opacity-60"
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        <div className="flex w-full shrink-0 flex-col justify-between gap-3 sm:w-44">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statutConfig.dotClass)} />
              <span className="text-xs font-semibold text-slate-700">{statutConfig.label}</span>
            </div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Progression
              </span>
              <span className="text-xs font-bold tabular-nums text-slate-700">
                {statusProgress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={cn("h-full rounded-full transition-all duration-500", statutConfig.barClass)}
                style={{ width: `${statusProgress}%` }}
              />
            </div>
            {timeProgress !== null && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Temps écoulé</span>
                  <span className="font-medium tabular-nums">{timeProgress}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/60">
                  <div
                    className="h-full rounded-full bg-violet-400/80 transition-all"
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {!statusLocked ? (
            <Select
              value={tache.statutTache}
              onValueChange={(value) =>
                onStatutChange(value as StatutTacheActiviteProjetRoutine)
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="h-9 rounded-xl border-violet-200 bg-violet-50/60 text-xs font-medium text-violet-800">
                <SelectValue placeholder="Changer le statut" />
              </SelectTrigger>
              <SelectContent>
                {TACHE_STATUT_COLUMNS.filter(
                  (col) => col.value !== "VALIDEE" && col.value !== "TERMINEE"
                ).map((col) => (
                  <SelectItem key={col.value} value={col.value} className="text-xs">
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant="outline"
              className="w-fit border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600"
            >
              {statutConfig.shortLabel}
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
            <FolderKanban className="h-3 w-3 shrink-0" />
            <span className="truncate">{tache.activiteLibelle}</span>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="truncate">{tache.roleMissionLibelle}</span>
            {tache.activiteMois ? (
              <>
                <span>·</span>
                <span className="truncate">{tache.activiteMois}</span>
              </>
            ) : null}
          </div>

          <h3 className="text-sm font-bold leading-snug text-slate-900 sm:text-base">
            {tache.libelle}
          </h3>
          <ClickableActiviteDescription
            titre={tache.libelle}
            description={tache.description ?? ""}
            className="mt-1 text-xs sm:text-sm"
            lineClamp={3}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span>
                {formatDate(tache.dateDebut)}
                {tache.dateCloture ? ` → ${formatDate(tache.dateCloture)}` : ""}
              </span>
            </div>
            {showChat && <ActiviteChatButton onClick={onChat} size="xs" />}
            {isEnAttenteValidation && isResponsable && (
              <ActiviteLoadDocumentButton onClick={onLoadDocument} size="xs" />
            )}
            {isEnAttenteValidation && isCreator && !isResponsable && (
              <ActiviteValidateButton onClick={onValidate} isUpdating={isUpdating} size="xs" />
            )}
          </div>
        </div>
      </div>

      {isEnAttenteValidation && (
        <ActiviteCreatorValidationBar onClick={onViewDocuments} compact />
      )}

      {isValidee && (
        <ActiviteStatutActionBar
          statutActivite="VALIDEE"
          isUpdating={isUpdating}
          compact
          onTransfer={onTransfer}
          onTerminer={onTerminer}
        />
      )}
    </article>
  );
}

export default function ProjetPermanentResponsableList({ initialTaches }: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [allTaches, setAllTaches] = useState(initialTaches);
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("all");
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
  const autoPromptedRef = useRef(false);

  useEffect(() => {
    setAllTaches(initialTaches);
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

  const taches = useMemo(() => {
    if (statutFilter === "all") return allTaches;
    return allTaches.filter((t) => t.statutTache === statutFilter);
  }, [allTaches, statutFilter]);

  const tachesByStatut = useMemo(() => {
    const map = Object.fromEntries(
      TACHE_STATUT_COLUMNS.map((col) => [col.value, 0])
    ) as Record<StatutTacheActiviteProjetRoutine, number>;

    for (const tache of allTaches) {
      if (map[tache.statutTache] !== undefined) map[tache.statutTache] += 1;
      else map.NOUVEAU += 1;
    }
    return map;
  }, [allTaches]);

  const globalProgress = useMemo(() => {
    if (allTaches.length === 0) return 0;
    const total = allTaches.reduce((sum, t) => sum + getTacheStatutProgress(t.statutTache), 0);
    return Math.round(total / allTaches.length);
  }, [allTaches]);

  const nouvellesCount = tachesByStatut.NOUVEAU;

  const updateTacheInList = useCallback((updated: TacheActiviteProjetRoutineListItem) => {
    setAllTaches((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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

  return (
    <div className="relative px-4 py-5 sm:px-6 sm:py-6">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/50 p-4 shadow-sm ring-1 ring-violet-100/80 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 sm:h-12 sm:w-12">
            <ListChecks className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
              <Sparkles className="mr-1 h-3 w-3" />
              Mes tâches
            </Badge>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Projets permanents</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Liste de vos tâches permanentes. Filtrez par statut et mettez-les à jour depuis le
              menu déroulant.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-violet-100 bg-white/90 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total tâches
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {allTaches.length}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              Nouvelles
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">{nouvellesCount}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-white/90 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avancement global
            </p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {globalProgress}%
              </span>
              <span className="text-xs text-slate-500">{nouvellesCount} nouvelle(s)</span>
            </div>
            <Progress value={globalProgress} className="mt-2 h-2" />
          </div>
        </div>
      </div>

      {allTaches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-6 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-violet-400" />
          <p className="text-base font-semibold text-slate-800">Aucune tâche</p>
          <p className="mt-1 text-sm text-slate-500">
            Vous n&apos;avez pas encore été désigné responsable d&apos;une tâche.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatutFilter("all")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                statutFilter === "all"
                  ? "border-violet-300 bg-violet-100 text-violet-800 shadow-sm"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:border-violet-200 hover:bg-violet-50"
              )}
            >
              Toutes
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                {allTaches.length}
              </span>
            </button>
            {TACHE_STATUT_COLUMNS.map((col) => {
              const count = tachesByStatut[col.value];
              if (count === 0) return null;
              return (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setStatutFilter(col.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    statutFilter === col.value
                      ? "border-violet-300 bg-violet-100 text-violet-800 shadow-sm"
                      : "border-slate-200 bg-white/80 text-slate-600 hover:border-violet-200 hover:bg-violet-50"
                  )}
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", col.dotClass)} />
                  {col.shortLabel}
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {taches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-8 text-center text-sm text-slate-500">
              Aucune tâche pour ce filtre.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {taches.map((tache) => (
                <TacheListRow
                  key={tache.id}
                  tache={tache}
                  isUpdating={updatingId === tache.id}
                  currentUserId={currentUserId}
                  onStatutChange={(statut) => void handleStatutChange(tache, statut)}
                  onChat={() => openChatDialog(tache)}
                  onLoadDocument={() => openDocumentDialog(tache)}
                  onValidate={() => void handleValidate(tache)}
                  onViewDocuments={() => openViewDocumentsDialog(tache)}
                  onTransfer={() => openTransferDialog(tache)}
                  onTerminer={() => void handleTerminer(tache)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <TransferTacheDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        tache={transferTache}
        users={users}
        isLoadingUsers={isLoadingUsers}
        excludeUserIds={transferTache?.responsables.map((r) => r.userId) ?? []}
        onTransferredAway={() => {
          if (transferTache) {
            setAllTaches((prev) => prev.filter((t) => t.id !== transferTache.id));
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
