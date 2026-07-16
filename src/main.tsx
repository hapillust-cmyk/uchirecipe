import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MaintenancePage from './MaintenancePage.tsx'
import { MAINTENANCE_MODE } from './logic/maintenance.ts'

// iPadでは、iPadOSのマルチタスク操作ボタン(ウィンドウ上部に重なる「…」「●●●」)が
// アプリの「戻る」ヘッダーに被る(2026-07-12オーナー実機報告)。CSSからは検知できないため、
// iPadだけ:rootにクラスを立てて上部に余白を足す。iPadOSのSafari系はUAが「Macintosh」を
// 名乗る(デスクトップ版UA)ので、タッチ点数との組み合わせで判定する(Macは maxTouchPoints=0、iPhoneはUAに Macintosh/iPad を含まないため対象外)
if (navigator.maxTouchPoints > 0 && /Macintosh|iPad/.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-ipad')
}

// データ保護(2026-07-16 Fable品質監査): ブラウザの自動データ退去(storage eviction)を抑止するため、
// 永続化ストレージを1回要求する。未対応ブラウザでは何もしない(存在チェック)。失敗しても副作用は
// 無いため無視してよい(オーナーのレシピ・購入コード等はIndexedDBのまま。ここでは削除も変更もしない)。
navigator.storage?.persist?.()?.catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>{MAINTENANCE_MODE ? <MaintenancePage /> : <App />}</StrictMode>,
)
