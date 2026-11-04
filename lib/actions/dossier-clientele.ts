"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readConclusion, type ConclusionProspect } from "@/app/(dashboard)/commercial/visite-en-clientele/visite-options";
import { parseBonCommandeContenu } from "@/lib/bon-commande-document";
import { assurerEffetsBonValide } from "@/lib/actions/bondecommande";
import { NIVEAUX_DOSSIER, type DossierResponsableCard, type NiveauDossierId } from "../dossier-niveaux";
import { prisma } from "../prisma";

const PATH = "/commercial/dossier-clientele";

const schema = z.object({
  prospectId: z.string().min(1, "Le prospect est requis"),
  prospectType: z.enum(["CLIENT", "ENTREPRISE"]),
  numero: z.string().regex(/^\d{5}$/, "Le numéro doit comporter 5 chiffres"),
});

export type DossierInput = z.input<typeof schema>;

export type ProspectDossierOption = {
  id: string;
  type: "CLIENT" | "ENTREPRISE";
  nom: string;
  nomCourt: string;
};

export type DossierCard = {
  id: string;
  numero: string;
  nomCourt: string;
  prospectId: string;
  prospectType: string;
  prospectNom: string;
  createdAt: string;
};

function nomCourtFrom(nom: string, sigle?: string | null) {
  const short = sigle?.trim();
  if (short) return short.replace(/\s+/g, "").slice(0, 16).toUpperCase();
  const clean = nom
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return (words[0] ?? "DOS").slice(0, 8).toUpperCase();
  return words.map((word) => word[0]).join("").slice(0, 8).toUpperCase();
}

async function currentUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  return user?.id ?? null;
}

async function viewerIsResponsable() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "RESPONSABLE_COMMERCIAL" || user?.role === "ADMIN";
}

