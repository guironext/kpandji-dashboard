"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileDown, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { exportContratVenteWordFile } from "@/lib/actions/export-contrat-vente-word";
import {
  commencerValidationContratDeVente,
  etablirContratDeVente,
  marquerContratSousReserve,
  saveContratDeVente,
  soumettreContratDeVenteValidation,
  validerContratDeVente,
} from "@/lib/actions/contrat-vente";
import type { BonCommandeDocumentData, BonCommandeSource, DossierBonOption } from "@/lib/actions/bondecommande";
import type { ContratVenteContenu } from "@/lib/contrat-vente-document";
import { formatNumberWithSpaces } from "@/lib/utils";

const VENDEUR = {
  raison: "KPANDJI AUTOMOBILES SARL",
  rccm: "CI-ABJ-03-2022-B13-00710",
  adresse: "Cocody Riviéra Palmerais, Abidjan — Tél. : +225 07 07 20 16 54",
  siege:
    "Siège social : Cocody, Riviéra Palmerais, Abidjan, Côte d'Ivoire\nTél. : +225 07 07 20 16 54   ·   E-mail : info@kpandji.com",
  banque:
    "Compte bancaire : ECOBANK — intitulé du compte KPANDJI AUTOMOBILES — références CI059 01046 121659429001 46",
};

type Draft = ContratVenteContenu;

const ENERGIE: Record<string, string> = {
  ELECTRIQUE: "Électrique",
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  AUTOMATIQUE: "Automatique",
  MANUEL: "Manuelle",
};

function slashDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

function energie(value: string | null | undefined) {
  if (!value) return "";
  return value
    .split(" · ")
    .map((item) => ENERGIE[item] ?? item)
    .join(" / ");
}

function money(value: number) {
  return value ? formatNumberWithSpaces(value) : "";
}

