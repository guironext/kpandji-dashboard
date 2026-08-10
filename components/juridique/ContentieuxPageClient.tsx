"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Gavel,
  Loader2,
  Save,
  Users,
  FileText,
  Calendar,
  Scale,
  FolderOpen,
  AlertCircle,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel, statutBadgeClass, typeBadgeClass } from "@/lib/contentieux-display";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createDossierContentieux,
  createDocumentsContentieux,
  createGestionAudiences,
  createGestionDesDecisionsDeJustice,
  createPartiesPrenantes,
} from "@/lib/actions/contentieux";

export type DossierContentieuxOption = {
  id: string;
  numeroDossier: string;
  typeDossier: string;
  statutDossier: string;
  objet: string;
  dateOuverture: Date;
};

type Props = {
  initialDossiers: DossierContentieuxOption[];
  visibleTabs?: TabId[];
  defaultTab?: TabId;
  pageTitle?: string;
  pageDescription?: string;
  heroBadge?: string;
  fixedTypeDossier?: (typeof TYPE_DOSSIER)[number];
  filterDossierType?: (typeof TYPE_DOSSIER)[number];
};

type TabId = "nouveau-dossier" | "parties" | "documents" | "audiences" | "decisions";

const TYPE_DOSSIER = [
  "CIVIL",
  "COMMERCIAL",
  "SOCIAL",
  "ADMINISTRATIF",
  "FISCAL",
  "PENAL",
] as const;

const TYPE_DOSSIER_LABELS: Record<(typeof TYPE_DOSSIER)[number], string> = {
  CIVIL: "Civil",
  COMMERCIAL: "Commercial",
  SOCIAL: "Social",
  ADMINISTRATIF: "Administratif",
  FISCAL: "Fiscal",
  PENAL: "Pénal",
};

