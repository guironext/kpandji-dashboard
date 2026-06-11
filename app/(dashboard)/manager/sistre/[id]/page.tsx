"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSistreInvoice, type SistreInvoice } from "@/lib/actions/sistre";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Printer,
  FileText,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

export default function SistreInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<SistreInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const result = await getSistreInvoice(invoiceId);

        if (result.success && result.data) {
          setInvoice(result.data);
          setError(null);
        } else {
          setError(result.error || "Erreur lors du chargement du reçu");
          toast.error(result.error || "Erreur lors du chargement du reçu");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors du chargement";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    } else {
      toast.error("ID de reçu manquant");
      router.push("/manager/sistre");
    }
  }, [invoiceId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const numberToEnglish = (num: number): string => {
    const ones = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ];
    const teens = [
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    if (num === 0) return "zero";
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one ? "-" + ones[one] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      return (
        ones[hundred] +
        " hundred" +
        (rest ? " " + numberToEnglish(rest) : "")
      ).trim();
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      return (
        numberToEnglish(thousand) +
        " thousand" +
        (rest ? " " + numberToEnglish(rest) : "")
      ).trim();
    }
    if (num < 1000000000) {
      const million = Math.floor(num / 1000000);
      const rest = num % 1000000;
      return (
        numberToEnglish(million) +
        " million" +
        (rest ? " " + numberToEnglish(rest) : "")
      ).trim();
    }
    const billion = Math.floor(num / 1000000000);
    const rest = num % 1000000000;
    return (
      numberToEnglish(billion) +
      " billion" +
      (rest ? " " + numberToEnglish(rest) : "")
    ).trim();
  };

  const handlePrint = () => {
    if (!invoice) {
      toast.error("Aucun reçu à imprimer");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error(
        "Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups."
      );
      return;
    }

    // Generate table rows for line items
    const lineItemsRows =
      invoice.lineItems && invoice.lineItems.length > 0
        ? invoice.lineItems
            .map(
              (item, index) => `
        <tr style="border-bottom: 1px solid #fed7aa;">
          <td style="padding: 8px; font-weight: 600; color: #000;">${
            index + 1
          }</td>
          <td style="padding: 8px; font-weight: 500; color: #000;">${
            item.description
          }</td>
          <td style="padding: 8px; text-align: center; font-weight: 600;">${
            item.quantity
          }</td>
          <td style="padding: 8px; text-align: right;">${formatCurrency(
            item.unitPrice
          )}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #000;">${formatCurrency(
            item.unitPrice * item.quantity
          )}</td>
        </tr>
      `
            )
            .join("")
        : `
        <tr>
          <td colspan="5" style="padding: 32px; text-align: center; color: #000;">Aucun article trouvé</td>
        </tr>
      `;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma Invoice - ${invoice.invoiceNumber}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 20px;
              color: #000;
              background: white;
            }
            body {
              padding: 16px;
              max-width: 1200px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 10px solid #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .header-left img {
              width: 60px;
              height: 100px;
              object-fit: contain;
            }
            .header-info {
              font-size: 12px;
              color: #000;
              line-height: 1.5;
            }
            .invoice-info {
              display: flex;
              gap: 16px;
              margin-bottom: 12px;
            }
            .invoice-info-left {
              font-size: 12px;
              display: flex;
              gap: 16px;
            }
            .invoice-info-right {
              font-size: 12px;
              text-align: right;
              margin-left: auto;
            }
            .commodity-title {
              font-size: 14px;
              font-weight: bold;
              margin: 16px 0 8px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            thead tr {
              background-color: #f0f0f0;
              border-bottom: 2px solid #000;
              border-top: 2px solid #000;
            }
            th {
              padding: 8px;
              font-weight: 600;
              color: #000;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            th.text-center {
              text-align: center;
            }
            th.text-right {
              text-align: right;
            }
            tbody tr {
              border-bottom: 1px solid #000;
            }
            tbody tr:hover {
              background-color: #000;
            }
            td {
              padding: 8px;
              font-size: 14px;
            }
            td.text-center {
              text-align: center;
            }
            td.text-right {
              text-align: right;
            }
            .total-section {
              border-top: 2px solid #000;
              padding-top: 8px;
              display: flex;
              justify-content: flex-end;
            }
            .total-wrapper {
              text-align: right;
              width: 256px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 8px;
            }
            .total-label {
              font-size: 16px;
              font-weight: bold;
              color: #000;
            }
            .total-value {
              font-size: 16px;
              font-weight: bold;
              color: #000;
            }
            .total-fob {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 8px 0;
              margin: 8px 0;
            }
            .total-fob-text {
              font-size: 14px;
              font-weight: 600;
              color: #000;
            }
            .footer {
              margin-top: 8px;
            }
            .footer-section {
              margin-bottom: 12px;
            }
            .footer-title {
              font-size: 12px;
              font-weight: 600;
              color: #000;
              text-transform: capitalize;
              border-bottom: 1px solid #000;
              width: fit-content;
              margin-bottom: 4px;
            }
            .footer-text {
              font-size: 12px;
              margin: 4px 0;
            }
            .footer-bold {
              margin-left: 12px;
              margin-top: 4px;
              margin-bottom: 4px;
            }
            .footer-bold p {
              font-weight: bold;
              margin: 4px 0;
            }
            .signature-section {
              margin-top: 8px;
            }
            .signature-text {
              font-size: 12px;
              margin-bottom: 4px;
            }
            .signature-company {
              font-size: 10px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .signature-images {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .signature-left {
              display: flex;
              flex-direction: column;
            }
            .signature-left img {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 150px;
            }
            .signature-right {
              margin-left: 8px;
              margin-bottom: -30px;
            }
            .signature-right img {
              width: 100px;
              height: 100px;
              object-fit: contain;
            }
            .signature-name {
              font-size: 14px;
              font-weight: 600;
              margin-top: 4px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <img src="${window.location.origin}/sistre1.png" alt="Logo" />
              <div class="header-info">
                SISTRE GLOBAL SOURCING PTE LTD To Wholesale Industriial,
                Construction and Related Machinery and Equipment N.E.C –
                Wholesale of parts and accessories for vehicles Address : 9
                Raffles Place, #29-05, Republic Plaza, Singapore 048619 Email :
                weifong@corpnd.com Registration No. 202550388K
              </div>
            </div>
          </div>

          <div class="invoice-info">
            <div class="invoice-info-left">

              <div style="font-size: 12px; margin-bottom: 4px;">
              To
              </div>

              <div style="font-size: 12px;">
                KPANDJI AUTOMOBILES <br />
                Abidjan, Abobo Garage Ecole <br />
                KOUAME N'DA N'GORAN BERNARD <br />
                +2250544100000
              </div>

            </div>
            <div class="invoice-info-right">
              <div style="font-size: 12px;">
                PI No : ${invoice.invoiceNumber} <br />
                Date: ${formatDate(invoice.invoiceDate)} <br />
                Total: 1 Page
              </div>
            </div>
          </div>

          <div class="commodity-title">Commodity:</div>
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Description</th>
                <th class="text-center">Quantité</th>
                <th class="text-right">Prix Unitaire</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsRows}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-wrapper">
              <div class="total-row">
                <span class="total-label">Total:</span>
                <span class="total-value">${formatCurrency(
                  invoice.total
                )}</span>
              </div>
            </div>
          </div>

          <div class="total-fob">
            <div class="total-fob-text">
              TOTAL FOB SHANGHAI, China : USD $${formatCurrency(
                invoice.total
              )} (SAY US DALLAR ${numberToEnglish(
      Math.floor(invoice.total)
    )} ONLY)
            </div>
          </div>

          <div class="footer">
            <div class="footer-section">
              <div class="footer-title">* Terms and Conditions apply: 100% TT</div>
              <div class="footer-text">a) Place of delivery: Port Abidjan, Côte d'Ivoire</div>
              <div class="footer-text">b) Time of delivery: Shipment within 30 days after receipt the total payment.</div>
              <div class="footer-text">
                Terms of payment: Buyer shall pay Seller the total payment by T/T within 5 days after signing the PROFORMA INVOICE by two parties, which is $${formatCurrency(
                  invoice.total
                )} (SAY US DOLLAR ${numberToEnglish(
      Math.floor(invoice.total)
    ).toUpperCase()} ONLY)
              </div>
              <div class="footer-text">c) Account:</div>
              <div class="footer-bold">
                <p>Company name : SISTRE GLOBAL SOURCING PTE LTD</p>
                <p>Bank Name : The Currency Cloud Limited</p>
                <p>Bank Address : 12 Steward Street, The Steward Building, London, E1 6FQ, GB</p>
                <p>Account Number : GB20TCCL04140462923432 (USD)</p>
                <p>Swift code : TCCLGB3L</p>
                <p style="margin-top: 8px;"><strong>Intermediary Bank</strong></p>
                <p>Bank Name : Barclays Bank PLC, London</p>
                <p>Swift Code : BARCGB22XXX</p>
              </div>
              <div class="footer-text">d) Packing : Packing shall be in accordance with the Sales Contract signed by both parties.</div>
              <div class="footer-text">e) Validity : Within 30 days</div>
              <div class="footer-text">f) Country of origin : China</div>
              <div class="footer-text">g) Warranty: 36 months or 100,000 km which comes first, details refers to Service Agreement.</div>
              <div class="footer-text">h) Remarks</div>
            </div>

            <div class="signature-section">
              <div class="signature-text">Your faithfully</div>
              <div class="signature-company">SISTRE GLOBAL SOURCING PTE LTD</div>
              <div class="signature-images">
                <div class="signature-left">
                  <img src="${
                    window.location.origin
                  }/sistre2.png" alt="Signature" />
                  <div class="signature-line"></div>
                </div>
                <div class="signature-right">
                  <img src="${
                    window.location.origin
                  }/sistre3.png" alt="Signature" />
                </div>
              </div>
              <div class="signature-name">YONG WEI FONG</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200/60 bg-white/80 px-10 py-12 shadow-lg backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-slate-600">
            Chargement du reçu...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button
            onClick={() => router.push("/manager/sistre")}
            variant="outline"
            className="border-amber-300 text-slate-800 hover:bg-amber-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Card className="border-red-200/80 shadow-xl">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
              <div className="rounded-full bg-red-100 p-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xl font-semibold text-slate-900">
                Reçu introuvable
              </p>
              {error && (
                <p className="max-w-md text-sm text-red-600">{error}</p>
              )}
              <Badge variant="outline" className="font-mono text-xs">
                ID: {invoiceId}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const hasLineItems = invoice.lineItems && invoice.lineItems.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60">
      <div className="print-hide sticky top-0 z-20 border-b border-amber-200/60 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <Button
            onClick={() => router.push("/manager/sistre")}
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-300 text-slate-800 hover:bg-amber-50 sm:size-default"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Retour</span>
          </Button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0 text-amber-600" />
              <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                PI {invoice.invoiceNumber}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {formatDate(invoice.invoiceDate)}
            </p>
          </div>

          <Button
            onClick={handlePrint}
            size="sm"
            className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-600 sm:size-default"
          >
            <Printer className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card
          id="printable-area"
          className="overflow-hidden border-0 shadow-xl shadow-amber-100/50"
        >
          <CardContent className="p-4 text-black sm:p-6 lg:p-8">
            <div className="border-b-2 border-black pb-4 sm:pb-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                <Image
                  src="/sistre1.png"
                  alt="Logo SISTRE"
                  width={60}
                  height={100}
                  className="h-auto w-12 shrink-0 sm:w-[60px]"
                />
                <p className="text-center text-[11px] leading-relaxed text-black sm:text-left sm:text-xs">
                  SISTRE GLOBAL SOURCING PTE LTD To Wholesale Industriial,
                  Construction and Related Machinery and Equipment N.E.C –
                  Wholesale of parts and accessories for vehicles Address : 9
                  Raffles Place, #29-05, Republic Plaza, Singapore 048619 Email
                  : weifong@corpnd.com Registration No. 202550388K
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  To
                </p>
                <p className="text-xs leading-relaxed sm:text-sm">
                  KPANDJI AUTOMOBILES <br />
                  Abidjan, Abobo Garage Ecole <br />
                  KOUAME N’DA N’GORAN BERNARD <br />
                  +2250544100000
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:text-right">
                <div className="mb-2 flex items-center gap-2 sm:justify-end">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Proforma Invoice
                  </span>
                </div>
                <p className="text-xs leading-relaxed sm:text-sm">
                  PI No : {invoice.invoiceNumber} <br />
                  Date: {formatDate(invoice.invoiceDate)} <br />
                  Total: 1 Page
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold sm:text-base">
                <span className="h-1 w-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                Commodity
              </h3>

              <div className="space-y-3 sm:hidden">
                {hasLineItems ? (
                  invoice.lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="shrink-0 border-amber-300 bg-amber-50 text-amber-800"
                        >
                          #{index + 1}
                        </Badge>
                        <span className="text-right text-sm font-bold text-amber-600">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug">
                        {item.description}
                      </p>
                      <Separator className="my-3 bg-amber-100" />
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-800">
                            QuantitÃ©
                          </span>
                          <p className="mt-0.5 font-bold text-black">
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-800">
                            Prix unitaire
                          </span>
                          <p className="mt-0.5 font-medium text-black">
                            {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                    Aucun article trouvÃ©
                  </div>
                )}
              </div>

              <div className="custom-scrollbar hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-amber-200/60 bg-gradient-to-r from-gray-50 via-amber-50/60 to-orange-50/40">
                      <TableHead className="py-3 text-xs font-extrabold uppercase tracking-wide">
                        NÂ°
                      </TableHead>
                      <TableHead className="py-3 text-xs font-extrabold uppercase tracking-wide">
                        Description
                      </TableHead>
                      <TableHead className="py-3 text-center text-xs font-extrabold uppercase tracking-wide">
                        QuantitÃ©
                      </TableHead>
                      <TableHead className="py-3 text-right text-xs font-extrabold uppercase tracking-wide">
                        Prix Unitaire
                      </TableHead>
                      <TableHead className="py-3 text-right text-xs font-extrabold uppercase tracking-wide">
                        Montant
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hasLineItems ? (
                      invoice.lineItems.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="transition-colors hover:bg-amber-50/40"
                        >
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="max-w-xs font-medium lg:max-w-md">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-amber-600">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-slate-500"
                        >
                          Aucun article trouvÃ©
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="text-lg font-bold text-amber-800 sm:text-xl">
                  Total:
                </span>
                <span className="text-2xl font-bold text-amber-600 sm:text-3xl">
                  ${formatCurrency(invoice.total)}
                </span>
              </div>
            </div>

            <div className="mt-4 border-y border-black py-3 sm:py-4">
              <p className="text-xs font-semibold leading-relaxed sm:text-sm">
                TOTAL FOB SHANGHAI, China : USD $
                {formatCurrency(invoice.total)} (SAY US DALLAR{" "}
                {numberToEnglish(Math.floor(invoice.total))} ONLY)
              </p>
            </div>

            <div className="mt-6 space-y-2.5 text-xs leading-relaxed sm:text-sm">
              <p className="w-fit border-b border-black pb-1 text-sm font-semibold capitalize">
                * Terms and Conditions apply: 100% TT
              </p>
              <p>a) Place of delivery: Port Abidjan, CÃ´te d&apos;Ivoire</p>
              <p>
                b) Time of delivery: Shipment within 30 days after receipt the
                total payment.
              </p>
              <p>
                Terms of payment: Buyer shall pay Seller the total payment by
                T/T within 5 days after signing the PROFORMA INVOICE by two
                parties, which is ${formatCurrency(invoice.total)} (SAY US
                DOLLAR{" "}
                {numberToEnglish(Math.floor(invoice.total)).toUpperCase()}{" "}
                ONLY)
              </p>
              <p>c) Account:</p>
              <div className="ml-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50/50 p-3 font-bold sm:ml-4">
                <p>Company name : SISTRE GLOBAL SOURCING PTE LTD</p>
                <p>Bank Name : The Currency Cloud Limited</p>
                <p>
                  Bank Address : 12 Steward Street, The Steward Building,
                  London, E1 6FQ, GB
                </p>
                <p>Account Number : GB20TCCL04140462923432 (USD)</p>
                <p>Swift code : TCCLGB3L</p>
                <p className="mt-2">
                  <strong>Intermediary Bank</strong>
                </p>
                <p>Bank Name : Barclays Bank PLC, London</p>
                <p>Swift Code : BARCGB22XXX</p>
              </div>
              <p>
                d) Packing : Packing shall be in accordance with the Sales
                Contract signed by both parties.
              </p>
              <p>e) Validity : Within 30 days</p>
              <p>f) Country of origin : China</p>
              <p>
                g) Warranty: 36 months or 100,000 km which comes first, details
                refers to Service Agreement.
              </p>
              <p>h) Remarks</p>
            </div>

            <div className="mt-8 border-t border-amber-100 pt-6">
              <p className="text-sm">Your faithfully</p>
              <p className="text-sm font-semibold">
                SISTRE GLOBAL SOURCING PTE LTD
              </p>
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <div className="flex flex-col">
                  <Image
                    src="/sistre2.png"
                    alt="Signature"
                    width={70}
                    height={70}
                    className="h-auto w-16 sm:w-[70px]"
                  />
                  <div className="mt-1 w-36 border-t border-black sm:w-48" />
                </div>
                <Image
                  src="/sistre3.png"
                  alt="Signature stamp"
                  width={100}
                  height={100}
                  className={cn(
                    "h-auto w-20 sm:ml-2 sm:w-[100px]",
                    "sm:-mb-6"
                  )}
                />
              </div>
              <p className="mt-4 text-sm font-semibold sm:mt-2">
                YONG WEI FONG
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
