// Precompiles the simulator's starter sketches (and Blink's answer) so they
// run before the in-browser compiler is downloaded. Re-run after changing an example:
//   ARDUINO_CLI=/path/to/arduino-cli node scripts/build-sim-examples.mjs
// (arduino:avr 1.8.8, Servo 1.3.0, DHT sensor library 1.4.7 must be installed)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EXAMPLES, sketchHash } from '../src/pages/arduino/simulator/examples.js'

const cli = process.env.ARDUINO_CLI || 'arduino-cli'
const out = {}
// Each exercise's empty starter, and Blink's open answer.
const sketches = EXAMPLES.flatMap((example) => [[example.id, example.code], ...(example.answer ? [[`${example.id}-cevap`, example.answer.code]] : [])])
for (const [id, code] of sketches) {
  const dir = mkdtempSync(join(tmpdir(), 'example-'))
  try {
    mkdirSync(join(dir, 'sketch'))
    writeFileSync(join(dir, 'sketch', 'sketch.ino'), code)
    execFileSync(cli, ['compile', '--fqbn', 'arduino:avr:uno', '--output-dir', join(dir, 'out'), join(dir, 'sketch')], { stdio: ['ignore', 'ignore', 'inherit'] })
    out[id] = { hash: sketchHash(code), hex: readFileSync(join(dir, 'out', 'sketch.ino.hex'), 'utf8') }
    console.log(`compiled ${id}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
writeFileSync(new URL('../src/pages/arduino/simulator/exampleHex.json', import.meta.url), JSON.stringify(out))
console.log(`wrote ${Object.keys(out).length} examples`)
