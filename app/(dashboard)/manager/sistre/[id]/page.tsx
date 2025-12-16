"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSistreInvoice, type SistreInvoice } from "@/lib/actions/sistre";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        console.log("Fetching invoice with ID:", invoiceId);
        const result = await getSistreInvoice(invoiceId);
        console.log("Invoice result:", result);

        if (result.success && result.data) {
          console.log("Invoice data:", result.data);
          setInvoice(result.data);
          setError(null);
        } else {
          console.error("Failed to fetch invoice:", result.error);
          setError(result.error || "Erreur lors du chargement du reçu");
          toast.error(result.error || "Erreur lors du chargement du reçu");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
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
      console.error("No invoice ID provided");
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Chargement du reçu...</p>
        </div>
      </div>
    );
  }

  if (!invoice && !loading) {
    return (
      <div className="flex flex-col w-full p-8">
        <div className="mb-6">
          <Button
            onClick={() => router.push("/manager/sistre")}
            variant="outline"
            className="border-black text-black hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <p className="text-xl font-semibold text-black">
                Reçu introuvable
              </p>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <p className="text-gray-500 text-sm">ID: {invoiceId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
        <div className=" print-hide">
          <Button
            onClick={() => router.push("/manager/sistre")}
            variant="outline"
            className="border-black text-black hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <div
          id="printable-area"
          className="bg-white rounded-lg  p-4 max-w-5xl mx-auto w-full"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2 pb-2 border-b-2 border-black">
            <div className="flex items-center gap-6">
              <Image src="/sistre1.png" alt="Logo" width={60} height={100} />
              <div className="text-xs text-black">
                SISTRE GLOBAL SOURCING PTE LTD To Wholesale Industriial,
                Construction and Related Machinery and Equipment N.E.C –
                Wholesale of parts and accessories for vehicles Address : 9
                Raffles Place, #29-05, Republic Plaza, Singapore 048619 Email :
                weifong@corpnd.com Registration No. 202550388K
              </div>
            </div>
            <div className="text-right print-hide">
              <Button
                onClick={handlePrint}
                className="print-hide bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold shadow-md"
              >
                Imprimer
              </Button>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-4 text-black w-full">
            <div className="flex w-full flex-nowrap gap-x-2">
              <div className="text-xs">To</div>

              <div className="flex justify-between w-full">
                <p className="text-xs">
                  KPANDJI AUTOMOBILES <br />
                  Abidjan, Abobo Garage Ecole <br />
                  KOUAME N’DA N’GORAN BERNARD <br />
                  +2250544100000
                </p>

                <p className="text-xs">
                  PI No : {invoice.invoiceNumber} <br />
                  Date: {formatDate(invoice.invoiceDate)} <br />
                  Total: 1 Page
                </p>
              </div>
            </div>
            <div className="text-sm my-4 font-bold">Commodity:</div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 via-amber-50/60 to-orange-50/40 border-b-2 border-gray-200 text-balck">
                  <TableHead className="font-extrabold  py-2 text-sm uppercase tracking-wide">
                    N°
                  </TableHead>
                  <TableHead className="font-extrabold  py-2 text-sm uppercase tracking-wide">
                    Description
                  </TableHead>
                  <TableHead className="font-extrabold  py-2 text-center text-sm uppercase tracking-wide">
                    Quantité
                  </TableHead>
                  <TableHead className="font-extrabold  py-2 text-right text-sm uppercase tracking-wide">
                    Prix Unitaire
                  </TableHead>
                  <TableHead className="font-extrabold  py-2 text-right text-sm uppercase tracking-wide">
                    Montant
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems && invoice.lineItems.length > 0 ? (
                  invoice.lineItems.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <TableCell className="font-medium text-black">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-black">
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
                      colSpan={4}
                      className="text-center text-black py-8"
                    >
                      Aucun article trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Total Section */}
          <div className="border-t-2 border-amber-400 py-2">
            <div className="flex justify-end">
              <div className="text-right space-y-2 w-64">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-bold text-amber-700">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-y border-black py-2">
            <div className="flex ">
              <div className=" w-full text-sm flex">
                <p className="text-sm font-semibold ">
                  TOTAL FOB SHANGHAI, China : USD $
                  {formatCurrency(invoice.total)} (SAY US DALLAR{" "}
                  {numberToEnglish(Math.floor(invoice.total))} ONLY)
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col w-full bottom-0 right-0 left-0">
            <div className="flex flex-col w-full mt-2 space-y-2 text-sm">
              <p className="text-sm font-semibold text-black capitalize border-b border-black w-fit ">
                * Terms and Conditions apply: 100% TT
              </p>

              <p>a) Place of delivery: Port Abidjan, Côte d&apos;Ivoire</p>

              <p>
                b) Time of delivery: Shipment within 30 days after receipt the
                total payment.
              </p>

              <p>
                Terms of payment: Buyer shall pay Seller the total payment by
                T/T within 5 days after signing the PROFORMA INVOICE by two
                parties, which is ${formatCurrency(invoice.total)} (SAY US
                DOLLAR{" "}
                {numberToEnglish(Math.floor(invoice.total)).toUpperCase()} ONLY)
              </p>

              <p>c) Account:</p>

              <div className="ml-4 space-y-1 font-bold">
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

            <div className="mt-1 space-y-2">
              <p className="text-sm">Your faithfully</p>
              <p className="text-sm font-semibold">
                SISTRE GLOBAL SOURCING PTE LTD
              </p>
              <div className="flex items-center  ">
                <div className="flex flex-col ">
                  <Image
                    src="/sistre2.png"
                    alt="Signature"
                    width={70}
                    height={70}
                  />
                  <div className="border-t border-black w-48"></div>
                </div>
                <div className="-mb-10 ml-2">
                  <Image
                    src="/sistre3.png"
                    alt="Signature"
                    width={100}
                    height={100}
                  />
                </div>
              </div>
              <p className="text-sm font-semibold ">YONG WEI FONG</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
