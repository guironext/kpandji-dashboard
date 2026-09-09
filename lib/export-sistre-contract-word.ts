import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
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

const FONT = "Times New Roman";
const SIZE = 20; // 10pt
const SIZE_SM = 19;
const SIZE_TITLE = 28;
const SIZE_HEADER = 24;

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
  opts?: { bold?: boolean; italics?: boolean; size?: number; color?: string }
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
    italics?: boolean;
    after?: number;
    before?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indent?: number;
    size?: number;
  }
) {
  return new Paragraph({
    alignment: opts?.align,
    indent: opts?.indent != null ? { left: opts.indent } : undefined,
    spacing: { after: opts?.after ?? 120, before: opts?.before },
    children: [
      run(text, {
        bold: opts?.bold,
        italics: opts?.italics,
        size: opts?.size,
      }),
    ],
  });
}

function rich(
  parts: Array<string | { text: string; bold?: boolean }>,
  opts?: {
    after?: number;
    before?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indent?: number;
  }
) {
  return new Paragraph({
    alignment: opts?.align,
    indent: opts?.indent != null ? { left: opts.indent } : undefined,
    spacing: { after: opts?.after ?? 120, before: opts?.before },
    children: parts.map((part) =>
      typeof part === "string"
        ? run(part)
        : run(part.text, { bold: part.bold })
    ),
  });
}

function title(text: string) {
  return p(text, { bold: true, after: 80, before: 200 });
}

function body(text: string, extra?: { after?: number; before?: number }) {
  return p(text, {
    indent: 280,
    after: extra?.after ?? 120,
    before: extra?.before,
    align: AlignmentType.JUSTIFIED,
  });
}

