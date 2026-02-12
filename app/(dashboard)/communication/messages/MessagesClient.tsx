"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  MessageSquare,
  Users,
  CheckCheck,
  Check,
  Inbox,
  Reply,
  X,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  senderId: string;
  receiverId: string | null;
  sender: { id: string; firstName: string; lastName: string; email: string };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

function getInitials(firstName: string, lastName: string, email: string) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-indigo-500 to-violet-600",
  "from-lime-500 to-green-600",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function hashToIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function MessagesClient() {
  const { userId: clerkId, isLoaded: authLoaded } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<string>("all");
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (
      userId?: string | null,
      options?: { showErrorToast?: boolean; signal?: AbortSignal }
    ) => {
      if (!clerkId) return;
      const showToast = options?.showErrorToast !== false;
      const signal = options?.signal;
      try {
        const res = await fetch("/api/messages", {
          cache: "no-store",
          signal: signal ?? undefined,
        });
        if (signal?.aborted) return;
        if (res.ok) {
          const data = await res.json();
          if (signal?.aborted) return;
          setMessages(data);
          const uid = userId ?? currentUserId;
          if (uid) {
            for (const m of data) {
              if (
                m.receiverId === uid &&
                m.senderId !== uid &&
                !m.readAt
              ) {
                fetch(`/api/messages/${m.id}/read`, { method: "POST" });
              }
            }
          }
        } else if (showToast) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.details
            ? `${errData.error}: ${errData.details}`
            : errData.error || "Erreur lors du chargement des messages";
          toast.error(msg);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error(err);
        if (showToast) {
          toast.error("Erreur de connexion. Vérifiez votre réseau et réessayez.");
        }
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [clerkId, currentUserId]
  );

  const fetchCurrentUserId = useCallback(async () => {
    if (!clerkId) return null;
    const res = await fetch(`/api/user/${clerkId}`);
    if (res.ok) {
      const u = await res.json();
      return u.id;
    }
    return null;
  }, [clerkId]);

  useEffect(() => {
    if (!authLoaded) return;
    fetchUsers();
  }, [authLoaded, fetchUsers]);

  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!authLoaded || !clerkId) return;
    const load = async () => {
      const id = await fetchCurrentUserId();
      if (!isMountedRef.current) return;
      setCurrentUserId(id);
      await fetchMessages(id, { showErrorToast: true });
    };
    load();
  }, [authLoaded, clerkId, fetchCurrentUserId, fetchMessages]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-refresh disabled to avoid "Failed to fetch" errors - use the Actualiser button to refresh

  const handleSend = async () => {
    if (!clerkId || !content.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          receiverId: selectedReceiver === "all" ? null : selectedReceiver,
        }),
      });
      if (res.ok) {
        setContent("");
        await fetchMessages(currentUserId ?? undefined, { showErrorToast: true });
        toast.success("Message envoyé");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async () => {
    if (!clerkId || !replyingTo || !replyContent.trim()) return;
    const targetId = replyingTo.senderId;
    setIsSendingReply(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          receiverId: targetId,
        }),
      });
      if (res.ok) {
        setReplyingTo(null);
        setReplyContent("");
        await fetchMessages(currentUserId ?? undefined, { showErrorToast: true });
        toast.success("Réponse envoyée");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSendingReply(false);
    }
  };

  const getSenderName = (m: Message) =>
    `${m.sender.firstName} ${m.sender.lastName}`.trim() || m.sender.email;
  const getReceiverLabel = (m: Message) =>
    m.receiverId === null
      ? "Tous"
      : m.receiver
        ? `${m.receiver.firstName} ${m.receiver.lastName}`.trim() ||
          m.receiver.email
        : "—";

  const isFromMe = (m: Message) => m.senderId === currentUserId;
  const isToMe = (m: Message) =>
    m.receiverId === currentUserId || m.receiverId === null;

  if (!authLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-gradient-to-br from-violet-50 via-fuchsia-50/30 to-cyan-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-3">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-sm font-medium text-violet-700/80">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!clerkId) {
    return (
      <Card className="max-w-lg mx-auto mt-12 border-2 border-violet-200/50 shadow-lg shadow-violet-100/50">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 mx-auto mb-4 text-white">
            <Inbox className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground font-medium">
            Veuillez vous connecter pour accéder aux messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Header - Vibrant Gradient */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.3)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,0,0,0.1)_0%,transparent_50%)]" />
        <div className="relative px-6 py-8 md:py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-xl border border-white/30">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-white drop-shadow-sm">
                Messages
              </h1>
              <p className="mt-1 text-white/90 text-sm">
                Communiquez avec vos collègues ou envoyez des annonces à toute l&apos;équipe
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Compose Panel - Colorful */}
        <Card className="h-fit lg:sticky lg:top-24 border-2 border-violet-200/60 shadow-xl shadow-violet-100/30 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
          <CardHeader className="pb-4 bg-gradient-to-b from-violet-50/50 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-300/30">
                <Send className="h-5 w-5" />
              </span>
              Nouveau message
            </CardTitle>
            <CardDescription>
              Destinataire et contenu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="text-sm font-semibold mb-2 block text-violet-800/80">Destinataire</label>
              <Select
                value={selectedReceiver}
                onValueChange={setSelectedReceiver}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="h-11 border-2 border-violet-200/60 focus:border-violet-400 focus:ring-violet-200">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="font-medium">Tous les utilisateurs</span>
                    </span>
                  </SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(hashToIndex(u.id))} text-white text-xs font-bold shadow-sm`}>
                          {getInitials(u.firstName, u.lastName, u.email)}
                        </span>
                        {u.firstName} {u.lastName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-violet-800/80">Message</label>
              <Textarea
                placeholder="Écrivez votre message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none border-2 border-violet-200/60 focus:border-violet-400 focus:ring-violet-200 placeholder:text-violet-300/80"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || isSending}
              className="w-full h-12 font-semibold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 text-white shadow-lg shadow-violet-300/40 border-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer
            </Button>
          </CardContent>
        </Card>

        {/* Messages Feed - Colorful */}
        <Card className="border-2 border-violet-200/60 shadow-xl shadow-violet-100/30 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-500" />
          <CardHeader className="border-b bg-gradient-to-r from-violet-50/70 via-fuchsia-50/50 to-cyan-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                    <Inbox className="h-5 w-5" />
                  </span>
                  Boîte de réception
                </CardTitle>
                <CardDescription>
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-violet-200 hover:bg-violet-100"
                onClick={() => fetchMessages(currentUserId ?? undefined, { showErrorToast: true })}
                disabled={isLoadingMessages}
              >
                {isLoadingMessages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-white to-violet-50/20">
                <div className="rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-3 mb-4">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
                <p className="text-sm font-medium text-violet-600/80">Chargement des messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-white via-fuchsia-50/20 to-violet-50/30">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-xl">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-violet-800">Aucun message</h3>
                <p className="text-center text-violet-600/80 mt-2 max-w-sm">
                  Envoyez votre premier message à un collègue ou à toute l&apos;équipe grâce au formulaire à gauche.
                </p>
                <div className="flex gap-2 mt-4">
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            ) : (
              <div className="h-[500px] overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 bg-gradient-to-b from-white to-violet-50/20">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${isFromMe(m) ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
                        isFromMe(m)
                          ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500"
                          : `bg-gradient-to-br ${getAvatarColor(hashToIndex(m.sender.id))}`
                      }`}
                    >
                      {getInitials(
                        m.sender.firstName,
                        m.sender.lastName,
                        m.sender.email
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`flex max-w-[85%] flex-col gap-1 ${
                        isFromMe(m) ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-lg transition-all ${
                          isFromMe(m)
                            ? "rounded-br-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-violet-300/30"
                            : "rounded-bl-md bg-white border-2 border-violet-100 shadow-violet-100/50"
                        } ${!m.readAt && !isFromMe(m) && isToMe(m) ? "ring-2 ring-violet-300 ring-offset-2" : ""}`}
                      >
                        <div className={`flex items-center gap-2 flex-wrap text-xs ${isFromMe(m) ? "opacity-90" : "text-violet-600/90"}`}>
                          <span className="font-bold">{getSenderName(m)}</span>
                          <span>{isFromMe(m) ? "→" : "→"}</span>
                          <span>{getReceiverLabel(m)}</span>
                          {m.receiverId === null && (
                            <Badge
                              className={`text-[10px] h-5 px-1.5 ${
                                isFromMe(m)
                                  ? "bg-white/20 text-white border-white/30"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              <Users className="h-2.5 w-2.5 mr-0.5" />
                              Tous
                            </Badge>
                          )}
                        </div>
                        <p className={`mt-2 text-sm whitespace-pre-wrap leading-relaxed ${isFromMe(m) ? "text-white" : "text-violet-900/90"}`}>
                          {m.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-violet-600/70">
                          {formatDistanceToNow(new Date(m.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                          {" · "}
                          {format(new Date(m.createdAt), "HH:mm", { locale: fr })}
                        </span>
                        {isFromMe(m) && (
                          <span className="text-xs">
                            {m.readAt ? (
                              <CheckCheck className="h-3.5 w-3.5 inline text-violet-500" />
                            ) : (
                              <Check className="h-3.5 w-3.5 inline text-violet-400" />
                            )}
                          </span>
                        )}
                        {!isFromMe(m) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-100"
                            onClick={() => {
                              setReplyingTo(m);
                              setReplyContent("");
                            }}
                          >
                            <Reply className="h-3 w-3" />
                            Répondre
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Panel - Colorful Slide-in */}
      {replyingTo && (
        <>
          <div className="fixed inset-0 z-40 bg-violet-950/20 backdrop-blur-sm" onClick={() => { setReplyingTo(null); setReplyContent(""); }} aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
            <div className="mx-auto max-w-2xl">
              <Card className="border-2 border-violet-300/60 shadow-2xl shadow-violet-200/50 animate-in slide-in-from-bottom-4 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
                <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-fuchsia-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
                        <Reply className="h-4 w-4" />
                      </span>
                      Répondre à {getSenderName(replyingTo)}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-violet-200/50"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Message privé — seul {getSenderName(replyingTo)} le recevra
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Textarea
                    placeholder="Votre réponse..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                    className="resize-none border-2 border-violet-200/60 focus:border-violet-400 focus:ring-violet-200"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReply}
                      disabled={!replyContent.trim() || isSendingReply}
                      className="flex-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-violet-300/30"
                    >
                      {isSendingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Envoyer
                    </Button>
                    <Button
                      variant="outline"
                      className="border-violet-200 hover:bg-violet-50"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