function randomNumero() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export async function getProspectsForDossier(): Promise<ProspectDossierOption[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const where = { userId };
  const [clients, entreprises, dossiers] = await Promise.all([
    prisma.client.findMany({ where, select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.client_entreprise.findMany({
      where,
      select: { id: true, nom_entreprise: true, sigle: true },
      orderBy: { nom_entreprise: "asc" },
    }),
    prisma.dossierClientele.findMany({
      where: { userId },
      select: { prospectId: true, prospectType: true },
    }),
  ]);
  const taken = new Set(dossiers.map((d) => `${d.prospectType}:${d.prospectId}`));
  return [
    ...clients.map((c) => ({ id: c.id, type: "CLIENT" as const, nom: c.nom, nomCourt: nomCourtFrom(c.nom) })),
    ...entreprises.map((e) => ({
      id: e.id,
      type: "ENTREPRISE" as const,
      nom: e.nom_entreprise,
      nomCourt: nomCourtFrom(e.nom_entreprise, e.sigle),
    })),
  ]
    .filter((p) => !taken.has(`${p.type}:${p.id}`))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export async function getDossiersClientele(): Promise<DossierCard[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const rows = await prisma.dossierClientele.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    numero: row.numero,
    nomCourt: row.nomCourt,
    prospectId: row.prospectId,
    prospectType: row.prospectType,
    prospectNom: row.prospectNom,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getDossierClientele(id: string) {
  const userId = await currentUserId();
  if (!userId) return null;
  const row = await prisma.dossierClientele.findFirst({ where: { id, userId } });
  if (!row) return null;
  return {
    id: row.id,
    numero: row.numero,
    nomCourt: row.nomCourt,
    prospectId: row.prospectId,
    prospectType: row.prospectType,
    prospectNom: row.prospectNom,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function nextNumeroDossier() {
  const userId = await currentUserId();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  const rows = await prisma.dossierClientele.findMany({ select: { numero: true } });
  const taken = new Set(rows.map((row) => row.numero));
  for (let i = 0; i < 40; i++) {
    const numero = randomNumero();
    if (!taken.has(numero)) return { success: true as const, numero };
  }
  return { success: false as const, error: "Impossible de générer un numéro" };
}

export async function createDossierClientele(input: DossierInput) {
  const userId = await currentUserId();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const owned = { id: d.prospectId, userId };
  const prospect =
    d.prospectType === "CLIENT"
      ? await prisma.client.findFirst({ where: owned, select: { nom: true } }).then((c) =>
          c ? { nom: c.nom, nomCourt: nomCourtFrom(c.nom) } : null,
        )
      : await prisma.client_entreprise
          .findFirst({ where: owned, select: { nom_entreprise: true, sigle: true } })
          .then((c) => (c ? { nom: c.nom_entreprise, nomCourt: nomCourtFrom(c.nom_entreprise, c.sigle) } : null));
  if (!prospect) return { success: false as const, error: "Prospect introuvable" };

  const existing = await prisma.dossierClientele.findFirst({
    where: { prospectId: d.prospectId, prospectType: d.prospectType },
    select: { id: true },
  });
  if (existing) return { success: false as const, error: "Un dossier existe déjà pour ce prospect" };

  const numeroPris = await prisma.dossierClientele.findUnique({ where: { numero: d.numero }, select: { id: true } });
  if (numeroPris) return { success: false as const, error: "Ce numéro est déjà utilisé. Rouvrez le formulaire." };

  await prisma.dossierClientele.create({
    data: {
      numero: d.numero,
      nomCourt: prospect.nomCourt,
      prospectId: d.prospectId,
      prospectType: d.prospectType,
      prospectNom: prospect.nom,
      userId,
    },
  });
  revalidatePath(PATH);
  return { success: true as const };
}

export type ProfilParticulier = {
  kind: "CLIENT";
  nom: string;
  email: string | null;
  telephone: string;
  commercial: string | null;
  entreprise: string | null;
  localisation: string | null;
  secteur: string | null;
  statut: string;
  premiereCommande: boolean;
  createdAt: string;
};

export type ProfilEntreprise = {
  kind: "ENTREPRISE";
  nom: string;
  sigle: string | null;
  email: string | null;
  telephone: string;
  contactNom: string | null;
  contactFonction: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  localisation: string | null;
  secteur: string | null;
  flotte: boolean | null;
  flotteDescription: string | null;
  statut: string;
  commercial: string | null;
  premiereCommande: boolean;
  createdAt: string;
};

export type VisiteFiche = {
  id: string;
  date: string;
  lieu: string | null;
  testDrive: boolean | null;
  activites: string[];
  typesVehicules: string[];
  modelesPresentes: string[];
  modelesRetenus: string[];
  modesAcquisition: string[];
  barrieres: string[];
  conclusion: ConclusionProspect | null;
  auteur: string;
};

export type ModeleEchange = {
  modele: string;
  motorisation: string;
  transmission: string;
  couleur: string;
  observation: string;
};

export type ActionEchange = {
  action: string;
  responsable: string;
  echeance: string;
  statut: string;
};

export type EchangeFiche = {
  id: string;
  rendezVousId: string;
  date: string;
  heure: string;
  lieu: string;
  lieuAutre: string | null;
  duree: string;
  conseiller: string;
  client: string;
  telephone: string;
  email: string | null;
  profession: string | null;
  typeClient: string;
  statutRendezVous: string | null;
  resume: string | null;
  note: string | null;
  typeContact: string | null;
  besoin: string | null;
  motivations: string | null;
  pointsPositifs: string | null;
  objections: string | null;
  interet: string | null;
  decision: string | null;
  etape: string | null;
  financement: string | null;
  propositions: string | null;
  referenceOffre: string | null;
  suivi: string | null;
  commentaire: string | null;
  devis: boolean;
  assurance: boolean;
  reprise: boolean;
  objetAutre: string | null;
  etapes: string[];
  modeles: ModeleEchange[];
  modelesTexte: string | null;
  actions: ActionEchange[];
  vehicule: string | null;
};

export type RendezVousFiche = {
  id: string;
  date: string;
  statut: string;
  resume: string | null;
  note: string | null;
};

export type LigneProforma = {
  id: string;
  modele: string;
  couleur: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
  remise: number;
  motorisation: string | null;
  transmission: string | null;
};

export type AccessoireProforma = {
  id: string;
  nom: string;
  description: string | null;
  prix: number | null;
  quantite: number | null;
};

export type ProformaFiche = {
  id: string;
  date: string;
  echeance: string;
  statut: string;
  validation: string;
  quantite: number;
  prixUnitaire: number;
  montantHt: number;
  totalHt: number;
  remise: number;
  montantRemise: number;
  netHt: number;
  tva: number;
  montantTva: number;
  totalTtc: number;
  avance: number;
  reste: number;
  notes: string | null;
  bonPourAcquis: boolean;
  lignes: LigneProforma[];
  accessoires: AccessoireProforma[];
  vehicule: string | null;
};

export type BonCommandeFiche = {
  id: string;
  factureId: string;
  numero: string;
  prefix: string;
  statut: string;
  date: string;
  factureDate: string;
  totalTtc: number;
};

export type BonAccordFiche = {
  id: string;
  numero: string;
  statut: string;
  date: string;
  factureDate: string;
  totalTtc: number;
};

export type LettreFiche = {
  id: string;
  numero: string;
  valide: boolean;
  date: string;
  factureDate: string;
  totalTtc: number;
  evolutions: { id: string; actuelle: string; suivante: string; date: string }[];
};

export type PaiementFiche = {
  id: string;
  date: string;
  mode: string;
  statut: string;
  avance: number;
  reste: number;
  recu: string | null;
  factureDate: string;
  totalTtc: number;
  ordre: number;
};

export type MontageFiche = {
  id: string;
  etape: string;
  chassis: string | null;
  date: string;
  modele: string | null;
  commandeChassis: string | null;
  equipes: { nom: string; mission: string; statut: string }[];
  rapports: { id: string; details: string; date: string }[];
  ordre: string | null;
};

export type LivraisonFiche = {
  id: string;
  date: string;
  etape: string;
  flag: string;
  modele: string | null;
  couleur: string;
  motorisation: string;
  transmission: string;
  portes: string;
  chassis: string | null;
  conteneur: string | null;
  prix: number | null;
  vehicules: { id: string; modele: string | null; couleur: string; etat: string; motorisation: string; transmission: string }[];
};

export type DossierFiche = {
  id: string;
  numero: string;
  nomCourt: string;
  prospectType: string;
  prospectNom: string;
  createdAt: string;
  profil: ProfilParticulier | ProfilEntreprise | null;
  visites: VisiteFiche[];
  echanges: EchangeFiche[];
  rendezVous: RendezVousFiche[];
  proformas: ProformaFiche[];
  bonsCommande: BonCommandeFiche[];
  bonsAccord: BonAccordFiche[];
  lettres: LettreFiche[];
  paiements: PaiementFiche[];
  montages: MontageFiche[];
  livraisons: LivraisonFiche[];
};

function money(value: unknown) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function moneyReq(value: unknown) {
  return money(value) ?? 0;
}

function asStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function parseModeles(raw: string | null): { modeles: ModeleEchange[]; texte: string | null } {
  if (!raw?.trim()) return { modeles: [], texte: null };
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return { modeles: [], texte: raw };
    const modeles = data
      .map((item) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return {
          modele: String(row.modele ?? ""),
          motorisation: String(row.motorisation ?? ""),
          transmission: String(row.transmission ?? ""),
          couleur: String(row.couleur ?? ""),
          observation: String(row.observation ?? ""),
        };
      })
      .filter((item) => item.modele || item.observation || item.couleur);
    return modeles.length > 0 ? { modeles, texte: null } : { modeles: [], texte: raw };
  } catch {
    return { modeles: [], texte: raw };
  }
}

function parseActions(raw: string | null): ActionEchange[] {
  if (!raw?.trim()) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        action: String(row.action ?? ""),
        responsable: String(row.responsable ?? ""),
        echeance: String(row.echeance ?? ""),
        statut: String(row.statut ?? ""),
      };
    }).filter((item) => item.action || item.responsable);
  } catch {
    return [];
  }
}

