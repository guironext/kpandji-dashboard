import { formatNumberWithSpaces } from "@/lib/utils";
import { toNum } from "@/lib/sav/savFactureLines";

export type RapportMaintenanceVoiture = {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  motorisation: string;
  transmission: string;
  nbr_portes: string;
  statut: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  ClientSAV: {
    nom: string;
    prenom: string;
    contact: string;
    email: string | null;
    entreprise: string | null;
  };
  Reparation: Array<{
    id: string;
    categorie_reparation: string;
    detail_reparation: string | null;
    horaire_travail_prix: unknown;
    horaire_travail_duration: string | null;
    statut: string;
    createdAt: string | Date;
    DetailDiagnostic: Array<{
      id: string;
      nom: string;
      description: string | null;
      prix_unitaire: unknown;
      catergorieDiagnostic: { id: string; nom: string } | null;
    }>;
    PieceSAV: Array<{
      id: string;
      nom: string;
      part_code: string | null;
      prix_vente: unknown;
      quantiteSortieDetail: number;
    }>;
    Maintenance: Array<{
      id: string;
      nom: string;
      description: string | null;
      duree_maintenance: string | null;
      prix_maintenance: unknown;
      statut: string;
      catergorieDiagnostic: { id: string; nom: string } | null;
    }>;
  }>;
  diagnosticArrivee: Array<{
    id: string;
    catergorieDiagnostic: { nom: string } | null;
    DetailDiagnostic: Array<{ nom: string }>;
  }>;
  VisuelDefaut: Array<{
    id: string;
    nom: string;
    description: string | null;
  }>;
};

export type AutoReportSection = {
  title: string;
  lines: string[];
};

export function buildAutoReportSections(
  voiture: RapportMaintenanceVoiture,
): AutoReportSection[] {
  const sections: AutoReportSection[] = [];
  const client = voiture.ClientSAV;

  sections.push({
    title: "Informations client",
    lines: [
      `Client : ${client.prenom} ${client.nom}`.trim(),
      client.entreprise ? `Entreprise : ${client.entreprise}` : "",
      `Contact : ${client.contact}`,
      client.email ? `Email : ${client.email}` : "",
    ].filter(Boolean),
  });

  sections.push({
    title: "Véhicule",
    lines: [
      `Modèle : ${voiture.model}`,
      `Immatriculation : ${voiture.immatriculation}`,
      `Couleur : ${voiture.couleur}`,
      `Motorisation : ${voiture.motorisation}`,
      `Transmission : ${voiture.transmission}`,
      `Portes : ${voiture.nbr_portes}`,
      `Statut dossier : Terminé`,
    ],
  });

  if (voiture.diagnosticArrivee.length > 0) {
    const diagLines = voiture.diagnosticArrivee.flatMap((da) => {
      const cat = da.catergorieDiagnostic?.nom ?? "Diagnostic";
      const details = da.DetailDiagnostic.map((d) => `  • ${cat} — ${d.nom}`);
      return details.length > 0 ? details : [`  • ${cat}`];
    });
    sections.push({
      title: "Diagnostic à l'arrivée",
      lines: diagLines,
    });
  }

  if (voiture.VisuelDefaut.length > 0) {
    sections.push({
      title: "Défauts visuels constatés",
      lines: voiture.VisuelDefaut.map((v) =>
        v.description ? `${v.nom} — ${v.description}` : v.nom,
      ),
    });
  }

  for (const rep of voiture.Reparation) {
    const repLines: string[] = [
      `Catégorie : ${rep.categorie_reparation}`,
      `Statut réparation : ${rep.statut}`,
    ];
    if (rep.detail_reparation) {
      repLines.push("Détails :");
      rep.detail_reparation.split("\n").forEach((l) => {
        if (l.trim()) repLines.push(`  ${l.trim()}`);
      });
    }

    const byCat = new Map<string, typeof rep.DetailDiagnostic>();
    for (const d of rep.DetailDiagnostic) {
      const cat = d.catergorieDiagnostic?.nom ?? "Autre";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(d);
    }
    if (byCat.size > 0) {
      repLines.push("Interventions :");
      for (const [cat, details] of byCat) {
        for (const d of details) {
          const pu = toNum(d.prix_unitaire);
          const priceStr =
            pu > 0 ? ` (${formatNumberWithSpaces(pu)} FCFA)` : "";
          repLines.push(`  • ${cat} — ${d.nom}${priceStr}`);
        }
      }
    }

    if (rep.PieceSAV.length > 0) {
      repLines.push("Pièces utilisées :");
      for (const p of rep.PieceSAV) {
        const q = p.quantiteSortieDetail ?? 0;
        const pv = toNum(p.prix_vente);
        const ref = p.part_code ? ` [${p.part_code}]` : "";
        repLines.push(
          `  • ${p.nom}${ref} × ${q}${pv > 0 ? ` — ${formatNumberWithSpaces(pv * q)} FCFA` : ""}`,
        );
      }
    }

    if (rep.Maintenance.length > 0) {
      repLines.push("Main d'œuvre / maintenance :");
      for (const m of rep.Maintenance) {
        const cat = m.catergorieDiagnostic?.nom;
        const duree = m.duree_maintenance?.trim();
        const prix = toNum(m.prix_maintenance);
        const parts = [m.nom];
        if (cat) parts.push(`(${cat})`);
        if (duree) parts.push(`— ${duree}`);
        if (prix > 0) parts.push(`— ${formatNumberWithSpaces(prix)} FCFA`);
        parts.push(`[${m.statut}]`);
        repLines.push(`  • ${parts.join(" ")}`);
      }
    }

    const hp = toNum(rep.horaire_travail_prix);
    const hd = rep.horaire_travail_duration?.trim();
    if (hp > 0 || hd) {
      repLines.push(
        `Total main d'œuvre réparation : ${hd ?? "—"}${hp > 0 ? ` — ${formatNumberWithSpaces(hp)} FCFA` : ""}`,
      );
    }

    sections.push({
      title: `Réparation (${new Date(rep.createdAt).toLocaleDateString("fr-FR")})`,
      lines: repLines,
    });
  }

  if (voiture.Reparation.length === 0) {
    sections.push({
      title: "Réparations",
      lines: ["Aucune réparation enregistrée pour ce véhicule."],
    });
  }

  return sections;
}

export function buildAutoReportPlainText(
  voiture: RapportMaintenanceVoiture,
): string {
  const sections = buildAutoReportSections(voiture);
  const header = [
    "RAPPORT DE MAINTENANCE — SYNTHÈSE AUTOMATIQUE",
    `Véhicule : ${voiture.model} (${voiture.immatriculation})`,
    `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
    "",
  ];
  const body = sections.flatMap((s) => [
    `--- ${s.title} ---`,
    ...s.lines,
    "",
  ]);
  return [...header, ...body].join("\n");
}
