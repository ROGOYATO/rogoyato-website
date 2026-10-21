// Turns a .ino sketch into C++ the way the Arduino IDE does: adds
// #include <Arduino.h>, declares every function before the first one is
// defined (so loop() can call a function written below it) and keeps the
// compiler's line numbers on the student's lines with #line.

// Blanks comments, string and char literals and preprocessor lines with
// spaces, keeping every newline, so offsets and line numbers still match.
function mask(code, { strings = true, directives = true } = {}) {
  const out = code.split('')
  const blank = (from, to) => {
    for (let k = from; k < Math.min(to, out.length); k += 1) if (out[k] !== '\n') out[k] = ' '
  }
  let i = 0
  let lineStart = true
  while (i < code.length) {
    const c = code[i]
    const next = code[i + 1]
    if (c === '/' && next === '/') {
      const end = code.indexOf('\n', i)
      const stop = end < 0 ? code.length : end
      blank(i, stop)
      i = stop
    } else if (c === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2)
      const stop = end < 0 ? code.length : end + 2
      blank(i, stop)
      i = stop
    } else if (c === '"' || c === "'") {
      let j = i + 1
      while (j < code.length && code[j] !== c && code[j] !== '\n') j += code[j] === '\\' ? 2 : 1
      if (strings) blank(i + 1, j)
      i = j + 1
    } else if (directives && lineStart && c === '#') {
      // A directive runs to the end of the line, or further with a backslash.
      let j = i
      for (;;) {
        const end = code.indexOf('\n', j)
        const stop = end < 0 ? code.length : end
        if (end >= 0 && code.slice(j, stop).replace(/\r$/, '').endsWith('\\')) {
          j = end + 1
          continue
        }
        j = stop
        break
      }
      blank(i, j)
      i = j
    } else {
      if (c === '\n') lineStart = true
      else if (c !== ' ' && c !== '\t' && c !== '\r') lineStart = false
      i += 1
    }
  }
  return out.join('')
}

const INCLUDE = /^[ \t]*#[ \t]*include[ \t]*[<"]([^>"\n]+)[>"]/gm
// return type, name, (arguments): arguments may hold one level of
// parentheses, as in a function pointer parameter
const SIGNATURE = /^([A-Za-z_][\w\s*&:<>,]*?[\s*&])([A-Za-z_]\w*)\s*\(([^;{}()]*(?:\([^;{}()]*\)[^;{}()]*)*)\)\s*(?:const\s*)?$/
const NOT_A_FUNCTION = /\b(class|struct|union|enum|namespace|template|typedef|operator)\b/
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'sizeof', 'do', 'else'])
const squash = (text) => text.trim().replace(/\s+/g, ' ')

export function findIncludes(code) {
  return [...mask(code, { strings: false, directives: false }).matchAll(INCLUDE)].map((match) => match[1].trim())
}

// Functions defined at file scope, and the names already declared there.
function findFunctions(code) {
  const masked = mask(code)
  const definitions = []
  const declared = new Set()
  let depth = 0
  let segment = 0
  for (let i = 0; i < masked.length; i += 1) {
    const c = masked[i]
    if (c === '{') {
      if (depth === 0) {
        const raw = masked.slice(segment, i)
        const match = squash(raw).match(SIGNATURE)
        if (match) {
          const start = segment + raw.search(/\S/)
          const original = code.slice(start, i)
          const name = match[2]
          // Skip control statements, class members (A::b), defaults and
          // signatures split by #if lines, which cannot be copied safely.
          const usable = !KEYWORDS.has(name) && !NOT_A_FUNCTION.test(match[0]) && !match[0].includes('=') && !match[1].includes('::') && !/\n[ \t]*#/.test(original)
          if (usable) definitions.push({ name, signature: squash(original), line: code.slice(0, start).split('\n').length })
        }
      }
      depth += 1
      segment = i + 1
    } else if (c === '}') {
      depth = Math.max(0, depth - 1)
      segment = i + 1
    } else if (c === ';' && depth === 0) {
      const match = squash(masked.slice(segment, i)).match(SIGNATURE)
      if (match) declared.add(match[2])
      segment = i + 1
    }
  }
  return { definitions, declared }
}

export function preprocessSketch(source, name = 'sketch.ino') {
  const code = source.replace(/\r\n?/g, '\n')
  const lines = code.split('\n')
  const { definitions, declared } = findFunctions(code)
  const at = (line) => `#line ${line} ${JSON.stringify(name)}`
  const seen = new Set()
  const prototypes = definitions.filter((d) => !declared.has(d.name) && !seen.has(d.signature) && seen.add(d.signature))
  if (!prototypes.length) return `#include <Arduino.h>\n${at(1)}\n${code}\n`
  const first = definitions[0].line
  return [
    '#include <Arduino.h>',
    at(1),
    ...lines.slice(0, first - 1),
    ...prototypes.flatMap((d) => [at(d.line), `${d.signature};`]),
    at(first),
    ...lines.slice(first - 1),
    '',
  ].join('\n')
}
