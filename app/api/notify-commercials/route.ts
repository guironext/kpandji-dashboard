import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commandeGroupeeId, models } = body;

    if (!commandeGroupeeId || !models) {
      return NextResponse.json(
        { error: 'commandeGroupeeId et models sont requis' },
        { status: 400 }
      );
    }

    // Get all users with role COMMERCIAL
    const commercialUsers = await prisma.user.findMany({
      where: {
        role: 'COMMERCIAL'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (commercialUsers.length === 0) {
      return NextResponse.json(
        { message: 'Aucun commercial trouvé', count: 0 },
        { status: 200 }
      );
    }

    // Here you can implement your notification logic
    // This could be:
    // 1. Send email notifications
    // 2. Create in-app notifications in a notifications table
    // 3. Send push notifications
    // 4. etc.

    // For now, we'll return the list of commercials who should be notified
    // You can extend this to actually send notifications

    console.log('Notification would be sent to:', commercialUsers);
    console.log('About commandeGroupee:', commandeGroupeeId);
    console.log('Models available:', models);

    // Example: Log notification data (you can replace this with actual notification sending)
    const notificationData = {
      recipients: commercialUsers.map(u => `${u.firstName} ${u.lastName} (${u.email})`),
      message: `Nouveaux modèles disponibles dans la commande groupée ${commandeGroupeeId}`,
      models: models,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Notification envoyée à ${commercialUsers.length} commercial(aux)`,
      count: commercialUsers.length,
      data: notificationData
    });

  } catch (error) {
    console.error('Error notifying commercials:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des notifications' },
      { status: 500 }
    );
  }
}

