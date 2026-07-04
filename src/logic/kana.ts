/**
 * 検索の「ゆらぎ」対策。
 * 「タマネギ」と「たまねぎ」のようなカタカナ⇄ひらがなの表記ゆれを吸収する
 * （カタカナをひらがなに変換し、全角英数を半角化・小文字化する）。
 *
 * 制限: 「玉ねぎ」のような漢字表記は、読み方の辞書がないと
 * 「たまねぎ」と同一視できないため対象外。同じ食材を漢字と
 * かなの両方で登録・検索したい場合は、どちらかの表記に揃えて使う必要がある。
 */

/** カタカナをひらがなに変換し、全角英数を半角化・小文字化する */
export function toHiragana(input: string): string {
  return input
    .normalize('NFKC') // 全角英数・記号を半角に揃える
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    )
}

/** 料理名・材料名・タグから検索用キーワード一覧を作る（保存時に呼ぶ） */
export function buildSearchWords(
  title: string,
  ingredients: ReadonlyArray<{ name: string }>,
  tags: readonly string[],
): string[] {
  const words = new Set<string>()
  for (const raw of [title, ...ingredients.map((i) => i.name), ...tags]) {
    const trimmed = raw.trim()
    if (trimmed) words.add(toHiragana(trimmed))
  }
  return [...words]
}
