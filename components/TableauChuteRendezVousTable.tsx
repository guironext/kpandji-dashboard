"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableauChuteDetailDialog } from '@/components/TableauChuteDetailDialog';
import { TableauChuteReporterDialog } from '@/components/TableauChuteReporterDialog';
import { Eye, CalendarClock, CalendarRange, Phone, Mail, ClipboardList, MessageSquare, AlertTriangle } from 'lucide-react';

interface TableauChuteRendezVousData {
  id: string;
  mois_chute: string;
  modeles_discutes: unknown;
  createdAt: string;
  rapportRendezVous: {
    id: string;
    nom_prenom_client: string;
    telephone_client: string;
    email_client?: string;
    profession_societe?: string;
    type_client: string;
    motivations_achat?: string;
    points_positifs?: string;
    objections_freins?: string;
    degre_interet?: string;
    decision_attendue?: string;
    commentaire_global?: string;
    client?: {
      id: string;
      nom: string;
      email?: string;
      telephone: string;
      entreprise?: string;
      localisation?: string;
    };
    clientEntreprise?: {
      id: string;
      nom_entreprise: string;
      email?: string;
      telephone: string;
      localisation?: string;
    };
    rendezVous: {
      id: string;
      date: string;
      statut: string;
    };
  };
}

interface TableauChuteRendezVousTableProps {
  data: TableauChuteRendezVousData[];
  onRefresh?: () => void;
  showReporterButton?: boolean;
}

export function TableauChuteRendezVousTable({ data, onRefresh, showReporterButton = true }: TableauChuteRendezVousTableProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [reporterOpen, setReporterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TableauChuteRendezVousData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30 px-6 py-5">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span>Détails des Rendez-vous en Chute</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-medium py-4 text-muted-foreground">Mois de Chute</TableHead>
                  <TableHead className="font-medium py-4 text-muted-foreground">Informations Client</TableHead>
                  <TableHead className="font-medium py-4 text-muted-foreground">Décision Attendue</TableHead>
                  <TableHead className="font-medium py-4 text-muted-foreground">Objections</TableHead>
                  <TableHead className="font-medium py-4 text-muted-foreground">Commentaire</TableHead>
                  <TableHead className="font-medium py-4 text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={`transition-colors hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/20" : ""}`}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        <span className="font-medium text-foreground">{item.mois_chute}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <div className="font-medium text-foreground">
                          {item.rapportRendezVous.nom_prenom_client}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.rapportRendezVous.telephone_client}</span>
                        </div>
                        {item.rapportRendezVous.email_client && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[200px]">{item.rapportRendezVous.email_client}</span>
                          </div>
                        )}
                        {item.rapportRendezVous.profession_societe && (
                          <div className="text-xs text-muted-foreground italic">
                            {item.rapportRendezVous.profession_societe}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm">
                        {item.rapportRendezVous.decision_attendue ? (
                          <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-normal">
                            <CalendarClock className="h-3 w-3 mr-1 inline" />
                            {item.rapportRendezVous.decision_attendue}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">Non spécifiée</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 max-w-[220px]">
                      <div className="text-sm">
                        {item.rapportRendezVous.objections_freins ? (
                          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <div
                                className="text-foreground/90 text-wrap line-clamp-2"
                                title={item.rapportRendezVous.objections_freins}
                              >
                                {item.rapportRendezVous.objections_freins.length > 100
                                  ? `${item.rapportRendezVous.objections_freins.substring(0, 100)}...`
                                  : item.rapportRendezVous.objections_freins}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Aucune objection</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 max-w-[220px]">
                      <div className="text-sm">
                        {item.rapportRendezVous.commentaire_global ? (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <div
                                className="text-foreground/90 text-wrap line-clamp-2"
                                title={item.rapportRendezVous.commentaire_global}
                              >
                                {item.rapportRendezVous.commentaire_global.length > 100
                                  ? `${item.rapportRendezVous.commentaire_global.substring(0, 100)}...`
                                  : item.rapportRendezVous.commentaire_global}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Aucun commentaire</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col items-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setDetailOpen(true);
                          }}
                          className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                          Détails
                        </Button>
                        {showReporterButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedId(item.id);
                              setReporterOpen(true);
                            }}
                            className="h-8 gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            title="Reporter"
                          >
                            <CalendarRange className="h-4 w-4" />
                            Reporter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TableauChuteDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedItem}
      />

      {showReporterButton && (
        <TableauChuteReporterDialog
          open={reporterOpen}
          onOpenChange={setReporterOpen}
          tableauChuteId={selectedId}
          onUpdate={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
