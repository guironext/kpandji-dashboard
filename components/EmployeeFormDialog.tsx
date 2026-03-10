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
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { createEmployee, updateEmployee } from '@/lib/actions/employee';
import { toast } from 'sonner';
import { Loader2, User, Plus, Upload, X, UserCircle, Phone, AlertCircle, ImageIcon } from 'lucide-react';
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
  numro_matricule: z.string().optional(),
  poste: z.string().optional(),
  date_Embauche: z.string().optional(),
  personne_urgence: z.string().optional(),
  telephone_personne_urgence: z.string().optional(),
  relation_personne_urgence: z.string().optional(),
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
  numro_matricule?: string | null;
  poste?: string | null;
  date_Embauche?: Date | string | null;
  personne_urgence?: string | null;
  telephone_personne_urgence?: string | null;
  relation_personne_urgence?: string | null;
}

interface EmployeeFormDialogProps {
  onSuccess?: () => void;
  editingEmployee?: Employee | null;
  triggerLabel?: string; 
}

export function EmployeeFormDialog({ onSuccess, editingEmployee, triggerLabel = "Enregistrer un Employé" }: EmployeeFormDialogProps) {
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
      numro_matricule: '',
      poste: '',
      date_Embauche: '',
      personne_urgence: '',
      telephone_personne_urgence: '',
      relation_personne_urgence: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingEmployee) {
      const dateEmbauche = editingEmployee.date_Embauche
        ? (typeof editingEmployee.date_Embauche === 'string'
            ? editingEmployee.date_Embauche
            : (editingEmployee.date_Embauche as Date).toISOString().split('T')[0])
        : '';
      form.reset({
        nom: editingEmployee.nom,
        prenoms: editingEmployee.prenoms,
        contact: editingEmployee.contact,
        adresse: editingEmployee.adresse || '',
        image: editingEmployee.image || '',
        bloodType: editingEmployee.bloodType && ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(editingEmployee.bloodType) ? editingEmployee.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" : undefined,
        specialite: editingEmployee.specialite || '',
        email: editingEmployee.email || '',
        numro_matricule: editingEmployee.numro_matricule || '',
        poste: editingEmployee.poste || '',
        date_Embauche: dateEmbauche,
        personne_urgence: editingEmployee.personne_urgence || '',
        telephone_personne_urgence: editingEmployee.telephone_personne_urgence || '',
        relation_personne_urgence: editingEmployee.relation_personne_urgence || '',
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
        numro_matricule: '',
        poste: '',
        date_Embauche: '',
        personne_urgence: '',
        telephone_personne_urgence: '',
        relation_personne_urgence: '',
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

      // Pass date as ISO string for reliable server action serialization
      const dateEmbaucheIso = data.date_Embauche ? new Date(data.date_Embauche).toISOString() : null;
      const payload = {
        nom: data.nom,
        prenoms: data.prenoms,
        contact: data.contact,
        adresse: data.adresse || null,
        image: imageUrl || null,
        bloodType: data.bloodType || null,
        specialite: data.specialite,
        email: data.email || null,
        numro_matricule: data.numro_matricule || null,
        poste: data.poste || null,
        date_Embauche: dateEmbaucheIso,
        personne_urgence: data.personne_urgence || null,
        telephone_personne_urgence: data.telephone_personne_urgence || null,
        relation_personne_urgence: data.relation_personne_urgence || null,
      };

      let result;
      if (isEditing && editingEmployee) {
        result = await updateEmployee(editingEmployee.id, payload);
      } else {
        result = await createEmployee({
          ...payload,
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
          <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5">
            <Plus className="h-5 w-5" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <UserCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white tracking-tight">
                {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-sm mt-0.5">
                {isEditing ? 'Mettez à jour les informations' : 'Remplissez le formulaire pour enregistrer un employé'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <Tabs defaultValue="identite" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-4 border-b bg-slate-50/80">
                <TabsList className="h-11 w-full justify-start gap-1 bg-transparent p-0 rounded-none border-0">
                  <TabsTrigger value="identite" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Identité
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="urgence" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Urgence
                  </TabsTrigger>
                  <TabsTrigger value="photo" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="identite" className="mt-0 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Nom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Dupont" className="h-11" {...field} />
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
                          <FormLabel className="text-slate-700 font-medium">Prénoms *</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean Marie" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numro_matricule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Matricule</FormLabel>
                          <FormControl>
                            <Input placeholder="EMP-001" className="h-11 font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date_Embauche"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Date d&apos;embauche</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="mt-0 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Contact *</FormLabel>
                          <FormControl>
                            <Input placeholder="+225 01 02 03 04 05" className="h-11" {...field} />
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
                          <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="jean.dupont@email.com" type="email" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="poste"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Poste</FormLabel>
                          <FormControl>
                            <Input placeholder="Développeur, Comptable..." className="h-11" {...field} />
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
                          <FormLabel className="text-slate-700 font-medium">Spécialité *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Développeur web" className="h-11" {...field} />
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
                          <FormLabel className="text-slate-700 font-medium">Groupe sanguin</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Sélectionner" />
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
                          <FormLabel className="text-slate-700 font-medium">Adresse</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Rue de la Paix, Abidjan" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="urgence" className="mt-0">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-5">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Personne à contacter en cas d&apos;urgence
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="personne_urgence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Nom complet</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom de la personne" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telephone_personne_urgence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Téléphone</FormLabel>
                            <FormControl>
                              <Input placeholder="+225 01 02 03 04 05" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="relation_personne_urgence"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-slate-700 font-medium">Relation</FormLabel>
                            <FormControl>
                              <Input placeholder="Conjoint, Parent, Frère/Sœur..." className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="photo" className="mt-0">
                  <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col items-center gap-4">
                            {previewUrl ? (
                              <div className="relative group">
                                <div className="overflow-hidden rounded-2xl ring-2 ring-slate-200 ring-offset-4">
                                  <Image
                                    src={previewUrl}
                                    alt="Photo employé"
                                    width={160}
                                    height={160}
                                    className="object-cover aspect-square"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-9 w-9 rounded-full shadow-lg"
                                  onClick={removeImage}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <label
                                htmlFor="image-upload"
                                className="flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200 group"
                              >
                                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-emerald-600">
                                  <div className="rounded-full bg-slate-200/80 p-4 group-hover:bg-emerald-100">
                                    <Upload className="h-8 w-8" />
                                  </div>
                                  <span className="text-sm font-medium">Glissez une photo ou cliquez</span>
                                  <span className="text-xs">JPG, PNG — max 5 Mo</span>
                                </div>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  id="image-upload"
                                />
                              </label>
                            )}
                            {previewUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('image-upload')?.click()}
                              >
                                Changer la photo
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <Separator />
            <DialogFooter className="px-6 py-4 bg-slate-50/80 flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1 h-11 font-medium"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Modification...' : 'Enregistrer'}
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {isEditing ? 'Enregistrer les modifications' : 'Créer l\'employé'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}