import Dexie, { type Table } from 'dexie'
import type { PantryItem, Recipe, Settings, ShoppingItem } from './types'

/**
 * うちレシピのデータベース（ブラウザ内蔵の IndexedDB を Dexie 経由で使う）。
 * 端末内保存なのでサーバー不要・オフラインで動く。
 */
class UchiRecipeDB extends Dexie {
  recipes!: Table<Recipe, number>
  settings!: Table<Settings, number>
  pantryItems!: Table<PantryItem, number>
  shoppingItems!: Table<ShoppingItem, number>

  constructor() {
    super('uchi-recipe')
    this.version(1).stores({
      // ++id: 自動採番 / *tags, *searchWords: 配列の中身で検索できる索引
      recipes: '++id, title, *tags, *searchWords, updatedAt',
    })
    // バージョン2: 設定テーブルを追加（既存のレシピはそのまま引き継がれる）
    this.version(2).stores({
      recipes: '++id, title, *tags, *searchWords, updatedAt',
      settings: 'id',
    })
    // バージョン3: 在庫ボード（ざっくり在庫）テーブルを追加
    this.version(3).stores({
      recipes: '++id, title, *tags, *searchWords, updatedAt',
      settings: 'id',
      pantryItems: '++id, name',
    })
    // バージョン4: 買い物メモ（確定済みの項目だけを保存）テーブルを追加
    this.version(4).stores({
      recipes: '++id, title, *tags, *searchWords, updatedAt',
      settings: 'id',
      pantryItems: '++id, name',
      shoppingItems: '++id, order',
    })
  }
}

export const db = new UchiRecipeDB()
