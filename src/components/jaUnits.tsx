import { Fragment, type ReactNode } from 'react'
import { wrapJaPhrases, ZWSP } from '../logic/jaWrap'
import { findIngredientMatches, type IngredientMatch } from '../logic/ingredientSpans'

// 材料名の下線(docs/20 §7)。文字色は本文のまま・背景なし維持で、下線の色だけink-mutedトークンの
// 淡色にする(2026-07-13 UIペルソナQA: タップ可能な用語=アクセント点線との視覚序列を作る狙い。
// 用語辞書の点線・タイマーの塗りとは引き続き区別)。
// spanはdisplay:inlineのまま = keep-all下でも前後が改行点にならず、改行制御に影響しない。
// (atomic inline化=inline-block/inline-flex/button等にすると改行が壊れる。TermText.tsxの轍を参照)
const UNDERLINE_CLASS =
  'underline decoration-solid decoration-2 underline-offset-2 decoration-ink-muted/50'

// 開き括弧を含む短い単位はnowrapスパンで守る(WebKitがkeep-all下でも括弧直後で折るため)。
const needsSpan = (u: string) => /[（(]/.test(u) && u.length <= 12

/**
 * ZWSP区切り済み文字列(wrapJaPhrasesの出力)を描画ノードにする。
 * 「（」で始まる単位はnowrapスパンで包む: WebKitはword-break:keep-allの下でも
 * 全角開き括弧の直後を改行可能として扱うため、「〜にする（/レンジ600Wで…」のように
 * 開き括弧が行末に取り残される(行末禁則違反)。ZWSP・WORD JOINERでは防げないことを
 * プローブで確認済み(2026-07-12・Chromiumは正しく括弧の前で折る)。
 * nowrapスパン(atomic inline)は前後が改行点になるが、単位境界はもともと改行点なので無害。
 */
export function wrappedToNodes(wrapped: string): ReactNode {
  // 開き括弧を「含む」単位すべてが対象: WebKitはkeep-allの下でも括弧の直後を
  // 改行可能として扱うため、「すだち(またはレモン)を」のような結合済み単位の
  // 内部でも折れてしまう(2026-07-12実機で確認)。12文字以下ならまるごとnowrapで守る
  if (!wrapped.split(ZWSP).some(needsSpan)) return wrapped
  const nodes: ReactNode[] = []
  wrapped.split(ZWSP).forEach((u, i) => {
    if (i > 0) nodes.push(ZWSP)
    nodes.push(
      needsSpan(u) ? (
        <span key={i} className="whitespace-nowrap">
          {u}
        </span>
      ) : (
        u
      ),
    )
  })
  return nodes
}

/**
 * ZWSPを含まない素のテキスト中の材料名だけを、控えめな実線下線のインラインspanで包む。
 * matchesはtext先頭を0とした座標。タイマー結合部(bondPrev/bondNext)のような
 * 折返し不可の短い断片に使う(単位分割は不要)。
 */
function underlineRange(
  text: string,
  matches: readonly IngredientMatch[],
  base: number,
  keyBase: string,
): ReactNode {
  const end = base + text.length
  const local = matches.filter((m) => m.start < end && m.end > base)
  if (local.length === 0) return text
  const nodes: ReactNode[] = []
  let cur = base
  local.forEach((m, i) => {
    const s = Math.max(m.start, base)
    const e = Math.min(m.end, end)
    if (s > cur) nodes.push(text.slice(cur - base, s - base))
    nodes.push(
      <span key={`${keyBase}-${i}`} className={UNDERLINE_CLASS}>
        {text.slice(s - base, e - base)}
      </span>,
    )
    cur = e
  })
  if (cur < end) nodes.push(text.slice(cur - base))
  return nodes
}

/**
 * ZWSP区切り済み文字列を描画しつつ、材料名(names)を控えめな下線spanで包む。
 * 改行の要は wrapJaPhrases が挿したZWSPと括弧nowrapスパンで、ここはそれを一切動かさない
 * (ZWSP位置・nowrap単位はそのまま。追加するのはdisplay:inlineの下線spanだけ)ので、
 * 材料マッチが無い/namesが空なら wrappedToNodes と完全に同じ出力になる(改行回帰ゼロ)。
 */
export function renderWrapped(wrapped: string, names?: readonly string[]): ReactNode {
  if (!names || names.length === 0) return wrappedToNodes(wrapped)
  const original = wrapped.split(ZWSP).join('')
  const matches = findIngredientMatches(original, names)
  if (matches.length === 0) return wrappedToNodes(wrapped)

  const nodes: ReactNode[] = []
  let offset = 0
  wrapped.split(ZWSP).forEach((u, i) => {
    if (i > 0) nodes.push(ZWSP)
    if (needsSpan(u)) {
      // 括弧nowrap単位はそのまま守る(材料名は括弧除去済みなので通常ここには重ならない)
      nodes.push(
        <span key={`nw-${i}`} className="whitespace-nowrap">
          {u}
        </span>,
      )
    } else {
      nodes.push(<Fragment key={`u-${i}`}>{underlineRange(u, matches, offset, `u${i}`)}</Fragment>)
    }
    offset += u.length
  })
  return nodes
}

/** ZWSPを含まない素のテキスト中の材料名を下線spanで包む(タイマー結合部bondPrev/bondNext用) */
export function underlineIngredients(
  text: string,
  names?: readonly string[],
  keyBase = 'ing',
): ReactNode {
  if (!text || !names || names.length === 0) return text
  return underlineRange(text, findIngredientMatches(text, names), 0, keyBase)
}

/**
 * テキストを文節折返し済みの描画ノードにする(wrapJaPhrases+wrappedToNodes)。
 * names(そのレシピの材料名)を渡すと、手順本文の材料名を控えめな下線spanで包む(docs/20 §7)。
 */
export function renderJaUnits(text: string, names?: readonly string[]): ReactNode {
  return renderWrapped(wrapJaPhrases(text), names)
}
