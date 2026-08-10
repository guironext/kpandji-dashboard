"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUser } from "@clerk/nextjs";
import {
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TacheActiviteProjetRoutineListItem } from "@/lib/actions/tache-activite-projet-routine";
import {
  getTacheDocuments,
  uploadTacheDocument,
  type TacheDocumentItem,
} from "@/lib/actions/tache-activite-projet-routine-document";

const DOCUMENT_TYPES = [
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "MEMOIRE", label: "Mémoire" },
  { value: "AVIS_TECHNIQUE", label: "Avis technique" },
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Vidéo" },
  { value: "AUDIO", label: "Audio" },
  { value: "AUTRE", label: "Autre" },
] as const;

const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.mp3";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tache: TacheActiviteProjetRoutineListItem | null;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function TacheDocumentUploadDialog({ open, onOpenChange, tache }: Props) {
  const { user: clerkUser } = useUser();
  const [documents, setDocuments] = useState<TacheDocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [nom, setNom] = useState("");
  const [typeDocument, setTypeDocument] = useState<string>("DOCUMENTATION");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    if (!tache) return;

    setIsLoadingDocs(true);
    try {
      const result = await getTacheDocuments(tache.id, clerkUser?.id);
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
      setIsLoadingDocs(false);
    }
  }, [clerkUser?.id, tache]);

  useEffect(() => {
    if (open && tache?.id) {
      setNom("");
      setTypeDocument("DOCUMENTATION");
      setFile(null);
      void loadDocuments();
    } else if (!open) {
      setDocuments([]);
      setFile(null);
    }
  }, [open, tache?.id, loadDocuments]);

  const handleFile = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      toast.error("La taille maximale est de 25 Mo.");
      return;
    }
    setFile(selected);
    if (!nom.trim()) {
      setNom(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!tache || !file || isUploading) return;

    const trimmedNom = nom.trim();
    if (!trimmedNom) {
      toast.error("Le nom du document est requis.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("tacheId", tache.id);
      formData.append("nom", trimmedNom);
      formData.append("typeDocument", typeDocument);
      formData.append("file", file);

      const result = await uploadTacheDocument(formData, clerkUser?.id);
      if (result.success) {
        setDocuments((prev) => [result.document, ...prev]);
        setNom("");
        setTypeDocument("DOCUMENTATION");
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        toast.success("Document chargé avec succès.");
      } else {
        toast.error(result.error ?? "Erreur lors du chargement.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement du document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm">
              <FileUp className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="line-clamp-1 text-base font-bold text-slate-900">
                Charger un document
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-600">
                {tache?.libelle ?? "Tâche"}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="tache-doc-nom" className="text-xs font-semibold text-slate-700">
              Nom du document
            </Label>
            <Input
              id="tache-doc-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. Rapport d'avancement"
              className="h-10 rounded-xl border-slate-200"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Type de document</Label>
            <Select value={typeDocument} onValueChange={setTypeDocument} disabled={isUploading}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Fichier</Label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFile(event.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
                dragActive
                  ? "border-sky-400 bg-sky-50/80"
                  : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_DOCUMENT_TYPES}
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-900"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-sky-400" />
                  <p className="text-sm font-medium text-slate-700">
                    Glissez un fichier ou cliquez pour parcourir
                  </p>
                  <p className="mt-1 text-xs text-slate-500">PDF, Word, Excel, images… max. 25 Mo</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Documents déjà chargés ({documents.length})
            </p>
            {isLoadingDocs ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              </div>
            ) : documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-xs text-slate-500">
                Aucun document pour cette tâche.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{doc.nom}</p>
                      <p className="text-[11px] text-slate-500">
                        {DOCUMENT_TYPES.find((t) => t.value === doc.typeDocument)?.label ??
                          doc.typeDocument}{" "}
                        · {format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg p-1.5 text-sky-600 hover:bg-sky-50"
                      aria-label={`Ouvrir ${doc.nom}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Fermer
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700"
              onClick={() => void handleUpload()}
              disabled={isUploading || !file || !nom.trim()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileUp className="mr-1.5 h-4 w-4" />
                  Charger
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
