import { ja } from './i18n/ja'

/** 準備中の案内だけを表示する最小ページ。MAINTENANCE_MODE=true のときのみ使う */
export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-lg)',
        textAlign: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{ja.app.name}</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '32ch', lineHeight: 1.8, margin: 0 }}>
        ただいまリニューアル作業中です。
        <br />
        しばらくしてから、あらためてお越しください。
      </p>
    </div>
  )
}
