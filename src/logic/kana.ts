import { INGREDIENT_READINGS } from './ingredientReadings'

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

/** 料理名・材料名・タグから検索用キーワード一覧を作る（保存時に呼ぶ） */
export function buildSearchWords(
  title: string,
  ingredients: ReadonlyArray<{ name: string }>,
  tags: readonly string[],
): string[] {
  const words = new Set<string>()
  for (const raw of [title, ...ingredients.map((i) => i.name), ...tags]) {
    const trimmed = raw.trim()
    if (trimmed) words.add(toHiragana(trimmed))
  }
  return [...words]
}
