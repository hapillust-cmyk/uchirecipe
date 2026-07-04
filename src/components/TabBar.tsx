import { NavLink } from 'react-router-dom'
import { House, BookOpen, ShoppingCart, Settings } from 'lucide-react'
import { ja } from '../i18n/ja'

const tabs = [
  { to: '/', label: ja.nav.home, Icon: House },
  { to: '/recipes', label: ja.nav.recipes, Icon: BookOpen },
  { to: '/shopping', label: ja.nav.shopping, Icon: ShoppingCart },
  { to: '/settings', label: ja.nav.settings, Icon: Settings },
] as const

/** 画面下部に固定するタブナビゲーション（ホーム / レシピ / 買い物 / 設定） */
export default function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 border-t border-edge bg-surface shadow-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-[var(--space-sm)] text-xs ${
                isActive ? 'font-bold text-accent' : 'text-ink-muted'
              }`
            }
          >
            <Icon size={24} aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
