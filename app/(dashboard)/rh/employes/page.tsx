"use client";

import React, { useState, useEffect } from "react";
import { EmployeeFormDialog } from "@/components/EmployeeFormDialog";
import { getAllEmployees, deleteEmployee } from "@/lib/actions/employee";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  User,
  Edit,
  Trash2,
  MoreHorizontal,
  UserPlus,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Employee {
  id: string;
  nom: string;
  prenoms: string;
  contact: string;
  adresse?: string | null;
  image?: string | null;
  bloodType?: string | null;
  specialite: string | null;
  email?: string | null;
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string | null;
    createdAt: Date;
    updatedAt: Date;
    telephone?: string | null;
  };
}

const Page = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const loadEmployees = async () => {
    try {
      const result = await getAllEmployees();
      if (result.success) {
        const data = (result.data || []) as unknown as Employee[];
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleEmployeeCreated = () => {
    loadEmployees();
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      return;
    }

    try {
      const result = await deleteEmployee(employeeId);
      if (result.success) {
        toast.success("Employé supprimé avec succès");
        loadEmployees();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gestion des Employés
            </h1>
            <p className="max-w-xl text-sm text-blue-100 sm:text-base">
              Gérez les informations de votre équipe, leurs coordonnées et spécialités.
            </p>
          </div>
          <div className="flex shrink-0">
            <EmployeeFormDialog
              onSuccess={handleEmployeeCreated}
              editingEmployee={editingEmployee}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-white shadow-md transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total employés
              </p>
              <div className="text-2xl font-bold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  employees.length
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 bg-white shadow-md transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Spécialités
              </p>
              <div className="text-2xl font-bold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  new Set(employees.map((e) => e.specialite).filter(Boolean)).size
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 bg-white shadow-md sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Actions rapides
              </p>
              <p className="text-sm font-medium text-foreground">
                Ajoutez un employé en un clic
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table / Cards */}
      <Card className="mt-6 overflow-hidden border-0 shadow-md">
        <CardHeader className="border-b bg-muted/30 px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Liste des Employés
          </CardTitle>
          <CardDescription>
            Tous les employés enregistrés dans le système
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 p-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b py-4 last:border-0"
                >
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Aucun employé</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Commencez par ajouter votre premier employé pour gérer votre équipe.
              </p>
              <div className="mt-6">
                <EmployeeFormDialog onSuccess={handleEmployeeCreated} />
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Employé</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Spécialité</TableHead>
                      <TableHead className="font-semibold">Groupe sanguin</TableHead>
                      <TableHead className="font-semibold">Adresse</TableHead>
                      <TableHead className="w-[70px] font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee, idx) => (
                      <TableRow
                        key={employee.id}
                        className={
                          idx % 2 === 1 ? "bg-muted/20" : ""
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {employee.image ? (
                              <Image
                                src={employee.image}
                                alt={`${employee.nom} ${employee.prenoms}`}
                                width={40}
                                height={40}
                                className="rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <span className="font-medium">
                              {employee.nom} {employee.prenoms}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0" />
                            {employee.contact}
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.email ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {employee.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.specialite ? (
                            <Badge
                              variant="secondary"
                              className="font-medium"
                            >
                              {employee.specialite}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.bloodType ? (
                            <Badge variant="outline" className="font-mono">
                              {employee.bloodType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.adresse ? (
                            <div className="flex items-center gap-2 text-muted-foreground max-w-[200px]">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {employee.adresse}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 p-4 md:hidden">
                {employees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="overflow-hidden border shadow-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {employee.image ? (
                            <Image
                              src={employee.image}
                              alt={`${employee.nom} ${employee.prenoms}`}
                              width={48}
                              height={48}
                              className="rounded-full object-cover ring-2 ring-muted"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">
                              {employee.nom} {employee.prenoms}
                            </p>
                            {employee.specialite && (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-xs"
                              >
                                {employee.specialite}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-4 space-y-2 border-t pt-4">
                        {employee.contact && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0" />
                            {employee.contact}
                          </div>
                        )}
                        {employee.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                        )}
                        {employee.adresse && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">{employee.adresse}</span>
                          </div>
                        )}
                        {employee.bloodType && (
                          <Badge variant="outline" className="mt-2 font-mono text-xs">
                            {employee.bloodType}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
