// 読点優先・幅実測の行組みエンジン(2026-07-21 p9/line-compose)。
//
// 【なぜ作るか】従来の改行は wrapJaPhrases() が文節境界にゼロ幅スペースを挿し、
// どこで折るかはブラウザ任せだった。この方式はブラウザが「詰め込み最優先」でしか
// 折れず、「読点で行を終える」美観を作れない・実機iOS Safariと検証用WebKitで折り位置が
// 食い違う、という原理的限界に達した(docs/32 §8)。そこで折り位置そのものを自前で決める。
//
// 【設計】DOM非依存の純ロジック。入力=アトム列 + 最大幅 + 幅測定関数。出力=行ごとのアトム列。
// アトム = テキスト(可分割) | atom(タイマーボタン・用語スパン等の分割不能な箱、実測幅つき)。
// アルゴリズム(句優先グリーディ):
//   1. テキストを「、」「。」の直後で句(clause)に割る(句読点は句の末尾に残す)。改行\nは強制改行。
//   2. 句が丸ごと行に載るなら載せる(1行に複数句可)。残り幅に入らない句は、新しい行に丸ごと
//      入るなら改行してから置く(=詰め込まない。これが読点優先の本体)。
//   3. 句がまるまる1行にも入らない長さのときだけ、句の内部を wrapJaPhrases() の文節ユニットで
//      グリーディに充填する(このときだけ従来と同じ折り方)。
//   4. ・列挙(「・みりん」等)は句内部充填時に wrapJaPhrases のユニットのまま扱う。
// タイマーボタン(直前後の結合文節ごと箱にする)や用語スパンは分割不能な atom として扱い、
// 箱の中身・結合規則(splitAroundTimeToken 等)には一切手を入れない。行への割り付けだけを決める。
import { wrapJaPhrases, ZWSP } from './jaWrap'

/** 行組みエンジンを使うか。false にすると呼び出し側は従来の ZWSP 描画にフォールバックする */
export const LINE_COMPOSE_ENABLED = true

/** 入力アトム。text=可分割テキスト / atom=分割不能な箱(width は実測px、text は復元・検証用) */
export type ComposeAtom =
  | { kind: 'text'; text: string }
  | { kind: 'atom'; id: string; width: number; text?: string }

/** テキスト1本の描画幅を返す測定関数(canvas measureText 等) */
export type MeasureText = (text: string) => number

/** 出力: 行を構成する断片。text=テキストラン / atom=箱(id で実ノードを引く) */
export type LinePiece =
  | { kind: 'text'; text: string }
  | { kind: 'atom'; id: string; text?: string }

export type ComposeOptions = {
  /** 測定誤差の許容(px)。テストでは 0 を渡して 1文字=1幅 の整数判定にする */
  eps?: number
}

type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'atom'; id: string; width: number; text?: string }

type Clause = { pieces: Piece[]; hardBreakBefore: boolean }

// 折返しの最小単位。文節境界と文節境界の間の1まとまり。テキストと箱が混在しうる
// (例: 「こんにゃく+[2分ほど]」や「[下茹で]+して」が1ユニットになりうる)。
type Unit = { parts: LinePiece[]; width: number }

/**
 * アトム列を句(clause)へ割る。「、」「。」の直後が句の切れ目・\n は強制改行。
 * atom(箱)は句の切れ目にはならず、その時点の句に属する(タイマーは句の途中に居られる)。
 */
function toClauses(atoms: ComposeAtom[]): Clause[] {
  const clauses: Clause[] = []
  let cur: Piece[] = []
  let pendingHardBreak = false
  const flush = () => {
    if (cur.length > 0) {
      clauses.push({ pieces: cur, hardBreakBefore: pendingHardBreak })
      cur = []
      pendingHardBreak = false
    }
  }
  for (const atom of atoms) {
    if (atom.kind === 'atom') {
      cur.push({ kind: 'atom', id: atom.id, width: atom.width, text: atom.text })
      continue
    }
    let buf = ''
    for (const ch of atom.text) {
      if (ch === '\n') {
        if (buf) {
          cur.push({ kind: 'text', text: buf })
          buf = ''
        }
        flush()
        pendingHardBreak = true
        continue
      }
      buf += ch
      if (ch === '、' || ch === '。') {
        cur.push({ kind: 'text', text: buf })
        buf = ''
        flush()
      }
    }
    if (buf) cur.push({ kind: 'text', text: buf })
  }
  flush()
  return clauses
}

