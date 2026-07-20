"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRightLeft,
  Calendar,
  ClipboardList,
  FolderKanban,
  GripVertical,
  Megaphone,
  Sparkles,
  UserCheck,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  updateActiviteStatut,
  validateActivite,
  terminerActivite,
  type ProjetPonctuelActiviteWithProjetItem,
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
import ActiviteChatDialog from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteChatDialog";
import ActiviteChatButton from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteChatButton";
import ActiviteStatutActionBar from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteStatutActionBar";
import ActiviteValidateButton from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteValidateButton";
import ActiviteLoadDocumentButton from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteLoadDocumentButton";
import ActiviteCreatorValidationBar from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteCreatorValidationBar";
import ActiviteViewDocumentsDialog from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteViewDocumentsDialog";
import ActiviteDocumentUploadDialog from "@/app/(dashboard)/communication/projets-ponctuels/ActiviteDocumentUploadDialog";
import ClickableActiviteDescription from "@/app/(dashboard)/communication/projets-ponctuels/ClickableActiviteDescription";
import TransferActiviteDialog from "@/app/(dashboard)/communication/projets-ponctuels/TransferActiviteDialog";
import { getEnAttenteChatPromptActiviteIds } from "@/lib/actions/projet-ponctuel-activite-chat";
import { getOrCreateUser } from "@/lib/actions/user";

type ActivityFilter = "all" | "assigned" | "transferred";

type Props = {
  initialActivites: ProjetPonctuelActiviteWithProjetItem[];
  variant?: "designer" | "communityManager" | "infographie" | "marketing";
};

const FILTER_OPTIONS: Array<{
  value: ActivityFilter;
  label: string;
  icon: typeof UserCheck;
}> = [
  { value: "all", label: "Toutes", icon: ClipboardList },
  { value: "assigned", label: "Mes activités", icon: UserCheck },
  { value: "transferred", label: "Transférées", icon: ArrowRightLeft },
];

const ACCENT_THEMES = {
  violet: {
    badge: "bg-violet-100 text-violet-700 hover:bg-violet-100",
    headerBorder: "border-violet-200/60",
    headerBg: "from-violet-50/90 via-white to-fuchsia-50/50",
    headerRing: "ring-violet-100/80",
    iconBg: "from-violet-600 to-fuchsia-600 shadow-violet-500/25",
    statBorder: "border-violet-100",
    emptyBorder: "border-violet-200 bg-violet-50/40",
    emptyIcon: "text-violet-400",
    dragRing: "ring-violet-400",
    scrollbar: "[&::-webkit-scrollbar-thumb]:bg-violet-200",
    projectText: "text-violet-600",
    calendarIcon: "text-violet-500",
    timeBar: "bg-violet-400/80",
    cardDragRing: "ring-violet-300",
  },
  rose: {
    badge: "bg-rose-100 text-rose-700 hover:bg-rose-100",
    headerBorder: "border-rose-200/60",
    headerBg: "from-rose-50/90 via-white to-pink-50/50",
    headerRing: "ring-rose-100/80",
    iconBg: "from-rose-500 to-pink-600 shadow-rose-500/25",
    statBorder: "border-rose-100",
    emptyBorder: "border-rose-200 bg-rose-50/40",
    emptyIcon: "text-rose-400",
    dragRing: "ring-rose-400",
    scrollbar: "[&::-webkit-scrollbar-thumb]:bg-rose-200",
    projectText: "text-rose-600",
    calendarIcon: "text-rose-500",
    timeBar: "bg-rose-400/80",
    cardDragRing: "ring-rose-300",
  },
} as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function isActiviteResponsable(
  activite: ProjetPonctuelActiviteWithProjetItem,
  currentUserId: string | null
) {
  if (!currentUserId || currentUserId === activite.userId) return false;
  return activite.responsables.some((r) => r.userId === currentUserId);
}

