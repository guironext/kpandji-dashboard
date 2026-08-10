"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  ExternalLink,
  FilePlus,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel } from "@/lib/contentieux-display";
import {
  createDocumentsContentieux,
  getDocumentsContentieuxByDossier,
} from "@/lib/actions/contentieux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_DOCUMENT = [
  "CONTRATS",
  "FACTURES",
  "COURRIERS",
  "JUGEMENTS",
  "PROCES_VERBAUX",
  "PHOTOS",
] as const;

const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.txt";

const documentSchema = z.object({
  nom: z.string().min(1, "Le nom du document est requis"),
  typeDocument: z.enum(TYPE_DOCUMENT),
});

export type DocumentContentieuxItem = {
  id: string;
  nom: string;
  typeDocument: string;
  nomFichier: string;
  dateUpload: Date;
  url: string;
  createdAt: Date;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  numeroDossier: string;
  onDocumentAdded?: () => void;
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function DocumentUploadField({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (selected: File | null) => {
    if (!selected) {
      onFileChange(null);
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      toast.error("La taille maximale est de 25 Mo.");
      return;
    }
    onFileChange(selected);
  };

  return (
    <div>
      <FormLabel className="text-xs">Fichier à téléverser</FormLabel>
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
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Upload className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-slate-800">
              Glissez-déposez ou cliquez pour parcourir
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">PDF, Word, Excel, images — 25 Mo max</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function DocumentsContentieuxDialog({
  open,
  onOpenChange,
  dossierId,
  numeroDossier,
  onDocumentAdded,
}: Props) {
  const [documents, setDocuments] = useState<DocumentContentieuxItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      nom: "",
      typeDocument: "CONTRATS",
    },
  });

  const loadDocuments = useCallback(async () => {
    setLoadingList(true);
    try {
      const result = await getDocumentsContentieuxByDossier(dossierId);
      if (result.success) {
        setDocuments(result.data);
      } else {
        toast.error(result.error ?? "Impossible de charger les documents");
        setDocuments([]);
      }
    } catch {
      toast.error("Impossible de charger les documents");
      setDocuments([]);
    } finally {
      setLoadingList(false);
    }
  }, [dossierId]);

  useEffect(() => {
    if (!open || !dossierId) return;
    form.reset({
      nom: "",
      typeDocument: "CONTRATS",
    });
    setDocumentFile(null);
    loadDocuments();
  }, [open, dossierId, loadDocuments, form]);

  const onSubmit = async (data: z.infer<typeof documentSchema>) => {
    if (!documentFile) {
      toast.error("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("dossierContentieuxId", dossierId);
      formData.append("nom", data.nom);
      formData.append("typeDocument", data.typeDocument);
      formData.append("file", documentFile);

      const result = await createDocumentsContentieux(formData);

      if (result.success && result.data) {
        toast.success("Document ajouté avec succès");
        setDocuments((prev) => [
          {
            id: result.data!.id,
            nom: result.data!.nom,
            typeDocument: result.data!.typeDocument,
            nomFichier: result.data!.nomFichier,
            dateUpload: result.data!.dateUpload,
            url: result.data!.url,
            createdAt: result.data!.createdAt,
          },
          ...prev,
        ]);
        form.reset({
          nom: "",
          typeDocument: "CONTRATS",
        });
        setDocumentFile(null);
        onDocumentAdded?.();
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout du document");
      }
    } catch {
      toast.error("Erreur lors de l'ajout du document");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-br from-sky-50 to-indigo-50/80 px-6 py-5">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Documents contentieux
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-600">
                Dossier <span className="font-medium text-sky-700">{numeroDossier}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Documents enregistrés ({documents.length})
            </p>

            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Aucun document enregistré
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Ajoutez un premier document avec le formulaire ci-dessous.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{doc.nom}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{doc.nomFichier}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Téléversé le{" "}
                          {format(new Date(doc.dateUpload), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 border-0 bg-sky-100 text-[10px] text-sky-800"
                      >
                        {formatEnumLabel(doc.typeDocument)}
                      </Badge>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ouvrir le fichier
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <FilePlus className="h-3.5 w-3.5" />
              Nouveau document
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Nom du document</FormLabel>
                        <FormControl>
                          <Input
                            className={inputClass}
                            placeholder="Ex. Contrat de vente"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="typeDocument"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Type de document</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TYPE_DOCUMENT.map((v) => (
                              <SelectItem key={v} value={v}>
                                {formatEnumLabel(v)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-2">
                    <DocumentUploadField file={documentFile} onFileChange={setDocumentFile} />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "h-10 w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600",
                    "text-white shadow-md hover:opacity-95"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <FilePlus className="mr-2 h-4 w-4" />
                      Ajouter le document
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
