import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  type IBorderOptions,
} from "docx";
import { readFile } from "fs/promises";
import path from "path";
import type { ContratVenteContenu } from "@/lib/contrat-vente-document";

const FONT = "Calibri";
const BLACK = "111111";
const ORANGE = "E36A12";
const GOLD = "E7B84A";
const SIZE = 21;

const none: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const page = {
  size: { width: 11906, height: 16838 },
  margin: { top: 560, bottom: 560, left: 680, right: 680 },
};

function text(value: string, opts?: { bold?: boolean; size?: number; color?: string; italics?: boolean }) {
  return new TextRun({
    text: value,
    bold: opts?.bold,
    italics: opts?.italics,
    size: opts?.size ?? SIZE,
    font: FONT,
    color: opts?.color ?? BLACK,
  });
}

function line(
  children: TextRun[],
  opts?: { after?: number; before?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] },
) {
  return new Paragraph({
    alignment: opts?.align,
    spacing: { before: opts?.before ?? 40, after: opts?.after ?? 40 },
    children,
  });
}

function bar(title: string) {
  return new Paragraph({
    shading: { fill: BLACK },
    spacing: { before: 160, after: 80 },
    border: { top: none, bottom: none, left: none, right: none },
    children: [text(title, { bold: true, size: 21, color: GOLD })],
  });
}

function field(label: string, value: string, after?: string) {
  return line(
    [text(label), text(value ? ` ${value}` : " ……………………", { bold: true }), ...(after ? [text(` ${after}`)] : [])],
    { before: 20, after: 20 },
  );
}

function footer(pageNumber: 1 | 2) {
  return new Footer({
    children: [
      line(
        [
          text(
            "KPANDJI AUTOMOBILES SARL — RCCM : CI-ABJ-03-2022-B13-00710 — CC : 2213233 — Siège : Cocody Riviéra Palmerais, Abidjan — Tél. : +225 07 07 20 16 54",
            { size: 14 },
          ),
        ],
        { align: AlignmentType.CENTER, before: 80, after: 0 },
      ),
      line(
        [
          text(
            `Contrat de vente et d'assemblage de véhicule — Page ${pageNumber} / 2          Paraphes : Client …………    Kpandji …………`,
            { size: 14 },
          ),
        ],
        { align: AlignmentType.CENTER, before: 0, after: 0 },
      ),
    ],
  });
}

