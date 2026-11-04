import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeightRule,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type IBorderOptions,
} from "docx";
import { readFile } from "fs/promises";
import path from "path";

import type { BonCommandeContenu } from "@/lib/bon-commande-document";

export type { BonCommandeContenu as BonCommandeWordInput };

const FONT = "Calibri";
const BLACK = "111111";
const ORANGE = "E36A12";
const GOLD = "E7B84A";
const HEAD = "E7B84A";
const SIZE = 18;
const SIZE_SM = 16;

const thin: IBorderOptions = { style: BorderStyle.SINGLE, size: 4, color: "111111" };
const none: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const boxed = { top: thin, bottom: thin, left: thin, right: thin };
const open = { top: none, bottom: none, left: none, right: none };

const page = {
  size: { width: 11906, height: 16838 },
  margin: { top: 500, bottom: 560, left: 560, right: 560 },
};

function text(value: string, opts?: { bold?: boolean; size?: number; color?: string; italics?: boolean }) {
  return new TextRun({
    text: value,
    bold: opts?.bold,
    italics: opts?.italics,
    size: opts?.size ?? SIZE,
    font: FONT,
    color: opts?.color,
  });
}

function line(children: TextRun[], opts?: { after?: number; before?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new Paragraph({
    alignment: opts?.align,
    spacing: { before: opts?.before ?? 20, after: opts?.after ?? 20 },
    children,
  });
}

function box(on: boolean) {
  return on ? "☑" : "☐";
}

function cell(
  children: Paragraph[],
  opts?: { width?: number; fill?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; span?: number },
) {
  return new TableCell({
    borders: boxed,
    columnSpan: opts?.span,
    width: opts?.width != null ? { size: `${opts.width}%`, type: WidthType.PERCENTAGE } : undefined,
    shading: opts?.fill ? { fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
    children,
  });
}

function plain(value: string, opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number }) {
  return line([text(value, { bold: opts?.bold, size: opts?.size ?? SIZE })], { align: opts?.align, before: 0, after: 0 });
}

function t(rows: TableRow[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function row(cells: TableCell[], height?: number) {
  return new TableRow({
    cantSplit: true,
    height: height ? { value: height, rule: HeightRule.ATLEAST } : undefined,
    children: cells,
  });
}

function head(labels: string[], widths: number[]) {
  return row(
    labels.map((label, index) =>
      cell([plain(label, { bold: true, align: AlignmentType.CENTER, size: SIZE_SM })], {
        width: widths[index],
        fill: HEAD,
      }),
    ),
  );
}

function bar(title: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            borders: open,
            shading: { fill: BLACK },
            margins: { top: 30, bottom: 30, left: 80, right: 80 },
            children: [line([text(title, { bold: true, size: 20, color: GOLD })], { before: 0, after: 0 })],
          }),
        ],
      }),
    ],
  });
}

function footer(pageNumber: 1 | 2, titreCourt: string) {
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
        [text(`${titreCourt} véhicule neuf — Page ${pageNumber} / 2          Paraphes : Client …………    Kpandji …………`, { size: 14 })],
        { align: AlignmentType.CENTER, before: 0, after: 0 },
      ),
    ],
  });
}

function choice(on: boolean, label: string) {
  return text(`${box(on)} ${label}   `);
}

