import React from 'react'
import { prisma } from '@/lib/prisma'
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
  Tag
} from 'lucide-react'

async function getTableauChuteRendezVous() {
  const data = await prisma.tableau_chute_rendez_vous.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      rapportRendezVous: {
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
  })

  // Group by user
  const groupedByUser = data.reduce((acc, item) => {
    const userId = item.user.id
    if (!acc[userId]) {
      acc[userId] = {
        user: item.user,
        records: [],
      }
    }
    acc[userId].records.push(item)
    return acc
  }, {} as Record<string, { user: typeof data[0]['user']; records: typeof data }>)

  return Object.values(groupedByUser)
}

export default async function TableauChutePage() {
  const groupedData = await getTableauChuteRendezVous()
  const totalRecords = groupedData.reduce((sum, group) => sum + group.records.length, 0)
  const totalUsers = groupedData.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-xl">
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Tableau de Chute des Rendez-vous
              </h1>
              <p className="text-muted-foreground mt-1">
                Analyse complète des opportunités perdues et rendez-vous non convertis
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Rendez-vous Perdus</p>
                    <p className="text-3xl font-bold text-destructive mt-2">{totalRecords}</p>
                    <p className="text-xs text-muted-foreground mt-1">Opportunités à récupérer</p>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateurs Concernés</p>
                    <p className="text-3xl font-bold text-primary mt-2">{totalUsers}</p>
                    <p className="text-xs text-muted-foreground mt-1">Membres de l&apos;équipe</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Moyenne par Utilisateur</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {totalUsers > 0 ? Math.round((totalRecords / totalUsers) * 10) / 10 : 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Rendez-vous perdus</p>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-full">
                    <TrendingDown className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Main Content */}
        {groupedData.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-6 bg-muted/50 rounded-full mb-6">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Aucun rendez-vous perdu</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Excellent travail ! Il n&apos;y a actuellement aucun rendez-vous dans le tableau de chute.
                Continuez vos efforts pour maintenir ce résultat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedData.map((group) => (
              <Card key={group.user.id} className="overflow-hidden border-l-4 border-l-destructive shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-md">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {group.user.firstName} {group.user.lastName}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                          <Mail className="h-3 w-3" />
                          <span>{group.user.email}</span>
                          <Badge variant="secondary" className="ml-2">
                            {group.user.role}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="destructive" className="text-lg py-2 px-4 shadow-md">
                        {group.records.length} rendez-vous perdu{group.records.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-6">
                    {group.records.map((record, index) => (
                      <div key={record.id}>
                        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column */}
                              <div className="space-y-4">
                                {/* Date & Time */}
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Date & Heure du Rendez-vous
                                    </p>
                                    <p className="font-bold text-lg mt-1">
                                      {new Date(record.rapportRendezVous.date_rendez_vous).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-sm font-medium text-muted-foreground">
                                        {record.rapportRendezVous.heure_rendez_vous}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Mois de chute */}
                                <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Mois de Chute
                                    </p>
                                    <Badge variant="destructive" className="mt-1 font-bold">
                                      {record.mois_chute}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3">
                                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Lieu du Rendez-vous
                                    </p>
                                    <p className="text-sm font-medium mt-1">
                                      {record.rapportRendezVous.lieu_rendez_vous}
                                    </p>
                                  </div>
                                </div>

                                {/* Commercial Advisor */}
                                <div className="flex items-start gap-3">
                                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Conseiller Commercial
                                    </p>
                                    <p className="text-sm font-bold mt-1">
                                      {record.rapportRendezVous.conseiller_commercial}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div className="space-y-4">
                                {/* Client Info */}
                                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                    Informations Client
                                  </p>
                                  <p className="font-bold text-lg mb-3">
                                    {record.rapportRendezVous.nom_prenom_client}
                                  </p>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {record.rapportRendezVous.telephone_client}
                                      </span>
                                    </div>
                                    {record.rapportRendezVous.email_client && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          {record.rapportRendezVous.email_client}
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      <Badge variant="outline">
                                        {record.rapportRendezVous.type_client}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Interest & Decision */}
                                {(record.rapportRendezVous.degre_interet || record.rapportRendezVous.decision_attendue) && (
                                  <div className="space-y-3">
                                    {record.rapportRendezVous.degre_interet && (
                                      <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                          Degré d&apos;Intérêt
                                        </p>
                                        <p className="text-sm font-medium mt-1">
                                          {record.rapportRendezVous.degre_interet}
                                        </p>
                                      </div>
                                    )}

                                    {record.rapportRendezVous.decision_attendue && (
                                      <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                          Décision Attendue
                                        </p>
                                        <p className="text-sm font-medium mt-1">
                                          {record.rapportRendezVous.decision_attendue}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Models Discussed */}
                                {record.modeles_discutes && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Tag className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Modèles Discutés
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {Array.isArray(record.modeles_discutes) ? (
                                        record.modeles_discutes.map((modele, i: number) => (
                                          <Badge key={i} variant="secondary" className="text-xs font-semibold">
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
                                  <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Commentaire Global
                                      </p>
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                      {record.rapportRendezVous.commentaire_global}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Footer - Full Width */}
                              <div className="lg:col-span-2 pt-4 border-t">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                        {index < group.records.length - 1 && <Separator className="my-4" />}
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