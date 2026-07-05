import { Link } from 'react-router-dom'
import { Sparkles, Lock } from 'lucide-react'
import { NUTRITION_ENABLED, NUTRITION_TEASER_ENABLED } from '../logic/nutrition'
import { ja } from '../i18n/ja'

/**
 * レシピ詳細に置く「栄養価のめやす」枠（M6-1）。状態は3つ:
 *
 * 1. 機能公開前(NUTRITION_ENABLED=false) … 無料/Proを問わず「Pro・近日公開」のティーザーを表示
 *    （2026-07 ユーザー決定: 無料ユーザーがPro機能の存在に気づくきっかけにする。
 *    ティーザー自体も NUTRITION_TEASER_ENABLED でOFFにできる）
 * 2. 公開後・未解錠 … 月間献立と同じ様式のProゲート（説明＋設定へのリンク）
 * 3. 公開後・解錠済み … 実際の栄養値パネル。ここはM6-1のUI統合(③)で
 *    Opusサブエージェントが実装する（computeRecipeNutrition の結果表示。
 *    「概算・めやす」表記と計算対象外n件の明示が必須。それまでは何も出さない）
 */
export default function NutritionTeaser({ isPro }: { isPro: boolean }) {
  if (!NUTRITION_ENABLED) {
    if (!NUTRITION_TEASER_ENABLED) return null
    // 状態1: ティーザー（控えめな1枚カード。タップ要素は置かず、期待だけ持ってもらう）
    return (
      <section className="mt-[var(--space-lg)]">
        <div className="rounded-md border border-edge bg-surface p-[var(--space-md)] shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" aria-hidden />
            <h2 className="font-bold">{ja.nutrition.title}</h2>
            <span className="rounded-full border border-edge px-2 py-0.5 text-xs font-bold text-accent">
              {ja.nutrition.proBadge}
            </span>
            <span className="rounded-full border border-edge px-2 py-0.5 text-xs text-ink-muted">
              {ja.nutrition.comingSoonBadge}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{ja.nutrition.teaserDescription}</p>
        </div>
      </section>
    )
  }

  if (!isPro) {
    // 状態2: Proゲート（月間献立ゲートの様式踏襲）
    return (
      <section className="mt-[var(--space-lg)]">
        <div className="rounded-md border border-edge bg-surface p-[var(--space-lg)] text-center shadow-sm">
          <Lock size={28} className="mx-auto text-ink-muted" aria-hidden />
          <p className="mt-[var(--space-sm)] font-bold">{ja.nutrition.gateTitle}</p>
          <p className="mt-1 text-sm text-ink-muted">{ja.nutrition.gateDescription}</p>
          <Link
            to="/settings?section=pro"
            className="mt-[var(--space-sm)] inline-block text-sm font-bold text-accent underline"
          >
            {ja.nutrition.gateLink}
          </Link>
        </div>
      </section>
    )
  }

  // 状態3: 解錠済みの実表示はM6-1 UI統合(③)でOpusが実装する（それまで非表示）
  return null
}
