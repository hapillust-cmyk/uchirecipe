import { Fragment, type ReactNode } from 'react'
import { Timer as TimerIcon } from 'lucide-react'
import { findTimeTokens } from '../logic/time'
import { splitAroundTimeToken, ZWSP } from '../logic/jaWrap'
import { renderJaUnits, wrappedToNodes } from './jaUnits'
import { ja } from '../i18n/ja'

type Props = {
  text: string
  /** 時間表記をタップしたときに呼ばれる（タイマー開始） */
  onStart: (tokenText: string, seconds: number) => void
}

/**
 * 手順の文章を表示し、「10分」「1時間半」などの時間表記だけを
 * タップできるボタンに変える。文章部分はBudouXで文節折返しにする。
 * タイマーボタンは直前の短い文節(「中火で」「レンジで」等)・直後の文節と
 * ひとかたまりにし、その境界で折り返さない(2026-07-11オーナー指摘)。
 */
export default function TimeText({ text, onStart }: Props) {
  const tokens = findTimeTokens(text)
  if (tokens.length === 0) return <>{renderJaUnits(text)}</>

  const parts: ReactNode[] = []
  let cursor = 0
  tokens.forEach((token, i) => {
    const before = text.slice(cursor, token.start)
    const afterEnd = i + 1 < tokens.length ? tokens[i + 1].start : text.length
    const after = text.slice(token.start + token.text.length, afterEnd)
    const { pre, bondPrev, bondNext, post } = splitAroundTimeToken(
      before,
      after,
      token.text.trim().length,
    )

    // nowrapスパンはatomic inline扱いになり、keep-allでも前後が無条件の改行点になる。
    // ZWSPを挟まないと逆に前のテキストと癒着して巨大な折返し不能塊ができる
    // (「あくを取りながら中火で15分煮る。」が一塊になる実バグ・2026-07-12プローブで確認)
    if (pre) parts.push(<Fragment key={`pre-${i}`}>{wrappedToNodes(pre)}</Fragment>, ZWSP)
    parts.push(
      <span key={i} className="whitespace-nowrap">
        {bondPrev}
        <button
          type="button"
          onClick={() => onStart(token.text.trim(), token.seconds)}
          aria-label={`${token.text.trim()} ${ja.timer.start}`}
          className="inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-bold text-accent underline underline-offset-2"
          style={{ background: 'color-mix(in oklab, var(--accent) 10%, var(--bg))' }}
        >
          <TimerIcon size={16} aria-hidden />
          {token.text.trim()}
        </button>
        {bondNext}
      </span>,
    )
    if (post) parts.push(ZWSP, <Fragment key={`post-${i}`}>{wrappedToNodes(post)}</Fragment>)
    cursor = afterEnd
  })

  return <>{parts}</>
}
