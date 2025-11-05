"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createRendezVous, getClientsByUser, getClientEntreprisesByUser } from '@/lib/actions/rendezvous';
import { toast } from 'sonner';
import { Loader2, Calendar, User, Building2, Plus } from 'lucide-react';
import { Client, ClientEntreprise } from '@/lib/types/rendezvous';

const rendezVousSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  time: z.string().min(1, 'L\'heure est requise'),
  clientType: z.enum(['CLIENT', 'CLIENT_ENTREPRISE'], {
    required_error: 'Veuillez sélectionner un type de client',
  }),
  clientId: z.string().min(1, 'Veuillez sélectionner un client'),
});

type RendezVousFormData = z.infer<typeof rendezVousSchema>;

interface RendezVousFormProps {
  clerkUserId: string;
  onSuccess?: () => void;
}

export function RendezVousForm({ clerkUserId, onSuccess }: RendezVousFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientEntreprises, setClientEntreprises] = useState<ClientEntreprise[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const form = useForm<RendezVousFormData>({
    resolver: zodResolver(rendezVousSchema),
    defaultValues: {
      date: '',
      time: '',
      clientType: 'CLIENT',
      clientId: '',
    },
  });

  const clientType = form.watch('clientType');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        const [clientsResult, clientEntreprisesResult] = await Promise.all([
          getClientsByUser(clerkUserId),
          getClientEntreprisesByUser(clerkUserId)
        ]);

        if (clientsResult.success) {
          setClients(clientsResult.data);
        }
        if (clientEntreprisesResult.success) {
          setClientEntreprises(clientEntreprisesResult.data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Erreur lors du chargement des clients');
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [clerkUserId]);

  const onSubmit = async (data: RendezVousFormData) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      const result = await createRendezVous({
        date: dateTime,
        statut: 'EN_ATTENTE',
        clientId: data.clientType === 'CLIENT' ? data.clientId : undefined,
        clientEntrepriseId: data.clientType === 'CLIENT_ENTREPRISE' ? data.clientId : undefined,
      });

      if (result.success) {
        toast.success('Rendez-vous créé avec succès!');
        form.reset();
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de la création du rendez-vous');
      }
    } catch (error) {
      console.error('Error creating rendez-vous:', error);
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientName = (clientId: string, type: string) => {
    if (type === 'CLIENT') {
      const client = clients.find(c => c.id === clientId);
      return client ? `${client.nom} (${client.telephone})` : '';
    } else {
      const clientEntreprise = clientEntreprises.find(c => c.id === clientId);
      return clientEntreprise ? `${clientEntreprise.nom_entreprise} (${clientEntreprise.telephone})` : '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          <Plus className="h-5 w-5" />
          Nouveau Rendez-vous
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Créer un nouveau rendez-vous
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Planifiez un rendez-vous avec un de vos clients
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Date et heure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Heure *</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Sélection du client
              </h3>
              
              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Type de client *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Sélectionner le type de client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CLIENT">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Client particulier
                          </div>
                        </SelectItem>
                        <SelectItem value="CLIENT_ENTREPRISE">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Client entreprise
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder={
                            loadingClients 
                              ? "Chargement des clients..." 
                              : `Sélectionner un ${clientType === 'CLIENT' ? 'client' : 'client entreprise'}`
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientType === 'CLIENT' ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{client.nom}</span>
                                <span className="text-sm text-gray-500">
                                  {client.telephone} {client.email && `• ${client.email}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          clientEntreprises.map((clientEntreprise) => (
                            <SelectItem key={clientEntreprise.id} value={clientEntreprise.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{clientEntreprise.nom_entreprise}</span>
                                <span className="text-sm text-gray-500">
                                  {clientEntreprise.telephone} {clientEntreprise.email && `• ${clientEntreprise.email}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <DialogFooter className="pt-6 border-t border-gray-200">
              <div className="flex gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 border-gray-200 hover:bg-gray-50"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le rendez-vous
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
