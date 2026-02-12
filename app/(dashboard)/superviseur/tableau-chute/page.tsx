import React from 'react'
import { prisma, executeWithRetry } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarDays, 
  User, 
  FileText, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Clock,
  MessageSquare,
  Tag,
  AlertCircle
} from 'lucide-react'

async function getTableauChuteRendezVous() {
  try {
    const data = await executeWithRetry(
      () => prisma.tableau_chute_rendez_vous.findMany({
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          RapportRendezVous: {
            select: {
              id: true,
              date_rendez_vous: true,
              heure_rendez_vous: true,
              lieu_rendez_vous: true,
              conseiller_commercial: true,
              nom_prenom_client: true,
              telephone_client: true,
              email_client: true,
              type_client: true,
              degre_interet: true,
              decision_attendue: true,
              commentaire_global: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      3, // max retries
      2000 // delay between retries (2 seconds)
    )

    // Remap User to user and RapportRendezVous to rapportRendezVous for frontend compatibility
    const remappedData = data.map(item => ({
      ...item,
      user: item.User,
      rapportRendezVous: item.RapportRendezVous,
    }))

    // Group by user
    const groupedByUser = remappedData.reduce((acc, item) => {
      const userId = item.user.id
      if (!acc[userId]) {
        acc[userId] = {
          user: item.user,
          records: [],
        }
      }
      acc[userId].records.push(item)
      return acc
    }, {} as Record<string, { user: typeof remappedData[0]['user']; records: typeof remappedData }>)

    return { success: true, data: Object.values(groupedByUser) }
  } catch (error) {
    console.error('Error fetching tableau chute rendez-vous:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch data',
      data: []
    }
  }
}

export const dynamic = 'force-dynamic'

export default async function TableauChutePage() {
  const result = await getTableauChuteRendezVous()
  const groupedData = result.success ? result.data : []
  const totalRecords = groupedData.reduce((sum, group) => sum + group.records.length, 0)
  const totalUsers = groupedData.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Error Message */}
        {!result.success && (
          <Card className="border-destructive/50 border-2 shadow-xl bg-gradient-to-br from-destructive/10 to-destructive/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-destructive/20 rounded-full shadow-lg">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-destructive mb-1">
                    Erreur de connexion à la base de données
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.error || 'Impossible de se connecter au serveur de base de données. Veuillez réessayer dans quelques instants.'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si le problème persiste, veuillez contacter l&apos;administrateur système.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Header Section */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-orange-600/10 to-amber-600/10 blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform">
                  <TrendingDown className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-orange-900 bg-clip-text text-transparent mb-2">
                    Tableau de Chute des Rendez-vous
                  </h1>
                  <p className="text-slate-600 text-lg font-medium">
                    Analyse complète des opportunités perdues et rendez-vous non convertis
                  </p>
                </div>
              </div>
              {result.success && totalRecords > 0 && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    {totalRecords} Perdu{totalRecords > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-red-500 to-rose-600 group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-rose-600/20 group-hover:from-red-600/30 group-hover:to-rose-600/30 transition-all duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Total Rendez-vous Perdus</p>
                  <p className="text-4xl font-bold text-white mb-1">{totalRecords}</p>
                  <p className="text-xs text-white/80 font-medium">Opportunités à récupérer</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 group-hover:from-blue-600/30 group-hover:to-indigo-600/30 transition-all duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Utilisateurs Concernés</p>
                  <p className="text-4xl font-bold text-white mb-1">{totalUsers}</p>
                  <p className="text-xs text-white/80 font-medium">Membres de l&apos;équipe</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-amber-600 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-amber-600/20 group-hover:from-orange-600/30 group-hover:to-amber-600/30 transition-all duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Moyenne par Utilisateur</p>
                  <p className="text-4xl font-bold text-white mb-1">
                    {totalUsers > 0 ? Math.round((totalRecords / totalUsers) * 10) / 10 : 0}
                  </p>
                  <p className="text-xs text-white/80 font-medium">Rendez-vous perdus</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {groupedData.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-24">
              <div className="p-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6 shadow-lg">
                <FileText className="h-20 w-20 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-slate-900">Aucun rendez-vous perdu</h3>
              <p className="text-slate-600 text-center max-w-md text-lg">
                Excellent travail ! Il n&apos;y a actuellement aucun rendez-vous dans le tableau de chute.
                Continuez vos efforts pour maintenir ce résultat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedData.map((group) => (
              <Card key={group.user.id} className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-slate-200/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-900">
                          {group.user.firstName} {group.user.lastName}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span className="font-medium">{group.user.email}</span>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
                            {group.user.role}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="destructive" className="text-lg py-3 px-6 shadow-lg font-bold">
                        {group.records.length} rendez-vous perdu{group.records.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                  <div className="space-y-6">
                    {group.records.map((record, index) => (
                      <div key={record.id}>
                        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50">
                          <CardContent className="p-6 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                              {/* Left Column */}
                              <div className="space-y-5">
                                {/* Date & Time */}
                                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
                                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                                    <CalendarDays className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                      Date & Heure du Rendez-vous
                                    </p>
                                    <p className="font-bold text-lg md:text-xl text-slate-900 mt-1">
                                      {new Date(record.rapportRendezVous.date_rendez_vous).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                      <p className="text-sm font-semibold text-slate-700">
                                        {record.rapportRendezVous.heure_rendez_vous}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Mois de chute */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 shadow-sm">
                                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-md">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                      Mois de Chute
                                    </p>
                                    <Badge variant="destructive" className="mt-1 font-bold text-sm py-1.5 px-3 shadow-md">
                                      {record.mois_chute}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="p-2 bg-slate-200 rounded-lg">
                                    <MapPin className="h-5 w-5 text-slate-700" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                      Lieu du Rendez-vous
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">
                                      {record.rapportRendezVous.lieu_rendez_vous}
                                    </p>
                                  </div>
                                </div>

                                {/* Commercial Advisor */}
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="p-2 bg-slate-200 rounded-lg">
                                    <Briefcase className="h-5 w-5 text-slate-700" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                      Conseiller Commercial
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                      {record.rapportRendezVous.conseiller_commercial}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div className="space-y-5">
                                {/* Client Info */}
                                <div className="p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-sm">
                                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
                                    Informations Client
                                  </p>
                                  <p className="font-bold text-xl md:text-2xl text-slate-900 mb-4">
                                    {record.rapportRendezVous.nom_prenom_client}
                                  </p>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm p-2 bg-white/60 rounded-lg">
                                      <Phone className="h-4 w-4 text-indigo-600" />
                                      <span className="font-semibold text-slate-900">
                                        {record.rapportRendezVous.telephone_client}
                                      </span>
                                    </div>
                                    {record.rapportRendezVous.email_client && (
                                      <div className="flex items-center gap-3 text-sm p-2 bg-white/60 rounded-lg">
                                        <Mail className="h-4 w-4 text-indigo-600" />
                                        <span className="font-semibold text-slate-900">
                                          {record.rapportRendezVous.email_client}
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      <Badge variant="outline" className="bg-white border-indigo-300 text-indigo-700 font-semibold">
                                        {record.rapportRendezVous.type_client}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Interest & Decision */}
                                {(record.rapportRendezVous.degre_interet || record.rapportRendezVous.decision_attendue) && (
                                  <div className="space-y-3">
                                    {record.rapportRendezVous.degre_interet && (
                                      <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                          Degré d&apos;Intérêt
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                          {record.rapportRendezVous.degre_interet}
                                        </p>
                                      </div>
                                    )}

                                    {record.rapportRendezVous.decision_attendue && (
                                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                          Décision Attendue
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                          {record.rapportRendezVous.decision_attendue}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Models Discussed */}
                                {record.modeles_discutes && (
                                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Tag className="h-4 w-4 text-slate-600" />
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Modèles Discutés
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {Array.isArray(record.modeles_discutes) ? (
                                        record.modeles_discutes.map((modele, i: number) => (
                                          <Badge key={i} variant="secondary" className="text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
                                            {typeof modele === 'string' 
                                              ? modele 
                                              : modele && typeof modele === 'object' && 'model' in modele 
                                                ? String(modele.model || 'N/A')
                                                : 'N/A'}
                                          </Badge>
                                        ))
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          {JSON.stringify(record.modeles_discutes)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Comment Section - Full Width */}
                              {record.rapportRendezVous.commentaire_global && (
                                <div className="lg:col-span-2">
                                  <div className="p-5 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl border-2 border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                      <MessageSquare className="h-5 w-5 text-slate-600" />
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Commentaire Global
                                      </p>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-800 font-medium">
                                      {record.rapportRendezVous.commentaire_global}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Footer - Full Width */}
                              <div className="lg:col-span-2 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    Enregistré le {new Date(record.createdAt).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })} à {new Date(record.createdAt).toLocaleTimeString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {index < group.records.length - 1 && (
                          <Separator className="my-6 bg-slate-200" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}