"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { CONCLUSION_CRITERES } from "@/app/(dashboard)/commercial/visite-en-clientele/visite-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { DossierFiche as Fiche, EchangeFiche, ProformaFiche, PaiementFiche } from "@/lib/actions/dossier-clientele";
import { soumettreNouveauVersement, validerAutreVersement } from "@/lib/actions/bondecommande";
import type { BonCommandeSource } from "@/lib/actions/bondecommande";
import BonDeCommandeDocument from "@/app/(dashboard)/commercial/bon-de-commande/BonDeCommandeDocument";
import ContratDeVenteDocument from "./ContratDeVenteDocument";
import { formatCFA } from "@/lib/utils";

const LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  PROFORMA: "Proforma",
  FACTURE: "Facture",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
  SOUS_RESERVE: "Sous réserve",
  A_VALIDER: "À valider",
  EN_VALIDATION: "Validation en cours",
  VALIDE: "Validé",
  VALIDE_APPORT_INITIAL: "Validé — apport initial",
  ANNULE: "Annulé",
  PAYE: "Payé",
  CB: "Carte bancaire",
  CHEQUE: "Chèque",
  VIREMENT: "Virement",
  CASH: "Espèces",
  CREATION: "Création",
  EXECUTION: "Exécution",
  VERIFICATION: "Vérification",
  CORRECTION: "Correction",
  TERMINEE: "Terminée",
  PIECES: "En pièces",
  MONTAGE: "Montage",
  TESTE: "Test",
  PARKING: "Parking",
  VENTE: "Vente",
  LIVREE: "Livrée",
  PROPOSITION: "Proposition",
  TRANSITE: "En transit",
  RENSEIGNEE: "Renseignée",
  ARRIVE: "Arrivée",
  VERIFIER: "À vérifier",
  DECHARGE: "Déchargée",
  CHARGE: "Chargée",
  CLIENT: "Client",
  PROSPECT: "Prospect",
  ABANDONNE: "Abandonné",
  FAVORABLE: "Favorable",
  A_SUIVRE: "À suivre",
  CREER: "Créée",
  VALIDATION_COURS: "Validation en cours",
  VALIDATED: "Validée",
  VENDUE: "Vendue",
  DISPONIBLE: "Disponible",
  ELECTRIQUE: "Électrique",
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  AUTOMATIQUE: "Automatique",
  MANUEL: "Manuelle",
  CONFIRME: "Confirmé",
  DEPLACE: "Déplacé",
  EFFECTUE: "Effectué",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TRANSITE_NON_RENSEIGNE: "Transit non renseigné",
  TRANSITE_DEJA_RENSEIGNE: "Transit déjà renseigné",
  DEPOTAGE_EN_COURS: "Dépotage en cours",
};

function label(value: string | null | undefined) {
  if (!value) return "—";
  return LABELS[value] ?? value.replaceAll("_", " ");
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ead7a2] bg-[#fffaf0] px-6 py-14 text-center">
      <p className="font-medium text-[#2c2112]">{title}</p>
      <p className="mt-1 text-sm text-[#6d5428]">{text}</p>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-[#3a2808] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#f6e7c1]">
      {label(value)}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <article className="overflow-hidden rounded-2xl border border-[#ead7a2] bg-white shadow-sm">{children}</article>;
}

function CardHead({ title, meta, badge }: { title: string; meta?: string; badge?: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f3e6c4] bg-[#fffaf0] px-4 py-3">
      <div>
        <h3 className="font-semibold text-[#2c2112]">{title}</h3>
        {meta && <p className="mt-0.5 text-xs text-[#8a6420]">{meta}</p>}
      </div>
      {badge && <Badge value={badge} />}
    </header>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{children}</dl>;
}

function Field({ label: name, value }: { label: string; value: React.ReactNode }) {
  const empty = value == null || value === "";
  return (
    <div className="rounded-xl bg-[#fffaf0] px-3 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6420]">{name}</dt>
      <dd className="mt-1 text-sm text-[#2c2112]">{empty ? "—" : value}</dd>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-[#8a6420]">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[#fff6df] px-2.5 py-1 text-xs font-medium text-[#3a2808]">
          {item}
        </span>
      ))}
    </div>
  );
}

function Block({ label: name, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6420]">{name}</p>
      {children}
    </div>
  );
}

function TextBlock({ label: name, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <Block label={name}>
      <p className="whitespace-pre-wrap text-sm text-[#2c2112]">{value}</p>
    </Block>
  );
}

function YesNo({ value }: { value: boolean | null | undefined }) {
  if (value == null) return "—";
  return value ? "Oui" : "Non";
}

type StepState = "fait" | "cours" | "venir";

