"use client";

export type AppNotificationType = "message" | "info" | "success" | "warning" | "error";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  href?: string;
  createdAt: number; // epoch ms
  read: boolean;
};

const STORAGE_KEY = "kpandji:appNotifications:v1";
const MAX_NOTIFICATIONS = 50;

function safeParse(json: string | null): AppNotification[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((n) => n && typeof n === "object")
      .map((n) => n as AppNotification)
      .filter(
        (n) =>
          typeof n.id === "string" &&
          typeof n.type === "string" &&
          typeof n.title === "string" &&
          typeof n.createdAt === "number" &&
          typeof n.read === "boolean"
      )
      .slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
}

function readStore(): AppNotification[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function writeStore(list: AppNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS)));
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kpandji:appNotifications:changed"));
}

export function getAppNotifications(): AppNotification[] {
  return readStore();
}

export function addAppNotification(input: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string }) {
  const now = Date.now();
  const notif: AppNotification = {
    id: input.id ?? `${now}-${Math.random().toString(16).slice(2)}`,
    type: input.type,
    title: input.title,
    href: input.href,
    createdAt: now,
    read: false,
  };

  const current = readStore();
  const next = [notif, ...current].slice(0, MAX_NOTIFICATIONS);
  writeStore(next);
  emitChange();
}

export function markAllAppNotificationsRead() {
  const current = readStore();
  if (current.length === 0) return;
  const next = current.map((n) => ({ ...n, read: true }));
  writeStore(next);
  emitChange();
}

export function clearAppNotifications() {
  writeStore([]);
  emitChange();
}

export function subscribeToAppNotifications(onChange: (list: AppNotification[]) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => onChange(readStore());
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };

  window.addEventListener("kpandji:appNotifications:changed", handler);
  window.addEventListener("storage", storageHandler);
  handler();

  return () => {
    window.removeEventListener("kpandji:appNotifications:changed", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

