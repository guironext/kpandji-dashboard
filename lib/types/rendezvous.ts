export interface RendezVous {
  id: string;
  date: Date;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'DEPLACE' | 'EFFECTUE' | 'ANNULE';
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
    nom_personne_contact?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  entreprise?: string;
}

export interface ClientEntreprise {
  id: string;
  nom_entreprise: string;
  telephone: string;
  email?: string;
  nom_personne_contact?: string;
}
