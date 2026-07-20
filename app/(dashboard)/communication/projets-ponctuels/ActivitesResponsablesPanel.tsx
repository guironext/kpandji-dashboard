"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  deleteProjetPonctuelActivite,
  getActivitesByProjetId,
  validateActivite,
  terminerActivite,
  type ProjetPonctuelActiviteItem,
} from "@/lib/actions/projet-ponctuel-activite";
import {
  getUsersForProjectActors,
  type UserForActorOption,
} from "@/lib/actions/communication-actor";
import { getActiviteStatutConfig } from "@/lib/projet-ponctuel-activite-statut";
import ActiviteFormDialog from "./ActiviteFormDialog";
import ResponsablesActiviteDialog from "./ResponsablesActiviteDialog";
import ActiviteChatDialog from "./ActiviteChatDialog";
import ActiviteChatButton from "./ActiviteChatButton";
import ActiviteStatutActionBar from "./ActiviteStatutActionBar";
import ActiviteValidateButton from "./ActiviteValidateButton";
import ActiviteCreatorValidationBar from "./ActiviteCreatorValidationBar";
import ActiviteViewDocumentsDialog from "./ActiviteViewDocumentsDialog";
import ClickableActiviteDescription from "./ClickableActiviteDescription";
import { getOrCreateUser } from "@/lib/actions/user";
import TransferActiviteDialog from "./TransferActiviteDialog";
import { getActiviteChatUnreadMap } from "@/lib/actions/projet-ponctuel-activite-chat";
import ProjetTermineBar from "./ProjetTermineBar";
import {
  allActivitesTerminees,
  applyProjetCompletionUpdate,
} from "./projet-completion";

type Props = {
  projects: ProjetPonctuelListItem[];
  onProjectUpdated?: (project: ProjetPonctuelListItem) => void;
};