export async function exportContratVenteWord(input: ContratVenteContenu) {
  let logo: Paragraph | null = null;
  try {
    const data = await readFile(path.join(process.cwd(), "public/logo.png"));
    logo = new Paragraph({
      spacing: { after: 80 },
      children: [
        new ImageRun({
          type: "png",
          data,
          transformation: { width: 78, height: 86 },
          altText: { title: "Kpandji Automobiles", description: "Logo Kpandji Automobiles", name: "logo" },
        }),
      ],
    });
  } catch {
    logo = null;
  }

  const pct = input.pourcentageAcompte || "40";
  const reste = String(Math.max(0, 100 - (Number(pct.replace(",", ".")) || 0))).replace(".", ",");

  const page1: Paragraph[] = [
    ...(logo ? [logo] : []),
    line([text("KPANDJI AUTOMOBILES", { bold: true, size: 24 })], { before: 0, after: 0 }),
    line([text("Constructeur automobile ivoirien", { italics: true, size: 18 })], { before: 0, after: 40 }),
    ...input.siege.split("\n").map((row) => line([text(row, { size: 16 })], { before: 0, after: 0 })),
    line([text(input.banque, { size: 16 })], { before: 40, after: 40 }),
    line([text("CONTRAT DE VENTE ET D'ASSEMBLAGE DE VÉHICULE", { bold: true, size: 28, color: ORANGE })], {
      align: AlignmentType.CENTER,
      before: 80,
      after: 0,
    }),
    line([text("(Soumis aux Conditions Générales de Vente)", { italics: true, size: 18 })], {
      align: AlignmentType.CENTER,
      before: 0,
      after: 40,
    }),
    bar("ENTRE LES SOUSSIGNÉS :"),
    bar("1. LE VENDEUR (CONSTRUCTEUR)"),
    field("Raison Sociale / Nom :", input.raison),
    field("Registre du Commerce (RCCM) :", input.rccm),
    field("Adresse / Téléphone :", input.adresseVendeur),
    bar("2. L'ACHETEUR (LE CLIENT)"),
    field("Nom & Prénoms :", input.acheteur),
    field("N° de Pièce d'Identité :", input.piece),
    field("Adresse / Téléphone :", input.adresseAcheteur),
    bar("IL A ÉTÉ ARRÊTÉ ET CONVENU CE QUI SUIT :"),
    bar("Article 1 : Objet du contrat & Caractéristiques du véhicule"),
    line(
      [
        text(
          "Le Vendeur s'engage à assembler, construire et livrer à l'Acheteur qui l'accepte, le véhicule neuf de sa propre fabrication selon les spécifications techniques suivantes :",
        ),
      ],
      { before: 40, after: 40 },
    ),
    field("Marque / Constructeur :", input.marque),
    field("Modèle / Type :", input.modele),
    field("Genre / Carrosserie :", input.genre),
    field("Énergie / Carburant :", input.energie),
    field("Puissance Fiscale :", input.puissance),
    field("Couleur extérieure :", input.couleur),
    line([text("☐  État de livraison : Neuf (Sortie d'Usine)")], { before: 20, after: 40 }),
    bar("Article 2 : Prix et Modalités de règlement"),
    line([text("La présente vente est consentie au prix total et forfaitaire de :")], { before: 40, after: 20 }),
    field("Montant global :", input.montant, "F CFA"),
    line(
      [
        text(
          "En cas de paiement échelonné par tranche sollicité par l'Acheteur, le règlement s'effectue obligatoirement selon le calendrier strict ci-dessous :",
        ),
      ],
      { before: 40, after: 20 },
    ),
    field(`Acompte initial minimum de ${pct} % (dû à la commande) :`, input.acompte, "F CFA"),
    line([text("Le versement de cet acompte valide la")], { before: 40, after: 0 }),
  ];

  const page2: Paragraph[] = [
    line(
      [
        text(
          "commande et déclenche immédiatement les opérations d'assemblage et de construction du véhicule au sein des ateliers du Vendeur.",
        ),
      ],
      { before: 0, after: 20 },
    ),
    field(`Solde de ${reste} % restant dû (au plus tard à la livraison) :`, input.solde, "F CFA"),
    line(
      [
        text(
          "Le solde est payable de manière échelonnée durant la fabrication, au plus tard le jour de la mise à disposition effective du véhicule achevé. Aucun véhicule ne sera mis en possession du client avant paiement intégral.",
        ),
      ],
      { before: 40, after: 40 },
    ),
    bar("Article 3 : Délais de livraison et Force majeure"),
    line(
      [
        text("Délai d'exécution : ", { bold: true }),
        text(
          "Le Vendeur s'engage à achever l'assemblage, la construction et à mettre le véhicule commandé à la disposition de l'Acheteur dans un délai maximal de cent vingt (90) jours calendaires. Ce délai court de plein droit à compter du lendemain de la réalisation cumulative des deux conditions suivantes :",
        ),
      ],
      { before: 40, after: 40 },
    ),
    line([text("☐  Le respect et l'effectivité des versements requis à la commande ;")], { before: 20, after: 20 }),
    line([text("☐  La levée de la condition mentionnée dans les CGV")], { before: 20, after: 40 }),
    bar("Article 4 : Approbation des Conditions Générales de Vente (CGV)"),
    line(
      [
        text(
          "L'Acheteur déclare expressément avoir reçu, pris connaissance et approuvé sans réserve l'intégralité des Conditions Générales de Vente (CGV) annexées au présent contrat, lesquelles régissent les détails administratifs, les modalités de livraison, la réserve de propriété et le règlement des litiges.",
        ),
      ],
      { before: 40, after: 40 },
    ),
    line(
      [text("Par la signature des présentes, les parties valident l'accord sur l'objet, le prix et les exclusions de garantie.")],
      { before: 20, after: 80 },
    ),
    line(
      [
        text("Fait à "),
        text(input.faitA || "………………", { bold: true }),
        text(", le "),
        text(input.faitLe || "…… / …… / ……", { bold: true }),
        text(", en trois (3) exemplaires originaux."),
      ],
      { before: 40, after: 200 },
    ),
    line([text("Le Vendeur (Constructeur)", { bold: true, color: GOLD })], { before: 80, after: 0 }),
    line([text("(\"Lu et approuvé\" + Signature)")], { before: 0, after: 200 }),
    line([text("L'Acheteur (Le Client)", { bold: true, color: GOLD })], { before: 80, after: 0 }),
    line([text("(\"Lu et approuvé\" + Signature)")], { before: 0, after: 0 }),
  ];

  const doc = new Document({
    creator: "Kpandji Automobiles",
    title: "Contrat de vente et d'assemblage de véhicule",
    description: "Contrat de vente et d'assemblage de véhicule",
    sections: [
      { properties: { page }, footers: { default: footer(1) }, children: page1 },
      { properties: { page }, footers: { default: footer(2) }, children: page2 },
    ],
  });

  return Packer.toBuffer(doc);
}
