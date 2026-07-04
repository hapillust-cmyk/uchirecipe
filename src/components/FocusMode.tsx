import { useEffect, useRef, useState, type TouchEvent } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Timer as TimerIcon,
} from 'lucide-react'
import type { Recipe } from '../db/types'
import { useTimers } from './TimerProvider'
import { deriveDoneLabel } from '../logic/timerLabel'
import TimeText from './TimeText'
import { ja } from '../i18n/ja'

type Props = {
  recipe: Recipe
  recipeId: number
  initialStep: number
  onClose: () => void
}

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/**
 * 手順を1つずつ画面いっぱいに表示するモード。
 * スワイプ or 大ボタンで前後に移動でき、読み上げとタイマーもその場で使える。
 * 「画面を暗くしない」設定は詳細画面(呼び出し元)側のWake Lockがそのまま効く。
 */
export default function FocusMode({ recipe, recipeId, initialStep, onClose }: Props) {
  const { startTimer } = useTimers()
  const [index, setIndex] = useState(initialStep)
  const [speaking, setSpeaking] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const total = recipe.steps.length
  const step = recipe.steps[index]
  const stepNumber = index + 1

  const stopSpeech = () => {
    if (speechSupported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  // モードを閉じるとき・切り替え中は読み上げを止める
  useEffect(() => stopSpeech, [])

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= total) return
    stopSpeech()
    setIndex(nextIndex)
  }

  const toggleSpeak = () => {
    if (!speechSupported) return
    if (speaking) {
      stopSpeech()
      return
    }
    const utterance = new SpeechSynthesisUtterance(step.text)
    utterance.lang = 'ja-JP'
    const jaVoice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja'))
    if (jaVoice) utterance.voice = jaVoice
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    goTo(dx < 0 ? index + 1 : index - 1)
  }

  const startStepTimer = (seconds: number) =>
    startTimer({
      key: `${recipeId}-${index}-${seconds}`,
      label: `${recipe.title}・${ja.timer.stepLabel.replace('{n}', String(stepNumber))}`,
      doneLabel: deriveDoneLabel(step.text),
      seconds,
      recipeId,
      stepNumber,
    })

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      <div className="flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={ja.focus.close}
          className="rounded-full p-3 text-ink-muted"
        >
          <X size={24} aria-hidden />
        </button>
        <span className="font-bold text-ink-muted">
          {ja.focus.stepCounter.replace('{n}', String(stepNumber)).replace('{t}', String(total))}
        </span>
        <button
          type="button"
          onClick={toggleSpeak}
          disabled={!speechSupported}
          aria-label={speaking ? ja.focus.stop : ja.focus.read}
          className="rounded-full p-3 text-accent disabled:opacity-30"
        >
          {speaking ? <VolumeX size={24} aria-hidden /> : <Volume2 size={24} aria-hidden />}
        </button>
      </div>

      <div
        className="flex flex-1 flex-col items-center justify-center gap-[var(--space-md)] overflow-y-auto px-[var(--space-lg)] py-[var(--space-md)] text-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-app">
          {stepNumber}
        </span>
        <p className="text-2xl font-bold leading-relaxed">
          <TimeText text={step.text} onStart={(_tokenText, seconds) => startStepTimer(seconds)} />
        </p>
        {step.memo && <p className="text-ink-muted">{step.memo}</p>}
        {step.minutes != null && step.minutes > 0 && (
          <button
            type="button"
            onClick={() => startStepTimer((step.minutes ?? 0) * 60)}
            aria-label={ja.timer.start}
            className="inline-flex items-center gap-1 rounded-md border border-edge px-4 py-2 font-bold text-accent"
          >
            <TimerIcon size={18} aria-hidden />
            {step.minutes}
            {ja.detail.minutesSuffix}
          </button>
        )}
        {!speechSupported && <p className="text-sm text-ink-muted">{ja.focus.readUnsupported}</p>}
      </div>

      <div className="flex gap-2 px-[var(--space-md)] pb-[calc(var(--space-md)+env(safe-area-inset-bottom))] pt-[var(--space-sm)]">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-edge bg-surface py-4 text-lg font-bold text-accent shadow-sm disabled:opacity-30"
        >
          <ChevronLeft size={22} aria-hidden />
          {ja.focus.prev}
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-accent py-4 text-lg font-bold text-app shadow-md disabled:opacity-30"
        >
          {ja.focus.next}
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>
    </div>
  )
}
