"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { Decimal } from "@prisma/client/runtime/library";

export type SistreInvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SistreInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  lineItems: SistreInvoiceLineItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

// Helper function to serialize Decimal values
function serializeInvoice(invoice: unknown): SistreInvoice {
  const f = invoice as Record<string, unknown> & {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    total: Decimal;
    createdAt: Date;
    updatedAt: Date;
    SistreInvoiceItem?: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: Decimal;
      amount: Decimal;
    }>;
  };
  const lineItems = (f.SistreInvoiceItem || []).map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
  }));

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return {
    id: f.id,
    invoiceNumber: f.invoiceNumber,
    invoiceDate: f.invoiceDate.toISOString(),
    lineItems,
    subtotal,
    total: Number(f.total),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export async function createSistreInvoice(data: {
  invoiceNumber: string;
  invoiceDate: string;
  lineItems: SistreInvoiceLineItem[];
}) {
  try {
    // Calculate total
    const total = data.lineItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Create invoice with items in a transaction
    const invoice = await prisma.sistreInvoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        total: new Decimal(total),
        updatedAt: new Date(),
        SistreInvoiceItem: {
          create: data.lineItems.map((item) => ({
            id: crypto.randomUUID(),
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            amount: new Decimal(item.unitPrice * item.quantity),
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        SistreInvoiceItem: true,
      },
    });

    revalidatePath("/manager/sistre");

    return { success: true, data: serializeInvoice(invoice) };
  } catch (error) {
    console.error("Error creating SISTRE invoice:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create invoice";

    // Handle unique constraint violation
    if (
      errorMessage.includes("Unique constraint") ||
      errorMessage.includes("invoiceNumber")
    ) {
      return { success: false, error: "Ce numéro de facture existe déjà" };
    }

    return { success: false, error: errorMessage };
  }
}

export async function getAllSistreInvoices() {
  try {
    const invoices = await prisma.sistreInvoice.findMany({
      include: {
        SistreInvoiceItem: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: invoices.map(serializeInvoice) };
  } catch (error) {
    console.error("Error fetching SISTRE invoices:", error);
    return { success: false, error: "Failed to fetch invoices" };
  }
}

export async function getSistreInvoice(id: string) {
  try {
    const invoice = await prisma.sistreInvoice.findUnique({
      where: { id },
      include: {
        SistreInvoiceItem: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    return { success: true, data: serializeInvoice(invoice) };
  } catch (error) {
    console.error("Error fetching SISTRE invoice:", error);
    return { success: false, error: "Failed to fetch invoice" };
  }
}

export async function deleteSistreInvoice(id: string) {
  try {
    // Delete invoice (items will be deleted automatically due to onDelete: Cascade)
    await prisma.sistreInvoice.delete({
      where: { id },
    });

    revalidatePath("/manager/sistre");

    return { success: true };
  } catch (error) {
    console.error("Error deleting SISTRE invoice:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete invoice";
    return { success: false, error: errorMessage };
  }
}

export async function deleteSistreInvoices(ids: string[]) {
  try {
    // Delete multiple invoices (items will be deleted automatically due to onDelete: Cascade)
    await prisma.sistreInvoice.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    revalidatePath("/manager/sistre");

    return { success: true };
  } catch (error) {
    console.error("Error deleting SISTRE invoices:", error);
    return { success: false, error: "Failed to delete invoices" };
  }
}
