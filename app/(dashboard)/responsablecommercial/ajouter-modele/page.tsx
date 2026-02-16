"use client";

import { useState, useEffect } from "react";
import { createModel, getAllModele, getVoitureModelCountByTransmission } from "@/lib/actions/modele";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Plus,
  Car,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  Grid3X3,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { PieChart, Pie, Sector, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PieSectorShapeProps } from "recharts";

type VoitureModelItem = {
  id: string;
  model: string;
  fiche_technique: string | null;
  description?: string | null;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AjouterModelePage() {
  const [models, setModels] = useState<VoitureModelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [ficheTechFiles, setFicheTechFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    model: "",
    description: "",
  });
  const [transmissionData, setTransmissionData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    const loadTransmission = async () => {
      const result = await getVoitureModelCountByTransmission();
      if (result.success && result.data) setTransmissionData(result.data);
    };
    loadTransmission();
  }, [models]);

  useEffect(() => {
    if (imageFiles.length > 0) {
      const objectUrl = URL.createObjectURL(imageFiles[0]);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [imageFiles]);

  const loadModels = async () => {
    const result = await getAllModele();
    if (result.success && result.data) {
      setModels(result.data);
    }
  };

  const resetForm = () => {
    setFormData({ model: "", description: "" });
    setImageFiles([]);
    setFicheTechFiles([]);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allFiles = [...imageFiles, ...ficheTechFiles];

    const result = await createModel(formData, allFiles, ficheTechFiles.length > 0);

    if (result.success) {
      toast.success(result.message);
      resetForm();
      setDialogOpen(false);
      loadModels();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto p-6 lg:p-8 max-w-6xl relative z-10">
        {/* Hero header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl blur-2xl opacity-20" />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-indigo-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl blur-lg opacity-40" />
                  <div className="relative p-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg">
                    <Car className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Catalogue des Modèles
                  </h1>
                  <p className="text-slate-600 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Gérez votre gamme de véhicules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="px-5 py-2.5 text-base bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  {models.length} {models.length !== 1 ? "modèles" : "modèle"}
                </Badge>
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="lg"
                  className="gap-2 shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter Nouveau Modèle
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog - Bento-style with rose accent */}
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-0 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.1)]">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              {/* Inline header with left accent */}
              <div className="flex gap-4 mb-8">
                <div className="h-14 w-1 shrink-0 rounded-full bg-gradient-to-b from-rose-400 to-rose-600" />
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                    Nouveau Modèle
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 mt-1">
                    Renseignez les informations du véhicule
                  </DialogDescription>
                </div>
              </div>

              {/* Bento grid */}
              <div className="space-y-4">
                {/* Model name - full width */}
                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
                  <Label htmlFor="model" className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                    Nom du modèle <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="model"
                    placeholder="Ex: Djetran Automatique"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    className="h-11 border-0 bg-white/80 shadow-sm focus-visible:ring-rose-500/50 rounded-xl"
                  />
                </div>

                {/* Description */}
                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
                  <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Caractéristiques, options..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[88px] resize-none border-0 bg-white/80 shadow-sm focus-visible:ring-rose-500/50 rounded-xl"
                  />
                </div>

                {/* Files - side by side bento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
                    <Label className="flex cursor-pointer flex-col items-center gap-2 py-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Image</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                        className="hidden"
                      />
                    </Label>
                    {preview && (
                      <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-xl ring-1 ring-slate-200/60">
                        <Image src={preview} alt="Preview" fill className="object-contain" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => { setImageFiles([]); setPreview(null); }}
                          className="absolute right-1 top-1 h-6 w-6 rounded-full p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
                    <Label className="flex cursor-pointer flex-col items-center gap-2 py-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Fiche technique</span>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setFicheTechFiles(e.target.files ? Array.from(e.target.files) : [])}
                        className="hidden"
                      />
                    </Label>
                    {ficheTechFiles.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-xs ring-1 ring-slate-200/60">
                        <FileText className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate flex-1 text-slate-600">{ficheTechFiles[0].name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFicheTechFiles([])}
                          className="h-5 w-5 p-0 shrink-0 text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer - full width buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  className="flex-1 h-12 rounded-xl border-slate-200 font-medium"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-lg shadow-rose-500/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Donut chart - VoitureModel by transmission */}
        <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-sm p-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Répartition par transmission</h3>
          <p className="text-sm text-slate-500 mb-6">
            Commandes par type de transmission (modèles avec voitureModel)
          </p>
          <div className="h-[280px] w-full ">
            {transmissionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transmissionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    shape={(props: PieSectorShapeProps) => {
                      const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];
                      return (
                        <Sector
                          {...props}
                          fill={colors[props.index % colors.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, "Commandes"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0",  padding: "2px" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50">
                <p className="text-slate-500 text-sm">Aucune donnée de transmission disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Models list - Premium gallery design */}
        <div className="relative">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Catalogue des modèles
              </h2>
              <p className="mt-1 text-slate-500">
                {models.length} {models.length !== 1 ? "modèles" : "modèle"} dans votre gamme
              </p>
            </div>
          </div>

          {models.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-full blur-3xl" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 shadow-inner">
                    <Car className="h-12 w-12 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Aucun modèle enregistré</h3>
                <p className="text-slate-600 max-w-md mb-8 text-base">
                  Votre catalogue est vide. Ajoutez votre premier modèle de véhicule pour commencer.
                </p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="lg"
                  className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter un modèle
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <article
                  key={model.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200/80"
                >
                  {/* Image area */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {model.image ? (
                      <>
                        <Image
                          src={model.image}
                          alt={model.model}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                        <Car className="h-16 w-16 text-slate-300" />
                      </div>
                    )}
                    {/* Date badge */}
                    <div className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(model.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-slate-900 text-lg leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {model.model}
                    </h3>
                    {model.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
                        {model.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {model.fiche_technique ? (
                        <a
                          href={model.fiche_technique}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          <FileText className="h-4 w-4" />
                          Fiche technique
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
                          <FileText className="h-4 w-4" />
                          Pas de fiche
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
