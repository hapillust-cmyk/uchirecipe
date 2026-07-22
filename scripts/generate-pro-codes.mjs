// Pro解錠コードを100個生成する。
// 実行: node scripts/generate-pro-codes.mjs
//
// 出力:
// - private/pro-codes-master.txt (リポジトリの外。原本・販売台帳。絶対にコミットしない)
// - src/logic/proCodes.ts (SHA-256ハッシュ配列のみ。原本は逆算不能なのでコミットしてよい)
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { randomBytes, createHash } from 'node:crypto'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const masterPath = path.join(__dirname, '..', '..', 'private', 'pro-codes-master.txt')
const hashesPath = path.join(__dirname, '..', 'src', 'logic', 'proCodes.ts')

const COUNT = 100
// e2e(UNLOCK-01)用の固定テストコード。公開リポジトリのe2e-smoke.mjsに直書きされているため、
// 販売には絶対に使わない(build-pool-jsonが「テスト」「予約」注記で販売プールから除外する)。
// 解錠検証の実UI回帰テストのため、ハッシュはproCodes.tsに含める(=このコードで解錠は可能)。
// 販売プールには入らないので、有料顧客が公開済みコードを受け取ることはない(docs/50 SEC-1対応)。
const TEST_RESERVED_CODE = 'UR-96QS-2VSZ'
// 紛らわしい文字 0/O/1/I を除いた32文字(2の累乗なのでmod演算に偏りが出ない)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomChar() {
  const [byte] = randomBytes(1)
  return ALPHABET[byte % ALPHABET.length]
}

function generateCode() {
  const chars = Array.from({ length: 8 }, randomChar).join('')
  return `UR-${chars.slice(0, 4)}-${chars.slice(4)}`
}

// logic/pro.ts の isValidProCode と必ず同じ正規化・ハッシュ手順にすること
function normalizeCode(code) {
  return code.normalize('NFKC').toUpperCase().trim()
}

function hashCode(code) {
  return createHash('sha256').update(`uchirecipe-pro:${normalizeCode(code)}`).digest('hex')
}

const codes = new Set()
while (codes.size < COUNT) {
  const c = generateCode()
  if (c !== TEST_RESERVED_CODE) codes.add(c) // 万一の衝突(確率ほぼ0)でも販売コードにテスト用を混ぜない
}
const codeList = [...codes]

await mkdir(path.dirname(masterPath), { recursive: true })
const masterContent =
  '# うちレシピ Pro解錠コード 原本・販売台帳\n' +
  '# 売れたらそのコードの行末に「済」を追記して管理する。このファイルは絶対に公開・コミットしないこと。\n\n' +
  codeList.join('\n') +
  '\n\n' +
  '# --- e2eテスト用(販売しない・公開リポジトリに載っているコード) ---\n' +
  `${TEST_RESERVED_CODE} テスト予約(販売には使わない・e2e用)\n`
await writeFile(masterPath, masterContent)

// proCodes.tsには販売100個 + e2e用テストコードのハッシュを載せる(解錠検証用)。
// テストコードは販売プール(build-pool-json)からは除外されるため、顧客には渡らない。
const hashList = [...codeList, TEST_RESERVED_CODE].map(hashCode)
const hashesContent =
  '/** Pro解錠コードのSHA-256ハッシュ一覧。原本はリポジトリ外(private/pro-codes-master.txt)で管理 */\n' +
  'export const PRO_CODE_HASHES: string[] = [\n' +
  hashList.map((h) => `  '${h}',`).join('\n') +
  '\n]\n'
await writeFile(hashesPath, hashesContent)

console.log(`${COUNT}個のコードを生成しました`)
console.log(`原本: ${masterPath}`)
console.log(`ハッシュ: ${hashesPath}`)
