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
  Loader2,
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
import type { ProjetPonctuelListItem } from "@/lib/actions/projet-ponctuel";
import { tryCompleteProjetIfAllActivitesTerminees } from "@/lib/actions/projet-ponctuel";
import {
  getActivitesByProjetId,
  updateActiviteStatut,
  validateActivite,
  terminerActivite,
  type ProjetPonctuelActiviteItem,
} from "@/lib/actions/projet-ponctuel-activite";
import {
  getUsersForProjectActors,
  type UserForActorOption,
} from "@/lib/actions/communication-actor";
import {
  ACTIVITE_STATUT_COLUMNS,
  getActiviteStatutConfig,
  getActiviteStatutProgress,
  getActiviteTimeProgress,
  type StatutProjetPonctuelActivite,
} from "@/lib/projet-ponctuel-activite-statut";
import ActiviteChatDialog from "./ActiviteChatDialog";
import ActiviteChatButton from "./ActiviteChatButton";
import ActiviteStatutActionBar from "./ActiviteStatutActionBar";
import ActiviteValidateButton from "./ActiviteValidateButton";
import ActiviteCreatorValidationBar from "./ActiviteCreatorValidationBar";
import ActiviteViewDocumentsDialog from "./ActiviteViewDocumentsDialog";
import ClickableActiviteDescription from "./ClickableActiviteDescription";
import TransferActiviteDialog from "./TransferActiviteDialog";
import { getOrCreateUser } from "@/lib/actions/user";
import {
  getActiviteChatUnreadMap,
  getEnAttenteChatPromptActiviteIds,
} from "@/lib/actions/projet-ponctuel-activite-chat";
import ProjetTermineBar from "./ProjetTermineBar";
import {
  allActivitesTerminees,
  applyProjetCompletionUpdate,
} from "./projet-completion";

