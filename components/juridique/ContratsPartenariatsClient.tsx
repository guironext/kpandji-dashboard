"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  Handshake,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Sparkles,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel } from "@/lib/contentieux-display";
import {
  createContratEtPartenariat,
  createPartenaireSignataire,
} from "@/lib/actions/contrats-partenariats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const TYPE_CONTRAT = [
  "CONTRAT",
  "PARTENARIAT",
  "DELEGATION",
  "AGREMENT",
  "CONVENTION",
  "CONTRAT_DE_LOCATION",
  "CONTRAT_DE_LOCATION_VENTE",
  "CONTRAT_DE_LOCATION_VENTE_MISE_EN_LOCATION",
  "CONTRAT_DE_LOCATION_VENTE_MISE_EN_LOCATION_VENTE",
] as const;

const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.txt";

const contratSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  typeContrat: z.enum(TYPE_CONTRAT),
  description: z.string().min(1, "La description est requise"),
});

const partenaireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  fonction: z.string().optional(),
  entreprise: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  codePostal: z.string().optional(),
  pays: z.string().optional(),
  dateSignature: z.string().min(1, "La date de signature est requise"),
  dateCloture: z.string().optional(),
  contratEtPartenariatsId: z.string().min(1, "Le contrat signé est requis"),
});

export type ContratItem = {
  id: string;
  titre: string;
  typeContrat: string;
  description: string;
  nomFichier: string | null;
  url: string | null;
  dateUpload: Date | null;
  createdAt: Date;
  _count: { partenaireSignataire: number };
};

export type PartenaireItem = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  fonction: string | null;
  entreprise: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  pays: string | null;
  dateSignature: Date;
  dateCloture: Date | null;
  createdAt: Date;
  contratEtPartenariats: {
    id: string;
    titre: string;
    typeContrat: string;
  };
};

type Props = {
  contrats: ContratItem[];
  partenaires: PartenaireItem[];
  variant?: "default" | "registre";
};

type ViewMode = "grid" | "table";
type ActiveTab = "contrat" | "partenariat";

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500";

const dialogContentClass =
  "flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-xl";

function DialogFormHeader({
  icon: Icon,
  title,
  description,
  gradient = "from-violet-50 to-indigo-50/80",
  iconGradient = "from-violet-500 to-indigo-600",
}: {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  gradient?: string;
  iconGradient?: string;
}) {
  return (
    <DialogHeader
      className={cn("border-b border-slate-100 bg-gradient-to-br px-5 py-5 sm:px-6", gradient)}
    >
      <div className="flex items-start gap-3 pr-6">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
            iconGradient
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-600">{description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}

function DialogFormSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 ring-1 ring-violet-100">
            <Icon className="h-4 w-4 text-violet-600" />
          </div>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function DialogFormFooter({
  formId,
  onCancel,
  submitting,
  submitLabel,
  submitIcon: SubmitIcon = Save,
  disabled,
  accent = "from-violet-600 to-indigo-600",
}: {
  formId: string;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
  submitIcon?: React.ElementType;
  disabled?: boolean;
  accent?: string;
}) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 w-full rounded-xl border-slate-200 sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={submitting || disabled}
          className={cn(
            "h-11 w-full rounded-xl bg-gradient-to-r text-white shadow-md hover:opacity-95 disabled:opacity-60 sm:w-auto",
            accent
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <SubmitIcon className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
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
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
          dragActive
            ? "border-violet-400 bg-violet-50/80"
            : "border-slate-200 bg-slate-50/60 hover:border-violet-300 hover:bg-violet-50/40"
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
          <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              Glissez un fichier ou cliquez pour parcourir
            </p>
            <p className="mt-1 text-xs text-slate-500">PDF, Word, Excel, images — max 25 Mo</p>
          </>
        )}
      </div>
    </div>
  );
}

