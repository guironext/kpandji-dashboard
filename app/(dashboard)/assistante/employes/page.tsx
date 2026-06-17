"use client";

import React, { useState, useEffect } from "react";
import { EmployeeFormDialog } from "@/components/EmployeeFormDialog";
import { getAllEmployees, deleteEmployee, getEmployee } from "@/lib/actions/employee";
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
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
  Calendar,
  Hash,
  Briefcase,
  Droplets,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  numro_matricule?: string | null;
  poste?: string | null;
  date_Embauche?: Date | null;
  date_Depart?: Date | null;
  status?: string | null;
  personne_urgence?: string | null;
  telephone_personne_urgence?: string | null;
  relation_personne_urgence?: string | null;
  user?: {
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

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  breakAll,
  compact,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-lg px-3 py-2 ${compact ? "py-1.5" : "py-2.5"} hover:bg-slate-50/80 transition-colors`}>
      <Icon className={`shrink-0 text-slate-400 ${compact ? "h-4 w-4 mt-0.5" : "h-5 w-5 mt-0.5"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`font-medium text-slate-900 ${mono ? "font-mono" : ""} ${breakAll ? "break-all" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

const Page = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const handleDeleteEmployee = async (e: React.MouseEvent, employeeId: string) => {
    e.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      return;
    }

    try {
      const result = await deleteEmployee(employeeId);
      if (result.success) {
        toast.success("Employé supprimé avec succès");
        loadEmployees();
        if (selectedEmployee?.id === employeeId) {
          setDetailSheetOpen(false);
          setSelectedEmployee(null);
        }
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditEmployee = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setEditingEmployee(employee);
  };

  const handleEmployeeClick = async (employeeId: string) => {
    setDetailLoading(true);
    setDetailSheetOpen(true);
    setSelectedEmployee(null);

    try {
      const result = await getEmployee(employeeId);
      if (result.success && result.data) {
        setSelectedEmployee(result.data as Employee);
      } else {
        toast.error(result.error || "Impossible de charger les détails");
        setDetailSheetOpen(false);
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Erreur lors du chargement des détails");
      setDetailSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
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
              triggerLabel="Ajouter Nouveau Employé"
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
                Cliquez sur un employé pour voir ses détails
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
            Tous les employés enregistrés dans le système. Cliquez sur un employé pour afficher ses informations complètes.
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
                <EmployeeFormDialog
                  onSuccess={handleEmployeeCreated}
                  triggerLabel="Ajouter Nouveau Employé"
                />
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
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          idx % 2 === 1 ? "bg-muted/20" : ""
                        }`}
                        onClick={() => handleEmployeeClick(employee.id)}
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
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleEditEmployee(e, employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => handleDeleteEmployee(e, employee.id)}
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
              <div className="space-y-3 p-4 md:hidden">
                {employees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="group cursor-pointer overflow-hidden border-0 bg-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]"
                    onClick={() => handleEmployeeClick(employee.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch gap-0">
                        {/* Avatar & Main Info */}
                        <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
                          {employee.image ? (
                            <Image
                              src={employee.image}
                              alt={`${employee.nom} ${employee.prenoms}`}
                              width={56}
                              height={56}
                              className="rounded-xl object-cover ring-1 ring-slate-200/80"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15">
                              <User className="h-7 w-7 text-indigo-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">
                              {employee.nom} {employee.prenoms}
                            </p>
                            {employee.specialite && (
                              <Badge
                                variant="secondary"
                                className="mt-1.5 text-xs font-medium text-slate-600"
                              >
                                {employee.specialite}
                              </Badge>
                            )}
                            {(employee.contact || employee.email) && (
                              <p className="mt-1 text-xs text-slate-500 truncate">
                                {employee.contact || employee.email}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center border-l border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-none">
                                <MoreHorizontal className="h-5 w-5 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEmployee(e as React.MouseEvent, employee);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(e as React.MouseEvent, employee.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Optional Details Row */}
                      {(employee.adresse || employee.bloodType) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                          {employee.adresse && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="line-clamp-1">{employee.adresse}</span>
                            </div>
                          )}
                          {employee.bloodType && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {employee.bloodType}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <VisuallyHidden>
            <SheetTitle>Détails de l&apos;employé</SheetTitle>
          </VisuallyHidden>
          {detailLoading ? (
            <div className="flex flex-col items-center gap-6 p-6">
              <Skeleton className="h-28 w-28 rounded-2xl" />
              <div className="w-full space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="w-full space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : selectedEmployee ? (
            <>
              {/* Profile Header */}
              <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-indigo-600 to-violet-700 px-6 pt-8 pb-10">
                {selectedEmployee.image ? (
                  <Image
                    src={selectedEmployee.image}
                    alt={`${selectedEmployee.nom} ${selectedEmployee.prenoms}`}
                    width={100}
                    height={100}
                    className="rounded-2xl object-cover ring-4 ring-white/30 shadow-xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedEmployee.nom} {selectedEmployee.prenoms}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    {selectedEmployee.specialite && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">
                        {selectedEmployee.specialite}
                      </Badge>
                    )}
                    {selectedEmployee.status && (
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {selectedEmployee.status.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 -mt-6">
                <div className="space-y-4 rounded-t-2xl bg-white p-5 pt-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                  {/* Info Section */}
                  <div className="space-y-2">
                    {selectedEmployee.numro_matricule && (
                      <InfoRow icon={Hash} label="Matricule" value={selectedEmployee.numro_matricule} mono />
                    )}
                    {selectedEmployee.poste && (
                      <InfoRow icon={Briefcase} label="Poste" value={selectedEmployee.poste} />
                    )}
                    {selectedEmployee.contact && (
                      <InfoRow icon={Phone} label="Contact" value={selectedEmployee.contact} />
                    )}
                    {selectedEmployee.email && (
                      <InfoRow icon={Mail} label="Email" value={selectedEmployee.email} breakAll />
                    )}
                    {selectedEmployee.bloodType && (
                      <InfoRow icon={Droplets} label="Groupe sanguin" value={selectedEmployee.bloodType} mono />
                    )}
                    {selectedEmployee.adresse && (
                      <InfoRow icon={MapPin} label="Adresse" value={selectedEmployee.adresse} />
                    )}
                  </div>

                  {/* Urgence Section */}
                  {(selectedEmployee.personne_urgence || selectedEmployee.telephone_personne_urgence || selectedEmployee.relation_personne_urgence) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        Urgence
                      </p>
                      <div className="space-y-2">
                        {selectedEmployee.personne_urgence && (
                          <InfoRow icon={User} label="Personne" value={selectedEmployee.personne_urgence} compact />
                        )}
                        {selectedEmployee.telephone_personne_urgence && (
                          <InfoRow icon={Phone} label="Téléphone" value={selectedEmployee.telephone_personne_urgence} compact />
                        )}
                        {selectedEmployee.relation_personne_urgence && (
                          <InfoRow icon={Users} label="Relation" value={selectedEmployee.relation_personne_urgence} compact />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates Section */}
                  {(selectedEmployee.date_Embauche || selectedEmployee.date_Depart) && (
                    <div className="space-y-2">
                      {selectedEmployee.date_Embauche && (
                        <InfoRow
                          icon={Calendar}
                          label="Date d'embauche"
                          value={format(new Date(selectedEmployee.date_Embauche), "d MMMM yyyy", { locale: fr })}
                        />
                      )}
                      {selectedEmployee.date_Depart && (
                        <InfoRow
                          icon={Calendar}
                          label="Date de départ"
                          value={format(new Date(selectedEmployee.date_Depart), "d MMMM yyyy", { locale: fr })}
                        />
                      )}
                    </div>
                  )}

                  {/* User Account */}
                  {selectedEmployee.user && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-900">Compte utilisateur</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-500">Nom</span>{" "}<span className="font-medium">{selectedEmployee.user.firstName} {selectedEmployee.user.lastName}</span></p>
                        <p><span className="text-slate-500">Email</span>{" "}<span className="font-medium break-all">{selectedEmployee.user.email}</span></p>
                        {selectedEmployee.user.department && (
                          <p><span className="text-slate-500">Département</span>{" "}<span className="font-medium">{selectedEmployee.user.department}</span></p>
                        )}
                        {selectedEmployee.user.telephone && (
                          <p><span className="text-slate-500">Téléphone</span>{" "}<span className="font-medium">{selectedEmployee.user.telephone}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 pb-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 font-medium"
                      onClick={(e) => {
                        handleEditEmployee(e, selectedEmployee);
                        setDetailSheetOpen(false);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 h-11 font-medium"
                      onClick={(e) => handleDeleteEmployee(e, selectedEmployee.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Page;
