// Maintains the simulator's lock state (src/utils/lockState.js): the encrypted
// answers, the open list and the code list. Renewing codes and opening
// answers is done on the trainers' page (#/arduino/kilit); this script is for
// adding or editing answers and for the passwords.
//
// The state is read from the gist or data repository named in
// src/pages/arduino/simulator/answers/store.json (a private repository, and
// any saving, needs GITHUB_TOKEN; saving to a private one also starts the
// site's deploy), or from the bundled answers/kilit.json before that exists.
// Passwords come from the environment: KILIT_SIFRESI (master), SAYFA_SIFRESI (page).
//
//   node scripts/answers.mjs kodlar                 print every code (master or page password)
//   node scripts/answers.mjs ac                     decrypt answers into answers.local.json (git-ignored)
//   node scripts/answers.mjs kilitle                encrypt answers.local.json (new exercises get new codes;
//                                                   needs KILIT_SIFRESI and SAYFA_SIFRESI)
//   node scripts/answers.mjs herkese-ac <hafta|id>  open one exercise, or every exercise of a week, for everyone
//   node scripts/answers.mjs kapat <hafta|id>       lock it again
//   node scripts/answers.mjs sayfa-sifresi          set SAYFA_SIFRESI as the page password (with KILIT_SIFRESI)
//   YENI_SIFRE=... node scripts/answers.mjs sifre-degistir   new master password; codes stay the same
//   node scripts/answers.mjs yeni-parola            suggest a page password
//
// answers.local.json: { "<exercise id>": { "week": 2, "code": "...", "wires": [...] } }
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { Toolchain, unpack } from '../src/pages/arduino/simulator/compiler/toolchain.js'
import { EXAMPLES } from '../src/pages/arduino/simulator/examples.js'
import { lockWith, randomCode, rekeyRecovery, unlockWith } from '../src/utils/answerLock.js'
import { describe, publish, readLatest, readPublic, save } from '../src/utils/lockStore.js'
import { readList, recoverList, sealList, setOpen } from '../src/utils/lockState.js'
import { suggestPassphrase } from '../src/utils/passphrase.js'

const ROOT = new URL('../', import.meta.url)
const DIR = 'src/pages/arduino/simulator/answers/'
const STORE = JSON.parse(readFileSync(new URL(`${DIR}store.json`, ROOT), 'utf8'))
const BUNDLED = new URL(`${DIR}kilit.json`, ROOT)
const LOCAL = new URL('answers.local.json', ROOT)
const external = Boolean(STORE.gist || STORE.repo)
const title = (id) => EXAMPLES.find((example) => example.id === id)?.title ?? id
const weekName = (week) => (Number(week) === 5 ? 'Yarışma' : `${week}. hafta`)

function secret(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} ortam değişkenini ayarlayın.`)
  return value
}

async function loadState() {
  if (!external) return JSON.parse(readFileSync(BUNDLED, 'utf8'))
  if (!STORE.private) return readPublic(STORE)
  const state = await readLatest(STORE, secret('GITHUB_TOKEN'))
  if (!state) throw new Error(`${describe(STORE)} içinde kilit verisi yok; önce kilit sayfasından "Depoya yükle".`)
  return state
}

async function storeState(state, message) {
  if (external) {
    await save(STORE, secret('GITHUB_TOKEN'), state, message)
    const deployed = await publish(STORE, secret('GITHUB_TOKEN'))
    console.log(`${describe(STORE)} güncellendi (${deployed ? 'site yeniden yayınlanıyor, 1–2 dakika' : 'öğrencilere en geç 5 dakikada yansır'}).`)
  } else {
    writeFileSync(BUNDLED, `${JSON.stringify(state, null, 2)}\n`)
    console.log(`${DIR}kilit.json güncellendi; yayınlamak için commit'leyin.`)
  }
}

// The code list, from the master password or the page password.
async function codeList(state) {
  const list = process.env.KILIT_SIFRESI ? await recoverList(state, process.env.KILIT_SIFRESI) : process.env.SAYFA_SIFRESI ? await readList(state, process.env.SAYFA_SIFRESI) : null
  if (!list) throw new Error('KILIT_SIFRESI ya da SAYFA_SIFRESI gerekli (ve doğru olmalı).')
  return list
}