function ContratCard({ contrat }: { contrat: ContratItem }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/60">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-600" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 text-base font-bold tracking-tight text-slate-900 group-hover:text-violet-700">
                {contrat.titre}
              </h3>
              <Badge variant="secondary" className="shrink-0 font-normal">
                {formatEnumLabel(contrat.typeContrat)}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {contrat.description}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
            <FileText className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            {format(new Date(contrat.createdAt), "dd MMM yyyy", { locale: fr })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            <Users className="h-3 w-3" />
            {contrat._count.partenaireSignataire} signataire
            {contrat._count.partenaireSignataire !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          {contrat.url ? (
            <a
              href={contrat.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition hover:text-violet-800 hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">{contrat.nomFichier ?? "Voir le document"}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <span className="text-sm text-slate-400">Aucun fichier joint</span>
          )}
        </div>
      </div>
    </article>
  );
}

function PartenaireCard({ partenaire }: { partenaire: PartenaireItem }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/60">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-violet-700">
              {partenaire.prenom} {partenaire.nom}
            </h3>
            {partenaire.fonction && (
              <p className="mt-0.5 text-sm text-slate-500">{partenaire.fonction}</p>
            )}
            {partenaire.entreprise && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                <Building2 className="h-3 w-3" />
                {partenaire.entreprise}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Handshake className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50/90 p-3 ring-1 ring-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Contrat signé
          </p>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-800">
            {partenaire.contratEtPartenariats.titre}
          </p>
          <Badge variant="outline" className="mt-1.5 text-[10px] font-normal">
            {formatEnumLabel(partenaire.contratEtPartenariats.typeContrat)}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            Signé le {format(new Date(partenaire.dateSignature), "dd MMM yyyy", { locale: fr })}
          </span>
          {partenaire.dateCloture && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
              Clôture {format(new Date(partenaire.dateCloture), "dd MMM yyyy", { locale: fr })}
            </span>
          )}
        </div>

        {(partenaire.email || partenaire.telephone) && (
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
            {partenaire.email && (
              <p className="flex items-center gap-1.5 truncate text-xs text-slate-600">
                <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                {partenaire.email}
              </p>
            )}
            {partenaire.telephone && (
              <p className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                {partenaire.telephone}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  type,
  hasFilters,
  onClearFilters,
  onAdd,
}: {
  type: ActiveTab;
  hasFilters: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
}) {
  const isContrat = type === "contrat";
  const Icon = isContrat ? FileText : Handshake;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white/90 px-6 py-12 text-center shadow-sm sm:py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 shadow-inner sm:h-20 sm:w-20">
        <Icon className="h-8 w-8 text-violet-500 sm:h-10 sm:w-10" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900 sm:mt-6">
        {hasFilters
          ? "Aucun résultat"
          : isContrat
            ? "Aucun contrat enregistré"
            : "Aucun partenariat enregistré"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "Aucun élément ne correspond à vos critères. Modifiez la recherche ou réinitialisez les filtres."
          : isContrat
            ? "Commencez par ajouter votre premier contrat et téléverser le document associé."
            : "Enregistrez un partenaire signataire et associez-le à un contrat existant."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6">
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters} className="h-11 rounded-xl">
            Réinitialiser les filtres
          </Button>
        )}
        <Button
          onClick={onAdd}
          className="h-11 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-white shadow-md hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          {isContrat ? "Ajouter un contrat" : "Ajouter un partenariat"}
        </Button>
      </div>
    </div>
  );
}

export default function ContratsPartenariatsClient({
  contrats,
  partenaires,
  variant = "default",
}: Props) {
  const isRegistre = variant === "registre";
  const [contratsList, setContratsList] = useState(contrats);
  const [partenairesList, setPartenairesList] = useState(partenaires);
  const [activeTab, setActiveTab] = useState<ActiveTab>("contrat");
  const [viewMode, setViewMode] = useState<ViewMode>(isRegistre ? "table" : "grid");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [contratDialogOpen, setContratDialogOpen] = useState(false);
  const [partenaireDialogOpen, setPartenaireDialogOpen] = useState(false);
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [submittingContrat, setSubmittingContrat] = useState(false);
  const [submittingPartenaire, setSubmittingPartenaire] = useState(false);

  const contratForm = useForm<z.infer<typeof contratSchema>>({
    resolver: zodResolver(contratSchema),
    defaultValues: {
      titre: "",
      typeContrat: "CONTRAT",
      description: "",
    },
  });

  const partenaireForm = useForm<z.infer<typeof partenaireSchema>>({
    resolver: zodResolver(partenaireSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      fonction: "",
      entreprise: "",
      adresse: "",
      ville: "",
      codePostal: "",
      pays: "",
      dateSignature: "",
      dateCloture: "",
      contratEtPartenariatsId: "",
    },
  });

  const stats = useMemo(() => {
    const withFile = contratsList.filter((c) => c.url).length;
    const types = new Set(contratsList.map((c) => c.typeContrat)).size;
    const withEntreprise = partenairesList.filter((p) => p.entreprise).length;
    return {
      contrats: contratsList.length,
      partenaires: partenairesList.length,
      withFile,
      types,
      withEntreprise,
    };
  }, [contratsList, partenairesList]);

  const kpiCards = [
    {
      label: "Contrats",
      value: stats.contrats,
      sub: "Documents enregistrés",
      icon: FileText,
      accent: "from-violet-500 to-indigo-600",
      iconBg: "bg-violet-50 text-violet-600",
    },
    {
      label: "Partenariats",
      value: stats.partenaires,
      sub: "Signataires associés",
      icon: Handshake,
      accent: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Fichiers joints",
      value: stats.withFile,
      sub: "Contrats avec document",
      icon: Upload,
      accent: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-50 text-sky-600",
    },
    {
      label: "Types distincts",
      value: stats.types,
      sub: "Catégories de contrats",
      icon: Building2,
      accent: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-50 text-amber-600",
    },
  ];

  const filteredContrats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contratsList.filter((contrat) => {
      if (typeFilter !== "all" && contrat.typeContrat !== typeFilter) return false;
      if (!q) return true;
      return (
        contrat.titre.toLowerCase().includes(q) ||
        contrat.description.toLowerCase().includes(q) ||
        formatEnumLabel(contrat.typeContrat).toLowerCase().includes(q)
      );
    });
  }, [contratsList, search, typeFilter]);

  const filteredPartenaires = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partenairesList.filter((partenaire) => {
      if (typeFilter !== "all" && partenaire.contratEtPartenariats.typeContrat !== typeFilter)
        return false;
      if (!q) return true;
      const fullName = `${partenaire.prenom} ${partenaire.nom}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (partenaire.entreprise?.toLowerCase().includes(q) ?? false) ||
        partenaire.contratEtPartenariats.titre.toLowerCase().includes(q) ||
        (partenaire.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [partenairesList, search, typeFilter]);

  const hasFilters = search.trim() !== "" || typeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
  };

  const resetContratForm = () => {
    contratForm.reset({
      titre: "",
      typeContrat: "CONTRAT",
      description: "",
    });
    setContratFile(null);
  };

  const resetPartenaireForm = () => {
    partenaireForm.reset({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      fonction: "",
      entreprise: "",
      adresse: "",
      ville: "",
      codePostal: "",
      pays: "",
      dateSignature: "",
      dateCloture: "",
      contratEtPartenariatsId: "",
    });
  };

  const onSubmitContrat = async (data: z.infer<typeof contratSchema>) => {
    if (!contratFile) {
      toast.error("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    setSubmittingContrat(true);
    try {
      const formData = new FormData();
      formData.append("titre", data.titre);
      formData.append("typeContrat", data.typeContrat);
      formData.append("description", data.description);
      formData.append("file", contratFile);

      const result = await createContratEtPartenariat(formData);

      if (result.success && result.data) {
        toast.success("Contrat ajouté avec succès");
        setContratsList((prev) => [
          {
            id: result.data!.id,
            titre: result.data!.titre,
            typeContrat: result.data!.typeContrat,
            description: result.data!.description,
            nomFichier: result.data!.nomFichier,
            url: result.data!.url,
            dateUpload: result.data!.dateUpload,
            createdAt: result.data!.createdAt,
            _count: { partenaireSignataire: 0 },
          },
          ...prev,
        ]);
        resetContratForm();
        setContratDialogOpen(false);
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout du contrat");
      }
    } catch {
      toast.error("Erreur lors de l'ajout du contrat");
    } finally {
      setSubmittingContrat(false);
    }
  };

  const onSubmitPartenaire = async (data: z.infer<typeof partenaireSchema>) => {
    setSubmittingPartenaire(true);
    try {
      const result = await createPartenaireSignataire({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || undefined,
        telephone: data.telephone || undefined,
        fonction: data.fonction || undefined,
        entreprise: data.entreprise || undefined,
        adresse: data.adresse || undefined,
        ville: data.ville || undefined,
        codePostal: data.codePostal || undefined,
        pays: data.pays || undefined,
        dateSignature: new Date(data.dateSignature),
        dateCloture: data.dateCloture ? new Date(data.dateCloture) : null,
        contratEtPartenariatsId: data.contratEtPartenariatsId,
      });

      if (result.success && result.data) {
        toast.success("Partenariat ajouté avec succès");
        const contrat = result.data.contratEtPartenariats;
        setPartenairesList((prev) => [
          {
            id: result.data!.id,
            nom: result.data!.nom,
            prenom: result.data!.prenom,
            email: result.data!.email,
            telephone: result.data!.telephone,
            fonction: result.data!.fonction,
            entreprise: result.data!.entreprise,
            adresse: result.data!.adresse,
            ville: result.data!.ville,
            codePostal: result.data!.codePostal,
            pays: result.data!.pays,
            dateSignature: result.data!.dateSignature,
            dateCloture: result.data!.dateCloture,
            createdAt: result.data!.createdAt,
            contratEtPartenariats: contrat,
          },
          ...prev,
        ]);
        setContratsList((prev) =>
          prev.map((c) =>
            c.id === data.contratEtPartenariatsId
              ? {
                  ...c,
                  _count: {
                    partenaireSignataire: c._count.partenaireSignataire + 1,
                  },
                }
              : c
          )
        );
        resetPartenaireForm();
        setPartenaireDialogOpen(false);
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout du partenariat");
      }
    } catch {
      toast.error("Erreur lors de l'ajout du partenariat");
    } finally {
      setSubmittingPartenaire(false);
    }
  };

  const openAddDialog = () => {
    if (activeTab === "contrat") {
      resetContratForm();
      setContratDialogOpen(true);
    } else {
      resetPartenaireForm();
      setPartenaireDialogOpen(true);
    }
  };

  const currentFiltered = activeTab === "contrat" ? filteredContrats : filteredPartenaires;
  const resultLabel = `${currentFiltered.length} résultat${currentFiltered.length !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-full bg-slate-50/80">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 px-4 pb-24 pt-8 sm:px-6 sm:pb-28 lg:px-8">
        <div
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                {isRegistre
                  ? "Service Juridique · Registre"
                  : "Service Juridique · Contrats"}
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md sm:h-14 sm:w-14">
                  {isRegistre ? (
                    <List className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  ) : (
                    <Handshake className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    {isRegistre
                      ? "Liste des contrats et partenariats"
                      : "Contrats et partenariats"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    {isRegistre
                      ? "Consultez l'ensemble des contrats enregistrés et des partenaires signataires associés."
                      : "Centralisez vos contrats, téléversez les documents et suivez les partenaires signataires associés."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm">
                  <FileText className="h-3.5 w-3.5 text-violet-300" />
                  {stats.contrats} contrat{stats.contrats !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                  <Users className="h-3.5 w-3.5" />
                  {stats.partenaires} partenaire{stats.partenaires !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={openAddDialog}
              className="w-full shrink-0 rounded-2xl border-0 bg-white px-6 text-violet-950 shadow-xl shadow-black/20 hover:bg-violet-50 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {activeTab === "contrat" ? "Ajouter un contrat" : "Ajouter un partenariat"}
            </Button>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="overflow-hidden border-0 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <div className={cn("h-1 bg-gradient-to-r", kpi.accent)} />
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                        {kpi.label}
                      </p>
                      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                        {kpi.value}
                      </p>
                      <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{kpi.sub}</p>
                    </div>
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl",
                        kpi.iconBg
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main content */}
        <div className="relative mt-6 space-y-5 pb-10 sm:mt-8 sm:space-y-6 sm:pb-12">
          <div
            className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl"
            aria-hidden
          />

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as ActiveTab);
              clearFilters();
            }}
            className="relative w-full"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100 p-1 sm:max-w-md">
                <TabsTrigger
                  value="contrat"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm"
                >
                  <FileText className="mr-1.5 h-4 w-4 sm:mr-2" />
                  <span className="text-sm">Contrats</span>
                </TabsTrigger>
                <TabsTrigger
                  value="partenariat"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm"
                >
                  <Handshake className="mr-1.5 h-4 w-4 sm:mr-2" />
                  <span className="text-sm">Partenariats</span>
                </TabsTrigger>
              </TabsList>
              <p className="text-sm font-medium text-slate-500">{resultLabel}</p>
            </div>

            {/* Toolbar — shared between tabs */}
            <div className="sticky top-0 z-10 mt-5 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm backdrop-blur-md sm:mt-6 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative min-w-0 flex-1 lg:max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      activeTab === "contrat"
                        ? "Rechercher par titre, type ou description…"
                        : "Rechercher par nom, entreprise ou contrat…"
                    }
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 shadow-sm focus-visible:ring-violet-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-11 w-full min-w-0 flex-1 rounded-xl border-slate-200 sm:w-[180px] sm:flex-none">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {TYPE_CONTRAT.map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatEnumLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFilters}
                      className="h-11 w-11 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100"
                      title="Réinitialiser les filtres"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-9 w-9 rounded-lg",
                        viewMode === "grid" && "bg-violet-600 text-white hover:bg-violet-700"
                      )}
                      title="Vue grille"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "h-9 w-9 rounded-lg",
                        viewMode === "table" && "bg-violet-600 text-white hover:bg-violet-700"
                      )}
                      title="Vue tableau"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <TabsContent value="contrat" className="mt-5 space-y-4 sm:mt-6">
              {filteredContrats.length === 0 ? (
                <EmptyState
                  type="contrat"
                  hasFilters={hasFilters}
                  onClearFilters={clearFilters}
                  onAdd={() => {
                    resetContratForm();
                    setContratDialogOpen(true);
                  }}
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredContrats.map((contrat) => (
                    <ContratCard key={contrat.id} contrat={contrat} />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                          <TableHead className="min-w-[160px] font-semibold text-slate-700">
                            Titre
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">Type</TableHead>
                          <TableHead className="hidden font-semibold text-slate-700 md:table-cell">
                            Fichier
                          </TableHead>
                          <TableHead className="text-center font-semibold text-slate-700">
                            Partenaires
                          </TableHead>
                          <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                            Date création
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContrats.map((contrat) => (
                          <TableRow key={contrat.id} className="hover:bg-violet-50/40">
                            <TableCell>
                              <p className="font-medium text-slate-900">{contrat.titre}</p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 md:hidden">
                                {contrat.nomFichier ?? "Sans fichier"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-normal">
                                {formatEnumLabel(contrat.typeContrat)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {contrat.url ? (
                                <a
                                  href={contrat.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex max-w-[200px] items-center gap-1 truncate text-sm text-violet-600 hover:underline"
                                >
                                  {contrat.nomFichier ?? "Voir le fichier"}
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {contrat._count.partenaireSignataire}
                            </TableCell>
                            <TableCell className="hidden text-sm text-slate-600 sm:table-cell">
                              {format(new Date(contrat.createdAt), "dd MMM yyyy", { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="partenariat" className="mt-5 space-y-4 sm:mt-6">
              {filteredPartenaires.length === 0 ? (
                <EmptyState
                  type="partenariat"
                  hasFilters={hasFilters}
                  onClearFilters={clearFilters}
                  onAdd={() => {
                    resetPartenaireForm();
                    setPartenaireDialogOpen(true);
                  }}
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredPartenaires.map((partenaire) => (
                    <PartenaireCard key={partenaire.id} partenaire={partenaire} />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                          <TableHead className="min-w-[140px] font-semibold text-slate-700">
                            Signataire
                          </TableHead>
                          <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                            Entreprise
                          </TableHead>
                          <TableHead className="min-w-[160px] font-semibold text-slate-700">
                            Contrat signé
                          </TableHead>
                          <TableHead className="hidden font-semibold text-slate-700 md:table-cell">
                            Date signature
                          </TableHead>
                          <TableHead className="hidden font-semibold text-slate-700 lg:table-cell">
                            Contact
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPartenaires.map((partenaire) => (
                          <TableRow key={partenaire.id} className="hover:bg-violet-50/40">
                            <TableCell>
                              <p className="font-medium text-slate-900">
                                {partenaire.prenom} {partenaire.nom}
                              </p>
                              {partenaire.fonction && (
                                <p className="text-xs text-slate-500">{partenaire.fonction}</p>
                              )}
                              <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                                {partenaire.entreprise ?? "—"}
                              </p>
                            </TableCell>
                            <TableCell className="hidden text-sm text-slate-600 sm:table-cell">
                              {partenaire.entreprise ?? "—"}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-slate-800">
                                {partenaire.contratEtPartenariats.titre}
                              </p>
                              <Badge variant="outline" className="mt-1 text-[10px] font-normal">
                                {formatEnumLabel(partenaire.contratEtPartenariats.typeContrat)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden text-sm text-slate-600 md:table-cell">
                              {format(new Date(partenaire.dateSignature), "dd MMM yyyy", {
                                locale: fr,
                              })}
                            </TableCell>
                            <TableCell className="hidden text-sm text-slate-600 lg:table-cell">
                              {partenaire.email && <p className="truncate">{partenaire.email}</p>}
                              {partenaire.telephone && (
                                <p className="text-slate-500">{partenaire.telephone}</p>
                              )}
                              {!partenaire.email && !partenaire.telephone && "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog Ajouter Contrat */}
      <Dialog
        open={contratDialogOpen}
        onOpenChange={(open) => {
          setContratDialogOpen(open);
          if (!open) resetContratForm();
        }}
      >
        <DialogContent className={dialogContentClass}>
          <DialogFormHeader
            icon={FileText}
            title="Ajouter un contrat"
            description="Renseignez les informations du contrat et téléversez le document associé."
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <Form {...contratForm}>
              <form
                id="form-ajouter-contrat"
                onSubmit={contratForm.handleSubmit(onSubmitContrat)}
                className="space-y-4"
              >
                <DialogFormSection
                  icon={FileText}
                  title="Informations générales"
                  description="Titre, type et description du contrat."
                >
                  <FormField
                    control={contratForm.control}
                    name="titre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">Titre</FormLabel>
                        <FormControl>
                          <Input
                            className={inputClass}
                            placeholder="Ex. Contrat de location véhicule"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contratForm.control}
                    name="typeContrat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Type de contrat
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TYPE_CONTRAT.map((type) => (
                              <SelectItem key={type} value={type}>
                                {formatEnumLabel(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contratForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[100px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500"
                            placeholder="Décrivez l'objet et les conditions principales du contrat…"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </DialogFormSection>

                <DialogFormSection
                  icon={Upload}
                  title="Document joint"
                  description="PDF, Word, Excel ou images — taille maximale 25 Mo."
                >
                  <DocumentUploadField file={contratFile} onFileChange={setContratFile} />
                </DialogFormSection>
              </form>
            </Form>
          </div>

          <DialogFormFooter
            formId="form-ajouter-contrat"
            onCancel={() => setContratDialogOpen(false)}
            submitting={submittingContrat}
            submitLabel="Enregistrer le contrat"
            submitIcon={FileText}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Ajouter Partenariat */}
      <Dialog
        open={partenaireDialogOpen}
        onOpenChange={(open) => {
          setPartenaireDialogOpen(open);
          if (!open) resetPartenaireForm();
        }}
      >
        <DialogContent className={cn(dialogContentClass, "sm:max-w-2xl")}>
          <DialogFormHeader
            icon={Handshake}
            title="Ajouter un partenariat"
            description="Enregistrez un partenaire signataire et associez-le à un contrat existant."
            gradient="from-emerald-50 to-teal-50/80"
            iconGradient="from-emerald-500 to-teal-600"
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {contratsList.length === 0 && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  Aucun contrat disponible.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setPartenaireDialogOpen(false);
                      resetContratForm();
                      setContratDialogOpen(true);
                    }}
                    className="font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950"
                  >
                    Créez d&apos;abord un contrat
                  </button>{" "}
                  avant d&apos;ajouter un partenaire signataire.
                </p>
              </div>
            )}

            <Form {...partenaireForm}>
              <form
                id="form-ajouter-partenariat"
                onSubmit={partenaireForm.handleSubmit(onSubmitPartenaire)}
                className="space-y-4"
              >
                <DialogFormSection
                  icon={Link2}
                  title="Contrat associé"
                  description="Sélectionnez le contrat signé par ce partenaire."
                >
                  <FormField
                    control={partenaireForm.control}
                    name="contratEtPartenariatsId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Contrat signé
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={contratsList.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue placeholder="Sélectionner un contrat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contratsList.length === 0 ? (
                              <SelectItem value="__none" disabled>
                                Aucun contrat disponible
                              </SelectItem>
                            ) : (
                              contratsList.map((contrat) => (
                                <SelectItem key={contrat.id} value={contrat.id}>
                                  {contrat.titre} — {formatEnumLabel(contrat.typeContrat)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </DialogFormSection>

                <DialogFormSection
                  icon={User}
                  title="Identité du signataire"
                  description="Nom, prénom et informations professionnelles."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={partenaireForm.control}
                      name="prenom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Prénom
                          </FormLabel>
                          <FormControl>
                            <Input className={inputClass} placeholder="Prénom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partenaireForm.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">Nom</FormLabel>
                          <FormControl>
                            <Input className={inputClass} placeholder="Nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={partenaireForm.control}
                    name="entreprise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Entreprise
                        </FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Raison sociale" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={partenaireForm.control}
                    name="fonction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Fonction
                        </FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Directeur, Gérant…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </DialogFormSection>

                <DialogFormSection
                  icon={Mail}
                  title="Coordonnées"
                  description="Email et téléphone du signataire (optionnels)."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={partenaireForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              className={inputClass}
                              placeholder="email@exemple.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partenaireForm.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Téléphone
                          </FormLabel>
                          <FormControl>
                            <Input className={inputClass} placeholder="+225 …" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </DialogFormSection>

                <DialogFormSection
                  icon={MapPin}
                  title="Adresse"
                  description="Localisation du signataire ou de l'entreprise."
                >
                  <FormField
                    control={partenaireForm.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Adresse
                        </FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Rue, numéro…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={partenaireForm.control}
                      name="ville"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Ville
                          </FormLabel>
                          <FormControl>
                            <Input className={inputClass} placeholder="Ville" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partenaireForm.control}
                      name="codePostal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Code postal
                          </FormLabel>
                          <FormControl>
                            <Input className={inputClass} placeholder="Code postal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partenaireForm.control}
                      name="pays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">Pays</FormLabel>
                          <FormControl>
                            <Input className={inputClass} placeholder="Pays" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </DialogFormSection>

                <DialogFormSection
                  icon={Calendar}
                  title="Dates"
                  description="Date de signature obligatoire, clôture optionnelle."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={partenaireForm.control}
                      name="dateSignature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Date de signature
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partenaireForm.control}
                      name="dateCloture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Date de clôture
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </DialogFormSection>
              </form>
            </Form>
          </div>

          <DialogFormFooter
            formId="form-ajouter-partenariat"
            onCancel={() => setPartenaireDialogOpen(false)}
            submitting={submittingPartenaire}
            submitLabel="Enregistrer le partenariat"
            submitIcon={Handshake}
            disabled={contratsList.length === 0}
            accent="from-emerald-600 to-teal-600"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
