"use client";

import { useState, useEffect } from "react";
import { getAllModele } from "@/lib/actions/modele";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { Calendar, FileText, Car, Sparkles, Zap, Printer, Palette, Eye } from "lucide-react";

type ModeleItem = {
  id: string;
  model: string;
  fiche_technique: string | null;
  description?: string | null;
  image?: string | null;
  couleur?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
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

export default function AjouterModelePage() {
  const [models, setModels] = useState<ModeleItem[]>([]);
  const [selected, setSelected] = useState<ModeleItem | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    const result = await getAllModele();
    if (result.success && result.data) {
      setModels(
        [...result.data].sort((a, b) =>
          a.model.localeCompare(b.model, "fr", { sensitivity: "base" })
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 md:p-8 max-w-7xl relative z-10 w-full min-w-0">
        <div className="mb-6 sm:mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-orange-200/50">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative p-3 sm:p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                      <Car className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent break-words">
                        Modèles de Véhicules
                      </h1>
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 animate-pulse shrink-0 hidden sm:block" />
                    </div>
                    <p className="text-orange-700/70 mt-2 text-sm sm:text-base font-medium flex items-start sm:items-center gap-2">
                      <Zap className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                      <span>Gérez et organisez votre catalogue de modèles</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 items-stretch sm:items-end">
                <Badge
                  onClick={() => window.open("/commercial/ajouter-modele/print", "_blank")}
                  className="text-base sm:text-lg md:text-xl justify-center px-4 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 cursor-pointer transition-all"
                >
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                  {models.length} {models.length !== 1 ? "modèles" : "modèle"}
                </Badge>
                <div className="text-xs text-orange-600 text-center sm:text-right font-semibold">
                  Catalogue Premium
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl blur-xl opacity-20"></div>
          <Card className="relative shadow-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
            <CardHeader className="space-y-3 pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6 bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex flex-wrap items-center gap-2 sm:gap-3">
                    🏆 Catalogue des Modèles
                  </CardTitle>
                  <CardDescription className="text-orange-700/70 font-semibold mt-2 text-sm sm:text-base">
                    Tous vos modèles enregistrés • {models.length} {models.length !== 1 ? "véhicules" : "véhicule"}
                  </CardDescription>
                </div>
                <Badge
                  onClick={() => window.open("/commercial/ajouter-modele/print", "_blank")}
                  className="w-full sm:w-auto shrink-0 justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg cursor-pointer hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  <Printer className="w-4 h-4 mr-2 inline shrink-0" />
                  Imprimer le catalogue
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-6">
              {models.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-2 text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-2xl opacity-30"></div>
                    <div className="relative p-6 sm:p-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                      <Car className="w-14 h-14 sm:w-20 sm:h-20 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-orange-900 mb-3">Aucun modèle</h3>
                  <p className="text-orange-700/70 max-w-sm text-base sm:text-lg">
                    Aucun modèle de véhicule n&apos;est enregistré dans le catalogue.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-5">
                  {models.map((model) => (
                    <div key={model.id} className="group relative min-w-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative border-2 border-orange-200/50 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-start hover:shadow-2xl hover:border-orange-300 transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
                        {model.image ? (
                          <div className="relative mx-auto sm:mx-0 shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-md opacity-30"></div>
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-orange-200/50 shadow-xl mx-auto sm:mx-0">
                              <Image
                                src={model.image}
                                alt={model.model}
                                fill
                                sizes="(max-width: 640px) 96px, 112px"
                                className="object-contain group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0">
                            <Car className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
                          <div>
                            <h3 className="font-bold text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mb-2 break-words">
                              {model.model}
                            </h3>
                            {model.couleur && (
                              <p className="text-sm text-orange-800/80 font-semibold mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                                <Palette className="w-3.5 h-3.5 text-orange-500" />
                                {model.couleur}
                              </p>
                            )}
                            {model.description && (
                              <p className="text-sm text-orange-800/70 line-clamp-3 sm:line-clamp-2 font-medium">
                                {model.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
                            {model.fiche_technique && (
                              <a
                                href={model.fiche_technique}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all min-w-0"
                              >
                                <FileText className="w-4 h-4" />
                                Fiche technique
                              </a>
                            )}
                            <span className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm text-orange-700 bg-orange-100 rounded-lg font-semibold text-left">
                              <Calendar className="w-4 h-4" />
                              {new Date(model.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 justify-center sm:justify-start shrink-0 pt-2 sm:pt-0 border-t border-orange-100/80 sm:border-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelected(model)}
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

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="flex max-h-[min(26rem,68dvh)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-y-auto overscroll-contain p-0 sm:max-w-3xl">
          {selected && (
            <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50">
              <DialogHeader className="sticky top-0 z-10 border-b border-orange-100 bg-amber-50/95 px-4 py-3 pr-12 backdrop-blur-sm sm:px-6">
                <DialogTitle className="text-lg font-bold break-words text-orange-900 sm:text-xl">{selected.model}</DialogTitle>
                <DialogDescription className="text-orange-800/80">
                  Informations du modèle
                </DialogDescription>
              </DialogHeader>
              <div className="px-4 py-4 sm:px-6">
                <div className="grid items-start gap-4 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                  {selected.image ? (
                    <div className="relative h-28 w-full overflow-hidden rounded-2xl border-2 border-orange-200 bg-white">
                      <Image src={selected.image} alt={selected.model} fill sizes="(max-width: 768px) 100vw, 12rem" className="object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-2xl bg-orange-100">
                      <Car className="h-10 w-10 text-orange-600" />
                    </div>
                  )}
                  <dl className="min-w-0">
                    <Detail label="Modèle">{selected.model}</Detail>
                    <Detail label="Couleur">{selected.couleur || "—"}</Detail>
                    <Detail label="Description">{selected.description || "—"}</Detail>
                    <Detail label="Fiche technique">
                      {selected.fiche_technique ? (
                        <a
                          href={selected.fiche_technique}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-orange-700 underline"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          Ouvrir la fiche
                        </a>
                      ) : (
                        "—"
                      )}
                    </Detail>
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
