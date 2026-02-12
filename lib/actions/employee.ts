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

export async function getEmployee(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { User: true }
    });
    
    if (!employee) {
      return { success: false, error: "Employee not found" };
    }
    
    // Remap User to user for frontend compatibility
    const serializedEmployee = {
      ...employee,
      user: (employee as Record<string, unknown>).User
    };
    
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
    
    // Remap User to user for frontend compatibility
    const serializedEmployees = (employees as unknown[]).map((emp: unknown) => {
      const e = emp as Record<string, unknown> & { User?: unknown };
      return {
        ...e,
        user: e.User
      };
    });
    
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
}) {
  try {
    const employee = await prisma.employee.update({
      where: { id },
      data
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
    await prisma.employee.delete({
      where: { id }
    });
    
    revalidatePath("/rh/employes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}
