import { ja } from '../i18n/ja'

/**
 * タイマー終了時の文言を、手順の文章の動詞から自動生成する。
 * 判別できない場合は既定の「終わり」を使う。
 */
const verbRules: { pattern: RegExp; label: string }[] = [
  { pattern: /蒸らす|蒸らし/, label: '蒸らし終わり' },
  { pattern: /煮込む|煮込み|煮る|煮て|煮た/, label: '煮込み終わり' },
  { pattern: /焼く|焼き|焼いて/, label: '焼き終わり' },
  { pattern: /揚げる|揚げ/, label: '揚げ終わり' },
  { pattern: /炒める|炒め/, label: '炒め終わり' },
  { pattern: /茹でる|ゆでる|茹で|ゆで/, label: '茹で終わり' },
  { pattern: /炊く|炊い/, label: '炊き終わり' },
  { pattern: /漬ける|漬け込む|漬け/, label: '漬け終わり' },
  { pattern: /冷ます|冷やす|冷やし/, label: '冷まし終わり' },
  { pattern: /寝かせる|寝かし/, label: '寝かせ終わり' },
]

/** 手順の文章から「◯◯終わり」を導く。判別できなければ既定の終了文言を返す */
export function deriveDoneLabel(stepText: string | undefined): string {
  if (stepText) {
    for (const rule of verbRules) {
      if (rule.pattern.test(stepText)) return rule.label
    }
  }
  return ja.timer.done
}