export async function getDossierFiche(id: string): Promise<DossierFiche | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const responsable = await viewerIsResponsable();
  const row = await prisma.dossierClientele.findFirst({
    where: responsable ? { id } : { id, userId },
  });
  if (!row) return null;

  const owner =
    row.prospectType === "ENTREPRISE"
      ? { clientEntrepriseId: row.prospectId }
      : { clientId: row.prospectId };

  const bonsValides = await prisma.facture.findMany({
    where: {
      ...owner,
      BonDeCommande: { status_bon_de_commande: "VALIDE" },
    },
    select: { id: true },
  });
  for (const item of bonsValides) {
    await assurerEffetsBonValide(item.id);
  }

  const [profilRow, visites, echanges, rendezVous, factures, commandes, modeles] = await Promise.all([
    row.prospectType === "ENTREPRISE"
      ? prisma.client_entreprise.findUnique({ where: { id: row.prospectId } })
      : prisma.client.findUnique({ where: { id: row.prospectId } }),
    prisma.rapportVisiteClientele.findMany({
      where: { prospectId: row.prospectId, prospectType: row.prospectType },
      orderBy: { date: "desc" },
      include: { User: { select: { firstName: true, lastName: true } } },
    }),
    prisma.rapportRendezVous.findMany({
      where: owner,
      orderBy: { date_rendez_vous: "desc" },
      include: {
        RendezVous: { select: { statut: true, resume_rendez_vous: true, note: true } },
        Voiture: { include: { VoitureModel: { select: { model: true } } } },
      },
    }),
    prisma.rendezVous.findMany({
      where: owner,
      orderBy: { date: "desc" },
      select: { id: true, date: true, statut: true, resume_rendez_vous: true, note: true },
    }),
    prisma.facture.findMany({
      where: owner,
      orderBy: { date_facture: "desc" },
      include: {
        FactureLigne: { include: { VoitureModel: { select: { model: true } } } },
        Accessoire: true,
        BonDeCommande: true,
        BonPourAccord: true,
        LettreCommande: { include: { Evolution_Lettre_Commande: { orderBy: { createdAt: "asc" } } } },
        Paiement: { include: { NumeroEntreeCaisse: true }, orderBy: { date_paiement: "desc" } },
        Voiture: { include: { VoitureModel: { select: { model: true } } } },
      },
    }),
    prisma.commande.findMany({
      where: owner,
      orderBy: { date_livraison: "desc" },
      include: {
        VoitureModel: { select: { model: true } },
        Voiture: { include: { VoitureModel: { select: { model: true } } } },
        Conteneur: { select: { conteneurNumber: true } },
        Montage_Commande_montageIdToMontage: {
          include: {
            Equipe: { select: { nomEquipe: true, mission: true, stautsEquipe: true } },
            RapportMontage: { orderBy: { createdAt: "desc" } },
            OrdreMontage: { include: { NumeroChassis: { select: { chassisNumber: true } } } },
          },
        },
        Montage_Montage_commandeIdToCommande: {
          include: {
            Equipe: { select: { nomEquipe: true, mission: true, stautsEquipe: true } },
            RapportMontage: { orderBy: { createdAt: "desc" } },
            OrdreMontage: { include: { NumeroChassis: { select: { chassisNumber: true } } } },
          },
        },
      },
    }),
    prisma.voitureModel.findMany({ select: { id: true, model: true } }),
  ]);

  const modelName = new Map(modeles.map((item) => [item.id, item.model]));
  const nameOf = (value: string) => modelName.get(value) ?? "Modèle supprimé";

  const profil: DossierFiche["profil"] =
    profilRow && "nom_entreprise" in profilRow
      ? {
          kind: "ENTREPRISE",
          nom: profilRow.nom_entreprise,
          sigle: profilRow.sigle,
          email: profilRow.email,
          telephone: profilRow.telephone,
          contactNom: profilRow.nom_personne_contact,
          contactFonction: profilRow.fonction_personne_contact,
          contactEmail: profilRow.email_personne_contact,
          contactTelephone: profilRow.telephone_personne_contact,
          localisation: profilRow.localisation,
          secteur: profilRow.secteur_activite,
          flotte: profilRow.flotte_vehicules,
          flotteDescription: profilRow.flotte_vehicules_description,
          statut: profilRow.status_client,
          commercial: profilRow.commercial,
          premiereCommande: profilRow.premiere_commande,
          createdAt: profilRow.createdAt.toISOString(),
        }
      : profilRow
        ? {
            kind: "CLIENT",
            nom: profilRow.nom,
            email: profilRow.email,
            telephone: profilRow.telephone,
            commercial: profilRow.commercial,
            entreprise: profilRow.entreprise,
            localisation: profilRow.localisation,
            secteur: profilRow.secteur_activite,
            statut: profilRow.status_client,
            premiereCommande: profilRow.premiere_commande,
            createdAt: profilRow.createdAt.toISOString(),
          }
        : null;

  const proformas: ProformaFiche[] = factures.map((facture) => ({
    id: facture.id,
    date: facture.date_facture.toISOString(),
    echeance: facture.date_echeance.toISOString(),
    statut: facture.status_facture,
    validation: facture.validationRespoCom,
    quantite: facture.nbr_voiture_commande,
    prixUnitaire: moneyReq(facture.prix_unitaire),
    montantHt: moneyReq(facture.montant_ht),
    totalHt: moneyReq(facture.total_ht),
    remise: moneyReq(facture.remise),
    montantRemise: moneyReq(facture.montant_remise),
    netHt: moneyReq(facture.montant_net_ht),
    tva: moneyReq(facture.tva),
    montantTva: moneyReq(facture.montant_tva),
    totalTtc: moneyReq(facture.total_ttc),
    avance: moneyReq(facture.avance_payee),
    reste: moneyReq(facture.reste_payer),
    notes: facture.notes_proforma,
    bonPourAcquis: facture.bon_pour_acquis,
    vehicule: facture.Voiture?.VoitureModel?.model ?? null,
    lignes: facture.FactureLigne.map((ligne) => ({
      id: ligne.id,
      modele: ligne.VoitureModel.model,
      couleur: ligne.couleur,
      quantite: ligne.nbr_voiture,
      prixUnitaire: moneyReq(ligne.prix_unitaire),
      montant: moneyReq(ligne.montant_ligne),
      remise: moneyReq(ligne.remise),
      motorisation: ligne.motorisation,
      transmission: ligne.transmission,
    })),
    accessoires: facture.Accessoire.map((item) => ({
      id: item.id,
      nom: item.nom,
      description: item.description,
      prix: money(item.prix),
      quantite: item.quantity,
    })),
  }));

  const etapesEchange = (rapport: (typeof echanges)[number]) =>
    [
      rapport.Com_Pres && "Présentation",
      rapport.Com_Drive && "Essai",
      rapport.Com_Achat && "Achat",
      rapport.Com_Livre && "Livraison",
      rapport.Com_APV && "Après-vente",
      rapport.Com_Office && "Bureau",
      rapport.Com_Close && "Closing",
    ].filter((item): item is string => Boolean(item));

  const montages: MontageFiche[] = [];
  const seen = new Set<string>();
  for (const commande of commandes) {
    const linked = [
      commande.Montage_Commande_montageIdToMontage,
      ...commande.Montage_Montage_commandeIdToCommande,
    ].filter((item): item is NonNullable<typeof commande.Montage_Commande_montageIdToMontage> => Boolean(item));
    for (const montage of linked) {
      if (seen.has(montage.id)) continue;
      seen.add(montage.id);
      montages.push({
        id: montage.id,
        etape: montage.etapeMontage,
        chassis: montage.no_chassis ?? montage.OrdreMontage?.NumeroChassis.chassisNumber ?? commande.numChassis,
        date: montage.createdAt.toISOString(),
        modele: commande.VoitureModel?.model ?? commande.Voiture[0]?.VoitureModel?.model ?? null,
        commandeChassis: commande.numChassis,
        equipes: montage.Equipe.map((equipe) => ({
          nom: equipe.nomEquipe,
          mission: equipe.mission,
          statut: equipe.stautsEquipe,
        })),
        rapports: montage.RapportMontage.map((rapport) => ({
          id: rapport.id,
          details: rapport.details,
          date: rapport.createdAt.toISOString(),
        })),
        ordre: montage.OrdreMontage?.ordreMontageFlag ?? null,
      });
    }
  }

  return {
    id: row.id,
    numero: row.numero,
    nomCourt: row.nomCourt,
    prospectType: row.prospectType,
    prospectNom: row.prospectNom,
    createdAt: row.createdAt.toISOString(),
    profil,
    visites: visites.map((visite) => ({
      id: visite.id,
      date: visite.date.toISOString(),
      lieu: visite.lieuRencontre,
      testDrive: visite.testDrivePropose,
      activites: asStrings(visite.activites),
      typesVehicules: asStrings(visite.typesVehicules),
      modelesPresentes: asStrings(visite.modelesPresentes).map(nameOf),
      modelesRetenus: asStrings(visite.modelesRetenus).map(nameOf),
      modesAcquisition: asStrings(visite.modesAcquisition),
      barrieres: asStrings(visite.barrieresDecision),
      conclusion: readConclusion(visite.conclusion),
      auteur: `${visite.User.firstName} ${visite.User.lastName}`.trim(),
    })),
    echanges: echanges.map((rapport) => {
      const parsed = parseModeles(rapport.modeles_discutes);
      return {
        id: rapport.id,
        rendezVousId: rapport.rendezVousId,
        date: rapport.date_rendez_vous.toISOString(),
        heure: rapport.heure_rendez_vous,
        lieu: rapport.lieu_rendez_vous,
        lieuAutre: rapport.lieu_autre,
        duree: rapport.duree_rendez_vous,
        conseiller: rapport.conseiller_commercial,
        client: rapport.nom_prenom_client,
        telephone: rapport.telephone_client,
        email: rapport.email_client,
        profession: rapport.profession_societe,
        typeClient: rapport.type_client,
        statutRendezVous: rapport.RendezVous?.statut ?? null,
        resume: rapport.RendezVous?.resume_rendez_vous ?? null,
        note: rapport.RendezVous?.note ?? null,
        typeContact: rapport.typeContact,
        besoin: rapport.besoinIdentifie,
        motivations: rapport.motivations_achat,
        pointsPositifs: rapport.points_positifs,
        objections: rapport.objections_freins,
        interet: rapport.degre_interet,
        decision: rapport.decision_attendue,
        etape: rapport.etapeDesEchanges,
        financement: rapport.financement_propose,
        propositions: rapport.propositions_faites,
        referenceOffre: rapport.reference_offre,
        suivi: rapport.suivi_actions,
        commentaire: rapport.commentaire_global,
        devis: rapport.devis_offre_remise,
        assurance: rapport.assurance_entretien,
        reprise: rapport.reprise_ancien_vehicule,
        objetAutre: rapport.objet_autre,
        etapes: etapesEchange(rapport),
        modeles: parsed.modeles,
        modelesTexte: parsed.texte,
        actions: parseActions(rapport.actions_suivi),
        vehicule: rapport.Voiture?.VoitureModel?.model ?? null,
      };
    }),
    rendezVous: rendezVous.map((item) => ({
      id: item.id,
      date: item.date.toISOString(),
      statut: item.statut,
      resume: item.resume_rendez_vous,
      note: item.note,
    })),
    proformas,
    bonsCommande: factures.flatMap((facture) =>
      facture.BonDeCommande
        ? [{
            id: facture.BonDeCommande.id,
            factureId: facture.id,
            numero: facture.BonDeCommande.numero,
            prefix: facture.BonDeCommande.prefix_numero,
            statut: (() => {
              const column = facture.BonDeCommande.status_bon_de_commande;
              if (column === "VALIDE" || column === "VALIDE_APPORT_INITIAL" || column === "SOUS_RESERVE" || column === "ANNULE") {
                return column;
              }
              return parseBonCommandeContenu(facture.BonDeCommande.contenu)?.etapeValidation || column;
            })(),
            date: facture.BonDeCommande.createdAt.toISOString(),
            factureDate: facture.date_facture.toISOString(),
            totalTtc: moneyReq(facture.total_ttc),
          }]
        : [],
    ),
    bonsAccord: factures.flatMap((facture) =>
      facture.BonPourAccord
        ? [{
            id: facture.BonPourAccord.id,
            numero: facture.BonPourAccord.numero_bon_pour_accord,
            statut: facture.BonPourAccord.status_bon_pour_accord,
            date: facture.BonPourAccord.createdAt.toISOString(),
            factureDate: facture.date_facture.toISOString(),
            totalTtc: moneyReq(facture.total_ttc),
          }]
        : [],
    ),
    lettres: factures.flatMap((facture) =>
      facture.LettreCommande
        ? [{
            id: facture.LettreCommande.id,
            numero: facture.LettreCommande.numero_lettre_commande,
            valide: facture.LettreCommande.validite_lettre_commande,
            date: facture.LettreCommande.createdAt.toISOString(),
            factureDate: facture.date_facture.toISOString(),
            totalTtc: moneyReq(facture.total_ttc),
            evolutions: facture.LettreCommande.Evolution_Lettre_Commande.map((evolution) => ({
              id: evolution.id,
              actuelle: evolution.etape_actuelle,
              suivante: evolution.etape_suivante,
              date: evolution.createdAt.toISOString(),
            })),
          }]
        : [],
    ),
    paiements: factures.flatMap((facture) =>
      facture.Paiement.flatMap((paiement) => {
        const prefix = paiement.NumeroEntreeCaisse?.prefix_numero ?? "";
        if (prefix === "AC2" || prefix === "SLD") return [];
        const ordre = prefix === "AC1" ? 1 : 2;
        return [{
          id: paiement.id,
          date: paiement.date_paiement.toISOString(),
          mode: paiement.mode_paiement,
          statut: prefix === "AC1" ? "PAYE" : paiement.status_paiement,
          avance: moneyReq(paiement.avance_payee),
          reste: moneyReq(paiement.reste_payer),
          recu: paiement.NumeroEntreeCaisse
            ? `${paiement.NumeroEntreeCaisse.prefix_numero}${paiement.NumeroEntreeCaisse.numero}`
            : null,
          factureDate: facture.date_facture.toISOString(),
          totalTtc: moneyReq(facture.total_ttc),
          ordre,
        }];
      }),
    ).sort((a, b) => a.ordre - b.ordre || a.date.localeCompare(b.date)),
    montages,
    livraisons: commandes.map((commande) => ({
      id: commande.id,
      date: commande.date_livraison.toISOString(),
      etape: commande.etapeCommande,
      flag: commande.commandeFlag,
      modele: commande.VoitureModel?.model ?? null,
      couleur: commande.couleur,
      motorisation: commande.motorisation,
      transmission: commande.transmission,
      portes: commande.nbr_portes,
      chassis: commande.numChassis,
      conteneur: commande.Conteneur?.conteneurNumber ?? null,
      prix: money(commande.prix_unitaire),
      vehicules: commande.Voiture.map((voiture) => ({
        id: voiture.id,
        modele: voiture.VoitureModel?.model ?? null,
        couleur: voiture.couleur,
        etat: voiture.etatVoiture,
        motorisation: voiture.motorisation,
        transmission: voiture.transmission,
      })),
    })),
  };
}

