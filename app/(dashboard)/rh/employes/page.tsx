"use client";

import React, { useState, useEffect } from 'react';
import { EmployeeFormDialog } from '@/components/EmployeeFormDialog';
import { getAllEmployees, deleteEmployee } from '@/lib/actions/employee';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, MapPin, User, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

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
        setEmployees(result.data || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      const result = await deleteEmployee(employeeId);
      if (result.success) {
        toast.success('Employé supprimé avec succès');
        loadEmployees();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  return (
    <div className="space-y-6">
      {/* Top button */}
      <div className="flex justify-start">
        <EmployeeFormDialog
          onSuccess={handleEmployeeCreated}
          editingEmployee={editingEmployee}
        />
      </div>

      {/* Employees table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des Employés
          </CardTitle>
          <CardDescription>
            Gestion des employés de l&apos;entreprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun employé trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Groupe sanguin</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      {employee.image ? (
                        <Image
                          src={employee.image}
                          alt={`${employee.nom} ${employee.prenoms}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.nom} {employee.prenoms}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {employee.contact}
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {employee.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.specialite && (
                        <Badge variant="secondary">{employee.specialite}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.bloodType && (
                        <Badge variant="outline">{employee.bloodType}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.adresse && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {employee.adresse}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;