// Manages the simulator's locked answers. The master password (KILIT_SIFRESI)
// derives every code; the page password (SAYFA_SIFRESI) opens the trainers'
// page at #/arduino/kilit. Nothing readable is written into the repository.
//
//   node scripts/answers.mjs kodlar                    print every week and exercise code
//   node scripts/answers.mjs ac                        decrypt into answers.local.json (git-ignored) to edit
//   node scripts/answers.mjs kilitle                   encrypt answers.local.json (or the current answers again)
//   node scripts/answers.mjs herkese-ac <hafta|id>     open a week or one exercise for everyone (answers/open.json)
//   node scripts/answers.mjs kapat <hafta|id>          lock it again
//   node scripts/answers.mjs sayfa-sifresi             re-seal the trainers' page under SAYFA_SIFRESI
//   node scripts/answers.mjs yeni-parola               suggest a page password (5 words and a number)
//   YENI_SIFRE=... node scripts/answers.mjs sifre-degistir   re-encrypt everything under a new master password
//
// answers.local.json: { "<exercise id>": { "week": 2, "code": "...", "wires": [...] } }
import { randomInt } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { Toolchain, unpack } from '../src/pages/arduino/simulator/compiler/toolchain.js'
import { EXAMPLES } from '../src/pages/arduino/simulator/examples.js'
import { exerciseCode, lockWith, masterKey, sealForPage, unlockWith, weekCode } from '../src/utils/answerLock.js'

const ROOT = new URL('../', import.meta.url)
const DIR = 'src/pages/arduino/simulator/answers/'
const LOCKED = new URL(`${DIR}locked.json`, ROOT)
const OPEN = new URL(`${DIR}open.json`, ROOT)
const PAGE = new URL(`${DIR}page.json`, ROOT)
const LOCAL = new URL('answers.local.json', ROOT)

// Page passwords are five of these words and a number: easy to remember,
// about 46 bits to guess.
const WORDS = (
  'ada adim agac akil akrep alarm alev altin ambar anahtar anten arena arma armut asker aslan atlas avci ayna ' +
  'ayva bahar balik balon bambu banka bando baraj bardak bayrak bekci beton biber bilet bisiklet bitki bobin boya ' +
  'bulut burun cadde canta cennet cep ceviz cimen damla dalga dans defne defter deniz deve dolap domates dut ' +
  'duvar ekmek elma elmas emek erik eser fanus fener fidan filiz fincan firin fitil gemi gezgin giyim gol gonca ' +
  'guvercin hamak harita hasat hava havuz hazine hediye hilal hurma inci irmak istasyon iz jeton kabak kafes ' +
  'kahve kalem kale kamera kanal kanat kanepe kaplan karanfil kardelen kartal kartpostal kasa kavak kayak kaya ' +
  'kedi kelebek kemer kerpic kiraz kitap koala kompas konak korsan koy kral kum kumru kupa kurabiye kurt kutu ' +
  'labirent lale lamba leylek limon lira lokum maden manav mandal mantar marul masa masal mavi mekik mektup ' +
  'merdiven mermer meyve mimar mineral misafir model motor mozaik muz nane nehir nergis nokta ocak orkide orman ' +
  'otel otobus pamuk papatya park pasta patika pencere pergel pirinc pilot piyano planet portakal pusula radar ' +
  'rakam ray robot roket ruzgar saat saksi salkim sandal sarmasik saray sayfa sedir sehpa servi sinema sincap ' +
  'sirket sokak sonbahar soba sofra sohbet somun sorgu sopa sulu tabak tabela tahta takvim talep tarla tavuk ' +
  'tekne telefon tepe terazi tilki tohum top toprak tren tuval tuz umut uzay vadi vagon valiz vapur vazo veri ' +
  'yaka yaprak yarim yayla yelken yildiz yogurt yol yonca yorgan yumak yunus yuva zambak zeytin zil zirve zurna ' +
  'atom bina bulmaca cetvel cizgi dergi dinamo ekran enerji fosil'
).split(' ')

const readJson = (url, fallback) => (existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : fallback)
const writeJson = (url, value) => writeFileSync(url, `${JSON.stringify(value, null, 2)}\n`)
const title = (id) => EXAMPLES.find((example) => example.id === id)?.title ?? id

