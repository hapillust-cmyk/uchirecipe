import type { Ingredient } from '../db/types'
import { normalizeDigits } from './amount'

/**
 * 概算食費計算: レシピの「材料ごとの価格入力」(Ingredient.price)を優先し、
 * 未入力の材料だけ食材価格マスタ(PriceEntry)で補うフォールバック計算。
 * 優先度: レシピ個別入力 > マスタ一致 > なし（docs/20 実装設計書 §3）。
 */

/** 材料名の表示正規化: 括弧書き（全角/半角どちらも）を落として前後の空白を削る */
export function normalizeIngredientNameForPrice(name: string): string {
  return name
    .trim()
    .replace(/[（(][^）)]*[）)]/g, '')
    .trim()
}

/** マスタ照合用に正規化・整形済みの1件 */
export interface PriceIndexEntry {
  normalizedName: string
  pricePerUnit: number
  unit: string
  /**
   * マスタ行が投入時の目安価格のままか(true)、ユーザーが価格・単位を上書きしたか(false)。
   * db/prices.tsのPriceEntry.isDefaultと同じ意味（未設定は「安全側」でfalse扱い。2026-07-13追加）
   */
  isDefault: boolean
}

/**
 * PriceEntry配列から照合用の索引を作る。
 * 正規化名が長いものを先に並べる（前方一致で複数ヒットしたとき、より具体的な名前を優先するため）。
 */
export function buildPriceIndex(
  entries: { name: string; pricePerUnit: number; unit: string; isDefault?: boolean }[],
): PriceIndexEntry[] {
  return entries
    .map((e) => ({
      normalizedName: normalizeIngredientNameForPrice(e.name),
      pricePerUnit: e.pricePerUnit,
      unit: e.unit,
      isDefault: e.isDefault === true,
    }))
    .filter((e) => e.normalizedName && e.pricePerUnit > 0)
    .sort((a, b) => b.normalizedName.length - a.normalizedName.length)
}

/**
 * 材料名からマスタの1件を探す。
 * 1) 正規化後の完全一致 → 2) 材料名がマスタ名で始まる前方一致（例:「たまねぎ薄切り」→「たまねぎ」）
 * の順で照合する（表示正規化=括弧除去後の名前で前方一致程度の緩さ）。
 */
export function matchPriceEntry(name: string, index: PriceIndexEntry[]): PriceIndexEntry | undefined {
  const normalized = normalizeIngredientNameForPrice(name)
  if (!normalized) return undefined
  const exact = index.find((e) => e.normalizedName === normalized)
  if (exact) return exact
  return index.find((e) => normalized.startsWith(e.normalizedName))
}

/** "200" "1.5" "1/2" のような数字の分量を数値化する（人数換算不要の素の値） */
function parseNumericAmount(amount: string): number | undefined {
  const trimmed = normalizeDigits(amount.trim())
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?$/)
  if (!match) return undefined
  let value = Number.parseFloat(match[1])
  const denominator = match[2] ? Number.parseFloat(match[2]) : undefined
  if (denominator) {
    if (denominator === 0) return undefined
    value /= denominator
  }
  return value
}

/**
 * マスタの unit（例:「100g」「1個」）を数量と単位に分解する。
 * 先頭が数字でなければ解釈できないので、qty=1・baseUnit=元の文字列のまま返す
 * （後続の按分計算では ingredient.unit と一致しない限り使われないので実害はない）。
 */
function parseUnitQuantity(unit: string): { qty: number; baseUnit: string } {
  const trimmed = normalizeDigits(unit.trim())
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return { qty: 1, baseUnit: trimmed }
  const qty = Number.parseFloat(match[1])
  const baseUnit = match[2].trim()
  return { qty: qty > 0 ? qty : 1, baseUnit: baseUnit || trimmed }
}

/** マスタ行が投入時の目安のままか(default)、ユーザーが上書きした価格か(user)の由来種別 */
export type PriceSource = 'default' | 'user'

/** マスタ由来の1行分の見積もり（金額＋由来種別。2026-07-13 UIペルソナQA: 表示側の「目安」表記の出し分けに使う） */
export interface IngredientPriceEstimate {
  yen: number
  source: PriceSource
}

/**
 * マスタ一致した材料1行分の金額を見積もる。
 * ingredientの分量・単位がマスタのunitと数量として噛み合えば按分計算し、
 * 噛み合わない（「少々」等の非数値・単位不一致・マスタ側が「1/4個」等で解釈不能）場合は
 * マスタの金額をそのまま1行分の目安として使う（按分できないだけで、値自体は常識的な範囲）。
 * sourceは一致したマスタ行がisDefaultのままか(user='default')、ユーザーが上書き済みか('user')を表す。
 */
export function estimateIngredientYen(
  ingredient: Pick<Ingredient, 'name' | 'amount' | 'unit'>,
  index: PriceIndexEntry[],
): IngredientPriceEstimate | undefined {
  const entry = matchPriceEntry(ingredient.name, index)
  if (!entry) return undefined
  const { qty: baseQty, baseUnit } = parseUnitQuantity(entry.unit)
  const ingUnit = (ingredient.unit ?? '').trim()
  const amountNum = parseNumericAmount(ingredient.amount ?? '')
  const source: PriceSource = entry.isDefault ? 'default' : 'user'
  if (amountNum != null && amountNum > 0 && ingUnit && baseUnit && ingUnit === baseUnit) {
    return { yen: Math.round(entry.pricePerUnit * (amountNum / baseQty)), source }
  }
  return { yen: entry.pricePerUnit, source }
}

/** レシピ1品分の概算食費（材料ごとの内訳を集計した結果） */
export interface RecipeCostEstimate {
  /** 円換算の合計（レシピ登録時の基準人数分） */
  total: number
  /** マスタ価格で補完した材料の件数（0件なら注記は不要） */
  fromMasterCount: number
  /** 価格情報（個別入力・マスタ一致のどちらか）が1件でもあるか */
  hasAnyPriceInfo: boolean
}

/**
 * 材料一覧から概算食費を計算する。優先度: 個別入力(price) > マスタ一致 > なし。
 * RecipeDetailPage（1レシピの概算食費）・MealPlanPage（週の概算食費の合算）の両方から使う。
 */
export function estimateRecipeCost(
  ingredients: Pick<Ingredient, 'name' | 'amount' | 'unit' | 'price'>[],
  index: PriceIndexEntry[],
): RecipeCostEstimate {
  let total = 0
  let fromMasterCount = 0
  let hasAnyPriceInfo = false
  for (const ing of ingredients) {
    if (ing.price != null && ing.price > 0) {
      total += ing.price
      hasAnyPriceInfo = true
      continue
    }
    const estimated = estimateIngredientYen(ing, index)
    if (estimated != null && estimated.yen > 0) {
      total += estimated.yen
      fromMasterCount++
      hasAnyPriceInfo = true
    }
  }
  return { total, fromMasterCount, hasAnyPriceInfo }
}
