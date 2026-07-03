import { X, Timer as TimerIcon, BellRing, Bell, BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTimers } from './TimerProvider'
import { formatRemaining } from '../logic/time'
import { ja } from '../i18n/ja'

/** 起動中タイマーの常駐表示（タブナビのすぐ上に出る。どの画面でも見える） */
export default function TimerBar() {
  const { timers, now, flashingId, dismissTimer, toggleMute } = useTimers()
  const navigate = useNavigate()
  if (timers.length === 0) return null

  /** タップで該当レシピの該当手順へ（詳細画面側でスクロール＆一時ハイライトする） */
  const goToStep = (recipeId: number, stepNumber: number) => {
    navigate(`/recipes/${recipeId}?step=${stepNumber}`)
  }

  return (
    <div
      className="fixed inset-x-0 z-10"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-md space-y-1 px-[var(--space-sm)]">
        {timers.map((timer) => {
          const remaining = Math.ceil((timer.endsAt - now) / 1000)
          const isFlashing = flashingId === timer.id
          return (
            <button
              key={timer.id}
              type="button"
              onClick={() => goToStep(timer.recipeId, timer.stepNumber)}
              className={`flex w-full items-center gap-2 rounded-md border px-[var(--space-md)] py-2 text-left shadow-md transition-transform ${
                timer.done
                  ? 'border-warning bg-surface text-warning'
                  : 'border-edge bg-surface'
              } ${isFlashing ? 'animate-pulse ring-2 ring-accent' : ''}`}
            >
              {timer.done ? (
                <BellRing size={20} className="shrink-0 animate-pulse" aria-hidden />
              ) : (
                <TimerIcon size={20} className="shrink-0 text-accent" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{timer.label}</span>
              <span className="text-lg font-bold tabular-nums">
                {timer.done ? timer.doneLabel : formatRemaining(remaining)}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute(timer.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    e.preventDefault()
                    toggleMute(timer.id)
                  }
                }}
                aria-label={timer.muted ? ja.timer.unmute : ja.timer.mute}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-ink-muted"
              >
                {timer.muted ? <BellOff size={18} aria-hidden /> : <Bell size={18} aria-hidden />}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  dismissTimer(timer.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    e.preventDefault()
                    dismissTimer(timer.id)
                  }
                }}
                aria-label={ja.timer.dismiss}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-ink-muted"
              >
                <X size={20} aria-hidden />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