const AVATAR_GRADIENTS = [
  "from-sky-500 to-cyan-500",
  "from-teal-500 to-emerald-500",
  "from-indigo-500 to-blue-500",
  "from-violet-500 to-purple-500",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "sky" | "teal" | "slate";
}) {
  const tones = {
    sky: "from-sky-500/10 to-cyan-500/5 border-sky-200/70",
    teal: "from-teal-500/10 to-emerald-500/5 border-teal-200/70",
    slate: "from-slate-500/10 to-slate-400/5 border-slate-200/70",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br px-4 py-3.5 shadow-sm ring-1 ring-white/60",
        tones[tone]
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5"
        >
          <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
          <div className="mt-4 flex gap-2">
            <div className="h-8 w-24 rounded-full bg-slate-100" />
            <div className="h-8 w-24 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiviteCard({
  activite,
  index,
  onManageResponsables,
  onChat,
  onDelete,
  isDeleting,
  hasUnreadChat,
  isActionUpdating,
  isCreator,
  onValidate,
  onViewDocuments,
  onTransfer,
  onTerminer,
}: {
  activite: ProjetPonctuelActiviteItem;
  index: number;
  onManageResponsables: () => void;
  onChat: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  hasUnreadChat: boolean;
  isActionUpdating: boolean;
  isCreator: boolean;
  onValidate: () => void;
  onViewDocuments: () => void;
  onTransfer: () => void;
  onTerminer: () => void;
}) {
  const statutConfig = getActiviteStatutConfig(activite.statutActivite);
  const isEnAttenteValidation = activite.statutActivite === "EN_ATTENTE_VALIDATION";
  const isValidee = activite.statutActivite === "VALIDEE";
  const showStandardActions = !isEnAttenteValidation && !isValidee;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200/80 hover:shadow-lg hover:shadow-sky-100/40">
      <div className={cn("absolute inset-y-0 left-0 w-1", statutConfig.barClass)} aria-hidden />

      <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/60 via-white to-teal-50/30 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-sky-100 text-sky-700 hover:bg-sky-100">
                Activité {index + 1}
              </Badge>
              <Badge variant="outline" className="border-slate-200 text-[11px] text-slate-700">
                <span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", statutConfig.dotClass)} />
                {statutConfig.label}
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                <Calendar className="h-3.5 w-3.5 text-sky-500" />
                {formatDate(activite.dateDebut)}
                {activite.dateCloture ? ` → ${formatDate(activite.dateCloture)}` : ""}
              </span>
            </div>
            <h4 className="text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-900 sm:text-lg">
              {activite.titre}
            </h4>
            <ClickableActiviteDescription
              titre={activite.titre}
              description={activite.description}
              className="mt-2 text-sm"
              lineClamp="none"
            />
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isEnAttenteValidation && (
              <>
                <ActiviteChatButton onClick={onChat} hasUnread={hasUnreadChat} />
                {isCreator && (
                  <ActiviteValidateButton
                    onClick={onValidate}
                    isUpdating={isActionUpdating}
                  />
                )}
              </>
            )}
            {showStandardActions && (
              <>
                <ActiviteChatButton onClick={onChat} hasUnread={hasUnreadChat} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-sky-200 bg-white text-sky-700 shadow-sm hover:bg-sky-50"
                  onClick={onManageResponsables}
                >
                  <UserCog className="mr-1.5 h-4 w-4" />
                  Responsables
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-xl border-rose-200 p-0 text-rose-600 hover:bg-rose-50"
                  onClick={onDelete}
                  disabled={isDeleting}
                  aria-label="Supprimer l'activité"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users className="h-3.5 w-3.5" />
            Responsables
          </div>
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
            {activite.responsables.length}
          </Badge>
        </div>

        {activite.responsables.length === 0 ? (
          <button
            type="button"
            onClick={onManageResponsables}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-4 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/70"
          >
            <span className="text-sm text-slate-600">
              Aucun responsable — cliquez pour assigner
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-sky-500" />
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activite.responsables.map((resp, respIndex) => (
              <div
                key={resp.id}
                className="inline-flex items-center gap-2.5 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50/80 to-white px-3 py-2 shadow-sm"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white shadow-sm",
                    AVATAR_GRADIENTS[respIndex % AVATAR_GRADIENTS.length]
                  )}
                >
                  {initials(resp.user.firstName, resp.user.lastName)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    {resp.user.firstName} {resp.user.lastName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">{resp.user.email}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEnAttenteValidation && isCreator && (
        <ActiviteCreatorValidationBar onClick={onViewDocuments} />
      )}

      {isValidee && (
        <ActiviteStatutActionBar
          statutActivite={activite.statutActivite}
          isUpdating={isActionUpdating}
          onTransfer={onTransfer}
          onTerminer={onTerminer}
        />
      )}
    </article>
  );
}

export default function ActivitesResponsablesPanel({
  projects,
  onProjectUpdated,
}: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [activites, setActivites] = useState<ProjetPonctuelActiviteItem[]>([]);
  const [isLoadingActivites, setIsLoadingActivites] = useState(false);
  const [activiteDialogOpen, setActiviteDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserForActorOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [responsablesDialogOpen, setResponsablesDialogOpen] = useState(false);
  const [editingActivite, setEditingActivite] = useState<ProjetPonctuelActiviteItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatActivite, setChatActivite] = useState<ProjetPonctuelActiviteItem | null>(null);
  const [chatEnAttentePrompt, setChatEnAttentePrompt] = useState(false);
  const [chatOpenRequestId, setChatOpenRequestId] = useState(0);
  const [unreadChatMap, setUnreadChatMap] = useState<Record<string, boolean>>({});
  const [activiteSearch, setActiviteSearch] = useState("");
  const [actionUpdatingId, setActionUpdatingId] = useState<string | null>(null);
  const [transferActivite, setTransferActivite] = useState<ProjetPonctuelActiviteItem | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [viewDocumentsActivite, setViewDocumentsActivite] =
    useState<ProjetPonctuelActiviteItem | null>(null);
  const [viewDocumentsOpen, setViewDocumentsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const refreshUnreadChat = async (ids: string[]) => {
    if (ids.length === 0) {
      setUnreadChatMap({});
      return;
    }
    const map = await getActiviteChatUnreadMap(ids);
    setUnreadChatMap(map);
  };

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

  useEffect(() => {
    if (!selectedProjectId) return;

    let cancelled = false;
    const load = async () => {
      setIsLoadingActivites(true);
      try {
        const result = await getActivitesByProjetId(selectedProjectId);
        if (cancelled) return;
        if (result.success) {
          setActivites(result.activites);
          void refreshUnreadChat(result.activites.map((a) => a.id));
          if (allActivitesTerminees(result.activites)) {
            const projet = await tryCompleteProjetIfAllActivitesTerminees(selectedProjectId);
            const justCompleted = applyProjetCompletionUpdate(
              projet,
              projects.find((p) => p.id === selectedProjectId)?.statutProjet,
              onProjectUpdated
            );
            if (justCompleted) {
              toast.success("Toutes les activités sont terminées. Le projet est marqué comme terminé.");
            }
          }
        } else {
          toast.error(result.error ?? "Erreur lors du chargement des activités.");
          setActivites([]);
        }
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        toast.error("Erreur lors du chargement des activités.");
        setActivites([]);
      } finally {
        if (!cancelled) setIsLoadingActivites(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, projects, onProjectUpdated]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const result = await getUsersForProjectActors();
        if (cancelled) return;
        if (result.success) setUsers(result.users);
        else setUsers([]);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const stats = useMemo(() => {
    const responsablesCount = new Set(
      activites.flatMap((a) => a.responsables.map((r) => r.userId))
    ).size;
    return {
      activites: activites.length,
      responsables: responsablesCount,
      projets: projects.length,
    };
  }, [activites, projects.length]);

  const filteredActivites = useMemo(() => {
    const query = activiteSearch.trim().toLowerCase();
    if (!query) return activites;
    return activites.filter(
      (a) =>
        a.titre.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.responsables.some((r) =>
          `${r.user.firstName} ${r.user.lastName}`.toLowerCase().includes(query)
        )
    );
  }, [activites, activiteSearch]);

  const openResponsablesDialog = (activite: ProjetPonctuelActiviteItem) => {
    setEditingActivite(activite);
    setResponsablesDialogOpen(true);
  };

  const openChatDialog = (activite: ProjetPonctuelActiviteItem, enAttentePrompt = false) => {
    setChatActivite(activite);
    setChatEnAttentePrompt(enAttentePrompt);
    setChatOpenRequestId((id) => id + 1);
    setChatOpen(true);
  };

  const handleValidate = async (activite: ProjetPonctuelActiviteItem) => {
    if (!selectedProjectId) return;
    setActionUpdatingId(activite.id);
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
      setActionUpdatingId(null);
    }
  };

  const handleTerminer = async (activite: ProjetPonctuelActiviteItem) => {
    if (!selectedProjectId) return;
    if (!confirm("Marquer cette activité comme terminée ?")) return;
    setActionUpdatingId(activite.id);
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
      setActionUpdatingId(null);
    }
  };

  const openTransferDialog = (activite: ProjetPonctuelActiviteItem) => {
    setTransferActivite(activite);
    setTransferOpen(true);
  };

  const openViewDocumentsDialog = (activite: ProjetPonctuelActiviteItem) => {
    setViewDocumentsActivite(activite);
    setViewDocumentsOpen(true);
  };

  const handleActiviteStatutUpdated = (
    activiteId: string,
    statutActivite: ProjetPonctuelActiviteItem["statutActivite"]
  ) => {
    setActivites((prev) =>
      prev.map((a) => (a.id === activiteId ? { ...a, statutActivite } : a))
    );
    setChatActivite((prev) =>
      prev?.id === activiteId ? { ...prev, statutActivite } : prev
    );
  };

  const handleActiviteUpdated = (activite: ProjetPonctuelActiviteItem) => {
    setActivites((prev) => prev.map((a) => (a.id === activite.id ? activite : a)));
  };

  const handleDeleteActivite = async (activiteId: string) => {
    if (!selectedProjectId) return;
    if (!confirm("Supprimer cette activité et ses responsables associés ?")) return;

    setDeletingId(activiteId);
    try {
      const result = await deleteProjetPonctuelActivite(activiteId, selectedProjectId);
      if (result.success) {
        toast.success("Activité supprimée.");
        setActivites((prev) => prev.filter((a) => a.id !== activiteId));
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-teal-50/40 px-6 py-16 text-center sm:py-20">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-600 to-teal-600 text-white shadow-xl shadow-sky-500/30">
          <FolderKanban className="h-8 w-8" />
        </div>
        <h4 className="text-xl font-bold text-slate-900">Aucun projet disponible</h4>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          Créez d&apos;abord un projet ponctuel dans l&apos;onglet &quot;Générer projet&quot;, puis
          revenez ici pour planifier activités et responsables.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative px-4 py-5 sm:px-6 sm:py-6",
        activites.length > 0 && "pb-24 sm:pb-6",
        selectedProject?.statutProjet === "TERMINEE" && "pb-28"
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/90 via-white to-teal-50/50 p-4 shadow-sm ring-1 ring-sky-100/80 sm:p-5">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-teal-600 text-white shadow-lg shadow-sky-500/25 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <Badge className="mb-2 border-0 bg-sky-100 text-sky-700 hover:bg-sky-100">
                <Sparkles className="mr-1 h-3 w-3" />
                Planification
              </Badge>
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                Activités et responsables
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Sélectionnez un projet, créez ses activités et assignez les personnes responsables.
              </p>
            </div>
          </div>

          <div className="w-full space-y-2 xl:max-w-xs xl:shrink-0">
            <label
              htmlFor="projet-select"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Projet ponctuel
            </label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger
                id="projet-select"
                className="h-11 rounded-xl border-sky-200/80 bg-white shadow-sm focus:ring-sky-500/25"
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
          <div className="relative mt-4 rounded-xl border border-sky-100/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-base font-bold text-slate-900">{selectedProject.titre}</p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{selectedProject.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 ring-1 ring-sky-100">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(selectedProject.dateDebut)}
                {selectedProject.dateCloture
                  ? ` → ${formatDate(selectedProject.dateCloture)}`
                  : " → En cours"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Projets" value={stats.projets} tone="slate" />
        <StatCard label="Activités" value={stats.activites} tone="sky" />
        <StatCard label="Responsables" value={stats.responsables} tone="teal" />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3 sm:max-w-md">
          {activites.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={activiteSearch}
                onChange={(e) => setActiviteSearch(e.target.value)}
                placeholder="Rechercher une activité ou un responsable..."
                className="h-11 rounded-xl border-slate-200/90 bg-white pl-10 shadow-sm focus-visible:ring-sky-500/25"
              />
            </div>
          )}
        </div>
        <Button
          type="button"
          size="lg"
          onClick={() => setActiviteDialogOpen(true)}
          disabled={!selectedProjectId}
          className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-5 shadow-lg shadow-sky-500/25 hover:from-sky-700 hover:to-teal-700 sm:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          Ajouter une activité
        </Button>
      </div>

      {isLoadingActivites ? (
        <LoadingSkeleton />
      ) : activites.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-teal-50/30 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-600 to-teal-600 text-white shadow-xl shadow-sky-500/30">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900">Aucune activité</h4>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Structurez votre projet en activités concrètes et assignez un responsable à chacune.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={() => setActiviteDialogOpen(true)}
            className="mt-6 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-6 shadow-lg shadow-sky-500/25 hover:from-sky-700 hover:to-teal-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Ajouter une activité
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : filteredActivites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-800">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">Aucune activité ne correspond à votre recherche.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => setActiviteSearch("")}
          >
            Réinitialiser
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredActivites.map((activite, index) => (
            <ActiviteCard
              key={activite.id}
              activite={activite}
              index={index}
              onManageResponsables={() => openResponsablesDialog(activite)}
              onChat={() => openChatDialog(activite)}
              onDelete={() => handleDeleteActivite(activite.id)}
              isDeleting={deletingId === activite.id}
              hasUnreadChat={!!unreadChatMap[activite.id]}
              isActionUpdating={actionUpdatingId === activite.id}
              isCreator={currentUserId === activite.userId}
              onValidate={() => void handleValidate(activite)}
              onViewDocuments={() => openViewDocumentsDialog(activite)}
              onTransfer={() => openTransferDialog(activite)}
              onTerminer={() => void handleTerminer(activite)}
            />
          ))}
        </div>
      )}

      {activites.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-4 sm:hidden">
          <div className="pointer-events-auto mx-auto max-w-md">
            <Button
              type="button"
              size="lg"
              onClick={() => setActiviteDialogOpen(true)}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 shadow-2xl shadow-sky-500/35"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter une activité
            </Button>
          </div>
        </div>
      )}

      {selectedProjectId && selectedProject && (
        <ActiviteFormDialog
          open={activiteDialogOpen}
          onOpenChange={setActiviteDialogOpen}
          projetPonctuelId={selectedProjectId}
          projetBounds={{
            dateDebut: selectedProject.dateDebut,
            dateCloture: selectedProject.dateCloture,
          }}
          users={users}
          isLoadingUsers={isLoadingUsers}
          onSuccess={(activite) => setActivites((prev) => [...prev, activite])}
        />
      )}

      <ResponsablesActiviteDialog
        open={responsablesDialogOpen}
        onOpenChange={setResponsablesDialogOpen}
        activite={editingActivite}
        projetPonctuelId={selectedProjectId}
        users={users}
        isLoadingUsers={isLoadingUsers}
        onSuccess={handleActiviteUpdated}
      />

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
