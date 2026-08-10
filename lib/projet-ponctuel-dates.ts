export type ProjetDateBounds = {
  dateDebut: string;
  dateCloture: string | null;
};

/** Normalize to YYYY-MM-DD in local timezone for HTML date inputs. */
export function toInputDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseInputDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

export function formatProjetPeriod(bounds: ProjetDateBounds): string {
  const debut = toInputDate(bounds.dateDebut);
  if (bounds.dateCloture) {
    return `du ${debut} au ${toInputDate(bounds.dateCloture)}`;
  }
  return `à partir du ${debut}`;
}

export function defaultActiviteStartDate(bounds: ProjetDateBounds): string {
  const today = toInputDate(new Date());
  const projetDebut = toInputDate(bounds.dateDebut);

  if (today < projetDebut) return projetDebut;
  if (bounds.dateCloture) {
    const projetFin = toInputDate(bounds.dateCloture);
    if (today > projetFin) return projetFin;
  }
  return today;
}

export function validateActiviteDatesInProjetRange(
  activiteDebut: string,
  activiteCloture: string | null | undefined,
  projet: ProjetDateBounds
): string | null {
  const aStart = parseInputDate(activiteDebut);
  if (!aStart) {
    return "La date de début de l'activité est invalide.";
  }

  const pStart = parseInputDate(toInputDate(projet.dateDebut));
  if (!pStart) {
    return "La date de début du projet est invalide.";
  }

  let aEnd = aStart;
  if (activiteCloture?.trim()) {
    const parsedEnd = parseInputDate(activiteCloture);
    if (!parsedEnd) {
      return "La date de clôture de l'activité est invalide.";
    }
    if (parsedEnd < aStart) {
      return "La date de clôture de l'activité doit être postérieure ou égale à sa date de début.";
    }
    aEnd = parsedEnd;
  }

  if (aStart < pStart) {
    return `La date de début de l'activité doit être comprise dans la période du projet (${formatProjetPeriod(projet)}).`;
  }

  if (projet.dateCloture) {
    const pEnd = parseInputDate(toInputDate(projet.dateCloture));
    if (!pEnd) {
      return "La date de clôture du projet est invalide.";
    }

    if (aStart > pEnd) {
      return `La date de début de l'activité ne peut pas dépasser la date de clôture du projet (${toInputDate(projet.dateCloture)}).`;
    }

    if (aEnd > pEnd) {
      return `La date de clôture de l'activité ne peut pas dépasser la date de clôture du projet (${toInputDate(projet.dateCloture)}).`;
    }
  }

  return null;
}
