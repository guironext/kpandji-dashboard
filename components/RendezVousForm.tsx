"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { Loader2, Calendar, User, Building2, Plus } from 'lucide-react';
import { Client, ClientEntreprise } from '@/lib/types/rendezvous';

const rendezVousSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  time: z.string().min(1, 'L\'heure est requise'),
  clientType: z.enum(['CLIENT', 'CLIENT_ENTREPRISE'], {
    message: 'Veuillez sélectionner un type de client',
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
        const [clientsRes, clientEntreprisesRes] = await Promise.all([
          fetch(`/api/prospects/clients?userId=${encodeURIComponent(clerkUserId)}`),
          fetch(`/api/prospects/client-entreprises?userId=${encodeURIComponent(clerkUserId)}`),
        ]);
        const [clientsResult, clientEntreprisesResult] = await Promise.all([
          clientsRes.json().catch(() => ({ success: false })),
          clientEntreprisesRes.json().catch(() => ({ success: false })),
        ]);

        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data as Client[] || []);
        }
        if (clientEntreprisesResult.success && clientEntreprisesResult.data) {
          setClientEntreprises(clientEntreprisesResult.data as ClientEntreprise[] || []);
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
    const submitWithRetry = async (retries = 3) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const dateTime = new Date(`${data.date}T${data.time}`);
          const res = await fetch('/api/rendez-vous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: dateTime.toISOString(),
              statut: 'EN_ATTENTE',
              clientId: data.clientType === 'CLIENT' ? data.clientId : undefined,
              clientEntrepriseId: data.clientType === 'CLIENT_ENTREPRISE' ? data.clientId : undefined,
            }),
            credentials: 'same-origin',
          });
          const result = await res.json().catch(() => ({}));

          if (result.success) {
            toast.success('Rendez-vous créé avec succès!');
            form.reset();
            setIsOpen(false);
            onSuccess?.();
            return;
          }
          toast.error(result.error || 'Erreur lors de la création du rendez-vous');
          return;
        } catch (error) {
          if (attempt === retries - 1) throw error;
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
    };

    try {
      await submitWithRetry();
    } catch (error) {
      console.error('Error creating rendez-vous:', error);
      const raw = error instanceof Error ? error.message : String(error);
      const msg =
        raw.includes('fetch') || raw.includes('network') || raw.includes('Load failed')
          ? 'Erreur réseau. Vérifiez votre connexion et réessayez.'
          : raw;
      toast.error(msg || 'Erreur lors de la création du rendez-vous');
    } finally {
      setIsSubmitting(false);
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
      <DialogContent className="flex max-h-[min(90dvh,100vh)] min-h-0 w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 space-y-3 border-b border-gray-100 px-4 pb-4 pt-6 sm:space-y-4 sm:px-6 sm:pb-6">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-2">
              <Calendar className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-xl font-bold text-gray-900 sm:text-2xl">
                Créer un nouveau rendez-vous
              </DialogTitle>
              <DialogDescription className="mt-1 text-left text-gray-600">
                Planifiez un rendez-vous avec un de vos clients
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
              <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:space-y-6 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Date et heure
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
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

            <div className="space-y-4 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50 p-4 sm:space-y-6 sm:p-6">
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
                      <SelectContent className="max-h-[min(25rem,var(--radix-select-content-available-height))]">
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
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-gray-200 bg-background px-4 py-4 sm:px-6 sm:py-6">
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="w-full border-gray-200 hover:bg-gray-50 sm:flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 sm:flex-1"
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
