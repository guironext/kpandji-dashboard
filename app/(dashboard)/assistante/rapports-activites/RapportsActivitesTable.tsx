"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RapportActiviteListRow } from "@/lib/assistante/load-rapports-activites";

type Props = {
  initialRows: RapportActiviteListRow[];
};

export function RapportsActivitesTable({ initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const handleDelete = async (row: RapportActiviteListRow) => {
    if (
      !confirm(
        "Supprimer ce rapport d’activité ? Cette action est irréversible."
      )
    ) {
      return;
    }
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/agenda/${row.agendaId}/rapport`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !data.success) {
        toast.error(data.error || "Suppression impossible.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Rapport supprimé.");
      router.refresh();
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatRowDate = (iso: string) => {
    try {
      return format(parseISO(iso), "d MMM yyyy", { locale: fr });
    } catch {
      return "—";
    }
  };

  if (!rows.length) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/80 p-10 shadow-xl shadow-slate-200/40 md:p-14">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <FileText className="h-9 w-9 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Aucun rapport pour l’instant
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">
            Les rapports créés depuis votre agenda apparaîtront ici. Ouvrez une
            activité dans l’agenda pour rédiger un compte rendu.
          </p>
          <Button
            asChild
            className="mt-8 h-11 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
          >
            <Link href="/assistante/agenda">
              <Plus className="mr-2 h-4 w-4" />
              Aller à l’agenda
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 px-0.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Liste des rapports
          </h2>
          <p className="text-xs text-slate-400">{rows.length} entrée(s)</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl shadow-slate-200/30 ring-1 ring-slate-100/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="h-12 min-w-[10rem] bg-slate-50/90 pl-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Activité
                </TableHead>
                <TableHead className="h-12 bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </TableHead>
                <TableHead className="h-12 min-w-[6rem] bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Lieu
                </TableHead>
                <TableHead className="h-12 min-w-[6rem] bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Organisateur
                </TableHead>
                <TableHead className="h-12 w-[1%] min-w-[9rem] bg-slate-50/90 pr-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const busy = deletingId === row.id;
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "group border-slate-100 transition-colors",
                      "hover:bg-indigo-50/50 data-[state=selected]:bg-indigo-50/50"
                    )}
                  >
                    <TableCell className="pl-5 align-middle">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 opacity-60 transition group-hover:opacity-100"
                          aria-hidden
                        />
                        <span className="line-clamp-2 max-w-[220px] font-semibold text-slate-900 sm:max-w-xs">
                          {row.titre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-slate-700">
                      {formatRowDate(row.date)}
                    </TableCell>
                    <TableCell className="max-w-[8rem]">
                      <span
                        className="line-clamp-2 text-sm text-slate-600"
                        title={row.lieu || undefined}
                      >
                        {row.lieu || (
                          <span className="text-slate-400">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[8rem]">
                      <span
                        className="line-clamp-2 text-sm text-slate-600"
                        title={row.organisateur || undefined}
                      >
                        {row.organisateur || (
                          <span className="text-slate-400">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-1 shadow-inner">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                                asChild
                              >
                                <Link
                                  href={`/assistante/rapports-activites/${row.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Afficher</span>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Afficher</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                                asChild
                              >
                                <Link
                                  href={`/assistante/rapport?activityId=${encodeURIComponent(
                                    row.agendaId
                                  )}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Modifier</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  disabled={busy}
                                  onClick={() => void handleDelete(row)}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Supprimer</span>
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">Supprimer</TooltipContent>
                          </Tooltip>
                        </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
