"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Users,
  Building2,
  Briefcase,
  Loader2,
  UserPlus,
  Sparkles,
  FolderKanban,
  XCircle,
} from "lucide-react";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import type { CommunicationProjectActor } from "@/lib/actions/communication-actor";
import { cn } from "@/lib/utils";

interface ActeursRolesClientProps {
  initialProjects: CommunicationProjectListItem[];
}

export default function ActeursRolesClient({
  initialProjects,
}: ActeursRolesClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [actors, setActors] = useState<CommunicationProjectActor[]>([]);
  const [isLoadingActors, setIsLoadingActors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    job: "",
  });

  // Load actors when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadActors(selectedProjectId);
    } else {
      setActors([]);
    }
  }, [selectedProjectId]);

  const loadActors = async (projectId: string) => {
    setIsLoadingActors(true);
    try {
      const response = await fetch(
        `/api/communication/actors?projectId=${projectId}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur lors du chargement des acteurs";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText || response.statusText}`;
        }
        console.error("Error loading actors:", errorMessage);
        toast.error(errorMessage);
        setActors([]);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setActors(data.actors);
      } else {
        toast.error("Erreur lors du chargement des acteurs");
        setActors([]);
      }
    } catch (error) {
      console.error("Error loading actors:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur réseau: ${error.message}`
          : "Erreur lors du chargement des acteurs. Vérifiez votre connexion.";
      toast.error(errorMessage);
      setActors([]);
    } finally {
      setIsLoadingActors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      toast.error("Veuillez sélectionner un projet");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Le nom de l'acteur est obligatoire");
      return;
    }

    if (!formData.department.trim()) {
      toast.error("Le département est obligatoire");
      return;
    }

    if (!formData.job.trim()) {
      toast.error("Le poste est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/communication/actors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: formData.name.trim(),
          department: formData.department.trim(),
          job: formData.job.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur lors de l'ajout de l'acteur";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText || response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Acteur ajouté avec succès");
        setFormData({ name: "", department: "", job: "" });
        // Reload actors
        await loadActors(selectedProjectId);
      } else {
        toast.error(data.error || "Erreur lors de l'ajout de l'acteur");
      }
    } catch (error) {
      console.error("Error adding actor:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur réseau: ${error.message}`
          : "Erreur lors de l'ajout de l'acteur. Vérifiez votre connexion.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (actorId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet acteur ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/communication/actors?actorId=${actorId}&projectId=${selectedProjectId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur lors de la suppression de l'acteur";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText || response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Acteur supprimé avec succès");
        // Reload actors
        await loadActors(selectedProjectId);
      } else {
        toast.error(data.error || "Erreur lors de la suppression de l'acteur");
      }
    } catch (error) {
      console.error("Error deleting actor:", error);
      const errorMessage =
        error instanceof Error
          ? `Erreur réseau: ${error.message}`
          : "Erreur lors de la suppression de l'acteur. Vérifiez votre connexion.";
      toast.error(errorMessage);
    }
  };

  const selectedProject = initialProjects.find(
    (p) => p.id === selectedProjectId
  );

  // Generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-violet-500 to-purple-600",
      "bg-gradient-to-br from-cyan-500 to-teal-600",
      "bg-gradient-to-br from-rose-500 to-pink-600",
      "bg-gradient-to-br from-amber-500 to-orange-600",
      "bg-gradient-to-br from-emerald-500 to-green-600",
      "bg-gradient-to-br from-sky-500 to-blue-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/20">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Acteurs et Rôles
              </h1>
              <p className="text-slate-600 mt-1.5 text-lg">
                Gérez les acteurs et leurs responsabilités pour vos projets de communication
              </p>
            </div>
          </div>
        </div>

        {/* Project Selection Card */}
        <Card className="mb-6 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <FolderKanban className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-slate-800">
                  Sélectionner un projet
                </CardTitle>
                <CardDescription className="mt-1">
                  Choisissez un projet actif pour gérer ses acteurs et leurs rôles
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full h-12 text-base border-2 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-lg">
                <SelectValue placeholder="Sélectionner un projet actif..." />
              </SelectTrigger>
              <SelectContent>
                {initialProjects.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun projet actif disponible</p>
                  </div>
                ) : (
                  initialProjects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                      className="py-3 cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {project.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 border-emerald-200"
                          >
                            Actif
                          </Badge>
                        </div>
                        {project.createdBy && (
                          <span className="text-sm text-slate-500">
                            Créé par {project.createdBy.firstName}{" "}
                            {project.createdBy.lastName}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProjectId && (
          <>
            {/* Add Actor Form Card */}
            <Card className="mb-6 border-l-4 border-l-violet-500 shadow-lg bg-gradient-to-br from-white to-violet-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-md">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-slate-800">
                      Ajouter un acteur
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Ajoutez un nouvel acteur au projet{" "}
                      <span className="font-semibold text-violet-700">
                        {selectedProject?.name}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-slate-700 font-medium flex items-center gap-2"
                      >
                        <Users className="h-4 w-4 text-violet-600" />
                        Nom de l&apos;acteur{" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex: Jean Dupont"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="h-11 border-2 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-lg transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="department"
                        className="text-slate-700 font-medium flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4 text-cyan-600" />
                        Département{" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="department"
                        placeholder="Ex: Marketing"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        required
                        className="h-11 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-lg transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="job"
                        className="text-slate-700 font-medium flex items-center gap-2"
                      >
                        <Briefcase className="h-4 w-4 text-emerald-600" />
                        Poste{" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="job"
                        placeholder="Ex: Responsable Communication"
                        value={formData.job}
                        onChange={(e) =>
                          setFormData({ ...formData, job: e.target.value })
                        }
                        required
                        className="h-11 border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Ajouter l&apos;acteur
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Actors List Card */}
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-800">
                        Acteurs du projet
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Liste des acteurs associés au projet{" "}
                        <span className="font-semibold text-emerald-700">
                          {selectedProject?.name}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  {actors.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1.5 text-sm font-medium"
                    >
                      {actors.length} {actors.length === 1 ? "acteur" : "acteurs"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingActors ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600 mb-4" />
                    <p className="text-slate-600 font-medium">
                      Chargement des acteurs...
                    </p>
                  </div>
                ) : actors.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                      <Users className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      Aucun acteur ajouté
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Commencez par ajouter un acteur en remplissant le formulaire
                      ci-dessus
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actors.map((actor) => (
                      <div
                        key={actor.id}
                        className="group relative p-5 bg-white border-2 border-slate-200 rounded-xl hover:border-violet-300 hover:shadow-lg transition-all duration-200"
                      >
                        {/* Avatar */}
                        <div className="flex items-start gap-4 mb-4">
                          <div
                            className={cn(
                              "flex items-center justify-center w-14 h-14 rounded-xl text-white font-bold text-lg shadow-md",
                              getAvatarColor(actor.name)
                            )}
                          >
                            {getInitials(actor.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-lg mb-1 truncate">
                              {actor.name}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs"
                              >
                                <Building2 className="h-3 w-3 mr-1" />
                                {actor.department}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Job */}
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
                          <Briefcase className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <p className="text-sm text-slate-700 font-medium line-clamp-2">
                            {actor.job}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(actor.id)}
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 transition-all"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State when no project selected */}
        {!selectedProjectId && initialProjects.length > 0 && (
          <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="inline-flex p-4 bg-violet-100 rounded-full mb-4">
                  <Sparkles className="h-10 w-10 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Sélectionnez un projet pour commencer
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Choisissez un projet actif dans le menu déroulant ci-dessus pour
                  gérer ses acteurs et leurs rôles
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
