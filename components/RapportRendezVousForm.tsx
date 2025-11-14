"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Car, FileText, Phone, Plus, Trash2 } from 'lucide-react';

interface ModeleDiscute {
  modele: string;
  motorisation: string;
  transmission: string;
  couleur: string;
  observation: string;
}

interface ActionSuivi {
  action: string;
  responsable: string;
  echeance: string;
  statut: string;
}

interface RapportRendezVousData {
  rendezVousId: string;
  clientId?: string;
  clientEntrepriseId?: string;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  lieu_rendez_vous: string;
  lieu_autre?: string;
  conseiller_commercial: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string;
  profession_societe?: string;
  type_client: string;
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  objet_autre?: string;
  modeles_discutes: ModeleDiscute[];
  motivations_achat?: string;
  points_positifs?: string;
  objections_freins?: string;
  degre_interet?: string;
  decision_attendue?: string;
  devis_offre_remise: boolean;
  reference_offre?: string;
  financement_propose?: string;
  assurance_entretien: boolean;
  reprise_ancien_vehicule: boolean;
  actions_suivi: ActionSuivi[];
  commentaire_global?: string;
}

interface RapportRendezVousFormProps {
  rendezVous: {
    id: string;
    date: Date;
    client?: {
      id: string;
      nom: string;
      telephone: string;
      email?: string | null;
      entreprise?: string | null;
    } | null;
    clientEntreprise?: {
      id: string;
      nom_entreprise: string;
      telephone: string;
      email?: string | null;
    } | null;
  };
  onClose: () => void;
  onSubmit: (data: RapportRendezVousData) => void;
  initialData?: Partial<RapportRendezVousData>;
}

