import { browserCompilerSupported, compileInBrowser } from './compiler/browserCompiler'
import exampleHex from './exampleHex.json'
import { sketchHash } from './examples'

// Optional: a compile server (compile-server/) used only when the browser
// cannot run the compiler itself (very old browsers).
export const COMPILE_URL = (import.meta.env.VITE_ARDUINO_COMPILE_URL ?? '').replace(/\/$/, '')

// gcc reports problems as "sketch.ino:12:5: error: ..."
export function parseDiagnostics(text) {
  const items = []
  for (const match of String(text ?? '').matchAll(/sketch\.ino:(\d+):(\d+):\s+(?:fatal )?(error|warning|note):\s+(.+)/g)) {
    if (match[3] === 'note') continue
    items.push({ line: Number(match[1]), column: Number(match[2]), level: match[3], message: match[4] })
  }
  return items
}

const usage = ({ flash, ram }) => `Program ${flash} bayt (%${Math.round((flash / 32256) * 100)}), değişkenler ${ram} bayt (%${Math.round((ram / 2048) * 100)}).`

async function compileOnServer(code) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)
  try {
    const response = await fetch(`${COMPILE_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sketch: code }),
      signal: controller.signal,
    })
    const result = await response.json().catch(() => ({ ok: false, errors: `Sunucu yanıtı okunamadı (HTTP ${response.status}).` }))
    if (result.ok) return { ok: true, hex: result.hex, size: result.size, source: result.cached ? 'cache' : 'server' }
    return { ok: false, errors: result.errors, diagnostics: parseDiagnostics(result.errors) }
  } catch (error) {
    return {
      ok: false,
      errors: error.name === 'AbortError' ? 'Derleme sunucusu yanıt vermedi.' : 'Derleme sunucusuna ulaşılamadı. İnternet bağlantınızı kontrol edin.',
      diagnostics: [],
    }
  } finally {
    clearTimeout(timeout)
  }
}

// Programs known in advance: the examples' starters and Blink, plus the
// answers this browser has unlocked (they ship with their compiled hex).
const known = new Map(Object.values(exampleHex).map((entry) => [entry.hash, entry.hex]))
export const rememberCompiled = (code, hex) => known.set(sketchHash(code), hex)

export async function compileSketch(code) {
  const precompiled = known.get(sketchHash(code))
  if (precompiled) return { ok: true, hex: precompiled, source: 'example' }

  if (browserCompilerSupported()) {
    const result = await compileInBrowser(code)
    if (result.ok) return { ok: true, hex: result.hex, size: usage(result), source: 'browser' }
    if (!result.unavailable || !COMPILE_URL) return { ok: false, errors: result.errors, diagnostics: parseDiagnostics(result.errors) }
  }
  if (COMPILE_URL) return compileOnServer(code)
  return {
    ok: false,
    errors: 'Bu tarayıcı kodu derleyemiyor. Güncel bir Chrome, Edge, Firefox ya da Safari ile deneyin; hazır örnekler yine de çalışır.',
    diagnostics: [],
  }
}
