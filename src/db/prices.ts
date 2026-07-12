import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { defaultSettings } from './types'
import type { PriceEntry } from './types'
import { PRICE_DEFAULTS } from '../data/priceDefaults'

/**
 * 初回起動時だけ、頻出食材の目安価格（PRICE_DEFAULTS）を食材価格マスタに投入する。
 * 既に投入済み、またはマスタに何か登録済みなら何もしない（pantry.tsのプリセット投入と同じ方式）。
 */
export async function seedPriceDefaultsIfNeeded(): Promise<void> {
  await db.transaction('rw', db.prices, db.settings, async () => {
    const settings = { ...defaultSettings, ...(await db.settings.get(1)) }
    if (settings.priceMasterSeeded) return
    const existingCount = await db.prices.count()
    if (existingCount === 0) {
      const now = Date.now()
      await db.prices.bulkAdd(PRICE_DEFAULTS.map((item) => ({ ...item, updatedAt: now })))
    }
    await db.settings.put({ ...settings, priceMasterSeeded: true, id: 1 })
  })
}

/** 登録順（id順）で一覧を返す */
export async function listPriceEntries(): Promise<PriceEntry[]> {
  const items = await db.prices.toArray()
  return items.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
}

/** 食材価格マスタの一覧を取得するフック（変更されると自動で再描画） */
export function usePriceEntries() {
  return useLiveQuery(listPriceEntries, [])
}

/** 新規追加。名前・単位が空、または価格が0以下なら何もしない */
export async function addPriceEntry(name: string, pricePerUnit: number, unit: string): Promise<void> {
  const trimmedName = name.trim()
  const trimmedUnit = unit.trim()
  if (!trimmedName || !trimmedUnit || !(pricePerUnit > 0)) return
  await db.prices.add({ name: trimmedName, pricePerUnit, unit: trimmedUnit, updatedAt: Date.now() })
}

/** 既存の1件を編集内容で置き換える */
export async function updatePriceEntry(
  id: number,
  patch: { name: string; pricePerUnit: number; unit: string },
): Promise<void> {
  const trimmedName = patch.name.trim()
  const trimmedUnit = patch.unit.trim()
  if (!trimmedName || !trimmedUnit || !(patch.pricePerUnit > 0)) return
  await db.prices.update(id, {
    name: trimmedName,
    pricePerUnit: patch.pricePerUnit,
    unit: trimmedUnit,
    updatedAt: Date.now(),
  })
}

export async function removePriceEntry(id: number): Promise<void> {
  await db.prices.delete(id)
}
