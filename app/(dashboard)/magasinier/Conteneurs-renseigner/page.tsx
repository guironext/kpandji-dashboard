import React from 'react'
import { getConteneursTransiteNonRenseigne } from '@/lib/actions/conteneur'
import ConteneursRenseignerClient from './ConteneursRenseignerClient'

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

export default async function ConteneursRenseignerPage() {
  const result = await getConteneursTransiteNonRenseigne()
  
  const conteneurs: ConteneurType[] = result.success && Array.isArray(result.data) 
    ? (result.data as ConteneurType[])
    : []

  return (
    <ConteneursRenseignerClient conteneurs={conteneurs} />
  )
}