function parseAmount(value: string) {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parsePercent(value: string) {
  const n = Number(value.replace("%", "").replace(",", ".").trim());
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return text.replace(".", ",");
}

function applySchedule(draft: Draft): Draft {
  const pourcentage = draft.pourcentageAcompte ?? "";
  const total = parseAmount(draft.montant);
  const pct = pourcentage.trim() === "" ? 0 : parsePercent(pourcentage);
  const acompte = Math.round((total * pct) / 100);
  return {
    ...draft,
    pourcentageAcompte: pourcentage,
    acompte: total ? money(acompte) : "",
    solde: total ? money(total - acompte) : "",
  };
}

const ANCIEN_TEL = "+225 01 01 04 77 03";
const NOUVEAU_TEL = "+225 07 07 20 16 54";
const SIEGE_UNE_LIGNE =
  "Siège social : Cocody, Riviéra Palmerais, Abidjan, Côte d'Ivoire   ·   Tél. : +225 01 01 04 77 03   ·   E-mail : info@kpandji.com";

function nouveauTelephone(value: string) {
  return value.includes(ANCIEN_TEL) ? value.replaceAll(ANCIEN_TEL, NOUVEAU_TEL) : value;
}

function withHeader(draft: Draft): Draft {
  const siege =
    !draft.siege || draft.siege === SIEGE_UNE_LIGNE || draft.siege.startsWith("KPANDJI AUTOMOBILES SARL")
      ? VENDEUR.siege
      : nouveauTelephone(draft.siege);
  return {
    ...draft,
    siege,
    adresseVendeur: nouveauTelephone(draft.adresseVendeur),
    banque: draft.banque && !draft.banque.includes("\n") ? draft.banque : VENDEUR.banque,
  };
}

function draftFrom(selected: BonCommandeDocumentData | null): Draft {
  if (selected?.contrat) {
    const saved = withHeader(selected.contrat);
    const pourcentage = saved.pourcentageAcompte?.trim();
    if (pourcentage) return applySchedule(saved);
    const total = parseAmount(saved.montant);
    const dejaVerse = parseAmount(saved.acompte);
    const inferred = total > 0 ? formatPercent((dejaVerse / total) * 100) : "40";
    return applySchedule({ ...saved, pourcentageAcompte: inferred });
  }
  const contenu = selected?.contenu;
  const total = selected?.prix.totalTtc ?? 0;
  const particulier = selected?.client.kind !== "ENTREPRISE";
  const nom = particulier
    ? contenu?.nomParticulier || selected?.client.nom || ""
    : contenu?.denomination || selected?.client.nom || "";
  const adresse = particulier
    ? contenu?.adresseParticulier || selected?.client.adresse || ""
    : contenu?.adresseEntreprise || selected?.client.adresse || "";
  const contact = particulier
    ? contenu?.contactParticulier || [selected?.client.telephone, selected?.client.email].filter(Boolean).join(" · ")
    : contenu?.contactEntreprise || [selected?.client.telephone, selected?.client.email].filter(Boolean).join(" · ");
  return {
    siege: VENDEUR.siege,
    banque: VENDEUR.banque,
    raison: VENDEUR.raison,
    rccm: VENDEUR.rccm,
    adresseVendeur: VENDEUR.adresse,
    acheteur: nom,
    piece: contenu?.cni || "",
    adresseAcheteur: [adresse, contact].filter(Boolean).join(" — "),
    marque: "KPANDJI",
    modele: contenu?.modele || selected?.vehicule?.modele || "",
    genre: contenu?.carrosserie || selected?.vehicule?.carrosserie || "",
    energie: contenu?.motorisation || [energie(selected?.vehicule?.motorisation), energie(selected?.vehicule?.transmission)].filter(Boolean).join(" / "),
    puissance: contenu?.cv || "",
    couleur: contenu?.couleur || selected?.vehicule?.couleur || "",
    montant: money(total),
    pourcentageAcompte: "40",
    acompte: money(Math.round(total * 0.4)),
    solde: money(total - Math.round(total * 0.4)),
    faitA: "Abidjan",
    faitLe: slashDate(selected?.bon?.date || selected?.date),
    etabli: false,
    etapeValidation: "",
  };
}

const ENVOYE = ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE", "VALIDE"];

function labelStatut(statut: string) {
  const labels: Record<string, string> = {
    A_VALIDER: "À valider",
    EN_VALIDATION: "Validation en cours",
    SOUS_RESERVE: "Sous réserve",
    VALIDE: "Déjà Validé",
  };
  return labels[statut] ?? "Brouillon";
}

function Line({
  value,
  onChange,
  inline = false,
  plain = false,
  narrow = false,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  inline?: boolean;
  plain?: boolean;
  narrow?: boolean;
  readOnly?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={plain ? Math.max(value.split("\n").length, 1) : 1}
      value={value}
      title={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      className={plain ? "cv-ink" : `${inline ? "cv-line cv-inline" : "cv-line"}${narrow ? " cv-pct" : ""}`}
    />
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <p className="cv-row">
      <span className="cv-box" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  after,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  after?: string;
  readOnly?: boolean;
}) {
  return (
    <Row>
      <span className="cv-fill">
        <span className="cv-label">{label}</span>
        <Line value={value} onChange={onChange} readOnly={readOnly} />
        {after ? <span className="cv-after">{after}</span> : null}
      </span>
    </Row>
  );
}

function Foot({ page }: { page: 1 | 2 }) {
  return (
    <footer className="cv-foot">
      <p>
        KPANDJI AUTOMOBILES SARL — RCCM : CI-ABJ-03-2022-B13-00710 — CC : 2213233 — Siège : Cocody
        Riviéra Palmerais, Abidjan — Tél. : +225 07 07 20 16 54
      </p>
      <p className="cv-foot-row">
        <span>Contrat de vente et d&apos;assemblage de véhicule — Page {page} / 2</span>
        <span>Paraphes : Client ………… &nbsp;&nbsp; Kpandji …………</span>
      </p>
    </footer>
  );
}

export default function ContratDeVenteDocument({
  source,
  dossiers = [],
  embedded = false,
  validation = false,
  dossierPath = "/commercial/dossier-clientele",
  basePath = "/commercial/contract-vente",
  validatedPath,
  activeFactureId,
  emptyText,
}: {
  source: BonCommandeSource | null;
  dossiers?: DossierBonOption[];
  embedded?: boolean;
  validation?: boolean;
  dossierPath?: string;
  basePath?: string;
  validatedPath?: string;
  activeFactureId?: string;
  emptyText?: string;
}) {
  const router = useRouter();
  const selected = source?.selected ?? null;
  const [form, setForm] = useState<Draft>(() => draftFrom(selected));
  const [recording, setRecording] = useState(false);
  const [establishing, setEstablishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const validatedArchive = !embedded && basePath === "/commercial/contract-vente-deja-valide";
  const showProspectSearch =
    !embedded && validation && basePath === "/responsablecommercial/contrat-de-vente";
  const showClientSearch = !embedded && !validation;
  const clientQueryNormalized = clientQuery.trim().toLocaleLowerCase("fr");
  const clientMatches = clientQueryNormalized
    ? dossiers.filter((item) =>
        `${item.prospectNom} ${item.nomCourt}`.toLocaleLowerCase("fr").includes(clientQueryNormalized),
      )
    : [];

  useEffect(() => {
    if (!searchOpen) return;
    const close = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [searchOpen]);

  useEffect(() => {
    setForm(draftFrom(selected));
    // Reload the blanks when the linked proforma or its validation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.factureId, selected?.contrat?.etapeValidation, selected?.contrat?.etabli]);

  const set = (key: keyof Draft) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setMontant = (montant: string) => setForm((current) => applySchedule({ ...current, montant }));
  const setPourcentage = (pourcentageAcompte: string) =>
    setForm((current) => applySchedule({ ...current, pourcentageAcompte }));
  const reste = formatPercent(Math.max(0, 100 - parsePercent(form.pourcentageAcompte || "0")));

  const openDossier = (id: string) => {
    router.push(
      embedded
        ? `${dossierPath}/${id}?section=contrat`
        : validation
          ? `${basePath}?facture=${id}`
          : `${basePath}?dossier=${id}`,
    );
  };

  const openClientMatch = (item: DossierBonOption) => {
    if (item.proformaCount === 0) return;
    setClientQuery(showProspectSearch ? item.nomCourt : item.prospectNom);
    setSearchOpen(false);
    openDossier(item.id);
  };

  const clientSearch = showClientSearch || showProspectSearch ? (
    <div ref={searchRef} className="cv-hide relative mx-auto mb-3 max-w-[210mm]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={clientQuery}
          onChange={(event) => {
            setClientQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSearchOpen(false);
            if (event.key !== "Enter") return;
            const match = clientMatches.find((item) => item.proformaCount > 0);
            if (match) openClientMatch(match);
          }}
          placeholder={showProspectSearch ? "Rechercher un prospect" : "Rechercher un dossier par nom du client"}
          className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-[#111] outline-none focus:border-[#e36a12]"
        />
      </div>
      {searchOpen && clientQueryNormalized && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {clientMatches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              {showProspectSearch ? "Aucun prospect" : "Aucun dossier pour ce client"}
            </li>
          ) : (
            clientMatches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openClientMatch(item)}
                  disabled={item.proformaCount === 0}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-medium text-[#111]">{showProspectSearch ? item.nomCourt : item.prospectNom}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {item.numero}
                    {item.proformaCount === 0 ? " — sans proforma" : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  ) : null;

  const envoye = ENVOYE.includes(form.etapeValidation);

  const handleSave = async () => {
    if (!selected || selected.statut === "ANNULEE") return;
    setRecording(true);
    const result = await saveContratDeVente(selected.factureId, form);
    if (!result.success) toast.error(result.error);
    else {
      toast.success("Contrat de vente enregistré");
      router.refresh();
    }
    setRecording(false);
  };

  const handleEtablir = async () => {
    if (!selected || selected.statut === "ANNULEE" || form.etabli) return;
    setEstablishing(true);
    const result = await etablirContratDeVente(selected.factureId, form);
    if (!result.success) toast.error(result.error);
    else {
      setForm((current) => ({ ...current, etabli: true }));
      toast.success("Contrat de vente établi");
      router.refresh();
    }
    setEstablishing(false);
  };

  const handleSoumettre = async () => {
    if (!selected || selected.statut === "ANNULEE" || envoye) return;
    setSubmitting(true);
    const result = await soumettreContratDeVenteValidation(selected.factureId, form);
    if (!result.success) toast.error(result.error);
    else {
      setForm((current) => ({ ...current, etabli: true, etapeValidation: "A_VALIDER" }));
      toast.success("Contrat envoyé au responsable commercial");
      router.refresh();
    }
    setSubmitting(false);
  };

  const handleValider = async () => {
    const factureId = activeFactureId || selected?.factureId;
    if (!factureId) {
      setValidationError("Contrat introuvable.");
      return;
    }
    setValidationError(null);
    setDeciding(true);
    const result = await validerContratDeVente(factureId);
    if (!result.success) {
      setValidationError(result.error || "La validation n'a pas abouti");
      setDeciding(false);
      return;
    }
    setForm((current) => ({ ...current, etapeValidation: "VALIDE" }));
    window.dispatchEvent(new Event("contrats-a-valider-changed"));
    window.location.assign(`${validatedPath || "/responsablecommercial/contrat-de-vente-deja-valide"}?facture=${factureId}`);
  };

  const decide = async (action: () => Promise<{ success: boolean; error?: string }>, statut: Draft["etapeValidation"], message: string) => {
    if (!selected) return;
    setDeciding(true);
    const result = await action();
    if (!result.success) {
      toast.error(result.error || "La validation n'a pas abouti");
      setDeciding(false);
      return;
    }
    setForm((current) => ({ ...current, etapeValidation: statut }));
    toast.success(message);
    if (validation) window.dispatchEvent(new Event("contrats-a-valider-changed"));
    if (validation && statut === "VALIDE" && validatedPath) {
      window.location.assign(`${validatedPath}?facture=${selected.factureId}`);
      return;
    }
    router.refresh();
    setDeciding(false);
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      const result = await exportContratVenteWordFile(form);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      const url = URL.createObjectURL(
        new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Contrat de vente exporté en Word");
    } catch (error) {
      console.error(error);
      toast.error("L'export Word a échoué");
    } finally {
      setExporting(false);
    }
  };

  if ((!source || !selected) && (emptyText || !validation)) {
    return (
      <div className="w-full min-w-0 px-3 py-4">
        {clientSearch}
        <p className="rounded-2xl border border-dashed border-[#d7a441] bg-white px-4 py-8 text-sm text-[#6d5428]">
          {emptyText ?? "Une facture proforma est nécessaire avant le contrat de vente."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 rounded-2xl bg-[#f6f1e6] px-3 py-4 print:bg-white print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .cv-paper {
              width: 100%;
              max-width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
              margin: 0 auto;
              padding: 9mm 11mm 8mm;
              background: #fff;
              color: #111;
              font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif;
              font-size: 10.5pt;
              line-height: 1.35;
              display: flex;
              flex-direction: column;
            }
            .cv-head { display: flex; align-items: flex-start; gap: 4mm; }
            .cv-head-text { flex: 1; min-width: 0; }
            .cv-logo { width: 24mm; height: auto; object-fit: contain; flex: none; }
            .cv-brand {
              margin: 0;
              color: #111;
              font-size: 12pt;
              font-weight: 800;
              letter-spacing: 0.03em;
              line-height: 1;
            }
            .cv-tagline { margin: 1px 0 2mm; font-size: 10pt; font-style: italic; }
            .cv-ink {
              display: block;
              width: 100%;
              box-sizing: border-box;
              border: 0;
              margin: 0;
              padding: 1px 0;
              resize: none;
              overflow: hidden;
              overflow-wrap: anywhere;
              background: transparent;
              color: #111;
              font: inherit;
              font-weight: 600;
              line-height: 1.35;
              min-height: 1.35em;
              field-sizing: content;
            }
            .cv-ink:hover { background: rgba(255, 236, 170, 0.45); }
            .cv-ink:focus { background: #fff6d8; outline: 1px solid #e7b84a; }
            .cv-rule { border: 0; border-top: 2px solid #e7b84a; margin: 1.4mm 0 2.2mm; }
            .cv-title {
              margin: 0 0 1mm;
              text-align: center;
              color: #e36a12;
              font-size: 14pt;
              font-weight: 800;
              letter-spacing: 0.06em;
              line-height: 1.25;
            }
            .cv-sub {
              margin: 0 0 2mm;
              text-align: center;
              color: #111;
              font-size: 10.5pt;
              font-style: italic;
            }
            .cv-kicker, .cv-article {
              background: #111;
              color: #e7b84a;
              font-weight: 700;
              font-size: 10.5pt;
              letter-spacing: 0.03em;
              padding: 2.5px 8px;
              margin: 3.4mm 0 2mm;
            }
            .cv-text { margin: 0 0 1.5mm; text-align: justify; }
            .cv-fait {
              display: flex;
              flex-wrap: wrap;
              align-items: flex-end;
              gap: 1.5mm;
              text-align: left;
            }
            .cv-row {
              display: flex;
              align-items: flex-start;
              gap: 2.5mm;
              margin: 0 0 2.2mm;
            }
            .cv-box {
              width: 3.4mm;
              height: 3.4mm;
              margin-top: 1.1mm;
              border: 1.25px solid #111;
              background: #fff;
              flex: none;
            }
            .cv-fill {
              display: flex;
              flex: 1;
              min-width: 0;
              align-items: flex-end;
              flex-wrap: wrap;
              gap: 1.5mm;
            }
            .cv-label, .cv-after { white-space: nowrap; }
            .cv-line {
              field-sizing: content;
              flex: 1;
              min-width: 28mm;
              border: 0;
              border-bottom: 1px dotted #222;
              background: transparent;
              color: #111;
              font: inherit;
              font-weight: 700;
              line-height: 1.25;
              padding: 0 2px;
              resize: none;
              overflow: hidden;
            }
            .cv-inline {
              flex: none;
              width: 46mm;
              min-width: 28mm;
              display: inline-block;
              vertical-align: baseline;
            }
            .cv-pct { width: 16mm; min-width: 14mm; text-align: center; }
            .cv-line:hover { background: rgba(255, 236, 170, 0.55); }
            .cv-line:focus { background: #fff6d8; outline: none; }
            .cv-signs {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8mm;
              margin-top: 10mm;
            }
            .cv-sign { min-height: 38mm; }
            .cv-sign p {
              margin: 0 0 2mm;
              background: #111;
              color: #e7b84a;
              font-weight: 700;
              padding: 2.5px 8px;
            }
            .cv-sign span { display: block; font-size: 10pt; color: #111; }
            .cv-foot {
              margin-top: auto;
              padding-top: 3mm;
              border-top: 2px solid #e7b84a;
              font-size: 8pt;
              line-height: 1.35;
              text-align: center;
              color: #111;
            }
            .cv-paper.locked textarea { pointer-events: none; }
            .cv-foot p { margin: 0; }
            .cv-foot-row { display: flex; justify-content: space-between; gap: 8px; margin-top: 1mm; }
            @media print {
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body * { visibility: hidden; }
              #contrat-printable, #contrat-printable * { visibility: visible; }
              #contrat-printable {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                background: #fff !important;
              }
              .cv-paper {
                box-shadow: none !important;
                margin: 0 !important;
                width: 210mm !important;
                max-width: 210mm !important;
                min-height: 297mm !important;
                break-after: page;
                page-break-after: always;
              }
              .cv-paper:last-child { break-after: auto; page-break-after: auto; }
              .cv-hide { display: none !important; }
              .cv-line, .cv-line:hover, .cv-line:focus,
              .cv-ink, .cv-ink:hover, .cv-ink:focus {
                background: transparent !important;
                outline: none !important;
              }
              @page { size: A4; margin: 0; }
            }
          `,
        }}
      />

      {clientSearch}

      <div className="cv-hide mx-auto mb-3 flex max-w-[210mm] flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!embedded && source && dossiers.length > 0 && (
            <select
              value={source.dossier.id}
              onChange={(event) => openDossier(event.target.value)}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            >
              {dossiers.map((item) => (
                <option key={item.id} value={item.id} disabled={item.proformaCount === 0}>
                  {item.numero} · {item.prospectNom}
                  {item.proformaCount === 0 ? " — sans proforma" : ""}
                </option>
              ))}
            </select>
          )}
          {validation && dossiers.length === 0 ? (
            <Link href={basePath} className="text-sm font-semibold text-[#111] hover:underline">
              Retour à la liste
            </Link>
          ) : null}
          {!validation && form.etapeValidation === "VALIDE" && (
            <span className="inline-flex h-9 items-center rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a]">
              Déjà Validé
            </span>
          )}
          <p className="text-xs text-slate-600">
            {validatedArchive
              ? "Contrats déjà validés par le responsable commercial."
              : validation
                ? "Consultez le contrat, puis commencez la validation."
                : "Les zones pointillées sont enregistrées dans la base."}
          </p>
          {source && selected && source.proformas.length > 1 && !validation && (
            <select
              value={selected.factureId}
              onChange={(event) => {
                const facture = event.target.value;
                router.push(
                  embedded
                    ? `${dossierPath}/${source.dossier.id}?facture=${facture}&section=contrat`
                    : validation
                      ? `${basePath}?facture=${facture}`
                      : `${basePath}?dossier=${source.dossier.id}&facture=${facture}`,
                );
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            >
              {source.proformas.map((item) => (
                <option key={item.id} value={item.id}>
                  Proforma du {slashDate(item.date)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {validatedArchive ? (
            <span className="inline-flex h-9 items-center rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a]">
              Déjà Validé
            </span>
          ) : validation ? (
            <>
              <span className="inline-flex h-9 items-center rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a]">
                {labelStatut(form.etapeValidation)}
              </span>
              {form.etapeValidation === "A_VALIDER" && (
                <button
                  type="button"
                  onClick={() =>
                    decide(
                      () => commencerValidationContratDeVente(selected?.factureId ?? ""),
                      "EN_VALIDATION",
                      "Validation commencée",
                    )
                  }
                  disabled={deciding}
                  className="h-9 rounded-md bg-[#e36a12] px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {deciding ? "Validation…" : "Commencer la validation"}
                </button>
              )}
              {form.etapeValidation === "EN_VALIDATION" && (
                <button
                  type="button"
                  onClick={handleValider}
                  disabled={deciding}
                  className="h-9 rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a] disabled:opacity-50"
                >
                  {deciding ? "Validation…" : "Valider"}
                </button>
              )}
              {(form.etapeValidation === "A_VALIDER" || form.etapeValidation === "EN_VALIDATION") && (
                <button
                  type="button"
                  onClick={() =>
                    decide(() => marquerContratSousReserve(selected?.factureId ?? ""), "SOUS_RESERVE", "Contrat placé sous réserve")
                  }
                  disabled={deciding}
                  className="h-9 rounded-md border border-[#111] bg-white px-3 text-sm font-semibold text-[#111] disabled:opacity-50"
                >
                  Sous réserve
                </button>
              )}
              {validationError && <p className="self-center text-sm font-medium text-red-600">{validationError}</p>}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={!selected || recording || selected.statut === "ANNULEE"}
                className="h-9 rounded-md border border-[#111] bg-white px-3 text-sm font-semibold text-[#111] disabled:opacity-50"
              >
                {recording ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={handleEtablir}
                disabled={!selected || form.etabli || establishing || selected.statut === "ANNULEE"}
                className="h-9 rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a] disabled:opacity-50"
              >
                {establishing ? "Établissement…" : form.etabli ? "Contrat établi" : "Établir le contrat"}
              </button>
              <button
                type="button"
                onClick={handleSoumettre}
                disabled={!selected || submitting || envoye || selected.statut === "ANNULEE"}
                className="h-9 rounded-md bg-[#e36a12] px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Envoi…" : envoye ? labelStatut(form.etapeValidation) : "Faire Valider"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExportWord}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#e36a12] bg-white px-3 text-sm font-semibold text-[#e36a12] disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            {exporting ? "Export…" : "Export en Word"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#e7b84a] px-3 text-sm font-semibold text-[#111]"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        </div>
      </div>

      <div id="contrat-printable" className="mx-auto flex w-full min-w-0 max-w-[210mm] flex-col gap-4 print:max-w-none print:gap-0">
        <article className={`cv-paper shadow-lg print:shadow-none${validation || validatedArchive ? " locked" : ""}`}>
          <header className="cv-head">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo d'impression, taille fixée en mm */}
            <img src="/logo.png" alt="Kpandji Automobiles" className="cv-logo" />
            <div className="cv-head-text">
              <h1 className="cv-brand">KPANDJI AUTOMOBILES</h1>
              <p className="cv-tagline">Constructeur automobile ivoirien</p>
              <Line plain value={form.siege} onChange={set("siege")} />
              <Line plain value={form.banque} onChange={set("banque")} />
            </div>
          </header>
          <hr className="cv-rule" />
          <h2 className="cv-title">CONTRAT DE VENTE ET D&apos;ASSEMBLAGE DE VÉHICULE</h2>
          <p className="cv-sub">(Soumis aux Conditions Générales de Vente)</p>

          <p className="cv-kicker">ENTRE LES SOUSSIGNÉS :</p>
          <p className="cv-kicker">1. LE VENDEUR (CONSTRUCTEUR)</p>
          <Field label="Raison Sociale / Nom :" value={form.raison} onChange={set("raison")} />
          <Field label="Registre du Commerce (RCCM) :" value={form.rccm} onChange={set("rccm")} /><br/>
          <Field label="Adresse / Téléphone :" value={form.adresseVendeur} onChange={set("adresseVendeur")} />

          <p className="cv-kicker">2. L&apos;ACHETEUR (LE CLIENT)</p>
          <Field label="Nom & Prénoms :" value={form.acheteur} onChange={set("acheteur")} />
          <Field label="N° de Pièce d'Identité :" value={form.piece} onChange={set("piece")} />
          <Field label="Adresse / Téléphone :" value={form.adresseAcheteur} onChange={set("adresseAcheteur")} />

          <p className="cv-kicker">IL A ÉTÉ ARRÊTÉ ET CONVENU CE QUI SUIT :</p>
          <h3 className="cv-article">Article 1 : Objet du contrat &amp; Caractéristiques du véhicule</h3>
          <p className="cv-text">
            Le Vendeur s&apos;engage à assembler, construire et livrer à l&apos;Acheteur qui l&apos;accepte, le véhicule neuf de sa propre fabrication selon les spécifications techniques suivantes :
          </p>
          <Field label="Marque / Constructeur :" value={form.marque} onChange={set("marque")} />
          <Field label="Modèle / Type :" value={form.modele} onChange={set("modele")} />
          <Field label="Genre / Carrosserie :" value={form.genre} onChange={set("genre")} />
          <Field label="Énergie / Carburant :" value={form.energie} onChange={set("energie")} />
          <Field label="Puissance Fiscale :" value={form.puissance} onChange={set("puissance")} />
          <Field label="Couleur extérieure :" value={form.couleur} onChange={set("couleur")} />
          <Row>
            <span>État de livraison : Neuf (Sortie d&apos;Usine)</span>
          </Row>

          <h3 className="cv-article">Article 2 : Prix et Modalités de règlement</h3>
          <p className="cv-text">La présente vente est consentie au prix total et forfaitaire de :</p>
          <Field label="Montant global :" value={form.montant} onChange={setMontant} after="F CFA" />
          <p className="cv-text">
            En cas de paiement échelonné par tranche sollicité par l&apos;Acheteur, le règlement s&apos;effectue obligatoirement selon le calendrier strict ci-dessous :
          </p>
          <Row>
            <span className="cv-fill">
              <span className="cv-label">Acompte initial minimum de</span>
              <Line narrow inline value={form.pourcentageAcompte} onChange={setPourcentage} />
              <span className="cv-label">% (dû à la commande) :</span>
              <Line readOnly value={form.acompte} onChange={() => undefined} />
              <span className="cv-after">F CFA</span>
            </span>
          </Row>
          <p className="cv-text">Le versement de cet acompte valide la</p>
          <Foot page={1} />
        </article>

        <article className={`cv-paper shadow-lg print:shadow-none${validation || validatedArchive ? " locked" : ""}`}>
          <p className="cv-text">
            commande et déclenche immédiatement les opérations d&apos;assemblage et de construction du véhicule au sein des ateliers du Vendeur.
          </p>
          <Field
            label={`Solde de ${reste}% restant dû (au plus tard à la livraison) :`}
            value={form.solde}
            onChange={() => undefined}
            after="F CFA"
            readOnly
          />
          <p className="cv-text">
            Le solde est payable de manière échelonnée durant la fabrication, au plus tard le jour de la mise à disposition effective du véhicule achevé. Aucun véhicule ne sera mis en possession du client avant paiement intégral.
          </p>

          <h3 className="cv-article">Article 3 : Délais de livraison et Force majeure</h3>
          <p className="cv-text">
            <strong>Délai d&apos;exécution :</strong> Le Vendeur s&apos;engage à achever l&apos;assemblage, la construction et à mettre le véhicule commandé à la disposition de l&apos;Acheteur dans un délai maximal de cent vingt (90) jours calendaires. Ce délai court de plein droit à compter du lendemain de la réalisation cumulative des deux conditions suivantes :
          </p>
          <Row>
            <span>Le respect et l&apos;effectivité des versements requis à la commande ;</span>
          </Row>
          <Row>
            <span>La levée de la condition mentionnée dans les CGV</span>
          </Row>

          <h3 className="cv-article">Article 4 : Approbation des Conditions Générales de Vente (CGV)</h3>
          <p className="cv-text">
            L&apos;Acheteur déclare expressément avoir reçu, pris connaissance et approuvé sans réserve l&apos;intégralité des Conditions Générales de Vente (CGV) annexées au présent contrat, lesquelles régissent les détails administratifs, les modalités de livraison, la réserve de propriété et le règlement des litiges.
          </p>
          <p className="cv-text">
            Par la signature des présentes, les parties valident l&apos;accord sur l&apos;objet, le prix et les exclusions de garantie.
          </p>
          <p className="cv-text cv-fait">
            <span>Fait à</span>
            <Line inline value={form.faitA} onChange={set("faitA")} />
            <span>, le</span>
            <Line inline value={form.faitLe} onChange={set("faitLe")} />
            <span>, en trois (3) exemplaires originaux.</span>
          </p>

          <div className="cv-signs">
            <div className="cv-sign">
              <p>Le Vendeur (Constructeur)</p>
              <span>(&quot;Lu et approuvé&quot; + Signature)</span>
            </div>
            <div className="cv-sign">
              <p>L&apos;Acheteur (Le Client)</p>
              <span>(&quot;Lu et approuvé&quot; + Signature)</span>
            </div>
          </div>
          <Foot page={2} />
        </article>
      </div>
    </div>
  );
}
