"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  finishPublicationForClerkUser,
  getPublicationsWithValideeTasksForClerkUser,
  type PublicationWithValideeTasks,
} from "@/lib/actions/publication-objectif-global-rubrique";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Newspaper, RefreshCw } from "lucide-react";

type FlatRow = {
  publicationId: string;
  titrePublication: string;
  taskId: string;
  taskTitle: string;
  publicationRowSpan: number;
  isFirstTaskRow: boolean;
};

function flattenPublications(publications: PublicationWithValideeTasks[]): FlatRow[] {
  const rows: FlatRow[] = [];

  for (const pub of publications) {
    const taskCount = pub.valideeTasks.length;
    pub.valideeTasks.forEach((task, index) => {
      rows.push({
        publicationId: pub.id,
        titrePublication: pub.titrePublication,
        taskId: task.id,
        taskTitle: task.title,
        publicationRowSpan: taskCount,
        isFirstTaskRow: index === 0,
      });
    });
  }

  return rows;
}

export default function PublicationsPageClient() {
  const { userId: clerkId, isLoaded: authLoaded } = useAuth();
  const [publications, setPublications] = useState<PublicationWithValideeTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finishingPublicationId, setFinishingPublicationId] = useState<string | null>(null);

  const loadPublications = useCallback(async () => {
    if (!clerkId) {
      setPublications([]);
      setLoading(false);
      setError("Utilisateur non connecté.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getPublicationsWithValideeTasksForClerkUser(clerkId);
    if (!res.success) {
      setPublications([]);
      setError(res.error);
    } else {
      setPublications(res.publications);
    }

    setLoading(false);
  }, [clerkId]);

  useEffect(() => {
    if (!authLoaded) return;
    void loadPublications();
  }, [authLoaded, loadPublications]);

  const rows = useMemo(() => flattenPublications(publications), [publications]);
  const totalTasks = useMemo(
    () => publications.reduce((sum, pub) => sum + pub.valideeTasks.length, 0),
    [publications]
  );

  const handleFinishPublication = async (publicationId: string) => {
    if (!clerkId) {
      toast.error("Utilisateur non connecté.");
      return;
    }

    setFinishingPublicationId(publicationId);
    const res = await finishPublicationForClerkUser(publicationId, clerkId);
    setFinishingPublicationId(null);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setPublications((prev) => prev.filter((pub) => pub.id !== publicationId));
    toast.success("Publication terminée.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <article className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-white shadow-lg shadow-slate-200/40 ring-1 ring-emerald-500/20">
        <header className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md sm:h-12 sm:w-12 sm:rounded-2xl">
              <Newspaper className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Publications</h1>
              <p className="text-sm text-slate-600">
                Publications avec tâches validées par l&apos;équipe communication
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
              {publications.length} publication{publications.length !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
              {totalTasks} tâche{totalTasks !== 1 ? "s" : ""} validée{totalTasks !== 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadPublications()}
              disabled={loading || !authLoaded}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Actualiser</span>
            </Button>
          </div>
        </header>

        <div className="min-h-[min(60vh,520px)] bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des publications…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-900">Aucune publication avec tâche validée</p>
                <p className="mt-1 text-sm text-slate-500">
                  Les publications apparaîtront ici lorsque des tâches auront le statut « Validée ».
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Publication</TableHead>
                    <TableHead>Tâche validée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.taskId} className="align-top">
                      {row.isFirstTaskRow && (
                        <TableCell
                          rowSpan={row.publicationRowSpan}
                          className="max-w-[280px] whitespace-normal font-medium text-slate-900"
                        >
                          {row.titrePublication}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-normal">
                        <span className="font-medium text-slate-900">{row.taskTitle}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
                          )}
                        >
                          Validée
                        </Badge>
                      </TableCell>
                      {row.isFirstTaskRow && (
                        <TableCell rowSpan={row.publicationRowSpan}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="whitespace-normal border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                            disabled={finishingPublicationId === row.publicationId}
                            onClick={() => void handleFinishPublication(row.publicationId)}
                          >
                            {finishingPublicationId === row.publicationId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Terminer la Publication"
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
