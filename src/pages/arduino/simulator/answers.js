// The exercises' answers: Blink's ships in examples.js, the rest are
// encrypted one by one in the lock state (src/utils/lockState.js), read at
// run time from the club's gist or data repository (answers/store.json) so
// codes can be renewed and answers opened without a new release. An answer opens with its own code or with its
// week's code, which this browser then remembers, or for everyone once the
// trainers open it.
import { useEffect, useState } from 'react'
import { normalizeCode, unlockWith } from '../../../utils/answerLock'
import { readPublic } from '../../../utils/lockStore'
import store from './answers/store.json'

const STORAGE_KEY = 'rogoyato-kilit-kodlari-v2'
const answers = new Map() // exercise id -> decrypted answer
let statePromise = null
let current = null

// Before the gist exists the state ships with the site.
const bundled = import.meta.glob('./answers/kilit.json', { import: 'default' })

export function loadState() {
  statePromise ??= (store.gist || store.repo ? readPublic(store) : bundled['./answers/kilit.json']())
    .then((state) => {
      current = state
      return state
    })
    .catch((error) => {
      statePromise = null
      throw error
    })
  return statePromise
}

// The lock state for components: null while loading, { error } on failure.
export function useLockState() {
  const [state, setState] = useState(current)
  useEffect(() => {
    let alive = true
    loadState().then(
      (value) => alive && setState(value),
      (error) => alive && setState({ error: error.message }),
    )
    return () => {
      alive = false
    }
  }, [])
  return state
}

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
    if (code) value[kind][key] = normalizeCode(code)
    else delete value[kind][key]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Without storage the answer stays open for this visit only.
  }
}

export const hasAnswer = (example, state) => Boolean(example.answer || state?.exercises?.[example.id])

// Whether this browser already holds a code for the exercise (not yet checked).
export function seemsOpen(example, state) {
  const mine = saved()
  const open = state?.open ?? { weeks: {}, exercises: {} }
  return Boolean(example.answer || open.exercises[example.id] || open.weeks[example.week] || mine.exercises[example.id] || mine.weeks[example.week])
}

async function openWithCode(state, example, code) {
  const value = await unlockWith(code, `uygulama-${example.id}`, state.exercises[example.id])
  if (value) answers.set(example.id, value)
  return value
}

async function openWithWeekCode(state, example, code) {
  const list = (await unlockWith(code, `hafta-${example.week}`, state.weeks[example.week]))?.codes
  return list?.[example.id] ? openWithCode(state, example, list[example.id]) : null
}

// The answer if this browser may see it, otherwise null (locked). Codes
// remembered here that were renewed since are forgotten.
export async function getAnswer(example) {
  if (example.answer) return example.answer
  if (answers.has(example.id)) return answers.get(example.id)
  const state = await loadState()
  const { open } = state
  if (open.exercises[example.id] && (await openWithCode(state, example, open.exercises[example.id]))) return answers.get(example.id)
  if (open.weeks[example.week] && (await openWithWeekCode(state, example, open.weeks[example.week]))) return answers.get(example.id)
  const mine = saved()
  if (mine.exercises[example.id]) {
    if (await openWithCode(state, example, mine.exercises[example.id])) return answers.get(example.id)
    remember('exercises', example.id, null)
  }
  if (mine.weeks[example.week]) {
    if (await openWithWeekCode(state, example, mine.weeks[example.week])) return answers.get(example.id)
    remember('weeks', example.week, null)
  }
  return null
}

// Tries a code: the exercise's own, or its week's. True when it opens.
export async function unlock(example, code) {
  const state = await loadState()
  if (await openWithCode(state, example, code)) {
    remember('exercises', example.id, code)
    return true
  }
  if (await openWithWeekCode(state, example, code)) {
    remember('weeks', example.week, code)
    return true
  }
  return false
}
