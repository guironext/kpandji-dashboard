"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSparePartAttribution } from "@/lib/actions/stock";
import {
  Package,
  Wrench,
  Plus,
  Minus,
  Save,
  Trash2,
  GripVertical,
} from "lucide-react";

type SparePartType = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  etapeSparePart: string;
  createdAt: string;
  updatedAt: string;
  voiture: {
    id: string;
    couleur: string | null;
    motorisation: string | null;
    voitureModel: { model: string } | null;
  } | null;
  storage: {
    id: string;
    storageNumber: string | null;
    porte_Number: string | null;
    rayon: string | null;
    etage: string | null;
    caseNumber: string | null;
  } | null;
};

type EquipeType = {
  id: string;
  nomEquipe: string;
  mission: string;
  activite: string;
  stautsEquipe: string;
  createdAt: string;
  updatedAt: string;
  chefEquipe: {
    id: string;
    nom: string;
    prenoms: string;
  } | null;
  membres: {
    id: string;
    qualite: string;
    fonction: string;
    employee: {
      id: string;
      nom: string;
      prenoms: string;
    };
  }[];
  montage: {
    id: string;
    etapeMontage: string;
    ordreMontage: {
      id: string;
      ordreMontageFlag: string;
      commande: {
        id: string;
        couleur: string | null;
        motorisation: string | null;
        voitureModel: { model: string } | null;
      } | null;
    } | null;
  } | null;
};

type DraggedSparePart = {
  sparePart: SparePartType;
  quantity: number;
};

type Props = {
  equipe: EquipeType;
  spareParts: SparePartType[];
};

const AttributionPiecesDragDropClient = ({ equipe, spareParts }: Props) => {
  const [workPieces, setWorkPieces] = useState<DraggedSparePart[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Filter spare parts based on search
  const filteredSpareParts = spareParts.filter(
    (sp) =>
      sp.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.partNameFrench?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDragStart = (e: React.DragEvent, sparePart: SparePartType) => {
    e.dataTransfer.setData("sparePartId", sparePart.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sparePartId = e.dataTransfer.getData("sparePartId");
    const sparePart = spareParts.find((sp) => sp.id === sparePartId);

    if (sparePart) {
      const existingIndex = workPieces.findIndex(
        (wp) => wp.sparePart.id === sparePartId,
      );

      if (existingIndex >= 0) {
        // Update quantity
        setWorkPieces((prev) =>
          prev.map((wp, index) =>
            index === existingIndex ? { ...wp, quantity: wp.quantity + 1 } : wp,
          ),
        );
        setQuantities((prev) => ({
          ...prev,
          [sparePartId]: (prev[sparePartId] || 0) + 1,
        }));
      } else {
        // Add new item
        setWorkPieces((prev) => [...prev, { sparePart, quantity: 1 }]);
        setQuantities((prev) => ({
          ...prev,
          [sparePartId]: 1,
        }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const updateQuantity = (sparePartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeSparePart(sparePartId);
      return;
    }

    setQuantities((prev) => ({
      ...prev,
      [sparePartId]: newQuantity,
    }));

    setWorkPieces((prev) =>
      prev.map((wp) =>
        wp.sparePart.id === sparePartId ? { ...wp, quantity: newQuantity } : wp,
      ),
    );
  };

  const removeSparePart = (sparePartId: string) => {
    setWorkPieces((prev) =>
      prev.filter((wp) => wp.sparePart.id !== sparePartId),
    );
    setQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[sparePartId];
      return newQuantities;
    });
  };

  const handleSave = async () => {
    if (workPieces.length === 0) return;

    const montageId = equipe.montage?.id;
    if (!montageId) {
      alert("Aucun montage associé à cette équipe");
      return;
    }

    const sparePartsData = workPieces.map((wp) => ({
      id: wp.sparePart.id,
      quantity: wp.quantity,
    }));

    const result = await saveSparePartAttribution({
      equipeId: equipe.id,
      montageId,
      spareParts: sparePartsData,
    });

    if (result.success) {
      alert("Attribution enregistrée avec succès!");
      setWorkPieces([]);
      setQuantities({});
    } else {
      alert("Erreur lors de l'enregistrement: " + result.error);
    }
  };

  const totalQuantity = workPieces.reduce((sum, wp) => sum + wp.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Side - Spare Parts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Pièces Disponibles
          </h3>
          <span className="text-sm text-gray-500">
            {filteredSpareParts.length} pièces
          </span>
        </div>

        <Input
          placeholder="Rechercher une pièce..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 max-h-[500px] overflow-y-auto space-y-2"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {filteredSpareParts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune pièce disponible
            </p>
          ) : (
            filteredSpareParts.map((sparePart) => (
              <div
                key={sparePart.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sparePart)}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{sparePart.partName}</p>
                    <p className="text-xs text-gray-500">
                      {sparePart.partCode} -{" "}
                      {sparePart.voiture?.voitureModel?.model || "N/A"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sparePart.storage
                        ? `${sparePart.storage.porte_Number || ""} - ${sparePart.storage.caseNumber || ""}`
                        : "Stock non défini"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Qté: {sparePart.quantity}
                </Badge>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Glissez-déposez les pièces vers la zone de travail
        </p>
      </div>

      {/* Right Side - Work Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-green-600" />
            Pièces de Travail
          </h3>
          <Badge variant="secondary" className="text-sm">
            {totalQuantity} pièce(s)
          </Badge>
        </div>

        <Card
          className="min-h-[400px] bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="p-4 space-y-3">
            {workPieces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[350px] text-gray-400">
                <Package className="h-16 w-16 mb-4 opacity-50" />
                <p className="font-medium">Zone de travail vide</p>
                <p className="text-sm">Glissez des pièces ici pour commencer</p>
              </div>
            ) : (
              workPieces.map((wp) => (
                <div
                  key={wp.sparePart.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">
                        {wp.sparePart.partName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {wp.sparePart.partCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(wp.sparePart.id, wp.quantity - 1)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantities[wp.sparePart.id] || wp.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          wp.sparePart.id,
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className="w-16 h-8 text-center"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(wp.sparePart.id, wp.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => removeSparePart(wp.sparePart.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={workPieces.length === 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer l&apos;Attribution ({totalQuantity} pièces)
        </Button>
      </div>
    </div>
  );
};

export default AttributionPiecesDragDropClient;
