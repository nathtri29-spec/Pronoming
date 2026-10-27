/**
 * Cotes communautaires (pari mutuel) cote client — pour l'affichage en
 * direct uniquement. La verite absolue reste toujours place_prediction()
 * en SQL (supabase/security.sql), qui recalcule la meme formule au moment
 * exact du pari : ces deux implementations doivent rester identiques.
 */

// Mise virtuelle de depart sur chaque equipe : evite une cote infinie/folle
// avant le premier vrai pari, et amortit les petites pools (peu de paris).
export const COMMUNITY_ODDS_SEED = 200

const MIN_ODDS = 1.05
const MAX_ODDS = 10

function clampOdds(value: number) {
  return Math.min(MAX_ODDS, Math.max(MIN_ODDS, value))
}

export function computeCommunityOdds(stakeA: number, stakeB: number) {
  const pool = COMMUNITY_ODDS_SEED * 2 + stakeA + stakeB

  return {
    oddsA: clampOdds(pool / (COMMUNITY_ODDS_SEED + stakeA)),
    oddsB: clampOdds(pool / (COMMUNITY_ODDS_SEED + stakeB)),
  }
}
