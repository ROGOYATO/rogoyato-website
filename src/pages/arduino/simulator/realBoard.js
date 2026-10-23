// A real Arduino Uno on the computer's USB, from the browser: uploading a
// compiled program to it the way the Arduino IDE does (avrdude's "arduino"
// programmer: STK500 v1 to the Optiboot bootloader) and its Serial Monitor.
// It uses Web Serial, which Chrome and Edge have on computers; the kit's
// CH340 board may need the CH340 driver on Windows.

export const realBoardSupported = () => typeof navigator !== 'undefined' && 'serial' in navigator

// USB-serial chips found on Unos and their clones.
const FILTERS = [
  { usbVendorId: 0x2341 }, // Arduino (ATmega16U2)
  { usbVendorId: 0x2a03 }, // Arduino.org
  { usbVendorId: 0x1a86 }, // WCH CH340 (the kit's board)
  { usbVendorId: 0x0403 }, // FTDI
  { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
]

const CHIP_NAMES = { 0x1a86: 'CH340', 0x2341: 'Arduino', 0x2a03: 'Arduino', 0x0403: 'FTDI', 0x10c4: 'CP210x' }
export function describePort(port) {
  const info = port?.getInfo?.() ?? {}
  return CHIP_NAMES[info.usbVendorId] ? `USB · ${CHIP_NAMES[info.usbVendorId]}` : 'USB seri port'
}

// The port this site was allowed before, or the browser's port picker
// (which needs a click to open).
export async function pickPort(ask = false) {
  if (!ask) {
    const [known] = await navigator.serial.getPorts()
    if (known) return known
  }
  return navigator.serial.requestPort({ filters: FILTERS })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Intel HEX to the flash image, unused bytes 0xFF as the chip has them.
export function hexToImage(text) {
  const bytes = new Uint8Array(32 * 1024).fill(0xff)
  let base = 0
  let end = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith(':')) continue
    const data = line
      .slice(1)
      .match(/../g)
      .map((pair) => parseInt(pair, 16))
    const [count, high, low, type] = data
    const sum = data.reduce((total, value) => (total + value) & 0xff, 0)
    if (sum !== 0) throw new Error('HEX dosyası bozuk (sağlama toplamı tutmuyor).')
    if (type === 0x00) {
      const address = base + ((high << 8) | low)
      if (address + count > bytes.length) throw new Error('Program 32 KB’a sığmıyor.')
      bytes.set(data.slice(4, 4 + count), address)
      end = Math.max(end, address + count)
    } else if (type === 0x02) {
      base = ((data[4] << 8) | data[5]) * 16
    } else if (type === 0x04) {
      base = ((data[4] << 8) | data[5]) << 16
    } else if (type === 0x01) {
      break
    }
  }
  return bytes.slice(0, end)
}

// Bytes in from the port, buffered so they can be awaited a few at a time.
class Link {
  constructor(port) {
    this.port = port
    this.buffer = []
    this.waiting = null
  }

  async open(baudRate) {
    await this.port.open({ baudRate })
    this.reader = this.port.readable.getReader()
    this.writer = this.port.writable.getWriter()
    this.reading = (async () => {
      try {
        for (;;) {
          const { value, done } = await this.reader.read()
          if (done) break
          this.buffer.push(...value)
          this.waiting?.()
        }
      } catch {
        // The port closed or the cable came out.
      }
    })()
  }

  // Each step on its own: after the cable comes out some of them throw.
  async close() {
    const steps = [() => this.reader?.cancel(), () => this.reading, () => this.reader?.releaseLock(), () => this.writer?.releaseLock(), () => this.port.close()]
    for (const step of steps) {
      try {
        await step()
      } catch {
        // Already closed or released.
      }
    }
    this.reader = null
    this.writer = null
  }

  drain() {
    this.buffer = []
  }

  write(bytes) {
    return this.writer.write(Uint8Array.from(bytes))
  }

  async take(count, timeout) {
    const deadline = performance.now() + timeout
    while (this.buffer.length < count) {
      const left = deadline - performance.now()
      if (left <= 0) return null
      await Promise.race([new Promise((resolve) => (this.waiting = resolve)), sleep(left)])
    }
    return this.buffer.splice(0, count)
  }
}

// STK500 v1, as Optiboot speaks it.
const INSYNC = 0x14
const OK = 0x10
const EOP = 0x20
const PAGE = 128 // ATmega328P flash page, bytes

