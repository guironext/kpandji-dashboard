"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  HandCoins,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createDecaissement,
  deleteOwnDecaissement,
  effectuerDecaissement,
  getComptableDecaissements,
  getCurrentDecaissementIdentity,
  updateOwnDecaissement,
  type DecaissementItem,
} from "@/lib/actions/decaissement";

const decaissementSchema = z.object({
  demandeur: z.string().trim().min(1, "Le demandeur est requis"),
  service: z.string().trim().optional(),
  departement: z.string().trim().min(1, "Le département est requis"),
  raison: z.string().trim().min(1, "La raison est requise"),
  montant: z.string().trim().min(1, "Le montant est requis"),
});

type DecaissementFormData = z.infer<typeof decaissementSchema>;

const emptyValues: DecaissementFormData = {
  demandeur: "",
  service: "",
  departement: "",
  raison: "",
  montant: "",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMontantFcfa(value: string | null | undefined) {
  if (!value?.trim()) return "—";
  const cleaned = value.replace(/f\s*cfa|fcfa|xaf|cfa|francs?/gi, "").trim();
  const compact = cleaned.replace(/\s/g, "");
  let normalized = compact;
  if (/^\d{1,3}(\.\d{3})+$/.test(compact)) {
    normalized = compact.replace(/\./g, "");
  } else if (compact.includes(",") && compact.includes(".")) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = compact.replace(",", ".");
  }
  const numeric = normalized.replace(/[^\d.-]/g, "");
  if (!numeric || numeric === "-" || numeric === ".") return escapeHtml(value.trim());
  const amount = Number(numeric);
  if (!Number.isFinite(amount)) return escapeHtml(value.trim());
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${formatted} F CFA`;
}

function printCopyMarkup(
  demande: DecaissementItem,
  date: string,
  logo: string,
  label: string
) {
  const ref = escapeHtml(demande.id.slice(0, 8).toUpperCase());
  const validation = demande.validationDepartement ? "Validé" : "En attente";
  const validationClass = demande.validationDepartement ? "ok" : "wait";
  const done = demande.decaissementEffectues ? "Effectué" : "Non effectué";
  const doneClass = demande.decaissementEffectues ? "ok" : "wait";

  return `<section class="copy">
    <article class="voucher">
      <div class="bar"></div>
      <header class="head">
        <img src="${logo}" alt="KPANDJI AUTOMOBILES" />
        <div class="brand">
          <h1>KPANDJI AUTOMOBILES</h1>
          <p>Constructeur et Assembleur Automobile</p>
        </div>
        <div class="refbox">
          <span class="badge">${escapeHtml(label)}</span>
          <strong>N° ${ref}</strong>
          <span>${escapeHtml(date)}</span>
        </div>
      </header>
      <h2>Demande de décaissement</h2>
      <div class="facts">
        <div><span>Demandeur</span><strong>${escapeHtml(demande.demandeur)}</strong></div>
        <div><span>Service</span><strong>${escapeHtml(demande.service || "—")}</strong></div>
        <div><span>Département</span><strong>${escapeHtml(demande.departement)}</strong></div>
      </div>
      <div class="motif">
        <span>Raison de la demande</span>
        <p>${escapeHtml(demande.raison)}</p>
      </div>
      <div class="money">
        <div>
          <span>Montant demandé</span>
          <strong>${formatMontantFcfa(demande.montant)}</strong>
        </div>
        <div class="paid">
          <span>Montant décaissé</span>
          <strong>${formatMontantFcfa(demande.montantDecaisse)}</strong>
        </div>
      </div>
      <div class="flags">
        <p>Validation département <b class="${validationClass}">${validation}</b></p>
        <p>Décaissement <b class="${doneClass}">${done}</b></p>
      </div>
      <div class="signs">
        <div class="well"><span>Demandeur</span><i></i><small>Signature</small></div>
        <div class="well"><span>Département</span><i></i><small>Visa</small></div>
        <div class="well"><span>Comptabilité</span><i></i><small>Visa</small></div>
      </div>
      <footer>Abidjan, Cocody – Riviéra Palmerais · +225 01 01 04 77 03 · info@kpandji.com</footer>
    </article>
  </section>`;
}

function printDecaissement(demande: DecaissementItem) {
  const date = format(new Date(demande.createdAt), "d MMMM yyyy", {
    locale: fr,
  });
  const logo = `${window.location.origin}/logo.png`;
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Demande de décaissement</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; overflow: hidden; }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12mm;
      page-break-after: avoid;
      break-after: avoid;
    }
    .copy {
      width: 100%;
      flex: 1 1 0;
      min-height: 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .voucher {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 0.6mm solid #000;
      background: #fff;
    }
    .bar { height: 2.4mm; background: linear-gradient(90deg, #6b3e26 0%, #c9a227 55%, #e8c547 100%); }
    .head { display: flex; align-items: center; gap: 3mm; padding: 2.4mm 4mm 2mm; }
    .head img { height: 13mm; width: auto; }
    .brand { min-width: 0; flex: 1; }
    h1 { margin: 0; font-size: 13px; letter-spacing: 0.04em; font-weight: 800; color: #000; }
    .brand p { margin: 0.6mm 0 0; font-size: 8px; color: #000; font-weight: 700; letter-spacing: 0.01em; }
    .refbox { text-align: right; line-height: 1.35; }
    .badge {
      display: inline-block;
      margin-bottom: 0.6mm;
      padding: 0.4mm 2mm;
      background: #1c1917;
      color: #fff;
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .refbox strong { display: block; font-size: 11px; letter-spacing: 0.04em; color: #000; font-weight: 800; }
    .refbox span:last-child { font-size: 8.5px; color: #000; font-weight: 700; }
    h2 {
      margin: 0;
      padding: 1.6mm 4mm;
      background: #f3f4f6;
      border-top: 0.45mm solid #000;
      border-bottom: 0.45mm solid #000;
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #000;
    }
    .facts { display: grid; grid-template-columns: 1.2fr 0.9fr 1.1fr; gap: 2mm; padding: 2.6mm 4mm 0; }
    .facts div, .money div {
      border: 0.45mm solid #000;
      padding: 1.5mm 2.2mm 1.6mm;
      min-width: 0;
    }
    .facts span, .motif span, .money span, .well span {
      display: block;
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #000;
    }
    .facts strong { display: block; margin-top: 0.6mm; font-size: 11px; line-height: 1.25; font-weight: 800; color: #000; }
    .motif {
      margin: 2.2mm 4mm 0;
      padding: 1.6mm 2.4mm 1.8mm;
      background: #f3f4f6;
      border-left: 1.6mm solid #000;
    }
    .motif p {
      margin: 0.7mm 0 0;
      font-size: 10.5px;
      font-weight: 700;
      line-height: 1.35;
      color: #000;
      max-height: 10.5mm;
      overflow: hidden;
    }
    .money { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; padding: 2.2mm 4mm 0; }
    .money strong { display: block; margin-top: 0.5mm; font-size: 14px; font-weight: 800; letter-spacing: 0.01em; color: #000; }
    .money .paid { background: #fff4cc; border-color: #000; }
    .flags { display: flex; gap: 6mm; padding: 2mm 4mm 0; font-size: 9.5px; font-weight: 700; color: #000; }
    .flags p { margin: 0; }
    .flags b { margin-left: 1.5mm; font-size: 9.5px; }
    .flags .ok { color: #14532d; }
    .flags .wait { color: #9a3412; }
    .signs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2.2mm; flex: 1; min-height: 22mm; margin-top: 2.4mm; padding: 0 4mm; }
    .well {
      height: 100%;
      min-height: 22mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      border: 0.45mm solid #000;
      padding: 1.4mm 2mm 1.3mm;
    }
    .well i { display: block; border-top: 0.55mm solid #000; margin: 0 0 0.8mm; }
    .well small { font-size: 7.5px; color: #000; font-weight: 700; }
    footer {
      margin-top: 2mm;
      padding: 1.4mm 4mm 1.8mm;
      border-top: 0.45mm solid #000;
      text-align: center;
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #000;
    }
    .cut {
      width: 100%;
      height: 10mm;
      flex: 0 0 10mm;
      display: flex;
      align-items: center;
      gap: 3mm;
      color: #000;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .cut::before, .cut::after { content: ""; flex: 1; border-top: 0.5mm dashed #000; }
  </style>
</head>
<body>
  <div class="page">
    ${printCopyMarkup(demande, date, logo, "Exemplaire demandeur")}
    <div class="cut">Découper</div>
    ${printCopyMarkup(demande, date, logo, "Exemplaire comptabilité")}
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "Impression demande de décaissement";
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument;
  if (!frameWindow || !frameDocument) {
    iframe.remove();
    toast.error("Impossible de préparer l'impression.");
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  let started = false;
  const trigger = () => {
    if (started) return;
    started = true;
    frameWindow.focus();
    frameWindow.print();
    frameWindow.addEventListener("afterprint", () => iframe.remove(), {
      once: true,
    });
    window.setTimeout(() => iframe.remove(), 60_000);
  };

  const logoImages = [...frameDocument.querySelectorAll("img")];
  const pendingLogos = logoImages.filter((image) => !image.complete);
  if (pendingLogos.length > 0) {
    let remaining = pendingLogos.length;
    const ready = () => {
      remaining -= 1;
      if (remaining <= 0) window.setTimeout(trigger, 50);
    };
    pendingLogos.forEach((image) => {
      image.addEventListener("load", ready, { once: true });
      image.addEventListener("error", ready, { once: true });
    });
  }

  window.setTimeout(trigger, 400);
}

function DecaissementCard({
  demande,
  own,
  effectuant,
  onEdit,
  onDelete,
  onEffectuer,
  onPrint,
}: {
  demande: DecaissementItem;
  own: boolean;
  effectuant: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onEffectuer: () => void;
  onPrint: () => void;
}) {
  const dateLabel = format(new Date(demande.createdAt), "d MMM yyyy", {
    locale: fr,
  });

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            {demande.demandeur}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {demande.departement}
              {demande.service ? ` · ${demande.service}` : ""}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
          {own ? (
            <Badge className="border-transparent bg-teal-100 text-teal-800">
              Ma demande
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Montant demandé
            </p>
            <p className="mt-1 break-words text-2xl font-bold tabular-nums text-slate-900">
              {demande.montant}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
          {demande.raison}
        </p>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Validation département
            </p>
            <div className="mt-1.5">
              {demande.validationDepartement ? (
                <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                  Validé
                </Badge>
              ) : (
                <Badge className="border-transparent bg-amber-100 text-amber-800">
                  En attente
                </Badge>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Décaissement
            </p>
            <div className="mt-1.5">
              {demande.decaissementEffectues ? (
                <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                  Effectué
                </Badge>
              ) : (
                <Badge className="border-transparent bg-slate-200 text-slate-600">
                  Non effectué
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80">
            Montant décaissé
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-950">
            {demande.montantDecaisse || "—"}
          </p>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
        {own ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-11 justify-center bg-white text-slate-700"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-11 justify-center bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={demande.decaissementEffectues || effectuant}
          onClick={onEffectuer}
          className="h-11 justify-center bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:text-emerald-600"
        >
          <BadgeCheck className="h-4 w-4" />
          {demande.decaissementEffectues ? "Décaissé" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="h-11 justify-center bg-white text-slate-700"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>
    </article>
  );
}

export default function ComptableDemandeDeDecaissementPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [demandes, setDemandes] = useState<DecaissementItem[]>([]);
  const [identity, setIdentity] = useState({ demandeur: "", departement: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DecaissementItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [pendingEffectuer, setPendingEffectuer] =
    useState<DecaissementItem | null>(null);
  const [montantDecaisse, setMontantDecaisse] = useState("");
  const [effectuant, setEffectuant] = useState(false);

  const form = useForm<DecaissementFormData>({
    resolver: zodResolver(decaissementSchema),
    defaultValues: emptyValues,
  });

  const blankForm = useCallback(
    (): DecaissementFormData => ({
      ...emptyValues,
      demandeur: identity.demandeur,
      departement: identity.departement,
    }),
    [identity]
  );

  const isOwn = useCallback(
    (demande: DecaissementItem) =>
      identity.demandeur.trim().length > 0 &&
      demande.demandeur.trim().toLowerCase() ===
        identity.demandeur.trim().toLowerCase(),
    [identity.demandeur]
  );

  const loadDemandes = useCallback(async () => {
    const result = await getComptableDecaissements();
    if (result.success) {
      setDemandes(result.data);
      if (result.demandeur) {
        setIdentity((current) =>
          current.demandeur ? current : { ...current, demandeur: result.demandeur }
        );
      }
    } else {
      toast.error(result.error || "Erreur lors du chargement des demandes");
    }
  }, []);

  useEffect(() => {
    loadDemandes().finally(() => setLoading(false));
  }, [loadDemandes]);

  useEffect(() => {
    getCurrentDecaissementIdentity().then((result) => {
      if (!result.success) return;
      setIdentity({
        demandeur: result.demandeur,
        departement: result.departement,
      });
      form.setValue("demandeur", result.demandeur);
      form.setValue("departement", result.departement);
    });
  }, [form]);

  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    form.reset(blankForm());
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset(blankForm());
    setOpen(true);
  };

  const openEdit = (demande: DecaissementItem) => {
    if (!isOwn(demande)) return;
    setEditingId(demande.id);
    form.reset({
      demandeur: demande.demandeur,
      service: demande.service ?? "",
      departement: demande.departement,
      raison: demande.raison,
      montant: demande.montant,
    });
    setOpen(true);
  };

  const onSubmit = async (data: DecaissementFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        const result = await updateOwnDecaissement(editingId, {
          service: data.service,
          raison: data.raison,
          montant: data.montant,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || "Impossible de modifier la demande");
          return;
        }

        setDemandes((current) =>
          current.map((item) =>
            item.id === result.data!.id ? result.data! : item
          )
        );
        closeForm();
        toast.success("Demande modifiée");
        return;
      }

      const result = await createDecaissement({
        demandeur: data.demandeur,
        service: data.service,
        departement: data.departement,
        raison: data.raison,
        montant: data.montant,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Impossible d'enregistrer la demande");
        return;
      }

      setDemandes((current) => [result.data!, ...current]);
      closeForm();
      toast.success("Demande de décaissement enregistrée");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const result = await deleteOwnDecaissement(pendingDelete.id);
      if (!result.success) {
        toast.error(result.error || "Impossible de supprimer la demande");
        return;
      }
      setDemandes((current) =>
        current.filter((item) => item.id !== pendingDelete.id)
      );
      if (editingId === pendingDelete.id) closeForm();
      setPendingDelete(null);
      toast.success("Demande supprimée");
    } finally {
      setDeleting(false);
    }
  };

  const openEffectuer = (demande: DecaissementItem) => {
    if (demande.decaissementEffectues) return;
    setPendingEffectuer(demande);
    setMontantDecaisse(demande.montantDecaisse || demande.montant);
  };

  const confirmEffectuer = async () => {
    if (!pendingEffectuer) return;
    const amount = montantDecaisse.trim();
    if (!amount) {
      toast.error("Le montant décaissé est requis");
      return;
    }
    setEffectuant(true);
    try {
      const result = await effectuerDecaissement(pendingEffectuer.id, amount);
      if (!result.success || !result.data) {
        toast.error(result.error || "Impossible de valider le décaissement");
        return;
      }
      setDemandes((current) =>
        current.map((item) =>
          item.id === result.data!.id ? result.data! : item
        )
      );
      setPendingEffectuer(null);
      toast.success("Décaissement effectué");
    } finally {
      setEffectuant(false);
    }
  };

  const validatedCount = demandes.filter(
    (item) => item.validationDepartement
  ).length;
  const doneCount = demandes.filter(
    (item) => item.decaissementEffectues
  ).length;
  const ownCount = demandes.filter((item) => isOwn(item)).length;

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_42%,_#f1f5f9_100%)]">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-5 shadow-lg shadow-emerald-900/10 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 rounded-2xl border border-white/30 bg-white/15 p-2.5 backdrop-blur-md sm:p-3">
                <HandCoins className="h-7 w-7 text-white sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-4xl">
                  Demandes de décaissement
                </h1>
                <p className="mt-1.5 text-sm text-emerald-50/95 sm:text-base">
                  Créez une demande, puis suivez les validations département et
                  les décaissements effectués
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={openCreate}
              className="h-12 w-full border-0 bg-white font-semibold text-emerald-900 shadow-lg hover:bg-emerald-50 sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Demande décaissement
            </Button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 lg:grid-cols-4">
          {[
            { label: "Demandes", value: loading ? "—" : demandes.length },
            { label: "Validées", value: loading ? "—" : validatedCount },
            { label: "Décaissées", value: loading ? "—" : doneCount },
            { label: "Les miennes", value: loading ? "—" : ownCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm sm:px-4 sm:py-4"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-5 sm:mt-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Demandes créées
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Validées par le département, et celles que vous avez créées
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-emerald-800 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des demandes...
            </div>
          ) : demandes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-5 py-14 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <HandCoins className="h-6 w-6" />
              </div>
              <p className="font-medium text-slate-800">
                Aucune demande pour le moment
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Les demandes validées par le département et les vôtres
                apparaîtront ici.
              </p>
              <Button
                type="button"
                onClick={openCreate}
                className="mt-5 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Demande décaissement
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {demandes.map((demande) => (
                <DecaissementCard
                  key={demande.id}
                  demande={demande}
                  own={isOwn(demande)}
                  effectuant={effectuant}
                  onEdit={() => openEdit(demande)}
                  onDelete={() => setPendingDelete(demande)}
                  onEffectuer={() => openEffectuer(demande)}
                  onPrint={() => printDecaissement(demande)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeForm();
        }}
      >
        <DialogContent className="z-[80] max-h-[min(92vh,44rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la demande" : "Demande décaissement"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Mettez à jour le service, la raison et le montant."
                : "Renseignez la demande. Elle sera enregistrée en attente de validation du département."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="demandeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom demandeur</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        placeholder="Nom du demandeur"
                        className="bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <Input placeholder="Service (optionnel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Département</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        placeholder="Rôle de l'utilisateur"
                        className="bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="raison"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Motif de la demande"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex. 150 000 FCFA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editingId ? "Enregistrer les modifications" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="z-[80] max-h-[min(92vh,40rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette demande ?</DialogTitle>
            <DialogDescription>
              La demande de {pendingDelete?.demandeur || "cet utilisateur"}{" "}
              pour {pendingDelete?.montant || "ce montant"} sera définitivement
              supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingEffectuer !== null}
        onOpenChange={(next) => {
          if (!next && !effectuant) setPendingEffectuer(null);
        }}
      >
        <DialogContent className="z-[80] max-h-[min(92vh,40rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Valider le décaissement</DialogTitle>
            <DialogDescription>
              Le décaissement de{" "}
              {pendingEffectuer?.demandeur || "ce demandeur"} sera marqué comme
              effectué.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="montant-decaisse"
              className="text-sm font-medium text-slate-800"
            >
              Montant décaissé
            </label>
            <Input
              id="montant-decaisse"
              value={montantDecaisse}
              onChange={(event) => setMontantDecaisse(event.target.value)}
              placeholder="Montant décaissé"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingEffectuer(null)}
              disabled={effectuant}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={confirmEffectuer}
              disabled={effectuant}
            >
              {effectuant ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
