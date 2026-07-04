import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { MealSlot } from './types'

export async function listMealPlanRange(startDate: string, endDate: string) {
  return db.mealPlans.where('date').between(startDate, endDate, true, true).toArray()
}

/** 指定期間の献立を取得するフック（変更されると自動で再描画） */
export function useMealPlanRange(startDate: string, endDate: string) {
  return useLiveQuery(() => listMealPlanRange(startDate, endDate), [startDate, endDate])
}

/** その日・その枠にレシピを割り当てる（既にあれば入れ替える） */
export async function assignMeal(date: string, slot: MealSlot, recipeId: number): Promise<void> {
  await db.transaction('rw', db.mealPlans, async () => {
    const existing = await db.mealPlans.where('[date+slot]').equals([date, slot]).first()
    if (existing) {
      await db.mealPlans.update(existing.id!, { recipeId })
    } else {
      await db.mealPlans.add({ date, slot, recipeId })
    }
  })
}

/** その日・その枠の割り当てを外す */
export async function clearMeal(date: string, slot: MealSlot): Promise<void> {
  const existing = await db.mealPlans.where('[date+slot]').equals([date, slot]).first()
  if (existing) await db.mealPlans.delete(existing.id!)
}
