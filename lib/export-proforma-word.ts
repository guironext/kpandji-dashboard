import {
  AlignmentType,
  BorderStyle,
  Document,
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

type RasterImageType = "png" | "jpg" | "gif" | "bmp";

const FONT = "Calibri";
const SIZE = 20;
const SIZE_SM = 18;
const SIZE_LG = 28;
const SIZE_XL = 32;

const thin: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "000000",
};
const none: IBorderOptions = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};
const amber: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 16,
  color: "D97706",
};
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorders = { top: none, bottom: none, left: none, right: none };

function run(
  text: string,
  opts?: { bold?: boolean; size?: number; color?: string; italics?: boolean },
) {
  return new TextRun({
    text,
    bold: opts?.bold,
    italics: opts?.italics,
    size: opts?.size ?? SIZE,
    font: FONT,
    color: opts?.color,
  });
}

function p(
  text: string,
  opts?: {
    bold?: boolean;
    after?: number;
    before?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
    color?: string;
    italics?: boolean;
  },
) {
  return new Paragraph({
    alignment: opts?.align,
    spacing: { after: opts?.after ?? 60, before: opts?.before },
    children: [
      run(text, {
        bold: opts?.bold,
        size: opts?.size,
        color: opts?.color,
        italics: opts?.italics,
      }),
    ],
  });
}

function cell(
  text: string,
  opts?: {
    bold?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    widthPct?: number;
    fill?: string;
    columnSpan?: number;
    size?: number;
  },
) {
  return new TableCell({
    borders: cellBorders,
    columnSpan: opts?.columnSpan,
    width:
      opts?.widthPct != null
        ? { size: `${opts.widthPct}%`, type: WidthType.PERCENTAGE }
        : undefined,
    shading: opts?.fill ? { fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [
          run(text, { bold: opts?.bold, size: opts?.size ?? SIZE_SM }),
        ],
      }),
    ],
  });
}

function openCell(children: Paragraph[], widthPct?: number) {
  return new TableCell({
    borders: noBorders,
    width:
      widthPct != null
        ? { size: `${widthPct}%`, type: WidthType.PERCENTAGE }
        : undefined,
    children: children.length ? children : [new Paragraph({ children: [] })],
  });
}

function detectImageType(
  url: string,
  contentType?: string | null,
): RasterImageType {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("bmp")) return "bmp";
  if (ct.includes("png")) return "png";
  const lower = url.toLowerCase();
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "jpg";
  if (lower.includes(".gif")) return "gif";
  if (lower.includes(".bmp")) return "bmp";
  return "png";
}

