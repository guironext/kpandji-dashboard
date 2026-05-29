import type {
  InactivePublicationsPerformanceData,
  InactivePublicationsByActeurGroup,
  InactivePublicationsByMonthGroup,
  InactivePublicationPerformanceItem,
} from "./actions/publication-objectif-global-rubrique";
import type { ActeurWithObjectifs } from "./actions/communication-objectifs";

const INFOGRAPHIE_ROLE = "INFOGRAPHIE";

export function filterPerformanceForInfographie(
  data: InactivePublicationsPerformanceData
): InactivePublicationsPerformanceData {
  const publications = data.byActeur
    .filter((a) => a.acteurRole === INFOGRAPHIE_ROLE)
    .flatMap((a) => a.publications);

  const acteurMap = new Map<string, InactivePublicationsByActeurGroup>();
  for (const pub of publications) {
    const existing = acteurMap.get(pub.userId);
    if (existing) {
      existing.publications.push(pub);
    } else {
      acteurMap.set(pub.userId, {
        userId: pub.userId,
        acteurName: pub.acteurName,
        acteurRole: pub.acteurRole,
        publications: [pub],
      });
    }
  }

  const byActeur = Array.from(acteurMap.values()).sort((a, b) =>
    a.acteurName.localeCompare(b.acteurName, "fr")
  );

  const monthMap = new Map<string, InactivePublicationPerformanceItem[]>();
  for (const pub of publications) {
    const list = monthMap.get(pub.monthKey) ?? [];
    list.push(pub);
    monthMap.set(pub.monthKey, list);
  }

  const byMonth: InactivePublicationsByMonthGroup[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthPublications]) => {
      const monthActeurMap = new Map<string, InactivePublicationsByActeurGroup>();
      for (const pub of monthPublications) {
        const existing = monthActeurMap.get(pub.userId);
        if (existing) {
          existing.publications.push(pub);
        } else {
          monthActeurMap.set(pub.userId, {
            userId: pub.userId,
            acteurName: pub.acteurName,
            acteurRole: pub.acteurRole,
            publications: [pub],
          });
        }
      }

      const monthLabel = monthPublications[0]?.monthLabel ?? monthKey;
      return {
        monthKey,
        monthLabel,
        byActeur: Array.from(monthActeurMap.values()).sort((a, b) =>
          a.acteurName.localeCompare(b.acteurName, "fr")
        ),
        totalCount: monthPublications.length,
      };
    });

  return {
    totalCount: publications.length,
    byActeur,
    byMonth,
  };
}

export function filterInfographieActeurs(acteurs: ActeurWithObjectifs[]): ActeurWithObjectifs[] {
  return acteurs.filter((a) => a.role === INFOGRAPHIE_ROLE);
}
