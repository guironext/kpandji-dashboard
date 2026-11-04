"use client";

import { useState, useEffect } from "react";
import { getAllAccessoires } from "@/lib/actions/accessoire";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { Eye, Package } from "lucide-react";
import { formatNumberWithSpaces } from "@/lib/utils";

type AccessoireItem = {
  id: string;
  nom: string;
  description?: string | null;
  prix?: number | null;
  quantity?: number | null;
  image?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-orange-100 py-3 last:border-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-orange-700 sm:text-sm sm:normal-case sm:tracking-normal">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-orange-950">{children}</dd>
    </div>
  );
}

export default function AjouterAccessoiresPage() {
  const [accessoires, setAccessoires] = useState<AccessoireItem[]>([]);
  const [selected, setSelected] = useState<AccessoireItem | null>(null);
  useEffect(() => {
    loadAccessoires();
  }, []);

  const loadAccessoires = async () => {
    const result = await getAllAccessoires();
    if (result.success && result.data) {
      setAccessoires(result.data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto p-6 lg:p-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-200/50">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                      <Package className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                      Accessoires
                    </h1>
                    <p className="text-orange-700/70 mt-2 text-lg font-medium">
                      Gérez les accessoires pour véhicules
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Badge className="text-xl px-8 py-4 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0">
                  <Package className="w-5 h-5 mr-2" />
                  {accessoires.length} {accessoires.length !== 1 ? 'accessoires' : 'accessoire'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl blur-xl opacity-20"></div>
              <Card className="relative shadow-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
                <CardHeader className="space-y-3 pb-6 pt-8 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Catalogue des Accessoires
                      </CardTitle>
                      <CardDescription className="text-orange-700/70 font-semibold mt-2 text-base">
                        Tous vos accessoires enregistrés
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {accessoires.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-2xl opacity-30"></div>
                        <div className="relative p-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                          <Package className="w-20 h-20 text-orange-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-orange-900 mb-3">Aucun accessoire</h3>
                      <p className="text-orange-700/70 max-w-sm text-lg">
                        Aucun accessoire n&apos;est enregistré dans le catalogue.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5">
                      {accessoires.map((accessoire) => (
                        <div key={accessoire.id} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                          <div className="relative border-2 border-orange-200/50 rounded-2xl p-6 flex gap-6 items-start hover:shadow-2xl hover:border-orange-300 transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
                            {/* Image */}
                            {accessoire.image ? (
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-md opacity-30"></div>
                                <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-orange-200/50 shadow-xl">
                                  <Image 
                                    src={accessoire.image} 
                                    alt={accessoire.nom} 
                                    fill 
                                    className="object-contain group-hover:scale-110 transition-transform duration-300" 
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Package className="w-12 h-12 text-orange-600" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-3">
                              <div>
                                <h3 className="font-bold text-2xl bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mb-2">
                                  {accessoire.nom}
                                </h3>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelected(accessoire)}
                                className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 text-orange-700 shadow-md hover:shadow-lg transition-all"
                                title="Voir les informations"
                              >
                                <Eye className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="flex max-h-[min(26rem,68dvh)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-y-auto overscroll-contain p-0 sm:max-w-3xl">
          {selected && (
            <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50">
              <DialogHeader className="sticky top-0 z-10 border-b border-orange-100 bg-amber-50/95 px-4 py-3 pr-12 backdrop-blur-sm sm:px-6">
                <DialogTitle className="text-lg font-bold break-words text-orange-900 sm:text-xl">{selected.nom}</DialogTitle>
                <DialogDescription className="text-orange-800/80">
                  Informations de l&apos;accessoire
                </DialogDescription>
              </DialogHeader>
              <div className="px-4 py-4 sm:px-6">
                <div className="grid items-start gap-4 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                  {selected.image ? (
                    <div className="relative h-28 w-full overflow-hidden rounded-2xl border-2 border-orange-200 bg-white">
                      <Image src={selected.image} alt={selected.nom} fill sizes="(max-width: 768px) 100vw, 12rem" className="object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-2xl bg-orange-100">
                      <Package className="h-10 w-10 text-orange-600" />
                    </div>
                  )}
                  <dl className="min-w-0">
                    <Detail label="Nom">{selected.nom}</Detail>
                    <Detail label="Description">{selected.description || "—"}</Detail>
                    <Detail label="Prix">
                      {selected.prix != null ? `${formatNumberWithSpaces(selected.prix)} FCFA` : "—"}
                    </Detail>
                    <Detail label="Quantité">{selected.quantity != null ? selected.quantity : "—"}</Detail>
                    <Detail label="Créé le">{formatDate(selected.createdAt)}</Detail>
                    <Detail label="Mis à jour le">{formatDate(selected.updatedAt)}</Detail>
                  </dl>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
