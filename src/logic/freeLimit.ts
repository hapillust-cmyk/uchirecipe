import type { Recipe } from '../db/types'

/**
 * 無料版の登録件数制限。Pro販売手段の公開と同一リリースでtrueにする（それまでは寝かせる）。
 * ONにしても: 新規追加だけをブロックし、既存データの閲覧・編集・削除とバックアップ復元は
 * 絶対に制限しない（docs/08 2-4）。
 */
export const FREE_LIMIT_ENABLED = false
export const FREE_LIMIT = 50
export const FREE_LIMIT_WARNING_THRESHOLD = 45

/** 上限のカウント対象になる件数（isStarter=trueのスターター・配布セットは数えない） */
export function countFreeLimitRecipes(recipes: Recipe[]): number {
  return recipes.filter((r) => !r.isStarter).length
}

/** 新規追加をブロックすべきか（Pro解錠済みなら常にfalse） */
export function isAtFreeLimit(count: number, isPro: boolean): boolean {
  if (!FREE_LIMIT_ENABLED || isPro) return false
  return count >= FREE_LIMIT
}

/** 予告バナーを出すべきか（上限にはまだ達していないが近い） */
export function isNearFreeLimit(count: number, isPro: boolean): boolean {
  if (!FREE_LIMIT_ENABLED || isPro) return false
  return count >= FREE_LIMIT_WARNING_THRESHOLD && count < FREE_LIMIT
}