function cell(
  text: string,
  opts?: {
    bold?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    widthPct?: number;
    fill?: string;
  }
) {
  return new TableCell({
    borders: cellBorders,
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

export type SistreContractWordInput = {
  invoice: SistreInvoice;
  contractNumber: string;
  formattedDate: string;
  formattedDateShort: string;
  totalAmountFormatted: string;
  totalInWords: string;
};

export function getSistreContractWordFileName(contractNumber: string): string {
  const safe = contractNumber.replace(/[/\\?%*:|"<>]/g, "-");
  return `Sales_Contract_${safe}.docx`;
}

export async function buildSistreContractWordBlob(
  input: SistreContractWordInput
): Promise<Blob> {
  const {
    invoice,
    contractNumber,
    formattedDate,
    formattedDateShort,
    totalAmountFormatted,
    totalInWords,
  } = input;

  const totalQty = invoice.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const sayUsd = `(SAY US DOLLAR ${totalInWords.toUpperCase()} ONLY)`;

  const [sellerStamp1, sellerStamp2, buyerStamp] = await Promise.all([
    fetchPng("/sistre2.png"),
    fetchPng("/sistre3.png"),
    fetchPng("/sistre4.png"),
  ]);

  const commodityRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        cell("No.", { bold: true, align: AlignmentType.CENTER, widthPct: 8, fill: "F0F0F0" }),
        cell("Description", { bold: true, align: AlignmentType.CENTER, widthPct: 44, fill: "F0F0F0" }),
        cell("Qty", { bold: true, align: AlignmentType.CENTER, widthPct: 12, fill: "F0F0F0" }),
        cell("U/Price", { bold: true, align: AlignmentType.CENTER, widthPct: 18, fill: "F0F0F0" }),
        cell("Amount", { bold: true, align: AlignmentType.CENTER, widthPct: 18, fill: "F0F0F0" }),
      ],
    }),
    ...invoice.lineItems.map(
      (item, index) =>
        new TableRow({
          children: [
            cell(String(index + 1), { widthPct: 8 }),
            cell(`Brand Name : ${item.description}`, { widthPct: 44 }),
            cell(String(item.quantity), { align: AlignmentType.CENTER, widthPct: 12 }),
            cell(formatCurrency(item.unitPrice), {
              align: AlignmentType.RIGHT,
              widthPct: 18,
            }),
            cell(formatCurrency(item.unitPrice * item.quantity), {
              align: AlignmentType.RIGHT,
              widthPct: 18,
            }),
          ],
        })
    ),
    new TableRow({
      children: [
        cell("", { widthPct: 8 }),
        cell("", { widthPct: 44 }),
        cell(String(totalQty), { align: AlignmentType.CENTER, widthPct: 12 }),
        cell("", { widthPct: 18 }),
        cell(totalAmountFormatted, {
          bold: true,
          align: AlignmentType.RIGHT,
          widthPct: 18,
        }),
      ],
    }),
  ];

  const sellerStampParagraph = new Paragraph({
    spacing: { after: 80, before: 80 },
    children: [
      ...(sellerStamp1 ? [pngRun(sellerStamp1, 85, 85)] : []),
      ...(sellerStamp1 && sellerStamp2 ? [run("  ")] : []),
      ...(sellerStamp2 ? [pngRun(sellerStamp2, 85, 85)] : []),
    ],
  });

  const buyerStampParagraph = new Paragraph({
    spacing: { after: 80, before: 80 },
    children: buyerStamp ? [pngRun(buyerStamp, 140, 78)] : [],
  });

  const children: FileChild[] = [
    p("SALES CONTRACT", {
      bold: true,
      align: AlignmentType.CENTER,
      size: SIZE_TITLE,
      after: 240,
      before: 80,
    }),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            openCell(
              [p(`CONTRACT NO: ${contractNumber}`, { bold: true, after: 0 })],
              50
            ),
            openCell(
              [
                p(`DATE: ${formattedDate}`, {
                  bold: true,
                  after: 0,
                  align: AlignmentType.RIGHT,
                }),
              ],
              50
            ),
          ],
        }),
      ],
    }),
    p("", { after: 160 }),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            openCell(
              [
                p("SELLER: SISTRE GLOBAL SOURCING PTE LTD", { bold: true, after: 60 }),
                p("Address: 9 Raffles Place, #29-05, Republic Plaza, Singapore 048619", {
                  after: 40,
                }),
                p("Tel: +852 9889 3529", { after: 0 }),
              ],
              50
            ),
            openCell(
              [
                p("BUYER: KPANDJI AUTOMOBILES", { bold: true, after: 60 }),
                p("Address: Abidjan, Abobo Garage Ecole", { after: 40 }),
                p("Tel: +225-05-44-10-00-00", { after: 0 }),
              ],
              50
            ),
          ],
        }),
      ],
    }),
    p(
      "The undersigned Seller and Buyer have agreed to close the following transactions according to the terms and conditions set forth as below:",
      { after: 200, before: 200, align: AlignmentType.JUSTIFIED }
    ),

    title("1. COMMODITY:"),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: commodityRows,
    }),
    p(
      `TOTAL FOB Qingdao, China : USD $${totalAmountFormatted} ${sayUsd}`,
      { after: 200, before: 120 }
    ),

    title(`2. TOTAL CONTRACT VALUE : $${totalAmountFormatted} ${sayUsd}.`),
    title("3. TERMS OF DELIVERY : FOB Qingdao, China, in accordance with INCOTERMS®2010"),
    title("4. COUNTRY OF ORIGIN : P.R.China"),
    title("5. PACKING :"),
    body(
      "The packing shall be responsible by the Seller, and the packing is according to the packing Scheme of the Seller."
    ),
    title("6. SHIPPING MARK : N/M"),

    title("7. TERMS OF PAYMENT :"),
    body(
      `Buyer shall pay Seller the deposit by T/T within 15 days after signing the Sale Contract by two parties, which is USD $${totalAmountFormatted} ${sayUsd} shall be paid by T/T within 15 days after receiving the notification of commodity production completion from Seller.`
    ),
    body(
      "Any bank charges incurred in P.R.China (excluding Hong Kong, Macao and Taiwan) shall be borne by the Seller."
    ),
    body(
      "Any bank charges incurred outside P.R.China (excluding Hong Kong, Macao and Taiwan) shall be borne by the Buyer."
    ),

    title("8. INSURANCE :"),
    body("Insurance for the commodity shipment shall be covered by the Buyer."),

    title("9. TIME OF SHIPMENT :"),
    body("By sea, nude Cargo. Shipment within 50 days after the deposit received."),

    title("10. TERMS OF DELIVERY:"),
    body(
      "10.1. Upon Seller receipt of the deposit, the Seller shall complete the production in compliance with the description of the commodity in this Sales Contract, and shall arrange delivery in a reasonable time upon production completion upon Seller receipt of full payment."
    ),
    body(
      "10.2. Should the freight agency be designated by the Buyer, the Buyer must demand its agency to deliver the Bill of Lading to the Seller. Otherwise, the Buyer shall be held accountable of any consequences thereof."
    ),
    body(
      "10.3.The Seller shall send the Buyer sufficient and timely shipping notice, to enable the Buyer to purchase insurance and acquire the commodity on time."
    ),
    body(
      "10.4.The Seller shall present the following documents with three sets of copies to the Buyer："
    ),
    p("- Full set of clean on Board Ocean Bills of Lading.", { indent: 560, after: 40 }),
    p("- Original Commercial Invoice", { indent: 560, after: 40 }),
    p("- Original Packing List", { indent: 560, after: 160 }),

    title("11. BANK INFORMATION :"),
    p("Company name : SISTRE GLOBAL SOURCING PTE LTD", { indent: 280, after: 40 }),
    p("Bank Name : The Currency Cloud Limited", { indent: 280, after: 40 }),
    p(
      "Bank Address : 12 Steward Street, The Steward Building, London, E1 6FQ, GB",
      { indent: 280, after: 40 }
    ),
    p("Account Number : GB20TCCL04140462923432 (USD)", { indent: 280, after: 40 }),
    p("Swift code : TCCLGB3L", { indent: 280, after: 80 }),
    p("Intermediary Bank", { indent: 280, after: 40, bold: true }),
    p("Bank Name : Barclays Bank PLC, London", { indent: 280, after: 40 }),
    p("Swift Code : BARCGB22XXX", { indent: 280, after: 160 }),

    title("12. PORT OF SHIPMENT : Any port, P.R.China"),
    title("13. PORT OF DESTINATION : Abidjan PORT, Cote d'Ivoire"),
    title("14. PARTIAL SHIPMENT : Allowed"),
    title("15. TRANSSHIPMENT : Allowed"),

    title("16. INSPECTION :"),
    p("16.1 The Seller's responsibility:", { indent: 280, bold: true, after: 80 }),
    body(
      "16.1.1 If the Buyer has sufficient evidence to prove that the parts are wrongly shipped or less shipped when unpacked due to Seller's delivery reasons; the quality responsibility of the parts that do not exceed claim period.."
    ),
    body(
      "16.1.2 The Seller should not responsible for the loss, damages, of the commodity during deliveries. They should be claimed from the Insurance company by the Buyer."
    ),
    p("16.2 The Buyer's responsibility:", {
      indent: 280,
      bold: true,
      after: 80,
      before: 80,
    }),
    body(
      "16.2.1 If the Buyer has any issues to the quantity of the commodity: the Buyer should present the issue within 15 days from the date of arrival of the commodity; and only after confirmation by the Seller, the Seller shall replace the wrong or less shipped parts free of charge (the Seller shall not bear the freight charges)."
    ),
    body(
      "16.2.2 If the Buyer has any issues to the quality of the commodity: the Buyer must present the issue within 45 days from the date of arrival of the commodity; and only after confirmation by the Seller, the Seller shall replace the defective parts free of charge (the Seller shall not bear the freight charges)."
    ),
    body(
      "16.2.3 The Buyer shall responsible for the exterior damage or quality defect of the commodity caused by unpacking; and to be responsible for the loss or damage of parts caused by improper operation by the Buyer's workers in the assembly process."
    ),
    body(
      "16.2.4 The claim for one lot of commodity shall not be regarded as the reason for the Buyer to refuse receipt of or paying for other supplied commodity stipulated in the contract."
    ),
    p("16.3 Claiming confirmation:", {
      indent: 280,
      bold: true,
      after: 80,
      before: 80,
    }),
    body(
      "The claims confirmation list for all quantity and quality claims shall be provided by the Buyer to the Seller for once only. After the confirmation of claim, the Seller will not accept any other claim related to this Sales Contract in principle."
    ),
    rich(
      [
        { text: "16.4 ", bold: true },
        {
          text: "The two parties confirm the mode of delivery according to the claiming parts quantity and weight. When the weight below 80kg, the Seller will send the parts by air to the Buyer's plant (mode of delivery: door to port), and afford the charges till the parts arrive the destination port; when the weight more than 80kg, the Seller will send the parts to the plant in China which is appointed by the Buyer (mode of delivery: by land).",
        },
      ],
      { indent: 280, after: 160, align: AlignmentType.JUSTIFIED }
    ),

    title("17. AFTER-SALES SERVICE :"),
    body("17.1. Labor Rate=USD16/hour, Parts Cost=FOB price*1.3."),
    body("17.2. Spare parts warranty policy see Attachment."),
    body(
      "17.3. Buyer shall submit all occurred quality warranty information of the previous month on DMS system before 10th of each month in order to be audited and accounted by the Seller before any claims payment made. The Seller shall audit warranty claims confirmation before 30th and settle the accounts within 10 days after receive the confirmation letter and invoice from the Buyer. Claims payment will not be made for overdue warranty."
    ),
    body(
      "17.4. The Buyer shall keep the warranted defective parts for not less than six months for the Seller's confirmation. During this period, if the Seller does not send personnel to the Buyer to resolve the parts defect, the Buyer shall dispose the parts and need not to delivery them back."
    ),
    body(
      "17.5. The Seller's liability for warranty claims shall not exceed the value of the faulty parts of the faulty vehicle."
    ),

    title("18. CONTRACT LIABILITY :"),
    body(
      "18.1 The Seller shall only accept claims from the Buyer in accordance with this sales contract and shall not accept claims from any third parties and/or vehicle users; pursuant to this sales contract, claimable amount by the Buyer from the Seller shall not exceed the non-conformity quality of commodity parts and spare parts total value supplied by The Seller; The Seller shall not be liable for the Buyer's investment funds, equipment, personnel direct and/or indirect losses and the Buyer's expected losses on vehicle assembling and selling during the performance of this Sales Contract."
    ),
    body(
      "18.2 The Buyer warrants that it has complete and comprehensive understandings and has behaved and/or carried out its operations in strict accordance with the laws and regulations in Cote d'Ivoire. Before selling, the Buyer shall establish its own whole vehicle quality standard, whole vehicle inspection and acceptance standards and assemble vehicles according to such standards and make necessary and enough adaptability tests to make sure that the assembled vehicles meet the requirements of the local laws, regulations and quality standard. The quality of the vehicles assembled by the Buyer and the quality defects of the commodity parts caused in welding and assembling should be bear by the Buyer."
    ),

    title("19. LAW APPLICATION :"),
    body("This Sales Contract shall be governed by the laws of the People's Republic of China."),

    title("20. FORCE MAJEURE :"),
    body(
      "Neither party shall be held responsible for commodity delivery delay or failure to perform all or any part of obligations under this Sales Contract due to force majeure. The party affected by the event shall inform the other party of its occurrence in writing as soon as possible and thereafter sends a certificate of the event issued by the relevant authority to the other party."
    ),
    body(
      "However, the party affected by the event should try its best to prevent further loss whether it has known or it should have been known, and if such further loss occurred hereunder, any liability should be undertaken by the party affected by the event."
    ),

    title("21. DEFAULT CLAUSE :"),
    body(
      "The Buyer shall be liable for the Seller's loss (such as funds tied up, exchange rate fluctuation losses, etc.) due to delay on payments or commodity take over. As such, the Buyer should pay the Seller 1％ of total contract value as detention fee if the detention time is above 20 days. The Buyer should pay the Seller 2％ of total contract value per day as detention fee if the detention time is above 40 days. If detention time is above 60 days, the down payment from the Buyer should be taken as liquidated damages, the Seller has the rights to dispose the commodity without notification to the Buyer; additionally, the Seller reserve the rights to claim insufficient portion of detention fee versus down payment and the Seller reserve the right to terminate this Sales Contract. If the detention time does not exceed 60 days, but the down payment is less than detention fee, the Seller has the rights to dispose the commodity and to terminate this Sales Contract."
    ),

    title("22. CONTRACT MODIFICATION :"),
    body(
      "22.1. The terms and conditions of this contract constitute a full and final understanding to the commodity under this Sales Contract by both the Seller and the Buyer. Any modification, supplementation and/or rescission to this contract must be bound to the confirmation in writing and to be signed and sealed by both parties, otherwise it shall be accounted invalid."
    ),
    body(
      "22.2. Neither this Sales Contract hereof nor any interest and/or obligation therein shall be assigned without the Seller's prior written consent."
    ),

    title("23. ARBITRATE CLAUSE :"),
    body(
      "Any dispute in connection with or arising from this contract shall be settled amicably through negotiation. In case no settlement can be reached between the two parties, the case shall be referred to China International Economic and Trade Arbitration Commission, Beijing for arbitration in accordance with its existing Rules of Arbitration, and it should also refer to the existing law of the People's Republic of China to settle all the issues related to the arbitration. The arbitral award is final and binding upon both parties."
    ),

    title("24. CONTRACT VERSIONS :"),
    body("Both Chinese and English versions of this Sales Contract have equal legal force."),

    title("25. CONTRACT VALIDITY :"),
    body(
      "25.1. This Sales Contract shall come into force after signed and sealed by both parties before Aug, 30th, 2025."
    ),
    body(
      "25.2. This Sales Contract shall come into force from its effective date and shall come to be invalid once both parties complete the rights and obligations hereof."
    ),

    title("26. TRADEMARK CLAUSE :"),
    body(
      "Trademark and the name of the commodity under this contract are the property right of the Seller. Without written authorization from the Seller, the Buyer should not register the trademark, logo and product name of the Seller in the territory or any other countries or areas. The Buyer can only use the logo and product name of the Seller in advertising and other articles relative to selling of the Seller's automobiles."
    ),

    title("27. OTHER PROVISIONS :"),
    body(
      "27.1. Considering the special condition of international business, fax or scan of this Sales Contract shall have legal effect."
    ),
    body(
      "27.2. This Sales Contract shall have the final legal force and effect and shall preside any discrepancy arise between this Sales Contract and any Proforma Invoice entered by both parties,"
    ),
    body(
      "27.3. In witness thereof, this Sales Contract shall come into effect immediately after it is signed and/or stamped by both parties in two original copies and each party holds one. All the attachments of this Sales Contract are the integral part of this Sales Contract and shall have the same legal effect."
    ),
    body(
      "27.4. After the entering of this Sales Contract, if the Buyer fails to perform payment as agreed under this Sales Contract and the Seller fails to reaffirm the validity of this Sales Contract, this Sales Contract shall be automatically terminated."
    ),

    p("", { after: 200 }),
    new Table({
      width: { size: "100%", type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            openCell(
              [
                p("SELLER:", { bold: true, after: 80 }),
                p("SISTRE GLOBAL SOURCING PTE LTD", { bold: true, after: 120 }),
                p("Name of the authorized representative:", { after: 60 }),
                p("YONG WEI FONG", { after: 80 }),
                sellerStampParagraph,
                new Paragraph({
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 },
                  },
                  spacing: { before: 80, after: 80 },
                  children: [run("Seal and signature:")],
                }),
                p(`Date: ${formattedDateShort}`, { after: 0, before: 80 }),
              ],
              50
            ),
            openCell(
              [
                p("BUYER:", { bold: true, after: 80 }),
                p("KPANDJI AUTOMOBILES", { bold: true, after: 120 }),
                p("Name of the authorized representative:", { after: 60 }),
                p("KOUAME NDA NGORAN BERNARD", { after: 80 }),
                buyerStampParagraph,
                new Paragraph({
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 },
                  },
                  spacing: { before: 80, after: 80 },
                  children: [run("Seal and signature:")],
                }),
                p(`Date: ${formattedDateShort}`, { after: 0, before: 80 }),
              ],
              50
            ),
          ],
        }),
      ],
    }),
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
              bottom: 850,
              left: 720,
              header: 400,
              footer: 400,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 12,
                    color: "000000",
                    space: 8,
                  },
                },
                spacing: { after: 120 },
                children: [
                  run("SISTRE GLOBAL SOURCING PTE LTD", {
                    bold: true,
                    italics: true,
                    size: SIZE_HEADER,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  run("Page ", { size: 16, color: "666666" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: 16,
                    color: "666666",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