async function fetchImage(
  src?: string | null,
): Promise<{ data: ArrayBuffer; type: RasterImageType } | null> {
  if (!src) return null;
  try {
    const url = src.startsWith("http")
      ? src
      : src.startsWith("data:")
        ? src
        : `${typeof window !== "undefined" ? window.location.origin : ""}${src.startsWith("/") ? src : `/${src}`}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    if (!data.byteLength) return null;
    return {
      data,
      type: detectImageType(src, res.headers.get("content-type")),
    };
  } catch {
    return null;
  }
}

export type ProformaWordLine = {
  index: number;
  title: string;
  description?: string;
  extras?: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

export type ProformaWordTotal = {
  label: string;
  value: string;
  bold?: boolean;
  fill?: string;
};

export type ProformaWordInput = {
  status: string;
  numero: string;
  dateFacture: string;
  dateEcheance: string;
  createdBy: string;
  createdByEmail: string;
  createdByPhone: string;
  clientName: string;
  clientEntreprise?: string;
  clientPhone: string;
  clientLocalisation: string;
  currencyLabel: string;
  lines: ProformaWordLine[];
  totals: ProformaWordTotal[];
  amountInWords: string;
  notes?: string;
  includeConditions: boolean;
  signatureSrc?: string | null;
};

export function getProformaWordFileName(numero: string, status: string) {
  const safe = `${status}_${numero}`.replace(/[/\\?%*:|"<>]/g, "-");
  return `Facture_${safe}.docx`;
}

export async function buildProformaWordBlob(
  input: ProformaWordInput,
): Promise<Blob> {
  const [logo, signature] = await Promise.all([
    fetchImage("/logo.png"),
    fetchImage(input.signatureSrc),
  ]);

  const header = new Table({
    width: { size: "100%", type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          openCell(
            [
              logo
                ? new Paragraph({
                    children: [
                      new ImageRun({
                        type: logo.type,
                        data: logo.data,
                        transformation: { width: 90, height: 45 },
                      }),
                    ],
                  })
                : p("KPANDJI", { bold: true, size: SIZE_LG }),
            ],
            30,
          ),
          openCell(
            [
              p("KPANDJI AUTOMOBILES", {
                bold: true,
                size: SIZE_XL,
                align: AlignmentType.CENTER,
              }),
              p("Constructeur et Assembleur Automobile", {
                size: SIZE_SM,
                align: AlignmentType.CENTER,
                color: "334155",
              }),
            ],
            70,
          ),
        ],
      }),
    ],
  });

  const meta = new Table({
    width: { size: "100%", type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          openCell(
            [
              p(`Numéro de Proforma: ${input.numero.toUpperCase()}`, {
                bold: true,
                size: SIZE_SM,
              }),
              p(`Créé par: ${input.createdBy || "—"}`, { size: SIZE_SM }),
              p(`Contact: ${input.createdByEmail || "—"}`, { size: SIZE_SM }),
              p(`Téléphone: ${input.createdByPhone || "—"}`, { size: SIZE_SM }),
            ],
            50,
          ),
          openCell(
            [
              p(`Client: ${input.clientName || "—"}`, {
                bold: true,
                size: SIZE,
              }),
              ...(input.clientEntreprise
                ? [
                    p(`Entreprise: ${input.clientEntreprise}`, {
                      size: SIZE_SM,
                    }),
                  ]
                : []),
              p(`Téléphone: ${input.clientPhone || "—"}`, { size: SIZE_SM }),
              p(`Localisation: ${input.clientLocalisation || "—"}`, {
                size: SIZE_SM,
              }),
            ],
            50,
          ),
        ],
      }),
    ],
  });

  const lineHeader = new TableRow({
    tableHeader: true,
    children: [
      cell("#", {
        bold: true,
        align: AlignmentType.CENTER,
        widthPct: 6,
        fill: "ECFDF5",
      }),
      cell("Description", {
        bold: true,
        widthPct: 46,
        fill: "ECFDF5",
      }),
      cell("Qté", {
        bold: true,
        align: AlignmentType.CENTER,
        widthPct: 8,
        fill: "ECFDF5",
      }),
      cell(`Prix Unitaire HT (${input.currencyLabel})`, {
        bold: true,
        align: AlignmentType.RIGHT,
        widthPct: 20,
        fill: "ECFDF5",
      }),
      cell(`Total HT (${input.currencyLabel})`, {
        bold: true,
        align: AlignmentType.RIGHT,
        widthPct: 20,
        fill: "ECFDF5",
      }),
    ],
  });

  const lineRows = input.lines.map(
    (line, i) =>
      new TableRow({
        children: [
          cell(String(line.index), {
            bold: true,
            align: AlignmentType.CENTER,
            widthPct: 6,
            fill: i % 2 === 0 ? "FFFFFF" : "FFFBEB",
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: "46%", type: WidthType.PERCENTAGE },
            shading: { fill: i % 2 === 0 ? "FFFFFF" : "FFFBEB" },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              p(line.title || "—", { bold: true, size: SIZE_SM, after: 20 }),
              ...(line.description
                ? [
                    p(line.description, {
                      size: 16,
                      color: "334155",
                      after: 20,
                    }),
                  ]
                : []),
              ...(line.extras
                ? [p(line.extras, { size: 16, color: "92400E", after: 0 })]
                : []),
            ],
          }),
          cell(line.quantity, {
            align: AlignmentType.CENTER,
            widthPct: 8,
            fill: i % 2 === 0 ? "FFFFFF" : "FFFBEB",
          }),
          cell(line.unitPrice, {
            align: AlignmentType.RIGHT,
            widthPct: 20,
            fill: i % 2 === 0 ? "FFFFFF" : "FFFBEB",
          }),
          cell(line.total, {
            align: AlignmentType.RIGHT,
            widthPct: 20,
            fill: i % 2 === 0 ? "FFFFFF" : "FFFBEB",
          }),
        ],
      }),
  );

  const totalRows = input.totals.map(
    (row) =>
      new TableRow({
        children: [
          cell("", { columnSpan: 3, fill: row.fill || "FFFFFF" }),
          cell(row.label, {
            bold: row.bold,
            align: AlignmentType.RIGHT,
            widthPct: 20,
            fill: row.fill || "FFFFFF",
          }),
          cell(row.value, {
            bold: row.bold,
            align: AlignmentType.RIGHT,
            widthPct: 20,
            fill: row.fill || "FFFFFF",
          }),
        ],
      }),
  );

  const itemsTable = new Table({
    width: { size: "100%", type: WidthType.PERCENTAGE },
    rows: [lineHeader, ...lineRows, ...totalRows],
  });

  const signatureBlock = signature
    ? [
        p("Direction Commerciale", {
          bold: true,
          align: AlignmentType.CENTER,
          after: 80,
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: signature.type,
              data: signature.data,
              transformation: { width: 160, height: 60 },
            }),
          ],
        }),
      ]
    : [
        p("Direction Commerciale", {
          bold: true,
          align: AlignmentType.CENTER,
          after: 80,
        }),
        p("Signature : ______________________", {
          align: AlignmentType.CENTER,
          after: 40,
        }),
      ];

  const notesAndSign = new Table({
    width: { size: "100%", type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          openCell(
            [
              p("Notes / Commentaires", { bold: true, size: SIZE_SM }),
              p(input.notes?.trim() || "—", {
                size: SIZE_SM,
                italics: !input.notes?.trim(),
              }),
            ],
            55,
          ),
          openCell(signatureBlock, 45),
        ],
      }),
    ],
  });

  const children = [
    header,
    new Paragraph({
      border: { bottom: amber },
      spacing: { after: 200 },
      children: [],
    }),
    p(`Date: ${input.dateFacture}`, {
      align: AlignmentType.RIGHT,
      size: SIZE_SM,
      after: 120,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240, before: 80 },
      border: {
        top: thin,
        bottom: thin,
        left: thin,
        right: thin,
      },
      children: [
        run(`FACTURE ${input.status}`, { bold: true, size: SIZE_LG }),
      ],
    }),
    meta,
    new Paragraph({ spacing: { after: 200 }, children: [] }),
    itemsTable,
    new Paragraph({ spacing: { after: 160 }, children: [] }),
    p(
      `Arrêter la présente facture à la somme de ${input.amountInWords} ${input.currencyLabel}`,
      { size: SIZE, after: 200 },
    ),
    notesAndSign,
    p(`Date d'échéance: ${input.dateEcheance}`, {
      bold: true,
      size: SIZE_SM,
      before: 200,
    }),
  ];

  if (input.includeConditions) {
    children.push(
      p("CONDITIONS:", {
        bold: true,
        color: "EA580C",
        before: 200,
        after: 40,
      }),
      p("60% d'acompte à la commande", { size: SIZE_SM, after: 20 }),
      p("DELAIS DE PRODUCTION ET DE LIVRAISON: 4 MOIS", {
        bold: true,
        size: SIZE_SM,
        after: 20,
      }),
      p("SOLDE avant livraison", { size: SIZE_SM, after: 40 }),
      p("Garantie: 3 Ans ou 100.000 kilometres", { size: SIZE_SM, after: 160 }),
    );
  }

  children.push(
    p(
      "Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03",
      { align: AlignmentType.CENTER, size: 16, after: 20 },
    ),
    p(
      "Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 – ECOBANK : CI059 01046 121659429001 46",
      { align: AlignmentType.CENTER, size: 16, after: 20 },
    ),
    p("kpandjiautomobiles@gmail.com / www.kpandji.com", {
      align: AlignmentType.CENTER,
      size: 16,
      after: 0,
    }),
  );

  const doc = new Document({
    creator: "Kpandji Automobiles",
    title: `Facture ${input.numero}`,
    description: "Facture / Proforma exportée — document Word éditable",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
