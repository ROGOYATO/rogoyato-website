// Writes public/arduino-libraries.json, the Arduino Library Manager's index
// cut down to the newest release of every AVR library (see
// src/pages/arduino/simulator/compiler/libraryIndex.js). Run by the deploy so
// students get a fresh list; without it the browser fetches the full index.
//
//   node scripts/build-library-index.mjs
import { writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { FULL_INDEX, compactIndex } from '../src/pages/arduino/simulator/compiler/libraryIndex.js'

const response = await fetch(FULL_INDEX)
if (!response.ok) throw new Error(`Library index: HTTP ${response.status}`)
const entries = compactIndex(JSON.parse(gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8')))
writeFileSync(new URL('../public/arduino-libraries.json', import.meta.url), JSON.stringify(entries))
console.log(`${entries.length} AVR libraries in public/arduino-libraries.json`)
