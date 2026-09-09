"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Clock,
  Mail,
  MessageSquare,
  NotebookPen,
  Phone,
  Search,
  User,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  JournalProspectItem,
  JournalProspectsByCommercial,
} from "@/lib/actions/journal-prospect";

const TYPE_CONTACT_LABELS: Record<string, string> = {
  APPEL_PHONING_B2B: "Appel / Phoning B2B",
  VISITE_TERRAIN: "Visite terrain",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  SALON: "Salon",
  RESEAU: "Réseau",
  AUTRE: "Autre",
};

const STATUT_ETAPE_LABELS: Record<string, string> = {
  PREMIER_CONTACT: "Premier contact",
  QUALIFICATION: "Qualification",
  EN_COURS: "En cours",
  RDV_PLANIFIE: "RDV planifié",
  OFFRE_ENVOYEE: "Offre envoyée",
  NEGOCIATION: "Négociation",
  RELANCE: "Relance",
  GAGNE: "Gagné",
  PERDU: "Perdu",
  SANS_SUITE: "Sans suite",
};

const STATUT_ETAPE_STYLES: Record<string, string> = {
  PREMIER_CONTACT: "border-slate-200 bg-slate-100 text-slate-700",
  QUALIFICATION: "border-sky-200 bg-sky-50 text-sky-800",
  EN_COURS: "border-indigo-200 bg-indigo-50 text-indigo-800",
  RDV_PLANIFIE: "border-violet-200 bg-violet-50 text-violet-800",
  OFFRE_ENVOYEE: "border-cyan-200 bg-cyan-50 text-cyan-800",
  NEGOCIATION: "border-amber-200 bg-amber-50 text-amber-800",
  RELANCE: "border-orange-200 bg-orange-50 text-orange-800",
  GAGNE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PERDU: "border-red-200 bg-red-50 text-red-800",
  SANS_SUITE: "border-rose-200 bg-rose-50 text-rose-700",
};

function displayValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function humanizeKey(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function typeContactLabel(value: string | null | undefined) {
  if (!value?.trim()) return "—";
  return TYPE_CONTACT_LABELS[value] ?? humanizeKey(value);
}

function statutEtapeLabel(value: string | null | undefined) {
  if (!value?.trim()) return "—";
  return STATUT_ETAPE_LABELS[value] ?? humanizeKey(value);
}

function statutEtapeStyle(value: string | null | undefined) {
  if (value && STATUT_ETAPE_STYLES[value]) return STATUT_ETAPE_STYLES[value];
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function isIsoDate(value: string | null | undefined) {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  if (!isIsoDate(iso)) return iso;
  return format(new Date(iso), "d MMMM yyyy", { locale: fr });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  if (!isIsoDate(iso)) return iso;
  return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: fr });
}

function commercialName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
}

