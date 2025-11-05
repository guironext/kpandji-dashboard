"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientEntreprise } from '@/lib/actions/client_entreprise';
import { toast } from 'sonner';
import { Loader2, Building2, Users } from 'lucide-react';

const clientEntrepriseSchema = z.object({
  nom_entreprise: z.string().min(2, 'Le nom de l&apos;entreprise doit contenir au moins 2 caractères'),
  sigle: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().min(8, 'Le téléphone doit contenir au moins 8 caractères'),
  nom_personne_contact: z.string().optional(),
  fonction_personne_contact: z.string().optional(),
  email_personne_contact: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone_personne_contact: z.string().optional(),
  localisation: z.string().optional(),
  secteur_activite: z.string().optional(),
  flotte_vehicules: z.boolean().default(false),
  flotte_vehicules_description: z.string().optional(),
  commercial: z.string().optional(),
  status_client: z.enum(['CLIENT', 'PROSPECT', 'FAVORABLE', 'A_SUIVRE', 'ABANDONNE']).default('PROSPECT'),
});

type ClientEntrepriseFormData = z.infer<typeof clientEntrepriseSchema>;

interface ClientEntrepriseFormProps {
  userId: string;
  userName?: string;
  onSuccess?: () => void;
}

export function ClientEntrepriseForm({ userId, userName, onSuccess }: ClientEntrepriseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientEntrepriseFormData>({
    resolver: zodResolver(clientEntrepriseSchema),
    defaultValues: {
      nom_entreprise: '',
      sigle: '',
      email: '',
      telephone: '',
      nom_personne_contact: '',
      fonction_personne_contact: '',
      email_personne_contact: '',
      telephone_personne_contact: '',
      localisation: '',
      secteur_activite: '',
      flotte_vehicules: false,
      flotte_vehicules_description: '',
      commercial: userName || '',
      status_client: 'PROSPECT',
    },
  });

  const onSubmit = async (data: ClientEntrepriseFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createClientEntreprise({
        ...data,
        userId,
      });

      if (result.success) {
        toast.success('Client entreprise créé avec succès!');
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de la création du client entreprise');
      }
    } catch (error) {
      console.error('Error creating client entreprise:', error);
      toast.error('Erreur lors de la création du client entreprise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const flotteVehicules = form.watch('flotte_vehicules');

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations de l'entreprise */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informations de l&apos;entreprise
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom_entreprise"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l&apos;entreprise *</FormLabel>
                    <FormControl>
                        <Input placeholder="ABC Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sigle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sigle</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@abc-corp.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone entreprise *</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 1 23 45 67 89" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="localisation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation</FormLabel>
                      <FormControl>
                        <Input placeholder="Paris, France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secteur_activite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secteur d&apos;activité</FormLabel>
                      <FormControl>
                        <Input placeholder="Automobile, Finance, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Personne de contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Personne de contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom_personne_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Marie Martin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fonction_personne_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonction</FormLabel>
                      <FormControl>
                        <Input placeholder="Directeur des achats" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_personne_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email contact</FormLabel>
                      <FormControl>
                        <Input placeholder="marie.martin@abc-corp.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telephone_personne_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone contact</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 6 12 34 56 78" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informations commerciales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations commerciales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commercial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commercial assigné</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nom du commercial" 
                          {...field} 
                          readOnly 
                          className="bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status_client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROSPECT">Prospect</SelectItem>
                          <SelectItem value="CLIENT">Client</SelectItem>
                          <SelectItem value="FAVORABLE">Favorable</SelectItem>
                          <SelectItem value="A_SUIVRE">À suivre</SelectItem>
                          <SelectItem value="ABANDONNE">Abandonné</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="flotte_vehicules"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Possède une flotte de véhicules
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {flotteVehicules && (
                <FormField
                  control={form.control}
                  name="flotte_vehicules_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description de la flotte</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Décrivez la flotte de véhicules (nombre, types, etc.)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="min-w-[160px] bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Créer Entreprise
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
