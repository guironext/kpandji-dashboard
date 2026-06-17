"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "./user";

export async function createEmployee(data: {
  nom: string;
  prenoms: string;
  contact: string;
  adresse?: string | null;
  image?: string | null;
  bloodType?: string | null;
  specialite: string;
  email?: string | null;
  numro_matricule?: string | null;
  poste?: string | null;
  date_Embauche?: string | null; // ISO string for serialization
  personne_urgence?: string | null;
  telephone_personne_urgence?: string | null;
  relation_personne_urgence?: string | null;
  userId: string;
}) {
  try {
    console.log("Creating employee with data:", data);

    // Get or create user if it doesn't exist
    const userResult = await getOrCreateUser(data.userId);

    if (!userResult.success || !userResult.data) {
      console.log("Failed to get or create user for clerkId:", data.userId);
      return { success: false, error: userResult.error || "User not found" };
    }

    const user = userResult.data;
    console.log("Found/created user:", user.id);

    const employeeData = {
      id: crypto.randomUUID(),
      nom: data.nom,
      prenoms: data.prenoms,
      contact: data.contact,
      adresse: data.adresse || null,
      image: data.image || null,
      bloodType: data.bloodType ?? null,
      specialite: data.specialite,
      email: data.email || null,
      numro_matricule: data.numro_matricule || null,
      poste: data.poste || null,
      date_Embauche: data.date_Embauche ? new Date(data.date_Embauche) : null,
      personne_urgence: data.personne_urgence || null,
      telephone_personne_urgence: data.telephone_personne_urgence || null,
      relation_personne_urgence: data.relation_personne_urgence || null,
      userId: user.id,
    };

    console.log("Creating employee with data:", employeeData);

    const employee = await prisma.employee.create({
      data: employeeData,
    });

    console.log("Employee created successfully:", employee);
    revalidatePath("/rh/employes");
    return { success: true, data: employee };
  } catch (error) {
    console.error("Error creating employee:", error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to create employee: ${error.message}` };
    }
    return { success: false, error: "Failed to create employee" };
  }
}

/** Serialize object for server action response - convert Dates to ISO strings */
function serializeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeForClient) as unknown as T;
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeForClient(value);
    }
    return result as unknown as T;
  }
  return obj;
}

export async function getEmployee(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { User: true }
    });
    
    if (!employee) {
      return { success: false, error: "Employee not found" };
    }
    
    // Remap User to user and serialize for client (Dates -> ISO strings)
    const raw = {
      ...employee,
      user: (employee as Record<string, unknown>).User
    };
    const serializedEmployee = serializeForClient(raw);
    
    return { success: true, data: serializedEmployee };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return { success: false, error: "Failed to fetch employee" };
  }
}

export async function getAllEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: { User: true },
      orderBy: { nom: 'asc' }
    });

    const serializedEmployees = employees.map((emp) => ({
      ...emp,
      user: emp.User,
    }));

    return { success: true, data: serializedEmployees };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { success: false, error: "Failed to fetch employees" };
  }
}

export async function updateEmployee(id: string, data: {
  nom?: string;
  prenoms?: string;
  contact?: string;
  adresse?: string | null;
  image?: string | null;
  bloodType?: string | null;
  specialite?: string;
  email?: string | null;
  numro_matricule?: string | null;
  poste?: string | null;
  date_Embauche?: string | null; // ISO string for serialization
  personne_urgence?: string | null;
  telephone_personne_urgence?: string | null;
  relation_personne_urgence?: string | null;
}) {
  try {
    const { date_Embauche, ...rest } = data;
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        ...(date_Embauche !== undefined && {
          date_Embauche: date_Embauche ? new Date(date_Embauche) : null,
        }),
      },
    });
    
    revalidatePath("/rh/employes");
    return { success: true, data: employee };
  } catch (error) {
    console.error("Error updating employee:", error);
    return { success: false, error: "Failed to update employee" };
  }
}

export async function deleteEmployee(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        Equipe: { select: { nomEquipe: true } },
      },
    });

    if (!employee) {
      return { success: false, error: "Employé introuvable" };
    }

    if (employee.Equipe.length > 0) {
      const equipes = employee.Equipe.map((e) => e.nomEquipe).join(", ");
      return {
        success: false,
        error: `Impossible de supprimer cet employé : il est chef d'équipe (${equipes}). Réassignez d'abord le chef d'équipe.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      const testes = await tx.teste.findMany({
        where: { employeeId: id },
        select: { id: true },
      });
      const testeIds = testes.map((t) => t.id);

      if (testeIds.length > 0) {
        await tx.rapportTeste.deleteMany({ where: { testeId: { in: testeIds } } });
        await tx.teste.deleteMany({ where: { employeeId: id } });
      }

      await tx.equipeMembre.deleteMany({ where: { employeeId: id } });
      await tx.pointage.deleteMany({ where: { employeeId: id } });
      await tx.nomination_vote_Employee.deleteMany({ where: { employeeId: id } });
      await tx.permission.deleteMany({ where: { employeeId: id } });
      await tx.congeAnnuel.deleteMany({ where: { employeeId: id } });
      await tx.localBuy.deleteMany({ where: { employeeId: id } });

      await tx.employee.delete({ where: { id } });
    });

    revalidatePath("/rh/employes");
    revalidatePath("/assistante/employes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: { column?: string; modelName?: string } };
      if (prismaError.code === "P2003") {
        return {
          success: false,
          error:
            "Impossible de supprimer cet employé : des données liées existent encore dans le système.",
        };
      }
      if (prismaError.code === "P2022") {
        const column = prismaError.meta?.column;
        return {
          success: false,
          error: column
            ? `Schéma base de données désynchronisé (colonne manquante : ${column}). Exécutez « npx prisma db push » puis réessayez.`
            : "Schéma base de données désynchronisé. Exécutez « npx prisma db push » puis réessayez.",
        };
      }
    }
    return { success: false, error: "Échec de la suppression de l'employé" };
  }
}
