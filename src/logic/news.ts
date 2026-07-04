export interface NewsItem {
  id: string
  date: string
  title: string
  body: string
  link?: string
}

/**
 * public/news.json を同一オリジンから取得する。
 * オフライン・取得失敗時は静かに空配列を返す（console.errorを出さない）。
 * 新しい順（配列の先頭が最新）で書くこと。
 */
export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('/news.json')
    if (!res.ok) return []
    const data: unknown = await res.json()
    return Array.isArray(data) ? (data as NewsItem[]) : []
  } catch {
    return []
  }
}