type Step = {
  id: string;
  tab: string;
  title: string;
  detail: string;
  reached: boolean;
  state: StepState;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count > 1 ? many : one}`;
}

function dossierSteps(fiche: Fiche): Step[] {
  const visites = fiche.visites.length;
  const echanges = fiche.echanges.length;
  const proformas = fiche.proformas.filter((item) => item.statut !== "ANNULEE");
  const reponses =
    fiche.bonsCommande.filter((item) => item.statut !== "ANNULE").length +
    fiche.bonsAccord.filter((item) => item.statut !== "ANNULE").length +
    fiche.lettres.length;
  const paiements = fiche.paiements.filter((item) => item.statut !== "ANNULE");
  const paye = paiements.some((item) => item.statut === "PAYE") || proformas.some((item) => item.statut === "PAYEE");
  const proforma = [...proformas].sort((a, b) => b.date.localeCompare(a.date))[0];
  const montage = [...fiche.montages].sort((a, b) => b.date.localeCompare(a.date))[0];
  const livraison = [...fiche.livraisons].sort((a, b) => b.date.localeCompare(a.date))[0];

  const visiteDetail = [
    visites > 0 ? plural(visites, "visite", "visites") : null,
    echanges > 0 ? plural(echanges, "échange", "échanges") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const acompte = paiements.find((item) => item.ordre === 1);
  const suivants = paiements.filter((item) => item.ordre > 1);
  const suivantsEnAttente = suivants.filter((item) => item.statut !== "PAYE");
  const raw: Omit<Step, "state">[] = [
    { id: "ouverture", tab: "profil", title: "Ouverture", detail: formatDate(fiche.createdAt), reached: true },
    {
      id: "visite",
      tab: "visite",
      title: "Visite et échange",
      detail: visiteDetail || "À renseigner",
      reached: visites + echanges > 0,
    },
    {
      id: "proforma",
      tab: "proforma",
      title: "Proforma",
      detail: proforma ? label(proforma.statut) : "À établir",
      reached: proformas.length > 0,
    },
    {
      id: "reponse",
      tab: "reponse",
      title: "Réponse client",
      detail: reponses > 0 ? plural(reponses, "document", "documents") : "En attente",
      reached: reponses > 0,
    },
    {
      id: "paiement",
      tab: "paiement",
      title: "Paiement",
      detail: acompte
        ? `Acompte n° 1 : ${formatCFA(acompte.avance)}`
        : paye
          ? "Réglé"
          : paiements.length > 0
            ? "Versement en cours"
            : "À encaisser",
      reached: paye || paiements.length > 0,
    },
    {
      id: "autres-versements",
      tab: "autres-versements",
      title: "Autres versements",
      detail: !acompte
        ? "Après le premier versement"
        : suivantsEnAttente.length > 0
          ? `1er versement validé · ${plural(suivantsEnAttente.length, "versement à valider", "versements à valider")}`
          : "1er versement validé",
      reached: Boolean(acompte) && suivantsEnAttente.length === 0,
    },
    {
      id: "montage",
      tab: "montage",
      title: "Montage",
      detail: montage ? label(montage.etape) : "À lancer",
      reached: Boolean(montage),
    },
    {
      id: "livraison",
      tab: "livraison",
      title: "Livraison",
      detail: livraison ? label(livraison.etape) : "À planifier",
      reached: Boolean(livraison),
    },
  ];

  const firstGap = raw.findIndex((step) => !step.reached);
  return raw.map((step, index) => ({
    ...step,
    state: step.reached ? "fait" : index === firstGap ? "cours" : "venir",
  }));
}

function Avancement({ fiche, onSelect }: { fiche: Fiche; onSelect: (tab: string) => void }) {
  const steps = dossierSteps(fiche);
  const faits = steps.filter((step) => step.state === "fait").length;
  const active = steps.find((step) => step.state === "cours");

  return (
    <section className="rounded-2xl border border-[#ead7a2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6420]">Avancement du dossier</p>
          <h2 className="mt-1 text-lg font-bold text-[#2c2112]">
            {active ? `Prochaine étape : ${active.title}` : "Toutes les étapes sont renseignées"}
          </h2>
        </div>
        <p className="text-sm font-semibold tabular-nums text-[#6d5428]">
          {faits} / {steps.length}
        </p>
      </div>

      <ol className="mt-5 flex overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const prevReached = index > 0 && steps[index - 1].reached;
          const circle =
            step.state === "fait"
              ? "border-[#3a2808] bg-[#3a2808] text-[#f6e7c1]"
              : step.state === "cours"
                ? "border-[#e7b84a] bg-[#e7b84a] text-[#3a2808] ring-4 ring-[#f6e7c1]"
                : "border-[#ead7a2] bg-[#fffaf0] text-[#8a6420]";
          const title =
            step.state === "venir" ? "text-[#8a6420]" : "text-[#2c2112]";
          return (
            <li key={step.id} className="flex min-w-[7.5rem] flex-1">
              <button
                type="button"
                onClick={() => onSelect(step.tab)}
                className="flex w-full flex-col items-center rounded-xl px-1 py-1 text-center hover:bg-[#fffaf0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7b84a]"
              >
                <span className="flex w-full items-center">
                  <span className={`h-0.5 flex-1 ${index === 0 ? "bg-transparent" : prevReached ? "bg-[#3a2808]" : "bg-[#ead7a2]"}`} />
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${circle}`}>
                    {step.state === "fait" ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`h-0.5 flex-1 ${index === steps.length - 1 ? "bg-transparent" : step.reached ? "bg-[#3a2808]" : "bg-[#ead7a2]"}`} />
                </span>
                <span className={`mt-2 text-xs font-semibold leading-tight ${title}`}>{step.title}</span>
                <span className="mt-0.5 text-[11px] leading-tight text-[#8a6420]">{step.detail}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TabButton({
  value,
  title,
  count,
  badge,
}: {
  value: string;
  title: string;
  count?: number;
  badge?: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="group h-auto shrink-0 gap-2 rounded-lg px-3 py-2 text-[#6d5428] data-[state=active]:bg-[#3a2808] data-[state=active]:text-[#f6e7c1] data-[state=active]:shadow-none"
    >
      {title}
      {typeof count === "number" && (
        <span className="rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums group-data-[state=active]:bg-white/15">{count}</span>
      )}
      {badge ? (
        <span className="rounded-full bg-[#111] px-1.5 text-[11px] font-semibold text-[#e7b84a]">{badge}</span>
      ) : null}
    </TabsTrigger>
  );
}

