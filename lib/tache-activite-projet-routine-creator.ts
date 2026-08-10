export function getTacheCreatorUserId(tache: {
  createdByUserId?: string | null;
  activiteResponsableUserId?: string | null;
}): string | null {
  return tache.createdByUserId ?? tache.activiteResponsableUserId ?? null;
}

export function isTacheCreatorUser(
  tache: { createdByUserId?: string | null; activiteResponsableUserId?: string | null },
  currentUserId: string | null
): boolean {
  if (!currentUserId) return false;
  const creatorId = getTacheCreatorUserId(tache);
  return creatorId !== null && creatorId === currentUserId;
}
