const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

export function formatDurationMs(ms: number): string {
  if (ms <= 0) return "0 min";

  const days = Math.floor(ms / MS_PER_DAY);
  const hours = Math.floor((ms % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);

  if (days > 0) {
    return hours > 0 ? `${days} j ${hours} h` : `${days} j`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  return `${Math.max(1, minutes)} min`;
}

export function formatDurationDays(days: number): string {
  if (days <= 0) return "0 j";
  if (days < 1) {
    return formatDurationMs(days * MS_PER_DAY);
  }
  const wholeDays = Math.floor(days);
  const hours = Math.round((days - wholeDays) * 24);
  return hours > 0 ? `${wholeDays} j ${hours} h` : `${wholeDays} j`;
}
