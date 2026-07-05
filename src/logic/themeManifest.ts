/** 配布レシピのテーマ一覧（追加レシピパック/Pro解錠者がテーマ単位で選んで取り込むためのカタログ） */
export interface ThemeManifestEntry {
  id: string
  file: string
  title: string
  description: string
  addedDate: string
}

interface ThemeManifestFile {
  themes: ThemeManifestEntry[]
}

/** マニフェストを取得する。オフライン・取得失敗時は静かに空配列を返す(news.tsと同じ割り切り) */
export async function fetchThemeManifest(): Promise<ThemeManifestEntry[]> {
  try {
    const res = await fetch('/sets/manifest.json')
    if (!res.ok) return []
    const data = (await res.json()) as Partial<ThemeManifestFile>
    return Array.isArray(data.themes) ? data.themes : []
  } catch {
    return []
  }
}
