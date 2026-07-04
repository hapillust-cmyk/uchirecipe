import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { PantryLevel } from './types'

/** タップのたびに ある→少ない→ない→ある… と3段階を巡回する */
const nextLevel: Record<PantryLevel, PantryLevel> = {
  have: 'low',
  low: 'none',
  none: 'have',
}

export async function listPantryItems() {
  return db.pantryItems.orderBy('name').toArray()
}

/** 在庫ボードの一覧を取得するフック（変更されると自動で再描画） */
export function usePantryItems() {
  return useLiveQuery(listPantryItems, [])
}

/** 「よく使う食材」として登録する。既にあれば新規追加せず isFrequent を立てるだけ */
export async function addFrequentIngredient(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  const existing = await db.pantryItems.where('name').equalsIgnoreCase(trimmed).first()
  if (existing) {
    if (!existing.isFrequent) await db.pantryItems.update(existing.id!, { isFrequent: true })
    return
  }
  await db.pantryItems.add({ name: trimmed, level: 'none', isFrequent: true })
}

/** タップで3段階を切り替える */
export async function cyclePantryLevel(id: number): Promise<void> {
  const item = await db.pantryItems.get(id)
  if (!item) return
  await db.pantryItems.update(id, { level: nextLevel[item.level] })
}

/** 在庫ボードから食材を外す */
export async function removePantryItem(id: number): Promise<void> {
  await db.pantryItems.delete(id)
}
