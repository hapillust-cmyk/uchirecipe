// 調理中モードの読み上げ(SpeechSynthesis)用に、用語タップ辞書(src/data/cookingTerms.ts)の
// readingで表示テキストを置換した発話用文字列を作る(表示側のテキストは一切変えない)。
// 設計: docs/20_実装設計書_ウィンドウ後.md §2。
//
// マッチロジックはtermSplit.tsのfindTermMatches(辞書語の最長一致走査。長い表記から先に
// 照合し、一度マッチした範囲は重ねない)をそのまま流用する。用語タップ表示と発話置換で
// 「どこが辞書語か」の判定がズレないようにするため。
import { findTermMatches } from './termSplit'

/**
 * 辞書語をreadingに置換した発話用文字列を返す。
 * ・readingが無い語(例:「ガク」「わた」等、読み方に迷いが無い語)はそのまま素通しする
 * ・辞書語を含まないテキストは無加工で返す
 * ・誤読が報告されたら cookingTerms.ts の該当語にreadingを足す/直すだけで直る運用
 */
export function toSpeechText(text: string): string {
  const matches = findTermMatches(text)
  if (matches.length === 0) return text

  let result = ''
  let cursor = 0
  for (const match of matches) {
    result += text.slice(cursor, match.start)
    result += match.term.reading ?? match.text
    cursor = match.end
  }
  result += text.slice(cursor)
  return result
}
