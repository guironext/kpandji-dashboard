"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { exportBonCommandeWordFile } from "@/lib/actions/export-bon-commande-word";
import {
  commencerValidationBonDeCommande,
  generateNextNumero,
  marquerBonSousReserve,
  saveBonCommandeDocument,
  soumettreBonDeCommandeValidation,
  validerBonDeCommande,
  validerBonPourAccord,
  type BonCommandeDocumentData,
  type BonCommandeSource,
  type DossierBonOption,
} from "@/lib/actions/bondecommande";
import type { BonCommandeContenu } from "@/lib/bon-commande-document";
import { updateClient } from "@/lib/actions/client";
import { updateClientEntreprise } from "@/lib/actions/client_entreprise";
import { formatNumberWithSpaces } from "@/lib/utils";

const PETITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

function deuxChiffres(n: number): string {
  if (n < 20) return PETITS[n];
  if (n < 70) {
    const dizaine = Math.floor(n / 10);
    const unite = n % 10;
    if (unite === 0) return DIZAINES[dizaine];
    if (unite === 1) return `${DIZAINES[dizaine]} et un`;
    return `${DIZAINES[dizaine]}-${PETITS[unite]}`;
  }
  if (n < 80) {
    const reste = n - 60;
    if (reste === 1) return "soixante et un";
    if (reste === 11) return "soixante et onze";
    return `soixante-${deuxChiffres(reste)}`;
  }
  const reste = n - 80;
  if (reste === 0) return "quatre-vingts";
  return `quatre-vingt-${deuxChiffres(reste)}`;
}

function troisChiffres(n: number): string {
  if (n < 100) return deuxChiffres(n);
  const centaines = Math.floor(n / 100);
  const reste = n % 100;
  const cent = centaines === 1 ? "cent" : `${PETITS[centaines]} cent`;
  if (reste === 0) return centaines === 1 ? "cent" : `${cent}s`;
  return `${cent} ${deuxChiffres(reste)}`;
}

