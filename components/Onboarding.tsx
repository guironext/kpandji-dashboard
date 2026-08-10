"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { completeUserOnboarding } from "@/lib/actions/onboarding";
import { getRedirectForRole } from "@/lib/role-redirects";
import { UserRole } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const employeeSchema = z.object({
  firstName: z.string().min(1, "Prénoms obligatoire").max(55),
  lastName: z.string().min(1, "Nom obligatoire").max(55),
  email: z.string().email("Email invalide").max(100),
  department: z.string().optional(),
  telephone: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  COMMERCIAL: "Commercial",
  CHEFUSINE: "Chef Usine",
  CHEFEQUIPE: "Chef Équipe",
  MAGASINIER: "Magasinier",
  RH: "RH",
  JURIDIQUE: "Juridique",
  CHEFQUALITE: "Chef Qualité",
  EMPLOYEE: "Employé",
  SAV: "SAV",
  LOGISTIQUE: "Logistique",
  FINANCE: "Finance",
  DIRECTEUR_GENERAL: "Directeur Général",
  CLIENTELLE: "Clientèle",
  COMPTABLE: "Comptable",
  CONCESSIONAIRE: "Concessionnaire",
  SUPERVISEUR: "Superviseur",
  COMMUNICATION: "Communication",
  RESPONSABLE_COMMERCIAL: "Responsable Commercial",
  ASSISTANTE: "Assistante",
  INFOGRAPHIE: "Infographie",
  COMMUNITY_MANAGER: "Community Manager",
  MARKETING: "Marketing",
  DEVELOPPEUR: "Développeur",
  DESIGNER: "Designer",
};

const USER_ROLES = Object.values(UserRole) as UserRole[];

interface OnboardingFormProps {
  userEmail: string;
  firstName: string;
  lastName: string;
}

const OnboardingForm = ({
  userEmail,
  firstName,
  lastName,
}: OnboardingFormProps) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [accountType, setAccountType] = useState<UserRole>(UserRole.EMPLOYEE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName,
      lastName,
      email: userEmail,
      department: "",
      telephone: "",
    },
  });

  const handleEmployeeSubmit = async (data: EmployeeFormValues) => {
    if (!user) {
      setError("Session utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await completeUserOnboarding(
        data.department || undefined,
        user.id,
        accountType,
        data.telephone || undefined,
      );

      if (!response?.success) {
        setError(
          response?.error ?? "Impossible de compléter l'inscription.",
        );
        return;
      }

      toast.success("Compte créé avec succès.");

      // Refresh Clerk session so middleware sees the new role immediately
      await user.reload();
      await getToken({ skipCache: true });

      const redirectPath = getRedirectForRole(response.role) ?? "/";
      window.location.replace(redirectPath);
      return;
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de compléter l'inscription.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600" />
          <p className="mt-4 text-orange-800">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-200/50 bg-white/95 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 to-yellow-100/30" />

      <div className="relative z-10 p-6 sm:p-8">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="space-y-4 text-center">
            <CardTitle className="text-2xl font-bold sm:text-3xl">
              <span className="bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                Bienvenue sur
              </span>
              <br />
              <span className="text-2xl text-gray-800">
                KPANDJI MANAGEMENT BOARD
              </span>
            </CardTitle>

            <CardDescription className="text-base text-gray-600 sm:text-lg">
              Complétez ce formulaire pour créer votre compte
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-700">
                Type de compte
              </Label>
              <Select
                value={accountType}
                onValueChange={(value) => setAccountType(value as UserRole)}
              >
                <SelectTrigger className="border-gray-200 bg-white focus:border-orange-400 focus:ring-orange-400">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-orange-200" />

            <Form {...employeeForm}>
              <form
                onSubmit={employeeForm.handleSubmit(handleEmployeeSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={employeeForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">
                          Prénoms
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="border-gray-200 bg-gray-50 text-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={employeeForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">
                          Nom
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="border-gray-200 bg-gray-50 text-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={employeeForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          className="border-gray-200 bg-gray-50 text-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employeeForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Département (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ex: Ingénierie, Ventes, etc."
                          className="border-gray-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employeeForm.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Téléphone (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ex: +225 07 12 34 56 78"
                          className="border-gray-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full border-0 bg-gradient-to-r from-orange-600 to-amber-600 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-orange-700 hover:to-amber-700 hover:shadow-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                      Traitement en cours...
                    </span>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingForm;
