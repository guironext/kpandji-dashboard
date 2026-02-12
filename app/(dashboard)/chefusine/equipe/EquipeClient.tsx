"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Crown,
  Trash2,
  CheckCircle,
  Edit,
  Package,
} from "lucide-react";
import { toast } from "sonner";

type Equipe = {
  id: string;
  nomEquipe: string;
  mission: string;
  taches_accomplies: string;
  stautsEquipe: string;
  membres: {
    id: string;
    qualite: string;
    fonction: string;
    employee: {
      id: string;
      nom: string;
      prenoms: string;
      specialite: string;
    };
  }[];
  chefEquipe: {
    id: string;
    nom: string;
    prenoms: string;
  };
};

type Employee = {
  id: string;
  nom: string;
  prenoms: string;
  specialite: string;
};

type TeamMember = {
  employee: Employee;
  isChef: boolean;
  fonction: string;
};

type Montage = {
  id: string;
  no_chassis: string;
  Commande_Montage_commandeIdToCommande: {
    Client?: {
      nom: string;
    };
    Client_entreprise?: {
      nom_entreprise: string;
    };
    VoitureModel?: {
      model: string;
    };
    date_livraison?: string;
  };
  OrdreMontage?: {
    NumeroChassis: {
      chassisNumber: string;
    };
  };
};

