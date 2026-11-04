"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteObjectifMoisOpsDev } from "@/lib/actions/objectif-mois-ops-dev";

export default function DeleteObjectifButton({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onConfirm() {
    start(async () => {
      const res = await deleteObjectifMoisOpsDev(id);
      if (!res.success) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setOpen(true); }}
        title="Supprimer"
        aria-label="Supprimer"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 text-black space-y-4">
            <h2 className="text-lg font-bold">Supprimer l’objectif ?</h2>
            <p className="text-sm text-gray-600">
              « {label} » sera définitivement supprimé. Cette action est irréversible.
            </p>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg border px-4">Annuler</button>
              <button type="button" disabled={pending} onClick={onConfirm} className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white disabled:opacity-60">
                {pending ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
