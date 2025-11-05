"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
// import { useRouter } from "next/navigation";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFacturesByUser, deleteFacture } from "@/lib/actions/facture";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { generateNextNumero, getBonDeCommandeByFactureId } from "@/lib/actions/bondecommande";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";


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
  clientId?: string | null;
  clientEntrepriseId?: string | null;
  client: {
    nom: string;
    telephone?: string;
    entreprise?: string;
    localisation?: string;
    commercial?: string;
    email?: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
    telephone?: string;
    localisation?: string;
    commercial?: string;
    email?: string;
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

function formatDateDDMMYYYY(value: string | number | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

// Function to get accessoire image by name
function getAccessoireImage(
  accessoireNom: string | null | undefined,
  accessoiresList: Array<{ id: string; nom: string; image?: string | null }>
) {
  if (!accessoireNom) return null;
  
  // Extract the first accessoire name from "Name (x2)" or "Name1, Name2" format
  const name = accessoireNom.split(",")[0]?.split(" (x")[0]?.trim();
  
  const matched = accessoiresList.find((acc) => acc.nom === name);
  
  return matched?.image || null;
}

export default function Page() {
  // const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;
  const [factures, setFactures] = useState<Facture[]>([]);
  const [accessoires, setAccessoires] = useState<
    Array<{ id: string; nom: string; image?: string | null }>
  >([]);
  const [numero, setNumero] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!clerkId) return;
      
      console.log("=== FETCHING DATA ===");
      const [facturesResult, accessoiresResult] = await Promise.all([
        getFacturesByUser(clerkId),
        getAllAccessoires(),
      ]);
      
      console.log("Factures result:", facturesResult);
      console.log("Accessoires result:", accessoiresResult);
      
      if (facturesResult.success && facturesResult.data) {
        setFactures(facturesResult.data as Facture[]);
      }
      if (accessoiresResult.success && accessoiresResult.data) {
        console.log("Raw accessoires data:", JSON.stringify(accessoiresResult.data, null, 2));
        console.log("Accessoires count:", accessoiresResult.data.length);
        accessoiresResult.data.forEach((acc, index) => {
          console.log(`Accessoire ${index + 1}:`, {
            id: acc.id,
            nom: acc.nom,
            image: acc.image,
            hasImage: !!acc.image
          });
        });
        setAccessoires(accessoiresResult.data);
      } else {
        console.error("Failed to fetch accessoires:", accessoiresResult);
      }
    };
    fetchData();
  }, [clerkId]);

  // Use factures directly:
  const totalPages = Math.ceil(factures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = factures.slice(startIndex, endIndex);

  // Fetch numero when current facture changes
  useEffect(() => {
    const fetchNumero = async () => {
      if (factures.length === 0) {
        setNumero("");
        return;
      }
      
      const currentFacture = factures.slice(startIndex, endIndex)[0];
      if (!currentFacture) {
        setNumero("");
        return;
      }

      const result = await getBonDeCommandeByFactureId(currentFacture.id);
      if (result.success && result.data) {
        setNumero(result.data.numero);
      } else {
        setNumero("");
      }
    };

    fetchNumero();
  }, [factures, currentPage, startIndex, endIndex]);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerateNumero = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture) return;

    const result = await generateNextNumero(currentFacture.id);
    if (result.success && result.data) {
      setNumero(result.data.numero);
      toast.success(`Numéro généré: ${result.data.numero}`);
    } else {
      toast.error("Erreur lors de la génération du numéro");
    }
  };

  const handleDelete = async () => {
    const currentFacture = currentData[0];
    if (!currentFacture || !clerkId) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer ce bon de commande (${currentFacture.id.slice(
          -7
        )}) ?`
      )
    ) {
      const result = await deleteFacture(currentFacture.id);
      if (result.success) {
        toast.success("Bon de commande supprimé avec succès");
        // Refresh the list
        const updatedFactures = await getFacturesByUser(clerkId);
        if (updatedFactures.success && updatedFactures.data) {
          setFactures(updatedFactures.data as Facture[]);
          // Adjust current page if needed
          if (
            currentPage > Math.ceil(updatedFactures.data.length / itemsPerPage)
          ) {
            setCurrentPage(
              Math.max(1, Math.ceil(updatedFactures.data.length / itemsPerPage))
            );
          }
        }
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
          .bg-gradient-to-r,
          .bg-gradient-to-br,
          .bg-black,
          .bg-white,
          .bg-amber-50,
          .bg-amber-100,
          .bg-amber-400,
          .bg-amber-500,
          .bg-amber-600,
          .bg-orange-50,
          .bg-orange-100,
          .bg-orange-200,
          .bg-orange-400,
          .bg-orange-500,
          .bg-gray-900,
          .bg-blue-50,
          .bg-blue-100,
          .text-amber-400,
          .text-orange-400,
          .text-orange-600,
          .text-black,
          .text-blue-800,
          .border-amber-500,
          .border-amber-600,
          .border-orange-600,
          .border-black,
          .border-blue-300 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `,
        }}
      />

      <div className="flex flex-col w-full bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex w-full justify-between mb-6 print-hide">
            <div className="flex gap-4">
              
              <Button
                onClick={handleDelete}
                disabled={currentData.length === 0}
                className="bg-black hover:bg-gray-800 text-amber-400 font-bold border-2 border-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SUPPRIMER
              </Button>
              <Button
                onClick={handleGenerateNumero}
                disabled={!!numero}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                GÉNÉRER NUMÉRO
              </Button>
            </div>
          </div>

          <div id="printable-area">
            <div className="flex w-full justify-between border-b-2 border-orange-800 pb-4 mb-3">
              <div>
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={60}
                  height={30}
                  priority
                />
              </div>
              <div className="flex flex-col justify-center -mb-10">
                <h1 className="text-2xl font-bold text-orange-900">
                  KPANDJI AUTOMOBILES
                </h1>
                <p className="text-sm text-black font-thin">
                  Constructeur et Assembleur Automobile
                </p>
              </div>
            </div>

           <div className="flex justify-between items-center">

              <div></div>
           <div className="flex justify-center ">
              <h1 className="text-xl font-bold text-orange-800 border-2 border-black px-4 py-2 rounded-lg shadow-lg">
                BON DE COMMANDE
              </h1>
            </div>

            <div className="flex justify-end  ">
              <div className="flex gap-2 items-center">
              <h1 className="text-xl font-bold text-orange-800 ">
                NUMERO:
              </h1>
              <h1 className="text-lg font-bold text-black ">
                {numero || "______"}
              </h1>
              </div>
            </div>


           </div>

            {currentData.map((facture: Facture) => (
              <div key={facture.id}>
                <div className="w-full flex items-center justify-between">


                  {/* Company Information Section */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 ">
                  <h2 className="text-sm font-bold text-blue-800 mb-3">1️⃣ Informations de l&apos;entreprise (fournisseur)</h2>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex gap-2">
                      <p className="font-semibold">Entreprise :</p>
                      <p>KPANDJI AUTOMOBILES</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Adresse :</p>
                      <p>Cocody, Riviera Palmerais, Abidjan, Côte d&apos;Ivoire</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Téléphone :</p>
                      <p>+225 01 01 04 77 03</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Email :</p>
                      <p>info@kpandji.com</p>
                    </div>
                    
                  </div>
                </div>

                {/* Client Information Section */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 ">
                  <h2 className="text-sm font-bold text-orange-800 mb-3">2️⃣ Informations du client</h2>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex gap-2">
                      <p className="font-semibold">Nom du client / Entreprise :</p>
                      <p>{facture.client?.nom || facture.clientEntreprise?.nom_entreprise}</p>
                    </div>
                    {facture.client?.entreprise && (
                      <div className="flex gap-2">
                        <p className="font-semibold">Entreprise :</p>
                        <p>{facture.client.entreprise}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <p className="font-semibold">Téléphone :</p>
                      <p>{facture.client?.telephone || facture.clientEntreprise?.telephone}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Email :</p>
                      <p>{facture.client?.email || facture.clientEntreprise?.email || "__________________________"}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Adresse :</p>
                      <p>{facture.client?.localisation || facture.clientEntreprise?.localisation || "_________________________________________"}</p>
                    </div>
                  </div>
                </div>



                </div>

                {/* Order Details Section */}
                <div className="mb-2">
                  <h2 className="text-sm font-bold text-gray-800 mb-1">3️⃣ Détails du bon de commande</h2>
                  <Table className="rounded-lg overflow-hidden text-xs">
                    <TableHeader>
                      <TableRow className="bg-blue-100 border-b-2 border-blue-600">
                        <TableHead className="text-black font-bold text-center">N°</TableHead>
                        <TableHead className="text-black font-bold">Description du produit / service</TableHead>
                        <TableHead className="text-black font-bold text-center">Quantité</TableHead>
                        <TableHead className="text-black font-bold text-right">Prix Unitaire (FCFA)</TableHead>
                        <TableHead className="text-right text-black font-bold">Total (FCFA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((factureItem) => {
                        const lignes =
                          factureItem.lignes && factureItem.lignes.length > 0
                            ? factureItem.lignes
                            : [
                                {
                                  id: "1",
                                  voitureModelId: "",
                                  couleur: "",
                                  nbr_voiture: factureItem.nbr_voiture_commande,
                                  prix_unitaire: factureItem.prix_unitaire,
                                  montant_ligne: factureItem.montant_ht,
                                  transmission: "",
                                  motorisation: "",
                                  voitureModel:
                                    factureItem.voiture?.voitureModel || null,
                                },
                              ];

                        return lignes.map((ligne, index) => (
                          <TableRow
                            key={`${factureItem.id}-${ligne.id}`}
                            className={
                              index % 2 === 0
                                ? "bg-white border-b border-orange-200"
                                : "bg-orange-50 hover:bg-orange-100 border-b border-orange-200"
                            }
                          >
                            <TableCell className="text-black font-semibold text-center">
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-black">
                              <div className="flex gap-3">
                                {ligne.voitureModel?.image ? (
                                  <Image
                                    src={ligne.voitureModel.image}
                                    alt={ligne.voitureModel.model || "Vehicle"}
                                    width={80}
                                    height={60}
                                    className="object-contain rounded"
                                  />
                                ) : null}
                                <div className="flex flex-col gap-y-1">
                                  <p className="font-semibold">{ligne.voitureModel?.model || "N/A"}</p>
                                  {ligne.voitureModel?.description && (
                                    <p className="text-[8px] text-wrap max-w-5xl font-light text-black ">
                                      {ligne.voitureModel.description}
                                    </p>
                                  )}
                                  <div className="flex gap-y-2">

                                  {ligne.couleur && (
                                    <p className="text-[8px] font-normal text-blue-700 mr-2">
                                     <b className="font-semibold mr-1"> 
                                      Couleur: 
                                      </b> 
                                       {ligne.couleur} /
                                    </p>
                                  )}
                                  {ligne.transmission && (
                                    <p className="text-[8px] font-normal text-blue-700 mr-2">
                                      <b className="font-semibold mr-1"> 
                                      Transmission: 
                                      </b> 
                                       {ligne.transmission} /
                                    </p>
                                  )}
                                  {ligne.motorisation && (
                                    <p className="text-[8px] font-normal text-blue-700">
                                      <b className="font-semibold mr-1"> 
                                      Motorisation: 
                                      </b> 
                                       {ligne.motorisation} /
                                    </p>
                                  )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-black text-center text-sm">
                              {ligne.nbr_voiture}
                            </TableCell>
                            <TableCell className="text-right text-black text-sm">
                              {formatNumberWithSpaces(Number(ligne.prix_unitaire))}
                            </TableCell>
                            <TableCell className="text-black text-right text-sm">
                              {formatNumberWithSpaces(Number(ligne.montant_ligne))}
                            </TableCell>
                          </TableRow>
                        ));
                      })}

                      {/* Accessories */}
                      {facture.accessoires && facture.accessoires.length > 0 && facture.accessoires.map((accessoire, accIndex) => (
                        <TableRow key={`${facture.id}-accessoire-${accessoire.id}`} className="bg-white border-b border-orange-200">
                          <TableCell className="text-black font-semibold text-center">
                            {(facture.lignes ? facture.lignes.length : 0) + accIndex + 1}
                          </TableCell>
                          <TableCell className="text-black">
                            <div className="flex gap-3">
                              {accessoire.image ? (
                                <Image
                                  src={accessoire.image}
                                  alt={accessoire.nom || "Accessoire"}
                                  width={80}
                                  height={60}
                                  className="object-contain rounded"
                                />
                              ) : null}
                              <div className="flex flex-col gap-y-1">
                                <p className="font-semibold">{accessoire.nom}</p>
                                {accessoire.description && (
                                  <p className="text-xs font-light text-black text-wrap max-w-5xl">
                                    {accessoire.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-black text-center text-xs">
                            {accessoire.quantity || 1}
                          </TableCell>
                          <TableCell className="text-right text-black text-xs">
                            {formatNumberWithSpaces(accessoire.prix)}
                          </TableCell>
                          <TableCell className="text-black text-right text-xs">
                            {formatNumberWithSpaces(accessoire.prix * (accessoire.quantity || 1))}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Legacy single accessoire support */}
                      {facture.accessoire_nom && (!facture.accessoires || facture.accessoires.length === 0) && (
                        <TableRow className="bg-white border-b border-orange-200">
                          <TableCell className="text-black font-semibold text-center">
                            {facture.lignes ? facture.lignes.length + 1 : 1}
                          </TableCell>
                          <TableCell className="text-black">
                            <div className="flex gap-3">
                              {(() => {
                                const imagePath = getAccessoireImage(
                                  facture.accessoire_nom,
                                  accessoires as Array<{ id: string; nom: string; image?: string | null }>
                                );
                                
                                if (!imagePath) {
                                  return null;
                                }
                                
                                return (
                                  <Image
                                    src={imagePath}
                                    alt={facture.accessoire_nom || "Accessoire"}
                                    width={80}
                                    height={60}
                                    className="object-contain rounded"
                                  />
                                );
                              })()}
                              <div className="flex flex-col gap-y-1">
                                <p className="font-semibold">{facture.accessoire_nom}</p>
                                {facture.accessoire_description && (
                                  <p className="text-xs font-light text-back max-w-80">
                                    {facture.accessoire_description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-black text-center text-sm">
                            {facture.accessoire_nbr || 1}
                          </TableCell>
                          <TableCell className="text-right text-black text-sm">
                            {(
                              (facture.accessoire_prix || 0) /
                              (facture.accessoire_nbr || 1)
                            )
                              .toLocaleString()
                              .replace(/,/g, " ")}
                          </TableCell>
                          <TableCell className="text-black text-right text-sm">
                            {formatNumberWithSpaces((facture.accessoire_prix || 0))}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-blue-100">
                        <TableCell colSpan={4} className="text-right text-black font-semibold">
                          Sous-total :
                        </TableCell>
                        <TableCell className="text-right font-bold text-black">
                          {formatNumberWithSpaces(facture.total_ht)} FCFA
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-white">
                        <TableCell colSpan={4} className="text-right text-black">
                          TVA ({facture.tva}%) :
                        </TableCell>
                        <TableCell className="text-right text-black">
                          {formatNumberWithSpaces(facture.montant_tva)} FCFA
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-orange-100 border-t-2 border-gray-900">
                        <TableCell colSpan={4} className="text-right text-black font-bold text-sm">
                          Montant Total TTC :
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm text-black">
                          {formatNumberWithSpaces(facture.total_ttc) + " FCFA"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {/* Order Conditions Section */}
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-2">
                  <h2 className="text-sm font-bold text-gray-800 mb-3">4️⃣ Conditions de commande</h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex gap-2">
                      <p className="font-semibold">Date du bon de commande :</p>
                      <p>{formatDateDDMMYYYY(facture.date_facture)}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Date d&apos;échéance :</p>
                      <p>{formatDateDDMMYYYY(facture.date_echeance)}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Mode de paiement :</p>
                      <p>Virement bancaire / Chèque / Cache</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Délai de livraison :</p>
                      <p>4 mois</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Lieu de livraison :</p>
                      <p>KPANDJI Automobiles - Abidjan</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="font-semibold">Validité :</p>
                      <p>15 jours à compter de la date d&apos;émission</p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 border border-green-300 rounded">
                    <p className="text-xs"><span className="font-bold">Remarque :</span> Ce bon de commande vaut engagement d&apos;achat ferme une fois signé par le client.</p>
                  </div>
                </div>

                {/* Signatures Section */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="border-2 border-gray-400 rounded-lg p-2">
                    <h3 className="text-xs font-bold text-black mb-2">Direction</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center text-white">
                        <p className="text-xs font-semibold mb-1">Nom :</p>
                        <p className="text-white">{facture.user?.firstName} {facture.user?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Signature :</p>
                        
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Cachet :</p>
                        
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-gray-400 rounded-lg p-2">
                    <h3 className="text-xs font-bold text-black mb-2">Client</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <p className="text-xs font-semibold mb-1">Nom :</p>
                        <p className="text-black">{facture.client?.nom || facture.clientEntreprise?.nom_entreprise}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Signature :</p>
                        
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Cachet :</p>
                        
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center w-full justify-center bg-blue-50 rounded-b-lg text-xs border-t-2 border-orange-800 text-black p-4 mt-4">
                  <p className="font-thin text-center">
                    Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 /
                    Tel : 00225 01 01 04 77 03
                  </p>
                  <p className="font-thin text-center">
                    Email: info@kpandji.com RCCM : CI-ABJ-03-2022-B13-00710 / CC
                    :2213233 – ECOBANK : CI059 01046 121659429001 46
                  </p>
                  <p className="font-thin text-center">
                    kpandjiautomobiles@gmail.com / www.kpandji.com
                  </p>
                </div>
              </div>
            ))}

            {factures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600">Aucun bon de commande trouvé</p>
              </div>
            )}
          </div>

          {/* Bottom Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-6 print-hide">
            <Button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Page Précédente
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <div
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setCurrentPage(pageNum);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {pageNum}
                  </div>
                )
              )}
            </div>

            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
            >
              Page Suivante
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
