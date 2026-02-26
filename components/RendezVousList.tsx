"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Filter,
  SortAsc,
  SortDesc,
  PencilIcon,
  Car
} from 'lucide-react';
import { toast } from 'sonner';
import { RendezVous } from '@/lib/types/rendezvous';

interface RendezVousListProps {
  rendezVous: RendezVous[];
  onUpdate?: () => void;
  clerkUserId?: string;
}

const statusConfig = {
  EN_ATTENTE: { label: 'En attente', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
  CONFIRME: { label: 'Confirmé', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  DEPLACE: { label: 'Déplacé', variant: 'outline' as const, color: 'bg-orange-100 text-orange-800' },
  EFFECTUE: { label: 'Effectué', variant: 'outline' as const, color: 'bg-green-100 text-green-800' },
  ANNULE: { label: 'Annulé', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
};

const MOYENS_TRANSPORT = [
  "Djetran",
  "Banco",
  "Taxi Compteur",
  "Yango",
  "Lathaye",
  "Autre",
] as const;

export function RendezVousList({ rendezVous, onUpdate, clerkUserId: clerkUserIdProp }: RendezVousListProps) {
  const { user } = useUser();
  const clerkUserId = clerkUserIdProp ?? user?.id;
  const [sortBy, setSortBy] = useState<'date' | 'statut'>('statut');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duree: '',
    resume_rendez_vous: '',
    note: '',
  });
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [reservationRendezVous, setReservationRendezVous] = useState<RendezVous | null>(null);
  const [savingReservation, setSavingReservation] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    dateReservation: '',
    dateRetour: '',
    heure_reserve: '',
    destination: '',
    motif: '',
    commentaire: '',
    moyenTransport: '',
  });

  const handleReservationClick = (rendezVous: RendezVous) => {
    setReservationRendezVous(rendezVous);
    const rdvDate = new Date(rendezVous.date);
    const dateStr = rdvDate.toISOString().split('T')[0];
    const timeStr = rdvDate.toTimeString().slice(0, 5);
    setReservationForm({
      dateReservation: dateStr,
      dateRetour: dateStr,
      heure_reserve: timeStr,
      destination: '',
      motif: '',
      commentaire: '',
      moyenTransport: '',
    });
    setReservationDialogOpen(true);
  };

  const handleSaveReservation = async () => {
    if (!reservationRendezVous) return;
    const { dateReservation, dateRetour, heure_reserve, destination, motif, commentaire, moyenTransport } = reservationForm;
    if (!moyenTransport || !dateReservation || !dateRetour || !heure_reserve || !destination.trim() || !motif.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSavingReservation(true);
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${base}/api/reservation-vehicule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rendezVousId: reservationRendezVous.id,
          moyenTransport: moyenTransport.trim(),
          dateReservation: `${dateReservation}T00:00:00`,
          dateRetour: `${dateRetour}T23:59:59`,
          heure_reserve,
          destination: destination.trim(),
          motif: motif.trim(),
          commentaire: commentaire.trim() || undefined,
          clerkUserId: clerkUserId || undefined,
          clientOuEntrepriseNom: getClientInfo(reservationRendezVous)?.name || undefined,
        }),
        credentials: 'same-origin',
      });
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        toast.success('Réservation enregistrée avec succès');
        setReservationDialogOpen(false);
        onUpdate?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast.error('Erreur réseau. Réessayez.');
    } finally {
      setSavingReservation(false);
    }
  };

  const handleEditClick = (rendezVous: RendezVous) => {
    setSelectedRendezVous(rendezVous);
    const rendezVousDate = new Date(rendezVous.date);
    setFormData({
      date: rendezVousDate.toISOString().split('T')[0],
      time: rendezVousDate.toTimeString().slice(0, 5),
      duree: '',
      resume_rendez_vous: '',
      note: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRendezVous) return;

    const doSave = async (retries = 2) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const dateTime = new Date(`${formData.date}T${formData.time}`);
          const res = await fetch(`/api/rendez-vous/${selectedRendezVous.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: dateTime.toISOString(),
              duree: formData.duree || undefined,
              resume_rendez_vous: formData.resume_rendez_vous || undefined,
              note: formData.note || undefined,
            }),
            credentials: 'same-origin',
          });
          const result = await res.json().catch(() => ({}));

          if (result.success) {
            toast.success('Rendez-vous mis à jour avec succès');
            setEditDialogOpen(false);
            onUpdate?.();
            return;
          }
          toast.error(result.error || 'Erreur lors de la mise à jour');
          return;
        } catch (error) {
          if (attempt === retries - 1) throw error;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    };

    try {
      await doSave();
    } catch (error) {
      console.error('Error updating rendez-vous:', error);
      toast.error('Erreur réseau. Réessayez.');
    }
  };

  const handleStatusUpdate = async (rendezVousId: string, newStatus: string) => {
    setUpdatingStatus(rendezVousId);
    const doUpdate = async (retries = 2) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await fetch(`/api/rendez-vous/${rendezVousId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: newStatus }),
            credentials: 'same-origin',
          });
          const result = await res.json().catch(() => ({}));
          if (result.success) {
            toast.success('Statut mis à jour avec succès');
            onUpdate?.();
            return;
          }
          toast.error(result.error || 'Erreur lors de la mise à jour');
          return;
        } catch (error) {
          if (attempt === retries - 1) throw error;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    };
    try {
      await doUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur réseau. Réessayez.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredAndSortedRendezVous = React.useMemo(() => {
    let filtered = rendezVous;

    // Always filter out EFFECTUE appointments
    filtered = filtered.filter(rv => rv.statut !== 'EFFECTUE');

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(rv => rv.statut === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'statut') {
        const statusOrder = ['EN_ATTENTE', 'CONFIRME', 'DEPLACE', 'ANNULE'];
        comparison = statusOrder.indexOf(a.statut) - statusOrder.indexOf(b.statut);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rendezVous, sortBy, sortOrder, statusFilter]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getClientInfo = (rendezVous: RendezVous) => {
    if (rendezVous.client) {
      return {
        type: 'CLIENT',
        name: rendezVous.client.nom,
        contact: rendezVous.client.telephone,
        email: rendezVous.client.email,
        icon: User,
      };
    } else if (rendezVous.clientEntreprise) {
      return {
        type: 'CLIENT_ENTREPRISE',
        name: rendezVous.clientEntreprise.nom_entreprise,
        contact: rendezVous.clientEntreprise.telephone,
        email: rendezVous.clientEntreprise.email,
        icon: Building2,
      };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Filters and Controls */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Filtres et tri</h3>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Statut:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Trier par:</label>
                <Select value={sortBy} onValueChange={(value: 'date' | 'statut') => setSortBy(value)}>
                  <SelectTrigger className="w-[150px] border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="statut">Statut</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-gray-200 bg-white hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rendez-vous List */}
      <div className="grid gap-4">
        {filteredAndSortedRendezVous.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
              <p className="text-gray-500 text-center">
                {statusFilter === 'ALL' 
                  ? "Vous n'avez pas encore de rendez-vous planifiés."
                  : `Aucun rendez-vous avec le statut "${statusConfig[statusFilter as keyof typeof statusConfig]?.label}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 p-6">
            {filteredAndSortedRendezVous.map((rendezVous) => {
              const clientInfo = getClientInfo(rendezVous);
              const statusInfo = statusConfig[rendezVous.statut];
              const IconComponent = clientInfo?.icon || User;

              return (
                <div key={rendezVous.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Date and Time */}
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{formatDate(rendezVous.date)}</p>
                              <p className="text-sm text-gray-600">{formatTime(rendezVous.date)}</p>
                            </div>
                          </div>
                        </div>


                        {/* Client Information */}
                        {clientInfo && (
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{clientInfo.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {clientInfo.contact}
                                </span>
                                {clientInfo.email && (
                                  <span className="flex items-center gap-1">
                                    <span>•</span>
                                    {clientInfo.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col gap-4 lg:items-end">
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditClick(rendezVous)}
                              className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                              <PencilIcon className="h-4 w-4" />
                              Modifier
                            </button>
                            <Badge className={`${statusInfo.color} border-0 px-4 py-2 text-sm font-medium`}>
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Status Update */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 font-medium">Modifier statut:</label>
                            <Select
                              value={rendezVous.statut}
                              onValueChange={(value) => handleStatusUpdate(rendezVous.id, value)}
                              disabled={updatingStatus === rendezVous.id}
                            >
                              <SelectTrigger className="w-[160px] h-9 text-sm border-gray-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                                <SelectItem value="EFFECTUE">
                                  Effectué
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                          Créé le {new Intl.DateTimeFormat('fr-FR').format(new Date(rendezVous.createdAt))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-xs font-medium text-gray-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => handleReservationClick(rendezVous)}
                          disabled={rendezVous.statut !== 'CONFIRME'}
                        >
                          <Car className="h-4 w-4" />
                          Reserver un véhicule
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
            <DialogDescription>
              Modifiez les informations du rendez-vous avec {selectedRendezVous && getClientInfo(selectedRendezVous)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              /> 
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duree">Durée (ex: 30 min, 1h)</Label>
              <Input
                id="duree"
                type="text"
                placeholder="30 min"
                value={formData.duree}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resume">Résumé du rendez-vous</Label>
              <Textarea
                id="resume"
                placeholder="Résumé du rendez-vous..."
                value={formData.resume_rendez_vous}
                onChange={(e) => setFormData({ ...formData, resume_rendez_vous: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                placeholder="Notes additionnelles..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Véhicule Dialog */}
      <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Réserver un véhicule</DialogTitle>
            <DialogDescription>
              {reservationRendezVous && getClientInfo(reservationRendezVous) && (
                <>Réservation pour le rendez-vous avec {getClientInfo(reservationRendezVous)?.name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {reservationRendezVous && (() => {
              const info = getClientInfo(reservationRendezVous);
              if (!info) return null;
              const Icon = info.icon;
              return (
                <div className="grid gap-2">
                  <Label>Client / Entreprise</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
                    <Icon className="h-4 w-4 text-gray-500" />
                    {info.name}
                  </div>
                </div>
              );
            })()}
            <div className="grid gap-2">
              <Label htmlFor="moyenTransport">Véhicule / Moyen de transport *</Label>
              <Select
                value={reservationForm.moyenTransport}
                onValueChange={(v) => setReservationForm({ ...reservationForm, moyenTransport: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un moyen de transport" />
                </SelectTrigger>
                <SelectContent>
                  {MOYENS_TRANSPORT.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dateReservation">Date de réservation *</Label>
                <Input
                  id="dateReservation"
                  type="date"
                  value={reservationForm.dateReservation}
                  onChange={(e) => setReservationForm({ ...reservationForm, dateReservation: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateRetour">Date de retour *</Label>
                <Input
                  id="dateRetour"
                  type="date"
                  value={reservationForm.dateRetour}
                  onChange={(e) => setReservationForm({ ...reservationForm, dateRetour: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heure_reserve">Heure réservée *</Label>
              <Input
                id="heure_reserve"
                type="time"
                value={reservationForm.heure_reserve}
                onChange={(e) => setReservationForm({ ...reservationForm, heure_reserve: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                placeholder="Ex: Centre-ville"
                value={reservationForm.destination}
                onChange={(e) => setReservationForm({ ...reservationForm, destination: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="motif">Motif *</Label>
              <Input
                id="motif"
                placeholder="Ex: Rendez-vous client"
                value={reservationForm.motif}
                onChange={(e) => setReservationForm({ ...reservationForm, motif: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                placeholder="Commentaire optionnel..."
                value={reservationForm.commentaire}
                onChange={(e) => setReservationForm({ ...reservationForm, commentaire: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReservationDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveReservation} disabled={savingReservation}>
              {savingReservation ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