type Props = {
  projects: ProjetPonctuelListItem[];
  onProjectUpdated?: (project: ProjetPonctuelListItem) => void;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function ActiviteKanbanCard({
  activite,
  isDragging,
  isUpdating,
  onDragStart,
  onDragEnd,
  onChat,
  hasUnreadChat,
  isCreator,
  onValidate,
  onViewDocuments,
  onTransfer,
  onTerminer,
}: {
  activite: ProjetPonctuelActiviteItem;
  isDragging: boolean;
  isUpdating: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onChat: () => void;
  hasUnreadChat: boolean;
  isCreator: boolean;
  onValidate: () => void;
  onViewDocuments: () => void;
  onTransfer: () => void;
  onTerminer: () => void;
}) {
  const statutConfig = getActiviteStatutConfig(activite.statutActivite);
  const statusProgress = getActiviteStatutProgress(activite.statutActivite);
  const timeProgress = getActiviteTimeProgress(activite.dateDebut, activite.dateCloture);
  const isEnAttenteValidation = activite.statutActivite === "EN_ATTENTE_VALIDATION";
  const isValidee = activite.statutActivite === "VALIDEE";
  const showChat = !isValidee;

  return (
    <article
      draggable={!isUpdating && !isValidee}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/activite-id", activite.id);
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
              {activite.titre}
            </h4>
            <ClickableActiviteDescription
              titre={activite.titre}
              description={activite.description}
              className="mt-1 text-xs"
              lineClamp={2}
            />
          </div>
        </div>

        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar className="h-3 w-3 shrink-0 text-emerald-500" />
          <span className="truncate">
            {formatDate(activite.dateDebut)}
            {activite.dateCloture ? ` → ${formatDate(activite.dateCloture)}` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-[10px] font-medium text-slate-600">
              {statutConfig.shortLabel}
            </Badge>
            {showChat && (
              <ActiviteChatButton
                onClick={() => onChat()}
                hasUnread={hasUnreadChat}
                size="xs"
              />
            )}
            {isEnAttenteValidation && isCreator && (
              <ActiviteValidateButton
                onClick={onValidate}
                isUpdating={isUpdating}
                size="xs"
              />
            )}
          </div>

          {activite.responsables.length > 0 ? (
            <div className="flex -space-x-1.5">
              {activite.responsables.slice(0, 3).map((resp, i) => (
                <span
                  key={resp.id}
                  title={`${resp.user.firstName} ${resp.user.lastName}`}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[9px] font-bold text-white shadow-sm",
                    i === 0 && "from-emerald-500 to-teal-500",
                    i === 1 && "from-sky-500 to-cyan-500",
                    i === 2 && "from-violet-500 to-purple-500"
                  )}
                >
                  {initials(resp.user.firstName, resp.user.lastName)}
                </span>
              ))}
              {activite.responsables.length > 3 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600">
                  +{activite.responsables.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400">Sans responsable</span>
          )}
        </div>
      </div>

      {isEnAttenteValidation && isCreator && (
        <ActiviteCreatorValidationBar onClick={onViewDocuments} compact />
      )}

      {isValidee && (
        <ActiviteStatutActionBar
          statutActivite={activite.statutActivite}
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
  activites,
  dragOver,
  updatingId,
  draggingId,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  onCardDragEnd,
  onChat,
  unreadChatMap,
  currentUserId,
  onViewDocuments,
  onValidate,
  onTransfer,
  onTerminer,
}: {
  column: (typeof ACTIVITE_STATUT_COLUMNS)[number];
  activites: ProjetPonctuelActiviteItem[];
  dragOver: boolean;
  updatingId: string | null;
  draggingId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onCardDragStart: (id: string) => void;
  onCardDragEnd: () => void;
  onChat: (activite: ProjetPonctuelActiviteItem) => void;
  unreadChatMap: Record<string, boolean>;
  currentUserId: string | null;
  onViewDocuments: (activite: ProjetPonctuelActiviteItem) => void;
  onValidate: (activite: ProjetPonctuelActiviteItem) => void;
  onTransfer: (activite: ProjetPonctuelActiviteItem) => void;
  onTerminer: (activite: ProjetPonctuelActiviteItem) => void;
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
            {activites.length}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Avancement cible · {column.progress}%</p>
      </header>

      <div className="flex min-h-[12rem] flex-1 flex-col gap-2.5 p-2.5">
        {activites.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/50 px-3 py-8 text-center",
              dragOver && "border-emerald-300 bg-emerald-50/50"
            )}
          >
            <p className="text-xs text-slate-400">Glissez une activité ici</p>
          </div>
        ) : (
          activites.map((activite) => (
            <ActiviteKanbanCard
              key={activite.id}
              activite={activite}
              isDragging={draggingId === activite.id}
              isUpdating={updatingId === activite.id}
              onDragStart={() => onCardDragStart(activite.id)}
              onDragEnd={onCardDragEnd}
              onChat={() => onChat(activite)}
              hasUnreadChat={!!unreadChatMap[activite.id]}
              isCreator={currentUserId === activite.userId}
              onValidate={() => onValidate(activite)}
              onViewDocuments={() => onViewDocuments(activite)}
              onTransfer={() => onTransfer(activite)}
              onTerminer={() => onTerminer(activite)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function MiseEnOeuvrePonctuelPanel({
  projects,
  onProjectUpdated,
}: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [activites, setActivites] = useState<ProjetPonctuelActiviteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatutProjetPonctuelActivite | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [chatActivite, setChatActivite] = useState<ProjetPonctuelActiviteItem | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEnAttentePrompt, setChatEnAttentePrompt] = useState(false);
  const [chatOpenRequestId, setChatOpenRequestId] = useState(0);
  const [unreadChatMap, setUnreadChatMap] = useState<Record<string, boolean>>({});
  const [transferActivite, setTransferActivite] = useState<ProjetPonctuelActiviteItem | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [viewDocumentsActivite, setViewDocumentsActivite] =
    useState<ProjetPonctuelActiviteItem | null>(null);
  const [viewDocumentsOpen, setViewDocumentsOpen] = useState(false);
  const [users, setUsers] = useState<UserForActorOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const refreshUnreadChat = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setUnreadChatMap({});
      return;
    }
    const map = await getActiviteChatUnreadMap(ids);
    setUnreadChatMap(map);
  }, []);

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

  const handleValidate = useCallback(
    async (activite: ProjetPonctuelActiviteItem) => {
      if (!selectedProjectId) return;
      setUpdatingId(activite.id);
      try {
        const result = await validateActivite(activite.id, selectedProjectId);
        if (result.success) {
          setActivites((prev) =>
            prev.map((a) => (a.id === activite.id ? result.activite : a))
          );
          toast.success("Activité validée.");
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
    [selectedProjectId]
  );

  const handleTerminer = useCallback(
    async (activite: ProjetPonctuelActiviteItem) => {
      if (!selectedProjectId) return;
      if (!confirm("Marquer cette activité comme terminée ?")) return;
      setUpdatingId(activite.id);
      try {
        const result = await terminerActivite(activite.id, selectedProjectId);
        if (result.success) {
          setActivites((prev) =>
            prev.map((a) => (a.id === activite.id ? result.activite : a))
          );
          const justCompleted = applyProjetCompletionUpdate(
            result.projet,
            selectedProject?.statutProjet,
            onProjectUpdated
          );
          if (justCompleted) {
            toast.success("Toutes les activités sont terminées. Le projet est marqué comme terminé.");
          } else {
            toast.success("Activité terminée.");
          }
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
    [selectedProjectId, selectedProject?.statutProjet, onProjectUpdated]
  );

  const openViewDocumentsDialog = useCallback((activite: ProjetPonctuelActiviteItem) => {
    setViewDocumentsActivite(activite);
    setViewDocumentsOpen(true);
  }, []);

  const handleActiviteStatutUpdated = useCallback(
    (activiteId: string, statutActivite: ProjetPonctuelActiviteItem["statutActivite"]) => {
      setActivites((prev) =>
        prev.map((a) => (a.id === activiteId ? { ...a, statutActivite } : a))
      );
      setChatActivite((prev) =>
        prev?.id === activiteId ? { ...prev, statutActivite } : prev
      );
    },
    []
  );

  const openTransferDialog = useCallback((activite: ProjetPonctuelActiviteItem) => {
    setTransferActivite(activite);
    setTransferOpen(true);
  }, []);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (
      projects.length > 0 &&
      selectedProjectId &&
      !projects.some((p) => p.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0].id);
    }
    if (projects.length === 0) {
      setSelectedProjectId("");
      setActivites([]);
    }
  }, [projects, selectedProjectId]);

  const loadActivites = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const result = await getActivitesByProjetId(projectId);
      if (result.success) {
        setActivites(result.activites);
        void refreshUnreadChat(result.activites.map((a) => a.id));
        if (allActivitesTerminees(result.activites)) {
          const projet = await tryCompleteProjetIfAllActivitesTerminees(projectId);
          const justCompleted = applyProjetCompletionUpdate(
            projet,
            projects.find((p) => p.id === projectId)?.statutProjet,
            onProjectUpdated
          );
          if (justCompleted) {
            toast.success("Toutes les activités sont terminées. Le projet est marqué comme terminé.");
          }
        }
      } else {
        toast.error(result.error ?? "Erreur lors du chargement.");
        setActivites([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des activités.");
      setActivites([]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUnreadChat, projects, onProjectUpdated]);

  const openChatDialog = useCallback(
    (activite: ProjetPonctuelActiviteItem, enAttentePrompt = false) => {
      setChatActivite(activite);
      setChatEnAttentePrompt(enAttentePrompt);
      setChatOpenRequestId((id) => id + 1);
      setChatOpen(true);
    },
    []
  );

  const promptEnAttenteChat = useCallback(
    async (activite: ProjetPonctuelActiviteItem) => {
      const promptIds = await getEnAttenteChatPromptActiviteIds([activite.id]);
      if (promptIds.includes(activite.id)) {
        openChatDialog(activite, true);
      }
    },
    [openChatDialog]
  );

  useEffect(() => {
    if (!selectedProjectId) return;
    void loadActivites(selectedProjectId);
  }, [selectedProjectId, loadActivites]);

  const activitesByColumn = useMemo(() => {
    const map = Object.fromEntries(
      ACTIVITE_STATUT_COLUMNS.map((col) => [col.value, [] as ProjetPonctuelActiviteItem[]])
    ) as Record<StatutProjetPonctuelActivite, ProjetPonctuelActiviteItem[]>;

    for (const activite of activites) {
      const key = activite.statutActivite;
      if (map[key]) map[key].push(activite);
      else map.NOUVEAU.push(activite);
    }
    return map;
  }, [activites]);

  const nouvellesCount = activitesByColumn.NOUVEAU.length;

  const globalProgress = useMemo(() => {
    if (activites.length === 0) return 0;
    const total = activites.reduce(
      (sum, a) => sum + getActiviteStatutProgress(a.statutActivite),
      0
    );
    return Math.round(total / activites.length);
  }, [activites]);

  const handleDrop = async (
    e: React.DragEvent,
    targetStatut: StatutProjetPonctuelActivite
  ) => {
    e.preventDefault();
    setDragOverColumn(null);

    const activiteId = e.dataTransfer.getData("text/activite-id");
    if (!activiteId || !selectedProjectId) return;

    const activite = activites.find((a) => a.id === activiteId);
    if (!activite || activite.statutActivite === targetStatut) {
      setDraggingId(null);
      return;
    }

    setUpdatingId(activiteId);
    setDraggingId(null);

    const previous = activites;
    setActivites((prev) =>
      prev.map((a) => (a.id === activiteId ? { ...a, statutActivite: targetStatut } : a))
    );

    try {
      const result = await updateActiviteStatut(activiteId, selectedProjectId, targetStatut);
      if (result.success) {
        setActivites((prev) =>
          prev.map((a) => (a.id === activiteId ? result.activite : a))
        );
        const justCompleted = applyProjetCompletionUpdate(
          result.projet,
          selectedProject?.statutProjet,
          onProjectUpdated
        );
        if (justCompleted) {
          toast.success("Toutes les activités sont terminées. Le projet est marqué comme terminé.");
        } else {
          toast.success("Statut de l'activité mis à jour.");
        }
        if (targetStatut === "EN_ATTENTE") {
          void promptEnAttenteChat(result.activite);
        }
      } else {
        setActivites(previous);
        toast.error(result.error ?? "Erreur lors du déplacement.");
      }
    } catch (error) {
      console.error(error);
      setActivites(previous);
      toast.error("Erreur lors du déplacement.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 shadow-sm ring-1 ring-emerald-200/80">
          <FolderKanban className="h-7 w-7 text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-slate-800">Aucun projet disponible</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Créez un projet et des activités pour suivre la mise en œuvre.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative px-4 py-5 sm:px-6 sm:py-6",
        selectedProject?.statutProjet === "TERMINEE" && "pb-28"
      )}
    >
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
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Tableau Trello</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Visualisez les activités par statut. Glissez-déposez les cartes pour faire avancer
                chaque activité.
              </p>
            </div>
          </div>

          <div className="w-full space-y-2 xl:max-w-xs xl:shrink-0">
            <label
              htmlFor="mise-en-oeuvre-projet-select"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Projet ponctuel
            </label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger
                id="mise-en-oeuvre-projet-select"
                className="h-11 rounded-xl border-emerald-200/80 bg-white shadow-sm"
              >
                <SelectValue placeholder="Choisir un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.titre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProject && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 sm:p-4">
              <p className="text-sm font-semibold text-slate-900">{selectedProject.titre}</p>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  {formatDate(selectedProject.dateDebut)}
                  {selectedProject.dateCloture
                    ? ` → ${formatDate(selectedProject.dateCloture)}`
                    : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5 text-emerald-500" />
                  {activites.length} activité{activites.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-white/90 p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Nouveau
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">
                {nouvellesCount}
              </p>
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
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
          Chargement du tableau...
        </div>
      ) : activites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <p className="text-base font-semibold text-slate-800">Aucune activité</p>
          <p className="mt-1 text-sm text-slate-500">
            Ajoutez des activités dans l&apos;onglet &quot;Activités et responsables&quot;.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 hidden text-xs text-slate-500 sm:block">
            Astuce : maintenez et glissez une carte vers une autre colonne pour changer son statut.
          </p>
          <div className="relative -mx-1 px-1 pb-2">
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-200">
              {ACTIVITE_STATUT_COLUMNS.map((column) => (
                <div key={column.value} className="snap-start">
                  <KanbanColumn
                    column={column}
                    activites={activitesByColumn[column.value]}
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
                    onChat={(activite) => openChatDialog(activite)}
                    unreadChatMap={unreadChatMap}
                    currentUserId={currentUserId}
                    onViewDocuments={openViewDocumentsDialog}
                    onValidate={(activite) => void handleValidate(activite)}
                    onTransfer={openTransferDialog}
                    onTerminer={(activite) => void handleTerminer(activite)}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <TransferActiviteDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        activite={transferActivite}
        users={users}
        isLoadingUsers={isLoadingUsers}
        excludeUserIds={transferActivite?.responsables.map((r) => r.userId) ?? []}
        onSuccess={(activite) => {
          setActivites((prev) => prev.map((a) => (a.id === activite.id ? activite : a)));
        }}
      />

      <ActiviteViewDocumentsDialog
        open={viewDocumentsOpen}
        onOpenChange={setViewDocumentsOpen}
        activite={viewDocumentsActivite}
      />

      <ActiviteChatDialog
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open);
          if (!open) void refreshUnreadChat(activites.map((a) => a.id));
        }}
        activite={chatActivite}
        openRequestId={chatOpenRequestId}
        enAttentePrompt={chatEnAttentePrompt}
        onMessageSent={() => {
          if (chatActivite) {
            setUnreadChatMap((prev) => ({ ...prev, [chatActivite.id]: false }));
          }
          void refreshUnreadChat(activites.map((a) => a.id));
        }}
        onActiviteUpdated={handleActiviteStatutUpdated}
      />

      {selectedProject?.statutProjet === "TERMINEE" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-200/80 bg-white/95 shadow-[0_-4px_24px_rgba(16,185,129,0.12)] backdrop-blur-sm sm:static sm:mt-6 sm:rounded-2xl sm:border sm:shadow-sm">
          <div className="mx-auto max-w-6xl">
            <ProjetTermineBar />
          </div>
        </div>
      )}
    </div>
  );
}
