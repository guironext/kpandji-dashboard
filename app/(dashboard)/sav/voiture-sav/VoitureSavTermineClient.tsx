"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Car,
  Hash,
  FileText,
  Receipt,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  CircleCheck,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import FactureSavDocumentView from "@/components/sav/FactureSavDocumentView";
import {
  buildAutoReportSections,
  garantieStatutLabel,
  type RapportMaintenanceVoiture,
} from "@/lib/sav/rapportMaintenanceSummary";
import {
  buildLineRowsFactureTerminee,
  mergeVoitureSavReparationsForFacture,
  totalHtFromLines,
  TVA_RATE_SAV,
  type ReparationRow,
  type VoitureSavFactureSource,
} from "@/lib/sav/savFactureLines";

type RapportComplementaire = {
  id: string;
  titre: string;
  contenu: string | null;
  observations: string | null;
  createdAt: string;
};

type ClientSAV = {
  nom: string;
  prenom: string;
  contact: string;
  email: string | null;
  entreprise: string | null;
  localisation: string | null;
};

type VisuelDefautRow = {
  id: string;
  nom: string;
  description: string | null;
  image?: string | null;
};

type VoitureTermineRow = Omit<
  RapportMaintenanceVoiture,
  "immatriculation" | "Reparation" | "VisuelDefaut" | "ClientSAV"
> & {
  immatriculation: string | null;
  chassisNumber?: string | null;
  image?: string | null;
  photos?: string[];
  sousGarantie?: boolean;
  StatutGarantie?: string | null;
  ClientSAV: ClientSAV;
  VisuelDefaut: VisuelDefautRow[];
  RapportMaintenanceSAV: RapportComplementaire[];
  Reparation: RapportMaintenanceVoiture["Reparation"];
  shareToken?: string;
};

const MOTOR_LABELS: Record<string, string> = {
  ELECTRIQUE: "Électrique",
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
};

const TRANS_LABELS: Record<string, string> = {
  AUTOMATIQUE: "Automatique",
  MANUEL: "Manuelle",
};

const GARANTIE_BADGE_CLASS: Record<string, string> = {
  EN_COURS: "bg-slate-100 text-slate-800 ring-slate-200",
  FIN_INTERVENTION_GARANTIESAV_EN_COURS: "bg-pink-50 text-pink-900 ring-pink-200",
  GARANTIESAV_EN_COURS: "bg-rose-50 text-rose-900 ring-rose-200",
  GARANTIESAV_TERMINE: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200",
  PAS_DE_GARANTIE: "bg-slate-100 text-slate-600 ring-slate-200",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function clientName(client: ClientSAV | undefined) {
  if (!client) return "Client non renseigné";
  return `${client.prenom} ${client.nom}`.trim();
}

function RapportShareHero({ voiture }: { voiture: VoitureTermineRow }) {
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!voiture.shareToken) {
      setShareUrl("");
      return;
    }
    setShareUrl(
      `${window.location.origin}/rapport-sav/${voiture.shareToken}`,
    );
  }, [voiture.shareToken]);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien du rapport copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10.75rem]">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
        {voiture.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voiture.image}
            alt={voiture.model}
            className="aspect-[16/10] h-full w-full object-cover sm:aspect-auto sm:min-h-[180px] sm:max-h-[220px]"
          />
        ) : (
          <div className="flex aspect-[16/10] min-h-[140px] flex-col items-center justify-center gap-2 sm:min-h-[180px]">
            <Car className="h-12 w-12 text-slate-300" />
            <p className="text-xs text-slate-400">Aucune photo du teste final</p>
          </div>
        )}
      </div>
      <div className="flex flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-col sm:justify-center sm:text-center">
        <div className="shrink-0 rounded-xl bg-white p-1.5 ring-1 ring-slate-100">
          {shareUrl ? (
            <QRCodeSVG
              value={shareUrl}
              size={112}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          ) : (
            <div className="flex h-[112px] w-[112px] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 sm:flex-none">
          <p className="text-xs font-semibold text-slate-800">
            Télécharger sans compte
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            Le client scanne ce QR pour ouvrir et télécharger ce rapport.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-8 w-full text-xs"
            disabled={!shareUrl}
            onClick={() => void copyLink()}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copier le lien
          </Button>
        </div>
      </div>
    </div>
  );
}

