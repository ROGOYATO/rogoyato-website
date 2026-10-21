// Compiles Arduino Uno sketches for the simulator on the ROGOYATO site.
//
// POST /compile  {"sketch": "<.ino source>"}
//   200 {"ok": true,  "hex": "...", "size": "..."}   compiled
//   200 {"ok": false, "errors": "..."}               compiler errors
//   4xx/5xx {"ok": false, "errors": "..."}           rejected or busy
// GET /health -> ok
//
// The source is checked before it reaches the compiler: only a short list
// of headers may be included and anything that could read files on the
// server (include paths, inline assembly, .incbin, pragmas) is rejected.
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = Number(process.env.PORT || 8080)
const ARDUINO_CLI = process.env.ARDUINO_CLI || 'arduino-cli'
const FQBN = 'arduino:avr:uno'
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rogoyato.com,https://www.rogoyato.com,http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const MAX_SOURCE_BYTES = 64 * 1024
const COMPILE_TIMEOUT_MS = 30_000
const MAX_PARALLEL = Number(process.env.MAX_PARALLEL || 2)
const MAX_QUEUE = Number(process.env.MAX_QUEUE || 20)
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE || 20)
const CACHE_ENTRIES = 300

const ALLOWED_INCLUDES = new Set([
  'Arduino.h', 'Servo.h', 'DHT.h', 'DHT_U.h', 'Adafruit_Sensor.h',
  'math.h', 'stdlib.h', 'string.h', 'stdint.h', 'stdbool.h', 'ctype.h', 'limits.h',
  'avr/pgmspace.h', 'avr/io.h', 'avr/interrupt.h', 'util/delay.h',
])
const DIRECTIVE = /^\s*#\s*(include|define|undef|if|ifdef|ifndef|else|elif|endif|pragma|error|warning)\b/

// Returns an error message in Turkish, or null when the sketch may be compiled.
export function checkSketch(source) {
  if (typeof source !== 'string' || !source.trim()) return 'Kod boş.'
  if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) return 'Kod çok uzun (en fazla 64 KB).'
  // The preprocessor joins lines ending in a backslash, so check the joined text.
  const joined = source.replace(/\\\r?\n/g, '')
  if (/%:/.test(joined)) return '"%:" kullanılamaz.'
  if (/\b(asm|__asm__|__asm|_Pragma|__has_include|__has_include_next)\b/.test(joined) || /incbin/i.test(joined)) {
    return 'Assembly ve derleyiciye özel komutlar bu simülatörde kullanılamaz.'
  }
  const lines = joined.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!/^\s*#/.test(line)) continue
    const where = `Satır ${index + 1}: `
    if (!DIRECTIVE.test(line)) return `${where}Bu önişlemci satırı kullanılamaz.`
    if (/^\s*#\s*pragma\b/.test(line) && !/^\s*#\s*pragma\s+once\s*$/.test(line)) return `${where}#pragma kullanılamaz.`
    if (/^\s*#\s*include\b/.test(line)) {
      const match = line.match(/^\s*#\s*include\s*[<"]([^>"]+)[>"]\s*(\/\/.*)?$/)
      if (!match) return `${where}#include satırı <Kütüphane.h> biçiminde olmalı.`
      if (!ALLOWED_INCLUDES.has(match[1].trim())) {
        return `${where}"${match[1]}" eklenemez. Kullanılabilen kütüphaneler: Servo.h, DHT.h ve standart C başlıkları.`
      }
    }
  }
  return null
}

function run(file, args, options) {
  return new Promise((resolve) => {
    execFile(file, args, options, (error, stdout, stderr) => resolve({ error, stdout: String(stdout), stderr: String(stderr) }))
  })
}

async function compile(source) {
  const workDir = await mkdtemp(join(tmpdir(), 'sketch-'))
  try {
    const sketchDir = join(workDir, 'sketch')
    const outDir = join(workDir, 'out')
    await mkdir(sketchDir)
    await writeFile(join(sketchDir, 'sketch.ino'), source)
    const result = await run(ARDUINO_CLI, ['compile', '--fqbn', FQBN, '--output-dir', outDir, '--warnings', 'default', sketchDir], {
      timeout: COMPILE_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1' },
    })
    // Hide server paths from the messages shown to students.
    const clean = (text) =>
      text
        .split(sketchDir + '/').join('')
        .split(workDir).join('')
        .replace(/^Error during build:.*$/m, '')
        .trim()
    if (result.error) {
      if (result.error.killed) return { ok: false, errors: 'Derleme zaman aşımına uğradı.' }
      return { ok: false, errors: clean(result.stderr || result.stdout) || 'Derleme başarısız oldu.' }
    }
    const hex = await readFile(join(outDir, 'sketch.ino.hex'), 'utf8')
    return { ok: true, hex, size: clean(result.stdout) }
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

// Same source compiles to the same program, so keep recent results.
const cache = new Map()
function remember(key, value) {
  cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_ENTRIES) cache.delete(cache.keys().next().value)
}

let running = 0
const queue = []
async function withSlot(task) {
  if (running >= MAX_PARALLEL) {
    if (queue.length >= MAX_QUEUE) return null
    await new Promise((resolve) => queue.push(resolve))
  }
  running += 1
  try {
    return await task()
  } finally {
    running -= 1
    queue.shift()?.()
  }
}

const hits = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT_PER_MINUTE
}
setInterval(() => {
  const now = Date.now()
  for (const [ip, times] of hits) if (times.every((time) => now - time >= 60_000)) hits.delete(ip)
}, 60_000).unref()

function send(res, status, body, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', Vary: 'Origin' }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
    headers['Access-Control-Max-Age'] = '86400'
  }
  res.writeHead(status, headers)
  res.end(body === null ? '' : JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_SOURCE_BYTES * 2) {
        reject(new Error('too large'))
        req.destroy()
      } else {
        chunks.push(chunk)
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin
  const url = new URL(req.url, 'http://localhost')

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
    return
  }
  if (req.method === 'OPTIONS' && url.pathname === '/compile') {
    send(res, 204, null, origin)
    return
  }
  if (req.method !== 'POST' || url.pathname !== '/compile') {
    send(res, 404, { ok: false, errors: 'Bulunamadı.' }, origin)
    return
  }
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    send(res, 403, { ok: false, errors: 'Bu siteden derleme isteği kabul edilmiyor.' }, origin)
    return
  }

  let sketch
  try {
    sketch = JSON.parse(await readBody(req)).sketch
  } catch {
    send(res, 400, { ok: false, errors: 'İstek okunamadı.' }, origin)
    return
  }

  const problem = checkSketch(sketch)
  if (problem) {
    send(res, 400, { ok: false, errors: problem }, origin)
    return
  }

  const key = createHash('sha256').update(sketch).digest('hex')
  if (cache.has(key)) {
    send(res, 200, { ...cache.get(key), cached: true }, origin)
    return
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
  if (rateLimited(ip)) {
    send(res, 429, { ok: false, errors: 'Çok fazla derleme isteği gönderildi. Bir dakika sonra tekrar deneyin.' }, origin)
    return
  }

  try {
    const result = await withSlot(() => compile(sketch))
    if (!result) {
      send(res, 503, { ok: false, errors: 'Sunucu şu an çok yoğun. Birkaç saniye sonra tekrar deneyin.' }, origin)
      return
    }
    remember(key, result)
    send(res, 200, result, origin)
  } catch (error) {
    console.error(error)
    send(res, 500, { ok: false, errors: 'Derleme sunucusunda bir hata oluştu.' }, origin)
  }
})

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  server.listen(PORT, () => console.log(`compile server listening on :${PORT}`))
}

export { server }