export function RapportRendezVousForm({ rendezVous, onClose, onSubmit, initialData }: RapportRendezVousFormProps) {
  const { user, isLoaded } = useUser();
  
  const [formData, setFormData] = useState({
    // 1. Détails du rendez-vous
    date_rendez_vous: initialData?.date_rendez_vous || new Date(rendezVous.date).toISOString().split('T')[0],
    heure_rendez_vous: initialData?.heure_rendez_vous || new Date(rendezVous.date).toTimeString().slice(0, 5),
    lieu_rendez_vous: initialData?.lieu_rendez_vous || 'Showroom',
    lieu_autre: initialData?.lieu_autre || '',
    conseiller_commercial: initialData?.conseiller_commercial || '',
    duree_rendez_vous: initialData?.duree_rendez_vous || '',
    
    // 2. Informations sur le client
    nom_prenom_client: initialData?.nom_prenom_client || rendezVous.client?.nom || rendezVous.clientEntreprise?.nom_entreprise || '',
    telephone_client: initialData?.telephone_client || rendezVous.client?.telephone || rendezVous.clientEntreprise?.telephone || '',
    email_client: initialData?.email_client || rendezVous.client?.email || rendezVous.clientEntreprise?.email || '',
    profession_societe: initialData?.profession_societe || rendezVous.client?.entreprise || '',
    type_client: initialData?.type_client || (rendezVous.client ? 'Particulier' : 'Professionnel'),
    
    // 3. Objet du rendez-vous
    presentation_gamme: initialData?.presentation_gamme ?? false,
    essai_vehicule: initialData?.essai_vehicule ?? false,
    negociation_commerciale: initialData?.negociation_commerciale ?? false,
    livraison_vehicule: initialData?.livraison_vehicule ?? false,
    service_apres_vente: initialData?.service_apres_vente ?? false,
    objet_autre: initialData?.objet_autre || '',
    
    // 4. Modèles discutés
    modeles_discutes: [] as ModeleDiscute[],
    
    // 5. Impressions et besoins du client
    motivations_achat: initialData?.motivations_achat || '',
    points_positifs: initialData?.points_positifs || '',
    objections_freins: initialData?.objections_freins || '',
    degre_interet: initialData?.degre_interet || '',
    decision_attendue: initialData?.decision_attendue || '',
    
    // 6. Propositions faites
    devis_offre_remise: initialData?.devis_offre_remise ?? false,
    reference_offre: initialData?.reference_offre || '',
    financement_propose: initialData?.financement_propose || '',
    assurance_entretien: initialData?.assurance_entretien ?? false,
    reprise_ancien_vehicule: initialData?.reprise_ancien_vehicule ?? false,
    
    // 7. Suivi / Actions à entreprendre
    actions_suivi: [] as ActionSuivi[],
    
    // 8. Commentaire global du conseiller
    commentaire_global: initialData?.commentaire_global || '',
  });

  const [modelesDiscutes, setModelesDiscutes] = useState<ModeleDiscute[]>(
    initialData?.modeles_discutes || []
  );
  const [actionsSuivi, setActionsSuivi] = useState<ActionSuivi[]>(
    initialData?.actions_suivi || []
  );

  // Auto-populate conseiller_commercial with current user's name (only if not already set)
  useEffect(() => {
    if (isLoaded && user && !initialData?.conseiller_commercial) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName) {
        setFormData(prev => ({
          ...prev,
          conseiller_commercial: prev.conseiller_commercial || fullName
        }));
      }
    }
  }, [isLoaded, user, initialData?.conseiller_commercial]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addModeleDiscute = () => {
    setModelesDiscutes(prev => [...prev, {
      modele: '',
      motorisation: '',
      transmission: '',
      couleur: '',
      observation: ''
    }]);
  };

  const removeModeleDiscute = (index: number) => {
    setModelesDiscutes(prev => prev.filter((_, i) => i !== index));
  };

  const updateModeleDiscute = (index: number, field: keyof ModeleDiscute, value: string) => {
    setModelesDiscutes(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addActionSuivi = () => {
    setActionsSuivi(prev => [...prev, {
      action: '',
      responsable: '',
      echeance: '',
      statut: ''
    }]);
  };

  const removeActionSuivi = (index: number) => {
    setActionsSuivi(prev => prev.filter((_, i) => i !== index));
  };

  const updateActionSuivi = (index: number, field: keyof ActionSuivi, value: string) => {
    setActionsSuivi(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      modeles_discutes: modelesDiscutes,
      actions_suivi: actionsSuivi,
      rendezVousId: rendezVous.id,
      clientId: rendezVous.client?.id,
      clientEntrepriseId: rendezVous.clientEntreprise?.id,
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  FICHE DE RAPPORT DE RENDEZ-VOUS CLIENT / PROSPECT
                </h2>
                <p className="text-gray-600">KPANDJI AUTOMOBILES</p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              Fermer
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* 1. Détails du rendez-vous */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                📅 1. Détails du rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="date_rendez_vous">Date du rendez-vous</Label>
                  <Input
                    id="date_rendez_vous"
                    type="date"
                    value={formData.date_rendez_vous}
                    onChange={(e) => handleInputChange('date_rendez_vous', e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="heure_rendez_vous">Heure</Label>
                  <Input
                    id="heure_rendez_vous"
                    type="time"
                    value={formData.heure_rendez_vous}
                    onChange={(e) => handleInputChange('heure_rendez_vous', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label>Lieu</Label>
                <RadioGroup
                  value={formData.lieu_rendez_vous}
                  onValueChange={(value) => handleInputChange('lieu_rendez_vous', value)}
                  className="flex flex-wrap gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Showroom" id="showroom" />
                    <Label htmlFor="showroom">Showroom</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Visite client chez nous" id="visiteClientChezNous" />
                    <Label htmlFor="visiteClientChezNous">Visite client / prospect chez nous</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Visite chez le client" id="visiteChezLeClient" />
                    <Label htmlFor="visiteChezLeClient">Visite chez le client / prospect</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Appel visio" id="appelVisio" />
                    <Label htmlFor="appelVisio">Appel téléphonique / WhatsApp</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Autre" id="autre" />
                    <Label htmlFor="autre">Autre</Label>
                  </div>
                </RadioGroup>
                {formData.lieu_rendez_vous === 'Autre' && (
                  <Input
                    placeholder="Précisez..."
                    value={formData.lieu_autre}
                    onChange={(e) => handleInputChange('lieu_autre', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="conseiller_commercial">Conseiller commercial</Label>
                  <Input
                    id="conseiller_commercial"
                    value={formData.conseiller_commercial}
                    onChange={(e) => handleInputChange('conseiller_commercial', e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="duree_rendez_vous">Durée du rendez-vous</Label>
                  <Input
                    id="duree_rendez_vous"
                    placeholder="Ex: 1h30"
                    value={formData.duree_rendez_vous}
                    onChange={(e) => handleInputChange('duree_rendez_vous', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Informations sur le client */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-green-600" />
                👤 2. Informations sur le client
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="nom_prenom_client">Nom et prénoms</Label>
                  <Input
                    id="nom_prenom_client"
                    value={formData.nom_prenom_client}
                    onChange={(e) => handleInputChange('nom_prenom_client', e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="telephone_client">Téléphone</Label>
                  <Input
                    id="telephone_client"
                    value={formData.telephone_client}
                    onChange={(e) => handleInputChange('telephone_client', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="email_client">Email</Label>
                  <Input
                    id="email_client"
                    type="email"
                    value={formData.email_client}
                    onChange={(e) => handleInputChange('email_client', e.target.value)}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="profession_societe">Profession / Société</Label>
                  <Input
                    id="profession_societe"
                    value={formData.profession_societe}
                    onChange={(e) => handleInputChange('profession_societe', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Label>Type de client</Label>
                <RadioGroup
                  value={formData.type_client}
                  onValueChange={(value) => handleInputChange('type_client', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Particulier" id="particulier" />
                    <Label htmlFor="particulier">Particulier</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Professionnel" id="professionnel" />
                    <Label htmlFor="professionnel">Entreprise</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Institutionnel" id="institutionnel" />
                    <Label htmlFor="institutionnel">Institutionnel</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* 3. Objet du rendez-vous */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-purple-600" />
                🚘 3. Objet du rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="presentation_gamme"
                    checked={formData.presentation_gamme}
                    onCheckedChange={(checked) => handleInputChange('presentation_gamme', checked)}
                  />
                  <Label htmlFor="presentation_gamme">Présentation de la gamme</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="essai_vehicule"
                    checked={formData.essai_vehicule}
                    onCheckedChange={(checked) => handleInputChange('essai_vehicule', checked)}
                  />
                  <Label htmlFor="essai_vehicule">Essai du véhicule</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="negociation_commerciale"
                    checked={formData.negociation_commerciale}
                    onCheckedChange={(checked) => handleInputChange('negociation_commerciale', checked)}
                  />
                  <Label htmlFor="negociation_commerciale">Négociation commerciale, offre, prix, remise, mode de paiement, etc.</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="livraison_vehicule"
                    checked={formData.livraison_vehicule}
                    onCheckedChange={(checked) => handleInputChange('livraison_vehicule', checked)}
                  />
                  <Label htmlFor="livraison_vehicule">Livraison de véhicule</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="service_apres_vente"
                    checked={formData.service_apres_vente}
                    onCheckedChange={(checked) => handleInputChange('service_apres_vente', checked)}
                  />
                  <Label htmlFor="service_apres_vente">Service après-vente</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="objet_autre">Autre</Label>
                <Input
                  id="objet_autre"
                  placeholder="Précisez..."
                  value={formData.objet_autre}
                  onChange={(e) => handleInputChange('objet_autre', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Modèles discutés */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-amber-600" />
                🚗 4. Modèle(s) discuté(s)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Modèle</th>
                      <th className="text-left p-2">Motorisation</th>
                      <th className="text-left p-2">Transmission</th>
                      <th className="text-left p-2">Couleur</th>
                      <th className="text-left p-2">Observation</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelesDiscutes.map((modele, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <Input
                            value={modele.modele}
                            onChange={(e) => updateModeleDiscute(index, 'modele', e.target.value)}
                            placeholder="Modèle"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={modele.motorisation}
                            onChange={(e) => updateModeleDiscute(index, 'motorisation', e.target.value)}
                            placeholder="Motorisation"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={modele.transmission}
                            onValueChange={(value) => updateModeleDiscute(index, 'transmission', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Transmission" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manuelle">Manuelle</SelectItem>
                              <SelectItem value="Automatique">Automatique</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            value={modele.couleur}
                            onChange={(e) => updateModeleDiscute(index, 'couleur', e.target.value)}
                            placeholder="Couleur"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={modele.observation}
                            onChange={(e) => updateModeleDiscute(index, 'observation', e.target.value)}
                            placeholder="Observation"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeModeleDiscute(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addModeleDiscute}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un modèle
              </Button>
            </CardContent>
          </Card>

          {/* 5. Impressions et besoins du client */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-cyan-600" />
                💬 5. Impressions et besoins du client / prospect
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="motivations_achat">Motivations d&apos;achat</Label>
                <Textarea
                  id="motivations_achat"
                  placeholder="Décrivez les motivations du client..."
                  value={formData.motivations_achat}
                  onChange={(e) => handleInputChange('motivations_achat', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="points_positifs">Points positifs perçus</Label>
                <Textarea
                  id="points_positifs"
                  placeholder="Quels sont les points positifs mentionnés par le client..."
                  value={formData.points_positifs}
                  onChange={(e) => handleInputChange('points_positifs', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="objections_freins">Objections / freins</Label>
                <Textarea
                  id="objections_freins"
                  placeholder="Quelles objections ou freins a exprimés le client..."
                  value={formData.objections_freins}
                  onChange={(e) => handleInputChange('objections_freins', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label>Degré d&apos;intérêt</Label>
                  <RadioGroup
                    value={formData.degre_interet}
                    onValueChange={(value) => handleInputChange('degre_interet', value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Fort" id="fort" />
                      <Label htmlFor="fort">Fort</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Moyen" id="moyen" />
                      <Label htmlFor="moyen">Moyen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Faible" id="faible" />
                      <Label htmlFor="faible">Faible</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label>Décision attendue</Label>
                  <RadioGroup
                    value={formData.decision_attendue}
                    onValueChange={(value) => handleInputChange('decision_attendue', value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Immédiate" id="immediate" />
                      <Label htmlFor="immediate">Immédiate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="En réflexion" id="reflexion" />
                      <Label htmlFor="reflexion">En réflexion</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Après étude financement" id="financement" />
                      <Label htmlFor="financement">Après étude financement</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Propositions faites */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-emerald-600" />
                💰 6. Propositions faites
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="devis_offre_remise"
                  checked={formData.devis_offre_remise}
                  onCheckedChange={(checked) => handleInputChange('devis_offre_remise', checked)}
                />
                <Label htmlFor="devis_offre_remise">Devis / Offre remise ?</Label>
              </div>
              
              {formData.devis_offre_remise && (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="reference_offre">Référence de l&apos;offre</Label>
                  <Input
                    id="reference_offre"
                    placeholder="Référence de l'offre"
                    value={formData.reference_offre}
                    onChange={(e) => handleInputChange('reference_offre', e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <Label htmlFor="financement_propose">Financement proposé</Label>
                <Select
                  value={formData.financement_propose}
                  onValueChange={(value) => handleInputChange('financement_propose', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de financement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crédit">Crédit</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                    <SelectItem value="Virement">Virement</SelectItem>
                    <SelectItem value="Especes">Especes</SelectItem>
                    <SelectItem value="Leasing">Leasing</SelectItem>
                    <SelectItem value="Comptant">Comptant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assurance_entretien"
                    checked={formData.assurance_entretien}
                    onCheckedChange={(checked) => handleInputChange('assurance_entretien', checked)}
                  />
                  <Label htmlFor="assurance_entretien">Assurance / entretien proposés</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reprise_ancien_vehicule"
                    checked={formData.reprise_ancien_vehicule}
                    onCheckedChange={(checked) => handleInputChange('reprise_ancien_vehicule', checked)}
                  />
                  <Label htmlFor="reprise_ancien_vehicule">Reprise d&apos;ancien véhicule</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7. Suivi / Actions à entreprendre */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-violet-600" />
                📞 7. Suivi / Actions à entreprendre
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Action prévue</th>
                      <th className="text-left p-2">Responsable</th>
                      <th className="text-left p-2">Échéance</th>
                      <th className="text-left p-2">Statut</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionsSuivi.map((action, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <Input
                            value={action.action}
                            onChange={(e) => updateActionSuivi(index, 'action', e.target.value)}
                            placeholder="Action prévue"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={action.responsable}
                            onChange={(e) => updateActionSuivi(index, 'responsable', e.target.value)}
                            placeholder="Responsable"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="date"
                            value={action.echeance}
                            onChange={(e) => updateActionSuivi(index, 'echeance', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={action.statut}
                            onValueChange={(value) => updateActionSuivi(index, 'statut', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="En attente">En attente</SelectItem>
                              <SelectItem value="En cours">En cours</SelectItem>
                              <SelectItem value="Terminé">Terminé</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeActionSuivi(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addActionSuivi}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une action
              </Button>
            </CardContent>
          </Card>

          {/* 8. Commentaire global du conseiller */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-rose-600" />
                🗒️ 8. Commentaire global du conseiller
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Vos commentaires généraux sur le rendez-vous..."
                value={formData.commentaire_global}
                onChange={(e) => handleInputChange('commentaire_global', e.target.value)}
                rows={4}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Enregistrer le rapport
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