export async function exportBonCommandeWord(input: BonCommandeContenu & { documentTitle?: string }) {
  const documentTitle =
    input.documentTitle === "BON POUR ACCORD"
      ? "BON POUR ACCORD"
      : input.documentTitle === "LETTRE DE COMMANDE"
        ? "LETTRE DE COMMANDE"
        : input.documentTitle === "APPEL D'OFFRE"
          ? "APPEL D'OFFRE"
          : "BON DE COMMANDE";
  const titreCourt =
    documentTitle === "BON POUR ACCORD"
      ? "Bon pour accord"
      : documentTitle === "LETTRE DE COMMANDE"
        ? "Lettre de commande"
        : documentTitle === "APPEL D'OFFRE"
          ? "Appel d'offre"
          : "Bon de commande";
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

  const page1: Array<Paragraph | Table> = [
    ...(logo ? [logo] : []),
    line([text("KPANDJI AUTOMOBILES", { bold: true, size: 24, color: BLACK })], { before: 0, after: 0 }),
    line([text("Constructeur automobile ivoirien", { italics: true, size: 18 })], { before: 0, after: 40 }),
    line([text(input.siege, { size: SIZE_SM })], { before: 0, after: 0 }),
    line([text(input.banque, { size: SIZE_SM })], { before: 0, after: 60 }),
    line([text(documentTitle, { bold: true, size: 28, color: ORANGE })], {
      align: AlignmentType.CENTER,
      before: 80,
      after: 80,
    }),
    t([
      head([`${titreCourt} n°`, "Date", "Lieu de signature", "Conseiller commercial"], [22, 16, 32, 30]),
      row([
        cell([plain(input.numero || "BC-")], { width: 22 }),
        cell([plain(input.date || "…… / …… / ……", { align: AlignmentType.CENTER })], { width: 16 }),
        cell(
          [
            line([choice(input.lieu === "showroom", "Showroom"), choice(input.lieu === "salon", "Salon / foire")], { before: 0, after: 0 }),
            line([choice(input.lieu === "client", "Chez le client"), choice(input.lieu === "distance", "À distance")], { before: 0, after: 0 }),
          ],
          { width: 32 },
        ),
        cell(
          [
            line([text("Nom : ", { bold: true, size: SIZE_SM }), text(input.conseillerNom, { size: SIZE_SM })], { before: 0, after: 0 }),
            line([text("Matricule : ", { bold: true, size: SIZE_SM }), text(input.matricule, { size: SIZE_SM })], { before: 0, after: 0 }),
            line([text("Tél. : ", { bold: true, size: SIZE_SM }), text(input.conseillerTel, { size: SIZE_SM })], { before: 0, after: 0 }),
          ],
          { width: 30 },
        ),
      ]),
    ]),
    bar("1. LE CLIENT"),
    t([
      head(["Rubrique", "Particulier", "Entreprise / administration"], [24, 38, 38]),
      row([
        cell([plain("Identité", { bold: true })], { width: 24 }),
        cell([line([text("Nom et prénoms : ", { bold: true, size: SIZE_SM }), text(input.nomParticulier)], { before: 0, after: 0 })], { width: 38 }),
        cell([line([text("Dénomination et forme : ", { bold: true, size: SIZE_SM }), text(input.denomination)], { before: 0, after: 0 })], { width: 38 }),
      ]),
      row([
        cell([plain("Pièce / immatriculation", { bold: true })]),
        cell([line([text("CNI ou passeport n° : ", { bold: true, size: SIZE_SM }), text(input.cni)], { before: 0, after: 0 })]),
        cell([
          line(
            [
              text("RCCM : ", { bold: true, size: SIZE_SM }),
              text(input.rccm),
              text("    NCC : ", { bold: true, size: SIZE_SM }),
              text(input.ncc),
            ],
            { before: 0, after: 0 },
          ),
        ]),
      ]),
      row([
        cell([plain("Représentant", { bold: true })]),
        cell([plain("—")]),
        cell([line([text("Nom, qualité, pouvoir : ", { bold: true, size: SIZE_SM }), text(input.representant)], { before: 0, after: 0 })]),
      ]),
      row([
        cell([plain("Adresse", { bold: true })]),
        cell([plain(input.adresseParticulier)]),
        cell([plain(input.adresseEntreprise)]),
      ]),
      row([
        cell([plain("Téléphone / e-mail", { bold: true })]),
        cell([plain(input.contactParticulier)]),
        cell([plain(input.contactEntreprise)]),
      ]),
      row([
        cell([plain("Nom à porter sur la carte grise", { bold: true })]),
        cell([plain(input.carteParticulier)]),
        cell([plain(input.carteEntreprise)]),
      ]),
    ]),
    line(
      [
        text("Qualité de l'acheteur : ", { size: SIZE_SM }),
        choice(input.qualite === "consommateur", "Consommateur (usage personnel)"),
        choice(input.qualite === "professionnel", "Professionnel (usage lié à son activité)"),
        text("Cette case détermine les articles des CGV applicables.", { size: SIZE_SM }),
      ],
      { before: 60, after: 40 },
    ),
    bar("2. LE VÉHICULE COMMANDÉ"),
    t([
      row([
        cell([plain("Marque", { bold: true })], { width: 24 }),
        cell([plain("KPANDJI", { bold: true })], { width: 26 }),
        cell([plain("Modèle / version", { bold: true })], { width: 24 }),
        cell([plain(input.modele)], { width: 26 }),
      ]),
      row([
        cell([plain("Carrosserie / places", { bold: true })]),
        cell([plain(input.carrosserie)]),
        cell([plain("Motorisation / énergie / boîte", { bold: true })]),
        cell([plain(input.motorisation)]),
      ]),
      row([
        cell([plain("Puissance administrative", { bold: true })]),
        cell([plain(input.cv ? `${input.cv} CV` : "CV")]),
        cell([plain("Couleur ext. / sellerie", { bold: true })]),
        cell([plain(input.couleur)]),
      ]),
      row([
        cell([plain("Année-modèle", { bold: true })]),
        cell([plain(input.annee)]),
        cell([plain("N° de réception / homologation", { bold: true })]),
        cell([plain(input.homologation)]),
      ]),
      row([
        cell([plain("Quantité", { bold: true })]),
        cell([plain(input.quantite)]),
        cell([plain("N° de châssis (VIN)", { bold: true })]),
        cell([
          plain(input.vin),
          line([text("À renseigner à l'affectation, au plus tard à la livraison", { size: 14 })], { before: 20, after: 0 }),
        ]),
      ]),
    ]),
    line(
      [text("Le véhicule est neuf, assemblé en Côte d'Ivoire dans les ateliers Kpandji et fabriqué spécifiquement pour la présente commande.", { size: SIZE_SM })],
      { before: 60, after: 40 },
    ),
    bar("3. OPTIONS, ACCESSOIRES ET PRESTATIONS"),
    t([
      head(["N°", "Désignation", "Qté", "Prix unitaire HT (FCFA)", "Montant HT (FCFA)"], [7, 43, 10, 20, 20]),
      row([
        cell([plain("1", { align: AlignmentType.CENTER, bold: true })], { width: 7 }),
        cell([plain(input.opt1)], { width: 43 }),
        cell([plain(input.qte1, { align: AlignmentType.CENTER })], { width: 10 }),
        cell([plain(input.pu1, { align: AlignmentType.RIGHT })], { width: 20 }),
        cell([plain(input.mt1, { align: AlignmentType.RIGHT })], { width: 20 }),
      ]),
      row([
        cell([plain("2", { align: AlignmentType.CENTER, bold: true })]),
        cell([plain(input.opt2)]),
        cell([plain(input.qte2, { align: AlignmentType.CENTER })]),
        cell([plain(input.pu2, { align: AlignmentType.RIGHT })]),
        cell([plain(input.mt2, { align: AlignmentType.RIGHT })]),
      ]),
      row([
        cell([plain("5", { align: AlignmentType.CENTER, bold: true })]),
        cell([plain("Livraison hors Abidjan, si demandée")]),
        cell([plain(input.livQte, { align: AlignmentType.CENTER })]),
        cell([plain(input.livPu, { align: AlignmentType.RIGHT })]),
        cell([plain(input.livMt, { align: AlignmentType.RIGHT })]),
      ]),
    ]),
    line(
      [text("Toute option ou tout aménagement qui ne figure pas dans ce tableau n'est pas dû par Kpandji Automobiles.", { size: SIZE_SM })],
      { before: 60, after: 0 },
    ),
  ];

  const page2: Array<Paragraph | Table> = [
    bar("5. PRIX"),
    t([
      head(["Élément", "Montant (FCFA)"], [66, 34]),
      row([
        cell([plain("Prix du véhicule HT")], { width: 66 }),
        cell([plain(input.vehiculeHt, { align: AlignmentType.RIGHT })], { width: 34 }),
      ]),
      row([
        cell([plain("Options, accessoires et prestations HT")]),
        cell([plain(input.optionsHt, { align: AlignmentType.RIGHT })]),
      ]),
      row([
        cell([line([text("Remise commerciale : "), text(input.remisePct || "……", { bold: true }), text(" %")], { before: 0, after: 0 })]),
        cell([plain(input.remiseMontant || "—", { align: AlignmentType.RIGHT })]),
      ]),
      row([
        cell([plain("Total HT", { bold: true })]),
        cell([plain(input.totalHt, { align: AlignmentType.RIGHT, bold: true })]),
      ]),
      row([
        cell([plain("TVA 18 % (ou mention d'exonération et référence de l'attestation)")]),
        cell([plain(input.tva, { align: AlignmentType.RIGHT })]),
      ]),
      row([
        cell([plain("Prix total TTC", { bold: true })]),
        cell([plain(input.totalTtc, { align: AlignmentType.RIGHT, bold: true })]),
      ]),
      row([
        cell([plain("Net à payer", { bold: true })]),
        cell([plain(input.net, { align: AlignmentType.RIGHT, bold: true })]),
      ]),
    ]),
    line(
      [
        text("Prix total TTC en lettres : ", { size: SIZE_SM }),
        text(input.lettres || "…………………………………………", { bold: true, size: SIZE_SM }),
        text(" francs CFA.", { size: SIZE_SM }),
      ],
      { before: 60, after: 20 },
    ),
    line([text("Ce prix est ferme et définitif jusqu'à la date limite de livraison indiquée au point 7.", { size: SIZE_SM })], { before: 0, after: 40 }),
    bar("6. ÉCHÉANCIER DE RÈGLEMENT"),
    t([
      head(["Échéance", "Fait générateur", "Part du prix TTC", "Montant (FCFA)", "Reçu n°"], [16, 38, 14, 18, 14]),
      row([
        cell([plain("Acompte n° 1")], { width: 16 }),
        cell([plain("Signature du bon de commande")], { width: 38 }),
        cell([plain("30 %", { align: AlignmentType.CENTER })], { width: 14 }),
        cell([plain(input.acompte1, { align: AlignmentType.RIGHT })], { width: 18 }),
        cell([plain(input.recu1)], { width: 14 }),
      ]),
      row([
        cell([plain("Acompte n° 2")]),
        cell([plain("Avis écrit de mise en assemblage, avec n° de châssis")]),
        cell([plain("40 %", { align: AlignmentType.CENTER })]),
        cell([plain(input.acompte2, { align: AlignmentType.RIGHT })]),
        cell([plain(input.recu2)]),
      ]),
      row([
        cell([plain("Solde")]),
        cell([plain("Avis de mise à disposition, avant remise des clés")]),
        cell([plain("30 %", { align: AlignmentType.CENTER })]),
        cell([plain(input.solde, { align: AlignmentType.RIGHT })]),
        cell([plain(input.recuSolde)]),
      ]),
    ]),
    line(
      [text("Les sommes versées à la commande sont des acomptes et non des arrhes : la commande est ferme pour les deux parties.", { size: SIZE_SM })],
      { before: 60, after: 20 },
    ),
    line(
      [
        text("Mode de règlement : ", { size: SIZE_SM }),
        choice(input.reglement === "virement", "Virement"),
        choice(input.reglement === "cheque", "Chèque certifié ou de banque"),
        choice(input.reglement === "mobile", "Mobile money (compte marchand Kpandji)"),
        choice(input.reglement === "especes", "Espèces à la caisse du siège, dans la limite réglementaire"),
      ],
      { before: 20, after: 20 },
    ),
    line(
      [text("Tout paiement se fait exclusivement au nom de Kpandji Automobiles SARL et donne lieu à un reçu numéroté émis par la caisse.", { size: SIZE_SM })],
      { before: 0, after: 20 },
    ),
    line(
      [
        text("Financement : ", { size: SIZE_SM }),
        choice(input.financement === "comptant", "Comptant"),
        choice(input.financement === "credit", "Crédit ou crédit-bail auprès de"),
        text(input.organisme || "…………………………", { bold: true, size: SIZE_SM }),
        text(" pour un montant de ", { size: SIZE_SM }),
        text(input.montantFinance || "………………", { bold: true, size: SIZE_SM }),
        text(" FCFA. En cas de financement, la commande est conclue sous condition suspensive de l'accord de l'établissement, à obtenir avant le ", { size: SIZE_SM }),
        text(input.dateAccord || "…… / …… / ……", { bold: true, size: SIZE_SM }),
        text(".", { size: SIZE_SM }),
      ],
      { before: 0, after: 40 },
    ),
    bar("7. LIVRAISON"),
    t([
      row([
        cell([plain("Date limite de livraison", { bold: true })], { width: 34 }),
        cell(
          [
            line(
              [
                text(input.dateLivraison || "…… / …… / ……", { bold: true }),
                text("  date ferme, calculée à partir de l'encaissement de l'acompte n° 1", { size: SIZE_SM }),
              ],
              { before: 0, after: 0 },
            ),
          ],
          { width: 66 },
        ),
      ]),
      row([
        cell([plain("Lieu de livraison", { bold: true })]),
        cell([
          line(
            [
              choice(input.livraison === "site", "Site Kpandji, Riviéra Palmerais"),
              choice(input.livraison === "autre", "Autre :"),
              text(input.autreLieu || "…………………………", { bold: true }),
              text(" aux frais du client", { size: SIZE_SM }),
            ],
            { before: 0, after: 0 },
          ),
        ]),
      ]),
      row([
        cell([plain("Personne habilitée à réceptionner", { bold: true })]),
        cell([
          line(
            [
              text("Nom : ", { bold: true, size: SIZE_SM }),
              text(input.receptionnaire || "…………………………"),
              text("    Pièce d'identité n° : ", { bold: true, size: SIZE_SM }),
              text(input.pieceReception || "…………………………"),
            ],
            { before: 0, after: 0 },
          ),
        ]),
      ]),
      row([
        cell([plain("Garantie constructeur", { bold: true })]),
        cell([plain("3 ans ou 100 000 km, premier terme échu, à compter de la livraison ; elle s'ajoute aux garanties légales")]),
      ]),
      row([
        cell([plain("Documents remis", { bold: true })]),
        cell([plain("Facture définitive, bordereau de livraison, carnet de garantie et d'entretien, manuel, double des clés")]),
      ]),
    ]),
    line(
      [text("La date limite est reportée d'autant de jours que le client a de retard dans le paiement d'une échéance.", { size: SIZE_SM })],
      { before: 60, after: 40 },
    ),
    bar("8. ACCEPTATION"),
    line(
      [
        text(
          "Le client reconnaît avoir reçu, lu et accepté les conditions générales de vente annexées au présent bon de commande, dont il a paraphé chaque page, ainsi que la fiche descriptive du véhicule.",
          { size: SIZE_SM },
        ),
      ],
      { before: 60, after: 20 },
    ),
    line(
      [
        choice(
          input.horsEtablissement,
          "Commande signée hors établissement ou à distance : le client consommateur dispose du délai de rétractation prévu à l'article 2.4 des CGV ; le formulaire de rétractation lui a été remis.",
        ),
      ],
      { before: 0, after: 20 },
    ),
    line(
      [
        text("Fait à ", { size: SIZE_SM }),
        text(input.faitA || "………………", { bold: true, size: SIZE_SM }),
        text(", le ", { size: SIZE_SM }),
        text(input.faitLe || "…… / …… / ……", { bold: true, size: SIZE_SM }),
        text(", en deux exemplaires originaux.", { size: SIZE_SM }),
      ],
      { before: 20, after: 60 },
    ),
    t([
      head(["Le client", "Pour Kpandji Automobiles SARL"], [50, 50]),
      row(
        [
          cell(
            [
              line([text("Nom, signature précédée de la mention manuscrite « Lu et approuvé, bon pour commande »", { size: SIZE_SM })], { before: 0, after: 80 }),
              line([text(input.signatureClient, { bold: true })], { before: 0, after: 0 }),
            ],
            { width: 50 },
          ),
          cell(
            [
              line([text("Le conseiller commercial (nom et signature) :", { size: SIZE_SM })], { before: 0, after: 40 }),
              line([text(input.signatureConseiller, { bold: true })], { before: 0, after: 120 }),
              line([text("Validation de la direction (nom, signature, cachet) :", { size: SIZE_SM })], { before: 80, after: 0 }),
            ],
            { width: 50 },
          ),
        ],
        1600,
      ),
    ]),
    line(
      [text("La commande n'engage Kpandji Automobiles qu'après validation de la direction et encaissement de l'acompte n° 1.", { size: SIZE_SM })],
      { before: 60, after: 0 },
    ),
  ];

  const doc = new Document({
    creator: "Kpandji Automobiles",
    title: input.numero ? `${titreCourt} ${input.numero}` : `${titreCourt} véhicule neuf`,
    description: `${titreCourt} véhicule neuf`,
    sections: [
      { properties: { page }, footers: { default: footer(1, titreCourt) }, children: page1 },
      { properties: { page }, footers: { default: footer(2, titreCourt) }, children: page2 },
    ],
  });

  return Packer.toBuffer(doc);
}
