"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSistreInvoice } from "@/lib/actions/sistre";
import { toast } from "sonner";

// Format number in English/US format with commas
const formatUSDNumber = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function CreerInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
  });

  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }
  ]);

  // Calculate total
  const total = lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceNumber.trim()) {
      toast.error("Veuillez saisir un numéro de facture");
      return;
    }

    if (!formData.invoiceDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    // Validate line items
    const validItems = lineItems.filter(
      (item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast.error("Veuillez ajouter au moins un article valide");
      return;
    }

    setLoading(true);
    try {
      const result = await createSistreInvoice({
        invoiceNumber: formData.invoiceNumber.trim(),
        invoiceDate: formData.invoiceDate,
        lineItems: validItems.map((item) => ({
          id: item.id,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      if (result.success) {
        toast.success("Reçu créé avec succès");
        router.push("/manager/sistre");
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          Créer un Reçu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Number */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoiceNumber" className="text-amber-700 font-bold">
                Numéro de Facture *
              </Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNumber: e.target.value })
                }
                className="border-amber-400"
                placeholder="Ex: INV-2024-001"
                required
              />
            </div>

            {/* Invoice Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoiceDate" className="text-amber-700 font-bold">
                Date de Facture *
              </Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
                className="border-amber-400"
                required
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-700">Articles</h3>
              <Button
                type="button"
                onClick={() =>
                  setLineItems([
                    ...lineItems,
                    {
                      id: crypto.randomUUID(),
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                    },
                  ])
                }
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                + Ajouter un article
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-amber-700">
                    Article {index + 1}
                  </h4>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      onClick={() =>
                        setLineItems(
                          lineItems.filter((_, i) => i !== index)
                        )
                      }
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm text-amber-700 font-bold">
                      Description *
                    </Label>
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[index].description = e.target.value;
                        setLineItems(updated);
                      }}
                      className="border-amber-300"
                      placeholder="Description de l'article"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-amber-700 font-bold">
                      Quantité *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[index].quantity =
                          parseInt(e.target.value) || 1;
                        setLineItems(updated);
                      }}
                      className="border-amber-300"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-amber-700 font-bold">
                      Prix Unitaire (USD) *
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[index].unitPrice =
                          parseFloat(e.target.value) || 0;
                        setLineItems(updated);
                      }}
                      className="border-amber-300"
                      required
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Sous-total:</p>
                      <p className="font-bold text-amber-700">
                        ${formatUSDNumber(
                          item.unitPrice * item.quantity
                        )} USD
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Section */}
          <div className="border-t-2 border-amber-400 pt-4">
            <div className="flex justify-end">
              <div className="text-right space-y-2">
                <div className="flex items-center gap-4">
                  <Label className="text-xl font-bold text-amber-700">
                    Total:
                  </Label>
                  <p className="text-2xl font-bold text-amber-700">
                    ${formatUSDNumber(total)} USD
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer le Reçu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