function secret(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} ortam değişkenini ayarlayın.`)
  return value
}

// Every code the master password derives, for the exercises that have answers.
async function codes(password, ids) {
  const master = await masterKey(password)
  const exercises = {}
  for (const id of ids) exercises[id] = await exerciseCode(master, id)
  const weeks = {}
  for (const week of [1, 2, 3, 4, 5]) weeks[week] = await weekCode(master, week)
  return { exercises, weeks }
}

const lockedIds = () => Object.keys(readJson(LOCKED, { exercises: {} }).exercises)

async function decryptAll(password) {
  const locked = readJson(LOCKED, { exercises: {} })
  const { exercises } = await codes(password, Object.keys(locked.exercises))
  const answers = {}
  for (const [id, payload] of Object.entries(locked.exercises)) {
    const opened = await unlockWith(exercises[id], `uygulama-${id}`, payload)
    if (!opened) throw new Error(`${id} açılamadı: ana şifre yanlış.`)
    answers[id] = { week: payload.week, code: opened.code, wires: opened.wires }
  }
  return answers
}

// The answers ship with their compiled programs so a revealed answer runs
// without downloading the compiler.
async function compiler() {
  const files = unpack(new Uint8Array(gunzipSync(readFileSync(new URL('src/pages/arduino/simulator/compiler/toolchain.pack.gz', ROOT)))))
  const dir = mkdtempSync(join(tmpdir(), 'avr-tools-'))
  const factories = {}
  for (const tool of ['cc1plus', 'avr-as', 'avr-ld', 'avr-objcopy']) {
    writeFileSync(join(dir, `${tool}.mjs`), files.get(`/tools/${tool}.mjs`))
    factories[tool] = (await import(pathToFileURL(join(dir, `${tool}.mjs`)).href)).default
  }
  return new Toolchain(files, factories)
}

async function sealPage(all, pagePassword) {
  const list = Object.entries(all.exercises).map(([id, code]) => ({ id, title: title(id), week: readJson(LOCKED, { exercises: {} }).exercises[id]?.week, code }))
  writeJson(PAGE, await sealForPage(pagePassword, { weeks: all.weeks, exercises: list }))
}

async function encryptAll(password, answers, pagePassword) {
  const all = await codes(password, Object.keys(answers))
  const toolchain = await compiler()
  const exercises = {}
  const byWeek = {}
  for (const [id, answer] of Object.entries(answers)) {
    const built = await toolchain.build(answer.code)
    if (!built.ok) throw new Error(`${id} derlenemedi:\n${built.errors}`)
    exercises[id] = { week: answer.week, ...(await lockWith(all.exercises[id], `uygulama-${id}`, { code: answer.code, wires: answer.wires, hex: built.hex })) }
    ;(byWeek[answer.week] ??= {})[id] = all.exercises[id]
    console.log(`${id}: ${answer.week}. hafta, ${built.flash} bayt`)
  }
  // A week code opens the list of that week's exercise codes.
  const weeks = {}
  for (const [week, list] of Object.entries(byWeek)) weeks[week] = await lockWith(all.weeks[week], `hafta-${week}`, { codes: list })
  writeJson(LOCKED, { version: 2, exercises, weeks })
  if (pagePassword) await sealPage(all, pagePassword)
  else if (!existsSync(PAGE)) console.log('SAYFA_SIFRESI verilmedi: kilit sayfası güncellenmedi.')
  return all
}

const [command, argument] = process.argv.slice(2)
if (command === 'kodlar') {
  const all = await codes(secret('KILIT_SIFRESI'), lockedIds())
  for (const [week, code] of Object.entries(all.weeks)) console.log(`${week === '5' ? 'Yarışma' : `${week}. hafta`} (tümü): ${code}`)
  for (const [id, code] of Object.entries(all.exercises)) console.log(`  ${title(id)}: ${code}`)
} else if (command === 'ac') {
  writeJson(LOCAL, await decryptAll(secret('KILIT_SIFRESI')))
  console.log(`Cevaplar ${LOCAL.pathname} dosyasına yazıldı. Düzenleyip "kilitle" ile şifreleyin; bu dosyayı commit'lemeyin.`)
} else if (command === 'kilitle') {
  const password = secret('KILIT_SIFRESI')
  await encryptAll(password, readJson(LOCAL, null) ?? (await decryptAll(password)), process.env.SAYFA_SIFRESI)
  console.log('answers/locked.json güncellendi.')
} else if (command === 'herkese-ac' || command === 'kapat') {
  const all = await codes(secret('KILIT_SIFRESI'), lockedIds())
  const open = readJson(OPEN, { weeks: {}, exercises: {} })
  const kind = all.weeks[argument] ? 'weeks' : all.exercises[argument] ? 'exercises' : null
  if (!kind) throw new Error(`Hafta numarası (1–5) ya da uygulama adı verin: ${Object.keys(all.exercises).join(', ')}`)
  if (command === 'kapat') delete open[kind][argument]
  else open[kind][argument] = all[kind][argument]
  writeJson(OPEN, open)
  console.log(`${kind === 'weeks' ? `${argument}. hafta` : title(argument)} ${command === 'kapat' ? 'yeniden kilitlendi' : 'herkese açıldı'}.`)
} else if (command === 'sayfa-sifresi') {
  await sealPage(await codes(secret('KILIT_SIFRESI'), lockedIds()), secret('SAYFA_SIFRESI'))
  console.log('Kilit sayfası yeni şifreyle mühürlendi.')
} else if (command === 'yeni-parola') {
  console.log([...Array.from({ length: 5 }, () => WORDS[randomInt(WORDS.length)]), randomInt(10, 100)].join('-'))
} else if (command === 'sifre-degistir') {
  const answers = await decryptAll(secret('KILIT_SIFRESI'))
  const all = await encryptAll(secret('YENI_SIFRE'), answers, secret('SAYFA_SIFRESI'))
  const open = readJson(OPEN, { weeks: {}, exercises: {} })
  for (const kind of ['weeks', 'exercises']) for (const key of Object.keys(open[kind])) open[kind][key] = all[kind][key]
  writeJson(OPEN, open)
  console.log('Yeni ana şifreyle şifrelendi; eski kodlar artık çalışmaz.')
} else {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 15).join('\n'))
}