function ActiviteKanbanCard({
  activite,
  isDragging,
  isUpdating,
  onDragStart,
  onDragEnd,
  onChat,
  isCreator,
  isResponsable,
  onLoadDocument,
  onValidate,
  onViewDocuments,
  onTransfer,
  onTerminer,
  accentTheme = "violet",
}: {
  activite: ProjetPonctuelActiviteWithProjetItem;
  isDragging: boolean;
  isUpdating: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onChat: () => void;
  isCreator: boolean;
  isResponsable: boolean;
  onLoadDocument: () => void;
  onValidate: () => void;
  onViewDocuments: () => void;
  onTransfer: () => void;
  onTerminer: () => void;
  accentTheme?: "violet" | "rose";
}) {
  const theme = ACCENT_THEMES[accentTheme];
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
        isDragging && cn("opacity-50 ring-2", theme.cardDragRing),
        isUpdating && "pointer-events-none opacity-60"
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <div className={cn("mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider", theme.projectText)}>
          <FolderKanban className="h-3 w-3 shrink-0" />
          <span className="truncate">{activite.projet.titre}</span>
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
                className={cn("h-full rounded-full transition-all", theme.timeBar)}
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
          <Calendar className={cn("h-3 w-3 shrink-0", theme.calendarIcon)} />
          <span className="truncate">
            {formatDate(activite.dateDebut)}
            {activite.dateCloture ? ` → ${formatDate(activite.dateCloture)}` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-[10px] font-medium text-slate-600">
              {statutConfig.shortLabel}
            </Badge>
            {activite.isTransferred && (
              <Badge className="border-0 bg-amber-100 text-[10px] font-medium text-amber-800 hover:bg-amber-100">
                <ArrowRightLeft className="mr-1 h-3 w-3" />
                Transférée
              </Badge>
            )}
            {showChat && <ActiviteChatButton onClick={() => onChat()} size="xs" />}
            {isEnAttenteValidation && isResponsable && (
              <ActiviteLoadDocumentButton onClick={onLoadDocument} size="xs" />
            )}
            {isEnAttenteValidation && isCreator && (
              <ActiviteValidateButton
                onClick={onValidate}
                isUpdating={isUpdating}
                size="xs"
              />
            )}
          </div>
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
  currentUserId,
  onLoadDocument,
  onViewDocuments,
  onValidate,
  onTransfer,
  onTerminer,
  accentTheme = "violet",
}: {
  column: (typeof ACTIVITE_STATUT_COLUMNS)[number];
  activites: ProjetPonctuelActiviteWithProjetItem[];
  dragOver: boolean;
  updatingId: string | null;
  draggingId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onCardDragStart: (id: string) => void;
  onCardDragEnd: () => void;
  onChat: (activite: ProjetPonctuelActiviteWithProjetItem) => void;
  currentUserId: string | null;
  onLoadDocument: (activite: ProjetPonctuelActiviteWithProjetItem) => void;
  onViewDocuments: (activite: ProjetPonctuelActiviteWithProjetItem) => void;
  onValidate: (activite: ProjetPonctuelActiviteWithProjetItem) => void;
  onTransfer: (activite: ProjetPonctuelActiviteWithProjetItem) => void;
  onTerminer: (activite: ProjetPonctuelActiviteWithProjetItem) => void;
  accentTheme?: "violet" | "rose";
}) {
  const theme = ACCENT_THEMES[accentTheme];
  return (
    <div
      className={cn(
        "flex w-[min(100%,18.5rem)] shrink-0 flex-col rounded-2xl border bg-gradient-to-b shadow-sm transition-all sm:w-72",
        column.headerClass,
        dragOver && cn("ring-2 ring-offset-2", theme.dragRing)
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
              dragOver && cn("border-violet-300 bg-violet-50/50", accentTheme === "rose" && "border-rose-300 bg-rose-50/50")
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
              isCreator={currentUserId === activite.userId}
              isResponsable={isActiviteResponsable(activite, currentUserId)}
              onLoadDocument={() => onLoadDocument(activite)}
              onValidate={() => onValidate(activite)}
              onViewDocuments={() => onViewDocuments(activite)}
              onTransfer={() => onTransfer(activite)}
              onTerminer={() => onTerminer(activite)}
              accentTheme={accentTheme}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function ProjetPonctuelResponsableKanban({
  initialActivites,
  variant = "designer",
}: Props) {
  const isCommunityManager = variant === "communityManager";
  const isInfographie = variant === "infographie";
  const isMarketing = variant === "marketing";
  const showActivityFilters = isCommunityManager || isInfographie || isMarketing;
  const accentTheme = isCommunityManager ? "rose" : "violet";
  const theme = ACCENT_THEMES[accentTheme];
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [allActivites, setAllActivites] = useState(initialActivites);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatutProjetPonctuelActivite | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [chatActivite, setChatActivite] = useState<ProjetPonctuelActiviteWithProjetItem | null>(
    null
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEnAttentePrompt, setChatEnAttentePrompt] = useState(false);
  const [chatOpenRequestId, setChatOpenRequestId] = useState(0);
  const [transferActivite, setTransferActivite] =
    useState<ProjetPonctuelActiviteWithProjetItem | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [documentActivite, setDocumentActivite] =
    useState<ProjetPonctuelActiviteWithProjetItem | null>(null);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [viewDocumentsActivite, setViewDocumentsActivite] =
    useState<ProjetPonctuelActiviteWithProjetItem | null>(null);
  const [viewDocumentsOpen, setViewDocumentsOpen] = useState(false);
  const [users, setUsers] = useState<UserForActorOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const autoPromptedRef = useRef(false);

  useEffect(() => {
    setAllActivites(initialActivites);
  }, [initialActivites]);

  const assignedActivites = useMemo(
    () => allActivites.filter((activite) => !activite.isTransferred),
    [allActivites]
  );

  const transferredActivites = useMemo(
    () => allActivites.filter((activite) => activite.isTransferred),
    [allActivites]
  );

  const activites = useMemo(() => {
    if (!showActivityFilters || activityFilter === "all") return allActivites;
    if (activityFilter === "assigned") return assignedActivites;
    return transferredActivites;
  }, [allActivites, assignedActivites, transferredActivites, activityFilter, showActivityFilters]);

  const emptyDescription = useMemo(() => {
    if (!showActivityFilters) {
      return "Vous n'avez pas encore été désigné responsable d'une activité.";
    }
    if (activityFilter === "transferred") {
      return "Aucune activité ne vous a encore été transférée.";
    }
    if (activityFilter === "assigned") {
      return "Vous n'avez pas encore été désigné responsable d'une activité.";
    }
    return "Vous n'avez pas encore d'activité assignée ou transférée.";
  }, [activityFilter, showActivityFilters]);

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

  const updateActiviteInList = useCallback(
    (updated: ProjetPonctuelActiviteWithProjetItem) => {
      setAllActivites((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...updated, projet: a.projet, isTransferred: a.isTransferred } : a))
      );
    },
    []
  );

  const handleValidate = useCallback(
    async (activite: ProjetPonctuelActiviteWithProjetItem) => {
      setUpdatingId(activite.id);
      try {
        const result = await validateActivite(activite.id, activite.projetPonctuelId);
        if (result.success) {
          updateActiviteInList({ ...result.activite, projet: activite.projet });
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
    [updateActiviteInList]
  );

  const handleTerminer = useCallback(
    async (activite: ProjetPonctuelActiviteWithProjetItem) => {
      if (!confirm("Marquer cette activité comme terminée ?")) return;
      setUpdatingId(activite.id);
      try {
        const result = await terminerActivite(activite.id, activite.projetPonctuelId);
        if (result.success) {
          updateActiviteInList({ ...result.activite, projet: activite.projet });
          toast.success("Activité terminée.");
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
    [updateActiviteInList]
  );

  const handleActiviteStatutUpdated = useCallback(
    (activiteId: string, statutActivite: StatutProjetPonctuelActivite) => {
      setAllActivites((prev) =>
        prev.map((a) => (a.id === activiteId ? { ...a, statutActivite } : a))
      );
      setChatActivite((prev) =>
        prev?.id === activiteId ? { ...prev, statutActivite } : prev
      );
    },
    []
  );

  const openViewDocumentsDialog = useCallback((activite: ProjetPonctuelActiviteWithProjetItem) => {
    setViewDocumentsActivite(activite);
    setViewDocumentsOpen(true);
  }, []);

  const openDocumentDialog = useCallback((activite: ProjetPonctuelActiviteWithProjetItem) => {
    setDocumentActivite(activite);
    setDocumentOpen(true);
  }, []);

  const openTransferDialog = useCallback((activite: ProjetPonctuelActiviteWithProjetItem) => {
    setTransferActivite(activite);
    setTransferOpen(true);
  }, []);

  const openChatDialog = useCallback(
    (activite: ProjetPonctuelActiviteWithProjetItem, enAttentePrompt = false) => {
      setChatActivite(activite);
      setChatEnAttentePrompt(enAttentePrompt);
      setChatOpenRequestId((id) => id + 1);
      setChatOpen(true);
    },
    []
  );

  const promptEnAttenteChat = useCallback(
    async (activite: ProjetPonctuelActiviteWithProjetItem) => {
      const promptIds = await getEnAttenteChatPromptActiviteIds([activite.id]);
      if (promptIds.includes(activite.id)) {
        openChatDialog(activite, true);
      }
    },
    [openChatDialog]
  );

  const activitesByColumn = useMemo(() => {
    const map = Object.fromEntries(
      ACTIVITE_STATUT_COLUMNS.map((col) => [col.value, [] as ProjetPonctuelActiviteWithProjetItem[]])
    ) as Record<StatutProjetPonctuelActivite, ProjetPonctuelActiviteWithProjetItem[]>;

    for (const activite of activites) {
      const key = activite.statutActivite;
      if (map[key]) map[key].push(activite);
      else map.NOUVEAU.push(activite);
    }
    return map;
  }, [activites]);

  const globalProgress = useMemo(() => {
    if (activites.length === 0) return 0;
    const total = activites.reduce(
      (sum, a) => sum + getActiviteStatutProgress(a.statutActivite),
      0
    );
    return Math.round(total / activites.length);
  }, [activites]);

  const nouvellesCount = activitesByColumn.NOUVEAU.length;

  useEffect(() => {
    if (autoPromptedRef.current || allActivites.length === 0 || chatOpen) return;

    const run = async () => {
      const promptIds = await getEnAttenteChatPromptActiviteIds(allActivites.map((a) => a.id));
      if (promptIds.length === 0) return;
      const activite = allActivites.find((a) => a.id === promptIds[0]);
      if (activite) {
        autoPromptedRef.current = true;
        openChatDialog(activite, true);
      }
    };

    void run();
  }, [allActivites, chatOpen, openChatDialog]);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatut: StatutProjetPonctuelActivite) => {
      e.preventDefault();
      setDragOverColumn(null);

      const activiteId = e.dataTransfer.getData("text/activite-id");
      if (!activiteId) return;

      const activite = activites.find((a) => a.id === activiteId);
      if (!activite || activite.statutActivite === targetStatut) {
        setDraggingId(null);
        return;
      }

      setUpdatingId(activiteId);
      setDraggingId(null);

      const previous = allActivites;
      setAllActivites((prev) =>
        prev.map((a) => (a.id === activiteId ? { ...a, statutActivite: targetStatut } : a))
      );

      try {
        const result = await updateActiviteStatut(
          activiteId,
          activite.projetPonctuelId,
          targetStatut
        );
        if (result.success) {
          setAllActivites((prev) =>
            prev.map((a) =>
              a.id === activiteId ? { ...a, ...result.activite, projet: a.projet, isTransferred: a.isTransferred } : a
            )
          );
          toast.success("Statut de l'activité mis à jour.");
          if (targetStatut === "EN_ATTENTE") {
            void promptEnAttenteChat({
              ...result.activite,
              projet: activite.projet,
            });
          }
        } else {
          setAllActivites(previous);
          toast.error(result.error ?? "Erreur lors du déplacement.");
        }
      } catch (error) {
        console.error(error);
        setAllActivites(previous);
        toast.error("Erreur lors du déplacement.");
      } finally {
        setUpdatingId(null);
      }
    },
    [activites, allActivites, promptEnAttenteChat]
  );

  return (
    <div className="relative px-4 py-5 sm:px-6 sm:py-6">
      <div
        className={cn(
          "relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm ring-1 sm:p-5",
          theme.headerBorder,
          theme.headerBg,
          theme.headerRing
        )}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg sm:h-12 sm:w-12",
              theme.iconBg
            )}
          >
            {isCommunityManager || isMarketing ? (
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : isInfographie ? (
              <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Badge className={cn("mb-2 border-0", theme.badge)}>
              <Sparkles className="mr-1 h-3 w-3" />
              {isCommunityManager
                ? "Community Manager"
                : isInfographie
                  ? "Infographie"
                  : isMarketing
                    ? "Marketing"
                    : "Mes activités"}
            </Badge>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Projets ponctuels</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {showActivityFilters
                ? "Activités dont vous êtes responsable et celles transférées par d'autres. Glissez-déposez les cartes pour faire avancer chaque étape."
                : "Activités pour lesquelles vous êtes désigné responsable. Glissez-déposez les cartes pour faire avancer chaque étape."}
            </p>
          </div>
        </div>

        {showActivityFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const count =
                option.value === "all"
                  ? allActivites.length
                  : option.value === "assigned"
                    ? assignedActivites.length
                    : transferredActivites.length;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActivityFilter(option.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    activityFilter === option.value
                      ? isCommunityManager
                        ? "border-rose-300 bg-rose-100 text-rose-800 shadow-sm"
                        : "border-violet-300 bg-violet-100 text-violet-800 shadow-sm"
                      : isCommunityManager
                        ? "border-slate-200 bg-white/80 text-slate-600 hover:border-rose-200 hover:bg-rose-50"
                        : "border-slate-200 bg-white/80 text-slate-600 hover:border-violet-200 hover:bg-violet-50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {option.label}
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className={cn(
            "mt-4 grid gap-3",
            showActivityFilters ? "sm:grid-cols-4" : "sm:grid-cols-3"
          )}
        >
          <div className={cn("rounded-xl border bg-white/90 p-3 sm:p-4", theme.statBorder)}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {showActivityFilters ? "Affichées" : "Total activités"}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{activites.length}</p>
          </div>
          {showActivityFilters ? (
            <>
              <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  Assignées
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                  {assignedActivites.length}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-white/90 p-3 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                  Transférées
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                  {transferredActivites.length}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-white/90 p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Nouvelles
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">{nouvellesCount}</p>
            </div>
          )}
          <div className={cn("rounded-xl border bg-white/90 p-3 sm:p-4", theme.statBorder)}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avancement global
            </p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {globalProgress}%
              </span>
              {!showActivityFilters && (
                <span className="text-xs text-slate-500">{nouvellesCount} nouvelle(s)</span>
              )}
            </div>
            <Progress value={globalProgress} className="mt-2 h-2" />
          </div>
        </div>
      </div>

      {allActivites.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-dashed px-6 py-16 text-center",
            theme.emptyBorder
          )}
        >
          <ClipboardList className={cn("mx-auto mb-3 h-10 w-10", theme.emptyIcon)} />
          <p className="text-base font-semibold text-slate-800">Aucune activité</p>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <>
          {activites.length === 0 && (
            <div
              className={cn(
                "mb-4 rounded-xl border border-dashed px-4 py-3 text-center text-sm text-slate-500",
                theme.emptyBorder
              )}
            >
              {emptyDescription}
            </div>
          )}
          <p className="mb-3 hidden text-xs text-slate-500 sm:block">
            Astuce : maintenez et glissez une carte vers une autre colonne pour changer son statut.
          </p>
          <div className="relative -mx-1 px-1 pb-2">
            <div
              className={cn(
                "flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full",
                theme.scrollbar
              )}
            >
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
                    currentUserId={currentUserId}
                    onLoadDocument={openDocumentDialog}
                    onViewDocuments={openViewDocumentsDialog}
                    onValidate={(activite) => void handleValidate(activite)}
                    onTransfer={openTransferDialog}
                    onTerminer={(activite) => void handleTerminer(activite)}
                    accentTheme={accentTheme}
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
        onTransferredAway={() => {
          if (transferActivite) {
            setAllActivites((prev) => prev.filter((a) => a.id !== transferActivite.id));
          }
        }}
      />

      <ActiviteViewDocumentsDialog
        open={viewDocumentsOpen}
        onOpenChange={setViewDocumentsOpen}
        activite={viewDocumentsActivite}
      />

      <ActiviteDocumentUploadDialog
        open={documentOpen}
        onOpenChange={setDocumentOpen}
        activite={documentActivite}
      />

      <ActiviteChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        activite={chatActivite}
        openRequestId={chatOpenRequestId}
        enAttentePrompt={chatEnAttentePrompt}
        onActiviteUpdated={handleActiviteStatutUpdated}
      />
    </div>
  );
}
