"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  FileText,
  User,
  Phone,
  Printer,
  Car,
  Clock,
  MapPin,
  Mail,
  Briefcase,
  Pencil,
} from 'lucide-react';
import { EditRapportRendezVousDialog } from '@/components/EditRapportRendezVousDialog';
import { TableauChuteRendezVousDialog } from '@/components/TableauChuteRendezVousDialog';

export interface RapportRendezVous {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  lieu_rendez_vous: string;
  lieu_autre?: string | null;
  conseiller_commercial: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string | null;
  profession_societe?: string | null;
  type_client: string;
  Com_Pres: boolean;
  Com_Drive: boolean;
  Com_Achat: boolean;
  Com_Livre: boolean;
  Com_APV: boolean;
  Com_Office: boolean;
  Com_Close: boolean;
  objet_autre?: string | null;
  modeles_discutes?: unknown;
  motivations_achat?: string | null;
  points_positifs?: string | null;
  objections_freins?: string | null;
  degre_interet?: string | null;
  decision_attendue?: string | null;
  devis_offre_remise: boolean;
  reference_offre?: string | null;
  financement_propose?: string | null;
  assurance_entretien: boolean;
  reprise_ancien_vehicule: boolean;
  actions_suivi?: unknown;
  commentaire_global?: string | null;
  client?: { id: string; nom: string; telephone: string; email?: string | null; entreprise?: string | null } | null;
  clientEntreprise?: { id: string; nom_entreprise: string; telephone: string; email?: string | null; nom_personne_contact?: string | null } | null;
  rendezVous?: { id: string; date: Date; statut: string } | null;
  voiture?: { id: string; voitureModel?: { model: string } | null } | null;
}

interface RapportCardProps {
  rapport: RapportRendezVous;
  onRefresh: () => void;
  onPrint: (rapport: RapportRendezVous) => void;
  dialogDisabled?: boolean;
  setDialogDisabled?: (v: boolean) => void;
  compact?: boolean;
}

export function getDegreInteretBadge(degre: string | null) {
  switch (degre) {
    case 'Fort':
      return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md">Fort</Badge>;
    case 'Moyen':
      return <Badge className="bg-amber-500 text-white hover:bg-amber-600 shadow-md">Moyen</Badge>;
    case 'Faible':
      return <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-md">Faible</Badge>;
    default:
      return <Badge variant="outline" className="border-gray-300">Non renseigné</Badge>;
  }
}

export function getDecisionBadge(decision: string | null) {
  switch (decision) {
    case 'Immédiate':
      return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md">Immédiate</Badge>;
    case 'En réflexion':
      return <Badge className="bg-amber-500 text-white hover:bg-amber-600 shadow-md">En réflexion</Badge>;
    case 'Après étude financement':
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600 shadow-md">Après étude financement</Badge>;
    default:
      return <Badge variant="outline" className="border-gray-300">Non renseigné</Badge>;
  }
}

export function getCardBorderColor(rapport: RapportRendezVous) {
  const degreInteret = rapport.degre_interet;
  const decisionAttendue = rapport.decision_attendue;
  if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate') return 'border-l-[6px] border-l-emerald-500 shadow-emerald-100';
  if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') return 'border-l-[6px] border-l-amber-500 shadow-amber-100';
  if (degreInteret === 'Moyen') return 'border-l-[6px] border-l-blue-500 shadow-blue-100';
  if (degreInteret === 'Faible') return 'border-l-[6px] border-l-red-500 shadow-red-100';
  return 'border-l-[6px] border-l-gray-300 shadow-gray-100';
}

export function getPriorityBadge(rapport: RapportRendezVous) {
  const degreInteret = rapport.degre_interet;
  const decisionAttendue = rapport.decision_attendue;
  if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate')
    return <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">🔥 Priorité Haute</Badge>;
  if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate')
    return <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">⚡ Priorité Moyenne-Haute</Badge>;
  if (degreInteret === 'Moyen')
    return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">📋 Priorité Moyenne</Badge>;
  if (degreInteret === 'Faible')
    return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">📌 Priorité Faible</Badge>;
  return <Badge variant="outline" className="border-gray-300 px-3 py-1 text-sm">À évaluer</Badge>;
}

