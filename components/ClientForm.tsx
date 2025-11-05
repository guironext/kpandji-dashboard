"use client";

import React, { useState } from 'react';
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
import { createClient } from '@/lib/actions/client';
import { toast } from 'sonner';
import { Loader2, User} from 'lucide-react';

const clientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().min(8, 'Le téléphone doit contenir au moins 8 caractères'),
  entreprise: z.string().optional(),
  secteur_activite: z.string().optional(),
  localisation: z.string().optional(),
  commercial: z.string().optional(),
  status_client: z.enum(['CLIENT', 'PROSPECT', 'FAVORABLE', 'A_SUIVRE', 'ABANDONNE']),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  userId: string;
  userName?: string;
  onSuccess?: () => void;
}

export function ClientForm({ userId, userName, onSuccess }: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: '',
      email: '',
      telephone: '',
      entreprise: '',
      secteur_activite: '',
      localisation: '',
      commercial: userName || '',
      status_client: 'PROSPECT',
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createClient({
        ...data,
        userId,
      });

      if (result.success) {
        toast.success('Client créé avec succès!');
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de la création du client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erreur lors de la création du client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} />
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
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+33 1 23 45 67 89" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jean.dupont@email.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entreprise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'entreprise" {...field} />
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

            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Créer Client
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
