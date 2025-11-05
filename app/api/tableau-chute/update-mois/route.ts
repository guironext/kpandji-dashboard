import { NextRequest, NextResponse } from 'next/server';
import { updateTableauChuteRendezVousMois } from '@/lib/actions/tableau-chute';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, mois_chute } = body;

    if (!id || !mois_chute) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await updateTableauChuteRendezVousMois({ id, mois_chute });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in update-mois API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
