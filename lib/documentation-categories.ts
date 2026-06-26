import type { TypeDocumentation } from "@prisma/client";

export const DOCUMENTATION_CATEGORIES = [
  { id: "agrement", label: "Agrement" },
  { id: "arf", label: "ARF" },
  { id: "rccm", label: "RCCM" },
  { id: "dfe", label: "DFE" },
  { id: "cnps", label: "CNPS" },
  { id: "rib", label: "RIB" },
  { id: "catalogue", label: "Catalogue" },
  { id: "presentation", label: "Presentation" },
  { id: "fiche-technique", label: "Fiche Technique" },
  { id: "cni", label: "CNI" },
] as const;

export type DocumentationCategoryId =
  (typeof DOCUMENTATION_CATEGORIES)[number]["id"];

export const UI_CATEGORY_TO_TYPE: Record<
  DocumentationCategoryId,
  TypeDocumentation
> = {
  agrement: "AGREMENT",
  arf: "ARF",
  rccm: "RCCM",
  dfe: "DFE",
  cnps: "CNPS",
  rib: "RIB",
  catalogue: "CATALOGUE",
  presentation: "PRESENTATION",
  "fiche-technique": "FICHE_TECHNIQUE",
  cni: "CNI",
};

export const TYPE_TO_UI_CATEGORY: Record<
  TypeDocumentation,
  DocumentationCategoryId
> = {
  AGREMENT: "agrement",
  ARF: "arf",
  RCCM: "rccm",
  DFE: "dfe",
  CNPS: "cnps",
  RIB: "rib",
  CATALOGUE: "catalogue",
  PRESENTATION: "presentation",
  FICHE_TECHNIQUE: "fiche-technique",
  CNI: "cni",
};

export const DOCUMENTATION_TYPE_LABELS: Record<TypeDocumentation, string> = {
  AGREMENT: "Agrement",
  ARF: "ARF",
  RCCM: "RCCM",
  DFE: "DFE",
  CNPS: "CNPS",
  RIB: "RIB",
  CATALOGUE: "Catalogue",
  PRESENTATION: "Presentation",
  FICHE_TECHNIQUE: "Fiche Technique",
  CNI: "CNI",
};

export const DOCUMENTATION_CATEGORY_STYLES: Record<
  DocumentationCategoryId,
  {
    description: string;
    gradient: string;
    iconTint: string;
    ring: string;
  }
> = {
  agrement: {
    description: "Agréments et autorisations officielles.",
    gradient: "from-sky-500/10 via-blue-600/5 to-violet-500/5",
    iconTint: "bg-sky-500/15 text-sky-700",
    ring: "ring-sky-200/80",
  },
  arf: {
    description: "Attestation de régularité fiscale.",
    gradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/5",
    iconTint: "bg-emerald-500/15 text-emerald-700",
    ring: "ring-emerald-200/80",
  },
  rccm: {
    description: "Registre du commerce et immatriculation.",
    gradient: "from-amber-500/10 via-orange-500/5 to-rose-500/5",
    iconTint: "bg-amber-500/15 text-amber-800",
    ring: "ring-amber-200/80",
  },
  dfe: {
    description: "Déclaration fiscale d'existence.",
    gradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/5",
    iconTint: "bg-violet-500/15 text-violet-700",
    ring: "ring-violet-200/80",
  },
  cnps: {
    description: "Cotisations sociales CNPS.",
    gradient: "from-rose-500/10 via-red-500/5 to-orange-500/5",
    iconTint: "bg-rose-500/15 text-rose-700",
    ring: "ring-rose-200/80",
  },
  rib: {
    description: "Relevé d'identité bancaire.",
    gradient: "from-slate-500/10 via-blue-950/5 to-slate-500/5",
    iconTint: "bg-slate-600/15 text-slate-800",
    ring: "ring-slate-200/80",
  },
  catalogue: {
    description: "Catalogues produits et offres.",
    gradient: "from-indigo-500/10 via-blue-500/5 to-teal-500/5",
    iconTint: "bg-indigo-500/15 text-indigo-700",
    ring: "ring-indigo-200/80",
  },
  presentation: {
    description: "Présentations et plaquettes commerciales.",
    gradient: "from-fuchsia-500/10 via-pink-500/5 to-violet-500/5",
    iconTint: "bg-fuchsia-500/15 text-fuchsia-800",
    ring: "ring-fuchsia-200/80",
  },
  "fiche-technique": {
    description: "Fiches techniques véhicules et équipements.",
    gradient: "from-lime-500/10 via-green-500/5 to-emerald-500/5",
    iconTint: "bg-lime-600/15 text-lime-900",
    ring: "ring-lime-200/80",
  },
  cni: {
    description: "Pièces d'identification officielles.",
    gradient: "from-cyan-500/10 via-sky-500/5 to-blue-500/5",
    iconTint: "bg-cyan-500/15 text-cyan-700",
    ring: "ring-cyan-200/80",
  },
};

export function fileNameFromDocumentationPath(fichier: string): string {
  try {
    if (fichier.startsWith("http://") || fichier.startsWith("https://")) {
      const u = new URL(fichier);
      const seg = u.pathname.split("/").filter(Boolean).pop() ?? "document";
      return decodeURIComponent(seg);
    }
    const seg = fichier.split("/").filter(Boolean).pop() ?? "document";
    return decodeURIComponent(seg);
  } catch {
    return "document";
  }
}

export function fileExtensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "—";
}

export function fileExtensionBadgeClass(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "pdf") return "border-red-200/80 bg-red-500/10 text-red-700";
  if (["doc", "docx"].includes(e))
    return "border-blue-200/80 bg-blue-500/10 text-blue-700";
  if (["xls", "xlsx", "csv"].includes(e))
    return "border-emerald-200/80 bg-emerald-500/10 text-emerald-800";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(e))
    return "border-violet-200/80 bg-violet-500/10 text-violet-800";
  if (e === "ppt" || e === "pptx")
    return "border-amber-200/80 bg-amber-500/10 text-amber-900";
  return "border-orange-200/70 bg-orange-50 text-orange-800/70";
}
