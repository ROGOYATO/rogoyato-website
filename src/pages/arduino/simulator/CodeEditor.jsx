// The sketch editor: CodeMirror 6 with C++ highlighting, Arduino names
// coloured on top, autocompletion for the Arduino API and compiler errors
// marked on their lines. One editable surface, so the caret and the
// colours can never drift apart.
import { autocompletion, closeBrackets, closeBracketsKeymap, completeFromList, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { cpp, cppLanguage } from '@codemirror/lang-cpp'
import { HighlightStyle, bracketMatching, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language'
import { lintGutter, setDiagnostics } from '@codemirror/lint'
import { Compartment, EditorState } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { useEffect, useRef } from 'react'

// Arduino's own names, which C++ alone sees as plain identifiers.
const FUNCTIONS = {
  pinMode: 'pinMode(pin, mode)',
  digitalWrite: 'digitalWrite(pin, value)',
  digitalRead: 'digitalRead(pin)',
  analogRead: 'analogRead(pin)',
  analogWrite: 'analogWrite(pin, value)',
  delay: 'delay(ms)',
  delayMicroseconds: 'delayMicroseconds(us)',
  millis: 'millis()',
  micros: 'micros()',
  pulseIn: 'pulseIn(pin, value, timeout)',
  tone: 'tone(pin, frequency, duration)',
  noTone: 'noTone(pin)',
  map: 'map(value, fromLow, fromHigh, toLow, toHigh)',
  constrain: 'constrain(x, a, b)',
  min: 'min(a, b)',
  max: 'max(a, b)',
  abs: 'abs(x)',
  random: 'random(min, max)',
  randomSeed: 'randomSeed(seed)',
  attachInterrupt: 'attachInterrupt(digitalPinToInterrupt(pin), isr, mode)',
  digitalPinToInterrupt: 'digitalPinToInterrupt(pin)',
  shiftOut: 'shiftOut(dataPin, clockPin, bitOrder, value)',
  setup: 'void setup()',
  loop: 'void loop()',
}
const OBJECTS = ['Serial', 'EEPROM']
const CONSTANTS = ['HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'DHT11', 'DHT22', 'CHANGE', 'RISING', 'FALLING', 'MSBFIRST', 'LSBFIRST']
const TYPES = ['byte', 'boolean', 'word', 'String', 'Servo', 'DHT', 'uint8_t', 'int8_t', 'uint16_t', 'int16_t', 'uint32_t', 'int32_t', 'size_t']
const METHODS = ['begin', 'print', 'println', 'available', 'read', 'write', 'attach', 'detach', 'readTemperature', 'readHumidity', 'parseInt', 'readStringUntil']

const words = (list) => new RegExp(`\\b(?:${list.join('|')})\\b`, 'g')
function marker(list, className) {
  const decorator = new MatchDecorator({ regexp: words(list), decoration: Decoration.mark({ class: className }) })
  return ViewPlugin.define((view) => ({ decorations: decorator.createDeco(view), update(u) { this.decorations = decorator.updateDeco(u, this.decorations) } }), {
    decorations: (plugin) => plugin.decorations,
  })
}

const arduinoCompletions = completeFromList([
  ...Object.entries(FUNCTIONS).map(([label, detail]) => ({ label, detail, type: 'function', boost: 2 })),
  ...OBJECTS.map((label) => ({ label, type: 'variable' })),
  ...CONSTANTS.map((label) => ({ label, type: 'constant' })),
  ...TYPES.map((label) => ({ label, type: 'type' })),
  ...METHODS.map((label) => ({ label, type: 'method' })),
  ...['const', 'unsigned', 'long', 'float', 'void', 'return', 'while', 'for', 'if', 'else'].map((label) => ({ label, type: 'keyword' })),
])

function palette(dark) {
  return dark
    ? { bg: '#0b1517', gutter: '#0f1d1f', line: '#ffffff08', text: '#e2e8f0', muted: '#64748b', border: '#ffffff1a', keyword: '#fda4af', type: '#5eead4', fn: '#a5b4fc', arduino: '#7dd3fc', constant: '#fdba74', number: '#7dd3fc', string: '#fcd34d', comment: '#64748b', meta: '#f0abfc', caret: '#ffffff', selection: '#2dd4bf40' }
    : { bg: '#ffffff', gutter: '#f8fafc', line: '#0f766e0a', text: '#1e293b', muted: '#94a3b8', border: '#e2e8f0', keyword: '#d61f5b', type: '#0d9488', fn: '#5b4be0', arduino: '#0284c7', constant: '#ea580c', number: '#0891b2', string: '#b45309', comment: '#94a3b8', meta: '#a21caf', caret: '#0f172a', selection: '#99f6e480' }
}

function themeFor(dark) {
  const c = palette(dark)
  const theme = EditorView.theme(
    {
      '&': { height: '100%', backgroundColor: c.bg, color: c.text, fontSize: '13.5px' },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', lineHeight: '1.6', overflow: 'auto' },
      '.cm-content': { caretColor: c.caret, padding: '10px 0' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: c.caret, borderLeftWidth: '2px' },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: `${c.selection} !important` },
      '.cm-activeLine': { backgroundColor: c.line },
      '.cm-gutters': { backgroundColor: c.gutter, color: c.muted, borderRight: `1px solid ${c.border}` },
      '.cm-activeLineGutter': { backgroundColor: c.line, color: c.text },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px' },
      '.cm-matchingBracket': { backgroundColor: dark ? '#2dd4bf33' : '#99f6e4', outline: 'none' },
      '.cm-arduino-fn': { color: c.arduino, fontWeight: '600' },
      '.cm-arduino-const': { color: c.constant },
      '.cm-arduino-type': { color: c.type },
      '.cm-tooltip': { backgroundColor: c.gutter, border: `1px solid ${c.border}`, color: c.text },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: dark ? '#134e4a' : '#ccfbf1', color: c.text },
      '.cm-completionDetail': { color: c.muted, fontStyle: 'normal', marginLeft: '8px' },
      '.cm-diagnostic-error': { borderLeftColor: '#e11d48' },
      '.cm-lintRange-error': { backgroundImage: 'none', textDecoration: 'underline wavy #e11d48', textUnderlineOffset: '3px' },
    },
    { dark },
  )
  const highlight = HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.modifier, tags.definitionKeyword, tags.bool, tags.null, tags.self], color: c.keyword, fontWeight: '600' },
    { tag: [tags.typeName, tags.standard(tags.typeName)], color: c.type },
    { tag: [tags.function(tags.variableName), tags.function(tags.definition(tags.variableName)), tags.function(tags.propertyName)], color: c.fn },
    { tag: [tags.number, tags.integer, tags.float], color: c.number },
    { tag: [tags.string, tags.character, tags.special(tags.string)], color: c.string },
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: c.comment, fontStyle: 'italic' },
    { tag: [tags.processingInstruction, tags.meta, tags.macroName], color: c.meta },
  ])
  return [theme, syntaxHighlighting(highlight)]
}

