import { db } from './db'
import type { SetExclusion } from './types'

/**
 * 削除した配布セット由来レシピの「再取込除外」記録（トゥームストーン）のDB操作。
 * 記録の追加はレシピ削除処理（db/recipes.ts の deleteRecipe）が行い、
 * 取込時の照合は logic/backup.ts の importRecipeSet が行う（2026-07-13 Fable設計）
 */

/** 全除外記録（設定のテーマ一覧でセットごとの除外中件数を出すのに使う） */
export async function listSetExclusions(): Promise<SetExclusion[]> {
  return db.setExclusions.toArray()
}

/**
 * 指定セットの除外記録をすべて消す（テーマ一覧の「除外中◯品・すべて戻す」）。
 * 消した後にそのテーマを取り込み直すと、削除していた品が戻る。削除した記録数を返す
 */
export async function clearSetExclusions(setId: string): Promise<number> {
  return db.setExclusions.where('setId').equals(setId).delete()
}
