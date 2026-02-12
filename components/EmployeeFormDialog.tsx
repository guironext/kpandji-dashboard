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
import { createEmployee, updateEmployee } from '@/lib/actions/employee';
import { toast } from 'sonner';
import { Loader2, User, Plus, Upload, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { put } from '@vercel/blob';
import Image from 'next/image';

const employeeSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenoms: z.string().min(2, 'Les prénoms doivent contenir au moins 2 caractères'),
  contact: z.string().min(8, 'Le contact doit contenir au moins 8 caractères'),
  adresse: z.string().optional(),
  image: z.string().optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  specialite: z.string().min(2, 'La spécialité doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

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
}

interface EmployeeFormDialogProps {
  onSuccess?: () => void;
  editingEmployee?: Employee | null;
}

export function EmployeeFormDialog({ onSuccess, editingEmployee }: EmployeeFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { user } = useUser();

  const isEditing = !!editingEmployee;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    form.setValue('image', '');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nom: '',
      prenoms: '',
      contact: '',
      adresse: '',
      image: '',
      bloodType: undefined,
      specialite: '',
      email: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingEmployee) {
      form.reset({
        nom: editingEmployee.nom,
        prenoms: editingEmployee.prenoms,
        contact: editingEmployee.contact,
        adresse: editingEmployee.adresse || '',
        image: editingEmployee.image || '',
        bloodType: editingEmployee.bloodType && ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(editingEmployee.bloodType) ? editingEmployee.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" : undefined,
        specialite: editingEmployee.specialite || '',
        email: editingEmployee.email || '',
      });
      setPreviewUrl(editingEmployee.image || null);
      setIsOpen(true);
    } else {
      form.reset({
        nom: '',
        prenoms: '',
        contact: '',
        adresse: '',
        image: '',
        bloodType: undefined,
        specialite: '',
        email: '',
      });
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  }, [editingEmployee, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = data.image ?? null;

      // Upload image if selected
      if (selectedFile) {
        if (!process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN) {
          toast.error('Configuration manquante: BLOB_READ_WRITE_TOKEN non configuré. L\'image ne sera pas uploadée.');
          imageUrl = null; // Proceed without image
        } else {
          try {
            const blob = await put(`employee-${Date.now()}-${selectedFile.name}`, selectedFile, {
              access: 'public',
              token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
            });
            imageUrl = blob.url;
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            toast.error('Erreur lors de l\'upload de l\'image');
            return;
          }
        }
      }

      let result;
      if (isEditing && editingEmployee) {
        result = await updateEmployee(editingEmployee.id, {
          nom: data.nom,
          prenoms: data.prenoms,
          contact: data.contact,
          adresse: data.adresse || null,
          image: imageUrl || null,
          bloodType: data.bloodType || null,
          specialite: data.specialite,
          email: data.email || null,
        });
      } else {
        result = await createEmployee({
          ...data,
          image: imageUrl,
          userId: user.id,
        });
      }

      if (result.success) {
        toast.success(isEditing ? 'Employé modifié avec succès!' : 'Employé créé avec succès!');
        form.reset();
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} de l'employé`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} employee:`, error);
      toast.error(`Erreur lors de ${isEditing ? 'la modification' : 'la création'} de l'employé`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
            <Plus className="h-5 w-5" />
            Enregistrer un Employé
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Modifier l\'employé' : 'Enregistrer un nouvel employé'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {isEditing ? 'Modifiez les informations de l\'employé' : 'Ajoutez un nouvel employé à votre équipe'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prenoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénoms *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Marie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact *</FormLabel>
                    <FormControl>
                      <Input placeholder="+225 01 02 03 04 05" {...field} />
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
                name="specialite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialité *</FormLabel>
                    <FormControl>
                      <Input placeholder="Développeur, Comptable, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Groupe sanguin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un groupe sanguin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Rue de la Paix, Abidjan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>URL de l&#39;image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {previewUrl ? (
                          <div className="relative inline-block">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              width={100}
                              height={100}
                              className="rounded-lg object-cover border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={removeImage}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600 mb-2">
                              Cliquez pour sélectionner une image
                            </div>
                            <div className="text-xs text-gray-500">
                              JPG, PNG jusqu&apos;à 5MB
                            </div>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          className="w-full"
                        >
                          {previewUrl ? 'Changer l\'image' : 'Sélectionner une image'}
                        </Button>
                      </div>
                    </FormControl>
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
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Modification...' : 'Enregistrement...'}
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Créer l&#39;employé
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}