function matchesQuery(prospect: JournalProspectItem, query: string) {
  if (!query) return true;
  const haystack = [
    prospect.nomEntreprise,
    prospect.interlocuteur,
    prospect.fonction,
    prospect.telephone,
    prospect.email,
    prospect.secteurActivite,
    prospect.besoinIdentifie,
    typeContactLabel(prospect.typeContact),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  const empty = value === "—";
  const content = (
    <span
      className={cn(
        "text-sm leading-relaxed break-words whitespace-pre-wrap",
        empty ? "text-slate-400" : "text-slate-800",
        href && !empty && "text-indigo-700",
      )}
    >
      {value}
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-0.5 px-4 py-3 sm:grid-cols-[minmax(9.5rem,34%)_1fr] sm:items-baseline sm:gap-5 sm:px-5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0">
        {href && !empty ? (
          <a href={href} className="hover:underline underline-offset-4">
            {content}
          </a>
        ) : (
          content
        )}
      </dd>
    </div>
  );
}

function ProspectDetail({
  prospect,
  commercialLabel,
}: {
  prospect: JournalProspectItem;
  commercialLabel: string;
}) {
  const isEntreprise = prospect.kind === "CLIENT_ENTREPRISE";
  const phoneHref = prospect.telephone
    ? `tel:${prospect.telephone.replace(/\s+/g, "")}`
    : null;
  const mailHref = prospect.email ? `mailto:${prospect.email}` : null;
  const commentairesResume = [prospect.commentaires, prospect.resume]
    .filter(Boolean)
    .join("\n\n");
  const hasNotes = Boolean(commentairesResume.trim());
  const interlocuteurFonction = [prospect.interlocuteur, prospect.fonction]
    .filter(Boolean)
    .join(" · ");
  const actionRelance = [
    prospect.actionSuivante,
    prospect.dateRelance ? formatDate(prospect.dateRelance) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-[#fbfaf7] shadow-sm">
      <header className="border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Fiche journal
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-[1.65rem] break-words">
              {prospect.nomEntreprise}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {commercialLabel}
              <span className="mx-1.5 text-slate-300">·</span>
              {isEntreprise ? "Entreprise" : "Individuel"}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs", statutEtapeStyle(prospect.statutEtape))}
          >
            {prospect.statutEtape
              ? statutEtapeLabel(prospect.statutEtape)
              : "Prospect"}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
            <Clock className="h-3.5 w-3.5" />
            {prospect.createdAt
              ? formatDateTime(prospect.createdAt)
              : "Date de création —"}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            {typeContactLabel(prospect.typeContact)}
          </span>
        </div>

        {(phoneHref || mailHref) && (
          <div className="mt-4 flex gap-2">
            {phoneHref ? (
              <Button asChild variant="outline" className="h-9 rounded-full px-4">
                <a href={phoneHref}>
                  <Phone className="h-3.5 w-3.5" />
                  Appeler
                </a>
              </Button>
            ) : null}
            {mailHref ? (
              <Button asChild variant="outline" className="h-9 rounded-full px-4">
                <a href={mailHref}>
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              </Button>
            ) : null}
          </div>
        )}
      </header>

      <dl className="divide-y divide-slate-200/70">
        <InfoRow
          label="Date de création"
          value={
            prospect.createdAt ? formatDateTime(prospect.createdAt) : "—"
          }
        />
        <InfoRow
          label="Type de Contact"
          value={typeContactLabel(prospect.typeContact)}
        />
        <InfoRow
          label="Nom Entreprise / Structure"
          value={displayValue(prospect.nomEntreprise)}
        />
        <InfoRow
          label="Secteur d'Activité"
          value={displayValue(prospect.secteurActivite)}
        />
        <InfoRow
          label="Interlocuteur / Fonction"
          value={displayValue(interlocuteurFonction)}
        />
        <InfoRow
          label="Téléphone"
          value={displayValue(prospect.telephone)}
          href={phoneHref}
        />
        <InfoRow
          label="Email"
          value={displayValue(prospect.email)}
          href={mailHref}
        />
        <InfoRow
          label="Taille Parc / Équipements"
          value={displayValue(prospect.tailleParcEquipements)}
        />
        <InfoRow
          label="Besoin Identifié (Véhicules/Camions/Engins/Garage)"
          value={displayValue(prospect.besoinIdentifie)}
        />
        <InfoRow
          label="Statut D'Étape"
          value={statutEtapeLabel(prospect.statutEtape)}
        />
        <InfoRow
          label="Action Suivante / Date Relance"
          value={displayValue(actionRelance)}
        />
      </dl>

      <div className="border-t border-slate-200/80 bg-white px-4 py-4 sm:px-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          <MessageSquare className="h-3.5 w-3.5" />
          Commentaires / Résumé
        </p>
        <p
          className={cn(
            "rounded-xl px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            hasNotes
              ? "bg-[#f4f1ea] text-slate-800"
              : "bg-slate-50 text-slate-400",
          )}
        >
          {hasNotes ? commentairesResume : "Aucun commentaire pour le moment."}
        </p>
        <div className="mt-3 flex flex-col gap-0.5 text-[11px] text-slate-400 sm:flex-row sm:justify-between">
          <p>Créé le {formatDateTime(prospect.createdAt)}</p>
          <p>Mis à jour le {formatDateTime(prospect.updatedAt)}</p>
        </div>
      </div>
    </article>
  );
}

function ProspectCard({
  prospect,
  selected,
  onSelect,
}: {
  prospect: JournalProspectItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const isEntreprise = prospect.kind === "CLIENT_ENTREPRISE";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all touch-manipulation",
        "hover:shadow-md hover:border-indigo-200 active:scale-[0.99]",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-200 shadow-md"
          : "border-slate-200/80",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isEntreprise ? "bg-emerald-500" : "bg-indigo-500",
          selected && "w-1.5",
        )}
      />
      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isEntreprise
              ? "bg-emerald-50 text-emerald-700"
              : "bg-indigo-50 text-indigo-700",
          )}
        >
          {isEntreprise ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug text-slate-900 line-clamp-2">
              {prospect.nomEntreprise}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "max-w-[46%] shrink-0 truncate text-[10px]",
                statutEtapeStyle(prospect.statutEtape),
              )}
            >
              {prospect.statutEtape
                ? statutEtapeLabel(prospect.statutEtape)
                : "Prospect"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isEntreprise ? "Entreprise" : "Individuel"}
            {prospect.typeContact
              ? ` · ${typeContactLabel(prospect.typeContact)}`
              : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {formatDateTime(prospect.createdAt)}
            </span>
            {prospect.interlocuteur ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{prospect.interlocuteur}</span>
              </span>
            ) : null}
            {prospect.telephone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {prospect.telephone}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function JournalProspectPageClient({
  groups,
  totalProspects,
  totalCommercials,
  error,
}: {
  groups: JournalProspectsByCommercial[];
  totalProspects: number;
  totalCommercials: number;
  error?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [commercialFilter, setCommercialFilter] = useState("all");
  const listScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    for (const group of groups) {
      const prospect = group.prospects.find((p) => p.id === selectedId);
      if (prospect) {
        return {
          prospect,
          commercialLabel: commercialName(
            group.commercial.firstName,
            group.commercial.lastName,
          ),
        };
      }
    }
    return null;
  }, [groups, selectedId]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter(
        (group) =>
          commercialFilter === "all" || group.commercial.id === commercialFilter,
      )
      .map((group) => ({
        ...group,
        prospects: group.prospects.filter((prospect) => matchesQuery(prospect, q)),
      }))
      .filter((group) => group.prospects.length > 0);
  }, [groups, query, commercialFilter]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    detailScrollRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#f8fafc] px-4 py-6 sm:px-6">
        <Card className="mx-auto max-w-2xl border-red-200 bg-red-50/80 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-700">Erreur</CardTitle>
                <CardDescription className="text-red-600">{error}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const list = (
    <div className="space-y-4">
      {filteredGroups.map((group) => (
        <section key={group.commercial.id} className="space-y-2">
          <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2.5 rounded-xl bg-white/95 px-1 py-1.5 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {initials(group.commercial.firstName, group.commercial.lastName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-900">
                {commercialName(
                  group.commercial.firstName,
                  group.commercial.lastName,
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {group.prospects.length} prospect
                {group.prospects.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-3">
            {group.prospects.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                selected={prospect.id === selectedId}
                onSelect={() => setSelectedId(prospect.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  const emptyList = (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-4 py-14 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Search className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">Aucun résultat</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Aucun prospect ne correspond à cette recherche ou à ce commercial.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-xl"
        onClick={() => {
          setQuery("");
          setCommercialFilter("all");
        }}
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );

  const detailBody = selected ? (
    <ProspectDetail
      prospect={selected.prospect}
      commercialLabel={selected.commercialLabel}
    />
  ) : (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 inline-flex rounded-full bg-indigo-50 p-4">
        <MessageSquare className="h-10 w-10 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">
        Sélectionnez un prospect
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Touchez une carte à gauche pour afficher la date de création, le contact,
        l&apos;entreprise, le besoin identifié et le suivi.
      </p>
    </div>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),linear-gradient(to_bottom,#f8fafc,#ffffff_45%,#f1f5f9)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-2 py-2 sm:px-4 sm:py-2.5 lg:px-5">
        <header className="mb-2 flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 shadow-sm sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                Journal Prospect
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <Building2 className="h-3.5 w-3.5" />
              {totalProspects}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              <UserCircle className="h-3.5 w-3.5" />
              {totalCommercials}
            </span>
          </div>
        </header>

        {groups.length === 0 ? (
          <Card className="overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/40">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                <NotebookPen className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">
                Aucun prospect
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Les clients au statut PROSPECT apparaîtront ici, regroupés par
                commercial.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:max-w-xs sm:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher…"
                  className="h-9 rounded-xl border-slate-200 bg-white pl-9 shadow-sm"
                />
              </div>
              <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setCommercialFilter("all")}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    commercialFilter === "all"
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200",
                  )}
                >
                  Tous · {totalProspects}
                </button>
                {groups.map((group) => {
                  const id = group.commercial.id;
                  const active = commercialFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCommercialFilter(id)}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-indigo-50 text-indigo-700",
                        )}
                      >
                        {initials(
                          group.commercial.firstName,
                          group.commercial.lastName,
                        )}
                      </span>
                      <span className="max-w-[140px] truncate sm:max-w-none">
                        {commercialName(
                          group.commercial.firstName,
                          group.commercial.lastName,
                        )}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-xs",
                          active ? "bg-white/20" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {group.prospects.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div
                  ref={listScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3"
                >
                  {filteredGroups.length === 0 ? emptyList : list}
                </div>
              </aside>

              <section className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:flex">
                <div
                  ref={detailScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 xl:p-5"
                >
                  {detailBody}
                </div>
              </section>
            </div>
          </>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[45] flex flex-col overflow-hidden bg-[#f8fafc] overscroll-contain lg:hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-xl px-2"
              onClick={() => setSelectedId(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
              {selected.prospect.nomEntreprise}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6">
              {detailBody}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
