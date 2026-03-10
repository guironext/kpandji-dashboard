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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Car } from "lucide-react";
import type { ObjectifVehiculeByPeriod } from "@/lib/actions/objectif-vehicule";

const BAR_COLORS = {
  objectifCible: "#6366f1",
  ventesRealisees: "#22c55e",
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

type ObjectifsVehiculesTableProps = {
  data: ObjectifVehiculeByPeriod[];
};

export function ObjectifsVehiculesTable({ data }: ObjectifsVehiculesTableProps) {
  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Car className="h-6 w-6 text-amber-600" />
            Objectifs véhicules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Vos objectifs de volume de vente par période
          </p>
        </CardHeader>
        <CardContent>
          <div className="min-h-[120px] flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-gray-500 text-sm">Aucun objectif véhicule défini.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Car className="h-6 w-6 text-amber-600" />
          Objectifs véhicules
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Vos objectifs de volume de vente par période
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((period) => {
            const barData = [
              {
                name: "Objectif cible (volume)",
                value: period.objectifCible,
                fill: BAR_COLORS.objectifCible,
              },
              {
                name: "Ventes réalisées",
                value: period.ventesRealisees,
                fill: BAR_COLORS.ventesRealisees,
              },
            ];

            return (
              <div key={period.objectifPeriodId}>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Période : {period.periodLabel}
                </h3>
                {(period.objectifCible > 0 || period.ventesRealisees > 0) ? (
                  <div className="mb-6 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" stroke="#64748b" tick={{ fill: "#475569", fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          stroke="#64748b"
                          tick={{ fill: "#475569", fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number | undefined) =>
                            value != null ? formatNumber(value) : ""
                          }
                        />
                        <Bar
                          dataKey="value"
                          radius={[0, 4, 4, 0]}
                          label={{
                            position: "right",
                            fill: "#475569",
                            fontSize: 11,
                            fontWeight: 600,
                            formatter: (v: unknown) =>
                              typeof v === "number" && v > 0 ? formatNumber(v) : "",
                          }}
                        >
                          {barData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Objectif cible (volume)</TableHead>
                      <TableHead>Ventes réalisées</TableHead>
                      <TableHead>% atteint</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {period.objectifs.map((obj) => (
                      <TableRow key={obj.id}>
                        <TableCell className="font-medium">
                          {formatNumber(obj.objectifCible)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(obj.ventesRealisees)}
                        </TableCell>
                        <TableCell>
                          {obj.pourcentageAtteint != null
                            ? `${obj.pourcentageAtteint.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
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