/**
 * 句を文節ユニット列に展開する。
 * 文節境界は「句の全文(箱の中身も込みで連結した文字列)」に wrapJaPhrases をかけて求める。
 * こうすると、用語スパンやタイマーが句の途中に挟まっても「下茹でして」のような文節の
 * まとまりが失われない(箱ごとに wrapJaPhrases を分割呼び出しすると、直後の「して」が
 * 次の文節へ吸収されて泣き別れる。実測で確認済み・受け入れ基準1の要)。
 * そのうえで箱(atom)の内部に落ちた境界だけ取り除き、箱を割らないようにする。
 * 各ユニットはテキスト片と箱片が混在しうる(例: 「こんにゃく」+「[2分ほど]」)。
 */
function clauseUnits(clause: Clause, measure: MeasureText): Unit[] {
  const pieceText = (p: Piece) => (p.kind === 'text' ? p.text : (p.text ?? ''))
  const full = clause.pieces.map(pieceText).join('')
  if (full === '') return []

  // 1) 句の全文に対する文節境界(char offset)の集合
  const boundaries = new Set<number>([0, full.length])
  let off = 0
  for (const u of wrapJaPhrases(full).split(ZWSP)) {
    off += u.length
    boundaries.add(off)
  }

  // 2) 各ピースの char 範囲を求め、箱の内部に落ちた境界は取り除く(箱を割らない)
  const ranges: { piece: Piece; start: number; end: number }[] = []
  let cursor = 0
  for (const p of clause.pieces) {
    const len = pieceText(p).length
    ranges.push({ piece: p, start: cursor, end: cursor + len })
    cursor += len
  }
  for (const r of ranges) {
    if (r.piece.kind !== 'atom') continue
    for (const b of [...boundaries]) if (b > r.start && b < r.end) boundaries.delete(b)
  }

  // 3) 隣り合う境界の間を1ユニットにする。各ユニットは重なるピース片(テキスト/箱)を順に持つ
  const sorted = [...boundaries].sort((a, b) => a - b)
  const units: Unit[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (b <= a) continue
    const parts: LinePiece[] = []
    let width = 0
    for (const r of ranges) {
      const s = Math.max(a, r.start)
      const e = Math.min(b, r.end)
      if (s >= e) continue
      if (r.piece.kind === 'atom') {
        parts.push({ kind: 'atom', id: r.piece.id, text: r.piece.text })
        width += r.piece.width
      } else {
        const txt = full.slice(s, e)
        parts.push({ kind: 'text', text: txt })
        width += measure(txt)
      }
    }
    if (parts.length > 0) units.push({ parts, width })
  }
  return units
}

/**
 * アトム列を最大幅 maxWidth に収まる行の列へ組む。measure はテキストの実幅を返す。
 * 戻り値は行ごとの LinePiece 列。DOM 非依存・純関数。
 */
export function composeLines(
  atoms: ComposeAtom[],
  maxWidth: number,
  measure: MeasureText,
  opts: ComposeOptions = {},
): LinePiece[][] {
  const eps = opts.eps ?? 0.5
  const clauses = toClauses(atoms)

  const lines: LinePiece[][] = [[]]
  let cur = 0 // 現在行の使用幅

  const lastLine = () => lines[lines.length - 1]
  const newLine = () => {
    lines.push([])
    cur = 0
  }
  const push = (u: Unit) => {
    for (const part of u.parts) lastLine().push(part)
    cur += u.width
  }

  for (const clause of clauses) {
    const units = clauseUnits(clause, measure)
    if (units.length === 0) continue
    const cw = units.reduce((s, u) => s + u.width, 0)

    if (clause.hardBreakBefore && lastLine().length > 0) newLine()

    const lineHasContent = lastLine().length > 0
    const remaining = maxWidth - cur

    if (lineHasContent && cw <= remaining + eps) {
      // 句が現在行の残り幅に丸ごと収まる → そのまま同じ行に足す(複数句1行)
      for (const u of units) push(u)
    } else if (cw <= maxWidth + eps) {
      // 残りには入らないが、新しい行になら丸ごと入る → 詰め込まず改行してから置く(読点優先の本体)
      if (lineHasContent) newLine()
      for (const u of units) push(u)
    } else {
      // 1行にも入らない長い句 → ここだけ従来同様に文節ユニットでグリーディ充填する
      for (const u of units) {
        if (lastLine().length > 0 && u.width > maxWidth - cur + eps) newLine()
        push(u)
      }
    }
  }

  if (lines.length > 1 && lastLine().length === 0) lines.pop()
  return lines
}

/** 1行(LinePiece列)を文字列へ復元する(テスト・コピー用途。atom は text を使う) */
export function lineToText(line: LinePiece[]): string {
  return line.map((p) => (p.kind === 'text' ? p.text : (p.text ?? ''))).join('')
}
