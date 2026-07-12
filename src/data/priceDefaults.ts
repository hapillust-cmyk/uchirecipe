/**
 * 食材価格マスタの初期値（頻出30食材の目安価格）。
 * 一般的なスーパーの相場を基準にした「常識的な水準」の目安であり、地域・店舗・時期で
 * 実際の価格とはズレる。ユーザーはいつでも「食材と価格」画面から書き換え・削除できる
 * （db/prices.ts の seedPriceDefaultsIfNeeded が初回起動時に1度だけ投入する）。
 *
 * unit は「数量＋単位」の自由記述（例:「100g」「1個」）。logic/priceEstimate.ts が
 * 数量として解釈できる場合（例:「100g」)のみ、レシピの分量に応じた按分計算に使う。
 * 「1/4個」のような解釈できない書式は、そのままの金額を1行分の目安として使う（按分なし）。
 */
export interface PriceDefaultItem {
  name: string
  pricePerUnit: number
  unit: string
}

export const PRICE_DEFAULTS: PriceDefaultItem[] = [
  // 野菜
  { name: '玉ねぎ', pricePerUnit: 50, unit: '1個' },
  { name: 'にんじん', pricePerUnit: 40, unit: '1本' },
  { name: 'じゃがいも', pricePerUnit: 40, unit: '1個' },
  { name: 'キャベツ', pricePerUnit: 130, unit: '1/4個' },
  { name: '白菜', pricePerUnit: 150, unit: '1/4個' },
  { name: '大根', pricePerUnit: 100, unit: '1/2本' },
  { name: 'もやし', pricePerUnit: 30, unit: '1袋' },
  { name: 'きゅうり', pricePerUnit: 40, unit: '1本' },
  { name: 'トマト', pricePerUnit: 60, unit: '1個' },
  { name: 'ピーマン', pricePerUnit: 30, unit: '1個' },
  { name: 'なす', pricePerUnit: 50, unit: '1本' },
  { name: 'ねぎ', pricePerUnit: 100, unit: '1本' },
  { name: 'ほうれん草', pricePerUnit: 100, unit: '1束' },
  { name: 'しめじ', pricePerUnit: 100, unit: '1パック' },
  { name: 'えのき', pricePerUnit: 80, unit: '1袋' },
  // 肉
  { name: '鶏もも肉', pricePerUnit: 130, unit: '100g' },
  { name: '鶏むね肉', pricePerUnit: 90, unit: '100g' },
  { name: '豚バラ肉', pricePerUnit: 150, unit: '100g' },
  { name: '豚こま切れ肉', pricePerUnit: 110, unit: '100g' },
  { name: '牛こま切れ肉', pricePerUnit: 200, unit: '100g' },
  { name: '合いびき肉', pricePerUnit: 130, unit: '100g' },
  // 魚介
  { name: '鮭', pricePerUnit: 120, unit: '1切れ' },
  { name: 'さば', pricePerUnit: 100, unit: '1切れ' },
  // 卵・乳製品・豆腐
  { name: '卵', pricePerUnit: 25, unit: '1個' },
  { name: '牛乳', pricePerUnit: 200, unit: '1L' },
  { name: 'バター', pricePerUnit: 250, unit: '200g' },
  { name: '豆腐', pricePerUnit: 40, unit: '1丁' },
  // 主食・調味料
  { name: '米', pricePerUnit: 60, unit: '1合' },
  { name: 'しょうゆ', pricePerUnit: 20, unit: '大さじ1' },
  { name: 'みそ', pricePerUnit: 15, unit: '大さじ1' },
]
