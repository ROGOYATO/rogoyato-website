// Builds the in-browser Arduino compiler pack: GCC 7.3.0 (with Arduino's AVR
// patches) and binutils 2.42 compiled to WebAssembly, plus the headers,
// avr-libc and a precompiled Uno core and libraries for them to use.
//
//   AVR_GCC=/path/to/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7 \
//   ARDUINO_AVR=/path/to/hardware/avr/1.8.8 \
//   ARDUINO_LIBRARIES=/path/to/Arduino/libraries \
//   node scripts/build-browser-compiler.mjs
//
// The WebAssembly tools come from github.com/jeffrey-braam/arduino-ide
// (toolchain/build.sh) at a pinned commit and are checked against their
// SHA-256 sums. Set WASM_TOOLS=/path/to/toolchain/out to use a local copy.
// The output is a single gzip file the simulator downloads on first use.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'

const TOOLS_COMMIT = '8c563b189cacc9953ee20fa51fad1a80da75673d'
const TOOLS = {
  'cc1plus.wasm': 'a87f8b925bf8dc03b5248b5711329719599dbbeacf059f69deeec7fce5f1560d',
  'cc1plus.mjs': 'f4f3981506c3ec73c988c2c9f93430d0ae4e877fadad21c85e4043a6c5e33324',
  'avr-as.wasm': 'fb0bab6b7f6eb01472d0c52d8ec3bd8f5e6a477df2b04162e1482827071be3db',
  'avr-as.mjs': 'd7bb2d5d21b41263e61690ee7c052bf0bda674149e3037890788862a52e41c28',
  'avr-ld.wasm': '8a22a25a18c344842d710319531fb7f53fcd314b7e6284e1cee02233a291770c',
  'avr-ld.mjs': '2070bfba0d716cc74c8596dfa1172a68e1b0fa6a9698894b6ac5911f07b39f25',
  'avr-objcopy.wasm': '8c3671c0fe1171f7fcdce121858602a2df9cae44561e5b8be2664bdac9908bda',
  'avr-objcopy.mjs': '803195598c1e9b51d4253a7419ffe3f143e03ef90ebfb270a89acf105037955e',
}
const LDSCRIPTS = ['avr5.x', 'avr5.xbn', 'avr5.xe', 'avr5.xn', 'avr5.xr', 'avr5.xu']
const RAW = `https://raw.githubusercontent.com/jeffrey-braam/arduino-ide/${TOOLS_COMMIT}/toolchain/out`

const env = (name) => {
  if (!process.env[name]) throw new Error(`Set ${name} (see the comment at the top of this script).`)
  return process.env[name]
}
const AVR_GCC = env('AVR_GCC')
const ARDUINO_AVR = env('ARDUINO_AVR')
const LIBRARIES = env('ARDUINO_LIBRARIES')
const OUT = new URL('../src/pages/arduino/simulator/compiler/toolchain.pack.gz', import.meta.url)

const files = new Map() // path in the browser's file system -> bytes
const sha256 = (data) => createHash('sha256').update(data).digest('hex')

async function tool(name, sum) {
  const data = process.env.WASM_TOOLS ? readFileSync(join(process.env.WASM_TOOLS, name)) : Buffer.from(await (await fetch(`${RAW}/${name}`)).arrayBuffer())
  if (sum && sha256(data) !== sum) throw new Error(`${name}: SHA-256 does not match the pinned build`)
  return data
}

for (const [name, sum] of Object.entries(TOOLS)) files.set(`/tools/${name}`, await tool(name, sum))
for (const name of LDSCRIPTS) files.set(`/ldscripts/${name}`, await tool(`ldscripts/${name}`))

function addTree(from, to, keep = () => true) {
  for (const entry of readdirSync(from)) {
    const path = join(from, entry)
    if (statSync(path).isDirectory()) addTree(path, `${to}/${entry}`, keep)
    else if (keep(relative(from, path), path)) files.set(`${to}/${entry}`, readFileSync(path))
  }
}
const isHeader = (_, path) => /\.(h|hpp)$/.test(path) || basename(path) === 'new'

// Headers: avr-libc (only the ATmega328P's register file of the device
// headers), GCC's own, the Uno core and variant, and the libraries.
addTree(join(AVR_GCC, 'avr/include'), '/sysroot/avr/include', (_, path) => {
  const name = relative(join(AVR_GCC, 'avr/include'), path)
  return !/^avr\/io[a-z0-9_]+\.h$/.test(name) || name === 'avr/io.h' || name === 'avr/iom328p.h'
})
addTree(join(AVR_GCC, 'lib/gcc/avr/7.3.0/include'), '/sysroot/gcc/include')
addTree(join(AVR_GCC, 'lib/gcc/avr/7.3.0/include-fixed'), '/sysroot/gcc/include-fixed')
addTree(join(ARDUINO_AVR, 'cores/arduino'), '/arduino/core', isHeader)
addTree(join(ARDUINO_AVR, 'variants/standard'), '/arduino/variant', isHeader)
addTree(join(ARDUINO_AVR, 'libraries/EEPROM/src'), '/libraries/EEPROM', isHeader)
files.set('/libraries/Servo/Servo.h', readFileSync(join(LIBRARIES, 'Servo/src/Servo.h')))
addTree(join(LIBRARIES, 'Servo/src/avr'), '/libraries/Servo/avr', isHeader)
addTree(join(LIBRARIES, 'DHT_sensor_library'), '/libraries/DHT', (name, path) => !name.includes('/') && isHeader(name, path))
files.set('/libraries/Adafruit_Sensor/Adafruit_Sensor.h', readFileSync(join(LIBRARIES, 'Adafruit_Unified_Sensor/Adafruit_Sensor.h')))

