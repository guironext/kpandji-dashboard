import React from 'react'
import { getConteneursDepotageEnCours } from '@/lib/actions/conteneur'
import VerificationClient from './VerificationClient'

type SparePartType = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  verificationName: string | null;
  quantity: number;
  etapeSparePart: string;
  statusVerification: string;
};

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
  spareParts: SparePartType[];
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
  subcases: {
    id: string;
    subcaseNumber: string;
    isVerified: boolean;
    spareParts: SparePartType[];
  }[];
};

export default async function VerificationPage() {
  const result = await getConteneursDepotageEnCours()
  
  const conteneurs: ConteneurType[] = result.success && Array.isArray(result.data) 
    ? (result.data as unknown as ConteneurType[])
    : []

  return (
    <VerificationClient conteneurs={conteneurs} />
  )
}
