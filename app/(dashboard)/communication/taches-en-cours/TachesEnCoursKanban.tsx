"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  ClipboardList,
  FolderKanban,
  GripVertical,
  Rocket,
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
import type { ActiviteProjetRoutineListItem } from "@/lib/actions/activite-projet-routine";
import {
  getUsersForProjectActors,
  type UserForActorOption,
} from "@/lib/actions/communication-actor";
import { getOrCreateUser } from "@/lib/actions/user";
import {
  terminerTache,
  updateTacheStatutOverview,
  validateTache,
  type TacheActiviteProjetRoutineListItem,
} from "@/lib/actions/tache-activite-projet-routine";
import { isTacheCreatorUser } from "@/lib/tache-activite-projet-routine-creator";
import { getEnAttenteChatPromptTacheIds } from "@/lib/actions/tache-activite-projet-routine-chat";
import {
  TACHE_STATUT_COLUMNS,
  getTacheStatutConfig,
  getTacheStatutProgress,
  getTacheTimeProgress,
  type StatutTacheActiviteProjetRoutine,
} from "@/lib/tache-activite-projet-routine-statut";
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

const ALL_ACTIVITES = "__all__";

type Props = {
  initialTaches: TacheActiviteProjetRoutineListItem[];
  activites: ActiviteProjetRoutineListItem[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function responsableInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function isTacheResponsable(
  tache: TacheActiviteProjetRoutineListItem,
  currentUserId: string | null
) {
  if (!currentUserId) return false;
  return tache.responsables.some((r) => r.userId === currentUserId);
}

function canValidateTache(
  tache: TacheActiviteProjetRoutineListItem,
  currentUserId: string | null,
  currentUserRole: string | null
) {
  if (isTacheCreatorUser(tache, currentUserId)) return true;
  // Legacy tâches (before createdByUserId): communication team can validate
  return !tache.createdByUserId && currentUserRole === "COMMUNICATION";
}

function TacheKanbanCard({
  tache,
  isDragging,
  isUpdating,
  onDragStart,
  onDragEnd,
  onChat,
  isResponsable,
  canValidate,
  onLoadDocument,
  onValidate,
  onViewDocuments,
  onTransfer,
  onTerminer,
}: {
  tache: TacheActiviteProjetRoutineListItem;
  isDragging: boolean;
  isUpdating: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onChat: () => void;
  isResponsable: boolean;
  canValidate: boolean;
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
  const showChat = !isTerminee;

  return (
    <article
      draggable={!isUpdating && !isValidee && !isTerminee}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/tache-id", tache.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 transition-all active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-emerald-300",
        isUpdating && "pointer-events-none opacity-60"
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          <FolderKanban className="h-3 w-3 shrink-0" />
          <span className="truncate">{tache.activiteLibelle}</span>
        </div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Progression
          </span>
          <span className="text-xs font-bold tabular-nums text-slate-700">{statusProgress}%</span>
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
                className="h-full rounded-full bg-emerald-400/80 transition-all"
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="mb-2 flex items-start gap-2">
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
              {tache.libelle}
            </h4>
            <ClickableActiviteDescription
              titre={tache.libelle}
              description={tache.description ?? ""}
              className="mt-1 text-xs"
              lineClamp={2}
            />
          </div>
        </div>

        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar className="h-3 w-3 shrink-0 text-emerald-500" />
          <span className="truncate">
            {formatDate(tache.dateDebut)}
            {tache.dateCloture ? ` → ${formatDate(tache.dateCloture)}` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-200 bg-white text-[10px] font-medium text-slate-600"
            >
              {statutConfig.shortLabel}
            </Badge>
            {showChat && <ActiviteChatButton onClick={onChat} size="xs" />}
            {isEnAttenteValidation && isResponsable && (
              <ActiviteLoadDocumentButton onClick={onLoadDocument} size="xs" />
            )}
            {isEnAttenteValidation && canValidate && (
              <ActiviteValidateButton onClick={onValidate} isUpdating={isUpdating} size="xs" />
            )}
          </div>

          {tache.responsables.length > 0 ? (
            <div className="flex -space-x-1.5">
              {tache.responsables.slice(0, 3).map((resp, i) => (
                <span
                  key={resp.id}
                  title={resp.userName}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[9px] font-bold text-white shadow-sm",
                    i === 0 && "from-emerald-500 to-teal-500",
                    i === 1 && "from-sky-500 to-cyan-500",
                    i === 2 && "from-violet-500 to-purple-500"
                  )}
                >
                  {responsableInitials(resp.userName)}
                </span>
              ))}
              {tache.responsables.length > 3 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600">
                  +{tache.responsables.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400">Sans responsable</span>
          )}
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

function KanbanColumn({
  column,
  taches,
  dragOver,
  updatingId,
  draggingId,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  onCardDragEnd,
  onChat,
  currentUserId,
  currentUserRole,
  onLoadDocument,
  onViewDocuments,
  onValidate,
  onTransfer,
  onTerminer,
}: {
  column: (typeof TACHE_STATUT_COLUMNS)[number];
  taches: TacheActiviteProjetRoutineListItem[];
  dragOver: boolean;
  updatingId: string | null;
  draggingId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onCardDragStart: (id: string) => void;
  onCardDragEnd: () => void;
  onChat: (tache: TacheActiviteProjetRoutineListItem) => void;
  currentUserId: string | null;
  currentUserRole: string | null;
  onLoadDocument: (tache: TacheActiviteProjetRoutineListItem) => void;
  onViewDocuments: (tache: TacheActiviteProjetRoutineListItem) => void;
  onValidate: (tache: TacheActiviteProjetRoutineListItem) => void;
  onTransfer: (tache: TacheActiviteProjetRoutineListItem) => void;
  onTerminer: (tache: TacheActiviteProjetRoutineListItem) => void;
}) {
  return (
    <div
      className={cn(
        "flex w-[min(100%,18.5rem)] shrink-0 flex-col rounded-2xl border bg-gradient-to-b shadow-sm transition-all sm:w-72",
        column.headerClass,
        dragOver && "ring-2 ring-emerald-400 ring-offset-2"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="sticky top-0 z-10 rounded-t-2xl border-b border-white/40 bg-white/70 px-3 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", column.dotClass)} />
            <h3 className="truncate text-sm font-bold text-slate-900">{column.label}</h3>
          </div>
          <Badge variant="secondary" className="shrink-0 bg-white/80 text-xs font-semibold">
            {taches.length}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Avancement cible · {column.progress}%</p>
      </header>

      <div className="flex min-h-[12rem] flex-1 flex-col gap-2.5 p-2.5">
        {taches.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/50 px-3 py-8 text-center",
              dragOver && "border-emerald-300 bg-emerald-50/50"
            )}
          >
            <p className="text-xs text-slate-400">Glissez une tâche ici</p>
          </div>
        ) : (
          taches.map((tache) => (
            <TacheKanbanCard
              key={tache.id}
              tache={tache}
              isDragging={draggingId === tache.id}
              isUpdating={updatingId === tache.id}
              onDragStart={() => onCardDragStart(tache.id)}
              onDragEnd={onCardDragEnd}
              onChat={() => onChat(tache)}
              isResponsable={isTacheResponsable(tache, currentUserId)}
              canValidate={canValidateTache(tache, currentUserId, currentUserRole)}
              onLoadDocument={() => onLoadDocument(tache)}
              onValidate={() => onValidate(tache)}
              onViewDocuments={() => onViewDocuments(tache)}
              onTransfer={() => onTransfer(tache)}
              onTerminer={() => onTerminer(tache)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function TachesEnCoursKanban({ initialTaches, activites }: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [allTaches, setAllTaches] = useState(initialTaches);
  const [selectedActiviteId, setSelectedActiviteId] = useState(ALL_ACTIVITES);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatutTacheActiviteProjetRoutine | null>(
    null
  );
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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    setAllTaches(initialTaches);
  }, [initialTaches]);

  const activitesWithTaches = useMemo(() => {
    const ids = new Set(allTaches.map((t) => t.activiteProjetRoutineId));
    return activites.filter((a) => ids.has(a.id));
  }, [activites, allTaches]);

  const selectedActivite = useMemo(
    () =>
      selectedActiviteId === ALL_ACTIVITES
        ? null
        : (activitesWithTaches.find((a) => a.id === selectedActiviteId) ?? null),
    [activitesWithTaches, selectedActiviteId]
  );

  const taches = useMemo(() => {
    if (selectedActiviteId === ALL_ACTIVITES) return allTaches;
    return allTaches.filter((t) => t.activiteProjetRoutineId === selectedActiviteId);
  }, [allTaches, selectedActiviteId]);

  useEffect(() => {
    if (
      selectedActiviteId !== ALL_ACTIVITES &&
      activitesWithTaches.length > 0 &&
      !activitesWithTaches.some((a) => a.id === selectedActiviteId)
    ) {
      setSelectedActiviteId(ALL_ACTIVITES);
    }
  }, [activitesWithTaches, selectedActiviteId]);

  useEffect(() => {
    if (!clerkLoaded || !clerkUser?.id) return;

    let cancelled = false;
    void getOrCreateUser(clerkUser.id).then((result) => {
      if (!cancelled && result.success && result.data) {
        setCurrentUserId(result.data.id);
        setCurrentUserRole(result.data.role ?? null);
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

  const tachesByColumn = useMemo(() => {
    const map = Object.fromEntries(
      TACHE_STATUT_COLUMNS.map((col) => [col.value, [] as TacheActiviteProjetRoutineListItem[]])
    ) as Record<StatutTacheActiviteProjetRoutine, TacheActiviteProjetRoutineListItem[]>;

    for (const tache of taches) {
      const key = tache.statutTache;
      if (map[key]) map[key].push(tache);
      else map.NOUVEAU.push(tache);
    }
    return map;
  }, [taches]);

  const nouvellesCount = tachesByColumn.NOUVEAU.length;

  const globalProgress = useMemo(() => {
    if (taches.length === 0) return 0;
    const total = taches.reduce((sum, t) => sum + getTacheStatutProgress(t.statutTache), 0);
    return Math.round(total / taches.length);
  }, [taches]);

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

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatut: StatutTacheActiviteProjetRoutine) => {
      e.preventDefault();
      setDragOverColumn(null);

      if (!clerkLoaded || !clerkUser?.id) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const tacheId = e.dataTransfer.getData("text/tache-id");
      if (!tacheId) return;

      const tache = allTaches.find((t) => t.id === tacheId);
      if (!tache || tache.statutTache === targetStatut) {
        setDraggingId(null);
        return;
      }

      setUpdatingId(tacheId);
      setDraggingId(null);

      const previous = allTaches;
      setAllTaches((prev) =>
        prev.map((t) => (t.id === tacheId ? { ...t, statutTache: targetStatut } : t))
      );

      try {
        const result = await updateTacheStatutOverview(
          tacheId,
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
          toast.error(result.error ?? "Erreur lors du déplacement.");
        }
      } catch (error) {
        console.error(error);
        setAllTaches(previous);
        toast.error("Erreur lors du déplacement.");
      } finally {
        setUpdatingId(null);
      }
    },
    [allTaches, clerkLoaded, clerkUser?.id, promptEnAttenteChat, updateTacheInList]
  );

  if (allTaches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 shadow-sm ring-1 ring-emerald-200/80">
          <ClipboardList className="h-7 w-7 text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-slate-800">Aucune tâche disponible</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Créez des tâches dans l&apos;onglet &quot;Définir Tâches&quot; des activités routinières.
        </p>
      </div>
    );
  }

  return (
    <div className="relative px-4 py-5 sm:px-6 sm:py-6">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 p-4 shadow-sm ring-1 ring-emerald-100/80 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 sm:h-12 sm:w-12">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <Badge className="mb-2 border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <Sparkles className="mr-1 h-3 w-3" />
                Kanban · Mise en œuvre
              </Badge>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Tâches en cours</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Visualisez les tâches par statut. Glissez-déposez les cartes pour faire avancer
                chaque tâche.
              </p>
            </div>
          </div>

          {activitesWithTaches.length > 0 && (
            <div className="w-full space-y-2 xl:max-w-xs xl:shrink-0">
              <label
                htmlFor="taches-en-cours-activite-select"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Activité routinière
              </label>
              <Select value={selectedActiviteId} onValueChange={setSelectedActiviteId}>
                <SelectTrigger
                  id="taches-en-cours-activite-select"
                  className="h-11 rounded-xl border-emerald-200/80 bg-white shadow-sm"
                >
                  <SelectValue placeholder="Toutes les activités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ACTIVITES}>Toutes les activités</SelectItem>
                  {activitesWithTaches.map((activite) => (
                    <SelectItem key={activite.id} value={activite.id}>
                      {activite.libelle}
                      {activite.mois ? ` · ${activite.mois}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 sm:p-4">
            <p className="text-sm font-semibold text-slate-900">
              {selectedActivite?.libelle ?? "Toutes les activités"}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-emerald-500" />
                {taches.length} tâche{taches.length !== 1 ? "s" : ""}
              </span>
              {selectedActivite?.roleMissionLibelle && (
                <span className="inline-flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5 text-emerald-500" />
                  {selectedActivite.roleMissionLibelle}
                </span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              Nouveau
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">{nouvellesCount}</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avancement global
            </p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {globalProgress}%
              </span>
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <Progress value={globalProgress} className="mt-2 h-2" />
          </div>
        </div>
      </div>

      {taches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <p className="text-base font-semibold text-slate-800">Aucune tâche pour cette activité</p>
          <p className="mt-1 text-sm text-slate-500">
            Sélectionnez une autre activité ou créez des tâches dans les activités routinières.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 hidden text-xs text-slate-500 sm:block">
            Astuce : maintenez et glissez une carte vers une autre colonne pour changer son statut.
          </p>
          <div className="relative -mx-1 px-1 pb-2">
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-200">
              {TACHE_STATUT_COLUMNS.map((column) => (
                <div key={column.value} className="snap-start">
                  <KanbanColumn
                    column={column}
                    taches={tachesByColumn[column.value]}
                    dragOver={dragOverColumn === column.value}
                    updatingId={updatingId}
                    draggingId={draggingId}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverColumn(column.value);
                    }}
                    onDragLeave={() => {
                      if (dragOverColumn === column.value) setDragOverColumn(null);
                    }}
                    onDrop={(e) => void handleDrop(e, column.value)}
                    onCardDragStart={setDraggingId}
                    onCardDragEnd={() => setDraggingId(null)}
                    onChat={(tache) => openChatDialog(tache)}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onLoadDocument={openDocumentDialog}
                    onViewDocuments={openViewDocumentsDialog}
                    onValidate={(tache) => void handleValidate(tache)}
                    onTransfer={openTransferDialog}
                    onTerminer={(tache) => void handleTerminer(tache)}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <TransferTacheDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        tache={transferTache}
        users={users}
        isLoadingUsers={isLoadingUsers}
        excludeUserIds={transferTache?.responsables.map((r) => r.userId) ?? []}
        onSuccess={(tache) => updateTacheInList(tache)}
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
