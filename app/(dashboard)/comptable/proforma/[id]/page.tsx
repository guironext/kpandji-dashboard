"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFactureById, convertProformaToFacture } from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";
import { format } from "date-fns";

type Facture = {
  id: string;
  date_facture: string;
  date_echeance: string;
  status_facture: string;
  nbr_voiture_commande: number;
  prix_unitaire: number;
  montant_ht: number;
  total_ht: number;
  remise: number;
  montant_remise: number;
  montant_net_ht: number;
  tva: number;
  montant_tva: number;
  total_ttc: number;
  avance_payee: number;
  reste_payer: number;
  accessoire_nom?: string | null;
  accessoire_description?: string | null;
  accessoire_prix?: number | null;
  accessoire_nbr?: number | null;
  accessoire_subtotal?: number | null;
  client: {
    nom: string;
    telephone?: string;
    entreprise?: string;
    localisation?: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
    telephone?: string;
    localisation?: string;
  } | null;
  voiture: {
    voitureModel: {
      model: string;
      image?: string;
      description?: string;
    } | null;
  } | null;
  lignes?: Array<{
    id: string;
    voitureModelId: string;
    couleur: string;
    nbr_voiture: number;
    prix_unitaire: number;
    montant_ligne: number;
    transmission?: string;
    motorisation?: string;
    voitureModel: {
      model: string;
      image?: string;
      description?: string;
    } | null;
  }>;
  accessoires?: Array<{
    id: string;
    nom: string;
    description?: string;
    prix: number;
    quantity?: number;
    image?: string;
  }>;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    telephone?: string;
  } | null;
};

function getAccessoireImage(
  accessoireNom: string | null | undefined,
  accessoiresList: Array<{ id: string; nom: string; image?: string | null }>
) {
  if (!accessoireNom) return null;
  
  const name = accessoireNom.split(",")[0]?.split(" (x")[0]?.trim();
  const matched = accessoiresList.find((acc) => acc.nom === name);
  
  return matched?.image || null;
}

