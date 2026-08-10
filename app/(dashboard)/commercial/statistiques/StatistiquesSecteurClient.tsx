"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Briefcase } from "lucide-react";
import type { ClientsBySecteurActiviteData } from "@/lib/actions/client_entreprise";

type StatistiquesSecteurClientProps = {
  data: ClientsBySecteurActiviteData;
};

const CHART_COLORS = {
  clients: "#2563eb",
  clientEntreprises: "#16a34a",
};

export function StatistiquesSecteurClient({ data }: StatistiquesSecteurClientProps) {
  const { chartData } = data;

  if (chartData.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-6 w-6 text-amber-600" />
            Par secteur d&apos;activité
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Clients et client entreprises créés par le commercial actuel
          </p>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-gray-500 text-sm">Aucun secteur d&apos;activité renseigné</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Briefcase className="h-6 w-6 text-amber-600" />
          Par secteur d&apos;activité
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Clients et client entreprises créés par le commercial actuel
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="secteur"
                stroke="#64748b"
                tick={{ fill: "#475569", fontSize: 11 }}
                interval={0}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelFormatter={(label) => `Secteur: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="clients"
                name="Clients individuels"
                fill={CHART_COLORS.clients}
                radius={[4, 4, 0, 0]}
                label={{
                  position: "top",
                  fill: "#475569",
                  fontSize: 11,
                  fontWeight: 600,
                  formatter: (value: unknown) =>
                    typeof value === "number" && value > 0 ? value : "",
                }}
              />
              <Bar
                dataKey="clientEntreprises"
                name="Client entreprises"
                fill={CHART_COLORS.clientEntreprises}
                radius={[4, 4, 0, 0]}
                label={{
                  position: "top",
                  fill: "#475569",
                  fontSize: 11,
                  fontWeight: 600,
                  formatter: (value: unknown) =>
                    typeof value === "number" && value > 0 ? value : "",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
