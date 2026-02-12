import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Building2,
  FileText, 
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  Tag,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Receipt
} from 'lucide-react'
import { getClientsAndEntreprisesWithFactures } from '@/lib/actions/facture'
import { formatNumberWithSpaces } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type FactureData = {
  id: string;
  date_facture: Date;
  date_echeance: Date;
  total_ttc: number;
  reste_payer: number;
  avance_payee: number;
  nbr_voiture_commande: number;
  lignes: Array<{
    id: string;
    voitureModelId: string;
    couleur: string;
    nbr_voiture: number;
    prix_unitaire: number;
    montant_ligne: number;
    transmission?: string | null;
    motorisation?: string | null;
    voitureModel: {
      id: string;
      model: string;
      image?: string | null;
      description?: string | null;
    };
  }>;
  accessoires: Array<{
    id: string;
    nom: string;
    description?: string | null;
    prix: number;
    quantity: number;
    image?: string | null;
  }>;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  paiements: Array<{
    avance_payee: number;
    date_paiement: Date | null;
  }>;
};


export default async function ClientAvecCommandePage() {
  const result = await getClientsAndEntreprisesWithFactures()
  const clients = result.success ? (result.data || []) : []

  const totalClients = clients.length
  const totalFactures = clients.reduce((sum, client) => sum + client.factures.length, 0)
  const totalMontant = clients.reduce((sum, client) => 
    sum + client.factures.reduce((factSum, fact) => factSum + fact.total_ttc, 0), 0
  )
  const totalRestePayer = clients.reduce((sum, client) => 
    sum + client.factures.reduce((factSum, fact) => factSum + fact.reste_payer, 0), 0
  )
  const totalPaye = totalMontant - totalRestePayer
  const paymentRate = totalMontant > 0 ? Math.round((totalPaye / totalMontant) * 100) : 0

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CLIENT':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg'
      case 'PROSPECT':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg'
      case 'FAVORABLE':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg'
      case 'A_SUIVRE':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg'
      case 'ABANDONNE':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg'
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg'
    }
  }

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      {/* Enhanced Header */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform">
                <Receipt className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                  Clients ayant faient une commande
                </h1>
                <p className="text-slate-600 text-lg font-medium">
                  Liste complète des clients et entreprises avec factures actives
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">
                {totalClients} {totalClients > 1 ? 'Clients' : 'Client'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-cyan-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Total Clients</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-1">{totalClients}</div>
            <p className="text-xs text-white/80 font-medium">
              Clients et entreprises
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Total Factures</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-1">{totalFactures}</div>
            <p className="text-xs text-white/80 font-medium">
              Factures actives
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-teal-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 group-hover:from-emerald-600/30 group-hover:to-teal-600/30 transition-all duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Montant Total</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-white mb-1">{formatNumberWithSpaces(totalMontant)}</div>
            <p className="text-xs text-white/80 font-medium">
              FCFA TTC total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-red-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 group-hover:from-orange-600/30 group-hover:to-red-600/30 transition-all duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">Reste à Payer</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-white mb-1">{formatNumberWithSpaces(totalRestePayer)}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="text-xs text-white/80 font-medium">
                {paymentRate}% payé
              </div>
              <TrendingUp className="h-3 w-3 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Overview Card */}
      <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-white to-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Vue d&apos;ensemble des paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Taux de paiement global</span>
                <span className="text-sm font-bold text-blue-600">{paymentRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${paymentRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">{formatNumberWithSpaces(totalPaye)}</div>
                <div className="text-xs text-green-600 font-medium">Total Payé</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-700">{formatNumberWithSpaces(totalRestePayer)}</div>
                <div className="text-xs text-red-600 font-medium">Reste à Payer</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{formatNumberWithSpaces(totalMontant)}</div>
                <div className="text-xs text-blue-600 font-medium">Montant Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-6">
        {clients.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun client trouvé</h3>
              <p className="text-gray-500">Aucun client avec facture active pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => {
            const clientTotal = client.factures.reduce((sum, fact) => sum + fact.total_ttc, 0)
            const clientPaye = client.factures.reduce((sum, fact) => sum + fact.avance_payee, 0)
            const clientPaymentRate = clientTotal > 0 ? Math.round((clientPaye / clientTotal) * 100) : 0

            return (
              <Card key={client.id} className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
                {/* Client Header */}
                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                        {client.type === 'entreprise' ? (
                          <Building2 className="h-8 w-8 text-white" />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <CardTitle className="text-2xl font-bold text-gray-900">
                            {client.nom}
                          </CardTitle>
                          {client.sigle && (
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-white/80">
                              {client.sigle}
                            </Badge>
                          )}
                          <Badge className={getStatusBadgeColor(client.status_client)}>
                            {client.status_client}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            {client.factures.length} {client.factures.length > 1 ? 'factures' : 'facture'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          {client.telephone && (
                            <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                              <Phone className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{client.telephone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="truncate font-medium">{client.email}</span>
                            </div>
                          )}
                          {client.localisation && (
                            <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="truncate font-medium">{client.localisation}</span>
                            </div>
                          )}
                          {client.commercial && (
                            <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{client.commercial}</span>
                            </div>
                          )}
                        </div>
                        {(client.secteur_activite || (client.type === 'client' && client.entreprise)) && (
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            {client.secteur_activite && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-lg">
                                <Briefcase className="h-4 w-4 text-blue-600" />
                                <span>{client.secteur_activite}</span>
                              </div>
                            )}
                            {client.type === 'client' && client.entreprise && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-lg">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span>{client.entreprise}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1 font-medium">Total Client</div>
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {formatNumberWithSpaces(clientTotal)} FCFA
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Paiement</div>
                        <div className="text-lg font-semibold text-green-600">
                          {clientPaymentRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {client.factures.map((facture) => {
                      const totalFacture = facture.total_ttc
                      const restePayer = facture.reste_payer
                      const avancePayee = facture.avance_payee
                      const paymentPercentage = totalFacture > 0 
                        ? Math.round((avancePayee / totalFacture) * 100) 
                        : 0
                      const isOverdue = new Date(facture.date_echeance) < new Date() && restePayer > 0

                      return (
                        <Card key={facture.id} className={`border-l-4 ${isOverdue ? 'border-l-red-500 bg-red-50/30' : 'border-l-blue-500'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                                    <Receipt className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                                      Facture #{facture.id.slice(0, 8).toUpperCase()}
                                    </CardTitle>
                                    {isOverdue && (
                                      <Badge className="bg-red-500 text-white border-0 mt-1">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Échéance dépassée
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <div className="text-xs text-gray-500">Date</div>
                                      <div className="font-medium">{formatShortDate(facture.date_facture)}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Calendar className="h-4 w-4 text-orange-600" />
                                    <div>
                                      <div className="text-xs text-gray-500">Échéance</div>
                                      <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                        {formatShortDate(facture.date_echeance)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Package className="h-4 w-4 text-purple-600" />
                                    <div>
                                      <div className="text-xs text-gray-500">Véhicules</div>
                                      <div className="font-medium">{facture.nbr_voiture_commande}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                    <User className="h-4 w-4 text-green-600" />
                                    <div>
                                      <div className="text-xs text-gray-500">Commercial</div>
                                      <div className="font-medium truncate">{facture.user.firstName} {facture.user.lastName}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-md">
                                  <div className="text-xs text-gray-600 mb-1 font-medium">Montant Total</div>
                                  <div className="text-2xl font-bold text-gray-900 mb-3">
                                    {formatNumberWithSpaces(totalFacture)}
                                  </div>
                                  <div className="text-xs text-gray-500">FCFA</div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {/* Payment Progress */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-blue-600" />
                                  État du paiement
                                </span>
                                <Badge className={`${paymentPercentage === 100 ? 'bg-green-500' : paymentPercentage > 0 ? 'bg-blue-500' : 'bg-gray-500'} text-white border-0`}>
                                  {paymentPercentage === 100 ? (
                                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Payé</>
                                  ) : (
                                    `${paymentPercentage}%`
                                  )}
                                </Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner mb-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                                    paymentPercentage === 100 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                      : paymentPercentage > 0
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                      : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${paymentPercentage}%` }}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                                  <div className="text-xs text-green-600 font-medium mb-1">Payé</div>
                                  <div className="text-sm font-bold text-green-700">
                                    {formatNumberWithSpaces(avancePayee)} FCFA
                                  </div>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                                  <div className="text-xs text-red-600 font-medium mb-1">Reste</div>
                                  <div className="text-sm font-bold text-red-700">
                                    {formatNumberWithSpaces(restePayer)} FCFA
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Facture Lines */}
                            {facture.lignes.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                  <Package className="h-5 w-5 text-blue-600" />
                                  Lignes de facture
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(facture.lignes as FactureData['lignes']).map((ligne) => (
                                    <div
                                      key={ligne.id}
                                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                                    >
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900 mb-2">
                                          {ligne.voitureModel.model}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                          <Badge variant="outline" className="text-xs">
                                            {ligne.couleur}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            Qté: {ligne.nbr_voiture}
                                          </Badge>
                                          {ligne.transmission && (
                                            <Badge variant="outline" className="text-xs">
                                              {ligne.transmission}
                                            </Badge>
                                          )}
                                          {ligne.motorisation && (
                                            <Badge variant="outline" className="text-xs">
                                              {ligne.motorisation}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="font-bold text-gray-900 text-lg">
                                          {formatNumberWithSpaces(ligne.montant_ligne)} FCFA
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatNumberWithSpaces(ligne.prix_unitaire)}/unité
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Accessories */}
                            {facture.accessoires.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                  <Tag className="h-5 w-5 text-purple-600" />
                                  Accessoires
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(facture.accessoires as FactureData['accessoires']).map((accessoire) => (
                                    <div
                                      key={accessoire.id}
                                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50/30 rounded-xl border border-purple-200 hover:shadow-md transition-all"
                                    >
                                      <div>
                                        <div className="font-semibold text-gray-900 mb-1">
                                          {accessoire.nom}
                                        </div>
                                        {accessoire.description && (
                                          <div className="text-xs text-gray-600 mb-2">
                                            {accessoire.description}
                                          </div>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          Qté: {accessoire.quantity}
                                        </Badge>
                                      </div>
                                      <div className="text-right ml-4 font-bold text-gray-900">
                                        {formatNumberWithSpaces(accessoire.prix * accessoire.quantity)} FCFA
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Payments */}
                            {facture.paiements.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                  <CreditCard className="h-5 w-5 text-green-600" />
                                  Historique des paiements
                                </h4>
                                <div className="space-y-2">
                                  {facture.paiements.map((paiement, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            Paiement #{index + 1}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {paiement.date_paiement
                                              ? formatShortDate(paiement.date_paiement)
                                              : 'Date non spécifiée'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-green-700 text-lg">
                                          {formatNumberWithSpaces(paiement.avance_payee)} FCFA
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
