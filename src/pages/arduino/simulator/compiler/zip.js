// Reads a .zip archive (as Library Manager libraries come) into a Map of
// path -> bytes, with the platform's own deflate decoder. Works in a Web
// Worker and in Node.

async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // The end-of-central-directory record sits in the last 64 KB.
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i
      break
    }
  }
  if (end < 0) throw new Error('Geçersiz zip dosyası.')
  const count = view.getUint16(end + 10, true)
  let at = view.getUint32(end + 16, true)
  const decoder = new TextDecoder()
  const files = new Map()
  for (let n = 0; n < count; n += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error('Geçersiz zip dosyası.')
    const method = view.getUint16(at + 10, true)
    const compressed = view.getUint32(at + 20, true)
    const nameLength = view.getUint16(at + 28, true)
    const extraLength = view.getUint16(at + 30, true)
    const commentLength = view.getUint16(at + 32, true)
    const local = view.getUint32(at + 42, true)
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength))
    at += 46 + nameLength + extraLength + commentLength
    if (name.endsWith('/')) continue
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
    const data = bytes.subarray(start, start + compressed)
    if (method === 0) files.set(name, data)
    else if (method === 8) files.set(name, await inflate(data))
  }
  return files
}
