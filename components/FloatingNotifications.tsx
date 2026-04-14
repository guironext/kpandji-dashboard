"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  clearAppNotifications,
  markAllAppNotificationsRead,
  subscribeToAppNotifications,
  type AppNotification,
} from "@/lib/app-notifications";

function typeLabel(type: AppNotification["type"]) {
  switch (type) {
    case "message":
      return "Message";
    case "success":
      return "Succès";
    case "warning":
      return "Alerte";
    case "error":
      return "Erreur";
    case "info":
    default:
      return "Info";
  }
}

function typeBadgeVariant(type: AppNotification["type"]): React.ComponentProps<typeof Badge>["variant"] {
  switch (type) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "error":
      return "destructive";
    case "message":
      return "outline";
    case "info":
    default:
      return "secondary";
  }
}

function typeAccent(type: AppNotification["type"]) {
  switch (type) {
    case "error":
      return "from-rose-500 to-red-500";
    case "warning":
      return "from-amber-500 to-orange-500";
    case "success":
      return "from-emerald-500 to-green-500";
    case "message":
      return "from-violet-500 to-fuchsia-500";
    case "info":
    default:
      return "from-sky-500 to-blue-500";
  }
}

function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch {
    return "";
  }
}

export default function FloatingNotifications() {
  const [list, setList] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"unread" | "all">("unread");

  useEffect(() => subscribeToAppNotifications(setList), []);

  const unreadCount = useMemo(() => list.filter((n) => !n.read).length, [list]);
  const filtered = useMemo(() => {
    if (filter === "unread") return list.filter((n) => !n.read);
    return list;
  }, [filter, list]);

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            className="relative h-12 w-12 rounded-full shadow-lg shadow-amber-500/25 bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-400 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-400 text-white border border-white/25"
            aria-label="Ouvrir les notifications"
          >
            <Bell className="h-5 w-5 drop-shadow" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold leading-none text-amber-800 shadow ring-2 ring-white/60">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="top"
          className="z-[9999] w-[380px] p-0 overflow-hidden rounded-xl border bg-white shadow-2xl shadow-black/10"
        >
          <div className="relative border-b">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50" />
            <div className="relative px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-400 text-white shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900">Notifications</div>
                      <div className="text-xs text-gray-600 truncate">
                        {unreadCount > 0 ? `${unreadCount} non lue(s)` : "Tout est à jour"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-white/70 hover:bg-white"
                    onClick={() => markAllAppNotificationsRead()}
                    disabled={list.length === 0 || unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Tout lire
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-white/70 hover:bg-white"
                    onClick={() => clearAppNotifications()}
                    disabled={list.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    Vider
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  className={
                    filter === "unread"
                        ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 text-white hover:opacity-95"
                      : "bg-white/70 hover:bg-white"
                  }
                  onClick={() => setFilter("unread")}
                >
                  Non lues
                  {unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  className={
                    filter === "all"
                      ? "bg-gray-900 text-white hover:bg-gray-900/90"
                      : "bg-white/70 hover:bg-white"
                  }
                  onClick={() => setFilter("all")}
                >
                  Toutes
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto bg-white">
            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100">
                  <Bell className="h-5 w-5 text-violet-700" />
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {filter === "unread"
                    ? "Vous êtes à jour. Les nouvelles alertes apparaîtront ici."
                    : "Les alertes et messages apparaîtront ici."}
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((n) => (
                  <li key={n.id} className="group">
                    <div className="relative px-4 py-3 transition-colors hover:bg-gray-50/80">
                      <div className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-gray-200" />
                      {!n.read && (
                        <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${typeAccent(n.type)}`} />
                      )}

                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br ${typeAccent(n.type)}`} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={typeBadgeVariant(n.type)} className="text-[11px]">
                              {typeLabel(n.type)}
                            </Badge>
                            <span className="text-xs text-gray-400">{formatTime(n.createdAt)}</span>
                            {!n.read && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                Nouveau
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-sm text-gray-900 break-words leading-snug">
                            {n.title}
                          </div>

                          {n.href && (
                            <div className="mt-2">
                              <Link
                                href={n.href}
                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                              >
                                Ouvrir <ExternalLink className="h-4 w-4" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

