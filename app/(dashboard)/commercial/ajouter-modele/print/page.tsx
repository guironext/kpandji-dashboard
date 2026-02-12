"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAllModele } from "@/lib/actions/modele";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Car, FileText, Sparkles } from "lucide-react";
import Image from "next/image";

export default function PrintCataloguePage() {
  const router = useRouter();
  const [models, setModels] = useState<
    Array<{
      id: string;
      model: string;
      fiche_technique: string | null;
      description?: string | null;
      image?: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination: Split models into pages (2 models per page for better print layout)
  const MODELS_PER_PAGE = 2;
  const pages = models.reduce((acc: typeof models[], model, index) => {
    const pageIndex = Math.floor(index / MODELS_PER_PAGE);
    if (!acc[pageIndex]) {
      acc[pageIndex] = [];
    }
    acc[pageIndex].push(model);
    return acc;
  }, []);

  const loadModels = useCallback(async (retryCount = 0) => {
    try {
      setError(null);
      const result = await getAllModele();
      
      if (result.success && result.data) {
        setModels(result.data);
        setLoading(false);
      } else {
        // Retry up to 3 times if database connection fails
        if (retryCount < 3) {
          console.log(`Retrying loadModels (attempt ${retryCount + 1})...`);
          setTimeout(() => {
            loadModels(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          setError(result.message || "Erreur lors du chargement des modèles");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error loading models:", err);
      // Retry up to 3 times on error
      if (retryCount < 3) {
        console.log(`Retrying loadModels after error (attempt ${retryCount + 1})...`);
        setTimeout(() => {
          loadModels(retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        setError("Impossible de charger les modèles. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handlePrint = () => {
    try {
      // Wait for all images to load before printing
      const images = document.querySelectorAll('#printable-area img');
      const imagePromises: Promise<void>[] = [];
      
      images.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          if (img.complete && img.naturalHeight !== 0) {
            // Image already loaded
            return;
          }
          
          const promise = new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.warn('Image loading timeout:', img.src);
              resolve(); // Continue even if image fails
            }, 5000); // 5 second timeout per image
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            
            img.onerror = () => {
              clearTimeout(timeout);
              console.warn('Image failed to load:', img.src);
              resolve(); // Continue even if image fails
            };
          });
          
          imagePromises.push(promise);
        }
      });
      
      // Wait for all images or timeout after 10 seconds total
      Promise.race([
        Promise.all(imagePromises),
        new Promise<void>((resolve) => setTimeout(resolve, 10000))
      ]).then(() => {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
          window.print();
        }, 100);
      }).catch((err) => {
        console.error('Print preparation error:', err);
        // Still try to print even if there were errors
        window.print();
      });
    } catch (err) {
      console.error('Print error:', err);
      // Fallback: just print anyway
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-700 font-semibold">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border-2 border-orange-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push("/commercial/ajouter-modele")}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={() => {
                setLoading(true);
                setError(null);
                loadModels();
              }}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 1.5cm 2cm 2cm 2cm;
          }
          
          /* Page container for print */
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            width: 100%;
            min-height: 29.7cm;
            position: relative;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: linear-gradient(to bottom, #fff7ed 0%, #ffffff 5%) !important;
            font-family: 'Segoe UI', 'Arial', sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.6 !important;
            color: #1f2937 !important;
            counter-reset: page;
          }
          
          /* Hide elements that should not print */
          .print-hide {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Use visibility approach - hide everything first */
          body * {
            visibility: hidden !important;
          }
          
          /* Show parent container of printable area */
          body > div {
            visibility: visible !important;
            display: block !important;
            background: transparent !important;
          }
          
          /* Show printable area and all its children */
          #printable-area {
            visibility: visible !important;
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
            page-break-inside: auto !important;
          }
          
          /* Page containers */
          .print-page {
            visibility: visible !important;
            display: block !important;
            background: white !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            min-height: 29.7cm !important;
            position: relative !important;
          }
          
          .print-page:last-child {
            page-break-after: auto !important;
          }
          
          #printable-area * {
            visibility: visible !important;
          }
          
          /* Optimize image loading for print - prevent timeouts */
          #printable-area img {
            max-width: 100% !important;
            height: auto !important;
            object-fit: contain !important;
            page-break-inside: avoid !important;
          }
          
          /* Hide broken or empty images */
          img[src=""],
          img:not([src]),
          img[src*="undefined"],
          img[src*="null"] {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Ensure proper display for different element types */
          #printable-area span,
          #printable-area p,
          #printable-area h1,
          #printable-area h2,
          #printable-area h3 {
            display: block !important;
          }
          
          #printable-area span[class*="inline"],
          #printable-area div[class*="inline-flex"] {
            display: inline-block !important;
          }
          
          #printable-area div[class*="flex"] {
            display: flex !important;
          }
          
          /* Show page footer */
          .page-footer {
            visibility: visible !important;
            display: block !important;
          }
          
          .page-footer * {
            visibility: visible !important;
          }
          
          /* ========== PAGE HEADER DESIGN ========== */
          .print-page > div:first-child {
            margin-bottom: 1.5cm !important;
            padding-bottom: 0.8cm !important;
            border-bottom: 4px solid #ea580c !important;
            page-break-after: avoid !important;
          }
          
          .print-page h1 {
            font-size: 28pt !important;
            font-weight: 900 !important;
            color: #111827 !important;
            margin-bottom: 0.3cm !important;
            line-height: 1.2 !important;
            text-transform: uppercase !important;
            page-break-after: avoid !important;
          }
          
          /* Company name in header */
          .print-page > div:first-child p {
            font-size: 14pt !important;
            font-weight: 700 !important;
            color: #ea580c !important;
          }
          
          /* ========== COLORFUL MODEL CARDS ========== */
          .model-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 1.2cm !important;
            padding-bottom: 0.8cm !important;
            border-bottom: 2px dashed #fbbf24 !important;
          }
          
          .model-card:last-child {
            border-bottom: none !important;
            margin-bottom: 0 !important;
          }
          
          /* Card content with colorful design */
          .model-card > div {
            background: linear-gradient(to right, #ffffff 0%, #fff7ed 100%) !important;
            border-left: 6px solid #f97316 !important;
            padding: 0.8cm !important;
            box-shadow: 0 2px 8px rgba(249, 115, 22, 0.15) !important;
            page-break-inside: avoid !important;
            border-radius: 8px !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          /* Decorative corner accent */
          .model-card > div::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            width: 60px !important;
            height: 60px !important;
            background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%) !important;
            border-radius: 0 8px 0 60px !important;
            opacity: 0.1 !important;
          }
          
          /* Model title with gradient text */
          .model-card h2 {
            font-size: 18pt !important;
            font-weight: 800 !important;
            background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fbbf24 100%) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            color: #ea580c !important;
            margin-bottom: 0.4cm !important;
            page-break-after: avoid !important;
            line-height: 1.3 !important;
            position: relative !important;
            z-index: 1 !important;
          }
          
          /* Colorful model number badge */
          .model-card span {
            font-size: 10pt !important;
            padding: 6px 12px !important;
            background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%) !important;
            color: #ffffff !important;
            border: 2px solid #ea580c !important;
            font-weight: 800 !important;
            border-radius: 20px !important;
            box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3) !important;
            display: inline-block !important;
          }
          
          /* Description styling */
          .model-card p {
            font-size: 10.5pt !important;
            line-height: 1.7 !important;
            color: #374151 !important;
            margin-top: 0.4cm !important;
            margin-bottom: 0.4cm !important;
          }
          
          .model-card h3 {
            font-size: 9.5pt !important;
            font-weight: 700 !important;
            color: #ea580c !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            margin-bottom: 0.3cm !important;
            margin-top: 0.5cm !important;
            border-left: 3px solid #fbbf24 !important;
            padding-left: 8px !important;
          }
          
          /* Colorful image borders */
          .model-card img {
            max-width: 160px !important;
            max-height: 160px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            border: 3px solid !important;
            border-image: linear-gradient(135deg, #f97316, #fbbf24) 1 !important;
            background: #fff7ed !important;
            padding: 8px !important;
            page-break-inside: avoid !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 6px rgba(249, 115, 22, 0.2) !important;
          }
          
          .model-card > div > div {
            display: flex !important;
            flex-direction: row !important;
            gap: 1cm !important;
            align-items: flex-start !important;
          }
          
          /* Image container */
          .model-card > div > div > div:first-child {
            flex-shrink: 0 !important;
            width: 180px !important;
            min-width: 180px !important;
          }
          
          .model-card > div > div > div:first-child > div {
            width: 100% !important;
            min-height: 160px !important;
            max-height: 160px !important;
            border: 3px solid !important;
            border-image: linear-gradient(135deg, #f97316, #fbbf24) 1 !important;
            background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%) !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 6px rgba(249, 115, 22, 0.15) !important;
          }
          
          /* Content container */
          .model-card > div > div > div:last-child {
            flex: 1 !important;
            min-width: 0 !important;
          }
          
          /* Ensure icons don't break */
          .model-card svg {
            page-break-inside: avoid !important;
          }
          
          /* Colorful technical sheet badge */
          .model-card div[class*="inline-flex"] {
            font-size: 9pt !important;
            padding: 6px 14px !important;
            background: linear-gradient(135deg, #ea580c 0%, #f97316 100%) !important;
            color: #ffffff !important;
            border: 2px solid #ea580c !important;
            margin-top: 0.4cm !important;
            font-weight: 700 !important;
            border-radius: 20px !important;
            box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3) !important;
            display: inline-block !important;
          }
          
          /* Page footer styling */
          .print-page > div:last-child:not(.page-footer) {
            margin-top: 1.5cm !important;
            padding-top: 0.8cm !important;
            border-top: 2px solid #fbbf24 !important;
            page-break-inside: avoid !important;
          }
          
          .print-page > div:last-child:not(.page-footer) p {
            font-size: 10pt !important;
            color: #374151 !important;
            font-weight: 600 !important;
          }
          
          .print-page > div:last-child:not(.page-footer) span {
            color: #ea580c !important;
            font-weight: 800 !important;
          }
          
          /* Prevent page breaks in bad places */
          h1, h2, h3 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          
          /* Better text flow */
          p {
            orphans: 3 !important;
            widows: 3 !important;
          }
          
          /* ========== COLORFUL PAGE FOOTER ========== */
          .page-footer {
            position: absolute;
            bottom: 1cm;
            right: 2cm;
            font-size: 9pt;
            color: #f97316;
            font-family: 'Segoe UI', sans-serif;
            font-weight: 600;
            background: linear-gradient(135deg, #fff7ed, #fef3c7) !important;
            padding: 4px 12px !important;
            border-radius: 15px !important;
            border: 2px solid #fbbf24 !important;
            box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3) !important;
          }
          
          .page-footer::after {
            content: "Page " counter(page);
          }
          
          /* Hide page number badge on print */
          .print-page::before {
            display: none !important;
          }
          
          /* Remove shadows but keep colorful elements */
          * {
            text-shadow: none !important;
          }
          
          /* Ensure proper spacing */
          .space-y-6 > * + * {
            margin-top: 1.2cm !important;
          }
          
          /* Better spacing for empty state */
          .text-center {
            page-break-inside: avoid !important;
            padding: 2cm !important;
            background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%) !important;
            border-radius: 12px !important;
            border: 2px dashed #fbbf24 !important;
          }
          
          /* Ensure borders print with colors */
          .border-l-4 {
            border-left-width: 6px !important;
            border-left-color: #f97316 !important;
          }
          
          .border-b-4 {
            border-bottom-width: 4px !important;
            border-bottom-color: #fbbf24 !important;
          }
          
          /* Colorful backgrounds */
          .bg-white {
            background: white !important;
          }
          
          .bg-gray-50, .bg-gray-100 {
            background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%) !important;
          }
          
          /* Empty state styling */
          .text-center h3 {
            font-size: 16pt !important;
            font-weight: 800 !important;
            color: #ea580c !important;
            background: linear-gradient(135deg, #ea580c, #f97316) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
          }
          
          .text-center p {
            font-size: 11pt !important;
            color: #92400e !important;
            font-weight: 500 !important;
          }
          
          /* Add colorful accent to empty state icon */
          .text-center svg {
            color: #f97316 !important;
            filter: drop-shadow(0 2px 4px rgba(249, 115, 22, 0.3)) !important;
          }
        }
        @media screen {
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
          }
          
          #printable-area {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0;
            background: transparent;
            display: flex;
            flex-direction: column;
            gap: 30px;
          }
          
          .print-page {
            background: white;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            position: relative;
            page-break-after: auto;
            page-break-inside: avoid;
          }
          
          .print-page::before {
            content: attr(data-page-number);
            position: absolute;
            top: 15mm;
            right: 20mm;
            background: linear-gradient(135deg, #f97316, #fbbf24);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
          }
          
          .page-footer {
            display: none;
          }
          
          /* Scrollable container */
          .pages-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
            padding: 20px 0;
          }
        }
      ` }} />

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        {/* Animated Background Elements */}
        <div className="print-hide fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Premium Header Bar - Hidden when printing */}
        <div className="print-hide sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b-2 border-orange-200/50 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <Button
                  onClick={() => router.push("/commercial/ajouter-modele")}
                  variant="outline"
                  className="border-2 border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 text-orange-700 shadow-lg px-6 py-6 text-base font-bold rounded-xl transition-all hover:scale-105 hover:shadow-xl group"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Retour
                </Button>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                      <Car className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                      Catalogue des Modèles
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {models.length} {models.length !== 1 ? 'modèles' : 'modèle'} disponible{models.length !== 1 ? 's' : ''}
                      {pages.length > 0 && (
                        <span className="ml-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-xs font-bold">
                          {pages.length} {pages.length !== 1 ? 'pages' : 'page'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handlePrint}
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 text-white shadow-xl px-10 py-6 text-lg font-black rounded-xl transition-all hover:scale-105 hover:shadow-2xl flex items-center gap-3"
              >
                <Printer className="w-6 h-6" />
                Imprimer le Catalogue
              </Button>
            </div>
          </div>
        </div>

        {/* Printable Content */}
        <div id="printable-area">
          {models.length === 0 ? (
            <div className="print-page">
              <div className="text-center py-24">
                <div className="inline-block p-8 bg-gray-100 rounded-full mb-6">
                  <Car className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Aucun modèle dans le catalogue</h3>
                <p className="text-gray-500">Commencez par ajouter des modèles pour créer votre catalogue</p>
              </div>
            </div>
          ) : (
            <div className="pages-container">
              {pages.map((pageModels, pageIndex) => {
                const globalIndexStart = pageIndex * MODELS_PER_PAGE;
                return (
                  <div 
                    key={pageIndex} 
                    className="print-page"
                    data-page-number={`Page ${pageIndex + 1}`}
                  >
                    {/* Header - Only on first page */}
                    {pageIndex === 0 && (
                      <div className="mb-8 pb-6 border-b-4 border-orange-500">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                              CATALOGUE DES MODÈLES
                            </h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent uppercase tracking-wide">
                              KPANDJI AUTOMOBILES
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Models for this page */}
                    <div className="space-y-8">
                      {pageModels.map((model, localIndex) => {
                        const globalIndex = globalIndexStart + localIndex;
                        return (
                          <div 
                            key={model.id} 
                            className="model-card"
                          >
                            {/* Premium Card Design */}
                            <div className="relative bg-gradient-to-r from-white to-orange-50/30 shadow-lg hover:shadow-xl transition-all rounded-lg overflow-hidden group border-l-6" style={{ borderLeftColor: '#f97316', borderLeftWidth: '6px', borderLeftStyle: 'solid' }}>
                              {/* Gradient border accent */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 via-amber-500 to-orange-500"></div>
                              
                              <div className="p-6 ml-1">
                                <div className="flex flex-col md:flex-row gap-6">
                                  {/* Image Section */}
                                  {model.image ? (
                                    <div className="flex-shrink-0" style={{ width: '220px' }}>
                                      <div className="w-full bg-gradient-to-br from-orange-50 to-amber-50 border-2 rounded-xl overflow-hidden flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow" style={{ minHeight: '200px', maxHeight: '200px', borderColor: '#f97316' }}>
                                        <div className="p-2 w-full h-full flex items-center justify-center">
                                          <Image
                                            src={model.image}
                                            alt={model.model}
                                            width={200}
                                            height={200}
                                            className="w-full h-full object-contain rounded-lg"
                                            style={{ maxWidth: '200px', maxHeight: '200px' }}
                                            onError={(e) => {
                                              // Fallback if image fails to load
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const parent = target.parentElement;
                                              if (parent) {
                                                parent.innerHTML = `
                                                  <div class="text-center">
                                                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                    <p class="text-xs text-gray-500 font-medium">Image non disponible</p>
                                                  </div>
                                                `;
                                              }
                                            }}
                                            loading="eager"
                                            unoptimized={model.image?.startsWith('http')}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0" style={{ width: '220px' }}>
                                      <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-md" style={{ minHeight: '200px', maxHeight: '200px' }}>
                                        <div className="text-center">
                                          <Car className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                          <p className="text-xs text-gray-500 font-medium">Pas d&apos;image</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Content Section */}
                                  <div className="flex-1 min-w-0">
                                    {/* Model Name with Badge */}
                                    <div className="mb-4">
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 rounded-full shadow-md">
                                          #{globalIndex + 1}
                                        </span>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                          {model.model}
                                        </h2>
                                      </div>
                                    </div>
                                    
                                    {/* Description */}
                                    {model.description && (
                                      <div className="mb-4">
                                        <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                          <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-amber-500 rounded"></div>
                                          Description
                                        </h3>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-3">
                                          {model.description}
                                        </p>
                                      </div>
                                    )}

                                    {/* Technical Sheet Badge */}
                                    {model.fiche_technique && (
                                      <div className="mt-4 pt-4 border-t border-gradient-to-r from-orange-200 to-amber-200">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-full shadow-md">
                                          <FileText className="w-4 h-4" />
                                          Fiche technique disponible
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                      {/* Footer - Only on last page */}
                      {pageIndex === pages.length - 1 && (
                        <div className="mt-12 pt-6 border-t-2" style={{ borderTopColor: '#fbbf24' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-md"></div>
                            <p className="text-sm font-semibold text-gray-700">
                              Total: <span className="text-orange-600 font-bold">{models.length}</span> {models.length !== 1 ? 'modèles' : 'modèle'}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            KPANDJI AUTOMOBILES
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Page Footer for Print */}
                    <div className="page-footer"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

