import { MUSCLES, MUSCLE_GROUPS } from '@/data/muscles';

export type SelectionMode = 'muscle' | 'group';

export function getMuscle(muscleId: string) {
  return MUSCLES.find((m) => m.id === muscleId);
}

export function getGroupName(groupId: string): string | undefined {
  return MUSCLE_GROUPS.find((g) => g.id === groupId)?.name;
}

/**
 * Converte o toque do usuário nos ids de músculos do catálogo que ficam destacados.
 * - 'muscle': exatamente os ids da malha tocada (os dois lados do corpo acendem).
 * - 'group': todos os músculos do(s) mesmo(s) grupo(s), limitados aos que existem no modelo.
 */
export function resolveHighlight(
  selectedIds: readonly string[],
  mode: SelectionMode,
  available: readonly string[],
): Set<string> {
  if (mode === 'muscle') return new Set(selectedIds);

  const groupIds = new Set(
    selectedIds.map((id) => getMuscle(id)?.groupId).filter((g): g is string => g !== undefined),
  );
  return new Set(available.filter((id) => groupIds.has(getMuscle(id)?.groupId ?? '')));
}
