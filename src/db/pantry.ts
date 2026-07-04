import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { toHiragana } from '../logic/kana'
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

/**
 * 買い物完了時に使う: その食材が在庫ボードに登録済みなら「ある」にする。
 * 登録されていない食材は勝手に追加しない（在庫ボードは自分で選んだものだけに保つ）。
 */
export async function markPantryHaveIfTracked(name: string): Promise<void> {
  const key = toHiragana(name.trim())
  if (!key) return
  const all = await db.pantryItems.toArray()
  const match = all.find((item) => toHiragana(item.name) === key)
  if (match) await db.pantryItems.update(match.id!, { level: 'have' })
}
