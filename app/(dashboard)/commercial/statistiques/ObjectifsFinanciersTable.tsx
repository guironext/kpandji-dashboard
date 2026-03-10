"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Target } from "lucide-react";
import type { ObjectifFinanciereByPeriod } from "@/lib/actions/objectif-financiere";

const PIE_COLORS = {
  objectifCible: "#6366f1",
  reelAtteint: "#22c55e",
};

function formatNumber(value: number | string | null): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value.replace(/\s/g, "")) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

type ObjectifsFinanciersTableProps = {
  data: ObjectifFinanciereByPeriod[];
};

export function ObjectifsFinanciersTable({ data }: ObjectifsFinanciersTableProps) {
  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-6 w-6 text-indigo-600" />
            Objectifs financiers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Vos objectifs financiers par période
          </p>
        </CardHeader>
        <CardContent>
          <div className="min-h-[120px] flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-gray-500 text-sm">Aucun objectif financier défini.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-6 w-6 text-indigo-600" />
          Objectifs financiers
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Vos objectifs financiers par période
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((period) => {
            const totalCible = period.objectifs.reduce((sum, obj) => {
              const c = parseFloat(String(obj.objectifCible ?? obj.chiffreAffaire).replace(/\s/g, "")) || 0;
              return sum + c;
            }, 0);
            const reelAtteint = period.factureSumReelAtteint;
            const pieData = [
              { name: "Objectif cible", value: totalCible, color: PIE_COLORS.objectifCible },
              { name: "Réel atteint", value: reelAtteint, color: PIE_COLORS.reelAtteint },
            ].filter((d) => d.value > 0);

            return (
            <div key={period.objectifPeriodId}>
              <h3 className="font-semibold text-gray-800 mb-2">
                Période : {period.periodLabel}
              </h3>
              {pieData.length > 0 ? (
                <div className="mb-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined) =>
                          value != null
                            ? new Intl.NumberFormat("fr-FR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(value) + " FCFA"
                            : ""
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Objectif cible (CA)</TableHead>
                    <TableHead>Réel atteint</TableHead>
                    <TableHead>% atteint</TableHead>
                    <TableHead>Écart cible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {period.objectifs.map((obj) => {
                    const cible = parseFloat(String(obj.objectifCible ?? obj.chiffreAffaire).replace(/\s/g, "")) || 0;
                    const reel = period.factureSumReelAtteint;
                    const pctAtteint = cible > 0 ? (reel / cible) * 100 : null;
                    const ecart = cible > 0 ? reel - cible : null;
                    return (
                      <TableRow key={obj.id}>
                        <TableCell className="font-medium">
                          {formatNumber(obj.objectifCible ?? obj.chiffreAffaire)} FCFA
                        </TableCell>
                        <TableCell>
                          {formatNumber(period.factureSumReelAtteint)} FCFA
                        </TableCell>
                        <TableCell>
                          {pctAtteint != null
                            ? `${pctAtteint.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {ecart != null
                            ? `${ecart >= 0 ? "+" : ""}${formatNumber(ecart)} FCFA`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
