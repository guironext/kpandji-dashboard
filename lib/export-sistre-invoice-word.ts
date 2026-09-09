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
  type FileChild,
  type IBorderOptions,
} from "docx";
import type { SistreInvoice } from "@/lib/actions/sistre";

const FONT = "Arial";
const SIZE = 20; // 10pt
const SIZE_SM = 18;
const SIZE_LG = 24;

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
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorders = { top: none, bottom: none, left: none, right: none };

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function run(
  text: string,
  opts?: { bold?: boolean; size?: number }
) {
  return new TextRun({
    text,
    bold: opts?.bold,
    size: opts?.size ?? SIZE,
    font: FONT,
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
  }
) {
  return new Paragraph({
    alignment: opts?.align,
    spacing: { after: opts?.after ?? 80, before: opts?.before },
    children: [run(text, { bold: opts?.bold, size: opts?.size })],
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
  }
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
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [run(text, { bold: opts?.bold, size: SIZE_SM })],
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
    children,
  });
}

async function fetchPng(path: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

function pngRun(data: ArrayBuffer, width: number, height: number) {
  return new ImageRun({
    type: "png",
    data,
    transformation: { width, height },
  });
}

export function getSistreInvoiceWordFileName(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[/\\?%*:|"<>]/g, "-");
  return `Proforma_Invoice_${safe}.docx`;
}

export type SistreInvoiceWordInput = {
  invoice: SistreInvoice;
  formattedDate: string;
  totalInWords: string;
};

export async function buildSistreInvoiceWordBlob(
  input: SistreInvoiceWordInput
): Promise<Blob> {
  const { invoice, formattedDate, totalInWords } = input;
  const totalFormatted = formatCurrency(invoice.total);
  const sayUsd = `(SAY US DOLLAR ${totalInWords} ONLY)`;
  const sayUsdUpper = `(SAY US DOLLAR ${totalInWords.toUpperCase()} ONLY)`;

  const [logo, stamp1, stamp2] = await Promise.all([
    fetchPng("/sistre1.png"),
    fetchPng("/sistre2.png"),
    fetchPng("/sistre3.png"),
  ]);

  const commodityRows: TableRow[] =
    invoice.lineItems && invoice.lineItems.length > 0
      ? [
          new TableRow({
            tableHeader: true,
            children: [
              cell("No.", {
                bold: true,
                align: AlignmentType.CENTER,
                widthPct: 8,
                fill: "F0F0F0",
              }),
              cell("Description", {
                bold: true,
                widthPct: 44,
                fill: "F0F0F0",
              }),
              cell("Quantity", {
                bold: true,
                align: AlignmentType.CENTER,
                widthPct: 12,
                fill: "F0F0F0",
              }),
              cell("Unit Price", {
                bold: true,
                align: AlignmentType.RIGHT,
                widthPct: 18,
                fill: "F0F0F0",
              }),
              cell("Amount", {
                bold: true,
                align: AlignmentType.RIGHT,
                widthPct: 18,
                fill: "F0F0F0",
              }),
            ],
          }),
          ...invoice.lineItems.map(
            (item, index) =>
              new TableRow({
                children: [
                  cell(String(index + 1), {
                    bold: true,
                    align: AlignmentType.CENTER,
                    widthPct: 8,
                  }),
                  cell(item.description, { widthPct: 44 }),
                  cell(String(item.quantity), {
                    bold: true,
                    align: AlignmentType.CENTER,
                    widthPct: 12,
                  }),
                  cell(formatCurrency(item.unitPrice), {
                    align: AlignmentType.RIGHT,
                    widthPct: 18,
                  }),
                  cell(formatCurrency(item.unitPrice * item.quantity), {
                    bold: true,
                    align: AlignmentType.RIGHT,
                    widthPct: 18,
                  }),
                ],
              })
          ),
        ]
      : [
          new TableRow({
            tableHeader: true,
            children: [
              cell("No.", { bold: true, fill: "F0F0F0", widthPct: 8 }),
              cell("Description", { bold: true, fill: "F0F0F0", widthPct: 44 }),
              cell("Quantity", {
                bold: true,
                align: AlignmentType.CENTER,
                fill: "F0F0F0",
                widthPct: 12,
              }),
              cell("Unit Price", {
                bold: true,
                align: AlignmentType.RIGHT,
                fill: "F0F0F0",
                widthPct: 18,
              }),
              cell("Amount", {
                bold: true,
                align: AlignmentType.RIGHT,
                fill: "F0F0F0",
                widthPct: 18,
              }),
            ],
          }),
          new TableRow({
            children: [
              cell("No items found", {
                align: AlignmentType.CENTER,
                columnSpan: 5,
              }),
            ],
          }),
        ];

  const children: FileChild[] = [
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            openCell(
              [
                new Paragraph({
                  spacing: { after: 0 },
                  children: logo ? [pngRun(logo, 48, 80)] : [],
                }),
              ],
              12
            ),
            openCell(
              [
                p(
                  "SISTRE GLOBAL SOURCING PTE LTD To Wholesale Industriial, Construction and Related Machinery and Equipment N.E.C – Wholesale of parts and accessories for vehicles Address : 9 Raffles Place, #29-05, Republic Plaza, Singapore 048619 Email : weifong@corpnd.com Registration No. 202550388K",
                  { size: SIZE_SM, after: 0 }
                ),
              ],
              88
            ),
          ],
        }),
      ],
    }),
    new Paragraph({
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 24,
          color: "000000",
          space: 1,
        },
      },
      spacing: { after: 240, before: 80 },
      children: [run("")],
    }),

    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            openCell(
              [
                p("To", { after: 80 }),
                p("KPANDJI AUTOMOBILES", { after: 40 }),
                p("Abidjan, Abobo Garage Ecole", { after: 40 }),
                p("KOUAME N'DA N'GORAN BERNARD", { after: 40 }),
                p("+2250544100000", { after: 0 }),
              ],
              60
            ),
            openCell(
              [
                p(`PI No : ${invoice.invoiceNumber}`, {
                  after: 40,
                  align: AlignmentType.RIGHT,
                }),
                p(`Date: ${formattedDate}`, {
                  after: 40,
                  align: AlignmentType.RIGHT,
                }),
                p("Total: 1 Page", { after: 0, align: AlignmentType.RIGHT }),
              ],
              40
            ),
          ],
        }),
      ],
    }),

    p("Commodity:", { bold: true, before: 280, after: 120 }),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: commodityRows,
    }),

    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 80 },
      children: [
        run("Total:  ", { bold: true, size: SIZE_LG }),
        run(totalFormatted, { bold: true, size: SIZE_LG }),
      ],
    }),

    new Paragraph({
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 },
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: "000000",
          space: 4,
        },
      },
      spacing: { before: 120, after: 200 },
      children: [
        run(
          `TOTAL FOB SHANGHAI, China : USD $${totalFormatted} ${sayUsd}`,
          { bold: true }
        ),
      ],
    }),

    new Paragraph({
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: "000000",
          space: 1,
        },
      },
      spacing: { after: 120 },
      children: [run("* Terms and Conditions apply: 100% TT", { bold: true })],
    }),
    p("a) Place of delivery: Port Abidjan, Côte d'Ivoire"),
    p(
      "b) Time of delivery: Shipment within 30 days after receipt the total payment."
    ),
    p(
      `Terms of payment: Buyer shall pay Seller the total payment by T/T within 5 days after signing the PROFORMA INVOICE by two parties, which is $${totalFormatted} ${sayUsdUpper}`
    ),
    p("c) Account:"),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              shading: { fill: "F8F8F8" },
              children: [
                p("Company name : SISTRE GLOBAL SOURCING PTE LTD", {
                  bold: true,
                  after: 40,
                }),
                p("Bank Name : The Currency Cloud Limited", {
                  bold: true,
                  after: 40,
                }),
                p(
                  "Bank Address : 12 Steward Street, The Steward Building, London, E1 6FQ, GB",
                  { bold: true, after: 40 }
                ),
                p("Account Number : GB20TCCL04140462923432 (USD)", {
                  bold: true,
                  after: 40,
                }),
                p("Swift code : TCCLGB3L", { bold: true, after: 80 }),
                p("Intermediary Bank", { bold: true, after: 40 }),
                p("Bank Name : Barclays Bank PLC, London", {
                  bold: true,
                  after: 40,
                }),
                p("Swift Code : BARCGB22XXX", { bold: true, after: 0 }),
              ],
            }),
          ],
        }),
      ],
    }),
    p(
      "d) Packing : Packing shall be in accordance with the Sales Contract signed by both parties.",
      { before: 120 }
    ),
    p("e) Validity : Within 30 days"),
    p("f) Country of origin : China"),
    p(
      "g) Warranty: 36 months or 100,000 km which comes first, details refers to Service Agreement."
    ),
    p("h) Remarks", { after: 200 }),

    p("Your faithfully"),
    p("SISTRE GLOBAL SOURCING PTE LTD", { bold: true, after: 120 }),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            openCell(
              [
                new Paragraph({
                  spacing: { after: 40 },
                  children: stamp1 ? [pngRun(stamp1, 70, 70)] : [],
                }),
                new Paragraph({
                  border: {
                    top: {
                      style: BorderStyle.SINGLE,
                      size: 6,
                      color: "000000",
                      space: 1,
                    },
                  },
                  spacing: { after: 0 },
                  children: [run(" ")],
                }),
              ],
              30
            ),
            openCell(
              [
                new Paragraph({
                  spacing: { after: 0 },
                  children: stamp2 ? [pngRun(stamp2, 100, 100)] : [],
                }),
              ],
              70
            ),
          ],
        }),
      ],
    }),
    p("YONG WEI FONG", { bold: true, before: 80, after: 0 }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: SIZE,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
