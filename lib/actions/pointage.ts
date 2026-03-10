"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

/**
 * Records a clock-in (pointage) when a QR code containing employee numro_matricule is scanned.
 * Finds employee by numro_matricule, then saves nom, prenoms, and scan time to Pointage.
 */
export async function recordPointage(matricule: string) {
  try {
    const trimmedMatricule = matricule.trim();
    if (!trimmedMatricule) {
      return { success: false, error: "Code matricule vide." };
    }

    const employee = await prisma.employee.findFirst({
      where: { numro_matricule: trimmedMatricule },
      select: { id: true, nom: true, prenoms: true },
    });

    if (!employee) {
      return { success: false, error: "Employé non trouvé. Vérifiez le code matricule." };
    }

    const now = new Date();
    const pointage = await prisma.pointage.create({
      data: {
        id: crypto.randomUUID(),
        date: now,
        heure_entree: now,
        heure_sortie: now, // Same as entry for clock-in only; can be updated later for clock-out
        employeeId: employee.id,
      },
    });

    revalidatePath("/rh/pointage");
    return {
      success: true,
      data: {
        nom: employee.nom,
        prenoms: employee.prenoms,
        heure_entree: pointage.heure_entree,
      },
    };
  } catch (error) {
    console.error("Error recording pointage:", error);
    if (error instanceof Error) {
      return { success: false, error: `Erreur: ${error.message}` };
    }
    return { success: false, error: "Erreur lors de l'enregistrement du pointage." };
  }
}

/**
 * Records a clock-out (pointage de sortie) when a QR code containing employee numro_matricule is scanned.
 * Finds employee by numro_matricule, then updates the most recent pointage for today with heure_sortie.
 */
export async function recordPointageSortie(matricule: string) {
  try {
    const trimmedMatricule = matricule.trim();
    if (!trimmedMatricule) {
      return { success: false, error: "Code matricule vide." };
    }

    const employee = await prisma.employee.findFirst({
      where: { numro_matricule: trimmedMatricule },
      select: { id: true, nom: true, prenoms: true },
    });

    if (!employee) {
      return { success: false, error: "Employé non trouvé. Vérifiez le code matricule." };
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the most recent pointage for this employee today that hasn't been closed (heure_sortie = heure_entree)
    const openPointage = await prisma.pointage.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { heure_entree: "desc" },
    });

    if (!openPointage) {
      return { success: false, error: "Aucun pointage d'entrée trouvé pour aujourd'hui. Enregistrez d'abord une entrée." };
    }

    // Check if already clocked out (heure_sortie > heure_entree means already closed)
    const entryTime = openPointage.heure_entree.getTime();
    const exitTime =
      openPointage.heure_sortie != null
        ? openPointage.heure_sortie.getTime()
        : entryTime;
    if (exitTime > entryTime) {
      return { success: false, error: "Sortie déjà enregistrée pour ce pointage." };
    }

    await prisma.pointage.update({
      where: { id: openPointage.id },
      data: { heure_sortie: now },
    });

    revalidatePath("/rh/pointage");
    return {
      success: true,
      data: {
        nom: employee.nom,
        prenoms: employee.prenoms,
        heure_sortie: now,
      },
    };
  } catch (error) {
    console.error("Error recording pointage sortie:", error);
    if (error instanceof Error) {
      return { success: false, error: `Erreur: ${error.message}` };
    }
    return { success: false, error: "Erreur lors de l'enregistrement de la sortie." };
  }
}

/**
 * Fetches all pointages for a given date.
 */
export async function getPointagesByDate(date: Date | string) {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    const pointages = await prisma.pointage.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        Employee: {
          select: { nom: true, prenoms: true, numro_matricule: true },
        },
      },
      orderBy: { heure_entree: "desc" },
    });

    return {
      success: true,
      data: pointages.map((p) => ({
        id: p.id,
        nom: p.Employee.nom,
        prenoms: p.Employee.prenoms,
        numro_matricule: p.Employee.numro_matricule,
        heure_entree: p.heure_entree,
        heure_sortie: p.heure_sortie,
      })),
    };
  } catch (error) {
    console.error("Error fetching pointages:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: [] };
    }
    return { success: false, error: "Erreur lors de la récupération des pointages.", data: [] };
  }
}

export type PointageRow = {
  id: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  numro_matricule: string | null;
  heure_entree: Date;
  heure_sortie: Date;
};

export type PointagesByDay = {
  date: string; // YYYY-MM-DD
  dateFormatted: string;
  pointages: PointageRow[];
};

/**
 * Fetches all pointages grouped by day, sorted from newest to oldest.
 */
export async function getAllPointagesGroupedByDay() {
  try {
    const pointages = await prisma.pointage.findMany({
      include: {
        Employee: {
          select: { nom: true, prenoms: true, poste: true, numro_matricule: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // Group by day (date string YYYY-MM-DD)
    const grouped = new Map<string, PointageRow[]>();
    for (const p of pointages) {
      const dateStr = p.date.toISOString().slice(0, 10);
      const row: PointageRow = {
        id: p.id,
        nom: p.Employee.nom,
        prenoms: p.Employee.prenoms,
        poste: p.Employee.poste,
        numro_matricule: p.Employee.numro_matricule,
        heure_entree: p.heure_entree,
        heure_sortie: p.heure_sortie,
      };
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(row);
    }

    // Sort pointages within each day by heure_entree desc
    const result: PointagesByDay[] = [];
    for (const [dateStr, rows] of grouped) {
      rows.sort((a, b) => new Date(b.heure_entree).getTime() - new Date(a.heure_entree).getTime());
      result.push({
        date: dateStr,
        dateFormatted: new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        pointages: rows,
      });
    }

    // Sort days from newest to oldest (already in order from the Map iteration, but ensure it)
    result.sort((a, b) => b.date.localeCompare(a.date));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching pointages grouped by day:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: [] };
    }
    return { success: false, error: "Erreur lors de la récupération des pointages.", data: [] };
  }
}
