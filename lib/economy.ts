/**
 * Regles economiques cote client (verifications instantanees pour l'UI).
 * La verite absolue reste toujours place_prediction() en SQL (supabase/security.sql) —
 * ces fonctions doivent rester identiques a la formule v_max_percent la-bas.
 */

export function getMaxStakePercent(level: number): number {
  return Math.min(0.15 + Math.floor((level - 1) / 5) * 0.02, 0.25)
}

export function getMaxStake(points: number, level: number): number {
  return Math.floor(points * getMaxStakePercent(level))
}
