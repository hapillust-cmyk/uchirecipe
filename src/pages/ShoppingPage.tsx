import PantryBoard from '../components/PantryBoard'
import { ja } from '../i18n/ja'

/** 買い物タブ: 在庫ボード（買い物メモは今後のバッチで追加予定） */
export default function ShoppingPage() {
  return (
    <div className="mx-auto w-full max-w-md px-[var(--space-md)] pb-[var(--space-lg)] pt-[var(--space-lg)]">
      <h1 className="text-2xl font-bold">{ja.nav.shopping}</h1>
      <PantryBoard />
    </div>
  )
}
