import type { PantryItem } from '../db/types'

/**
 * 「今あるもので作れる」検索に使う、在庫のある食材名の一覧。
 * 「ある」「少ない」を在庫ありとみなし、「ない」は含めない。
 */
export function pantryAvailableNames(items: PantryItem[]): string[] {
  return items.filter((item) => item.level !== 'none').map((item) => item.name)
}

/**
 * 買い物候補から除く食材名の一覧。
 * 「ある」だけを対象にする（「少ない」は買い足したいことがあるので候補に残す）。
 */
export function pantryHaveNames(items: PantryItem[]): string[] {
  return items.filter((item) => item.level === 'have').map((item) => item.name)
}
