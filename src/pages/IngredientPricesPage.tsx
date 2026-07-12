import { useState } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import { usePriceEntries, addPriceEntry, updatePriceEntry, removePriceEntry } from '../db/prices'
import BackHeader from '../components/BackHeader'
import { ja } from '../i18n/ja'

const inputCls =
  'min-w-0 flex-1 rounded-sm border border-edge bg-app px-3 py-2 text-base text-ink placeholder:text-ink-muted/60'

/**
 * 「食材と価格」= 食材価格マスタの一覧・編集・追加・削除。
 * ここで登録した目安価格は、レシピの「材料ごとの価格入力」が無い材料だけを補う
 * フォールバックとして、詳細画面・献立プランナーの概算食費に使われる（docs/20 §3）。
 */
export default function IngredientPricesPage() {
  const entries = usePriceEntries()

  // 編集中の1件（idと下書き値）。他の行は編集中でも通常表示のまま
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftUnit, setDraftUnit] = useState('')

  const startEdit = (entry: { id?: number; name: string; pricePerUnit: number; unit: string }) => {
    setEditingId(entry.id ?? null)
    setDraftName(entry.name)
    setDraftPrice(String(entry.pricePerUnit))
    setDraftUnit(entry.unit)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async () => {
    if (editingId == null) return
    await updatePriceEntry(editingId, {
      name: draftName,
      pricePerUnit: Number(draftPrice) || 0,
      unit: draftUnit,
    })
    setEditingId(null)
  }

  // 新規追加
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const addNew = async () => {
    await addPriceEntry(newName, Number(newPrice) || 0, newUnit)
    setNewName('')
    setNewPrice('')
    setNewUnit('')
  }

  return (
    <div className="mx-auto w-full max-w-md pb-[var(--space-lg)]">
      <BackHeader fallback="/settings" title={ja.priceMaster.title} />

      <div className="px-[var(--space-md)] pt-[var(--space-md)]">
        <p className="rounded-sm border border-edge bg-surface px-3 py-2 text-sm text-ink-muted">
          {ja.priceMaster.disclaimer}
        </p>

        {entries && entries.length === 0 && (
          <p className="mt-[var(--space-md)] text-sm text-ink-muted">{ja.priceMaster.empty}</p>
        )}

        {entries && entries.length > 0 && (
          <ul className="mt-[var(--space-md)] divide-y divide-edge rounded-md border border-edge bg-surface">
            {entries.map((entry) => (
              <li key={entry.id} className="px-[var(--space-sm)] py-2">
                {editingId === entry.id ? (
                  <div className="space-y-2 py-1">
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder={ja.priceMaster.namePlaceholder}
                      aria-label={ja.priceMaster.nameLabel}
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(e.target.value)}
                        placeholder={ja.priceMaster.pricePlaceholder}
                        aria-label={ja.priceMaster.priceLabel}
                        className={inputCls}
                      />
                      <input
                        type="text"
                        value={draftUnit}
                        onChange={(e) => setDraftUnit(e.target.value)}
                        placeholder={ja.priceMaster.unitPlaceholder}
                        aria-label={ja.priceMaster.unitLabel}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit()}
                        className="flex-1 rounded-sm bg-accent py-2 text-sm font-bold text-app shadow-sm"
                      >
                        {ja.priceMaster.save}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 rounded-sm border border-edge bg-app py-2 text-sm font-bold text-ink-muted"
                      >
                        {ja.priceMaster.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold">{entry.name}</span>
                      <span className="ml-2 text-sm text-ink-muted">
                        {entry.unit}
                        {' '}
                        {entry.pricePerUnit.toLocaleString()}
                        {ja.priceMaster.priceYen}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      aria-label={ja.priceMaster.edit}
                      className="rounded-full p-2 text-ink-muted"
                    >
                      <Pencil size={18} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePriceEntry(entry.id!)}
                      aria-label={ja.priceMaster.remove}
                      className="rounded-full p-2 text-ink-muted"
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 新規追加 */}
        <div className="mt-[var(--space-md)] space-y-2 rounded-md border border-edge bg-surface p-[var(--space-sm)]">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={ja.priceMaster.namePlaceholder}
            aria-label={ja.priceMaster.nameLabel}
            className={inputCls}
          />
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder={ja.priceMaster.pricePlaceholder}
              aria-label={ja.priceMaster.priceLabel}
              className={inputCls}
            />
            <input
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder={ja.priceMaster.unitPlaceholder}
              aria-label={ja.priceMaster.unitLabel}
              className={inputCls}
            />
          </div>
          <button
            type="button"
            onClick={() => void addNew()}
            disabled={!newName.trim() || !newUnit.trim() || !(Number(newPrice) > 0)}
            className="flex w-full items-center justify-center gap-1 rounded-sm border border-edge bg-app py-2 text-sm font-bold text-accent shadow-sm disabled:opacity-40"
          >
            <Plus size={16} aria-hidden />
            {ja.priceMaster.add}
          </button>
        </div>
      </div>
    </div>
  )
}