const EquipeClient: React.FC = () => {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [nomEquipe, setNomEquipe] = useState("");
  const [mission, setMission] = useState("");
  const [tachesAccomplies, setTachesAccomplies] = useState("");
  const [selectedMontage, setSelectedMontage] = useState("");
  const [montages, setMontages] = useState<Montage[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const availableEmployees = allEmployees.filter(
    (employee) =>
      !teamMembers.some((member) => member.employee.id === employee.id),
  );

  useEffect(() => {
    fetchEmployees();
    fetchMontages();
    fetchEquipes();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setAllEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchMontages = async () => {
    try {
      const response = await fetch("/api/montages?etape=EXECUTION");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched montages:", data);
        setMontages(data);
      } else {
        console.error("Failed to fetch montages:", response.status);
      }
    } catch (error) {
      console.error("Error fetching montages:", error);
    }
  };

  const fetchEquipes = async () => {
    try {
      const response = await fetch("/api/equipes?status=ACTIVE");
      if (response.ok) {
        const data = await response.json();
        setEquipes(data);
      }
    } catch (error) {
      console.error("Error fetching equipes:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, employee: Employee) => {
    e.dataTransfer.setData("employee", JSON.stringify(employee));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const employeeData = e.dataTransfer.getData("employee");
    if (employeeData) {
      const employee: Employee = JSON.parse(employeeData);
      if (!teamMembers.find((m) => m.employee.id === employee.id)) {
        setTeamMembers((prev) => [
          ...prev,
          { employee, isChef: false, fonction: "" },
        ]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeMember = (employeeId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.employee.id !== employeeId));
  };

  const setChef = (employeeId: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => ({ ...m, isChef: m.employee.id === employeeId })),
    );
  };

  const updateFonction = (employeeId: string, fonction: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.employee.id === employeeId ? { ...m, fonction } : m)),
    );
  };

  const handleCreateEquipe = async () => {
    if (
      !nomEquipe ||
      teamMembers.length === 0 ||
      !teamMembers.some((m) => m.isChef)
    ) {
      toast.error(
        "Veuillez remplir tous les champs et désigner un chef d'équipe",
      );
      return;
    }

    setIsLoading(true);
    try {
      const chef = teamMembers.find((m) => m.isChef);
      const membres = teamMembers.map((m) => ({
        employeeId: m.employee.id,
        isChef: m.isChef,
        fonction: m.fonction,
      }));

      const response = await fetch("/api/equipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomEquipe,
          mission,
          chefEquipeId: chef!.employee.id,
          taches_accomplies: tachesAccomplies,
          montageId: selectedMontage || null,
          membres,
        }),
      });

      if (response.ok) {
        toast.success("Équipe créée avec succès");
        // Reset form
        setNomEquipe("");
        setMission("");
        setTachesAccomplies("");
        setSelectedMontage("");
        setTeamMembers([]);
        fetchEquipes();
      } else {
        toast.error("Erreur lors de la création de l'équipe");
      }
    } catch (error) {
      console.error("Error creating equipe:", error);
      toast.error("Erreur lors de la création de l'équipe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEquipe = async (equipeId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
      try {
        const response = await fetch(`/api/equipes/${equipeId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          toast.success("Équipe supprimée avec succès");
          fetchEquipes();
        } else {
          toast.error("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Error deleting equipe:", error);
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleEditEquipe = (equipeId: string) => {
    const equipe = equipes.find((e) => e.id === equipeId);
    if (equipe) {
      setEditingEquipe(equipe);
      setNomEquipe(equipe.nomEquipe);
      setMission(equipe.mission);
      setTachesAccomplies(equipe.taches_accomplies);
      // Convert equipe membres to teamMembers format
      const members = equipe.membres.map((m) => ({
        employee: m.employee,
        isChef: m.qualite === "CHEF",
        fonction: m.fonction,
      }));
      setTeamMembers(members);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateEquipe = async () => {
    if (
      !editingEquipe ||
      !nomEquipe ||
      teamMembers.length === 0 ||
      !teamMembers.some((m) => m.isChef)
    ) {
      toast.error(
        "Veuillez remplir tous les champs et désigner un chef d'équipe",
      );
      return;
    }

    setIsLoading(true);
    try {
      const membres = teamMembers.map((m) => ({
        employeeId: m.employee.id,
        isChef: m.isChef,
        fonction: m.fonction,
      }));

      const response = await fetch(`/api/equipes/${editingEquipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomEquipe,
          mission,
          taches_accomplies: tachesAccomplies,
          membres,
        }),
      });

      if (response.ok) {
        toast.success("Équipe mise à jour avec succès");
        setIsEditModalOpen(false);
        setEditingEquipe(null);
        // Reset form
        setNomEquipe("");
        setMission("");
        setTachesAccomplies("");
        setTeamMembers([]);
        fetchEquipes();
      } else {
        toast.error("Erreur lors de la mise à jour de l'équipe");
      }
    } catch (error) {
      console.error("Error updating equipe:", error);
      toast.error("Erreur lors de la mise à jour de l'équipe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion des Équipes
                </h1>
                <p className="text-gray-600">
                  Créez et gérez vos équipes de montage
                </p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Créer Nouvelle Équipe
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employees List */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  Employés Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, employee)}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.nom} {employee.prenoms}
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {employee.specialite}
                          </Badge>
                        </div>
                        <div className="text-gray-400">
                          <UserPlus className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Composition */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  Composition de l&apos;Équipe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="nomEquipe"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nom de l&apos;Équipe
                    </Label>
                    <Input
                      id="nomEquipe"
                      value={nomEquipe}
                      onChange={(e) => setNomEquipe(e.target.value)}
                      placeholder="Entrez le nom de l'équipe"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="mission"
                      className="text-sm font-medium text-gray-700"
                    >
                      Mission
                    </Label>
                    <Input
                      id="mission"
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      placeholder="Entrez la mission de l'équipe"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="taches"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tâches Accomplies
                  </Label>
                  <Input
                    id="taches"
                    value={tachesAccomplies}
                    onChange={(e) => setTachesAccomplies(e.target.value)}
                    placeholder="Décrivez les tâches déjà accomplies"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label
                    htmlFor="montage"
                    className="text-sm font-medium text-gray-700"
                  >
                    Opération de Montage
                  </Label>
                  <Select
                    value={selectedMontage}
                    onValueChange={setSelectedMontage}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Sélectionner une opération de montage" />
                    </SelectTrigger>
                    <SelectContent>
                      {montages.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">
                            Aucune opération de montage en cours
                          </p>
                          <p className="text-xs mt-1">
                            Les montages doivent être en étape EXECUTION
                          </p>
                        </div>
                      ) : (
                        montages.map((montage) => {
                          const clientName =
                            montage.Commande_Montage_commandeIdToCommande?.Client?.nom ||
                            montage.Commande_Montage_commandeIdToCommande?.Client_entreprise?.nom_entreprise ||
                            "Client inconnu";
                          const voitureModel =
                            montage.Commande_Montage_commandeIdToCommande?.VoitureModel?.model ||
                            "Modèle inconnu";

                          return (
                            <SelectItem key={montage.id} value={montage.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {clientName} - {voitureModel}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Châssis:{" "}
                                  {montage.OrdreMontage?.NumeroChassis
                                    ?.chassisNumber || montage.no_chassis}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Team Members Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-48 bg-gray-50/50 hover:bg-blue-50/50 transition-colors duration-200"
                >
                  <div className="text-center mb-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Membres de l&apos;Équipe
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Glissez les employés ici pour les ajouter à l&apos;équipe
                    </p>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.employee.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="chef"
                              checked={member.isChef}
                              onChange={() => setChef(member.employee.id)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.employee.nom} {member.employee.prenoms}
                                {member.isChef && (
                                  <Crown className="inline h-4 w-4 ml-2 text-yellow-600" />
                                )}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {member.employee.specialite}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Input
                              placeholder="Fonction/Rôle"
                              value={member.fonction}
                              onChange={(e) =>
                                updateFonction(
                                  member.employee.id,
                                  e.target.value,
                                )
                              }
                              className="w-40 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.employee.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleCreateEquipe}
                    disabled={
                      isLoading ||
                      !nomEquipe ||
                      teamMembers.length === 0 ||
                      !teamMembers.some((m) => m.isChef)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Créer l&apos;Équipe
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing Teams */}
          <div className="lg:col-span-3 mt-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-5 w-5 text-purple-600" />
                  Équipes Existantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equipes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      Aucune équipe créée
                    </p>
                    <p className="text-sm">
                      Créez votre première équipe pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {equipes.map((equipe) => (
                      <Card
                        key={equipe.id}
                        className="hover:shadow-lg transition-shadow border border-gray-200"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {equipe.nomEquipe}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {equipe.mission}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {equipe.membres.length} membre
                              {equipe.membres.length > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Chef d&apos;équipe:
                            </p>
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium">
                                {equipe.chefEquipe.prenoms}{" "}
                                {equipe.chefEquipe.nom}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Membres:
                            </p>
                            <div className="space-y-1">
                              {equipe.membres.slice(0, 3).map((membre) => (
                                <div
                                  key={membre.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>
                                    {membre.employee.prenoms}{" "}
                                    {membre.employee.nom}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {membre.employee.specialite}
                                  </Badge>
                                </div>
                              ))}
                              {equipe.membres.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{equipe.membres.length - 3} autre
                                  {equipe.membres.length - 3 > 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </div>

                          {equipe.taches_accomplies && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">
                                Tâches:
                              </p>
                              <p className="text-xs text-gray-600">
                                {equipe.taches_accomplies}
                              </p>
                            </div>
                          )}
                        </CardContent>
                        <div className="p-4 border-t bg-gray-50 flex gap-2">
                          <Button
                            onClick={() => handleEditEquipe(equipe.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEquipe(equipe.id)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Equipe Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier l&apos;Équipe</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Team Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Informations de l&apos;Équipe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-nomEquipe">
                          Nom de l&apos;Équipe
                        </Label>
                        <Input
                          id="edit-nomEquipe"
                          value={nomEquipe}
                          onChange={(e) => setNomEquipe(e.target.value)}
                          placeholder="Entrez le nom de l'équipe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-mission">Mission</Label>
                        <Input
                          id="edit-mission"
                          value={mission}
                          onChange={(e) => setMission(e.target.value)}
                          placeholder="Entrez la mission de l'équipe"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-taches">Tâches Accomplies</Label>
                      <Input
                        id="edit-taches"
                        value={tachesAccomplies}
                        onChange={(e) => setTachesAccomplies(e.target.value)}
                        placeholder="Entrez les tâches accomplies"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Membres de l&apos;Équipe ({teamMembers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Team Members */}
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div
                            key={member.employee.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {member.isChef && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {member.employee.nom}{" "}
                                  {member.employee.prenoms}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {member.employee.specialite}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                value={member.fonction}
                                onChange={(e) =>
                                  updateFonction(
                                    member.employee.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Fonction"
                                className="w-32"
                              />
                              <Button
                                variant={member.isChef ? "default" : "outline"}
                                size="sm"
                                onClick={() => setChef(member.employee.id)}
                              >
                                {member.isChef ? "Chef" : "Chef"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeMember(member.employee.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Members */}
                      <Separator />
                      <div>
                        <Label>Ajouter des Membres</Label>
                        <div className="mt-2 space-y-2">
                          {availableEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                              onClick={() =>
                                setTeamMembers((prev) => [
                                  ...prev,
                                  { employee, isChef: false, fonction: "" },
                                ])
                              }
                            >
                              <div>
                                <p className="font-medium">
                                  {employee.nom} {employee.prenoms}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {employee.specialite}
                                </p>
                              </div>
                              <UserPlus className="h-4 w-4 text-blue-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleUpdateEquipe} disabled={isLoading}>
                  {isLoading ? "Mise à jour..." : "Mettre à Jour"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default EquipeClient;
