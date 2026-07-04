import type { Recipe } from '../db/types'

/** 直近 days 日以内に「作った」記録があれば true（cookedLogs[0] が最新の前提） */
export function cookedWithinDays(recipe: Recipe, days: number): boolean {
  const last = recipe.cookedLogs[0]?.date
  if (!last) return false
  const elapsed = Date.now() - new Date(last).getTime()
  return elapsed < days * 24 * 60 * 60 * 1000
}
