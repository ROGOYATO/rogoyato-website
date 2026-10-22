// Builds the second, on-demand pack of the in-browser compiler: what it
// needs only when a sketch uses a library beyond the preinstalled ones.
//   - cc1, GCC 7.3.0's C compiler (with Arduino's AVR patches) built for
//     WebAssembly by scripts/build-wasm-gcc.sh, for libraries' .c and .S files
//   - the AVR platform's own libraries (Wire, SPI, SoftwareSerial, EEPROM,
//     HID) from the Arduino AVR core, as sources
// Library Manager libraries are downloaded by the browser itself.
//
//   CC1_TOOLS=scripts/out ARDUINO_AVR=/path/to/hardware/avr/1.8.8 \
//   node scripts/build-library-pack.mjs
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'

const TOOLS = {
  'cc1.wasm': '4d91f5faeb5e01ff31d7c56e39a12333231214595f9ce6bced550cadc9ec0530',
  'cc1.mjs': 'e2582b0a461f9ffb2bdf2b2b545bc768428cc8bc962e74a388e5d7f94e56db59',
}
const PLATFORM_LIBRARIES = ['EEPROM', 'HID', 'SPI', 'SoftwareSerial', 'Wire']

const env = (name) => {
  if (!process.env[name]) throw new Error(`Set ${name} (see the comment at the top of this script).`)
  return process.env[name]
}
const CC1_TOOLS = env('CC1_TOOLS')
const ARDUINO_AVR = env('ARDUINO_AVR')
const OUT = new URL('../src/pages/arduino/simulator/compiler/libraries.pack.gz', import.meta.url)

const files = new Map()
const sha256 = (data) => createHash('sha256').update(data).digest('hex')

for (const [name, sum] of Object.entries(TOOLS)) {
  const data = readFileSync(join(CC1_TOOLS, name))
  if (sha256(data) !== sum) throw new Error(`${name}: SHA-256 does not match the pinned build`)
  files.set(`/tools/${name}`, data)
}

// The library as Arduino ships it, without examples and editor files.
function addTree(from, to) {
  for (const entry of readdirSync(from)) {
    const path = join(from, entry)
    if (statSync(path).isDirectory()) addTree(path, `${to}/${entry}`)
    else files.set(`${to}/${entry}`, readFileSync(path))
  }
}
for (const name of PLATFORM_LIBRARIES) {
  const root = join(ARDUINO_AVR, 'libraries', name)
  files.set(`/platform-libraries/${name}/library.properties`, readFileSync(join(root, 'library.properties')))
  addTree(join(root, 'src'), `/platform-libraries/${name}/src`)
}

// Same layout as toolchain.pack.gz (see build-browser-compiler.mjs).
const index = {}
let offset = 0
for (const [path, data] of files) {
  index[path] = [offset, data.length]
  offset += data.length
}
const head = Buffer.from(JSON.stringify(index))
const length = Buffer.alloc(4)
length.writeUInt32LE(head.length)
const packed = gzipSync(Buffer.concat([length, head, ...files.values()]), { level: 9 })
writeFileSync(OUT, packed)
console.log(`${files.size} files (${[...files.keys()].filter((path) => path.startsWith('/platform-libraries/')).map((path) => relative('/platform-libraries', path)).length} library files), ${(offset / 1e6).toFixed(1)} MB -> ${(packed.length / 1e6).toFixed(2)} MB gzip`)
