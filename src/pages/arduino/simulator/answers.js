// The exercises' answers: Blink's ships in examples.js, the rest are
// encrypted one by one (answers/locked.json). An answer opens with its own
// code or with its week's code, which this browser then remembers, or for
// everyone once the code is published in answers/open.json.
import { normalizeCode, unlockWith } from '../../../utils/answerLock'
import locked from './answers/locked.json'
import open from './answers/open.json'

const STORAGE_KEY = 'rogoyato-kilit-kodlari-v2'
const answers = new Map() // exercise id -> decrypted answer
const weekLists = new Map() // week -> { exercise id: code }

function saved() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return { weeks: value?.weeks ?? {}, exercises: value?.exercises ?? {} }
  } catch {
    return { weeks: {}, exercises: {} }
  }
}

function remember(kind, key, code) {
  try {
    const value = saved()
    value[kind][key] = normalizeCode(code)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Without storage the answer stays open for this visit only.
  }
}

export const hasAnswer = (example) => Boolean(example.answer || locked.exercises[example.id])

// Whether this browser already holds a code for the exercise (not yet checked).
export function seemsOpen(example) {
  const mine = saved()
  return Boolean(example.answer || open.exercises[example.id] || open.weeks[example.week] || mine.exercises[example.id] || mine.weeks[example.week])
}

async function openWithCode(example, code) {
  const value = await unlockWith(code, `uygulama-${example.id}`, locked.exercises[example.id])
  if (value) answers.set(example.id, value)
  return value
}

async function weekList(week, code) {
  if (weekLists.has(week)) return weekLists.get(week)
  const value = (await unlockWith(code, `hafta-${week}`, locked.weeks[week]))?.codes ?? null
  if (value) weekLists.set(week, value)
  return value
}

// The answer if this browser may see it, otherwise null (locked).
export async function getAnswer(example) {
  if (example.answer) return example.answer
  if (answers.has(example.id)) return answers.get(example.id)
  const mine = saved()
  const own = open.exercises[example.id] ?? mine.exercises[example.id]
  if (own && (await openWithCode(example, own))) return answers.get(example.id)
  const weekCode = open.weeks[example.week] ?? mine.weeks[example.week]
  const fromWeek = weekCode ? (await weekList(example.week, weekCode))?.[example.id] : null
  return fromWeek ? openWithCode(example, fromWeek) : null
}

// Tries a code: the exercise's own, or its week's. True when it opens.
export async function unlock(example, code) {
  if (await openWithCode(example, code)) {
    remember('exercises', example.id, code)
    return true
  }
  const list = await weekList(example.week, code)
  if (list?.[example.id] && (await openWithCode(example, list[example.id]))) {
    remember('weeks', example.week, code)
    return true
  }
  return false
}