function garantieBadgeClass(statut: string | null | undefined) {
  if (statut && GARANTIE_BADGE_CLASS[statut]) return GARANTIE_BADGE_CLASS[statut];
  return GARANTIE_BADGE_CLASS.EN_COURS;
}

function Spec({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function AutoReportView({ voiture }: { voiture: RapportMaintenanceVoiture }) {
  const sections = useMemo(
    () => buildAutoReportSections(voiture),
    [voiture],
  );

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
            {section.title}
          </h4>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
            {section.lines.map((line, i) => (
              <li key={`${section.title}-${i}`} className="whitespace-pre-wrap break-words">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function GarantieStatutCard({ voiture }: { voiture: VoitureTermineRow }) {
  const covered = Boolean(voiture.sousGarantie);
  const statut = garantieStatutLabel(voiture.StatutGarantie);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4",
        covered
          ? "border-rose-200/80 bg-gradient-to-br from-rose-50 to-white"
          : "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          covered ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500",
        )}
      >
        {covered ? (
          <ShieldCheck className="h-5 w-5" />
        ) : (
          <ShieldAlert className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Statut garantie
        </p>
        <p className="mt-0.5 text-base font-bold leading-snug text-slate-900">{statut}</p>
        <p className="mt-1 text-xs text-slate-500">
          {covered
            ? "Véhicule enregistré sous garantie SAV"
            : "Véhicule hors couverture garantie"}
        </p>
      </div>
      <Badge
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 hover:bg-inherit",
          garantieBadgeClass(voiture.StatutGarantie),
        )}
      >
        {covered ? "Sous garantie" : "Hors garantie"}
      </Badge>
    </div>
  );
}

function FactureSection({ voiture }: { voiture: VoitureTermineRow }) {
  const factureRow = useMemo(() => {
    if (!voiture.Reparation?.length) return null;
    const source: VoitureSavFactureSource = {
      id: voiture.id,
      model: voiture.model,
      immatriculation: voiture.immatriculation,
      couleur: voiture.couleur,
      motorisation: voiture.motorisation,
      transmission: voiture.transmission,
      updatedAt: voiture.updatedAt,
      ClientSAV: {
        nom: voiture.ClientSAV.nom,
        prenom: voiture.ClientSAV.prenom,
        contact: voiture.ClientSAV.contact,
        email: voiture.ClientSAV.email,
        entreprise: voiture.ClientSAV.entreprise,
        localisation: voiture.ClientSAV.localisation,
      },
      Reparation:
        voiture.Reparation as unknown as VoitureSavFactureSource["Reparation"],
    };
    return mergeVoitureSavReparationsForFacture(source);
  }, [voiture]);

  const maintenancesMo = useMemo(
    () => factureRow?.Maintenance ?? [],
    [factureRow],
  );
  const lineRows = useMemo(
    () =>
      factureRow
        ? buildLineRowsFactureTerminee(
            factureRow as ReparationRow,
            maintenancesMo,
          )
        : [],
    [factureRow, maintenancesMo],
  );
  const totalHt = useMemo(() => totalHtFromLines(lineRows), [lineRows]);
  const montantTva = useMemo(
    () => Math.round(totalHt * (TVA_RATE_SAV / 100) * 100) / 100,
    [totalHt],
  );
  const totalTtc = useMemo(
    () => Math.round((totalHt + montantTva) * 100) / 100,
    [totalHt, montantTva],
  );

  if (!factureRow || lineRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center sm:px-6 sm:py-10">
        <Receipt className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Aucune facture pour ce véhicule
        </p>
        <p className="mt-1 text-xs text-slate-500">
          La facture apparaîtra une fois les réparations et la main d&apos;œuvre
          enregistrées.
        </p>
      </div>
    );
  }

  const existing = factureRow.FactureProformaSAV?.[0];

  return (
    <div className="space-y-3">
      {existing ? (
        <p className="text-sm text-slate-600">
          Facture {existing.numero_facture} —{" "}
          {new Date(existing.date_facture).toLocaleDateString("fr-FR")}
        </p>
      ) : (
        <p className="text-sm text-amber-700">
          Facture non encore enregistrée — aperçu calculé à partir du dossier.
        </p>
      )}
      <div className="-mx-1 overflow-x-auto rounded-xl border border-slate-200 bg-white sm:mx-0">
        <div className="min-w-[640px] p-3 sm:min-w-0 sm:p-6">
          <FactureSavDocumentView
            rep={factureRow as ReparationRow}
            documentTitle="FACTURE S.A.V."
            servicesSubtitle="Services Après-Vente — Facturation"
            totalHt={totalHt}
            montantTva={montantTva}
            totalTtc={totalTtc}
            tvaRate={TVA_RATE_SAV}
            factureMainOeuvreParCategorie
            maintenancesMo={maintenancesMo}
          />
        </div>
      </div>
    </div>
  );
}

export default function VoitureSavTermineClient() {
  const [voitures, setVoitures] = useState<VoitureTermineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VoitureTermineRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sav/voiture-sav-termine");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Chargement impossible");
      }
      setVoitures(json.data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card px-6 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">
          Chargement des véhicules terminés…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 shadow-[0_20px_50px_-18px_rgba(13,148,136,0.45)] ring-1 ring-white/10 sm:rounded-3xl">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-90"
          aria-hidden
        />
        <div className="relative px-4 py-6 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2 sm:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-50/95 backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                Service après-vente
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                  Voiture S.A.V.
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-emerald-50/85 sm:text-lg">
                  Dossiers terminés — rapport, garantie et facture.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md sm:min-w-[140px] sm:rounded-2xl sm:px-4 sm:py-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-100/80 sm:text-[11px]">
                  Véhicules terminés
                </span>
                <span className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
                  {voitures.length}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load()}
                className="h-11 shrink-0 border-white/30 bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white sm:h-9"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {voitures.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 px-4 py-12 text-center sm:py-16">
            <Car className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">Aucun véhicule terminé</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les dossiers apparaîtront ici lorsque le statut d&apos;un
                véhicule SAV passera à « Terminé ».
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {voitures.map((v) => {
            const motor = MOTOR_LABELS[v.motorisation] ?? v.motorisation;
            const trans = TRANS_LABELS[v.transmission] ?? v.transmission;
            const nbRapports = v.RapportMaintenanceSAV?.length ?? 0;

            return (
              <Card
                key={v.id}
                className="overflow-hidden rounded-2xl border-slate-200/90 py-0 shadow-sm ring-1 ring-black/[0.03] transition-shadow duration-200 hover:shadow-md hover:shadow-emerald-500/10"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100 md:aspect-auto md:w-64 lg:w-80">
                    {v.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.image}
                        alt={v.model}
                        className="h-full w-full object-cover md:absolute md:inset-0"
                      />
                    ) : (
                      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 px-4 text-center md:min-h-full">
                        <Car className="h-12 w-12 text-slate-300" />
                        <p className="text-xs font-medium text-slate-400">
                          Aucune photo du teste final
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent px-3 pb-3 pt-10 md:hidden">
                      <p className="truncate text-base font-bold text-white">{v.model}</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold tracking-wide text-white/90">
                        {v.immatriculation || "—"}
                      </p>
                    </div>
                    <Badge className="absolute right-2.5 top-2.5 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold text-white ring-0 hover:bg-emerald-500/95">
                      <CircleCheck className="mr-1 h-3 w-3" />
                      Terminé
                    </Badge>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="hidden items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 md:flex">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {v.model}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wide text-slate-600">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {v.immatriculation || "—"}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 hover:bg-inherit",
                          garantieBadgeClass(v.StatutGarantie),
                        )}
                      >
                        {v.sousGarantie ? (
                          <ShieldCheck className="mr-1 h-3 w-3" />
                        ) : (
                          <ShieldAlert className="mr-1 h-3 w-3" />
                        )}
                        {garantieStatutLabel(v.StatutGarantie)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-3 py-3 sm:gap-2.5 sm:px-4 md:grid-cols-3 md:px-5 md:py-4">
                      <Spec label="Client" value={clientName(v.ClientSAV)} />
                      <Spec label="Contact" value={v.ClientSAV?.contact || "—"} />
                      <Spec label="Châssis" value={v.chassisNumber || "—"} />
                      <Spec
                        label="Couleur"
                        value={
                          v.nbr_portes
                            ? `${v.couleur} · ${v.nbr_portes} portes`
                            : v.couleur
                        }
                      />
                      <Spec label="Motorisation" value={`${motor} · ${trans}`} />
                      <Spec label="Terminé le" value={formatDateShort(v.updatedAt)} />
                    </div>

                    <div className="flex items-center gap-2 px-3 pb-2 md:hidden">
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 hover:bg-inherit",
                          garantieBadgeClass(v.StatutGarantie),
                        )}
                      >
                        {v.sousGarantie ? (
                          <ShieldCheck className="mr-1 h-3 w-3" />
                        ) : (
                          <ShieldAlert className="mr-1 h-3 w-3" />
                        )}
                        {garantieStatutLabel(v.StatutGarantie)}
                      </Badge>
                      {nbRapports > 0 ? (
                        <span className="text-[11px] text-slate-500">
                          {nbRapports} rapport{nbRapports > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-center gap-3 border-t border-slate-100 px-3 py-3 sm:px-5">
                      {nbRapports > 0 ? (
                        <span className="mr-auto hidden text-xs text-slate-500 md:inline">
                          {nbRapports} rapport
                          {nbRapports > 1 ? "s" : ""} complémentaire
                          {nbRapports > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="mr-auto hidden md:inline" />
                      )}
                      <Button
                        onClick={() => setSelected(v)}
                        className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 md:h-10 md:w-auto"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Rapport
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0",
            "top-2 right-2 bottom-2 left-2 h-auto w-auto max-h-none max-w-none translate-x-0 translate-y-0 rounded-2xl",
            "sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:h-[min(92vh,960px)] sm:max-h-[min(92vh,960px)] sm:w-full sm:max-w-5xl sm:translate-x-[-50%] sm:translate-y-[-50%]",
            "[&_[data-slot=dialog-close]]:top-3.5 [&_[data-slot=dialog-close]]:right-3.5",
            "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/15",
            "[&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white",
            "[&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:hover:bg-white/25",
            "[&_[data-slot=dialog-close]]:hover:opacity-100",
          )}
        >
          {selected ? (
            <>
              <DialogHeader className="shrink-0 space-y-1 border-b border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pb-5 sm:pt-6 sm:pr-14">
                <DialogTitle className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Rapport — {selected.model}
                </DialogTitle>
                <DialogDescription className="text-sm text-emerald-50/85">
                  {selected.immatriculation || "Sans immatriculation"}
                  {" · "}
                  {clientName(selected.ClientSAV)}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-7 sm:py-6">
                <RapportShareHero voiture={selected} />

                <div className="mt-4">
                  <GarantieStatutCard voiture={selected} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                  <Spec label="Châssis" value={selected.chassisNumber || "—"} />
                  <Spec
                    label="Terminé le"
                    value={formatDateShort(selected.updatedAt)}
                  />
                </div>

                <section className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-emerald-700" />
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                      Rapport de synthèse
                    </h3>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5">
                    <AutoReportView
                      voiture={{
                        ...selected,
                        immatriculation: selected.immatriculation ?? "",
                      }}
                    />
                  </div>
                </section>

                <section className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-700" />
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                      Rapports complémentaires
                    </h3>
                  </div>
                  {(selected.RapportMaintenanceSAV?.length ?? 0) === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center sm:px-6 sm:py-8">
                      <p className="text-sm text-slate-500">
                        Aucun rapport complémentaire pour ce véhicule.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {selected.RapportMaintenanceSAV.map((rapport) => (
                        <li
                          key={rapport.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4"
                        >
                          <p className="font-semibold text-slate-900">
                            {rapport.titre}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDate(rapport.createdAt)}
                          </p>
                          {rapport.contenu ? (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">
                              {rapport.contenu}
                            </p>
                          ) : null}
                          {rapport.observations ? (
                            <p className="mt-2 text-xs italic text-slate-500">
                              Observations : {rapport.observations}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {selected.VisuelDefaut?.some((d) => d.image) ? (
                  <section className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                      Photos des défauts visuels
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                      {selected.VisuelDefaut.filter((d) => d.image).map((d) => (
                        <div
                          key={d.id}
                          className="overflow-hidden rounded-xl border border-slate-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={d.image ?? ""}
                            alt={d.nom}
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <p className="px-2 py-1.5 text-xs font-medium text-slate-700 sm:px-2.5 sm:py-2">
                            {d.nom}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="mt-6 space-y-3 border-t border-slate-200 pt-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-8 sm:space-y-4 sm:pt-8">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-700" />
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                      Facture
                    </h3>
                  </div>
                  <FactureSection voiture={selected} />
                </section>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