function Profil({ fiche }: { fiche: Fiche }) {
  const profil = fiche.profil;
  if (!profil) {
    return <Empty title="Profil introuvable" text="Le prospect lié à ce dossier n’est plus dans le répertoire." />;
  }
  if (profil.kind === "ENTREPRISE") {
    return (
      <Card>
        <CardHead title={profil.nom} meta={profil.sigle ?? "Entreprise"} badge={profil.statut} />
        <Grid>
          <Field label="Téléphone" value={profil.telephone} />
          <Field label="Email" value={profil.email} />
          <Field label="Commercial" value={profil.commercial} />
          <Field label="Localisation" value={profil.localisation} />
          <Field label="Secteur d’activité" value={profil.secteur} />
          <Field label="Première commande" value={<YesNo value={profil.premiereCommande} />} />
          <Field label="Flotte de véhicules" value={<YesNo value={profil.flotte} />} />
          <Field label="Description de la flotte" value={profil.flotteDescription} />
          <Field label="Enregistré le" value={formatDate(profil.createdAt)} />
        </Grid>
        <div className="border-t border-[#f3e6c4] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6420]">Personne de contact</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Nom" value={profil.contactNom} />
            <Field label="Fonction" value={profil.contactFonction} />
            <Field label="Téléphone" value={profil.contactTelephone} />
            <Field label="Email" value={profil.contactEmail} />
          </dl>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <CardHead title={profil.nom} meta="Particulier" badge={profil.statut} />
      <Grid>
        <Field label="Téléphone" value={profil.telephone} />
        <Field label="Email" value={profil.email} />
        <Field label="Entreprise" value={profil.entreprise} />
        <Field label="Commercial" value={profil.commercial} />
        <Field label="Localisation" value={profil.localisation} />
        <Field label="Secteur d’activité" value={profil.secteur} />
        <Field label="Première commande" value={<YesNo value={profil.premiereCommande} />} />
        <Field label="Enregistré le" value={formatDate(profil.createdAt)} />
      </Grid>
    </Card>
  );
}

function Visites({ fiche }: { fiche: Fiche }) {
  const covered = new Set(fiche.echanges.map((item) => item.rendezVousId));
  const rendezVous = fiche.rendezVous.filter((item) => !covered.has(item.id));
  if (fiche.visites.length === 0 && fiche.echanges.length === 0 && rendezVous.length === 0) {
    return (
      <Empty
        title="Aucune visite ni échange"
        text="Les rapports de visite en clientèle et les comptes rendus de rendez-vous de ce prospect apparaîtront ici."
      />
    );
  }
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8a6420]">
          Visites en clientèle ({fiche.visites.length})
        </h2>
        {fiche.visites.length === 0 ? (
          <Empty title="Aucune visite" text="Aucun rapport de visite n’est enregistré pour ce prospect." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {fiche.visites.map((visite) => (
              <Card key={visite.id}>
                <CardHead
                  title={formatDate(visite.date)}
                  meta={[visite.lieu, visite.auteur].filter(Boolean).join(" · ")}
                  badge={visite.testDrive ? "Test drive" : undefined}
                />
                <div className="space-y-4 p-4">
                  <Block label="Activités"><Tags items={visite.activites} /></Block>
                  <Block label="Véhicules utilisés"><Tags items={visite.typesVehicules} /></Block>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Block label="Modèles présentés"><Tags items={visite.modelesPresentes} /></Block>
                    <Block label="Modèles retenus"><Tags items={visite.modelesRetenus} /></Block>
                  </div>
                  <Block label="Mode d’acquisition"><Tags items={visite.modesAcquisition} /></Block>
                  <Block label="Barrières à la décision"><Tags items={visite.barrieres} /></Block>
                  {visite.conclusion && (
                    <Block label="Conclusion">
                      <ul className="divide-y divide-[#f3e6c4] overflow-hidden rounded-xl border border-[#f3e6c4]">
                        {CONCLUSION_CRITERES.map((critere) => (
                          <li key={critere.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                            <span>{critere.label}</span>
                            <span className="font-semibold text-[#3a2808]">{visite.conclusion?.[critere.id] ? "Oui" : "Non"}</span>
                          </li>
                        ))}
                      </ul>
                    </Block>
                  )}
                  {visite.testDrive != null && (
                    <Field label="Test drive proposé" value={<YesNo value={visite.testDrive} />} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8a6420]">
          Échanges ({fiche.echanges.length})
        </h2>
        {fiche.echanges.length === 0 ? (
          <Empty title="Aucun échange" text="Aucun compte rendu de rendez-vous n’est enregistré pour ce prospect." />
        ) : (
          <div className="space-y-4">
            {fiche.echanges.map((echange) => (
              <EchangeCard key={echange.id} echange={echange} />
            ))}
          </div>
        )}
      </section>

      {rendezVous.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8a6420]">
            Rendez-vous sans compte rendu ({rendezVous.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {rendezVous.map((item) => (
              <Card key={item.id}>
                <CardHead title={formatWhen(item.date)} badge={item.statut} />
                <div className="space-y-3 p-4">
                  <TextBlock label="Résumé" value={item.resume} />
                  <TextBlock label="Note" value={item.note} />
                  {!item.resume && !item.note && <p className="text-sm text-[#8a6420]">Aucun résumé saisi.</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EchangeCard({ echange }: { echange: EchangeFiche }) {
  return (
    <Card>
      <CardHead
        title={`${formatDate(echange.date)} · ${echange.heure}`}
        meta={[echange.lieu, echange.lieuAutre, echange.conseiller].filter(Boolean).join(" · ")}
        badge={echange.statutRendezVous ?? echange.typeClient}
      />
      <div className="space-y-4 p-4">
        <Grid>
          <Field label="Interlocuteur" value={echange.client} />
          <Field label="Téléphone" value={echange.telephone} />
          <Field label="Email" value={echange.email} />
          <Field label="Profession / société" value={echange.profession} />
          <Field label="Type de client" value={echange.typeClient} />
          <Field label="Durée" value={echange.duree} />
          <Field label="Type de contact" value={echange.typeContact} />
          <Field label="Degré d’intérêt" value={echange.interet} />
          <Field label="Véhicule" value={echange.vehicule} />
          <Field label="Devis remis" value={<YesNo value={echange.devis} />} />
          <Field label="Assurance / entretien" value={<YesNo value={echange.assurance} />} />
          <Field label="Reprise d’un véhicule" value={<YesNo value={echange.reprise} />} />
        </Grid>
        <Block label="Étapes de l’échange"><Tags items={echange.etapes} /></Block>
        {echange.modeles.length > 0 && (
          <Block label="Modèles discutés">
            <ul className="space-y-2">
              {echange.modeles.map((modele, index) => (
                <li key={`${modele.modele}-${index}`} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm">
                  <p className="font-medium">{modele.modele || "Modèle"}</p>
                  <p className="text-[#6d5428]">
                    {[modele.motorisation, modele.transmission, modele.couleur].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {modele.observation && <p className="mt-1">{modele.observation}</p>}
                </li>
              ))}
            </ul>
          </Block>
        )}
        <TextBlock label="Modèles discutés" value={echange.modelesTexte} />
        <TextBlock label="Besoin identifié" value={echange.besoin} />
        <TextBlock label="Motivations d’achat" value={echange.motivations} />
        <TextBlock label="Points positifs" value={echange.pointsPositifs} />
        <TextBlock label="Objections" value={echange.objections} />
        <TextBlock label="Décision attendue" value={echange.decision} />
        <TextBlock label="Étape des échanges" value={echange.etape} />
        <TextBlock label="Financement proposé" value={echange.financement} />
        <TextBlock label="Propositions" value={echange.propositions} />
        <TextBlock label="Référence de l’offre" value={echange.referenceOffre} />
        <TextBlock label="Autre objet" value={echange.objetAutre} />
        <TextBlock label="Suivi" value={echange.suivi} />
        <TextBlock label="Résumé du rendez-vous" value={echange.resume} />
        <TextBlock label="Note" value={echange.note} />
        <TextBlock label="Commentaire" value={echange.commentaire} />
        {echange.actions.length > 0 && (
          <Block label="Actions de suivi">
            <ul className="divide-y divide-[#f3e6c4] overflow-hidden rounded-xl border border-[#f3e6c4]">
              {echange.actions.map((action, index) => (
                <li key={`${action.action}-${index}`} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-4">
                  <span className="font-medium">{action.action || "—"}</span>
                  <span>{action.responsable || "—"}</span>
                  <span>{action.echeance || "—"}</span>
                  <span>{action.statut || "—"}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>
    </Card>
  );
}

function MoneyRow({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#6d5428]">{name}</span>
      <span className="font-medium tabular-nums text-[#2c2112]">{formatCFA(value)}</span>
    </div>
  );
}

function ProformaCard({
  proforma,
  dossierId,
  dossierPath,
}: {
  proforma: ProformaFiche;
  dossierId: string;
  dossierPath: string;
}) {
  return (
    <Card>
      <CardHead title={`Proforma du ${formatDate(proforma.date)}`} meta={`Échéance ${formatDate(proforma.echeance)}`} badge={proforma.statut} />
      <div className="space-y-4 p-4">
        <Link
          href={`${dossierPath}/${dossierId}?facture=${proforma.id}`}
          className="inline-flex rounded-full bg-[#3a2808] px-3 py-1 text-xs font-semibold text-[#f6e7c1]"
        >
          Bon de commande
        </Link>
        <div className="flex flex-wrap gap-2 text-xs text-[#6d5428]">
          <span className="rounded-full bg-[#fff6df] px-2.5 py-1">Validation : {label(proforma.validation)}</span>
          {proforma.bonPourAcquis && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">Bon pour acquis</span>}
          {proforma.vehicule && <span className="rounded-full bg-[#fff6df] px-2.5 py-1">{proforma.vehicule}</span>}
        </div>
        {proforma.lignes.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[#f3e6c4]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#fffaf0] text-[11px] uppercase tracking-wide text-[#8a6420]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Modèle</th>
                  <th className="px-3 py-2 font-semibold">Couleur</th>
                  <th className="px-3 py-2 font-semibold">Qté</th>
                  <th className="px-3 py-2 font-semibold">Prix</th>
                  <th className="px-3 py-2 font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody>
                {proforma.lignes.map((ligne) => (
                  <tr key={ligne.id} className="border-t border-[#f3e6c4]">
                    <td className="px-3 py-2">
                      <p className="font-medium">{ligne.modele}</p>
                      <p className="text-xs text-[#8a6420]">
                        {[label(ligne.motorisation), label(ligne.transmission)].filter((item) => item !== "—").join(" · ")}
                      </p>
                    </td>
                    <td className="px-3 py-2">{ligne.couleur}</td>
                    <td className="px-3 py-2 tabular-nums">{ligne.quantite}</td>
                    <td className="px-3 py-2 tabular-nums">{formatCFA(ligne.prixUnitaire)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatCFA(ligne.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {proforma.accessoires.length > 0 && (
          <Block label="Accessoires">
            <ul className="space-y-1 text-sm">
              {proforma.accessoires.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.nom}{item.quantite ? ` × ${item.quantite}` : ""}</span>
                  <span className="tabular-nums">{item.prix != null ? formatCFA(item.prix) : "—"}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}
        <div className="grid gap-1 rounded-xl bg-[#fffaf0] px-3 py-3">
          <MoneyRow name="Montant HT" value={proforma.montantHt} />
          <MoneyRow name="Total HT" value={proforma.totalHt} />
          <MoneyRow name={`Remise (${proforma.remise} %)`} value={proforma.montantRemise} />
          <MoneyRow name="Net HT" value={proforma.netHt} />
          <MoneyRow name={`TVA (${proforma.tva} %)`} value={proforma.montantTva} />
          <MoneyRow name="Total TTC" value={proforma.totalTtc} />
          <MoneyRow name="Avance" value={proforma.avance} />
          <MoneyRow name="Reste à payer" value={proforma.reste} />
        </div>
        <TextBlock label="Notes" value={proforma.notes} />
      </div>
    </Card>
  );
}

function Proformas({ fiche, dossierPath }: { fiche: Fiche; dossierPath: string }) {
  if (fiche.proformas.length === 0) {
    return <Empty title="Aucune proforma" text="Les proformas établies pour ce prospect apparaîtront ici." />;
  }
  return (
    <div className="space-y-4">
      {fiche.proformas.map((proforma) => (
        <ProformaCard key={proforma.id} proforma={proforma} dossierId={fiche.id} dossierPath={dossierPath} />
      ))}
    </div>
  );
}

function Reponse({
  fiche,
  bonSource,
  section = "bon-commande",
  dossierPath,
}: {
  fiche: Fiche;
  bonSource: BonCommandeSource | null;
  section?: string;
  dossierPath: string;
}) {
  const [sub, setSub] = useState(section === "contrat" ? "contrat" : "bon-commande");
  useEffect(() => {
    if (section === "contrat") setSub("contrat");
  }, [section]);
  return (
    <Tabs value={sub} onValueChange={setSub} className="space-y-4">
      <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-xl bg-white p-1">
        <TabButton value="bon-commande" title="Bon de commande" count={fiche.bonsCommande.length} />
        <TabButton
          value="contrat"
          title="Contrat de vente"
          count={bonSource?.selected ? 1 : 0}
          badge={bonSource?.selected?.contrat?.etapeValidation === "VALIDE" ? "Déjà Validé" : undefined}
        />
        <TabButton value="accord" title="Bon pour accord" count={fiche.bonsAccord.length} />
        <TabButton value="lettre" title="Lettre de commande" count={fiche.lettres.length} />
      </TabsList>
      <TabsContent value="bon-commande">
        {bonSource?.proformas.length ? (
          <BonDeCommandeDocument source={bonSource} dossiers={[]} embedded dossierPath={dossierPath} />
        ) : (
          <Empty
            title="Aucun bon de commande"
            text="Une facture proforma est nécessaire avant le bon de commande."
          />
        )}
      </TabsContent>
      <TabsContent value="contrat">
        {bonSource?.selected ? (
          <ContratDeVenteDocument source={bonSource} embedded dossierPath={dossierPath} />
        ) : (
          <Empty title="Aucun contrat de vente" text="Une facture proforma est nécessaire avant le contrat de vente." />
        )}
      </TabsContent>
      <TabsContent value="accord">
        {fiche.bonsAccord.length === 0 ? (
          <Empty title="Aucun bon pour accord" text="Les bons pour accord liés aux proformas de ce prospect apparaîtront ici." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fiche.bonsAccord.map((bon) => (
              <Card key={bon.id}>
                <CardHead title={bon.numero} meta={`Proforma du ${formatDate(bon.factureDate)}`} badge={bon.statut} />
                <Grid>
                  <Field label="Émis le" value={formatDate(bon.date)} />
                  <Field label="Total TTC" value={formatCFA(bon.totalTtc)} />
                </Grid>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="lettre">
        {fiche.lettres.length === 0 ? (
          <Empty title="Aucune lettre de commande" text="Les lettres de commande liées aux proformas de ce prospect apparaîtront ici." />
        ) : (
          <div className="space-y-3">
            {fiche.lettres.map((lettre) => (
              <Card key={lettre.id}>
                <CardHead
                  title={lettre.numero}
                  meta={`Proforma du ${formatDate(lettre.factureDate)}`}
                  badge={lettre.valide ? "VALIDE" : "EN_ATTENTE"}
                />
                <div className="space-y-3 p-4">
                  <Grid>
                    <Field label="Émise le" value={formatDate(lettre.date)} />
                    <Field label="Validité" value={lettre.valide ? "Valide" : "Non validée"} />
                    <Field label="Total TTC" value={formatCFA(lettre.totalTtc)} />
                  </Grid>
                  {lettre.evolutions.length > 0 && (
                    <Block label="Évolution">
                      <ol className="space-y-2">
                        {lettre.evolutions.map((evolution) => (
                          <li key={evolution.id} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm">
                            <p className="font-medium">{evolution.actuelle} → {evolution.suivante}</p>
                            <p className="text-xs text-[#8a6420]">{formatDate(evolution.date)}</p>
                          </li>
                        ))}
                      </ol>
                    </Block>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function Paiements({ fiche }: { fiche: Fiche }) {
  const paiements = fiche.paiements.filter((item) => item.ordre === 1 || item.statut === "PAYE");
  if (paiements.length === 0) {
    return <Empty title="Aucun paiement" text="Les versements enregistrés pour ce prospect apparaîtront ici." />;
  }
  const verse = paiements.filter((item) => item.statut === "PAYE").reduce((sum, item) => sum + item.avance, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#3a2808] px-4 py-3 text-[#f6e7c1]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e7b84a]">Total des versements</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatCFA(verse)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {paiements.map((paiement) => (
          <Card key={paiement.id}>
            <CardHead title={formatDate(paiement.date)} meta={`Proforma du ${formatDate(paiement.factureDate)}`} badge={paiement.statut} />
            <Grid>
              <Field label="Mode" value={label(paiement.mode)} />
              <Field
                label={paiement.recu?.startsWith("AC1") ? "Acompte n° 1" : "Versement"}
                value={formatCFA(paiement.avance)}
              />
              <Field label="Reste à payer" value={formatCFA(paiement.reste)} />
              <Field label="Total TTC" value={formatCFA(paiement.totalTtc)} />
              {!paiement.recu?.startsWith("AC1") && <Field label="Reçu de caisse" value={paiement.recu} />}
            </Grid>
          </Card>
        ))}
      </div>
    </div>
  );
}

function infosClient(fiche: Fiche) {
  const profil = fiche.profil;
  if (!profil) return [] as { label: string; value: string | null }[];
  if (profil.kind === "ENTREPRISE") {
    return [
      { label: "Téléphone", value: profil.telephone },
      { label: "Email", value: profil.email },
      { label: "Localisation", value: profil.localisation },
      { label: "Contact", value: profil.contactNom },
      { label: "Fonction", value: profil.contactFonction },
    ];
  }
  return [
    { label: "Téléphone", value: profil.telephone },
    { label: "Email", value: profil.email },
    { label: "Localisation", value: profil.localisation },
    { label: "Entreprise", value: profil.entreprise },
  ];
}

function CarteVersementValide({ paiement }: { paiement: PaiementFiche }) {
  const premier = paiement.ordre === 1;
  return (
    <Card>
      <CardHead
        title={premier ? "Acompte n° 1" : "Versement"}
        meta={formatDate(paiement.date)}
        badge="Déjà validé"
      />
      <div className="space-y-3 p-4">
        <Grid>
          <Field label="Montant" value={formatCFA(paiement.avance)} />
          <Field label="Reste à payer" value={formatCFA(paiement.reste)} />
          <Field label="Mode" value={label(paiement.mode)} />
          <Field label="Total TTC" value={formatCFA(paiement.totalTtc)} />
        </Grid>
        <p className="text-sm font-medium text-[#3a2808]">
          {premier ? "Ce premier versement est déjà validé." : "Ce versement est déjà validé."}
        </p>
      </div>
    </Card>
  );
}

function AutresVersements({ fiche, peutValider }: { fiche: Fiche; peutValider: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [montant, setMontant] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const versements = fiche.paiements.filter((item) => item.statut !== "ANNULE");
  const valides = versements.filter((item) => item.ordre === 1 || item.statut === "PAYE");
  const enAttente = versements.filter((item) => item.ordre !== 1 && item.statut !== "PAYE");
  const premier = versements.some((item) => item.ordre === 1);

  const envoyer = async () => {
    setEnvoi(true);
    setErreur(null);
    const result = await soumettreNouveauVersement({ dossierId: fiche.id, date, montant });
    setEnvoi(false);
    if (!result.success) {
      setErreur(result.error);
      return;
    }
    setMontant("");
    setOuvert(false);
    router.refresh();
  };

  const valider = async (id: string) => {
    setPendingId(id);
    setErreur(null);
    const result = await validerAutreVersement(id);
    if (!result.success) setErreur(result.error);
    else router.refresh();
    setPendingId(null);
  };

  if (!premier) {
    return (
      <Empty
        title="Aucun versement"
        text="Les versements apparaissent ici une fois le bon de commande validé."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6d5428]">
          Le premier versement est déjà validé. Chaque nouveau versement est validé par le responsable commercial.
        </p>
        <button
          type="button"
          onClick={() => {
            setErreur(null);
            setOuvert(true);
          }}
          className="h-9 rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a]"
        >
          Nouveau versement
        </button>
      </div>
      {erreur && !ouvert ? <p className="text-sm font-medium text-red-700">{erreur}</p> : null}
      {enAttente.length > 0 && (
        <div className="space-y-2">
          {enAttente.map((paiement) => (
            <div
              key={paiement.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ead7a2] bg-[#fffaf0] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#2c2112]">
                  Versement du {formatDate(paiement.date)} · {formatCFA(paiement.avance)}
                </p>
                <p className="text-sm text-[#8a6420]">En attente de validation par le responsable commercial.</p>
              </div>
              {peutValider && (
                <button
                  type="button"
                  onClick={() => valider(paiement.id)}
                  disabled={pendingId === paiement.id}
                  className="h-9 rounded-md bg-[#111] px-3 text-sm font-semibold text-[#e7b84a] disabled:opacity-50"
                >
                  {pendingId === paiement.id ? "Validation…" : "Valider"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {valides.map((paiement) => (
          <CarteVersementValide key={paiement.id} paiement={paiement} />
        ))}
      </div>
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="border-[#ead7a2] bg-[#fffaf0] sm:max-w-lg">
          <DialogTitle className="text-[#2c2112]">Nouveau versement</DialogTitle>
          <div className="space-y-4">
            <div className="rounded-xl bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6420]">N° de dossier</p>
              <p className="mt-1 text-lg font-bold tabular-nums tracking-[0.14em] text-[#2c2112]">{fiche.numero}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6420]">Client</p>
              <p className="mt-1 font-semibold text-[#2c2112]">{fiche.prospectNom}</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {infosClient(fiche).map((item) => (
                  <div key={item.label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6420]">{item.label}</dt>
                    <dd className="text-sm text-[#2c2112]">{item.value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <label className="block text-sm font-medium text-[#2c2112]">
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-[#ead7a2] bg-white px-3"
              />
            </label>
            <label className="block text-sm font-medium text-[#2c2112]">
              Montant versé
              <input
                inputMode="decimal"
                value={montant}
                onChange={(event) => setMontant(event.target.value)}
                placeholder="0"
                className="mt-1 h-10 w-full rounded-md border border-[#ead7a2] bg-white px-3"
              />
            </label>
            {erreur && ouvert ? <p className="text-sm font-medium text-red-700">{erreur}</p> : null}
            <button
              type="button"
              onClick={envoyer}
              disabled={envoi}
              className="h-10 w-full rounded-md bg-[#111] text-sm font-semibold text-[#e7b84a] disabled:opacity-50"
            >
              {envoi ? "Envoi…" : "Faire Valider"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Montages({ fiche }: { fiche: Fiche }) {
  if (fiche.montages.length === 0) {
    return <Empty title="Aucun montage" text="Le montage des véhicules commandés par ce prospect apparaîtra ici." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fiche.montages.map((montage) => (
        <Card key={montage.id}>
          <CardHead title={montage.modele ?? "Véhicule"} meta={formatDate(montage.date)} badge={montage.etape} />
          <div className="space-y-3 p-4">
            <Grid>
              <Field label="N° châssis" value={montage.chassis} />
              <Field label="Châssis commande" value={montage.commandeChassis} />
              <Field label="Ordre de montage" value={label(montage.ordre)} />
            </Grid>
            <Block label="Équipes">
              {montage.equipes.length === 0 ? (
                <p className="text-sm text-[#8a6420]">Aucune équipe attribuée.</p>
              ) : (
                <ul className="space-y-2">
                  {montage.equipes.map((equipe) => (
                    <li key={equipe.nom} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm">
                      <p className="font-medium">{equipe.nom}</p>
                      <p className="text-[#6d5428]">{equipe.mission}</p>
                      <p className="text-xs text-[#8a6420]">{label(equipe.statut)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Block>
            {montage.rapports.length > 0 && (
              <Block label="Rapports de montage">
                <ul className="space-y-2">
                  {montage.rapports.map((rapport) => (
                    <li key={rapport.id} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm">
                      <p className="whitespace-pre-wrap">{rapport.details}</p>
                      <p className="mt-1 text-xs text-[#8a6420]">{formatDate(rapport.date)}</p>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Livraisons({ fiche }: { fiche: Fiche }) {
  if (fiche.livraisons.length === 0) {
    return <Empty title="Aucune livraison" text="Les véhicules commandés et leur date de livraison apparaîtront ici." />;
  }
  return (
    <div className="space-y-4">
      {fiche.livraisons.map((livraison) => (
        <Card key={livraison.id}>
          <CardHead
            title={livraison.modele ?? "Commande véhicule"}
            meta={`Livraison prévue le ${formatDate(livraison.date)}`}
            badge={livraison.etape}
          />
          <div className="space-y-3 p-4">
            <Grid>
              <Field label="Statut commercial" value={label(livraison.flag)} />
              <Field label="Couleur" value={livraison.couleur} />
              <Field label="Motorisation" value={label(livraison.motorisation)} />
              <Field label="Transmission" value={label(livraison.transmission)} />
              <Field label="Portes" value={livraison.portes} />
              <Field label="N° châssis" value={livraison.chassis} />
              <Field label="Conteneur" value={livraison.conteneur} />
              <Field label="Prix unitaire" value={livraison.prix != null ? formatCFA(livraison.prix) : null} />
            </Grid>
            {livraison.vehicules.length > 0 && (
              <Block label="Véhicules">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {livraison.vehicules.map((voiture) => (
                    <li key={voiture.id} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm">
                      <p className="font-medium">{voiture.modele ?? "Véhicule"}</p>
                      <p className="text-[#6d5428]">
                        {[voiture.couleur, label(voiture.motorisation), label(voiture.transmission)].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#8a6420]">{label(voiture.etat)}</p>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function DossierFiche({
  fiche,
  bonSource,
  initialTab = "profil",
  initialSection = "bon-commande",
  peutValiderVersements = false,
  dossierPath = "/commercial/dossier-clientele",
}: {
  fiche: Fiche;
  bonSource: BonCommandeSource | null;
  initialTab?: string;
  initialSection?: string;
  peutValiderVersements?: boolean;
  dossierPath?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab === "reponse") setTab("reponse");
  }, [initialTab]);
  const reponses = fiche.bonsCommande.length + fiche.bonsAccord.length + fiche.lettres.length;
  return (
    <div className="w-full min-w-0 space-y-6 p-4 sm:p-6">
      <Link
        href={dossierPath}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux dossiers
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#d7a441] bg-gradient-to-b from-[#fff6df] to-[#f3ddaa] shadow-md">
        <div className="flex flex-wrap items-center gap-3 bg-[#e7b84a] px-5 py-4 text-[#3a2808]">
          <span className="text-2xl font-bold tabular-nums tracking-[0.2em]">{fiche.numero}</span>
          <span className="rounded-full bg-[#3a2808] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#f6e7c1]">
            {fiche.nomCourt}
          </span>
        </div>
        <div className="px-5 py-5 text-[#2c2112]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6420]">Prospect</p>
          <h1 className="mt-1 text-2xl font-bold">{fiche.prospectNom}</h1>
          <p className="text-sm text-[#6d5428]">
            {fiche.prospectType === "ENTREPRISE" ? "Entreprise" : "Particulier"} · dossier ouvert le {formatDate(fiche.createdAt)}
          </p>
        </div>
      </div>

      <Avancement fiche={fiche} onSelect={setTab} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-xl bg-[#fff6df] p-1">
          <TabButton value="profil" title="Profil" />
          <TabButton value="visite" title="Visite et échange" count={fiche.visites.length + fiche.echanges.length} />
          <TabButton value="proforma" title="Proforma" count={fiche.proformas.length} />
          <TabButton value="reponse" title="Réponse client" count={reponses} />
          <TabButton
            value="paiement"
            title="Paiement et versement"
            count={fiche.paiements.filter((item) => item.ordre === 1 || item.statut === "PAYE").length}
          />
          <TabButton
            value="autres-versements"
            title="Autres versements"
            count={fiche.paiements.filter((item) => item.ordre > 1).length}
          />
          <TabButton value="montage" title="Montage de véhicule" count={fiche.montages.length} />
          <TabButton value="livraison" title="Livraison véhicule" count={fiche.livraisons.length} />
        </TabsList>
        <TabsContent value="profil"><Profil fiche={fiche} /></TabsContent>
        <TabsContent value="visite"><Visites fiche={fiche} /></TabsContent>
        <TabsContent value="proforma"><Proformas fiche={fiche} dossierPath={dossierPath} /></TabsContent>
        <TabsContent value="reponse"><Reponse fiche={fiche} bonSource={bonSource} section={initialSection} dossierPath={dossierPath} /></TabsContent>
        <TabsContent value="paiement"><Paiements fiche={fiche} /></TabsContent>
        <TabsContent value="autres-versements">
          <AutresVersements fiche={fiche} peutValider={peutValiderVersements} />
        </TabsContent>
        <TabsContent value="montage"><Montages fiche={fiche} /></TabsContent>
        <TabsContent value="livraison"><Livraisons fiche={fiche} /></TabsContent>
      </Tabs>
    </div>
  );
}
