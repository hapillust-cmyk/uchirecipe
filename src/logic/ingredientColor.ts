import { toHiragana } from './kana'

/**
 * 一覧カードに重ねる「主要食材チップ」の色分け。
 * 「にんじん=オレンジ」のような簡易マッピングで、それらしい色の丸チップにする。
 * 色そのものはすべて index.css のデザイントークン（--chip-*）から参照する。
 */

interface ColorRule {
  token: string
  words: string[]
}

const colorRules: ColorRule[] = [
  { token: '--chip-orange', words: ['にんじん', 'ニンジン', 'かぼちゃ', 'カボチャ', 'さつまいも', 'サツマイモ', 'みかん', 'オレンジ'] },
  { token: '--chip-pink', words: ['豚', 'えび', 'エビ', 'たこ', 'タコ', 'さくらんぼ'] },
  { token: '--chip-red', words: ['牛', 'トマト', 'いちご', 'イチゴ', '赤唐辛子', '梅'] },
  { token: '--chip-tan', words: ['鶏', 'とり', 'きのこ', 'しめじ', 'しいたけ', 'えのき', 'ごぼう', 'じゃがいも'] },
  { token: '--chip-blue', words: ['魚', 'さば', 'サバ', '鮭', 'サケ', 'ぶり', 'ブリ', 'いか', 'イカ', 'たら', 'タラ'] },
  { token: '--chip-yellow', words: ['卵', 'たまご', 'チーズ', '牛乳', 'コーン', 'とうもろこし', 'バター'] },
  { token: '--chip-green', words: ['キャベツ', 'ほうれん草', 'レタス', '白菜', 'ピーマン', 'きゅうり', 'ねぎ', 'ネギ', 'にら', 'ニラ', 'ブロッコリー'] },
]

/** 材料名から色トークン（CSS変数名）を選ぶ。該当なしは既定色 */
export function ingredientColorToken(name: string): string {
  const normalized = toHiragana(name)
  for (const rule of colorRules) {
    if (rule.words.some((word) => normalized.includes(toHiragana(word)))) return rule.token
  }
  return '--chip-neutral'
}