export default function ProformaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proformaId = params.id as string;
  
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [accessoires, setAccessoires] = useState<
    Array<{ id: string; nom: string; image?: string | null }>
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [factureResult, accessoiresResult] = await Promise.all([
        getFactureById(proformaId),
        getAllAccessoires(),
      ]);

      if (factureResult.success && factureResult.data) {
        setFacture(factureResult.data as Facture);
      } else {
        toast.error("Erreur lors du chargement de la proforma");
      }

      if (accessoiresResult.success && accessoiresResult.data) {
        setAccessoires(accessoiresResult.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [proformaId]);

  const handleConvertToFacture = async () => {
    if (!facture || facture.status_facture !== "PROFORMA") {
      toast.error("Cette proforma ne peut pas être convertie en facture");
      return;
    }

    if (
      !confirm(
        "Êtes-vous sûr de vouloir transformer cette proforma en facture ?"
      )
    ) {
      return;
    }

    setConverting(true);
    const result = await convertProformaToFacture(facture.id);
    
    if (result.success) {
      toast.success("Proforma transformée en facture avec succès");
      router.push(`/comptable/facture/${facture.id}`);
    } else {
      toast.error("Erreur lors de la transformation en facture");
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Proforma introuvable
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lignes =
    facture.lignes && facture.lignes.length > 0
      ? facture.lignes
      : [
          {
            id: "1",
            voitureModelId: "",
            couleur: "",
            nbr_voiture: facture.nbr_voiture_commande,
            prix_unitaire: facture.prix_unitaire,
            montant_ligne: facture.montant_ht,
            transmission: "",
            motorisation: "",
            voitureModel: facture.voiture?.voitureModel || null,
          },
        ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Détails de la Proforma</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/comptable/suivi-bon-commande")}
            variant="outline"
          >
            Retour
          </Button>
          {facture.status_facture === "PROFORMA" && (
            <Button
              onClick={handleConvertToFacture}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700"
            >
              {converting ? "Transformation..." : "Transformer en Facture"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Numéro de Proforma</p>
                <p className="font-bold text-lg">{facture.id.slice(-7)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Statut</p>
                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  {facture.status_facture}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2">Informations Client</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Nom:</span>{" "}
                    {facture.client?.nom ||
                      facture.clientEntreprise?.nom_entreprise ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Téléphone:</span>{" "}
                    {facture.client?.telephone ||
                      facture.clientEntreprise?.telephone ||
                      "N/A"}
                  </p>
                  {facture.client?.localisation ||
                    (facture.clientEntreprise?.localisation && (
                      <p>
                        <span className="font-semibold">Localisation:</span>{" "}
                        {facture.client?.localisation ||
                          facture.clientEntreprise?.localisation}
                      </p>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Dates</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Date Facture:</span>{" "}
                    {format(new Date(facture.date_facture), "dd/MM/yyyy")}
                  </p>
                  <p>
                    <span className="font-semibold">Date Échéance:</span>{" "}
                    {format(new Date(facture.date_echeance), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Prix Unitaire HT</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne, index) => (
                    <TableRow key={ligne.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {ligne.voitureModel?.image ? (
                          <Image
                            src={ligne.voitureModel.image}
                            alt={ligne.voitureModel.model || "Vehicle"}
                            width={100}
                            height={80}
                          />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">
                            {ligne.voitureModel?.model || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600 max-w-60 text-wrap">
                            {ligne.voitureModel?.description || ""}
                          </p>
                          {ligne.couleur && (
                            <div className="text-xs text-gray-600 mt-1">
                              <p>Couleur: {ligne.couleur}</p>
                              {ligne.transmission && (
                                <p>Transmission: {ligne.transmission}</p>
                              )}
                              {ligne.motorisation && (
                                <p>Motorisation: {ligne.motorisation}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {ligne.nbr_voiture}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumberWithSpaces(ligne.prix_unitaire)} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumberWithSpaces(ligne.montant_ligne)} FCFA
                      </TableCell>
                    </TableRow>
                  ))}

                  {facture.accessoires && facture.accessoires.length > 0 &&
                    facture.accessoires.map((accessoire, accIndex) => (
                      <TableRow key={`accessoire-${accessoire.id}`}>
                        <TableCell>
                          {lignes.length + accIndex + 1}
                        </TableCell>
                        <TableCell>
                          {accessoire.image ? (
                            <Image
                              src={accessoire.image}
                              alt={accessoire.nom}
                              width={100}
                              height={80}
                            />
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{accessoire.nom}</p>
                            {accessoire.description && (
                              <p className="text-xs text-gray-600 max-w-60 text-wrap">
                                {accessoire.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {accessoire.quantity || 1}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumberWithSpaces(accessoire.prix)} FCFA
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumberWithSpaces(
                            accessoire.prix * (accessoire.quantity || 1)
                          )}{" "}
                          FCFA
                        </TableCell>
                      </TableRow>
                    ))}

                  {facture.accessoire_nom &&
                    (!facture.accessoires ||
                      facture.accessoires.length === 0) && (
                      <TableRow>
                        <TableCell>{lignes.length + 1}</TableCell>
                        <TableCell>
                          {(() => {
                            const imagePath = getAccessoireImage(
                              facture.accessoire_nom,
                              accessoires
                            );
                            return imagePath ? (
                              <Image
                                src={imagePath}
                                alt={facture.accessoire_nom}
                                width={100}
                                height={80}
                              />
                            ) : (
                              "N/A"
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {facture.accessoire_nom}
                            </p>
                            {facture.accessoire_description && (
                              <p className="text-xs text-gray-600">
                                {facture.accessoire_description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {facture.accessoire_nbr || 1}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumberWithSpaces(
                            (facture.accessoire_prix || 0) /
                              (facture.accessoire_nbr || 1)
                          )}{" "}
                          FCFA
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumberWithSpaces(
                            facture.accessoire_prix || 0
                          )}{" "}
                          FCFA
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total HT
                    </TableCell>
                    <TableCell colSpan={2} className="text-right font-semibold">
                      {formatNumberWithSpaces(facture.total_ht)} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">
                      Remise ({facture.remise}%)
                    </TableCell>
                    <TableCell colSpan={2} className="text-right">
                      {formatNumberWithSpaces(facture.montant_remise)} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">
                      Montant Net HT
                    </TableCell>
                    <TableCell colSpan={2} className="text-right">
                      {formatNumberWithSpaces(facture.montant_net_ht)} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">
                      TVA ({facture.tva}%)
                    </TableCell>
                    <TableCell colSpan={2} className="text-right">
                      {formatNumberWithSpaces(facture.montant_tva)} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Total TTC
                    </TableCell>
                    <TableCell colSpan={2} className="text-right font-bold">
                      {formatNumberWithSpaces(facture.total_ttc)} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">
                      Avance Payée
                    </TableCell>
                    <TableCell colSpan={2} className="text-right">
                      {formatNumberWithSpaces(facture.avance_payee)} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Reste à Payer
                    </TableCell>
                    <TableCell colSpan={2} className="text-right font-semibold">
                      {formatNumberWithSpaces(facture.reste_payer)} FCFA
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

