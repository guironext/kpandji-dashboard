import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  normalizeReport,
  type StructuredReport,
} from "@/lib/assistante/rapport-structured";

function tryStructured(rapportSerialized: string): StructuredReport | null {
  if (!rapportSerialized.trim()) return null;
  try {
    return normalizeReport(JSON.parse(rapportSerialized));
  } catch {
    return null;
  }
}

function p(
  text: string,
  opts?: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] }
) {
  return new Paragraph({
    heading: opts?.heading,
    children: [new TextRun(text)],
  });
}

function buildFromStructured(
  s: StructuredReport,
  meta: { titre: string; dateLabel: string; lieuAgenda?: string | null }
): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: meta.titre, bold: true, size: 32 })],
    }),
    p(`Date : ${meta.dateLabel}`),
  ];
  if (meta.lieuAgenda) out.push(p(`Lieu (agenda) : ${meta.lieuAgenda}`));
  out.push(
    p("En-tête", { heading: HeadingLevel.HEADING_1 }),
    p(`Lieu : ${s.header.lieu || "—"}`),
    p(`Organisateur : ${s.header.organisateur || "—"}`),
    p(`Rédacteur : ${s.header.redacteur || "—"}`),
    p("Objectif", { heading: HeadingLevel.HEADING_1 }),
    p(`Contexte : ${s.objectif.contexte || "—"}`),
    p(`But principal : ${s.objectif.butPrincipal || "—"}`),
    p("Participants", { heading: HeadingLevel.HEADING_1 })
  );
  s.participants.presents.forEach((x, i) => {
    out.push(p(`Présent ${i + 1} : ${x}`));
  });
  s.participants.absents.forEach((x, i) => {
    out.push(
      p(
        `Absent ${i + 1} : ${x.name}${x.excused ? " (excusé)" : ""}`
      )
    );
  });
  if (!s.participants.presents.length && !s.participants.absents.length) {
    out.push(p("— Aucun nom saisi —"));
  }
  out.push(
    p("Ordre du jour", { heading: HeadingLevel.HEADING_1 })
  );
  s.ordreDuJour.forEach((o, i) => {
    out.push(p(`${i + 1}. ${o.titre}`));
  });
  if (!s.ordreDuJour.length) out.push(p("—"));
  out.push(
    p("Déroulement", { heading: HeadingLevel.HEADING_1 })
  );
  s.deroulement.forEach((d, i) => {
    out.push(
      p(`${i + 1}. ${d.titre || "Point"}`),
      p(`Résumé : ${d.resume || "—"}`),
      p(`Problèmes : ${d.problemes || "—"}`),
      p(`Propositions : ${d.propositions || "—"}`)
    );
  });
  if (!s.deroulement.length) out.push(p("—"));
  out.push(p("Décisions", { heading: HeadingLevel.HEADING_1 }));
  s.decisions.forEach((d, i) => out.push(p(`${i + 1}. ${d}`)));
  if (!s.decisions.length) out.push(p("—"));
  out.push(p("Actions à mener", { heading: HeadingLevel.HEADING_1 }));
  s.actions.forEach((a, i) => {
    out.push(
      p(
        `${i + 1}. ${a.action} — ${a.responsable}${a.echeance ? ` — ${a.echeance}` : ""}`
      )
    );
  });
  if (!s.actions.length) out.push(p("—"));
  out.push(
    p("Difficultés", { heading: HeadingLevel.HEADING_1 }),
    p(`Problèmes : ${s.difficultes.problemes || "—"}`),
    p(`Risques : ${s.difficultes.risques || "—"}`),
    p("Prochaines étapes", { heading: HeadingLevel.HEADING_1 }),
    p(`Actions futures : ${s.prochainesEtapes.actionsFutures || "—"}`),
    p(`Date prochaine : ${s.prochainesEtapes.dateProchaine || "—"}`),
    p("Conclusion", { heading: HeadingLevel.HEADING_1 }),
    p(`Résumé : ${s.conclusion.resume || "—"}`),
    p(`Impression : ${s.conclusion.impression || "—"}`),
    p(`Importance : ${s.conclusion.importance || "—"}`)
  );
  return out;
}

export async function exportRapportActiviteToWord(input: {
  titre: string;
  date: string;
  startTime: string;
  endTime: string;
  lieuAgenda?: string | null;
  rapportSerialized: string;
}): Promise<void> {
  let dateLabel: string;
  try {
    dateLabel = format(parseISO(input.date), "d MMMM yyyy", { locale: fr });
  } catch {
    dateLabel = input.date;
  }
  const dateTimeLabel = `${dateLabel} — ${input.startTime} – ${input.endTime}`;

  const structured = tryStructured(input.rapportSerialized);
  const children: Paragraph[] = structured
    ? buildFromStructured(structured, {
        titre: input.titre,
        dateLabel: dateTimeLabel,
        lieuAgenda: input.lieuAgenda,
      })
    : [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: input.titre, bold: true, size: 32 })],
        }),
        p(`Date : ${dateTimeLabel}`),
        ...(input.lieuAgenda
          ? [p(`Lieu (agenda) : ${input.lieuAgenda}`)]
          : []),
        p("Contenu (texte libre)", { heading: HeadingLevel.HEADING_1 }),
        p(input.rapportSerialized.trim() || "— (vide) —"),
      ];

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const safe = input.titre.replace(/[^\w\u00C0-\u024f-]+/g, "_").slice(0, 60);
  saveAs(
    blob,
    `Rapport_activite_${safe || "export"}_${format(new Date(), "yyyy-MM-dd")}.docx`
  );
}
