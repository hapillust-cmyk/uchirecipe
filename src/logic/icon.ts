import type { IconKey, Ingredient } from '../db/types'

/**
 * プレースホルダーアイコンの自動判定。
 * 料理名・タグ・材料名（先頭いくつか）に含まれるキーワードから、
 * 料理の見た目に近いアイコン種別を選ぶ。
 * 上から順に判定し、最初に一致したものを採用する（例: 「豚汁」は麺・肉より先に汁物と判定）。
 */

interface Rule {
  key: IconKey
  words: string[]
}

const rules: Rule[] = [
  { key: 'dessert', words: ['デザート', 'スイーツ', 'ケーキ', 'クッキー', 'アイス', 'プリン', 'ゼリー', 'パンケーキ', '大福', '団子'] },
  { key: 'drink', words: ['ドリンク', 'スムージー', 'コーヒー', '紅茶', 'ジュース', 'スープ割り', 'シェイク', 'ラッシー'] },
  { key: 'noodle', words: ['麺', 'パスタ', 'うどん', 'そば', 'ラーメン', 'スパゲッティ', '焼きそば', 'ナポリタン', 'ペペロンチーノ', '冷やし中華'] },
  { key: 'bread', words: ['パン', 'サンド', 'トースト', 'ホットドッグ', 'バーガー'] },
  { key: 'soup', words: ['汁', 'スープ', '味噌汁', 'シチュー', '鍋', 'おでん', 'ポトフ'] },
  { key: 'salad', words: ['サラダ', 'あえもの', '和え物', 'おひたし', 'きんぴら', 'ナムル'] },
  { key: 'fish', words: ['魚', 'さば', 'サバ', '鮭', 'サケ', 'ぶり', 'ブリ', 'えび', 'エビ', 'いか', 'イカ', 'たら', 'タラ', 'まぐろ', 'マグロ', 'さんま', 'サンマ', 'あじ', 'アジ', 'しらす'] },
  { key: 'egg', words: ['卵', 'たまご', 'オムレツ', 'だし巻き', '卵焼き', 'オムライス'] },
  { key: 'chicken', words: ['鶏', 'とり', 'チキン', '唐揚げ', 'から揚げ'] },
  { key: 'meat', words: ['肉', '牛', '豚', 'ハンバーグ', 'ステーキ', 'ベーコン', 'ハム', 'ウインナー', 'ソーセージ'] },
  { key: 'rice', words: ['ご飯', 'ごはん', '丼', 'カレー', 'チャーハン', 'おにぎり', '炊き込み', 'リゾット', 'ピラフ', '寿司', 'すし'] },
]

/** キーワードが含まれるかを判定する対象文字列をまとめる */
function buildHaystack(input: {
  title: string
  tags: readonly string[]
  ingredients: readonly Pick<Ingredient, 'name'>[]
}): string {
  const ingredientNames = input.ingredients.slice(0, 3).map((i) => i.name)
  return [input.title, ...input.tags, ...ingredientNames].join(' ')
}

/** 料理名・タグ・先頭の材料からプレースホルダーアイコンの種別を自動選択する */
export function pickIconKey(input: {
  title: string
  tags: readonly string[]
  ingredients: readonly Pick<Ingredient, 'name'>[]
}): IconKey {
  const haystack = buildHaystack(input)
  for (const rule of rules) {
    if (rule.words.some((word) => haystack.includes(word))) return rule.key
  }
  return 'default'
}

/** アイコン選択UIで並べる順（自動判定の優先順とだいたい揃える） */
export const iconKeyOrder: IconKey[] = [
  'rice',
  'noodle',
  'bread',
  'soup',
  'salad',
  'fish',
  'egg',
  'chicken',
  'meat',
  'dessert',
  'drink',
  'default',
]