const work = mkdtempSync(join(tmpdir(), 'uno-core-'))
const gcc = (name) => join(AVR_GCC, 'bin', name)

// avr-libc and libgcc for the avr5 family, without debug information.
const libraries = [...['crtatmega328p.o', 'libc.a', 'libm.a', 'libatmega328p.a'].map((name) => join(AVR_GCC, 'avr/lib/avr5', name)), join(AVR_GCC, 'lib/gcc/avr/7.3.0/avr5/libgcc.a')]
for (const source of libraries) {
  const copy = join(work, basename(source))
  writeFileSync(copy, readFileSync(source))
  execFileSync(gcc('avr-strip'), ['--strip-debug', copy])
  files.set(`/libs/${basename(source)}`, readFileSync(copy))
}

// The Uno core and the libraries, compiled with the Arduino platform's
// flags minus -flto (the browser compiler has no LTO plugin).
const DEFINES = ['-mmcu=atmega328p', '-DF_CPU=16000000L', '-DARDUINO=10607', '-DARDUINO_AVR_UNO', '-DARDUINO_ARCH_AVR']
const INCLUDES = ['cores/arduino', 'variants/standard'].map((dir) => `-I${join(ARDUINO_AVR, dir)}`)
function compile(source, object, extraIncludes = []) {
  const flags = source.endsWith('.S')
    ? ['-c', '-x', 'assembler-with-cpp']
    : source.endsWith('.c')
      ? ['-c', '-Os', '-w', '-std=gnu11', '-ffunction-sections', '-fdata-sections']
      : ['-c', '-Os', '-w', '-std=gnu++11', '-fpermissive', '-fno-exceptions', '-ffunction-sections', '-fdata-sections', '-fno-threadsafe-statics', '-Wno-error=narrowing']
  execFileSync(gcc(source.endsWith('.c') ? 'avr-gcc' : 'avr-g++'), [...flags, ...DEFINES, ...INCLUDES, ...extraIncludes.map((dir) => `-I${dir}`), source, '-o', object], { stdio: 'inherit' })
  return object
}
try {
  const core = readdirSync(join(ARDUINO_AVR, 'cores/arduino')).filter((name) => /\.(c|cpp|S)$/.test(name))
  const objects = core.map((name) => compile(join(ARDUINO_AVR, 'cores/arduino', name), join(work, `${name}.o`)))
  execFileSync(gcc('avr-ar'), ['rcs', join(work, 'core.a'), ...objects])
  files.set('/libs/core.a', readFileSync(join(work, 'core.a')))

  const libs = [
    ['Servo.o', join(LIBRARIES, 'Servo/src/avr/Servo.cpp'), [join(LIBRARIES, 'Servo/src')]],
    ['DHT.o', join(LIBRARIES, 'DHT_sensor_library/DHT.cpp'), [join(LIBRARIES, 'DHT_sensor_library'), join(LIBRARIES, 'Adafruit_Unified_Sensor')]],
    ['DHT_U.o', join(LIBRARIES, 'DHT_sensor_library/DHT_U.cpp'), [join(LIBRARIES, 'DHT_sensor_library'), join(LIBRARIES, 'Adafruit_Unified_Sensor')]],
    ['Adafruit_Sensor.o', join(LIBRARIES, 'Adafruit_Unified_Sensor/Adafruit_Sensor.cpp'), [join(LIBRARIES, 'Adafruit_Unified_Sensor')]],
  ]
  for (const [name, source, includes] of libs) files.set(`/libs/${name}`, readFileSync(compile(source, join(work, name), includes)))
} finally {
  rmSync(work, { recursive: true, force: true })
}

// Pack: a little-endian u32 with the length of a JSON index, the index
// ({ path: [offset, size] }), then every file's bytes; gzipped as a whole.
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
if (!existsSync(new URL('.', OUT))) mkdirSync(new URL('.', OUT), { recursive: true })
writeFileSync(OUT, packed)
console.log(`${files.size} files, ${(offset / 1e6).toFixed(1)} MB -> ${(packed.length / 1e6).toFixed(2)} MB gzip`)
