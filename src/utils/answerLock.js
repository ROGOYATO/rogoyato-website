// Locks the simulator's answers. Every exercise is encrypted (AES-GCM) with
// a key derived from its own unlock code; a week also has a code that opens
// all of its exercises. The codes come from a master password only the club
// knows, so the site and the public repository hold nothing readable. The
// trainers' page reads the codes from a list sealed with a separate page
// password. Works with Web Crypto in the browser and in Node 20+.
//
//   master password --PBKDF2--> master key --HMAC--> exercise and week codes
//   code --PBKDF2--> AES key that opens that exercise (or the week's code list)
//   page password --PBKDF2--> AES key that opens the trainers' code list

const subtle = globalThis.crypto.subtle
const encoder = new TextEncoder()
// No 0/1/I/O, so codes read off a projector or a photo survive.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_LENGTH = 12 // 60 bits
const SLOW_ROUNDS = 600_000 // for passwords people choose or remember
const CODE_ROUNDS = 150_000

const toBase64 = (bytes) => {
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text)
}
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

async function pbkdf2(secret, salt, rounds) {
  const material = await subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: rounds }, material, 256))
}

export const normalizeCode = (code) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
export const formatCode = (code) => normalizeCode(code).replace(/(.{4})(?=.)/g, '$1-')
export const looksLikeCode = (code) => normalizeCode(code).length === CODE_LENGTH && [...normalizeCode(code)].every((c) => ALPHABET.includes(c))
// "Kartal LİMON  güvercin-IZ 47" and "kartal-limon-guvercin-iz-47" are the same:
// case, spacing and Turkish letters do not matter.
const PLAIN = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }
export const normalizePassphrase = (text) =>
  String(text ?? '')
    .replace(/[İI]/g, 'i')
    .toLowerCase()
    .replace(/[çğıöşüâîû]/g, (c) => PLAIN[c])
    .split(/[\s\-_.,]+/)
    .filter(Boolean)
    .join('-')

// The master key; slow on purpose so a leaked code cannot be used to guess
// the master password.
export async function masterKey(password) {
  const bits = await pbkdf2(password, 'rogoyato-arduino-kilit-v1', SLOW_ROUNDS)
  return subtle.importKey('raw', bits, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

async function derive(master, label) {
  const mac = new Uint8Array(await subtle.sign('HMAC', master, encoder.encode(label)))
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[mac[i] % 32]
  return formatCode(code)
}
export const weekCode = (master, week) => derive(master, `hafta-${week}`)
export const exerciseCode = (master, id) => derive(master, `uygulama-${id}`)

async function aesKey(secret, salt, rounds) {
  return subtle.importKey('raw', await pbkdf2(secret, salt, rounds), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function seal(key, value) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const data = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)))
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(data)) }
}

async function open(key, payload) {
  try {
    const plain = await subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(payload.iv) }, key, fromBase64(payload.data))
    return JSON.parse(new TextDecoder().decode(plain))
  } catch {
    return null
  }
}

// scope: 'uygulama-<id>' or 'hafta-<n>'. Unlocking returns null for a wrong code.
export const lockWith = async (code, scope, value) => seal(await aesKey(normalizeCode(code), `rogoyato-${scope}`, CODE_ROUNDS), value)
export const unlockWith = async (code, scope, payload) =>
  payload && looksLikeCode(code) ? open(await aesKey(normalizeCode(code), `rogoyato-${scope}`, CODE_ROUNDS), payload) : null

// The trainers' code list, behind the page password.
export const sealForPage = async (passphrase, value) => seal(await aesKey(normalizePassphrase(passphrase), 'rogoyato-kilit-sayfasi-v1', SLOW_ROUNDS), value)
export const openForPage = async (passphrase, payload) =>
  payload && normalizePassphrase(passphrase) ? open(await aesKey(normalizePassphrase(passphrase), 'rogoyato-kilit-sayfasi-v1', SLOW_ROUNDS), payload) : null
