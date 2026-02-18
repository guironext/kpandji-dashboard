"use server";

import { prisma } from "../prisma";

export type ProspectsChartData = {
  chartData: Array<Record<string, string | number>>;
  commercialNames: string[];
};

/**
 * Fetches all prospects (Client + Client_entreprise) with status PROSPECT,
 * grouped by commercial and by month for chart display.
 */
export async function getProspectsChartDataByCommercialAndMonth(): Promise<{
  success: boolean;
  data?: ProspectsChartData;
  error?: string;
}> {
  try {
    const [clients, clientEntreprises] = await Promise.all([
      prisma.client.findMany({
        where: { status_client: "PROSPECT" },
        include: { User: true },
      }),
      prisma.client_entreprise.findMany({
        where: { status_client: "PROSPECT" },
        include: { User: true },
      }),
    ]);

    const getCommercialName = (item: {
      commercial?: string | null;
      User?: { firstName?: string; lastName?: string } | null;
    }) => {
      if (item.commercial?.trim()) return item.commercial.trim();
      const u = item.User;
      if (u?.firstName || u?.lastName) {
        return `${u.firstName || ""} ${u.lastName || ""}`.trim();
      }
      return "Non assigné";
    };

    type ProspectItem = { createdAt: Date; commercial?: string | null; User?: { firstName?: string; lastName?: string } | null };
    const allProspects: ProspectItem[] = [
      ...clients.map((c) => ({ createdAt: c.createdAt, commercial: c.commercial, User: c.User })),
      ...clientEntreprises.map((c) => ({ createdAt: c.createdAt, commercial: c.commercial, User: c.User })),
    ];

    const commercialSet = new Set<string>();
    const monthMap = new Map<string, Map<string, number>>();

    for (const p of allProspects) {
      const commercial = getCommercialName(p);
      commercialSet.add(commercial);

      const d = new Date(p.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map());
      }
      const commercialCounts = monthMap.get(monthKey)!;
      commercialCounts.set(commercial, (commercialCounts.get(commercial) ?? 0) + 1);
    }

    const commercialNames = Array.from(commercialSet).sort();
    const sortedMonths = Array.from(monthMap.keys()).sort();

    const chartData: Array<Record<string, string | number>> = sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      const commercialCounts = monthMap.get(monthKey)!;
      const row: Record<string, string | number> = { month: monthLabel, total: 0 };
      let total = 0;
      for (const name of commercialNames) {
        const count = commercialCounts.get(name) ?? 0;
        row[name] = count;
        total += count;
      }
      row.total = total;
      return row;
    });

    return {
      success: true,
      data: { chartData, commercialNames },
    };
  } catch (error) {
    console.error("Error fetching prospects chart data:", error);
    return { success: false, error: "Failed to fetch chart data" };
  }
}
