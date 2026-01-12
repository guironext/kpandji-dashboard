import React from 'react'
import { getConteneursTransiteNonRenseigne, getConteneursTransiteDejaRenseigne } from '@/lib/actions/conteneur'
import ConteneurTransitClient from './ConteneurTransitClient'

type CommandeType = {
  id: string;
  couleur: string | null;
  motorisation: string | null;
  transmission: string | null;
  nbr_portes: string | null;
  prix_unitaire: number | null;
  date_livraison: string;
  createdAt: string;
  updatedAt: string;
  etapeCommande: string;
  commandeFlag: string;
  voitureModel: {
    model: string;
  } | null;
  client: {
    nom: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
  } | null;
};

type ConteneurType = {
  id: string;
  conteneurNumber: string;
  sealNumber: string | null;
  totalPackages: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  stuffingMap: string | null;
  etapeConteneur: string;
  createdAt: string;
  updatedAt: string;
  dateEmbarquement: string | null;
  dateArriveProbable: string | null;
  commandes: CommandeType[];
};

export default async function ConteneurTransitPage() {
  const [nonRenseigneResult, dejaRenseigneResult] = await Promise.all([
    getConteneursTransiteNonRenseigne(),
    getConteneursTransiteDejaRenseigne()
  ])
  
  const conteneursNonRenseigne: ConteneurType[] = nonRenseigneResult.success && Array.isArray(nonRenseigneResult.data) 
    ? (nonRenseigneResult.data as ConteneurType[])
    : []

  const conteneursDejaRenseigne: ConteneurType[] = dejaRenseigneResult.success && Array.isArray(dejaRenseigneResult.data) 
    ? (dejaRenseigneResult.data as ConteneurType[])
    : []

  return (
    <ConteneurTransitClient 
      conteneursNonRenseigne={conteneursNonRenseigne}
      conteneursDejaRenseigne={conteneursDejaRenseigne}
    />
  )
}