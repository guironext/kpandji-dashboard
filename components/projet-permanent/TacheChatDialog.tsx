"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUser } from "@clerk/nextjs";
import { Loader2, MessageSquare, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { TacheActiviteProjetRoutineListItem } from "@/lib/actions/tache-activite-projet-routine";
import type { StatutTacheActiviteProjetRoutine } from "@/lib/tache-activite-projet-routine-statut";
import {
  getTacheChatThread,
  sendTacheChatMessage,
  type TacheChatMessageItem,
} from "@/lib/actions/tache-activite-projet-routine-chat";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tache: TacheActiviteProjetRoutineListItem | null;
  openRequestId?: number;
  enAttentePrompt?: boolean;
  onTacheUpdated?: (tacheId: string, statutTache: StatutTacheActiviteProjetRoutine) => void;
};

type Participant = { id: string; firstName: string; lastName: string };

function MessageHistoryItem({
  message,
  creatorId,
  currentUserId,
}: {
  message: TacheChatMessageItem;
  creatorId: string;
  currentUserId: string | null;
}) {
  const isCreator = message.senderId === creatorId;
  const isOwn = message.senderId === currentUserId;
  const roleLabel = isCreator ? "Responsable activité" : "Responsable tâche";

  return (
    <article
      className={cn(
        "rounded-xl border px-3.5 py-3",
        isOwn ? "border-emerald-200/80 bg-emerald-50/60" : "border-slate-200/80 bg-white"
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {isOwn ? "Vous" : `${message.sender.firstName} ${message.sender.lastName}`}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {roleLabel}
          </p>
        </div>
        <time className="shrink-0 text-[11px] tabular-nums text-slate-400">
          {format(new Date(message.createdAt), "d MMM yyyy, HH:mm", { locale: fr })}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{message.content}</p>
    </article>
  );
}

export default function TacheChatDialog({
  open,
  onOpenChange,
  tache,
  openRequestId = 0,
  enAttentePrompt = false,
  onTacheUpdated,
}: Props) {
  const { user: clerkUser } = useUser();
  const [messages, setMessages] = useState<TacheChatMessageItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [responsables, setResponsables] = useState<Participant[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const scrollHistoryToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      historyRef.current?.scrollTo({
        top: historyRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const tacheId = tache?.id ?? null;

  const loadThread = useCallback(async () => {
    if (!tacheId) return;

    setMessages([]);
    setIsLoading(true);
    try {
      const result = await getTacheChatThread(tacheId, clerkUser?.id);
      if (result.success) {
        setMessages(result.thread.messages);
        setCurrentUserId(result.thread.currentUserId);
        setCreatorId(result.thread.creator.id);
        setCreatorName(`${result.thread.creator.firstName} ${result.thread.creator.lastName}`);
        setResponsables(result.thread.responsables);
        setIsCreator(result.thread.currentUserId === result.thread.creator.id);
      } else {
        toast.error(result.error ?? "Impossible de charger le chat.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement du chat.");
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser?.id, tacheId]);

  useEffect(() => {
    if (open && tacheId) {
      setContent("");
      void loadThread();
    } else if (!open) {
      setMessages([]);
      setCurrentUserId(null);
      setCreatorId(null);
      setCreatorName("");
      setResponsables([]);
      setIsCreator(false);
    }
  }, [open, tacheId, openRequestId, loadThread]);

  const handleSend = async () => {
    if (!tache || !content.trim() || isSending) return;

    setIsSending(true);
    try {
      const result = await sendTacheChatMessage(tache.id, content, clerkUser?.id);
      if (result.success) {
        setMessages((prev) => [...prev, result.message]);
        setContent("");
        if (result.statutTache !== tache.statutTache) {
          onTacheUpdated?.(tache.id, result.statutTache);
        }
        scrollHistoryToBottom();
      } else {
        toast.error(result.error ?? "Erreur lors de l'envoi.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi du message.");
    } finally {
      setIsSending(false);
    }
  };

  const responsablesLabel =
    responsables.length > 0
      ? responsables.map((r) => `${r.firstName} ${r.lastName}`).join(", ")
      : "Aucun responsable assigné";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="line-clamp-1 text-base font-bold text-slate-900">
                Chat — {tache?.libelle ?? "Tâche"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-600">
                Échanges entre le responsable de l&apos;activité et les responsables de tâche
              </DialogDescription>
            </div>
          </div>

          <div className="mt-3 space-y-2 rounded-xl border border-emerald-100/80 bg-white/80 px-3 py-2.5 text-xs text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">Responsable activité :</span>{" "}
              {creatorName || "—"}
            </p>
            <p className="flex items-start gap-1.5">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>
                <span className="font-semibold text-slate-800">Responsables tâche :</span>{" "}
                {responsablesLabel}
              </span>
            </p>
          </div>
        </div>

        <div
          ref={historyRef}
          className="min-h-[200px] flex-1 space-y-2.5 overflow-y-auto px-5 py-4"
        >
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-slate-500">
              <MessageSquare className="h-8 w-8 text-slate-300" />
              <p className="text-sm">Aucun message pour le moment.</p>
            </div>
          ) : (
            creatorId &&
            messages.map((message) => (
              <MessageHistoryItem
                key={message.id}
                message={message}
                creatorId={creatorId}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          {enAttentePrompt && !isCreator && (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              Cette tâche est en attente. Envoyez un message au responsable de l&apos;activité pour
              confirmer votre prise en charge.
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isCreator
                  ? "Répondre aux responsables…"
                  : `Message à ${creatorName || "le responsable"}…`
              }
              rows={2}
              className="min-h-[72px] resize-none rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-500/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              disabled={isSending}
            />
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending || !content.trim()}
              className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 hover:from-emerald-600 hover:to-teal-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
