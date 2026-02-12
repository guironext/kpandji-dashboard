import React from "react";
import { getConteneursAndCommandesArrives } from "@/lib/actions/conteneur";
import ChefusineConteneurArriveClient from "./ChefusineConteneurArriveClient";

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

type DataType = {
  conteneurs: ConteneurType[];
  commandes: CommandeType[];
};

const page = async () => {
  const result = await getConteneursAndCommandesArrives();

  const data: DataType =
    result.success && result.data
      ? (result.data as unknown as DataType)
      : { conteneurs: [], commandes: [] };

  return <ChefusineConteneurArriveClient data={data} />;
};

export default page;
