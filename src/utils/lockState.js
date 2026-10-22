// The lock state: everything the simulator needs to lock and open answers,
// in one JSON document kept in a gist or data repository (src/utils/lockStore.js),
// or bundled with the site before that exists.
//
//   exercises  { id: { week, iv, data } }   answer, opened by the exercise code
//   weeks      { week: { iv, data } }       { codes: { id: code } }, opened by the week code
//   all        { iv, data }                 { codes: { id: code } } of every exercise, opened by the "all" code
//   open       { exercises: { id: code }, weeks: { week: code } }   open to everyone (weeks: older states only)
//   page       { iv, data }                 code list, opened by the page password
//   recovery   { publicKey, privateKey }    RSA key, private half under the master password
//   escrow     { key, iv, data }            code list again, opened by the recovery key
//
// The code list is { all, weeks: { week: code }, exercises: [{ id, title, week, code }] }.
// The functions below return a new state and list; the caller saves them.
import { lockWith, openForPage, openWithRecovery, randomCode, sealForPage, sealForRecovery, unlockWith } from './answerLock.js'

export const STATE_VERSION = 3
const clone = (value) => JSON.parse(JSON.stringify(value))

export const readList = (state, pagePassword) => openForPage(pagePassword, state.page)
export const recoverList = (state, masterPassword) => openWithRecovery(masterPassword, state.recovery, state.escrow)

// Seals the list under the page password and for recovery.
export async function sealList(state, list, pagePassword) {
  return { ...state, page: await sealForPage(pagePassword, list), escrow: await sealForRecovery(state.recovery, list) }
}

// The "all" code's list of every exercise code, sealed again after a change.
export const sealAll = (code, exercises) => lockWith(code, 'tumu', { codes: Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.code])) })

// A new code for one exercise: its answer is re-encrypted, its week's code
// list (and the "all" list) updated; if it was open to everyone it stays open
// with the new code.
export async function renewExercise(state, list, id, pagePassword) {
  const item = list.exercises.find((exercise) => exercise.id === id)
  const answer = await unlockWith(item.code, `uygulama-${id}`, state.exercises[id])
  if (!answer) throw new Error(`${item.title}: mevcut kod cevabı açmıyor.`)
  const weekCodes = await unlockWith(list.weeks[item.week], `hafta-${item.week}`, state.weeks[item.week])
  if (!weekCodes) throw new Error(`${item.week}. haftanın kod listesi açılamadı.`)
  const code = randomCode()
  const next = clone(state)
  next.exercises[id] = { week: item.week, ...(await lockWith(code, `uygulama-${id}`, answer)) }
  next.weeks[item.week] = await lockWith(list.weeks[item.week], `hafta-${item.week}`, { codes: { ...weekCodes.codes, [id]: code } })
  if (next.open.exercises[id]) next.open.exercises[id] = code
  const nextList = { ...list, exercises: list.exercises.map((exercise) => (exercise.id === id ? { ...exercise, code } : exercise)) }
  if (nextList.all) next.all = await sealAll(nextList.all, nextList.exercises)
  return { state: await sealList(next, nextList, pagePassword), list: nextList }
}

// A new code that opens every answer (also creates the first one); the
// exercises and weeks keep their own codes.
export async function renewAll(state, list, pagePassword) {
  const code = randomCode()
  const next = { ...clone(state), all: await sealAll(code, list.exercises) }
  const nextList = { ...list, all: code }
  return { state: await sealList(next, nextList, pagePassword), list: nextList }
}

// A new code for a week; the exercises keep their own codes.
export async function renewWeek(state, list, week, pagePassword) {
  const weekCodes = await unlockWith(list.weeks[week], `hafta-${week}`, state.weeks[week])
  if (!weekCodes) throw new Error(`${week}. haftanın kod listesi açılamadı.`)
  const code = randomCode()
  const next = clone(state)
  next.weeks[week] = await lockWith(code, `hafta-${week}`, weekCodes)
  if (next.open.weeks[week]) next.open.weeks[week] = code
  const nextList = { ...list, weeks: { ...list.weeks, [week]: code } }
  return { state: await sealList(next, nextList, pagePassword), list: nextList }
}

// Opening publishes the exercises' own codes in the state; closing removes
// them. A week opens as each of its exercises, never as the week code, so
// one exercise can be locked again on its own. (Older states may still hold
// an open week code: it is turned into its exercises first.)
export function setOpen(state, list, kind, key, isOpen) {
  const next = clone(state)
  const inWeek = (week) => list.exercises.filter((exercise) => String(exercise.week) === String(week))
  const week = kind === 'weeks' ? key : list.exercises.find((exercise) => exercise.id === key)?.week
  if (next.open.weeks[week]) {
    delete next.open.weeks[week]
    for (const exercise of inWeek(week)) next.open.exercises[exercise.id] = exercise.code
  }
  for (const exercise of kind === 'weeks' ? inWeek(key) : list.exercises.filter((item) => item.id === key)) {
    if (isOpen) next.open.exercises[exercise.id] = exercise.code
    else delete next.open.exercises[exercise.id]
  }
  return next
}

// Every exercise open to everyone, or all locked again.
export function setOpenAll(state, list, isOpen) {
  const next = clone(state)
  next.open.weeks = {}
  next.open.exercises = isOpen ? Object.fromEntries(list.exercises.map((exercise) => [exercise.id, exercise.code])) : {}
  return next
}
