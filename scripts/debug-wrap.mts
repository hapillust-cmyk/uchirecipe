// 改行チューニング用デバッグ: 対象文のBudouX素分割/結合後unit/タイマー分解を表示
import { loadDefaultJapaneseParser } from 'budoux'
import { wrapJaPhrases, splitAroundTimeToken, ZWSP } from '../src/logic/jaWrap'
import { findTimeTokens } from '../src/logic/time'

const parser = loadDefaultJapaneseParser()

const CASES: { label: string; text: string; timer?: boolean }[] = [
  { label: '肉じゃが', text: '火を止めてそのまま10分おき、味をしみ込ませる。', timer: true },
  { label: 'カレー', text: '水を注ぎ、あくを取りながら中火で15分煮る。', timer: true },
  { label: '豆腐わかめ', text: '鍋に水とだしの素を入れて火にかける。' },
  { label: 'ツナキャベツ1', text: 'キャベツをせん切りにする（レンジ600Wで1分半ほど加熱すると時短になる）。', timer: true },
  { label: 'ツナキャベツ2', text: '油を切ったツナとキャベツ、しょうゆ、ごま油をボウルでさっと和える。' },
  { label: '親子丼', text: '小さめのフライパンにめんつゆと水を入れ、鶏肉と玉ねぎを中火で7分煮る。', timer: true },
  { label: 'ナポリタン', text: 'ゆで上がった麺とゆで汁を少量加え、全体を絡めて塩こしょうで調える。' },
  { label: 'ペペロン', text: '弱火のフライパンでオリーブオイル・薄切りにんにく・種を除いた唐辛子をじっくり香りが出るまで温める。' },
  { label: '豚汁', text: '野菜は薄めのいちょう切り、ごぼうはささがきにして水にさらす。ねぎは小口切りにする。' },
  { label: '鯖1', text: 'さばを皮を上にして入れ、落としぶたをして中火で10分煮る。', timer: true },
  { label: '鯖2', text: '煮汁で味噌を溶いて加え、とろみが付くまで5分煮からめる。', timer: true },
  { label: 'ポテサラ', text: 'じゃがいもを柔らかくなるまで12分ほどゆでる。ゆで上がりの3分前に、にんじんを同じ鍋に加える。', timer: true },
]

for (const c of CASES) {
  console.log(`\n=== ${c.label}: ${c.text}`)
  console.log('  raw : ' + parser.parse(c.text).join(' / '))
  console.log('  unit: ' + wrapJaPhrases(c.text).split(ZWSP).join(' | '))
  if (c.timer) {
    const tokens = findTimeTokens(c.text)
    let cursor = 0
    tokens.forEach((tk, i) => {
      const before = c.text.slice(cursor, tk.start)
      const afterEnd = i + 1 < tokens.length ? tokens[i + 1].start : c.text.length
      const after = c.text.slice(tk.start + tk.text.length, afterEnd)
      const { pre, bondPrev, bondNext, post } = splitAroundTimeToken(before, after)
      console.log(
        `  timer[${tk.text.trim()}]: pre=[${pre.split(ZWSP).join(' | ')}] nowrap=[${bondPrev}⏱${tk.text.trim()}${bondNext}] post=[${post.split(ZWSP).join(' | ')}]`,
      )
      cursor = afterEnd
    })
  }
}
