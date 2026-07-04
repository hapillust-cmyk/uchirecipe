// 配布レシピセットの原稿(src/sets/*.ts)を読み込み、public/sets/data/*.json を生成する。
// 実行: npx tsx scripts/build-sets.mjs
// 原稿には isFavorite・cookedLogs・searchWords・createdAt・updatedAt を書かない
// (取り込み時にimportRecipeSetが実際の値へ再構築するため、ここではダミー値で補完するだけでよい)。
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'sets', 'data')

// 新しいセットを追加したら、ここに import を1行足す
const sets = [await import('../src/sets/kintore.ts')]

await mkdir(outDir, { recursive: true })

for (const mod of sets) {
  const { SET_ID, SET_NAME, SET_VERSION, recipes: recipeDefs } = mod

  const recipes = recipeDefs.map((def) => ({
    ...def,
    isFavorite: false,
    cookedLogs: [],
    searchWords: [],
    createdAt: 0,
    updatedAt: 0,
  }))

  const file = {
    app: 'uchi-recipe',
    version: 1,
    exportedAt: new Date().toISOString(),
    setId: SET_ID,
    setName: SET_NAME,
    setVersion: SET_VERSION,
    recipes,
  }

  const outPath = path.join(outDir, `${SET_ID}.json`)
  await writeFile(outPath, JSON.stringify(file, null, 2) + '\n')
  console.log(`生成: ${path.relative(process.cwd(), outPath)}（${recipes.length}品）`)
}
