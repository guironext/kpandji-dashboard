"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableauChuteDetailDialog } from '@/components/TableauChuteDetailDialog';
import { TableauChuteReporterDialog } from '@/components/TableauChuteReporterDialog';

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
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span>Détails des Rendez-vous en Chute</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 py-4">Mois de Chute</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Informations Client</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Décision Attendue</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Objections</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Commentaire</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-slate-800">{item.mois_chute}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-800">
                          {item.rapportRendezVous.nom_prenom_client}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{item.rapportRendezVous.telephone_client}</span>
                        </div>
                        {item.rapportRendezVous.email_client && (
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{item.rapportRendezVous.email_client}</span>
                          </div>
                        )}
                        {item.rapportRendezVous.profession_societe && (
                          <div className="text-sm text-slate-500 italic">
                            {item.rapportRendezVous.profession_societe}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm">
                        {item.rapportRendezVous.decision_attendue ? (
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                            <svg className="h-3 w-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.rapportRendezVous.decision_attendue}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 italic">Non spécifiée</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 max-w-xs">
                      <div className="text-sm">
                        {item.rapportRendezVous.objections_freins ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <div className="text-red-800 text-wrap max-w-md" title={item.rapportRendezVous.objections_freins}>
                                {item.rapportRendezVous.objections_freins.length > 100 
                                  ? `${item.rapportRendezVous.objections_freins.substring(0, 100)}...` 
                                  : item.rapportRendezVous.objections_freins}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucune objection</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 max-w-xs">
                      <div className="text-sm text-wrap max-w-md">
                        {item.rapportRendezVous.commentaire_global ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <div className="text-blue-800" title={item.rapportRendezVous.commentaire_global}>
                                {item.rapportRendezVous.commentaire_global.length > 100 
                                  ? `${item.rapportRendezVous.commentaire_global.substring(0, 100)}...` 
                                  : item.rapportRendezVous.commentaire_global}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucun commentaire</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setDetailOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full flex items-center gap-2"
                          title="Voir détails"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Détails
                        </button>
                       
                        {showReporterButton && (
                          <button
                            onClick={() => {
                              setSelectedId(item.id);
                              setReporterOpen(true);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors w-full flex items-center gap-2"
                            title="Reporter"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Reporter
                          </button>
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
