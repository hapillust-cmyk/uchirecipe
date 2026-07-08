import { INGREDIENT_READINGS } from './ingredientReadings'
import { isSeasoningLike } from './mainIngredients'

/**
 * 検索の「ゆらぎ」対策。
 * 「タマネギ」と「たまねぎ」のようなカタカナ⇄ひらがなの表記ゆれ、
 * 「玉ねぎ」と「たまねぎ」のような漢字⇄ひらがなの表記ゆれ（食材名辞書ベース）
 * を吸収する。目的は「正しい読み」ではなく「同じ食材が同じキーに収束すること」。
 *
 * 制限: 辞書（src/logic/ingredientReadings.ts）に無い漢字表記は変換されない。
 * 網羅は狙っておらず、ユーザーから報告があった食材を辞書に追記していく運用。
 * それまでは同じ食材を同じ表記で登録することで回避できる。
 */

// 辞書キーを長い順に並べた正規表現を1度だけ構築する（module scope）。
// 長い順にすることで「大根」が「切干大根」等より先に食われる事故を防ぎ、
// 1パスの置換にすることで置換結果への再置換（連鎖置換）を防ぐ。
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
const readingKeys = Object.keys(INGREDIENT_READINGS).sort((a, b) => b.length - a.length)
const readingPattern =
  readingKeys.length > 0 ? new RegExp(readingKeys.map(escapeRegExp).join('|'), 'g') : null

/** カタカナをひらがなに変換し、全角英数を半角化・小文字化した上で食材名辞書を適用する */
export function toHiragana(input: string): string {
  const normalized = input
    .normalize('NFKC') // 全角英数・記号を半角に揃える
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    )
  if (!readingPattern) return normalized
  return normalized.replace(readingPattern, (matched) => INGREDIENT_READINGS[matched])
}

/**
 * 料理名・材料名・タグから検索用キーワード一覧を作る（保存時に呼ぶ）。
 *
 * 調味料的な材料（大さじ/小さじ/単位なし/「少々」等。isSeasoningLikeと同じ基準）は
 * 検索語に含めない。「鮭（さけ）」で検索すると調味料の「酒（さけ）」を使うレシピが
 * 大量にヒットする誤爆の対策（2026-07-09 ペルソナテスト第1波）。
 * タイトル・タグ・主材料での検索はこれまで通り。
 */
export function buildSearchWords(
  title: string,
  ingredients: ReadonlyArray<{ name: string; amount: string; unit: string }>,
  tags: readonly string[],
): string[] {
  const words = new Set<string>()
  const mainNames = ingredients.filter((ing) => !isSeasoningLike(ing)).map((ing) => ing.name)
  for (const raw of [title, ...mainNames, ...tags]) {
    const trimmed = raw.trim()
    if (trimmed) words.add(toHiragana(trimmed))
  }
  return [...words]
}
