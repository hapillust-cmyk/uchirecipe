import { useState } from 'react'
import { Plus, X, Refrigerator } from 'lucide-react'
import { usePantryItems, addFrequentIngredient, cyclePantryLevel, removePantryItem } from '../db/pantry'
import type { PantryLevel } from '../db/types'
import { ja } from '../i18n/ja'

/** 3段階それぞれの見た目（デザイントークンのみ使用。新しい色相は増やさない） */
function levelClass(level: PantryLevel): string {
  if (level === 'have') return 'border-accent bg-accent text-app'
  if (level === 'low') return 'border-accent text-accent bg-app'
  return 'border-edge text-ink-muted bg-surface'
}

/**
 * 在庫ボード: よく使う食材をチップで並べ、タップで「ある→少ない→ない」を切り替える。
 * 数量は数えないので、棚卸しは数秒で終わる。
 */
export default function PantryBoard() {
  const items = usePantryItems()
  const [text, setText] = useState('')

  const add = () => {
    const value = text.trim()
    if (value) void addFrequentIngredient(value)
    setText('')
  }

  return (
    <section className="mt-[var(--space-md)] rounded-md border border-edge bg-surface p-[var(--space-md)] shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Refrigerator size={20} className="text-accent" aria-hidden />
        {ja.pantry.title}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{ja.pantry.description}</p>

      {items !== undefined &&
        (items.length === 0 ? (
          <p className="mt-[var(--space-md)] text-sm text-ink-muted">{ja.pantry.empty}</p>
        ) : (
          <div className="mt-[var(--space-md)] flex flex-wrap gap-[var(--space-sm)]">
            {items.map((item) => (
              <span
                key={item.id}
                className={`inline-flex items-center gap-1 rounded-full border py-2 pl-3 pr-1 shadow-sm ${levelClass(item.level)}`}
              >
                <button type="button" onClick={() => void cyclePantryLevel(item.id!)} className="text-sm font-bold">
                  {item.name}
                  <span className="ml-1 font-normal opacity-80">（{ja.pantry.level[item.level]}）</span>
                </button>
                <button
                  type="button"
                  onClick={() => void removePantryItem(item.id!)}
                  aria-label={ja.pantry.remove}
                  className="rounded-full p-1"
                >
                  <X size={14} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ))}

      <div className="mt-[var(--space-md)] flex gap-[var(--space-sm)]">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={ja.pantry.addPlaceholder}
          className="min-w-0 flex-1 rounded-sm border border-edge bg-app px-3 py-3 text-base text-ink placeholder:text-ink-muted/60"
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-edge bg-surface px-3 font-bold text-accent shadow-sm"
        >
          <Plus size={18} aria-hidden />
          {ja.pantry.add}
        </button>
      </div>
    </section>
  )
}
