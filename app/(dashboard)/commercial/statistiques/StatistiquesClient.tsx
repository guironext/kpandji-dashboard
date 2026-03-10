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
import { BarChart3, Users, Building2 } from "lucide-react";
import type { ClientsByMonthChartData } from "@/lib/actions/client_entreprise";

type StatistiquesClientProps = {
  data: ClientsByMonthChartData;
};

const CHART_COLORS = {
  clients: "#2563eb",
  clientEntreprises: "#16a34a",
};

export function StatistiquesClient({ data }: StatistiquesClientProps) {
  const { chartData, totalClients, totalClientEntreprises } = data;
  const total = totalClients + totalClientEntreprises;

  if (chartData.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium">Aucune donnée à afficher</p>
          <p className="text-sm mt-1">
            Créez des clients ou prospects pour voir les statistiques par mois
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Clients individuels</p>
                <p className="text-2xl font-bold text-blue-900">{totalClients}</p>
              </div>
              <div className="p-3 bg-blue-200/60 rounded-xl">
                <Users className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Client entreprises</p>
                <p className="text-2xl font-bold text-green-900">{totalClientEntreprises}</p>
              </div>
              <div className="p-3 bg-green-200/60 rounded-xl">
                <Building2 className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-700">Total</p>
                <p className="text-2xl font-bold text-violet-900">{total}</p>
              </div>
              <div className="p-3 bg-violet-200/60 rounded-xl">
                <BarChart3 className="h-8 w-8 text-violet-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Clients et prospects par mois
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Clients individuels et client entreprises créés par mois
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="horizontal"
                margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis
                  dataKey="month"
                  orientation="top"
                  stroke="#64748b"
                  tick={{ fill: "#475569", fontSize: 12 }}
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
                  labelFormatter={(label) => `Mois: ${label}`}
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
    </div>
  );
}