export function RapportCard({ rapport, onRefresh, onPrint, dialogDisabled, setDialogDisabled, compact = false }: RapportCardProps) {
  return (
    <Card className={`bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${getCardBorderColor(rapport)} rounded-2xl overflow-hidden`}>
      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                  {rapport.nom_prenom_client}
                </CardTitle>
                {getPriorityBadge(rapport)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{rapport.heure_rendez_vous}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{rapport.conseiller_commercial}</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <Phone className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">{rapport.telephone_client}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 font-medium">
                Créé le {new Date(rapport.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => onPrint(rapport)} variant="outline" className="border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 h-11 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <EditRapportRendezVousDialog rapport={rapport} onSuccess={onRefresh} trigger={
              <Button variant="outline" className="border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-11 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            } />
            <TableauChuteRendezVousDialog rapport={rapport} onSuccess={() => { onRefresh(); setDialogDisabled?.(true); }} disabled={dialogDisabled ?? false} />
          </div>
        </div>
      </CardHeader>
      {!compact && (
        <CardContent className="p-6 space-y-5">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg"><Calendar className="h-5 w-5" />1. Détails du rendez-vous</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="font-semibold text-gray-700">Date:</span><span className="text-gray-600">{new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}</span></div>
              <div className="flex items-center gap-2"><span className="font-semibold text-gray-700">Heure:</span><span className="text-gray-600">{rapport.heure_rendez_vous}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700">Lieu:</span><span className="text-gray-600">{rapport.lieu_rendez_vous} {rapport.lieu_autre && `(${rapport.lieu_autre})`}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700">Durée:</span><span className="text-gray-600">{rapport.duree_rendez_vous}</span></div>
              <div className="flex items-center gap-2 md:col-span-2"><User className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700">Conseiller:</span><span className="text-gray-600">{rapport.conseiller_commercial}</span></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
            <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-lg"><User className="h-5 w-5" />2. Informations sur le client</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="font-semibold text-gray-700">Nom:</span><span className="text-gray-600">{rapport.nom_prenom_client}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700">Téléphone:</span><span className="text-gray-600">{rapport.telephone_client}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700">Email:</span><span className="text-gray-600">{rapport.email_client || 'Non renseigné'}</span></div>
              <div className="flex items-center gap-2"><span className="font-semibold text-gray-700">Type:</span><Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{rapport.type_client}</Badge></div>
              {rapport.profession_societe && (
                <div className="flex items-center gap-2 md:col-span-2"><Briefcase className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700">Profession/Société:</span><span className="text-gray-600">{rapport.profession_societe}</span></div>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100 shadow-sm">
            <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg"><Car className="h-5 w-5" />3. Objet du rendez-vous</h3>
            <div className="flex flex-wrap gap-2">
              {rapport.Com_Pres && <Badge className="bg-purple-500 text-white hover:bg-purple-600 shadow-md">Com_Pres</Badge>}
              {rapport.Com_Drive && <Badge className="bg-pink-500 text-white hover:bg-pink-600 shadow-md">Com_Drive</Badge>}
              {rapport.Com_Achat && <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-md">Com_Achat</Badge>}
              {rapport.Com_Livre && <Badge className="bg-violet-500 text-white hover:bg-violet-600 shadow-md">Com_Livre</Badge>}
              {rapport.Com_APV && <Badge className="bg-rose-500 text-white hover:bg-rose-600 shadow-md">Com_APV</Badge>}
              {rapport.Com_Office && <Badge className="bg-amber-500 text-white hover:bg-amber-600 shadow-md">Com_Office</Badge>}
              {rapport.Com_Close && <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md">Com_Close</Badge>}
              {rapport.objet_autre && <Badge variant="outline" className="border-purple-300 text-purple-700">Autre: {rapport.objet_autre}</Badge>}
            </div>
          </div>
          {(rapport.modeles_discutes as unknown[])?.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100 shadow-sm">
              <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg"><Car className="h-5 w-5" />4. Modèles discutés</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-amber-200">
                    <th className="text-left p-3 font-semibold text-amber-900">Modèle</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Motorisation</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Transmission</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Couleur</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Observation</th>
                  </tr></thead>
                  <tbody>
                    {(rapport.modeles_discutes as unknown[])?.map((modele: unknown, idx: number) => (
                      <tr key={idx} className="border-b border-amber-100 hover:bg-amber-50/50 transition-colors">
                        <td className="p-3 font-medium">{(modele as Record<string, unknown>).modele as string || ''}</td>
                        <td className="p-3">{(modele as Record<string, unknown>).motorisation as string || ''}</td>
                        <td className="p-3">{(modele as Record<string, unknown>).transmission as string || ''}</td>
                        <td className="p-3">{(modele as Record<string, unknown>).couleur as string || ''}</td>
                        <td className="p-3 text-gray-600">{(modele as Record<string, unknown>).observation as string || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-5 rounded-xl border border-cyan-100 shadow-sm">
            <h3 className="font-bold text-cyan-900 mb-4 flex items-center gap-2 text-lg"><User className="h-5 w-5" />5. Impressions et besoins du client</h3>
            <div className="space-y-4 text-sm">
              {rapport.motivations_achat && <div className="bg-white/60 p-4 rounded-lg border border-cyan-200"><strong className="text-gray-700 block mb-2">Motivations d&apos;achat:</strong><p className="text-gray-700 leading-relaxed">{rapport.motivations_achat}</p></div>}
              {rapport.points_positifs && <div className="bg-white/60 p-4 rounded-lg border border-cyan-200"><strong className="text-gray-700 block mb-2">Points positifs:</strong><p className="text-gray-700 leading-relaxed">{rapport.points_positifs}</p></div>}
              {rapport.objections_freins && <div className="bg-white/60 p-4 rounded-lg border border-cyan-200"><strong className="text-gray-700 block mb-2">Objections/Freins:</strong><p className="text-gray-700 leading-relaxed">{rapport.objections_freins}</p></div>}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg border border-cyan-200"><strong className="text-gray-700">Intérêt:</strong>{getDegreInteretBadge(rapport.degre_interet ?? null)}</div>
                <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg border border-cyan-200"><strong className="text-gray-700">Décision:</strong>{getDecisionBadge(rapport.decision_attendue ?? null)}</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
            <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-lg"><FileText className="h-5 w-5" />6. Propositions faites</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-emerald-200">
                <span className={`text-lg ${rapport.devis_offre_remise ? 'text-emerald-600' : 'text-gray-400'}`}>{rapport.devis_offre_remise ? '☑' : '☐'}</span>
                <span className="font-medium text-gray-700">Devis/Offre remise {rapport.reference_offre && <span className="text-emerald-600">(Réf: {rapport.reference_offre})</span>}</span>
              </div>
              <div className="bg-white/60 p-3 rounded-lg border border-emerald-200"><strong className="text-gray-700">Financement proposé:</strong> <span className="ml-2 text-gray-600">{rapport.financement_propose || 'Non renseigné'}</span></div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-emerald-200">
                  <span className={`text-lg ${rapport.assurance_entretien ? 'text-emerald-600' : 'text-gray-400'}`}>{rapport.assurance_entretien ? '☑' : '☐'}</span>
                  <span className="font-medium text-gray-700">Assurance/Entretien</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-emerald-200">
                  <span className={`text-lg ${rapport.reprise_ancien_vehicule ? 'text-emerald-600' : 'text-gray-400'}`}>{rapport.reprise_ancien_vehicule ? '☑' : '☐'}</span>
                  <span className="font-medium text-gray-700">Reprise ancien véhicule</span>
                </div>
              </div>
            </div>
          </div>
          {(rapport.actions_suivi as unknown[])?.length > 0 && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100 shadow-sm">
              <h3 className="font-bold text-violet-900 mb-4 flex items-center gap-2 text-lg"><Phone className="h-5 w-5" />7. Actions de suivi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-violet-200">
                    <th className="text-left p-3 font-semibold text-violet-900">Action</th>
                    <th className="text-left p-3 font-semibold text-violet-900">Responsable</th>
                    <th className="text-left p-3 font-semibold text-violet-900">Échéance</th>
                    <th className="text-left p-3 font-semibold text-violet-900">Statut</th>
                  </tr></thead>
                  <tbody>
                    {(rapport.actions_suivi as unknown[])?.map((action: unknown, idx: number) => (
                      <tr key={idx} className="border-b border-violet-100 hover:bg-violet-50/50 transition-colors">
                        <td className="p-3 font-medium">{(action as Record<string, unknown>).action as string || ''}</td>
                        <td className="p-3">{(action as Record<string, unknown>).responsable as string || ''}</td>
                        <td className="p-3">{(action as Record<string, unknown>).echeance as string || ''}</td>
                        <td className="p-3"><Badge variant="secondary" className="bg-violet-100 text-violet-800">{(action as Record<string, unknown>).statut as string || ''}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {rapport.commentaire_global && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-100 shadow-sm">
              <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2 text-lg"><FileText className="h-5 w-5" />8. Commentaire global du conseiller</h3>
              <div className="bg-white/60 p-4 rounded-lg border border-rose-200"><p className="text-sm text-gray-700 leading-relaxed">{rapport.commentaire_global}</p></div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
