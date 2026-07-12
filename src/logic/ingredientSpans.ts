// 手順本文中の材料名を最長一致で探し、控えめな実線下線spanで包むためのマッチング
// (2026-07-12・docs/20 §7オーナー提案「材料にある食材は、手順で下線があると読みやすいかも。色はぬらない」)。
// Reactに依存しない純粋関数にして scripts/test-logic.mjs から直接検証できるようにする(termSplit.tsと同方針)。
//
// 用語辞書スパン・タイマーspanと重なる部分は、上位レイヤー(TermText→TimeText)が先に地の文から
// 切り出す。ここへは「辞書語でもタイマーでもない残りのテキスト」だけが渡るため、
// 「重なりはそちら優先・材料下線は残り部分だけ」という仕様は合成順で自然に満たされる。
import { normalizeIngredientChipLabel } from './mainIngredients'

export interface IngredientMatch {
  /** マッチした材料名(正規化済み) */
  text: string
  start: number
  end: number
}

/**
 * レシピの材料名を、下線マッチ用に正規化(括弧除去=表示チップと同じ)・空文字/重複除去し、
 * 長い名前から先に照合できるよう長さ降順で返す。
 * 例:「玉ねぎ(みじん切り)」→「玉ねぎ」。「生鮭」「甘塩鮭」→どちらも「鮭」。
 */
export function buildIngredientNames(ingredients: readonly { name: string }[]): string[] {
  const set = new Set<string>()
  for (const ing of ingredients) {
    const name = normalizeIngredientChipLabel(ing.name)
    if (name) set.add(name)
  }
  return [...set].sort((a, b) => b.length - a.length)
}

/**
 * テキスト中の材料名を最長一致・完全一致で走査する(termSplit.findTermMatchesと同じ走法)。
 * 一度マッチした範囲は次の探索開始位置にし、重なりは作らない。namesは長さ降順(buildIngredientNames)前提。
 * v1は完全一致のみ:「豚ロース薄切り肉」と手順の「豚肉」のような表記差は拾わない(拾えなくても実害なし)。
 */
export function findIngredientMatches(text: string, names: readonly string[]): IngredientMatch[] {
  if (names.length === 0) return []
  const matches: IngredientMatch[] = []
  let i = 0
  while (i < text.length) {
    let matched = false
    for (const name of names) {
      if (text.startsWith(name, i)) {
        matches.push({ text: name, start: i, end: i + name.length })
        i += name.length
        matched = true
        break
      }
    }
    if (!matched) i++
  }
  return matches
}
