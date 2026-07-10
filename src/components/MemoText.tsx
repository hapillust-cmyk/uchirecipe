/**
 * memo本文の表示用コンポーネント(R12・2026-07-11)。
 * 改行で行に分け、「・」で始まる行は箇条書きとして描画する。
 * ・をテキストに直置きすると、日本語の折り返し規則(・の直後で改行可)により
 * 「・」だけが行末に取り残されることがあるため、行頭記号を独立したboxにして
 * ぶら下げインデント付きで表示する。
 */
export function MemoText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  return (
    <div className={className}>
      {lines.map((line, i) =>
        line.startsWith('・') ? (
          // 中央揃えの文脈(調理中モード)でも箇条書きは左揃えで読ませる
          <p key={i} className="flex text-left">
            <span aria-hidden="true" className="shrink-0">
              ・
            </span>
            <span className="min-w-0 flex-1">{line.slice(1)}</span>
          </p>
        ) : (
          <p key={i}>{line}</p>
        ),
      )}
    </div>
  )
}
