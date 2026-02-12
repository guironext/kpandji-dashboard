"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientsByStatus } from "@/lib/actions/client";
import { User, Mail, Phone, Briefcase, Building2, Users } from "lucide-react";

interface Client {
  id: string;
  nom: string;
  email?: string | null;
  telephone: string;
  commercial?: string | null;
  entreprise?: string | null;
  secteur_activite?: string | null;
}

const Page = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const result = await getClientsByStatus("CLIENT");
        if (result.success && result.data) {
          setClients(result.data as unknown as Client[]);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Liste des Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun client trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Référent (Commercial)
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Entreprise
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Secteur d&apos;Activité
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{client.nom}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>{client.telephone}</TableCell>
                      <TableCell>{client.commercial || "-"}</TableCell>
                      <TableCell>{client.entreprise || "-"}</TableCell>
                      <TableCell>{client.secteur_activite || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