// gcc's line:column -> a range in the document, underlining the word there.
function toDiagnostics(doc, items) {
  return items
    .filter((item) => item.line >= 1 && item.line <= doc.lines)
    .map((item) => {
      const line = doc.line(item.line)
      const from = Math.min(line.to, line.from + Math.max(0, item.column - 1))
      const word = /^[\w.]+/.exec(doc.sliceString(from, line.to))
      return { from, to: word ? from + word[0].length : Math.max(from, line.to), severity: item.level === 'warning' ? 'warning' : 'error', message: item.message }
    })
}

export default function CodeEditor({ value, onChange, diagnostics = [], dark = false, readOnly = false }) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const theme = useRef(new Compartment())
  const editable = useRef(new Compartment())
  const wrapping = useRef(new Compartment())

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          drawSelection(),
          indentOnInput(),
          indentUnit.of('  '),
          bracketMatching(),
          closeBrackets(),
          autocompletion({ icons: false }),
          highlightActiveLine(),
          lintGutter(),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
          cpp(),
          cppLanguage.data.of({ autocomplete: arduinoCompletions }),
          marker(Object.keys(FUNCTIONS).concat(OBJECTS), 'cm-arduino-fn'),
          marker(CONSTANTS, 'cm-arduino-const'),
          marker(TYPES, 'cm-arduino-type'),
          theme.current.of(themeFor(dark)),
          editable.current.of(EditorState.readOnly.of(readOnly)),
          wrapping.current.of([]),
          EditorView.contentAttributes.of({ 'aria-label': 'Arduino kodu', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    // On narrow screens long lines wrap instead of scrolling sideways.
    let wrapped = false
    const observer = new ResizeObserver(() => {
      const narrow = hostRef.current.clientWidth < 420
      if (narrow !== wrapped) {
        wrapped = narrow
        view.dispatch({ effects: wrapping.current.reconfigure(narrow ? EditorView.lineWrapping : []) })
      }
    })
    observer.observe(hostRef.current)
    return () => {
      observer.disconnect()
      view.destroy()
    }
    // The editor is created once; later props are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A new example or "örnek koda dön" replaces the text from outside.
  useEffect(() => {
    const view = viewRef.current
    if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  }, [value])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: theme.current.reconfigure(themeFor(dark)) })
  }, [dark])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: editable.current.reconfigure(EditorState.readOnly.of(readOnly)) })
  }, [readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (view) view.dispatch(setDiagnostics(view.state, toDiagnostics(view.state.doc, diagnostics)))
  }, [diagnostics])

  return <div ref={hostRef} className="h-full overflow-hidden" />
}
