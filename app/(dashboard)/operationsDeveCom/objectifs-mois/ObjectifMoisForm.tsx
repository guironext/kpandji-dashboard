"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { createObjectifMois, updateObjectifMoisOpsDev } from "@/lib/actions/objectif-mois-ops-dev";

const field = "w-full min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-amber-500";

export type ObjectifInitial = { id: string; objectif: string; description: string; startDate: string; endDate: string };

export default function ObjectifMoisForm({ initial }: { initial?: ObjectifInitial }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      objectif: String(f.get("objectif") ?? ""),
      description: String(f.get("description") ?? ""),
      startDate: String(f.get("startDate") ?? ""),
      endDate: String(f.get("endDate") ?? ""),
    };
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      setError("La date de fin doit être postérieure ou égale à la date de début");
      return;
    }
    setError(null);
    start(async () => {
      const res = initial ? await updateObjectifMoisOpsDev(initial.id, data) : await createObjectifMois(data);
      if (!res.success) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {initial ? (
        <button
          type="button"
          onClick={() => { setError(null); setOpen(true); }}
          title="Modifier"
          aria-label="Modifier"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 font-semibold text-black hover:bg-amber-400"
      >
        <Plus className="h-4 w-4" /> Définir un objectif
      </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 text-black space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{initial ? "Modifier l\u2019objectif" : "Nouvel objectif"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Objectif *</span>
              <input name="objectif" required className={field} placeholder="Ex : 20 nouveaux clients" defaultValue={initial?.objectif} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Description</span>
              <textarea name="description" rows={3} defaultValue={initial?.description} className={field} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Date de début *</span>
                <input type="date" name="startDate" required defaultValue={initial?.startDate} className={field} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Date de fin *</span>
                <input type="date" name="endDate" required defaultValue={initial?.endDate} className={field} />
              </label>
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg border px-4">Annuler</button>
              <button disabled={pending} className="min-h-11 rounded-lg bg-black px-4 font-semibold text-white disabled:opacity-60">
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
