"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createNumeroCourrier, getNumeroCourrierById } from "@/lib/actions/courrier";
import { toast } from "sonner";
import { Loader2, FileText, Download, Mail, Calendar, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";

const numeroCourrierSchema = z.object({
  destinataire: z.string().min(1, "Le destinataire est requis"),
  objet: z.string().min(1, "L'objet est requis"),
  date: z.string().min(1, "La date est requise"),
});

type NumeroCourrierFormData = z.infer<typeof numeroCourrierSchema>;

interface NumeroCourrier {
  id: string;
  destinataire: string;
  objet: string;
  numero_courrier: string;
  date: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  User: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function NumeroCourrierClient() {
  const { userId: clerkId, isLoaded: authLoaded } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCourrier, setSavedCourrier] = useState<NumeroCourrier | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const form = useForm<NumeroCourrierFormData>({
    resolver: zodResolver(numeroCourrierSchema),
    defaultValues: {
      destinataire: "",
      objet: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Fetch database user ID and username from Clerk ID
  useEffect(() => {
    const fetchUser = async () => {
      if (!authLoaded || !userLoaded) {
        setIsLoadingUser(true);
        return;
      }

      if (!clerkId) {
        setIsLoadingUser(false);
        return;
      }

      setIsLoadingUser(true);
      try {
        // Use API route which will get or create user
        const response = await fetch(`/api/user/${clerkId}`);
        if (response.ok) {
          const user = await response.json();
          setDbUserId(user.id);
          const displayName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : clerkUser?.fullName || `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || "Utilisateur";
          setUsername(displayName);
        } else {
          // Fallback to Clerk user data
          if (clerkUser) {
            const displayName = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Utilisateur";
            setUsername(displayName);
            toast.warning("Votre compte n'est pas encore configuré dans la base de données.");
          } else {
            toast.error("Erreur: Impossible de récupérer les informations utilisateur");
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fallback to Clerk user data
        if (clerkUser) {
          const displayName = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Utilisateur";
          setUsername(displayName);
        }
        toast.error("Erreur lors de la récupération de l'utilisateur");
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, [clerkId, authLoaded, userLoaded, clerkUser]);

  const onSubmit = async (data: NumeroCourrierFormData) => {
    // Ensure we have user data before submitting
    if (!clerkId) {
      toast.error("Erreur: Utilisateur non authentifié");
      return;
    }

    // If dbUserId is not available, try to get or create user
    let finalUserId = dbUserId;
    let finalUsername = username;

    if (!finalUserId) {
      try {
        // Use API route which will get or create user
        const response = await fetch(`/api/user/${clerkId}`);
        if (response.ok) {
          const user = await response.json();
          finalUserId = user.id;
          finalUsername = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : clerkUser?.fullName || `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || "Utilisateur";
          setDbUserId(finalUserId);
          setUsername(finalUsername);
        } else {
          // Fallback to Clerk user data
          if (clerkUser) {
            finalUsername = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Utilisateur";
            setUsername(finalUsername);
            toast.error("Votre compte n'est pas configuré dans la base de données. Veuillez compléter l'onboarding.");
          } else {
            toast.error("Erreur: Impossible de récupérer les informations utilisateur");
          }
          return;
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fallback to Clerk user data
        if (clerkUser) {
          finalUsername = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Utilisateur";
          setUsername(finalUsername);
        }
        toast.error("Erreur lors de la récupération de l'utilisateur");
        return;
      }
    }

    if (!finalUsername && clerkUser) {
      finalUsername = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Utilisateur";
      setUsername(finalUsername);
    }

    if (!finalUserId || !finalUsername) {
      toast.error("Erreur: Informations utilisateur incomplètes");
      return;
    }

    setIsSubmitting(true);
    try {
      const dateObj = new Date(data.date);

      const result = await createNumeroCourrier({
        destinataire: data.destinataire,
        objet: data.objet,
        date: dateObj,
        username: finalUsername,
        userId: finalUserId,
      });

      if (result.success && result.data) {
        toast.success("Courrier créé avec succès!");
        
        // Fetch the complete courrier data
        const courrierResult = await getNumeroCourrierById(result.data.id);
        if (courrierResult.success && courrierResult.data) {
          setSavedCourrier(courrierResult.data as NumeroCourrier);
        }
        
        form.reset({
          destinataire: "",
          objet: "",
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        toast.error(result.error || "Erreur lors de la création du courrier");
      }
    } catch (error) {
      console.error("Error creating numero courrier:", error);
      toast.error("Erreur lors de la création du courrier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToWord = async () => {
    if (!savedCourrier) {
      toast.error("Aucun courrier à exporter");
      return;
    }

    setIsExporting(true);
    try {
      // Fetch logo for document (optional - may fail if CORS or path issue)
      let logoImageRun: ImageRun | null = null;
      try {
        const logoRes = await fetch("/logo2.png");
        if (logoRes.ok) {
          const logoBuf = await logoRes.arrayBuffer();
          logoImageRun = new ImageRun({
            type: "png",
            data: logoBuf,
            transformation: { width: 80, height: 80 },
          });
        }
      } catch {
        // Continue without logo
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                  width: 11906, // A4 width in twips (210mm)
                  height: 16838, // A4 height in twips (297mm)
                },
                margin: {
                  top: 1440, // 25mm in twips
                  right: 1134, // 20mm in twips
                  bottom: 1440, // 25mm in twips
                  left: 1134, // 20mm in twips
                },
              },
            },
            children: [
              // Header: Logo + Company (matches preview layout)
              ...(logoImageRun
                ? [
                    new Paragraph({
                      children: [logoImageRun],
                      spacing: { after: 200 },
                    }),
                  ]
                : []),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "KPANDJI AUTOMOBILE",
                    bold: true,
                    size: 28,
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "CONSTRUCTEUR & ASSEMBLEUR AUTOMOBILE",
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${format(new Date(savedCourrier.date), "dd/MM/yyyy")}`,
                    size: 22,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 },
              }),

              // Title block (COURRIER + N°) with bottom border
              new Paragraph({
                children: [
                  new TextRun({
                    text: "COURRIER",
                    bold: true,
                    size: 36,
                    allCaps: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `N°: KA/DCOM/${savedCourrier.numero_courrier}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
                border: {
                  bottom: {
                    color: "000000",
                    size: 24,
                    style: BorderStyle.SINGLE,
                  },
                },
              }),

              // Body: Destinataire
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Destinataire :",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 120, before: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: savedCourrier.destinataire,
                    size: 24,
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 400 },
              }),

              // Body: Objet
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Objet :",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: savedCourrier.objet,
                    size: 24,
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 600 },
              }),

              // Spacer to push footer down
              ...Array(12).fill(null).map(() =>
                new Paragraph({ text: "", spacing: { after: 240 } })
              ),

              // Footer: Créé par + Date de création (with top border)
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Créé par :",
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: ` ${savedCourrier.username}`,
                    size: 20,
                  }),
                ],
                spacing: { before: 400, after: 200 },
                border: {
                  top: {
                    color: "000000",
                    size: 24,
                    style: BorderStyle.SINGLE,
                  },
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Date de création :",
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: ` ${format(new Date(savedCourrier.createdAt), "dd/MM/yyyy")} à ${format(new Date(savedCourrier.createdAt), "HH:mm")}`,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 },
              }),

              // Footer: Company info (matches preview)
              new Paragraph({
                children: [
                  new TextRun({
                    text: "KPANDJI AUTOMOBILE",
                    bold: true,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120, before: 400 },
                border: {
                  top: {
                    color: "000000",
                    size: 6,
                    style: BorderStyle.SINGLE,
                  },
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Tel : 00225 01 01 04 77 03",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "RCCM : CI-ABJ-03-2022-B13-00710 / CC : 2213233",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ECOBANK : CI059 01046 121659429001 46",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "kpandjiautomobiles@gmail.com  /  www.kpandji.com",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Courrier_${savedCourrier.numero_courrier}_${format(new Date(), "yyyy-MM-dd")}.docx`;
      saveAs(blob, fileName);
      toast.success("Document Word exporté avec succès");
    } catch (error) {
      console.error("Error exporting to Word:", error);
      toast.error("Erreur lors de l'exportation du document");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] bg-slate-50">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-indigo-200/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-300/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Hero Header */}
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div 
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25"
                aria-hidden
              >
                <FileText className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Numéro de Courrier
                </h1>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                  Créez et gérez vos numéros de courrier officiels
                </p>
              </div>
            </div>
            {savedCourrier && (
              <Badge 
                variant="secondary" 
                className="shrink-0 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 px-4 py-2 text-sm font-medium"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Courrier créé
              </Badge>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Form Card */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Nouveau Courrier</CardTitle>
              </div>
              <CardDescription className="text-slate-600">
                Remplissez le formulaire pour générer un nouveau numéro de courrier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="destinataire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4 text-blue-600" />
                          Destinataire
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nom du destinataire"
                            {...field}
                            className="h-11 border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Objet
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Objet du courrier"
                            {...field}
                            className="min-h-[120px] resize-none border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="h-11 border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoadingUser || !clerkId}
                    className="h-11 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enregistrement en cours...
                      </>
                    ) : isLoadingUser ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Chargement des informations...
                      </>
                    ) : !clerkId ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2" />
                        Authentification requise
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Enregistrer le courrier
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Document Preview Card */}
          {savedCourrier ? (
            <Card className="border-0 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Aperçu du Document</CardTitle>
                      <CardDescription className="text-slate-600 mb-4">
                        N° KA/DCOM/{savedCourrier.numero_courrier}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={exportToWord}
                    disabled={isExporting}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25"
                    size="sm"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter en Word
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {/* A4 Document Preview */}
                <div className="flex justify-center rounded-xl bg-slate-100/50 p-4 sm:p-6">
                  <div 
                    className="mx-auto w-full max-w-full bg-white shadow-2xl ring-1 ring-slate-200/80 sm:w-[210mm] min-h-[297mm] aspect-[210/297] p-6 sm:p-[25mm_20mm]"
                    style={{ boxSizing: 'border-box' }}
                  >
                    {/* Document Header */}
                    <header className="border-b-2 border-slate-800 pb-4 mb-6">
                      <div className="flex  justify-between gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col items-start gap-4">
                          <Image 
                            src="/logo2.png" 
                            alt="KPANDJI AUTOMOBILE" 
                            width={80} 
                            height={80} 
                            className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
                          />
                          <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900 sm:text-xl">
                              KPANDJI AUTOMOBILE
                            </h1>
                        
                        </div>

                        
                            
                            <div className="mt-1 text-xs text-slate-700 sm:text-sm">
                              CONSTRUCTEUR & ASSEMBLEUR AUTOMOBILE
                            </div>
                         
                        
                      </div>
                      
                    </header>

                    {/* Document Body */}
                    <main className="flex-grow space-y-6 text-sm">
                      <div className="space-y-5">
                      <div className="mt-6 text-center">
                        
                        <div className="mt-2 text-sm font-semibold text-slate-700">
                          N°: KA/DCOM/{savedCourrier.numero_courrier}
                        </div>
                      </div>
                        <div>
                          <div className="mb-2 font-semibold text-slate-900">
                            Destinataire :
                          </div>
                          <div className="ml-4 text-base leading-relaxed text-slate-800">
                            {savedCourrier.destinataire}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 font-semibold text-slate-900">
                            Objet :
                          </div>
                          <div className="ml-4 whitespace-pre-wrap text-base leading-relaxed text-slate-800">
                            {savedCourrier.objet}
                          </div>
                        </div>


                        <div className="mb-4 flex flex-col gap-4 text-xs text-slate-600 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <div className="mb-1 font-semibold text-slate-700">Créé par :</div>
                          <div className="text-slate-800">{savedCourrier.username}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="mb-1 font-semibold text-slate-700">Date de création :</div>
                          <div className="text-slate-800">
                            {format(new Date(savedCourrier.createdAt), "dd/MM/yyyy")} à {format(new Date(savedCourrier.createdAt), "HH:mm")}
                          </div>
                        </div>
                      </div>


                      </div>

                      <div className="flex-grow" style={{ minHeight: '80mm' }} />
                    </main>

                    {/* Document Footer */}
                    <footer className="mt-auto border-t-2 border-slate-400 pt-4">
                      
                      <div className=" text-center text-xs text-slate-500">
                        <div className="font-medium">KPANDJI AUTOMOBILE</div>
                       
                        <div className="flex flex-col gap-2">
                       

<div>
                        Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tal : 00225 01 01 04 77 03


                        </div>

                        <div>
                        
RCCM : CI-ABJ-03-2022-B13-00710 / CC :2213233 – ECOBANK : CI059 01046 121659429001 46


                        </div>

                        <div>

kpandjiautomobiles@gmail.com  /  www.kpandji.com

                        </div>

                        </div>
                      </div>
                    </footer>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50/80">
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-8 p-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200/80">
                  <FileText className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-semibold text-slate-600">
                    Aperçu du Document
                  </h3>
                  <p className="max-w-sm text-sm text-slate-500">
                    Le document apparaîtra ici une fois que vous aurez créé un courrier
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