async function command(link, bytes, reply = 0, timeout = 500) {
  await link.write([...bytes, EOP])
  const answer = await link.take(reply + 2, timeout)
  if (!answer || answer[0] !== INSYNC || answer[answer.length - 1] !== OK) return null
  return answer.slice(1, 1 + reply)
}

// Pulses DTR/RTS low, which resets the board into its bootloader for about
// a second, then tries to get in step with it.
async function enterBootloader(link) {
  await link.port.setSignals({ dataTerminalReady: false, requestToSend: false })
  await sleep(250)
  await link.port.setSignals({ dataTerminalReady: true, requestToSend: true })
  await sleep(50)
  link.drain()
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await command(link, [0x30], 0, 200)) return true
    link.drain()
  }
  return false
}

export class UploadError extends Error {}

// Writes `hex` to the board on `port` and reads it back. onProgress(0…1).
export async function uploadToBoard(port, hex, onProgress = () => {}) {
  const image = hexToImage(hex)
  const link = new Link(port)
  try {
    // Optiboot on the Uno listens at 115200 baud; older bootloaders at 57600.
    let synced = false
    for (const baud of [115200, 57600]) {
      try {
        await link.open(baud)
      } catch {
        throw new UploadError('Port açılamadı. Başka bir program (ör. Arduino IDE’nin Serial Monitor’ü) kullanıyor olabilir; onu kapatıp tekrar deneyin.')
      }
      synced = await enterBootloader(link)
      if (synced) break
      await link.close()
      link.buffer = []
    }
    if (!synced) throw new UploadError('Kart yanıt vermedi. Doğru portu seçtiğinizden, kartın Arduino Uno olduğundan ve (Windows’ta) CH340 sürücüsünün kurulu olduğundan emin olun.')
    const signature = await command(link, [0x75], 3)
    if (signature && !(signature[0] === 0x1e && signature[1] === 0x95 && (signature[2] === 0x0f || signature[2] === 0x14))) {
      throw new UploadError(`Karttaki işlemci ATmega328P değil (imza ${signature.map((b) => b.toString(16).padStart(2, '0')).join(' ')}). Kart olarak Arduino Uno seçin.`)
    }
    if (!(await command(link, [0x50]))) throw new UploadError('Kart programlama moduna geçmedi.')
    const pages = Math.ceil(image.length / PAGE)
    const pageAt = (index) => {
      const chunk = new Uint8Array(PAGE).fill(0xff)
      chunk.set(image.slice(index * PAGE, (index + 1) * PAGE))
      return chunk
    }
    const address = (index) => [0x55, ((index * PAGE) >> 1) & 0xff, ((index * PAGE) >> 9) & 0xff]
    for (let index = 0; index < pages; index += 1) {
      if (!(await command(link, address(index)))) throw new UploadError('Yazma adresi ayarlanamadı.')
      if (!(await command(link, [0x64, 0x00, PAGE, 0x46, ...pageAt(index)], 0, 1000))) throw new UploadError('Karta yazılamadı.')
      onProgress(((index + 1) / pages) * 0.7)
    }
    // Read it all back, as avrdude does.
    for (let index = 0; index < pages; index += 1) {
      if (!(await command(link, address(index)))) throw new UploadError('Doğrulama adresi ayarlanamadı.')
      const back = await command(link, [0x74, 0x00, PAGE, 0x46], PAGE, 1000)
      const want = pageAt(index)
      if (!back || back.some((value, i) => value !== want[i])) throw new UploadError('Doğrulama başarısız: karttan okunan program yazılanla aynı değil. Tekrar deneyin.')
      onProgress(0.7 + ((index + 1) / pages) * 0.3)
    }
    await command(link, [0x51])
    return { bytes: image.length }
  } finally {
    await link.close()
  }
}

// The board's Serial Monitor: opening the port resets the board, as the
// IDE's does. onText gets what the board sends; `ended` settles when the
// port stops reading (closed, or the cable came out).
export async function openSerial(port, baudRate, onText) {
  const link = new Link(port)
  await link.open(baudRate)
  const decoder = new TextDecoder()
  let open = true
  link.waiting = () => {
    if (!open || !link.buffer.length) return
    const bytes = Uint8Array.from(link.buffer.splice(0))
    onText(decoder.decode(bytes, { stream: true }))
  }
  return {
    ended: link.reading,
    send: (text) => link.write([...new TextEncoder().encode(text)]),
    close: async () => {
      open = false
      await link.close()
    },
  }
}

// The rate the sketch opens Serial at, for the real board's monitor.
export const sketchBaud = (code) => Number(/Serial\s*\.\s*begin\s*\(\s*(\d+)/.exec(code)?.[1] ?? 9600)
