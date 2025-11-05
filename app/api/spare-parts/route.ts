import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, storageId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Spare part ID is required' },
        { status: 400 }
      );
    }

    const sparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        storageId,
        etapeSparePart: 'RANGE', // Update etapeSparePart to RANGE when assigning to storage
      },
    });

    revalidatePath('/magasinier/stockage');
    revalidatePath('/magasinier/verification');

    return NextResponse.json(sparePart);
  } catch (error) {
    console.error('Error updating spare part:', error);
    return NextResponse.json(
      { error: 'Failed to update spare part' },
      { status: 500 }
    );
  }
}