function generateNumeroDossier(typeDossier: (typeof TYPE_DOSSIER)[number]): string {
  const prefix = typeDossier.slice(0, 3).toUpperCase();
  const now = new Date();
  const year = now.getFullYear();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${year}-${day}${month}${year}`;
}

const STATUT_DOSSIER = [
 
 
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "EN_COURS",
  "TERMINEE",
  "ANNULE",
] as const;

const TYPE_PARTIE = [
  "PERSONNE_PHYSIQUE",
  "PERSONNE_MORALE",
  "ENTREPRISE",
  "ORGANISATION",
  "ADMINISTRATION",
  "AUTRE",
] as const;

const TYPE_DOCUMENT = [
  "CONTRATS",
  "FACTURES",
  "COURRIERS",
  "JUGEMENTS",
  "PROCES_VERBAUX",
  "PHOTOS",
] as const;

const STATUT_AUDIENCE = [
  "RECLAMATION",
  "MISE_EN_DEMEURE",
  "CONCILIATION",
  "MEDIATION",
  "ASSIGNATION",
  "AUDIENCE",
  "JUGEMENT",
  "APPEL",
  "EXECUTION",
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "EN_COURS",
  "TERMINEE",
  "ANNULE",
] as const;

const STATUT_DECISION = [
  "EN_ATTENTE",
  "PARTIELLEMENT_EXECUTE",
  "EXECUTE",
  "NON_EXECUTE",
  "CONTESTEE",
  "EN_APPEL",
  "JUGEMENT",
  "ARRET",
  "ORDONNANCE",
  "APPEL",
  "EXECUTION",
  "EN_TRAITEMENT",
  "EN_COURS",
  "TERMINEE",
  "ANNULE",
] as const;

const TABS: {
  id: TabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  ring: string;
  panelBg: string;
  panelBorder: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  inactiveIcon: string;
}[] = [
  {
    id: "nouveau-dossier",
    label: "Nouveau dossier",
    shortLabel: "Dossier",
    description: "Ouvrir un litige",
    icon: Gavel,
    gradient: "from-indigo-500 via-violet-500 to-purple-600",
    ring: "ring-indigo-500/30",
    panelBg: "from-indigo-50/80 via-white to-violet-50/40",
    panelBorder: "border-indigo-100/80",
    inactiveBg: "bg-indigo-50/70",
    inactiveBorder: "border-indigo-200/70",
    inactiveText: "text-indigo-900",
    inactiveIcon: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "parties",
    label: "Gestion des parties",
    shortLabel: "Parties",
    description: "Parties prenantes",
    icon: Users,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    ring: "ring-violet-500/30",
    panelBg: "from-violet-50/80 via-white to-fuchsia-50/40",
    panelBorder: "border-violet-100/80",
    inactiveBg: "bg-violet-50/70",
    inactiveBorder: "border-violet-200/70",
    inactiveText: "text-violet-900",
    inactiveIcon: "bg-violet-100 text-violet-600",
  },
  {
    id: "documents",
    label: "Gestion documentaire",
    shortLabel: "Documents",
    description: "Pièces & fichiers",
    icon: FileText,
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    ring: "ring-sky-500/30",
    panelBg: "from-sky-50/80 via-white to-cyan-50/40",
    panelBorder: "border-sky-100/80",
    inactiveBg: "bg-sky-50/70",
    inactiveBorder: "border-sky-200/70",
    inactiveText: "text-sky-900",
    inactiveIcon: "bg-sky-100 text-sky-600",
  },
  {
    id: "audiences",
    label: "Gestion audiences",
    shortLabel: "Audiences",
    description: "Calendrier judiciaire",
    icon: Calendar,
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    ring: "ring-amber-500/30",
    panelBg: "from-amber-50/80 via-white to-orange-50/40",
    panelBorder: "border-amber-100/80",
    inactiveBg: "bg-amber-50/70",
    inactiveBorder: "border-amber-200/70",
    inactiveText: "text-amber-900",
    inactiveIcon: "bg-amber-100 text-amber-600",
  },
  {
    id: "decisions",
    label: "Gestion décisions",
    shortLabel: "Décisions",
    description: "Décisions de justice",
    icon: Scale,
    gradient: "from-emerald-500 via-teal-500 to-green-600",
    ring: "ring-emerald-500/30",
    panelBg: "from-emerald-50/80 via-white to-teal-50/40",
    panelBorder: "border-emerald-100/80",
    inactiveBg: "bg-emerald-50/70",
    inactiveBorder: "border-emerald-200/70",
    inactiveText: "text-emerald-900",
    inactiveIcon: "bg-emerald-100 text-emerald-600",
  },
];

const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id));

function resolveTabFromQuery(
  tab: string | null,
  allowedTabs: TabId[],
  fallback: TabId
): TabId {
  if (tab && VALID_TAB_IDS.has(tab as TabId) && allowedTabs.includes(tab as TabId)) {
    return tab as TabId;
  }
  return fallback;
}

function getNextVisibleTab(currentTab: TabId, visibleTabIds: TabId[]): TabId | null {
  const currentIndex = visibleTabIds.indexOf(currentTab);
  if (currentIndex === -1 || currentIndex >= visibleTabIds.length - 1) {
    return null;
  }
  return visibleTabIds[currentIndex + 1];
}

const dossierSchema = z.object({
  numeroDossier: z.string().min(1, "Le numéro de dossier est requis"),
  typeDossier: z.enum(TYPE_DOSSIER),
  statutDossier: z.enum(STATUT_DOSSIER),
  description: z.string().min(1, "La description est requise"),
  objet: z.string().min(1, "L'objet est requis"),
  dateOuverture: z.string().min(1, "La date d'ouverture est requise"),
});

const partieSchema = z.object({
  dossierContentieuxId: z.string().min(1, "Le dossier est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  typePartie: z.enum(TYPE_PARTIE),
});

const documentSchema = z.object({
  dossierContentieuxId: z.string().min(1, "Le dossier est requis"),
  nom: z.string().min(1, "Le nom du document est requis"),
  typeDocument: z.enum(TYPE_DOCUMENT),
});

const audienceSchema = z.object({
  dossierContentieuxId: z.string().min(1, "Le dossier est requis"),
  dateAudience: z.string().min(1, "La date d'audience est requise"),
  heureAudience: z.string().min(1, "L'heure est requise"),
  rjAudience: z.string().min(1, "Le lieu est requis"),
  statutAudience: z.enum(STATUT_AUDIENCE),
  salleAudience: z.string().min(1, "La salle est requise"),
  tribunalAudience: z.string().min(1, "Le tribunal est requis"),
  resultatAudience: z.string().min(1, "Le résultat est requis"),
});

const decisionSchema = z.object({
  dossierContentieuxId: z.string().min(1, "Le dossier est requis"),
  dateDecision: z.string().min(1, "La date de décision est requise"),
  heureDecision: z.string().min(1, "L'heure est requise"),
  lieuDecision: z.string().min(1, "Le lieu est requis"),
  statutDecision: z.enum(STATUT_DECISION),
});

const inputClass =
  "h-11 rounded-xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-0";

const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.txt";

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
    <div className="sm:col-span-2">
      <FormLabel>Fichier à téléverser</FormLabel>
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
          "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
          dragActive
            ? "border-sky-400 bg-sky-50/80"
            : "border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/40"
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
          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-slate-500 hover:text-slate-900"
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
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-800">
              Glissez-déposez un fichier ou cliquez pour parcourir
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PDF, Word, Excel, images — 25 Mo maximum
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function FormPanel({
  tab,
  title,
  description,
  children,
  footer,
}: {
  tab: (typeof TABS)[number];
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const Icon = tab.icon;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm",
        tab.panelBorder,
        tab.panelBg
      )}
    >
      <div className="border-b border-white/60 bg-white/50 px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
              tab.gradient,
              tab.ring,
              "ring-2"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        </div>
      </div>
      <div className="space-y-5 p-4 sm:p-6">{children}</div>
      <div className="sticky bottom-0 border-t border-slate-200/60 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6">
        {footer}
      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  disabled,
  label,
  gradient,
  formId,
}: {
  loading: boolean;
  disabled?: boolean;
  label: string;
  gradient: string;
  formId: string;
}) {
  return (
    <Button
      type="submit"
      form={formId}
      disabled={loading || disabled}
      className={cn(
        "h-11 w-full rounded-xl bg-gradient-to-r px-6 text-white shadow-md sm:w-auto",
        gradient,
        "hover:opacity-95 disabled:opacity-60"
      )}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

function DossierSelectField({
  dossiers,
  value,
  onChange,
}: {
  dossiers: DossierContentieuxOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (dossiers.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900">
          Créez d&apos;abord un dossier dans l&apos;onglet « Nouveau dossier ».
        </p>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={inputClass}>
        <SelectValue placeholder="Sélectionner un dossier" />
      </SelectTrigger>
      <SelectContent>
        {dossiers.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            <span className="font-medium">{d.numeroDossier}</span>
            <span className="text-slate-500"> — {d.objet}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DossiersSidebar({ dossiers }: { dossiers: DossierContentieuxOption[] }) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/80 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Dossiers actifs</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""} enregistré
            {dossiers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto p-3 sm:p-4">
          {dossiers.length === 0 ? (
            <div className="flex flex-col items-center px-2 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Gavel className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">Aucun dossier</p>
              <p className="mt-1 text-xs text-slate-500">
                Commencez par créer un nouveau dossier contentieux.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {dossiers.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{d.numeroDossier}</p>
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-0 text-[10px] font-medium uppercase tracking-wide"
                    >
                      {formatEnumLabel(d.typeDossier)}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{d.objet}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge className={cn("border-0 text-[10px]", statutBadgeClass(d.statutDossier))}>
                      {formatEnumLabel(d.statutDossier)}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(d.dateOuverture), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function ContentieuxPageClient({
  initialDossiers,
  visibleTabs: visibleTabIds,
  defaultTab: defaultTabProp,
  pageTitle = "Gestion du contentieux",
  pageDescription = "Centralisez vos dossiers, parties prenantes, pièces documentaires, audiences et décisions de justice dans un espace unique.",
  heroBadge = "Contentieux administratif",
  fixedTypeDossier,
  filterDossierType,
}: Props) {
  const visibleTabs = useMemo(() => {
    const ids = visibleTabIds ?? TABS.map((tab) => tab.id);
    return TABS.filter((tab) => ids.includes(tab.id));
  }, [visibleTabIds]);

  const defaultTab = defaultTabProp ?? visibleTabs[0]?.id ?? "nouveau-dossier";
  const showTab = (id: TabId) => visibleTabs.some((tab) => tab.id === id);
  const tabConfig = (id: TabId) => visibleTabs.find((tab) => tab.id === id)!;
  const dossierType = fixedTypeDossier ?? "ADMINISTRATIF";

  const filteredInitialDossiers = useMemo(() => {
    if (!filterDossierType) return initialDossiers;
    return initialDossiers.filter((d) => d.typeDossier === filterDossierType);
  }, [initialDossiers, filterDossierType]);

  const searchParams = useSearchParams();
  const [dossiers, setDossiers] = useState(filteredInitialDossiers);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    resolveTabFromQuery(searchParams.get("tab"), visibleTabs.map((t) => t.id), defaultTab)
  );

  useEffect(() => {
    setDossiers(filteredInitialDossiers);
  }, [filteredInitialDossiers]);

  useEffect(() => {
    setActiveTab(
      resolveTabFromQuery(searchParams.get("tab"), visibleTabs.map((t) => t.id), defaultTab)
    );
  }, [searchParams, visibleTabs, defaultTab]);

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) =>
      ["EN_COURS", "EN_TRAITEMENT", "AUDIENCE", "EN_ATTENTE"].includes(d.statutDossier)
    ).length;
    const administratif = dossiers.filter((d) => d.typeDossier === "ADMINISTRATIF").length;
    return { total: dossiers.length, enCours, administratif };
  }, [dossiers]);

  const dossierForm = useForm<z.infer<typeof dossierSchema>>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      numeroDossier: generateNumeroDossier(dossierType),
      typeDossier: dossierType,
      statutDossier: "EN_ATTENTE",
      description: "",
      objet: "",
      dateOuverture: new Date().toISOString().slice(0, 10),
    },
  });

  const partieForm = useForm<z.infer<typeof partieSchema>>({
    resolver: zodResolver(partieSchema),
    defaultValues: {
      dossierContentieuxId: dossiers[0]?.id ?? "",
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      typePartie: "PERSONNE_PHYSIQUE",
    },
  });

  const documentForm = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      dossierContentieuxId: dossiers[0]?.id ?? "",
      nom: "",
      typeDocument: "COURRIERS",
    },
  });

  const audienceForm = useForm<z.infer<typeof audienceSchema>>({
    resolver: zodResolver(audienceSchema),
    defaultValues: {
      dossierContentieuxId: dossiers[0]?.id ?? "",
      dateAudience: new Date().toISOString().slice(0, 10),
      heureAudience: "",
      rjAudience: "",
      statutAudience: "AUDIENCE",
      salleAudience: "",
      tribunalAudience: "",
      resultatAudience: "",
    },
  });

  const decisionForm = useForm<z.infer<typeof decisionSchema>>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      dossierContentieuxId: dossiers[0]?.id ?? "",
      dateDecision: new Date().toISOString().slice(0, 10),
      heureDecision: "",
      lieuDecision: "",
      statutDecision: "EN_ATTENTE",
    },
  });

  const dossierIdParam = searchParams.get("dossierId");

  useEffect(() => {
    if (!dossierIdParam || !dossiers.some((d) => d.id === dossierIdParam)) return;
    partieForm.setValue("dossierContentieuxId", dossierIdParam);
    documentForm.setValue("dossierContentieuxId", dossierIdParam);
    audienceForm.setValue("dossierContentieuxId", dossierIdParam);
    decisionForm.setValue("dossierContentieuxId", dossierIdParam);
  }, [dossierIdParam, dossiers, partieForm, documentForm, audienceForm, decisionForm]);

  const refreshDossierOptions = (newDossier: DossierContentieuxOption) => {
    if (filterDossierType && newDossier.typeDossier !== filterDossierType) {
      return;
    }
    setDossiers((prev) => [newDossier, ...prev]);
    partieForm.setValue("dossierContentieuxId", newDossier.id);
    documentForm.setValue("dossierContentieuxId", newDossier.id);
    audienceForm.setValue("dossierContentieuxId", newDossier.id);
    decisionForm.setValue("dossierContentieuxId", newDossier.id);
  };

  const goToNextTab = (currentTab: TabId) => {
    const nextTab = getNextVisibleTab(
      currentTab,
      visibleTabs.map((tab) => tab.id)
    );
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const onDossierSubmit = async (data: z.infer<typeof dossierSchema>) => {
    setSubmitting("dossier");
    try {
      const result = await createDossierContentieux({
        numeroDossier: data.numeroDossier,
        typeDossier: fixedTypeDossier ?? data.typeDossier,
        statutDossier: data.statutDossier,
        description: data.description,
        objet: data.objet,
        dateOuverture: new Date(data.dateOuverture),
        dateCloture: null,
      });

      if (result.success && result.data) {
        toast.success("Dossier contentieux créé avec succès");
        refreshDossierOptions({
          id: result.data.id,
          numeroDossier: result.data.numeroDossier,
          typeDossier: result.data.typeDossier,
          statutDossier: result.data.statutDossier,
          objet: result.data.objet,
          dateOuverture: result.data.dateOuverture,
        });
        dossierForm.reset({
          numeroDossier: generateNumeroDossier(dossierType),
          typeDossier: dossierType,
          statutDossier: "EN_ATTENTE",
          description: "",
          objet: "",
          dateOuverture: new Date().toISOString().slice(0, 10),
        });
        goToNextTab("nouveau-dossier");
      } else {
        toast.error(result.error ?? "Erreur lors de la création du dossier");
      }
    } catch {
      toast.error("Erreur lors de la création du dossier");
    } finally {
      setSubmitting(null);
    }
  };

  const onPartieSubmit = async (data: z.infer<typeof partieSchema>) => {
    setSubmitting("partie");
    try {
      const result = await createPartiesPrenantes({
        ...data,
        email: data.email || undefined,
        telephone: data.telephone || undefined,
      });
      if (result.success) {
        toast.success("Partie prenante ajoutée avec succès");
        partieForm.reset({
          dossierContentieuxId: data.dossierContentieuxId,
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          typePartie: "PERSONNE_PHYSIQUE",
        });
        goToNextTab("parties");
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout de la partie");
      }
    } catch {
      toast.error("Erreur lors de l'ajout de la partie");
    } finally {
      setSubmitting(null);
    }
  };

  const onDocumentSubmit = async (data: z.infer<typeof documentSchema>) => {
    if (!documentFile) {
      toast.error("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    setSubmitting("document");
    try {
      const formData = new FormData();
      formData.append("dossierContentieuxId", data.dossierContentieuxId);
      formData.append("nom", data.nom);
      formData.append("typeDocument", data.typeDocument);
      formData.append("file", documentFile);

      const result = await createDocumentsContentieux(formData);
      if (result.success) {
        toast.success("Document ajouté avec succès");
        documentForm.reset({
          dossierContentieuxId: data.dossierContentieuxId,
          nom: "",
          typeDocument: "COURRIERS",
        });
        setDocumentFile(null);
        goToNextTab("documents");
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout du document");
      }
    } catch {
      toast.error("Erreur lors de l'ajout du document");
    } finally {
      setSubmitting(null);
    }
  };

  const onAudienceSubmit = async (data: z.infer<typeof audienceSchema>) => {
    setSubmitting("audience");
    try {
      const result = await createGestionAudiences({
        ...data,
        dateAudience: new Date(data.dateAudience),
      });
      if (result.success) {
        toast.success("Audience enregistrée avec succès");
        audienceForm.reset({
          dossierContentieuxId: data.dossierContentieuxId,
          dateAudience: new Date().toISOString().slice(0, 10),
          heureAudience: "",
          rjAudience: "",
          statutAudience: "AUDIENCE",
          salleAudience: "",
          tribunalAudience: "",
          resultatAudience: "",
        });
        goToNextTab("audiences");
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement de l'audience");
    } finally {
      setSubmitting(null);
    }
  };

  const onDecisionSubmit = async (data: z.infer<typeof decisionSchema>) => {
    setSubmitting("decision");
    try {
      const result = await createGestionDesDecisionsDeJustice({
        ...data,
        dateDecision: new Date(data.dateDecision),
      });
      if (result.success) {
        toast.success("Décision enregistrée avec succès");
        decisionForm.reset({
          dossierContentieuxId: data.dossierContentieuxId,
          dateDecision: new Date().toISOString().slice(0, 10),
          heureDecision: "",
          lieuDecision: "",
          statutDecision: "EN_ATTENTE",
        });
        goToNextTab("decisions");
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement de la décision");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/80">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.16),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm ring-1 ring-white/25">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                  Service Juridique
                </span>
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">
                  {heroBadge}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {pageTitle}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
                {pageDescription}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 lg:max-w-md lg:shrink-0">
              {[
                { label: "Dossiers", value: stats.total, icon: FolderOpen },
                { label: "En cours", value: stats.enCours, icon: Gavel },
                { label: "Administratif", value: stats.administratif, icon: Scale },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur-md ring-1 ring-white/20 sm:flex-row sm:items-center sm:gap-3 sm:text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <StatIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-100/80 sm:text-[11px]">
                        {stat.label}
                      </p>
                      <p className="text-lg font-bold text-white sm:text-xl">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {/* Workflow stepper */}
            {visibleTabs.length > 1 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm sm:px-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Parcours du dossier
                </p>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {visibleTabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;
                    const activeIndex = visibleTabs.findIndex((t) => t.id === activeTab);
                    const isPast = index < activeIndex;
                    return (
                      <div key={tab.id} className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all",
                            isActive && "bg-gradient-to-r text-white shadow-md " + tab.gradient,
                            !isActive && isPast && "bg-emerald-50 text-emerald-800",
                            !isActive && !isPast && "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                              isActive && "bg-white/20",
                              !isActive && isPast && "bg-emerald-100 text-emerald-700",
                              !isActive && !isPast && "bg-slate-200 text-slate-600"
                            )}
                          >
                            {isPast && !isActive ? "✓" : <Icon className="h-3.5 w-3.5" />}
                          </span>
                          <span className="hidden text-xs font-medium sm:inline">{tab.shortLabel}</span>
                        </button>
                        {index < visibleTabs.length - 1 ? (
                          <div
                            className={cn(
                              "mx-1 h-px w-4 shrink-0 sm:w-8",
                              index < activeIndex ? "bg-emerald-300" : "bg-slate-200"
                            )}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Mobile tab picker */}
            <div className="lg:hidden">
              <label
                htmlFor="contentieux-tab-select"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Section active
              </label>
              <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
                <SelectTrigger
                  id="contentieux-tab-select"
                  className="h-12 w-full rounded-xl border-slate-200 bg-white shadow-sm"
                >
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <activeTabConfig.icon className="h-4 w-4 text-slate-600" />
                      {activeTabConfig.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <SelectItem key={tab.id} value={tab.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
              {/* Desktop tabs */}
              <div className="mb-5 hidden lg:block">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={cn(
                          "group flex min-w-[140px] flex-1 flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all",
                          "data-[state=inactive]:shadow-none",
                          "data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-br data-[state=active]:text-white data-[state=active]:shadow-lg",
                          tab.gradient,
                          `data-[state=active]:${tab.ring} data-[state=active]:ring-2`,
                          `data-[state=inactive]:${tab.inactiveBg} data-[state=inactive]:${tab.inactiveBorder} data-[state=inactive]:${tab.inactiveText}`
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg",
                              "group-data-[state=active]:bg-white/20",
                              tab.inactiveIcon
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {tab.shortLabel}
                        </span>
                        <span className="text-[11px] opacity-80 group-data-[state=active]:text-white/90">
                          {tab.description}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {showTab("nouveau-dossier") ? (
              <TabsContent value="nouveau-dossier" className="mt-0 focus-visible:ring-0">
                <FormPanel
                  tab={tabConfig("nouveau-dossier")}
                  title="Nouveau dossier contentieux"
                  description="Renseignez les informations principales pour ouvrir un nouveau dossier contentieux."
                  footer={
                    <SubmitButton
                      formId="form-dossier"
                      loading={submitting === "dossier"}
                      label="Enregistrer le dossier"
                      gradient={tabConfig("nouveau-dossier").gradient}
                    />
                  }
                >
                  <Form {...dossierForm}>
                    <form
                      id="form-dossier"
                      onSubmit={dossierForm.handleSubmit(onDossierSubmit)}
                      className="space-y-5"
                    >
                      <FormSection title="Identification" description="Référence et classification du dossier">
                        {!fixedTypeDossier ? (
                          <FormField
                            control={dossierForm.control}
                            name="typeDossier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type de dossier</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    dossierForm.setValue(
                                      "numeroDossier",
                                      generateNumeroDossier(value as (typeof TYPE_DOSSIER)[number])
                                    );
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger className={inputClass}>
                                      <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TYPE_DOSSIER.map((v) => (
                                      <SelectItem key={v} value={v}>
                                        {TYPE_DOSSIER_LABELS[v]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormItem>
                            <FormLabel>Type de dossier</FormLabel>
                            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 shadow-sm">
                              <Badge
                                className={cn(
                                  "border-0 text-xs font-semibold",
                                  typeBadgeClass(fixedTypeDossier)
                                )}
                              >
                                {TYPE_DOSSIER_LABELS[fixedTypeDossier]}
                              </Badge>
                              <span className="ml-2 text-xs text-slate-500">Type verrouillé</span>
                            </div>
                          </FormItem>
                        )}
                        <FormField
                          control={dossierForm.control}
                          name="numeroDossier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de dossier</FormLabel>
                              <FormControl>
                                <Input
                                  className={inputClass}
                                  placeholder="CIV-2026-16062026"
                                  readOnly
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dossierForm.control}
                          name="objet"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objet</FormLabel>
                              <FormControl>
                                <Input className={inputClass} placeholder="Objet du litige" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dossierForm.control}
                          name="statutDossier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut du dossier</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STATUT_DOSSIER.map((v) => (
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
                      </FormSection>

                      <FormSection title="Calendrier" description="Date d'ouverture du dossier">
                        <FormField
                          control={dossierForm.control}
                          name="dateOuverture"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date d&apos;ouverture</FormLabel>
                              <FormControl>
                                <Input className={inputClass} type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>

                      <FormSection title="Description" description="Contexte et détails du litige">
                        <FormField
                          control={dossierForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[120px] rounded-xl border-slate-200 bg-white/90"
                                  placeholder="Description détaillée du dossier"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                    </form>
                  </Form>
                </FormPanel>
              </TabsContent>
              ) : null}

              {showTab("parties") ? (
              <TabsContent value="parties" className="mt-0 focus-visible:ring-0">
                <FormPanel
                  tab={tabConfig("parties")}
                  title="Gestion des parties"
                  description="Identifiez et enregistrez les parties prenantes liées à un dossier."
                  footer={
                    <SubmitButton
                      formId="form-partie"
                      loading={submitting === "partie"}
                      disabled={dossiers.length === 0}
                      label="Ajouter la partie"
                      gradient={tabConfig("parties").gradient}
                    />
                  }
                >
                  <Form {...partieForm}>
                    <form
                      id="form-partie"
                      onSubmit={partieForm.handleSubmit(onPartieSubmit)}
                      className="space-y-5"
                    >
                      <FormSection title="Dossier lié">
                        <FormField
                          control={partieForm.control}
                          name="dossierContentieuxId"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Dossier associé</FormLabel>
                              <FormControl>
                                <DossierSelectField
                                  dossiers={dossiers}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                      <FormSection title="Identité">
                        <FormField
                          control={partieForm.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={partieForm.control}
                          name="prenom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prénom</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={partieForm.control}
                          name="typePartie"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Type de partie</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TYPE_PARTIE.map((v) => (
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
                      </FormSection>
                      <FormSection title="Coordonnées" description="Informations de contact optionnelles">
                        <FormField
                          control={partieForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input className={inputClass} type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={partieForm.control}
                          name="telephone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                    </form>
                  </Form>
                </FormPanel>
              </TabsContent>
              ) : null}

              {showTab("documents") ? (
              <TabsContent value="documents" className="mt-0 focus-visible:ring-0">
                <FormPanel
                  tab={tabConfig("documents")}
                  title="Gestion documentaire"
                  description="Archivez les pièces justificatives et documents procéduraux."
                  footer={
                    <SubmitButton
                      formId="form-document"
                      loading={submitting === "document"}
                      disabled={dossiers.length === 0}
                      label="Ajouter le document"
                      gradient={tabConfig("documents").gradient}
                    />
                  }
                >
                  <Form {...documentForm}>
                    <form
                      id="form-document"
                      onSubmit={documentForm.handleSubmit(onDocumentSubmit)}
                      className="space-y-5"
                    >
                      <FormSection title="Dossier lié">
                        <FormField
                          control={documentForm.control}
                          name="dossierContentieuxId"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Dossier associé</FormLabel>
                              <FormControl>
                                <DossierSelectField
                                  dossiers={dossiers}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                      <FormSection title="Document">
                        <FormField
                          control={documentForm.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du document</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={documentForm.control}
                          name="typeDocument"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de document</FormLabel>
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
                        <DocumentUploadField file={documentFile} onFileChange={setDocumentFile} />
                      </FormSection>
                    </form>
                  </Form>
                </FormPanel>
              </TabsContent>
              ) : null}

              {showTab("audiences") ? (
              <TabsContent value="audiences" className="mt-0 focus-visible:ring-0">
                <FormPanel
                  tab={tabConfig("audiences")}
                  title="Gestion des audiences"
                  description="Planifiez et documentez les audiences judiciaires."
                  footer={
                    <SubmitButton
                      formId="form-audience"
                      loading={submitting === "audience"}
                      disabled={dossiers.length === 0}
                      label="Enregistrer l'audience"
                      gradient={tabConfig("audiences").gradient}
                    />
                  }
                >
                  <Form {...audienceForm}>
                    <form
                      id="form-audience"
                      onSubmit={audienceForm.handleSubmit(onAudienceSubmit)}
                      className="space-y-5"
                    >
                      <FormSection title="Dossier lié">
                        <FormField
                          control={audienceForm.control}
                          name="dossierContentieuxId"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Dossier associé</FormLabel>
                              <FormControl>
                                <DossierSelectField
                                  dossiers={dossiers}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                      <FormSection title="Planification">
                        <FormField
                          control={audienceForm.control}
                          name="dateAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date d&apos;audience</FormLabel>
                              <FormControl>
                                <Input className={inputClass} type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={audienceForm.control}
                          name="heureAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Heure</FormLabel>
                              <FormControl>
                                <Input className={inputClass} type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={audienceForm.control}
                          name="statutAudience"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Statut</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STATUT_AUDIENCE.map((v) => (
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
                      </FormSection>
                      <FormSection title="Lieu & juridiction">
                        <FormField
                          control={audienceForm.control}
                          name="rjAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lieu</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={audienceForm.control}
                          name="salleAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salle</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={audienceForm.control}
                          name="tribunalAudience"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Tribunal</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                      <FormSection title="Résultat">
                        <FormField
                          control={audienceForm.control}
                          name="resultatAudience"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Résultat de l&apos;audience</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[100px] rounded-xl border-slate-200 bg-white/90"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                    </form>
                  </Form>
                </FormPanel>
              </TabsContent>
              ) : null}

              {showTab("decisions") ? (
              <TabsContent value="decisions" className="mt-0 focus-visible:ring-0">
                <FormPanel
                  tab={tabConfig("decisions")}
                  title="Gestion des décisions"
                  description="Consignez les décisions de justice rendues sur un dossier."
                  footer={
                    <SubmitButton
                      formId="form-decision"
                      loading={submitting === "decision"}
                      disabled={dossiers.length === 0}
                      label="Enregistrer la décision"
                      gradient={tabConfig("decisions").gradient}
                    />
                  }
                >
                  <Form {...decisionForm}>
                    <form
                      id="form-decision"
                      onSubmit={decisionForm.handleSubmit(onDecisionSubmit)}
                      className="space-y-5"
                    >
                      <FormSection title="Dossier lié">
                        <FormField
                          control={decisionForm.control}
                          name="dossierContentieuxId"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Dossier associé</FormLabel>
                              <FormControl>
                                <DossierSelectField
                                  dossiers={dossiers}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FormSection>
                      <FormSection title="Décision">
                        <FormField
                          control={decisionForm.control}
                          name="dateDecision"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date de décision</FormLabel>
                              <FormControl>
                                <Input className={inputClass} type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={decisionForm.control}
                          name="heureDecision"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Heure</FormLabel>
                              <FormControl>
                                <Input className={inputClass} type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={decisionForm.control}
                          name="lieuDecision"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lieu</FormLabel>
                              <FormControl>
                                <Input className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={decisionForm.control}
                          name="statutDecision"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut de la décision</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STATUT_DECISION.map((v) => (
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
                      </FormSection>
                    </form>
                  </Form>
                </FormPanel>
              </TabsContent>
              ) : null}
            </Tabs>
          </div>

          <DossiersSidebar dossiers={dossiers} />
        </div>
      </div>
    </div>
  );
}