function nombreEnLettres(value: number) {
  const montant = Math.round(Math.abs(value));
  if (montant === 0) return "";
  const parts: string[] = [];
  const milliards = Math.floor(montant / 1_000_000_000);
  const millions = Math.floor((montant % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((montant % 1_000_000) / 1_000);
  const reste = montant % 1_000;
  if (milliards) parts.push(milliards === 1 ? "un milliard" : `${troisChiffres(milliards)} milliards`);
  if (millions) parts.push(millions === 1 ? "un million" : `${troisChiffres(millions)} millions`);
  if (milliers) parts.push(milliers === 1 ? "mille" : `${troisChiffres(milliers)} mille`);
  if (reste) parts.push(troisChiffres(reste));
  const phrase = parts.join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function slashDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

const ENERGIE: Record<string, string> = {
  ELECTRIQUE: "Électrique",
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  AUTOMATIQUE: "Automatique",
  MANUEL: "Manuelle",
};

function energie(value: string | null | undefined) {
  if (!value) return "";
  return value.split(" · ").map((item) => ENERGIE[item] ?? item).join(" / ");
}

function money(value: number) {
  return value ? formatNumberWithSpaces(value) : "";
}

type Draft = {
  siege: string;
  banque: string;
  numero: string;
  date: string;
  conseillerNom: string;
  matricule: string;
  conseillerTel: string;
  nomParticulier: string;
  cni: string;
  denomination: string;
  rccm: string;
  ncc: string;
  representant: string;
  adresseParticulier: string;
  adresseEntreprise: string;
  contactParticulier: string;
  contactEntreprise: string;
  carteParticulier: string;
  carteEntreprise: string;
  modele: string;
  carrosserie: string;
  motorisation: string;
  cv: string;
  couleur: string;
  annee: string;
  homologation: string;
  quantite: string;
  vin: string;
  opt1: string;
  qte1: string;
  pu1: string;
  mt1: string;
  opt2: string;
  qte2: string;
  pu2: string;
  mt2: string;
  livQte: string;
  livPu: string;
  livMt: string;
  remisePct: string;
  vehiculeHt: string;
  optionsHt: string;
  remiseMontant: string;
  totalHt: string;
  tva: string;
  totalTtc: string;
  net: string;
  lettres: string;
  acompte1: string;
  recu1: string;
  acompte2: string;
  recu2: string;
  solde: string;
  recuSolde: string;
  organisme: string;
  montantFinance: string;
  dateAccord: string;
  dateLivraison: string;
  autreLieu: string;
  receptionnaire: string;
  pieceReception: string;
  faitA: string;
  faitLe: string;
  signatureClient: string;
  signatureConseiller: string;
};

function emptyDraft(): Draft {
  return {
    siege: "Siège social : Cocody, Riviéra Palmerais, Abidjan, Côte d'Ivoire\nTél. : +225 07 07 20 16 54   ·   E-mail : info@kpandji.com",
    banque: "Compte bancaire : ECOBANK — intitulé du compte KPANDJI AUTOMOBILES — références CI059 01046 121659429001 46",
    numero: "",
    date: "",
    conseillerNom: "",
    matricule: "",
    conseillerTel: "",
    nomParticulier: "",
    cni: "",
    denomination: "",
    rccm: "",
    ncc: "",
    representant: "",
    adresseParticulier: "",
    adresseEntreprise: "",
    contactParticulier: "",
    contactEntreprise: "",
    carteParticulier: "",
    carteEntreprise: "",
    modele: "",
    carrosserie: "",
    motorisation: "",
    cv: "",
    couleur: "",
    annee: "",
    homologation: "",
    quantite: "",
    vin: "",
    opt1: "",
    qte1: "",
    pu1: "",
    mt1: "",
    opt2: "",
    qte2: "",
    pu2: "",
    mt2: "",
    livQte: "",
    livPu: "",
    livMt: "",
    remisePct: "",
    vehiculeHt: "",
    optionsHt: "",
    remiseMontant: "",
    totalHt: "",
    tva: "",
    totalTtc: "",
    net: "",
    lettres: "",
    acompte1: "",
    recu1: "",
    acompte2: "",
    recu2: "",
    solde: "",
    recuSolde: "",
    organisme: "",
    montantFinance: "",
    dateAccord: "",
    dateLivraison: "",
    autreLieu: "",
    receptionnaire: "",
    pieceReception: "",
    faitA: "Abidjan",
    faitLe: "",
    signatureClient: "",
    signatureConseiller: "",
  };
}

function checksFrom(contenu: BonCommandeContenu | null, selected: BonCommandeDocumentData | null) {
  return {
    lieu: contenu?.lieu ?? "",
    qualite: contenu?.qualite ?? (selected ? (selected.client.kind === "ENTREPRISE" ? "professionnel" : "consommateur") : ""),
    reglement: contenu?.reglement ?? "",
    financement: contenu?.financement ?? "",
    livraison: contenu?.livraison ?? (contenu ? "" : selected ? "site" : ""),
    horsEtablissement: contenu?.horsEtablissement ?? false,
  };
}

function draftFields(contenu: BonCommandeContenu): Draft {
  const fields = emptyDraft();
  for (const key of Object.keys(fields) as Array<keyof Draft>) {
    fields[key] = contenu[key];
  }
  const siegeUneLigne =
    "Siège social : Cocody, Riviéra Palmerais, Abidjan, Côte d'Ivoire   ·   Tél. : +225 01 01 04 77 03   ·   E-mail : info@kpandji.com";
  if (fields.siege === siegeUneLigne) fields.siege = emptyDraft().siege;
  else if (fields.siege.includes("+225 01 01 04 77 03")) {
    fields.siege = fields.siege.replaceAll("+225 01 01 04 77 03", "+225 07 07 20 16 54");
  }
  return fields;
}

function draftFrom(selected: BonCommandeDocumentData | null): Draft {
  const base = emptyDraft();
  if (!selected) return base;
  const prix = selected.prix;
  const total = prix.totalTtc;
  const acompte1 = Math.round(total * 0.3);
  const acompte2 = Math.round(total * 0.4);
  const contact = [selected.client.telephone, selected.client.email].filter(Boolean).join(" · ");
  const particulier = selected.client.kind !== "ENTREPRISE";
  const option1 = selected.options[0];
  const option2 = selected.options[1];
  const date = slashDate(selected.bon?.date || selected.date);
  return {
    ...base,
    numero: selected.bon?.numero ?? "",
    date,
    conseillerNom: selected.commercial.nom,
    conseillerTel: selected.commercial.telephone ?? "",
    nomParticulier: particulier ? selected.client.nom : "",
    denomination: particulier ? "" : selected.client.nom,
    representant: selected.client.representant ?? "",
    adresseParticulier: particulier ? selected.client.adresse ?? "" : "",
    adresseEntreprise: particulier ? "" : selected.client.adresse ?? "",
    contactParticulier: particulier ? contact : "",
    contactEntreprise: particulier ? "" : contact,
    carteParticulier: particulier ? selected.client.nom : "",
    carteEntreprise: particulier ? "" : selected.client.nom,
    modele: selected.vehicule?.modele ?? "",
    carrosserie: selected.vehicule?.carrosserie ?? "",
    motorisation: [energie(selected.vehicule?.motorisation), energie(selected.vehicule?.transmission)].filter(Boolean).join(" / "),
    couleur: selected.vehicule?.couleur ?? "",
    quantite: selected.vehicule?.quantite ? String(selected.vehicule.quantite) : "",
    vin: selected.vehicule?.chassis ?? "",
    opt1: option1?.designation ?? "",
    qte1: option1 ? String(option1.quantite) : "",
    pu1: option1 ? money(option1.prixUnitaire) : "",
    mt1: option1 ? money(option1.montant) : "",
    opt2: option2?.designation ?? "",
    qte2: option2 ? String(option2.quantite) : "",
    pu2: option2 ? money(option2.prixUnitaire) : "",
    mt2: option2 ? money(option2.montant) : "",
    remisePct: prix.remisePct ? String(prix.remisePct) : "",
    vehiculeHt: money(prix.vehiculeHt),
    optionsHt: money(prix.optionsHt),
    remiseMontant: prix.remiseMontant ? `– ${money(prix.remiseMontant)}` : "",
    totalHt: money(prix.totalHt),
    tva: money(prix.tvaMontant),
    totalTtc: money(total),
    net: money(total),
    lettres: nombreEnLettres(total),
    acompte1: money(acompte1),
    acompte2: money(acompte2),
    solde: money(total - acompte1 - acompte2),
    dateLivraison: slashDate(selected.echeance),
    receptionnaire: selected.client.nom,
    faitLe: date,
    signatureClient: selected.client.nom,
    signatureConseiller: selected.commercial.nom,
  };
}

function TextLine({
  value,
  onChange,
  align = "left",
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right" | "center";
  placeholder?: string;
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
      rows={1}
      value={value}
      title={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="ink"
      style={{ textAlign: align }}
    />
  );
}

function Blank({
  value,
  onChange,
  width = "28mm",
}: {
  value: string;
  onChange: (value: string) => void;
  width?: string;
}) {
  return (
    <input
      value={value}
      title={value}
      onChange={(event) => onChange(event.target.value)}
      className="blank"
      style={{ width }}
    />
  );
}

function Choice({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="choice">
      <span className="tick" aria-hidden>{on ? "✓" : ""}</span>
      <span>{children}</span>
    </button>
  );
}

function pick(current: string, value: string, set: (next: string) => void) {
  set(current === value ? "" : value);
}

function labelStatutBon(statut: string) {
  const labels: Record<string, string> = {
    EN_ATTENTE: "Brouillon",
    A_VALIDER: "À valider",
    EN_VALIDATION: "Validation en cours",
    SOUS_RESERVE: "Sous réserve",
    VALIDE: "Déjà Validé",
    VALIDE_APPORT_INITIAL: "Validé — apport initial",
    ANNULE: "Annulé",
  };
  return labels[statut] ?? "Brouillon";
}

function Foot({ page, label }: { page: 1 | 2; label: string }) {
  return (
    <footer className="foot">
      <p>
        KPANDJI AUTOMOBILES SARL — RCCM : CI-ABJ-03-2022-B13-00710 — CC : 2213233 — Siège : Cocody
        Riviéra Palmerais, Abidjan — Tél. : +225 07 07 20 16 54
      </p>
      <p className="foot-row">
        <span>{label} véhicule neuf — Page {page} / 2</span>
        <span>Paraphes : Client ………… &nbsp;&nbsp; Kpandji …………</span>
      </p>
    </footer>
  );
}

export default function BonDeCommandeDocument({
  source,
  dossiers,
  embedded = false,
  validation = false,
  documentTitle = "BON DE COMMANDE",
  basePath = "/commercial/bon-de-commande",
  dossierPath = "/commercial/dossier-clientele",
  emptyText,
}: {
  source: BonCommandeSource | null;
  dossiers: DossierBonOption[];
  embedded?: boolean;
  validation?: boolean;
  documentTitle?: string;
  basePath?: string;
  dossierPath?: string;
  emptyText?: string;
}) {
  const titreCourt =
    documentTitle === "BON POUR ACCORD"
      ? "Bon pour accord"
      : documentTitle === "LETTRE DE COMMANDE"
        ? "Lettre de commande"
        : documentTitle === "APPEL D'OFFRE"
          ? "Appel d'offre"
          : "Bon de commande";
  const router = useRouter();
  const selected = source?.selected ?? null;
  const saved = selected?.contenu ?? null;
  const initialChecks = checksFrom(saved, selected);
  const [form, setForm] = useState<Draft>(() => (saved ? draftFields(saved) : draftFrom(selected)));
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bonStatut, setBonStatut] = useState(selected?.bon?.statut ?? "");
  const [lieu, setLieu] = useState(initialChecks.lieu);
  const [qualite, setQualite] = useState(initialChecks.qualite);
  const [reglement, setReglement] = useState(initialChecks.reglement);
  const [financement, setFinancement] = useState(initialChecks.financement);
  const [livraison, setLivraison] = useState(initialChecks.livraison);
  const [horsEtablissement, setHorsEtablissement] = useState(initialChecks.horsEtablissement);
  const [clientQuery, setClientQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const validatedArchive =
    !embedded &&
    (basePath === "/responsablecommercial/bon-de-commande-deja-valide" ||
      basePath === "/responsablecommercial/bon-pour-accord-deja-valide" ||
      basePath === "/commercial/bon-de-commande-deja-valide" ||
      basePath === "/commercial/bon-pour-accord-deja-valide" ||
      basePath === "/commercial/lettre-commande-deja-valide" ||
      basePath === "/commercial/appel-offre-deja-valide");
  const showProspectSearch =
    !embedded &&
    validation &&
    (basePath === "/responsablecommercial/bon-de-commande" ||
      basePath === "/responsablecommercial/bon-pour-accord");
  const showClientSearch =
    !embedded &&
    !validation &&
    (basePath === "/commercial/bon-de-commande" ||
      basePath === "/commercial/bon-pour-accord" ||
      basePath === "/commercial/lettre-commande" ||
      basePath === "/commercial/appel-offre");
  const clientQueryNormalized = clientQuery.trim().toLocaleLowerCase("fr");
  const matchesQuery = (item: DossierBonOption) =>
    `${item.prospectNom} ${item.nomCourt} ${item.numero}`.toLocaleLowerCase("fr").includes(clientQueryNormalized);
  const clientMatches = clientQueryNormalized ? dossiers.filter(matchesQuery) : [];

  useEffect(() => {
    if (!searchOpen) return;
    const close = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [searchOpen]);

  useEffect(() => {
    const nextSaved = selected?.contenu ?? null;
    const checks = checksFrom(nextSaved, selected);
    setForm(nextSaved ? draftFields(nextSaved) : draftFrom(selected));
    setLieu(checks.lieu);
    setQualite(checks.qualite);
    setReglement(checks.reglement);
    setFinancement(checks.financement);
    setLivraison(checks.livraison);
    setHorsEtablissement(checks.horsEtablissement);
    setBonStatut(selected?.bon?.statut ?? "");
    // Reload the blanks only when the linked proforma changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.factureId, selected?.bon?.statut]);

  const set = (key: keyof Draft) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const payload = (): BonCommandeContenu => ({
    ...form,
    lieu,
    qualite,
    reglement,
    financement,
    livraison,
    horsEtablissement,
    ...(documentTitle === "APPEL D'OFFRE" ? { documentKind: "APPEL_OFFRE" as const } : {}),
  });

  const openDossier = (id: string) => {
    router.push(validation ? `${basePath}?facture=${id}` : `${basePath}?dossier=${id}`);
  };

  const openClientMatch = (item: DossierBonOption) => {
    if (item.proformaCount === 0) return;
    setClientQuery(showProspectSearch ? item.nomCourt : item.prospectNom);
    setSearchOpen(false);
    openDossier(item.id);
  };

  const handleGenerate = async () => {
    if (!selected || selected.statut === "ANNULEE") return;
    setSaving(true);
    const result = await generateNextNumero(selected.factureId);
    if (!result.success || !result.data) {
      toast.error(`Le numéro du ${titreCourt.toLowerCase()} n'a pas pu être créé`);
      setSaving(false);
      return;
    }
    set("numero")(result.data.numero);
    const saved = await saveBonCommandeDocument(selected.factureId, { ...payload(), numero: result.data.numero });
    if (!saved.success) {
      toast.error(saved.error);
      setSaving(false);
      return;
    }
    if (documentTitle !== "BON DE COMMANDE") {
      if (selected.clientId) await updateClient(selected.clientId, { status_client: "CLIENT" });
      if (selected.clientEntrepriseId) {
        await updateClientEntreprise(selected.clientEntrepriseId, { status_client: "CLIENT" });
      }
    }
    toast.success(`${titreCourt} ${result.data.numero}`);
    router.refresh();
    setSaving(false);
  };

  const handleSave = async () => {
    if (!selected || selected.statut === "ANNULEE") return;
    setRecording(true);
    const result = await saveBonCommandeDocument(selected.factureId, payload());
    if (!result.success) {
      toast.error(result.error);
    } else {
      if (result.numero) set("numero")(result.numero);
      toast.success(`${titreCourt} enregistré`);
      router.refresh();
    }
    setRecording(false);
  };

  const marquerClient = async () => {
    if (documentTitle === "BON DE COMMANDE" || !selected) return;
    if (selected.clientId) await updateClient(selected.clientId, { status_client: "CLIENT" });
    if (selected.clientEntrepriseId) {
      await updateClientEntreprise(selected.clientEntrepriseId, { status_client: "CLIENT" });
    }
  };

  const handleSoumettre = async () => {
    if (!selected || selected.statut === "ANNULEE") return;
    setSubmitting(true);
    const result = await soumettreBonDeCommandeValidation(selected.factureId, payload());
    if (!result.success) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    if (result.numero) set("numero")(result.numero);
    setBonStatut("A_VALIDER");
    await marquerClient();
    toast.success("Bon envoyé au responsable commercial");
    router.refresh();
    setSubmitting(false);
  };

  const decide = async (action: () => Promise<{ success: boolean; error?: string }>, statut: string, message: string) => {
    if (!selected) return;
    setDeciding(true);
    const result = await action();
    if (!result.success) {
      toast.error(result.error || "La validation n'a pas abouti");
      setDeciding(false);
      return;
    }
    setBonStatut(statut);
    toast.success(message);
    if (validation) window.dispatchEvent(new Event("bons-a-valider-changed"));
    if (validation && documentTitle === "BON POUR ACCORD") {
      window.dispatchEvent(new Event("accords-a-valider-changed"));
    }
    if (validation) router.replace(`${basePath}?facture=${selected.factureId}`);
    router.refresh();
    setDeciding(false);
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      const result = await exportBonCommandeWordFile({
        ...form,
        lieu,
        qualite,
        reglement,
        financement,
        livraison,
        horsEtablissement,
        documentTitle,
      });
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
      toast.success(`${titreCourt} exporté en Word`);
    } catch (error) {
      console.error(error);
      toast.error("L'export Word a échoué");
    } finally {
      setExporting(false);
    }
  };

  const blankCommercialArchive =
    validatedArchive &&
    basePath.startsWith("/commercial/") &&
    (documentTitle === "BON POUR ACCORD" ||
      documentTitle === "LETTRE DE COMMANDE" ||
      documentTitle === "APPEL D'OFFRE");

  if (emptyText && (!source || !selected) && !blankCommercialArchive) {
    return (
      <div className="w-full min-w-0 px-3 py-4">
        <p className="rounded-2xl border border-dashed border-[#d7a441] bg-white px-4 py-8 text-sm text-[#6d5428]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
      <div className="bg-[#f6f1e6] w-full min-w-0 px-3 py-4 print:bg-white print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .paper {
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
            .brand {
              margin: 0;
              color: #111;
              font-size: 12pt;
              font-weight: 800;
              letter-spacing: 0.03em;
              line-height: 1;
            }
            .head {
              display: flex;
              align-items: flex-start;
              gap: 4mm;
            }
            .head-text { flex: 1; min-width: 0; }
            .logo {
              width: 24mm;
              height: auto;
              object-fit: contain;
              flex: none;
            }
            .tagline { margin: 1px 0 2mm; font-size: 10pt; font-style: italic; }
            .rule { border: 0; border-top: 2px solid #e7b84a; margin: 1.4mm 0 2.2mm; }
            .doc-title {
              margin: 0 0 2.2mm;
              text-align: center;
              color: #e36a12;
              font-size: 14pt;
              font-weight: 800;
              letter-spacing: 0.12em;
            }
            .bar {
              background: #111;
              color: #e7b84a;
              font-weight: 700;
              font-size: 10.5pt;
              letter-spacing: 0.03em;
              padding: 2.5px 8px;
              margin: 3.4mm 0 0;
            }
            table.doc {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            table.doc th, table.doc td {
              border: 1px solid #111;
              padding: 3.5px 6px;
              vertical-align: middle;
              font-weight: 400;
              overflow-wrap: anywhere;
            }
            table.doc th {
              background: #e7b84a;
              color: #111;
              font-weight: 700;
              text-align: center;
              font-size: 10pt;
            }
            td.lbl { font-weight: 600; }
            td.num { text-align: center; font-weight: 700; width: 8%; }
            td.static { font-weight: 700; }
            .note { margin: 1.4mm 0 0; font-size: 9.5pt; line-height: 1.4; }
            .lettres { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px; align-items: start; }
            .hint { display: block; margin-top: 1px; font-size: 8pt; font-weight: 400; color: #333; line-height: 1.25; }
            .ink {
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
            .ink::placeholder { color: #8b93a0; font-weight: 400; }
            .ink:hover { background: rgba(255, 236, 170, 0.45); }
            .ink:focus { background: #fff6d8; outline: 1px solid #e7b84a; }
            .blank {
              display: inline-block;
              width: 32mm;
              max-width: 100%;
              border: 0;
              border-bottom: 1px dotted #222;
              background: transparent;
              color: #111;
              font: inherit;
              font-weight: 600;
              line-height: 1.2;
              padding: 0 2px;
              vertical-align: baseline;
            }
            .blank:hover { background: rgba(255, 236, 170, 0.55); }
            .blank:focus { background: #fff6d8; outline: none; }
            .choice {
              display: inline-flex;
              align-items: flex-start;
              gap: 4px;
              margin: 0 8px 1px 0;
              border: 0;
              background: transparent;
              padding: 0;
              color: inherit;
              font: inherit;
              line-height: 1.3;
              text-align: left;
              cursor: pointer;
              vertical-align: middle;
            }
            .tick {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 12px;
              height: 12px;
              margin-top: 2px;
              border: 1.25px solid #111;
              background: #fff;
              font-size: 11px;
              font-weight: 800;
              line-height: 1;
              flex: none;
            }
            .paper.locked textarea,
            .paper.locked input,
            .paper.locked .choice { pointer-events: none; }
            .checks { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; }
            .pair { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 6px; align-items: center; }
            .sign { height: 32mm; vertical-align: top; }
            .sign p { margin: 0 0 2mm; font-size: 9.5pt; line-height: 1.3; }
            .foot {
              margin-top: auto;
              padding-top: 3mm;
              font-size: 8pt;
              line-height: 1.35;
              text-align: center;
            }
            .foot p { margin: 0; }
            .foot-row { display: flex; justify-content: space-between; gap: 8px; margin-top: 1mm; }
            @media print {
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
              body * { visibility: hidden; }
              #printable-area, #printable-area * { visibility: visible !important; }
              #printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                background: #fff !important;
              }
              .paper {
                box-shadow: none !important;
                margin: 0 !important;
                width: 210mm !important;
                max-width: 210mm !important;
                min-height: 297mm !important;
                break-after: page;
                page-break-after: always;
              }
              .paper:last-child { break-after: auto; page-break-after: auto; }
              .print-hide { display: none !important; }
              .ink, .ink:hover, .ink:focus, .blank, .blank:hover, .blank:focus {
                background: transparent !important;
                outline: none !important;
              }
              @page { size: A4; margin: 0; }
            }
          `,
        }}
      />

      {validatedArchive && dossiers.length > 0 && (
        <section className="print-hide mx-auto mb-3 max-w-[210mm]">
          <label htmlFor="bon-valide" className="mb-2 block text-base font-semibold text-[#111]">
            {documentTitle === "BON POUR ACCORD"
              ? "Choisir un bon pour accord"
              : documentTitle === "LETTRE DE COMMANDE"
                ? "Choisir une lettre de commande"
                : documentTitle === "APPEL D'OFFRE"
                  ? "Choisir un appel d'offre"
                  : "Choisir un bon validé"}
          </label>
          <select
            id="bon-valide"
            value={source?.dossier.id ?? ""}
            onChange={(event) => openDossier(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#ead7a2] bg-white px-3 text-sm text-[#111] outline-none focus:border-[#e36a12]"
          >
            {dossiers.map((item) => {
              const commercial = item.prospectNom.startsWith(`${item.nomCourt} · `)
                ? item.prospectNom.slice(item.nomCourt.length + 3)
                : "";
              return (
                <option key={item.id} value={item.id}>
                  {[item.nomCourt, commercial, item.numero].filter(Boolean).join(" · ")}
                </option>
              );
            })}
          </select>
        </section>
      )}

      {(showClientSearch || showProspectSearch) && (
        <div ref={searchRef} className="print-hide relative mx-auto mb-3 max-w-[210mm]">
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
      )}

      <div className="print-hide mx-auto mb-3 flex max-w-[210mm] flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!embedded && !validatedArchive && dossiers.length > 0 && (
            <select
              value={source?.dossier.id ?? ""}
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
          {source && source.proformas.length > 1 && !validation && (
            <select
              value={selected?.factureId ?? ""}
              onChange={(event) => {
                const facture = event.target.value;
                router.push(
                  embedded
                    ? `${dossierPath}/${source.dossier.id}?facture=${facture}`
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
          {validation && !blankCommercialArchive ? (
            dossiers.length === 0 ? (
              <Link href={basePath} className="text-sm font-semibold text-[#111] hover:underline">
                Retour à la liste
              </Link>
            ) : null
          ) : source && !embedded ? (
            <Link href={`${dossierPath}/${source.dossier.id}`} className="text-sm font-medium text-[#111] hover:underline">
              Dossier {source.dossier.numero}
            </Link>
          ) : null}
          {blankCommercialArchive ? (
            <p className="text-xs text-slate-600">
              {documentTitle === "LETTRE DE COMMANDE"
                ? "Lettres de commande déjà validées par le responsable commercial."
                : documentTitle === "APPEL D'OFFRE"
                  ? "Appels d'offre déjà validés par le responsable commercial."
                  : "Bons pour accord déjà validés par le responsable commercial."}
            </p>
          ) : !validatedArchive ? (
            <p className="text-xs text-slate-600">
              {validation
                ? "Consultez le bon, puis commencez la validation."
                : "Remplissez le document, puis imprimez-le tel qu'il est présenté."}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {validation ? (
            <>
              {bonStatut || !blankCommercialArchive ? (
                <span className="inline-flex h-9 items-center rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a]">
                  {labelStatutBon(bonStatut)}
                </span>
              ) : (
                <span className="inline-flex h-9 items-center rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a]">
                  Déjà Validé
                </span>
              )}
              {bonStatut === "A_VALIDER" && (
                <button
                  type="button"
                  onClick={() =>
                    decide(
                      () => commencerValidationBonDeCommande(selected!.factureId),
                      "EN_VALIDATION",
                      "Validation commencée",
                    )
                  }
                  disabled={!selected || deciding}
                  className="h-9 rounded-md bg-[#e36a12] px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {deciding ? "Validation…" : "Commencer la validation"}
                </button>
              )}
              {bonStatut === "EN_VALIDATION" && (
                <button
                  type="button"
                  onClick={() =>
                    decide(
                      () =>
                        documentTitle === "BON POUR ACCORD"
                          ? validerBonPourAccord(selected!.factureId)
                          : validerBonDeCommande(selected!.factureId),
                      "VALIDE",
                      `${titreCourt} validé`,
                    )
                  }
                  disabled={!selected || deciding}
                  className="h-9 rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a] disabled:opacity-50"
                >
                  {deciding ? "Validation…" : "Valider"}
                </button>
              )}
              {(bonStatut === "A_VALIDER" || bonStatut === "EN_VALIDATION") && (
                <button
                  type="button"
                  onClick={() =>
                    decide(() => marquerBonSousReserve(selected!.factureId), "SOUS_RESERVE", "Bon placé sous réserve")
                  }
                  disabled={!selected || deciding}
                  className="h-9 rounded-md border border-[#111] bg-white px-3 text-sm font-semibold text-[#111] disabled:opacity-50"
                >
                  Sous réserve
                </button>
              )}
            </>
          ) : (
            <>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selected || recording || selected?.statut === "ANNULEE"}
            className="h-9 rounded-md border border-[#111] bg-white px-3 text-sm font-semibold text-[#111] disabled:opacity-50"
          >
            {recording ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selected || Boolean(form.numero) || saving || selected?.statut === "ANNULEE"}
            className="h-9 rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a] disabled:opacity-50"
          >
            {form.numero ? "Bon établi" : "Établir le bon"}
          </button>
          <button
            type="button"
            onClick={handleSoumettre}
            disabled={
              !selected ||
              submitting ||
              selected.statut === "ANNULEE" ||
              ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE", "VALIDE", "VALIDE_APPORT_INITIAL", "ANNULE"].includes(bonStatut)
            }
            className="h-9 rounded-md bg-[#e36a12] px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting
              ? "Envoi…"
              : ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE", "VALIDE", "VALIDE_APPORT_INITIAL", "ANNULE"].includes(bonStatut)
                ? labelStatutBon(bonStatut)
                : "Faire Valider"}
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

      <div id="printable-area" className="mx-auto flex w-full min-w-0 max-w-[210mm] flex-col gap-4 print:max-w-none print:gap-0">
        <article className={`paper shadow-lg print:shadow-none${validation ? " locked" : ""}`}>
          <header className="head">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo d'impression, taille fixée en mm */}
            <img src="/logo.png" alt="Kpandji Automobiles" className="logo" />
            <div className="head-text">
              <h1 className="brand">KPANDJI AUTOMOBILES</h1>
              <p className="tagline">Constructeur automobile ivoirien</p>
              <TextLine value={form.siege} onChange={set("siege")} />
              <TextLine value={form.banque} onChange={set("banque")} />
            </div>
          </header>
          <hr className="rule" />
          <h2 className="doc-title">{documentTitle}</h2>

          <table className="doc">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>{titreCourt} n°</th>
                <th style={{ width: "16%" }}>Date</th>
                <th style={{ width: "32%" }}>Lieu de signature</th>
                <th>Conseiller commercial</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <TextLine value={form.numero} onChange={set("numero")} placeholder="BC-" />
                </td>
                <td>
                  <TextLine value={form.date} onChange={set("date")} align="center" placeholder="…… / …… / ……" />
                </td>
                <td>
                  <div className="checks">
                    <Choice on={lieu === "showroom"} onClick={() => pick(lieu, "showroom", setLieu)}>Showroom</Choice>
                    <Choice on={lieu === "salon"} onClick={() => pick(lieu, "salon", setLieu)}>Salon / foire</Choice>
                    <Choice on={lieu === "client"} onClick={() => pick(lieu, "client", setLieu)}>Chez le client</Choice>
                    <Choice on={lieu === "distance"} onClick={() => pick(lieu, "distance", setLieu)}>À distance</Choice>
                  </div>
                </td>
                <td>
                  <div className="pair">
                    <span>Nom :</span>
                    <TextLine value={form.conseillerNom} onChange={set("conseillerNom")} />
                    <span>Matricule :</span>
                    <TextLine value={form.matricule} onChange={set("matricule")} />
                    <span>Tél. :</span>
                    <TextLine value={form.conseillerTel} onChange={set("conseillerTel")} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="bar">1. LE CLIENT</div>
          <table className="doc">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Rubrique</th>
                <th>Particulier</th>
                <th>Entreprise / administration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="lbl">Identité</td>
                <td>
                  <div className="pair">
                    <span>Nom et prénoms :</span>
                    <TextLine value={form.nomParticulier} onChange={set("nomParticulier")} />
                  </div>
                </td>
                <td>
                  <div className="pair">
                    <span>Dénomination et forme :</span>
                    <TextLine value={form.denomination} onChange={set("denomination")} />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="lbl">Pièce / immatriculation</td>
                <td>
                  <div className="pair">
                    <span>CNI ou passeport n° :</span>
                    <TextLine value={form.cni} onChange={set("cni")} />
                  </div>
                </td>
                <td>
                  <div className="pair" style={{ gridTemplateColumns: "auto minmax(0,1fr) auto minmax(0,1fr)" }}>
                    <span>RCCM :</span>
                    <TextLine value={form.rccm} onChange={set("rccm")} />
                    <span>NCC :</span>
                    <TextLine value={form.ncc} onChange={set("ncc")} />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="lbl">Représentant</td>
                <td>—</td>
                <td>
                  <div className="pair">
                    <span>Nom, qualité, pouvoir :</span>
                    <TextLine value={form.representant} onChange={set("representant")} />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="lbl">Adresse</td>
                <td><TextLine value={form.adresseParticulier} onChange={set("adresseParticulier")} /></td>
                <td><TextLine value={form.adresseEntreprise} onChange={set("adresseEntreprise")} /></td>
              </tr>
              <tr>
                <td className="lbl">Téléphone / e-mail</td>
                <td><TextLine value={form.contactParticulier} onChange={set("contactParticulier")} /></td>
                <td><TextLine value={form.contactEntreprise} onChange={set("contactEntreprise")} /></td>
              </tr>
              <tr>
                <td className="lbl">Nom à porter sur la carte grise</td>
                <td><TextLine value={form.carteParticulier} onChange={set("carteParticulier")} /></td>
                <td><TextLine value={form.carteEntreprise} onChange={set("carteEntreprise")} /></td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            Qualité de l&apos;acheteur :{" "}
            <Choice on={qualite === "consommateur"} onClick={() => pick(qualite, "consommateur", setQualite)}>
              Consommateur (usage personnel)
            </Choice>
            <Choice on={qualite === "professionnel"} onClick={() => pick(qualite, "professionnel", setQualite)}>
              Professionnel (usage lié à son activité)
            </Choice>
            Cette case détermine les articles des CGV applicables.
          </p>

          <div className="bar">2. LE VÉHICULE COMMANDÉ</div>
          <table className="doc">
            <tbody>
              <tr>
                <td className="lbl" style={{ width: "24%" }}>Marque</td>
                <td className="static" style={{ width: "26%" }}>KPANDJI</td>
                <td className="lbl" style={{ width: "24%" }}>Modèle / version</td>
                <td><TextLine value={form.modele} onChange={set("modele")} /></td>
              </tr>
              <tr>
                <td className="lbl">Carrosserie / places</td>
                <td><TextLine value={form.carrosserie} onChange={set("carrosserie")} /></td>
                <td className="lbl">Motorisation / énergie / boîte</td>
                <td><TextLine value={form.motorisation} onChange={set("motorisation")} /></td>
              </tr>
              <tr>
                <td className="lbl">Puissance administrative</td>
                <td>
                  <div className="pair" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <TextLine value={form.cv} onChange={set("cv")} />
                    <span>CV</span>
                  </div>
                </td>
                <td className="lbl">Couleur ext. / sellerie</td>
                <td><TextLine value={form.couleur} onChange={set("couleur")} /></td>
              </tr>
              <tr>
                <td className="lbl">Année-modèle</td>
                <td><TextLine value={form.annee} onChange={set("annee")} /></td>
                <td className="lbl">N° de réception / homologation</td>
                <td><TextLine value={form.homologation} onChange={set("homologation")} /></td>
              </tr>
              <tr>
                <td className="lbl">Quantité</td>
                <td><TextLine value={form.quantite} onChange={set("quantite")} /></td>
                <td className="lbl">N° de châssis (VIN)</td>
                <td>
                  <TextLine value={form.vin} onChange={set("vin")} />
                  <span className="hint">À renseigner à l&apos;affectation, au plus tard à la livraison</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            Le véhicule est neuf, assemblé en Côte d&apos;Ivoire dans les ateliers Kpandji et fabriqué spécifiquement pour la présente commande.
          </p>

          <div className="bar">3. OPTIONS, ACCESSOIRES ET PRESTATIONS</div>
          <table className="doc">
            <thead>
              <tr>
                <th style={{ width: "7%" }}>N°</th>
                <th>Désignation</th>
                <th style={{ width: "10%" }}>Qté</th>
                <th style={{ width: "20%" }}>Prix unitaire HT (FCFA)</th>
                <th style={{ width: "20%" }}>Montant HT (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num">1</td>
                <td><TextLine value={form.opt1} onChange={set("opt1")} /></td>
                <td><TextLine value={form.qte1} onChange={set("qte1")} align="center" /></td>
                <td><TextLine value={form.pu1} onChange={set("pu1")} align="right" /></td>
                <td><TextLine value={form.mt1} onChange={set("mt1")} align="right" /></td>
              </tr>
              <tr>
                <td className="num">2</td>
                <td><TextLine value={form.opt2} onChange={set("opt2")} /></td>
                <td><TextLine value={form.qte2} onChange={set("qte2")} align="center" /></td>
                <td><TextLine value={form.pu2} onChange={set("pu2")} align="right" /></td>
                <td><TextLine value={form.mt2} onChange={set("mt2")} align="right" /></td>
              </tr>
              <tr>
                <td className="num">5</td>
                <td>Livraison hors Abidjan, si demandée</td>
                <td><TextLine value={form.livQte} onChange={set("livQte")} align="center" /></td>
                <td><TextLine value={form.livPu} onChange={set("livPu")} align="right" /></td>
                <td><TextLine value={form.livMt} onChange={set("livMt")} align="right" /></td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            Toute option ou tout aménagement qui ne figure pas dans ce tableau n&apos;est pas dû par Kpandji Automobiles.
          </p>
          <Foot page={1} label={titreCourt} />
        </article>

        <article className={`paper shadow-lg print:shadow-none${validation ? " locked" : ""}`}>
          <div className="bar" style={{ marginTop: 0 }}>5. PRIX</div>
          <table className="doc">
            <thead>
              <tr>
                <th>Élément</th>
                <th style={{ width: "34%" }}>Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Prix du véhicule HT</td>
                <td><TextLine value={form.vehiculeHt} onChange={set("vehiculeHt")} align="right" /></td>
              </tr>
              <tr>
                <td>Options, accessoires et prestations HT</td>
                <td><TextLine value={form.optionsHt} onChange={set("optionsHt")} align="right" /></td>
              </tr>
              <tr>
                <td>
                  Remise commerciale : <Blank value={form.remisePct} onChange={set("remisePct")} width="16mm" /> %
                </td>
                <td><TextLine value={form.remiseMontant} onChange={set("remiseMontant")} align="right" placeholder="—" /></td>
              </tr>
              <tr>
                <td className="lbl">Total HT</td>
                <td><TextLine value={form.totalHt} onChange={set("totalHt")} align="right" /></td>
              </tr>
              <tr>
                <td>TVA 18 % (ou mention d&apos;exonération et référence de l&apos;attestation)</td>
                <td><TextLine value={form.tva} onChange={set("tva")} align="right" /></td>
              </tr>
              <tr>
                <td className="lbl">Prix total TTC</td>
                <td><TextLine value={form.totalTtc} onChange={set("totalTtc")} align="right" /></td>
              </tr>
              <tr>
                <td className="lbl">Net à payer</td>
                <td><TextLine value={form.net} onChange={set("net")} align="right" /></td>
              </tr>
            </tbody>
          </table>
          <p className="note lettres">
            <span>Prix total TTC en lettres :</span>
            <TextLine value={form.lettres} onChange={set("lettres")} />
            <span>francs CFA.</span>
          </p>
          <p className="note">Ce prix est ferme et définitif jusqu&apos;à la date limite de livraison indiquée au point 7.</p>

          <div className="bar">6. ÉCHÉANCIER DE RÈGLEMENT</div>
          <table className="doc">
            <thead>
              <tr>
                <th style={{ width: "16%" }}>Échéance</th>
                <th>Fait générateur</th>
                <th style={{ width: "14%" }}>Part du prix TTC</th>
                <th style={{ width: "18%" }}>Montant (FCFA)</th>
                <th style={{ width: "14%" }}>Reçu n°</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Acompte n° 1</td>
                <td>Signature du bon de commande</td>
                <td style={{ textAlign: "center" }}>30 %</td>
                <td><TextLine value={form.acompte1} onChange={set("acompte1")} align="right" /></td>
                <td><TextLine value={form.recu1} onChange={set("recu1")} /></td>
              </tr>
              <tr>
                <td>Acompte n° 2</td>
                <td>Avis écrit de mise en assemblage, avec n° de châssis</td>
                <td style={{ textAlign: "center" }}>40 %</td>
                <td><TextLine value={form.acompte2} onChange={set("acompte2")} align="right" /></td>
                <td><TextLine value={form.recu2} onChange={set("recu2")} /></td>
              </tr>
              <tr>
                <td>Solde</td>
                <td>Avis de mise à disposition, avant remise des clés</td>
                <td style={{ textAlign: "center" }}>30 %</td>
                <td><TextLine value={form.solde} onChange={set("solde")} align="right" /></td>
                <td><TextLine value={form.recuSolde} onChange={set("recuSolde")} /></td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            Les sommes versées à la commande sont des acomptes et non des arrhes : la commande est ferme pour les deux parties.
          </p>
          <p className="note">
            Mode de règlement :{" "}
            <Choice on={reglement === "virement"} onClick={() => pick(reglement, "virement", setReglement)}>Virement</Choice>
            <Choice on={reglement === "cheque"} onClick={() => pick(reglement, "cheque", setReglement)}>Chèque certifié ou de banque</Choice>
            <Choice on={reglement === "mobile"} onClick={() => pick(reglement, "mobile", setReglement)}>Mobile money (compte marchand Kpandji)</Choice>
            <Choice on={reglement === "especes"} onClick={() => pick(reglement, "especes", setReglement)}>Espèces à la caisse du siège, dans la limite réglementaire</Choice>
          </p>
          <p className="note">
            Tout paiement se fait exclusivement au nom de Kpandji Automobiles SARL et donne lieu à un reçu numéroté émis par la caisse.
          </p>
          <p className="note">
            Financement :{" "}
            <Choice on={financement === "comptant"} onClick={() => pick(financement, "comptant", setFinancement)}>Comptant</Choice>
            <Choice on={financement === "credit"} onClick={() => pick(financement, "credit", setFinancement)}>Crédit ou crédit-bail auprès de</Choice>
            <Blank value={form.organisme} onChange={set("organisme")} width="42mm" />
            {" "}pour un montant de <Blank value={form.montantFinance} onChange={set("montantFinance")} width="28mm" /> FCFA.
            En cas de financement, la commande est conclue sous condition suspensive de l&apos;accord de l&apos;établissement, à obtenir avant le{" "}
            <Blank value={form.dateAccord} onChange={set("dateAccord")} width="28mm" />.
          </p>

          <div className="bar">7. LIVRAISON</div>
          <table className="doc">
            <tbody>
              <tr>
                <td className="lbl" style={{ width: "34%" }}>Date limite de livraison</td>
                <td>
                  <Blank value={form.dateLivraison} onChange={set("dateLivraison")} width="32mm" />
                  {" "}date ferme, calculée à partir de l&apos;encaissement de l&apos;acompte n° 1
                </td>
              </tr>
              <tr>
                <td className="lbl">Lieu de livraison</td>
                <td>
                  <Choice on={livraison === "site"} onClick={() => pick(livraison, "site", setLivraison)}>
                    Site Kpandji, Riviéra Palmerais
                  </Choice>
                  <Choice on={livraison === "autre"} onClick={() => pick(livraison, "autre", setLivraison)}>Autre :</Choice>
                  <Blank value={form.autreLieu} onChange={set("autreLieu")} width="48mm" /> aux frais du client
                </td>
              </tr>
              <tr>
                <td className="lbl">Personne habilitée à réceptionner</td>
                <td>
                  Nom : <Blank value={form.receptionnaire} onChange={set("receptionnaire")} width="48mm" />
                  {" "}Pièce d&apos;identité n° : <Blank value={form.pieceReception} onChange={set("pieceReception")} width="36mm" />
                </td>
              </tr>
              <tr>
                <td className="lbl">Garantie constructeur</td>
                <td>3 ans ou 100 000 km, premier terme échu, à compter de la livraison ; elle s&apos;ajoute aux garanties légales</td>
              </tr>
              <tr>
                <td className="lbl">Documents remis</td>
                <td>Facture définitive, bordereau de livraison, carnet de garantie et d&apos;entretien, manuel, double des clés</td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            La date limite est reportée d&apos;autant de jours que le client a de retard dans le paiement d&apos;une échéance.
          </p>

          <div className="bar">8. ACCEPTATION</div>
          <p className="note">
            Le client reconnaît avoir reçu, lu et accepté les conditions générales de vente annexées au présent bon de commande, dont il a paraphé chaque page, ainsi que la fiche descriptive du véhicule.
          </p>
          <p className="note">
            <Choice on={horsEtablissement} onClick={() => setHorsEtablissement((value) => !value)}>
              Commande signée hors établissement ou à distance : le client consommateur dispose du délai de rétractation prévu à l&apos;article 2.4 des CGV ; le formulaire de rétractation lui a été remis.
            </Choice>
          </p>
          <p className="note">
            Fait à <Blank value={form.faitA} onChange={set("faitA")} width="36mm" />, le{" "}
            <Blank value={form.faitLe} onChange={set("faitLe")} width="32mm" />, en deux exemplaires originaux.
          </p>
          <table className="doc" style={{ marginTop: "2mm" }}>
            <thead>
              <tr>
                <th>Le client</th>
                <th>Pour Kpandji Automobiles SARL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sign">
                  <p>Nom, signature précédée de la mention manuscrite « Lu et approuvé, bon pour commande »</p>
                  <TextLine value={form.signatureClient} onChange={set("signatureClient")} />
                </td>
                <td className="sign">
                  <p>Le conseiller commercial (nom et signature) :</p>
                  <TextLine value={form.signatureConseiller} onChange={set("signatureConseiller")} />
                  <p style={{ marginTop: "6mm" }}>Validation de la direction (nom, signature, cachet) :</p>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            La commande n&apos;engage Kpandji Automobiles qu&apos;après validation de la direction et encaissement de l&apos;acompte n° 1.
          </p>
          <Foot page={2} label={titreCourt} />
        </article>
      </div>
    </div>
  );
}
