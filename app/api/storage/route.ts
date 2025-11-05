import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storageNumber, porte_Number, rayon, etage, caseNumber } = body;

    const storage = await prisma.storage.create({
      data: {
        storageNumber,
        porte_Number,
        rayon,
        etage,
        caseNumber,
      },
    });

    return NextResponse.json(storage);
  } catch (error) {
    console.error('Error creating storage:', error);
    return NextResponse.json(
      { error: 'Failed to create storage' },
      { status: 500 }
    );
  }
}
