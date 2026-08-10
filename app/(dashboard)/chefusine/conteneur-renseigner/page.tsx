import React from "react";
import { getConteneursAndCommandesTransiteNonRenseigne } from "@/lib/actions/conteneur";
import ChefusineConteneurRenseigneClient from "./ChefusineConteneurRenseigneClient";

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
  commandes: {
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
  }[];
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
};

type DataType = {
  conteneurs: ConteneurType[];
  commandes: CommandeType[];
};

const page = async () => {
  const result = await getConteneursAndCommandesTransiteNonRenseigne();

  const data: DataType =
    result.success && result.data
      ? (result.data as unknown as DataType)
      : { conteneurs: [], commandes: [] };

  return <ChefusineConteneurRenseigneClient data={data} />;
};

export default page;
