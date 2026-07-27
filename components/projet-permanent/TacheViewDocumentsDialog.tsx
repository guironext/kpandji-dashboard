"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUser } from "@clerk/nextjs";
import { ExternalLink, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TacheActiviteProjetRoutineListItem } from "@/lib/actions/tache-activite-projet-routine";
import {
  getTacheDocumentsForCreator,
  type TacheDocumentItem,
} from "@/lib/actions/tache-activite-projet-routine-document";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  DOCUMENTATION: "Documentation",
  MEMOIRE: "Mémoire",
  AVIS_TECHNIQUE: "Avis technique",
  IMAGE: "Image",
  VIDEO: "Vidéo",
  AUDIO: "Audio",
  AUTRE: "Autre",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tache: TacheActiviteProjetRoutineListItem | null;
};

export default function TacheViewDocumentsDialog({ open, onOpenChange, tache }: Props) {
  const { user: clerkUser } = useUser();
  const [documents, setDocuments] = useState<TacheDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!tache) return;

    setIsLoading(true);
    try {
      const result = await getTacheDocumentsForCreator(tache.id, clerkUser?.id);
      if (result.success) {
        setDocuments(result.documents);
      } else {
        toast.error(result.error ?? "Impossible de charger les documents.");
        setDocuments([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des documents.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser?.id, tache]);

  useEffect(() => {
    if (open && tache?.id) {
      void loadDocuments();
    } else if (!open) {
      setDocuments([]);
    }
  }, [open, tache?.id, loadDocuments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-purple-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <Eye className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="line-clamp-1 text-base font-bold text-slate-900">
                Voir les documents
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-600">
                {tache?.libelle ?? "Tâche"} — fichiers chargés par le responsable
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-slate-500">
              <FileText className="h-8 w-8 text-slate-300" />
              <p className="text-sm">Aucun document chargé pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{doc.nom}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {DOCUMENT_TYPE_LABELS[doc.typeDocument] ?? doc.typeDocument}
                      {" · "}
                      {format(new Date(doc.createdAt), "d MMM yyyy, HH:mm", { locale: fr })}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Chargé par{" "}
                      <span className="font-medium text-slate-700">
                        {doc.user.firstName} {doc.user.lastName}
                      </span>
                    </p>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 p-2 text-violet-700 transition hover:bg-violet-100"
                    aria-label={`Ouvrir ${doc.nom}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