function prospectKey(type: string, id: string) {
  return `${type}:${id}`;
}

function ownerFilter(clientIds: string[], entrepriseIds: string[]) {
  const OR = [
    ...(clientIds.length ? [{ clientId: { in: clientIds } }] : []),
    ...(entrepriseIds.length ? [{ clientEntrepriseId: { in: entrepriseIds } }] : []),
  ];
  return OR.length ? { OR } : null;
}

function niveauAtteint(flags: {
  visite: boolean;
  proforma: boolean;
  reponse: boolean;
  paiement: boolean;
  autres: boolean;
  montage: boolean;
  livraison: boolean;
}): NiveauDossierId {
  const reached: Record<NiveauDossierId, boolean> = {
    ouverture: true,
    visite: flags.visite,
    proforma: flags.proforma,
    reponse: flags.reponse,
    paiement: flags.paiement,
    "autres-versements": flags.autres,
    montage: flags.montage,
    livraison: flags.livraison,
  };
  let current: NiveauDossierId = "ouverture";
  for (const niveau of NIVEAUX_DOSSIER) {
    if (reached[niveau.id]) current = niveau.id;
  }
  return current;
}

export async function getDossiersPourResponsable(): Promise<DossierResponsableCard[]> {
  if (!(await viewerIsResponsable())) return [];

  const dossiers = await prisma.dossierClientele.findMany({
    orderBy: { createdAt: "desc" },
    include: { User: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (dossiers.length === 0) return [];

  const clientIds = dossiers.filter((row) => row.prospectType === "CLIENT").map((row) => row.prospectId);
  const entrepriseIds = dossiers.filter((row) => row.prospectType === "ENTREPRISE").map((row) => row.prospectId);
  const owner = ownerFilter(clientIds, entrepriseIds);
  const prospectIds = dossiers.map((row) => row.prospectId);

  const [visites, echanges, factures, commandes] = await Promise.all([
    prisma.rapportVisiteClientele.findMany({
      where: { prospectId: { in: prospectIds } },
      select: { prospectId: true, prospectType: true },
    }),
    owner
      ? prisma.rapportRendezVous.findMany({
          where: owner,
          select: { clientId: true, clientEntrepriseId: true },
        })
      : Promise.resolve([]),
    owner
      ? prisma.facture.findMany({
          where: owner,
          select: {
            clientId: true,
            clientEntrepriseId: true,
            status_facture: true,
            BonDeCommande: { select: { status_bon_de_commande: true } },
            BonPourAccord: { select: { status_bon_pour_accord: true } },
            LettreCommande: { select: { id: true } },
            Paiement: {
              select: {
                status_paiement: true,
                NumeroEntreeCaisse: { select: { prefix_numero: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    owner
      ? prisma.commande.findMany({
          where: owner,
          select: {
            clientId: true,
            clientEntrepriseId: true,
            montageId: true,
            Montage_Montage_commandeIdToCommande: { select: { id: true }, take: 1 },
          },
        })
      : Promise.resolve([]),
  ]);

  const avecVisite = new Set(visites.map((row) => prospectKey(row.prospectType, row.prospectId)));
  const avecEchange = new Set<string>();
  for (const row of echanges) {
    if (row.clientId) avecEchange.add(prospectKey("CLIENT", row.clientId));
    if (row.clientEntrepriseId) avecEchange.add(prospectKey("ENTREPRISE", row.clientEntrepriseId));
  }

  type Compte = {
    proforma: boolean;
    reponse: boolean;
    paye: boolean;
    paiements: { ordre: number; paye: boolean }[];
  };
  const comptes = new Map<string, Compte>();
  const compteDe = (key: string) => {
    const current = comptes.get(key);
    if (current) return current;
    const created: Compte = { proforma: false, reponse: false, paye: false, paiements: [] };
    comptes.set(key, created);
    return created;
  };

  for (const facture of factures) {
    const keys = [
      facture.clientId ? prospectKey("CLIENT", facture.clientId) : null,
      facture.clientEntrepriseId ? prospectKey("ENTREPRISE", facture.clientEntrepriseId) : null,
    ].filter((key): key is string => Boolean(key));
    for (const key of keys) {
      const compte = compteDe(key);
      compte.proforma = true;
      if (facture.status_facture === "PAYEE") compte.paye = true;
      const bon = facture.BonDeCommande;
      const accord = facture.BonPourAccord;
      if (
        (bon && bon.status_bon_de_commande !== "ANNULE") ||
        (accord && accord.status_bon_pour_accord !== "ANNULE") ||
        facture.LettreCommande
      ) {
        compte.reponse = true;
      }
      for (const paiement of facture.Paiement) {
        const prefix = paiement.NumeroEntreeCaisse?.prefix_numero ?? "";
        if (prefix === "AC2" || prefix === "SLD") continue;
        const ordre = prefix === "AC1" ? 1 : 2;
        const paye = prefix === "AC1" || paiement.status_paiement === "PAYE";
        compte.paiements.push({ ordre, paye });
        if (paye) compte.paye = true;
      }
    }
  }

  const avecMontage = new Set<string>();
  const avecLivraison = new Set<string>();
  for (const commande of commandes) {
    const keys = [
      commande.clientId ? prospectKey("CLIENT", commande.clientId) : null,
      commande.clientEntrepriseId ? prospectKey("ENTREPRISE", commande.clientEntrepriseId) : null,
    ].filter((key): key is string => Boolean(key));
    const montage = Boolean(commande.montageId) || commande.Montage_Montage_commandeIdToCommande.length > 0;
    for (const key of keys) {
      avecLivraison.add(key);
      if (montage) avecMontage.add(key);
    }
  }

  return dossiers.map((row) => {
    const key = prospectKey(row.prospectType, row.prospectId);
    const compte = comptes.get(key);
    const acompte = compte?.paiements.some((paiement) => paiement.ordre === 1) ?? false;
    const versementsEnAttente = compte?.paiements.some((paiement) => paiement.ordre > 1 && !paiement.paye) ?? false;
    const nom = `${row.User.firstName} ${row.User.lastName}`.trim();
    return {
      id: row.id,
      numero: row.numero,
      nomCourt: row.nomCourt,
      prospectNom: row.prospectNom,
      prospectType: row.prospectType === "ENTREPRISE" ? "ENTREPRISE" : "CLIENT",
      createdAt: row.createdAt.toISOString(),
      commercialId: row.User.id,
      commercialNom: nom || "Commercial",
      niveau: niveauAtteint({
        visite: avecVisite.has(key) || avecEchange.has(key),
        proforma: compte?.proforma ?? false,
        reponse: compte?.reponse ?? false,
        paiement: (compte?.paye ?? false) || (compte?.paiements.length ?? 0) > 0,
        autres: acompte && !versementsEnAttente,
        montage: avecMontage.has(key),
        livraison: avecLivraison.has(key),
      }),
    };
  });
}
