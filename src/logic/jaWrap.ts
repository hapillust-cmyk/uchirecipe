// 日本語の折返し位置を文節のまとまりに揃える(BudouX・2026-07-11オーナー要望)。
// 「混ぜ合わ/せ」のような単語の途中切りを防ぎ、「混ぜ合わせ、/器に盛る」のように折り返す。
// 使い方: wrapJaPhrases()で文節境界にゼロ幅スペースを挿し、表示側の要素に
// .ja-phrase クラス(word-break: keep-all + overflow-wrap: anywhere)を付ける。
// keep-allで文節内の分断を禁じ、ゼロ幅スペースが折返し可能点になる。
// 句読点は文節末尾に付くため「、」「。」が行頭に来る禁則違反も起きない。
import { loadDefaultJapaneseParser } from 'budoux'

const parser = loadDefaultJapaneseParser()

export const ZWSP = '\u200b'

/** 文節境界にゼロ幅スペースを挿入する(見た目・検索データは不変。表示専用) */
export function wrapJaPhrases(text: string): string {
  if (!text || text.length < 8) return text
  return parser.parse(text).join(ZWSP)
}
