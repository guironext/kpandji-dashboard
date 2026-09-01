"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Car,
  Download,
  FileText,
  Loader2,
  Printer,
  ShieldCheck,
} from "lucide-react";
import {
  buildAutoReportPlainText,
  buildAutoReportSections,
  garantieStatutLabel,
  type RapportMaintenanceVoiture,
} from "@/lib/sav/rapportMaintenanceSummary";

type RapportComplementaire = {
  id: string;
  titre: string;
  contenu: string | null;
  observations: string | null;
  createdAt: string;
};

type PublicRapport = RapportMaintenanceVoiture & {
  chassisNumber?: string | null;
  image?: string | null;
  RapportMaintenanceSAV?: RapportComplementaire[];
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function RapportSavPublicClient({ token }: { token: string }) {
  const [voiture, setVoiture] = useState<PublicRapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/sav-rapport/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Rapport introuvable");
      }
      setVoiture(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(
    () => (voiture ? buildAutoReportSections(voiture) : []),
    [voiture],
  );

  const handleDownloadTxt = () => {
    if (!voiture) return;
    const text = buildAutoReportPlainText(voiture);
    const extras = (voiture.RapportMaintenanceSAV ?? [])
      .map((r) => {
        const parts = [`\n--- ${r.titre} (${formatDate(r.createdAt)}) ---`];
        if (r.contenu) parts.push(r.contenu);
        if (r.observations) parts.push(`Observations : ${r.observations}`);
        return parts.join("\n");
      })
      .join("\n");
    const blob = new Blob([text + extras], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-sav-${voiture.immatriculation || voiture.model}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-slate-50 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Chargement du rapport…</p>
      </div>
    );
  }

  if (error || !voiture) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <FileText className="h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-800">Rapport indisponible</p>
        <p className="max-w-sm text-sm text-slate-500">
          {error || "Ce lien n’est plus valide."}
        </p>
      </div>
    );
  }

  const client = voiture.ClientSAV;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 via-white to-slate-50">
      <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-teal-700 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-100">
              KPANDJI — Service après-vente
            </p>
            <h1 className="text-lg font-bold text-white">Rapport SAV</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleDownloadTxt}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Télécharger
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-white text-emerald-800 hover:bg-emerald-50"
              onClick={() => window.print()}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </header>

      <main
        id="rapport-print"
        className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 sm:py-8"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {voiture.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voiture.image}
              alt={voiture.model}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center bg-slate-100">
              <Car className="h-14 w-14 text-slate-300" />
            </div>
          )}
          <div className="space-y-1 px-4 py-4 sm:px-5">
            <h2 className="text-xl font-bold text-slate-900">{voiture.model}</h2>
            <p className="font-mono text-sm font-semibold text-slate-600">
              {voiture.immatriculation || "—"}
            </p>
            <p className="text-sm text-slate-500">
              {client ? `${client.prenom} ${client.nom}`.trim() : "Client"}
            </p>
            <p className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-rose-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              {garantieStatutLabel(voiture.StatutGarantie)}
            </p>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {section.title}
              </h3>
              <ul className="space-y-1 text-sm leading-relaxed text-slate-600">
                {section.lines.map((line, i) => (
                  <li key={`${section.title}-${i}`} className="whitespace-pre-wrap">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {(voiture.RapportMaintenanceSAV?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Rapports complémentaires
            </h3>
            {voiture.RapportMaintenanceSAV!.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="font-semibold text-slate-900">{r.titre}</p>
                <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                {r.contenu ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {r.contenu}
                  </p>
                ) : null}
                {r.observations ? (
                  <p className="mt-2 text-xs italic text-slate-500">
                    Observations : {r.observations}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        <p className="text-center text-[11px] text-slate-400 print:block">
          KPANDJI Automobiles — Rapport SAV généré le {formatDate(new Date())}
        </p>
      </main>
    </div>
  );
}
