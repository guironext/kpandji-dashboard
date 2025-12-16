"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getSistreInvoice, type SistreInvoice } from "@/lib/actions/sistre";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SalesContractPage() {
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
          setError(result.error || "Error loading invoice");
          toast.error(result.error || "Error loading invoice");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An error occurred while loading";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    } else {
      toast.error("Invoice ID missing");
      router.push("/manager/sistre");
    }
  }, [invoiceId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const daySuffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";
    return `${month} ${day}${daySuffix}. ${year}`;
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${day}/${month}`;
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

 

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Loading contract...</p>
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
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold text-gray-700">
            Contract not found
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const contractNumber = `SGS-CIV/25/${
    invoice.invoiceNumber.split("/").pop() || "001"
  }`;
  const totalAmount = invoice.total;
  const totalInWords = numberToEnglish(Math.floor(totalAmount))
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const handlePrint2 = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const baseUrl = window.location.origin;
    const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Contract - Print</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      counter-reset: page;
    }
    
    .page {
      width: 21cm;
      min-height: 29.7cm;
      padding: 2cm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
      position: relative;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      counter-increment: page;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .page-number {
      position: absolute;
      bottom: 1cm;
      right: 2cm;
      font-size: 10pt;
      color: #666;
    }
    
    .page-number::after {
      content: "Page " counter(page);
    }
    
    h1 {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 1.5cm;
      text-transform: uppercase;
    }
    
    .header-info {
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
      margin-bottom: 1cm;
    }
    
    .parties {
      display: flex;
      width: 100%;
      justify-content: space-between;
      margin-bottom: 1cm;
      font-size: 10pt;
    }
    
   
    
    .party-title {
      font-weight: bold;
     
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.5cm 0;
      font-size: 10pt;
    }
    
    table th,
    table td {
      border: 1px solid #000;
      padding: 0.3cm;
      text-align: left;
    }
    
    table th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    
    table td.text-right {
      text-align: right;
    }
    
    table td.text-center {
      text-align: center;
    }
    
    .section {
      margin-bottom: 0.8cm;
      font-size: 10pt;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 0.3cm;
    }
    
    .section-content {
      margin-left: 0.5cm;
    }
    
    .section-content p {
      margin-bottom: 0.3cm;
    }
    
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 2cm;
      margin-bottom: 2cm;
    }
    
    .signature-block {
      width: 48%;
    }
    
    .signature-block p {
      margin-bottom: 0.3cm;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      width: 8cm;
      margin-top: 1cm;
      margin-bottom: 0.3cm;
    }
    
    @media print {
      body {
        background: white;
      }
      
      .page {
        box-shadow: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>SALES CONTRACT</h1>
    
    <div class="header-info">
      <div>
        <p><strong>CONTRACT NO: ${contractNumber}</strong></p>
      </div>
      <div>
        <p><strong>DATE: ${formatDate(invoice.invoiceDate)}</strong></p>
      </div>
    </div>
    
    <div class="parties">
      <div class="party">
        <p class="party-title">SELLER: SISTRE GLOBAL SOURCING PTE LTD</p>
        <p>Address: 9 Raffles Place, #29-05, Republic Plaza, Singapore 048619</p>
        <p>Tel: +852 9889 3529</p>
      </div>
      
      <div class="party">
        <p class="party-title">BUYER: KPANDJI AUTOMOBILES</p>
        <p>Address: Abidjan, Abobo Garage Ecole</p>
        <p>Tel: +225-05-44-10-00-00</p>
      </div>
    </div>
    
    <p style="margin-bottom: 0.8cm;">
      The undersigned Seller and Buyer have agreed to close the following
      transactions according to the terms and conditions set forth as below:
    </p>
    
    <div class="section">
      <p class="section-title">1. COMMODITY:</p>
      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Description</th>
            <th>Qty</th>
            <th>U/Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>Brand Name : ${item.description}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.unitPrice)}</td>
              <td class="text-right">${formatCurrency(item.unitPrice * item.quantity)}</td>
            </tr>
          `).join("")}
          <tr>
            <td></td>
            <td></td>
            <td class="text-center">${invoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
            <td></td>
            <td class="text-right"><strong>${formatCurrency(totalAmount)}</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 0.5cm;">
        TOTAL FOB SHANGHAI, China : USD $${formatCurrency(totalAmount)} (SAY US DOLLAR ${totalInWords.toUpperCase()} ONLY)
      </p>
    </div>
    <div class="section">
      <p class="section-title">2. TOTAL CONTRACT VALUE : $${formatCurrency(totalAmount)} (SAY US DOLLAR ${totalInWords.toUpperCase()} ONLY).</p>
    </div>
    
    <div class="section">
      <p class="section-title">3. TERMS OF DELIVERY : FOB Qingdao, China, in accordance with INCOTERMS®2010</p>
    </div>
    
    <div class="section">
      <p class="section-title">4. COUNTRY OF ORIGIN : P.R.China</p>
    </div>
    
    <div class="section">
      <p class="section-title">5. PACKING :</p>
      <p class="section-content">The packing shall be responsible by the Seller, and the packing is according to the packing Scheme of the Seller.</p>
    </div>
    
    <div class="section">
      <p class="section-title">6. SHIPPING MARK : N/M</p>
    </div>
    
    <div class="page-number"></div>
  </div>
  
  <div class="page">
    
    
    <div class="section">
      <p class="section-title">7. TERMS OF PAYMENT :</p>
      <p class="section-content">
        Buyer shall pay Seller the deposit by T/T within 15 days after signing the Sale Contract by two parties, which is USD $${formatCurrency(totalAmount)} (SAY US DOLLAR ${totalInWords.toUpperCase()} ONLY) shall be paid by T/T within 15 days after receiving the notification of commodity production completion from Seller.
      </p>
      <p class="section-content">
        Any bank charges incurred in P.R.China (excluding Hong Kong, Macao and Taiwan) shall be borne by the Seller.
      </p>
      <p class="section-content">
        Any bank charges incurred outside P.R.China (excluding Hong Kong, Macao and Taiwan) shall be borne by the Buyer.
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">8. INSURANCE :</p>
      <p class="section-content">Insurance for the commodity shipment shall be covered by the Buyer.</p>
    </div>
    
    <div class="section">
      <p class="section-title">9. TIME OF SHIPMENT :</p>
      <p class="section-content">By sea, nude Cargo. Shipment within 50 days after the deposit received.</p>
    </div>
    <div class="section">
      <p class="section-title">10. TERMS OF DELIVERY:</p>
      <p class="section-content">
        10.1. Upon Seller receipt of the deposit, the Seller shall complete the production in compliance with the description of the commodity in this Sales Contract, and shall arrange delivery in a reasonable time upon production completion upon Seller receipt of full payment.
      </p>
      <p class="section-content">
        10.2. Should the freight agency be designated by the Buyer, the Buyer must demand its agency to deliver the Bill of Lading to the Seller. Otherwise, the Buyer shall be held accountable of any consequences thereof.
      </p>
      <p class="section-content">
        10.3.The Seller shall send the Buyer sufficient and timely shipping notice, to enable the Buyer to purchase insurance and acquire the commodity on time.
      </p>
      <p class="section-content">
        10.4.The Seller shall present the following documents with three sets of copies to the Buyer：
      </p>
      <p class="section-content" style="margin-left: 1cm;">
        - Full set of clean on Board Ocean Bills of Lading.<br>
        - Original Commercial Invoice<br>
        - Original Packing List
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">11. BANK INFORMATION :</p>
      <p class="section-content">
        Company name : SISTRE GLOBAL SOURCING PTE LTD<br>
        Bank Name : The Currency Cloud Limited<br>
        Bank Address : 12 Steward Street, The Steward Building, London, E1 6FQ, GB<br>
        Account Number : GB20TCCL04140462923432 (USD)<br>
        Swift code : TCCLGB3L<br>
        <strong>Intermediary Bank</strong><br>
        Bank Name : Barclays Bank PLC, London<br>
        Swift Code : BARCGB22XXX
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">12. PORT OF SHIPMENT : Any port, P.R.China</p>
    </div>


    <div class="page-number"></div>
  </div>
  
  <div class="page">
    
    
    <div class="section">
      <p class="section-title">13. PORT OF DESTINATION : Abidjan PORT, Cote D'lvoire</p>
    </div>
    
    <div class="section">
      <p class="section-title">14. PARTIAL SHIPMENT : Allowed</p>
    </div>
    
    <div class="section">
      <p class="section-title">15. TRANSSHIPMENT : Allowed</p>
    </div>
    <div class="section">
      <p class="section-title">16. INSPECTION :</p>
      <p class="section-content">
        <strong>16.1 The Seller's responsibility:</strong><br>
        16.1.1 If the Buyer has sufficient evidence to prove that the parts are wrongly shipped or less shipped when unpacked due to Seller's delivery reasons; the quality responsibility of the parts that do not exceed claim period..<br>
        16.1.2 The Seller should not responsible for the loss, damages, of the commodity during deliveries. They should be claimed from the Insurance company by the Buyer.
      </p>
      <p class="section-content">
        <strong>16.2 The Buyer's responsibility:</strong><br>
        16.2.1 If the Buyer has any issues to the quantity of the commodity: the Buyer should present the issue within 15 days from the date of arrival of the commodity; and only after confirmation by the Seller, the Seller shall replace the wrong or less shipped parts free of charge (the Seller shall not bear the freight charges).<br>
        16.2.2 If the Buyer has any issues to the quality of the commodity: the Buyer must present the issue within 45 days from the date of arrival of the commodity; and only after confirmation by the Seller, the Seller shall replace the defective parts free of charge (the Seller shall not bear the freight charges).<br>
        16.2.3 The Buyer shall responsible for the exterior damage or quality defect of the commodity caused by unpacking; and to be responsible for the loss or damage of parts caused by improper operation by the Buyer's workers in the assembly process.<br>
        16.2.4 The claim for one lot of commodity shall not be regarded as the reason for the Buyer to refuse receipt of or paying for other supplied commodity stipulated in the contract.
      </p>
      <p class="section-content">
        <strong>16.3 Claiming confirmation:</strong><br>
        The claims confirmation list for all quantity and quality claims shall be provided by the Buyer to the Seller for once only. After the confirmation of claim, the Seller will not accept any other claim related to this Sales Contract in principle.
      </p>
      <p class="section-content">
        <strong>16.4</strong> The two parties confirm the mode of delivery according to the claiming parts quantity and weight. When the weight below 80kg, the Seller will send the parts by air to the Buyer's plant (mode of delivery: door to port), and afford the charges till the parts arrive the destination port; when the weight more than 80kg, the Seller will send the parts to the plant in China which is appointed by the Buyer (mode of delivery: by land).
      </p>
    </div>


    
    <div class="page-number"></div>
  </div>
  
  <div class="page">
    <div class="section">
      <p class="section-title">17. AFTER-SALES SERVICE :</p>
      <p class="section-content">
        17.1. Labor Rate=USD16/hour, Parts Cost=FOB price*1.3.<br>
        17.2. Spare parts warranty policy see Attachment.<br>
        17.3. Buyer shall submit all occurred quality warranty information of the previous month on DMS system before 10th of each month in order to be audited and accounted by the Seller before any claims payment made. The Seller shall audit warranty claims confirmation before 30th and settle the accounts within 10 days after receive the confirmation letter and invoice from the Buyer. Claims payment will not be made for overdue warranty.<br>
        17.4. The Buyer shall keep the warranted defective parts for not less than six months for the Seller's confirmation. During this period, if the Seller does not send personnel to the Buyer to resolve the parts defect, the Buyer shall dispose the parts and need not to delivery them back.<br>
        17.5. The Seller's liability for warranty claims shall not exceed the value of the faulty parts of the faulty vehicle.
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">18. CONTRACT LIABILITY :</p>
      <p class="section-content">
        18.1 The Seller shall only accept claims from the Buyer in accordance with this sales contract and shall not accept claims from any third parties and/or vehicle users; pursuant to this sales contract, claimable amount by the Buyer from the Seller shall not exceed the non-conformity quality of commodity parts and spare parts total value supplied by The Seller; The Seller shall not be liable for the Buyer's investment funds, equipment, personnel direct and/or indirect losses and the Buyer's expected losses on vehicle assembling and selling during the performance of this Sales Contract.
      </p>
      <p class="section-content">
        18.2 The Buyer warrants that it has complete and comprehensive understandings and has behaved and/or carried out its operations in strict accordance with the laws and regulations in the Ghana. Before selling, the Buyer shall establish its own whole vehicle quality standard, whole vehicle inspection and acceptance standards and assemble vehicles according to such standards and make necessary and enough adaptability tests to make sure that the assembled vehicles meet the requirements of the local laws, regulations and quality standard. The quality of the vehicles assembled by the Buyer and the quality defects of the commodity parts caused in welding and assembling should be bear by the Buyer.
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">19. LAW APPLICATION :</p>
      <p class="section-content">This Sales Contract shall be governed by the laws of the People's Republic of China.</p>
    </div>
    <div class="section">
      <p class="section-title">20. FORCE MAJEURE :</p>
      <p class="section-content">
        Neither party shall be held responsible for commodity delivery delay or failure to perform all or any part of obligations under this Sales Contract due to force majeure. The party affected by the event shall inform the other party of its occurrence in writing as soon as possible and thereafter sends a certificate of the event issued by the relevant authority to the other party.
      </p>
      <p class="section-content">
        However, the party affected by the event should try its best to prevent further loss whether it has known or it should have been known, and if such further loss occurred hereunder, any liability should be undertaken by the party affected by the event.
      </p>
    </div>
    
    <div class="page-number"></div>
  </div>
  
  <div class="page">
    
    
    <div class="section">
      <p class="section-title">21. DEFAULT CLAUSE :</p>
      <p class="section-content">
        The Buyer shall be liable for the Seller's loss (such as funds tied up, exchange rate fluctuation losses, etc.) due to delay on payments or commodity take over. As such, the Buyer should pay the Seller 1％ of total contract value as detention fee if the detention time is above 20 days. The Buyer should pay the Seller 2％ of total contract value per day as detention fee if the detention time is above 40 days. If detention time is above 60 days, the down payment from the Buyer should be taken as liquidated damages, the Seller has the rights to dispose the commodity without notification to the Buyer; additionally, the Seller reserve the rights to claim insufficient portion of detention fee versus down payment and the Seller reserve the right to terminate this Sales Contract. If the detention time does not exceed 60 days, but the down payment is less than detention fee, the Seller has the rights to dispose the commodity and to terminate this Sales Contract.
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">22. CONTRACT MODIFICATION :</p>
      <p class="section-content">
        22.1. The terms and conditions of this contract constitute a full and final understanding to the commodity under this Sales Contract by both the Seller and the Buyer. Any modification, supplementation and/or rescission to this contract must be bound to the confirmation in writing and to be signed and sealed by both parties, otherwise it shall be accounted invalid.
      </p>
      <p class="section-content">
        22.2. Neither this Sales Contract hereof nor any interest and/or obligation therein shall be assigned without the Seller's prior written consent.
      </p>
    </div>
    
    <div class="page-number"></div>
  </div>
  
  <div class="page">
    <div class="section">
      <p class="section-title">23. ARBITRATE CLAUSE :</p>
      <p class="section-content">
        Any dispute in connection with or arising from this contract shall be settled amicably through negotiation. In case no settlement can be reached between the two parties, the case shall be referred to China International Economic and Trade Arbitration Commission, Beijing for arbitration in accordance with its existing Rules of Arbitration, and it should also refer to the existing law of the People's Republic of China to settle all the issues related to the arbitration. The arbitral award is final and binding upon both parties.
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">24. CONTRACT VERSIONS :</p>
      <p class="section-content">Both Chinese and English versions of this Sales Contract have equal legal force.</p>
    </div>
    
    <div class="section">
      <p class="section-title">25. CONTRACT VALIDITY :</p>
      <p class="section-content">
        25.1. This Sales Contract shall come into force after signed and sealed by both parties before Aug, 30th, 2025.<br>
        25.2. This Sales Contract shall come into force from its effective date and shall come to be invalid once both parties complete the rights and obligations hereof.
      </p>
    </div>
    
    <div class="section">
      <p class="section-title">26. TRADEMARK CLAUSE :</p>
      <p class="section-content">
        Trademark and the name of the commodity under this contract are the property right of the Seller. Without written authorization from the Seller, the Buyer should not register the trademark, logo and product name of the Seller in the territory or any other countries or areas. The Buyer can only use the logo and product name of the Seller in advertising and other articles relative to selling of the Seller's automobiles.
      </p>
    </div>
    
    <div class="page-number"></div>
  </div>
  
  <div class="page">
    <div class="section">
      <p class="section-title">27. OTHER PROVISIONS :</p>
      <p class="section-content">
        27.1. Considering the special condition of international business, fax or scan of this Sales Contract shall have legal effect.<br>
        27.2. This Sales Contract shall have the final legal force and effect and shall preside any discrepancy arise between this Sales Contract and any Proforma Invoice entered by both parties,<br>
        27.3. In witness thereof, this Sales Contract shall come into effect immediately after it is signed and/or stamped by both parties in two original copies and each party holds one. All the attachments of this Sales Contract are the integral part of this Sales Contract and shall have the same legal effect.<br>
        27.4. After the entering of this Sales Contract, if the Buyer fails to perform payment as agreed under this Sales Contract and the Seller fails to reaffirm the validity of this Sales Contract, this Sales Contract shall be automatically terminated.
      </p>
    </div>
    
    <div class="signatures">
      <div class="signature-block">
        <p><strong>SELLER:</strong></p>
        <p><strong>SISTRE GLOBAL SOURCING PTE LTD</strong></p>
        <p>Name of the authorized representative:</p>
        <p style="margin-bottom: 0.5cm;">YONG WEI FONG</p>
        <div style="display: flex; gap: 1cm; margin-bottom: 0.5cm;">
          <img src="${baseUrl}/sistre2.png" alt="Seller signature" style="max-width: 100px; max-height: 100px; object-fit: contain;" />
          <img src="${baseUrl}/sistre3.png" alt="Seller signature" style="max-width: 100px; max-height: 100px; object-fit: contain;" />
        </div>
        <div class="signature-line"></div>
        <p>Seal and signature:</p>
        <p style="margin-top: 0.5cm;">Date: ${formatDateShort(invoice.invoiceDate)}</p>
      </div>
      
      <div class="signature-block">
        <p><strong>BUYER:</strong></p>
        <p><strong>KPANDJI AUTOMOBILES</strong></p>
        <p>Name of the authorized representative:</p>
        <p style="margin-bottom: 0.5cm;">KOUAME NDA NGORAN BERNARD</p>
        <div style="display: flex; gap: 1cm; margin-bottom: 0.5cm;">
          <img src="${baseUrl}/sistre4.png" alt="Buyer signature" style="max-width: 100px; max-height: 100px; object-fit: contain;" />
        </div>
        <div class="signature-line"></div>
        <p>Seal and signature:</p>
        <p style="margin-top: 0.5cm;">Date: ${formatDateShort(invoice.invoiceDate)}</p>
      </div>
    </div>
    
    <div class="page-number"></div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  return (
    <>
      <div className="flex flex-col w-full bg-gray-50 p-8">
        <div className="print-hide mb-4">
          <Button
            onClick={() => router.push(`/manager/sistre/${invoiceId}`)}
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handlePrint2}
            className="ml-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold shadow-md"
          >
            Print Contract
          </Button>
        </div>

        <div
          id="printable-area"
          className="bg-white rounded-lg p-8 max-w-5xl mx-auto w-full shadow-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-8">SALES CONTRACT</h1>
            <div className="flex justify-between items-start text-sm mb-6">
              <div>
                <p className="font-semibold">CONTRACT NO: {contractNumber}</p>
              </div>
              <div>
                <p className="font-semibold">
                  DATE: {formatDate(invoice.invoiceDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Seller and Buyer Info */}
          <div className="flex w-full justify-between mb-8 text-sm">

            <div>
              <p className="font-semibold mb-2">
                SELLER: SISTRE GLOBAL SOURCING PTE LTD
              </p>
              <p>
                Address: 9 Raffles Place, #29-05, Republic Plaza, Singapore
                048619
              </p>
              <p>Tel: +852 9889 3529</p>
            </div>

            <div>
              <p className="font-semibold mb-2">BUYER: KPANDJI AUTOMOBILES</p>
              <p>Address: Abidjan, Abobo Garage Ecole</p>
              <p>Tel: +225-05-44-10-00-00</p>
            </div>
          </div>

          <p className="text-sm mb-6">
            The undersigned Seller and Buyer have agreed to close the following
            transactions according to the terms and conditions set forth as
            below:
          </p>

          {/* Section 1: COMMODITY */}
          <div className="mb-6">
            <p className="font-semibold mb-2">1. COMMODITY:</p>
            <table className="w-full border-collapse border border-gray-300 text-sm mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">N°</th>
                  <th className="border border-gray-300 p-2 text-left">
                    Description
                  </th>
                  <th className="border border-gray-300 p-2 text-center">
                    Qty
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    U/Price
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">{index + 1}</td>
                    <td className="border border-gray-300 p-2">
                      Brand Name : {item.description}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2 text-center">
                    {invoice.lineItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm mb-4">
              TOTAL FOB SHANGHAI, China : USD ${formatCurrency(totalAmount)}{" "}
              (SAY US DOLLAR {totalInWords.toUpperCase()} ONLY)
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              2. TOTAL CONTRACT VALUE : ${formatCurrency(totalAmount)} (SAY US
              DOLLAR {totalInWords.toUpperCase()} ONLY).
            </p>
          </div>

          {/* Section 3 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              3. TERMS OF DELIVERY : FOB Qingdao, China, in accordance with
              INCOTERMS®2010
            </p>
          </div>

          {/* Section 4 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              4. COUNTRY OF ORIGIN : P.R.China
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              5. PACKING : The packing shall be responsible by the Seller, and
              the packing is according to the packing Scheme of the Seller.
            </p>
          </div>

          {/* Section 6 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">6. SHIPPING MARK : N/M</p>
          </div>

          {/* Section 7 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">7. TERMS OF PAYMENT :</p>
            <p className="ml-4">
              Buyer shall pay Seller the deposit by T/T within 15 days after
              signing the Sale Contract by two parties, which is USD $
              {formatCurrency(totalAmount)} (SAY US DOLLAR{" "}
              {totalInWords.toUpperCase()} ONLY) shall be paid by T/T within 15
              days after receiving the notification of commodity production
              completion from Seller.
            </p>
            <p className="ml-4 mt-2">
              Any bank charges incurred in P.R.China (excluding Hong Kong, Macao
              and Taiwan) shall be borne by the Seller.
            </p>
            <p className="ml-4 mt-2">
              Any bank charges incurred outside P.R.China (excluding Hong Kong,
              Macao and Taiwan) shall be borne by the Buyer.
            </p>
          </div>

          {/* Section 8 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              8. INSURANCE : Insurance for the commodity shipment shall be
              covered by the Buyer.
            </p>
          </div>

          {/* Section 9 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              9. TIME OF SHIPMENT : By sea, nude Cargo. Shipment within 50 days
              after the deposit received.
            </p>
          </div>

          {/* Section 10 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">10. TERMS OF DELIVERY:</p>
            <p className="ml-4">
              10.1. Upon Seller receipt of the deposit, the Seller shall
              complete the production in compliance with the description of the
              commodity in this Sales Contract, and shall arrange delivery in a
              reasonable time upon production completion upon Seller receipt of
              full payment.
            </p>
            <p className="ml-4 mt-2">
              10.2. Should the freight agency be designated by the Buyer, the
              Buyer must demand its agency to deliver the Bill of Lading to the
              Seller. Otherwise, the Buyer shall be held accountable of any
              consequences thereof.
            </p>
            <p className="ml-4 mt-2">
              10.3.The Seller shall send the Buyer sufficient and timely
              shipping notice, to enable the Buyer to purchase insurance and
              acquire the commodity on time.
            </p>
            <p className="ml-4 mt-2">
              10.4.The Seller shall present the following documents with three
              sets of copies to the Buyer：
            </p>
            <p className="ml-8 mt-1">
              - Full set of clean on Board Ocean Bills of Lading.
            </p>
            <p className="ml-8">- Original Commercial Invoice</p>
            <p className="ml-8">- Original Packing List</p>
          </div>

          {/* Section 11 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">11. BANK INFORMATION :</p>
            <p className="ml-4">
              Company name : SISTRE GLOBAL SOURCING PTE LTD
            </p>
            <p className="ml-4">Bank Name : The Currency Cloud Limited</p>
            <p className="ml-4">
              Bank Address : 12 Steward Street, The Steward Building, London, E1
              6FQ, GB
            </p>
            <p className="ml-4">
              Account Number : GB20TCCL04140462923432 (USD)
            </p>
            <p className="ml-4">Swift code : TCCLGB3L</p>
            <p className="ml-4 mt-2 font-semibold">Intermediary Bank</p>
            <p className="ml-4">Bank Name : Barclays Bank PLC, London</p>
            <p className="ml-4">Swift Code : BARCGB22XXX</p>
          </div>

          {/* Section 12 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              12. PORT OF SHIPMENT : Any port, P.R.China
            </p>
          </div>

          {/* Section 13 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              13. PORT OF DESTINATION : Abidjan PORT, Cote D&apos;lvoire
            </p>
          </div>

          {/* Section 14 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">14. PARTIAL SHIPMENT : Allowed</p>
          </div>

          {/* Section 15 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">15. TRANSSHIPMENT : Allowed</p>
          </div>

          {/* Section 16 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">16. INSPECTION :</p>
            <p className="ml-4 font-semibold">
              16.1 The Seller&apos;s responsibility:
            </p>
            <p className="ml-8">
              16.1.1 If the Buyer has sufficient evidence to prove that the
              parts are wrongly shipped or less shipped when unpacked due to
              Seller&apos;s delivery reasons; the quality responsibility of the
              parts that do not exceed claim period..
            </p>
            <p className="ml-8 mt-1">
              16.1.2 The Seller should not responsible for the loss, damages, of
              the commodity during deliveries. They should be claimed from the
              Insurance company by the Buyer.
            </p>
            <p className="ml-4 mt-2 font-semibold">
              16.2 The Buyer&apos;s responsibility:
            </p>
            <p className="ml-8">
              16.2.1 If the Buyer has any issues to the quantity of the
              commodity: the Buyer should present the issue within 15 days from
              the date of arrival of the commodity; and only after confirmation
              by the Seller, the Seller shall replace the wrong or less shipped
              parts free of charge (the Seller shall not bear the freight
              charges).
            </p>
            <p className="ml-8 mt-1">
              16.2.2 If the Buyer has any issues to the quality of the
              commodity: the Buyer must present the issue within 45 days from
              the date of arrival of the commodity; and only after confirmation
              by the Seller, the Seller shall replace the defective parts free
              of charge (the Seller shall not bear the freight charges).
            </p>
            <p className="ml-8 mt-1">
              16.2.3 The Buyer shall responsible for the exterior damage or
              quality defect of the commodity caused by unpacking; and to be
              responsible for the loss or damage of parts caused by improper
              operation by the Buyer&apos;s workers in the assembly process.
            </p>
            <p className="ml-8 mt-1">
              16.2.4 The claim for one lot of commodity shall not be regarded as
              the reason for the Buyer to refuse receipt of or paying for other
              supplied commodity stipulated in the contract.
            </p>
            <p className="ml-4 mt-2 font-semibold">
              16.3 Claiming confirmation:
            </p>
            <p className="ml-8">
              The claims confirmation list for all quantity and quality claims
              shall be provided by the Buyer to the Seller for once only. After
              the confirmation of claim, the Seller will not accept any other
              claim related to this Sales Contract in principle.
            </p>
            <p className="ml-4 mt-2 font-semibold">
              16.4 The two parties confirm the mode of delivery according to the
              claiming parts quantity and weight. When the weight below 80kg,
              the Seller will send the parts by air to the Buyer&apos;s plant
              (mode of delivery: door to port), and afford the charges till the
              parts arrive the destination port; when the weight more than 80kg,
              the Seller will send the parts to the plant in China which is
              appointed by the Buyer (mode of delivery: by land).
            </p>
          </div>

          {/* Section 17 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">17. AFTER-SALES SERVICE :</p>
            <p className="ml-4">
              17.1. Labor Rate=USD16/hour, Parts Cost=FOB price*1.3.
            </p>
            <p className="ml-4">
              17.2. Spare parts warranty policy see Attachment.
            </p>
            <p className="ml-4">
              17.3. Buyer shall submit all occurred quality warranty information
              of the previous month on DMS system before 10th of each month in
              order to be audited and accounted by the Seller before any claims
              payment made. The Seller shall audit warranty claims confirmation
              before 30th and settle the accounts within 10 days after receive
              the confirmation letter and invoice from the Buyer. Claims payment
              will not be made for overdue warranty.
            </p>
            <p className="ml-4">
              17.4. The Buyer shall keep the warranted defective parts for not
              less than six months for the Seller&apos;s confirmation. During
              this period, if the Seller does not send personnel to the Buyer to
              resolve the parts defect, the Buyer shall dispose the parts and
              need not to delivery them back.
            </p>
            <p className="ml-4">
              17.5. The Seller&apos;s liability for warranty claims shall not
              exceed the value of the faulty parts of the faulty vehicle.
            </p>
          </div>

          {/* Section 18 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">18. CONTRACT LIABILITY :</p>
            <p className="ml-4">
              18.1 The Seller shall only accept claims from the Buyer in
              accordance with this sales contract and shall not accept claims
              from any third parties and/or vehicle users; pursuant to this
              sales contract, claimable amount by the Buyer from the Seller
              shall not exceed the non-conformity quality of commodity parts and
              spare parts total value supplied by The Seller; The Seller shall
              not be liable for the Buyer&apos;s investment funds, equipment,
              personnel direct and/or indirect losses and the Buyer&apos;s
              expected losses on vehicle assembling and selling during the
              performance of this Sales Contract.
            </p>
            <p className="ml-4 mt-2">
              18.2 The Buyer warrants that it has complete and comprehensive
              understandings and has behaved and/or carried out its operations
              in strict accordance with the laws and regulations in the Ghana.
              Before selling, the Buyer shall establish its own whole vehicle
              quality standard, whole vehicle inspection and acceptance
              standards and assemble vehicles according to such standards and
              make necessary and enough adaptability tests to make sure that the
              assembled vehicles meet the requirements of the local laws,
              regulations and quality standard. The quality of the vehicles
              assembled by the Buyer and the quality defects of the commodity
              parts caused in welding and assembling should be bear by the
              Buyer.
            </p>
          </div>

          {/* Section 19 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              19. LAW APPLICATION : This Sales Contract shall be governed by the
              laws of the People&apos;s Republic of China.
            </p>
          </div>

          {/* Section 20 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">20. FORCE MAJEURE :</p>
            <p className="ml-4">
              Neither party shall be held responsible for commodity delivery
              delay or failure to perform all or any part of obligations under
              this Sales Contract due to force majeure. The party affected by
              the event shall inform the other party of its occurrence in
              writing as soon as possible and thereafter sends a certificate of
              the event issued by the relevant authority to the other party.
            </p>
            <p className="ml-4 mt-2">
              However, the party affected by the event should try its best to
              prevent further loss whether it has known or it should have been
              known, and if such further loss occurred hereunder, any liability
              should be undertaken by the party affected by the event.
            </p>
          </div>

          {/* Section 21 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">21. DEFAULT CLAUSE :</p>
            <p className="ml-4">
              The Buyer shall be liable for the Seller&apos;s loss (such as
              funds tied up, exchange rate fluctuation losses, etc.) due to
              delay on payments or commodity take over. As such, the Buyer
              should pay the Seller 1％ of total contract value as detention fee
              if the detention time is above 20 days. The Buyer should pay the
              Seller 2％ of total contract value per day as detention fee if the
              detention time is above 40 days. If detention time is above 60
              days, the down payment from the Buyer should be taken as
              liquidated damages, the Seller has the rights to dispose the
              commodity without notification to the Buyer; additionally, the
              Seller reserve the rights to claim insufficient portion of
              detention fee versus down payment and the Seller reserve the right
              to terminate this Sales Contract. If the detention time does not
              exceed 60 days, but the down payment is less than detention fee,
              the Seller has the rights to dispose the commodity and to
              terminate this Sales Contract.
            </p>
          </div>

          {/* Section 22 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">22. CONTRACT MODIFICATION :</p>
            <p className="ml-4">
              22.1. The terms and conditions of this contract constitute a full
              and final understanding to the commodity under this Sales Contract
              by both the Seller and the Buyer. Any modification,
              supplementation and/or rescission to this contract must be bound
              to the confirmation in writing and to be signed and sealed by both
              parties, otherwise it shall be accounted invalid.
            </p>
            <p className="ml-4 mt-2">
              22.2. Neither this Sales Contract hereof nor any interest and/or
              obligation therein shall be assigned without the Seller&apos;s
              prior written consent.
            </p>
          </div>

          {/* Section 23 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">23. ARBITRATE CLAUSE :</p>
            <p className="ml-4">
              Any dispute in connection with or arising from this contract shall
              be settled amicably through negotiation. In case no settlement can
              be reached between the two parties, the case shall be referred to
              China International Economic and Trade Arbitration Commission,
              Beijing for arbitration in accordance with its existing Rules of
              Arbitration, and it should also refer to the existing law of the
              People&apos;s Republic of China to settle all the issues related
              to the arbitration. The arbitral award is final and binding upon
              both parties.
            </p>
          </div>

          {/* Section 24 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">
              24. CONTRACT VERSIONS : Both Chinese and English versions of this
              Sales Contract have equal legal force.
            </p>
          </div>

          {/* Section 25 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">25. CONTRACT VALIDITY :</p>
            <p className="ml-4">
              25.1. This Sales Contract shall come into force after signed and
              sealed by both parties before Aug, 30th, 2025.
            </p>
            <p className="ml-4">
              25.2. This Sales Contract shall come into force from its effective
              date and shall come to be invalid once both parties complete the
              rights and obligations hereof.
            </p>
          </div>

          {/* Section 26 */}
          <div className="mb-4 text-sm">
            <p className="font-semibold mb-2">26. TRADEMARK CLAUSE :</p>
            <p className="ml-4">
              Trademark and the name of the commodity under this contract are
              the property right of the Seller. Without written authorization
              from the Seller, the Buyer should not register the trademark, logo
              and product name of the Seller in the territory or any other
              countries or areas. The Buyer can only use the logo and product
              name of the Seller in advertising and other articles relative to
              selling of the Seller&apos;s automobiles.
            </p>
          </div>

          {/* Section 27 */}
          <div className="mb-8 text-sm">
            <p className="font-semibold mb-2">27. OTHER PROVISIONS :</p>
            <p className="ml-4">
              27.1. Considering the special condition of international business,
              fax or scan of this Sales Contract shall have legal effect.
            </p>
            <p className="ml-4 mt-2">
              27.2. This Sales Contract shall have the final legal force and
              effect and shall preside any discrepancy arise between this Sales
              Contract and any Proforma Invoice entered by both parties,
            </p>
            <p className="ml-4 mt-2">
              27.3. In witness thereof, this Sales Contract shall come into
              effect immediately after it is signed and/or stamped by both
              parties in two original copies and each party holds one. All the
              attachments of this Sales Contract are the integral part of this
              Sales Contract and shall have the same legal effect.
            </p>
            <p className="ml-4 mt-2">
              27.4. After the entering of this Sales Contract, if the Buyer
              fails to perform payment as agreed under this Sales Contract and
              the Seller fails to reaffirm the validity of this Sales Contract,
              this Sales Contract shall be automatically terminated.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div>
              <p className="font-semibold mb-4">SELLER:</p>
              <p className="font-semibold mb-4">
                SISTRE GLOBAL SOURCING PTE LTD
              </p>
              <p className="mb-2">Name of the authorized representative:</p>
              <p className="mb-8 font-bold">YONG WEI FONG</p>
              <div className="mb-4 flex items-center gap-4">
                <Image
                  src="/sistre2.png"
                  alt="Seller signature"
                  width={100}
                  height={100}
                  className="object-contain"
                />
                <Image
                  src="/sistre3.png"
                  alt="Seller signature"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
              <div className="border-t border-black w-48 mb-2"></div>
              <p>Seal and signature:</p>
              <p className="mt-4">
                Date: {formatDateShort(invoice.invoiceDate)}
              </p>
            </div>
            <div>
              <p className="font-semibold mb-4">BUYER:</p>
              <p className="font-semibold mb-4">KPANDJI AUTOMOBILES</p>
              <p className="mb-2">Name of the authorized representative:</p>
              <p className="mb-8 font-bold">KOUAME NDA NGORAN BERNARD</p>
              <div className="mb-4 flex items-center gap-4">
                <Image
                  src="/sistre4.png"
                  alt="Seller signature"
                  width={100}
                  height={100}
                  className="object-contain"
                />
               
              </div>
              <div className="border-t border-black w-48 mb-2"></div>
              <p>Seal and signature:</p>
              <p className="mt-4">
                Date: {formatDateShort(invoice.invoiceDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
