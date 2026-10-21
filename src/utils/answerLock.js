// Locks the simulator's answers. Every exercise is encrypted (AES-GCM) with
// its own unlock code; a week also has a code that opens all of its
// exercises. The trainers' page reads the code list with a page password,
// and can renew any code or open an answer for everyone. A master password
// recovers the code list if the page password is lost. Nothing readable is
// in the site or the repository. Works with Web Crypto in the browser and
// in Node 20+.
//
//   code --PBKDF2--> AES key that opens an exercise (or its week's code list)
//   page password --PBKDF2--> AES key that opens the trainers' code list
//   master password --PBKDF2--> AES key that opens the recovery RSA key,
//                               which opens a second copy of the code list
//
// The first codes were derived from the master password (weekCode,
// exerciseCode); renewed codes are random.

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
// "Örnek KELİME  şeker-İNCİ 12" and "ornek-kelime-seker-inci-12" are the same:
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

// A fresh random code, for renewing one exercise's or one week's code.
export function randomCode() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
  return formatCode([...bytes].map((byte) => ALPHABET[byte % 32]).join(''))
}

// Recovery: the code list is also sealed to an RSA public key whose private
// half is locked with the master password. The trainers' page can update
// that copy without knowing the master password, and the master password
// can always bring the codes back (and set a new page password).
const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' }
const recoveryKey = (password) => aesKey(normalizePassphrase(password), 'rogoyato-kurtarma-v1', SLOW_ROUNDS)

export async function createRecovery(password) {
  const pair = await subtle.generateKey({ ...RSA, modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['encrypt', 'decrypt'])
  const publicKey = toBase64(new Uint8Array(await subtle.exportKey('spki', pair.publicKey)))
  const privateKey = toBase64(new Uint8Array(await subtle.exportKey('pkcs8', pair.privateKey)))
  return { publicKey, privateKey: await seal(await recoveryKey(password), privateKey) }
}

// Same key pair under a new master password.
export async function rekeyRecovery(recovery, password, newPassword) {
  const privateKey = await open(await recoveryKey(password), recovery.privateKey)
  return privateKey ? { publicKey: recovery.publicKey, privateKey: await seal(await recoveryKey(newPassword), privateKey) } : null
}

export async function sealForRecovery(recovery, value) {
  const publicKey = await subtle.importKey('spki', fromBase64(recovery.publicKey), RSA, false, ['encrypt'])
  const raw = globalThis.crypto.getRandomValues(new Uint8Array(32))
  const wrapped = new Uint8Array(await subtle.encrypt(RSA, publicKey, raw))
  return { key: toBase64(wrapped), ...(await seal(await subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']), value)) }
}

export async function openWithRecovery(password, recovery, escrow) {
  const privateKey = await open(await recoveryKey(password), recovery.privateKey)
  if (!privateKey || !escrow) return null
  try {
    const key = await subtle.importKey('pkcs8', fromBase64(privateKey), RSA, false, ['decrypt'])
    const raw = new Uint8Array(await subtle.decrypt(RSA, key, fromBase64(escrow.key)))
    return open(await subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']), escrow)
  } catch {
    return null
  }
}