async function decryptAll(state, list) {
  const answers = {}
  for (const item of list.exercises) {
    const answer = await unlockWith(item.code, `uygulama-${item.id}`, state.exercises[item.id])
    if (!answer) throw new Error(`${item.id} açılamadı.`)
    answers[item.id] = { week: item.week, code: answer.code, wires: answer.wires }
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

// Re-encrypts every answer, keeping existing codes; new exercises and
// weeks get new random codes.
async function encryptAll(state, list, answers) {
  const toolchain = await compiler()
  const next = { ...state, exercises: {}, weeks: {} }
  const nextList = { weeks: { ...list.weeks }, exercises: [] }
  const byWeek = {}
  for (const [id, answer] of Object.entries(answers)) {
    const built = await toolchain.build(answer.code)
    if (!built.ok) throw new Error(`${id} derlenemedi:\n${built.errors}`)
    const code = list.exercises.find((item) => item.id === id)?.code ?? randomCode()
    nextList.weeks[answer.week] ??= randomCode()
    nextList.exercises.push({ id, title: title(id), week: answer.week, code })
    next.exercises[id] = { week: answer.week, ...(await lockWith(code, `uygulama-${id}`, { code: answer.code, wires: answer.wires, hex: built.hex })) }
    ;(byWeek[answer.week] ??= {})[id] = code
    console.log(`${id}: ${weekName(answer.week)}, ${built.flash} bayt`)
  }
  for (const [week, codes] of Object.entries(byWeek)) next.weeks[week] = await lockWith(nextList.weeks[week], `hafta-${week}`, { codes })
  return { state: await sealList(next, nextList, secret('SAYFA_SIFRESI')), list: nextList }
}

const [command, argument] = process.argv.slice(2)
if (command === 'kodlar') {
  const list = await codeList(await loadState())
  for (const [week, code] of Object.entries(list.weeks)) {
    console.log(`${weekName(week)} (tümü): ${code}`)
    for (const item of list.exercises.filter((exercise) => String(exercise.week) === week)) console.log(`  ${item.title} [${item.id}]: ${item.code}`)
  }
} else if (command === 'ac') {
  const state = await loadState()
  writeFileSync(LOCAL, `${JSON.stringify(await decryptAll(state, await codeList(state)), null, 2)}\n`)
  console.log(`Cevaplar ${LOCAL.pathname} dosyasına yazıldı. Düzenleyip "kilitle" ile şifreleyin; bu dosyayı commit'lemeyin.`)
} else if (command === 'kilitle') {
  if (!existsSync(LOCAL)) throw new Error('Önce "ac" ile answers.local.json oluşturun.')
  const state = await loadState()
  const result = await encryptAll(state, await codeList(state), JSON.parse(readFileSync(LOCAL, 'utf8')))
  await storeState(result.state, 'Cevapları güncelle')
} else if (command === 'herkese-ac' || command === 'kapat') {
  const state = await loadState()
  const list = await codeList(state)
  const kind = list.weeks[argument] ? 'weeks' : list.exercises.some((item) => item.id === argument) ? 'exercises' : null
  if (!kind) throw new Error(`Hafta numarası (1–5) ya da uygulama adı verin: ${list.exercises.map((item) => item.id).join(', ')}`)
  await storeState(setOpen(state, list, kind, argument, command === 'herkese-ac'), `${argument} ${command === 'kapat' ? 'kilitlendi' : 'açıldı'}`)
} else if (command === 'sayfa-sifresi') {
  const state = await loadState()
  const list = await recoverList(state, secret('KILIT_SIFRESI'))
  if (!list) throw new Error('Ana şifre yanlış.')
  await storeState(await sealList(state, list, secret('SAYFA_SIFRESI')), 'Sayfa şifresini değiştir')
} else if (command === 'sifre-degistir') {
  const state = await loadState()
  const recovery = await rekeyRecovery(state.recovery, secret('KILIT_SIFRESI'), secret('YENI_SIFRE'))
  if (!recovery) throw new Error('Ana şifre yanlış.')
  await storeState({ ...state, recovery }, 'Ana şifreyi değiştir')
} else if (command === 'yeni-parola') {
  console.log(suggestPassphrase())
} else {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 22).join('\n'))
}
