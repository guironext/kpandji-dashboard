"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createEmployee(data: {
  nom: string;
  prenoms: string;
  contact: string;
  bloodType: string;
  specialite?: string;
  userId: string;
}) {
  try {
    console.log("Creating employee with data:", data);
    
    const user = await prisma.user.findUnique({
      where: {
        clerkId: data.userId,
      },
    });
    
    if (!user) {
      console.log("User not found for clerkId:", data.userId);
      return { success: false, error: "User not found" };
    }
    
    console.log("Found user:", user.id);
    
    const employeeData = {
      nom: data.nom,
      prenoms: data.prenoms,
      contact: data.contact,
      bloodType: data.bloodType,
      specialite: data.specialite || null,
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
      include: { user: true }
    });
    
    if (!employee) {
      return { success: false, error: "Employee not found" };
    }
    
    return { success: true, data: employee };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return { success: false, error: "Failed to fetch employee" };
  }
}

export async function getAllEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: { user: true },
      orderBy: { nom: 'asc' }
    });
    
    return { success: true, data: employees };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { success: false, error: "Failed to fetch employees" };
  }
}

export async function updateEmployee(id: string, data: {
  nom?: string;
  prenoms?: string;
  contact?: string;
  bloodType?: string;
  specialite?: string;
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
