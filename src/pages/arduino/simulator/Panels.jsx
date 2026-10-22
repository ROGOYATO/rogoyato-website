import { AlertTriangle, CircleX, Eraser, Plus, RotateCw, Send, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  PART_CATALOG,
  PWM_PINS,
  UNO_ANALOG,
  UNO_DIGITAL,
  UNO_PINS,
  UNO_POWER,
  breadboardHoles,
  buildNets,
  describeEndpoint,
  describeHole,
  describeNet,
  directUnoPin,
  endpointKey,
  normalizeWire,
  partLabel,
} from '../../../utils/avrSim/catalog'

export function PanelCard({ title, actions, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-300/80 bg-white/95 dark:border-teal-300/15 dark:bg-[#0f1d1f]/95 ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-white/10">
          <h3 className="font-code text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">{title}</h3>
          {actions}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}

const selectClass =
  'font-code w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-teal-600 focus:outline-hidden dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100'

const PIN_OPTIONS = [
  ...UNO_DIGITAL.map((pin) => ({ value: pin, label: pin, note: PWM_PINS.has(pin) ? '~PWM' : pin === 'D0' || pin === 'D1' ? 'Serial' : 'dijital' })),
  ...UNO_ANALOG.map((pin) => ({ value: pin, label: pin, note: 'analog' })),
  ...UNO_POWER.map((pin) => ({ value: pin, label: pin, note: 'güç' })),
]
const lower = (text) => text.trim().toLocaleLowerCase('tr')

// What students type: "d9", "9", "a0", "gnd", "5v", "3.3v".
const cleanPin = (text) => text.toUpperCase().replace(/\s+/g, '').replace(/^PIN/, '').replace(',', '.')
function parsePin(text) {
  const typed = cleanPin(text)
  if (UNO_PINS.includes(typed)) return typed
  if (/^\d+$/.test(typed) && UNO_DIGITAL.includes(`D${Number(typed)}`)) return `D${Number(typed)}`
  return { '3.3': '3V3', '3.3V': '3V3', TOPRAK: 'GND', GROUND: 'GND' }[typed] ?? null
}
// Pins whose name starts with the text come first, then ones whose note
// matches ("pwm", "analog", "güç").
function suggestPins(text) {
  const typed = cleanPin(text)
  if (!typed) return PIN_OPTIONS
  const byName = PIN_OPTIONS.filter(({ value }) => value.startsWith(typed) || (/^\d/.test(typed) && value.startsWith(`D${typed}`)) || value === parsePin(text))
  const byNote = lower(text).length > 1 ? PIN_OPTIONS.filter((option) => !byName.includes(option) && lower(option.note).includes(lower(text))) : []
  return [...byName, ...byNote]
}

// A text box that suggests while typing; focusing it lists every option.
// noneLabel adds an option that clears it (an empty box clears it too).
function SuggestBox({ label, value, display, suggest, parse, onChange, placeholder, noneLabel, unknown }) {
  const [draft, setDraft] = useState(null) // the text being typed, null when not editing
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1) // the option picked with the arrow keys
  const [error, setError] = useState('')
  const id = useId()
  const options = draft ? suggest(draft) : [...(noneLabel && value ? [{ value: null, label: noneLabel, note: 'kabloyu sök' }] : []), ...suggest('')]
  // Enter takes the first suggestion when the text does not name one yet.
  const highlighted = active >= 0 ? active : draft && !parse(draft) ? 0 : -1

  const close = () => {
    setDraft(null)
    setOpen(false)
    setActive(-1)
  }
  const choose = (next) => {
    setError('')
    if (next !== value) onChange(next)
    close()
  }
  const commit = () => {
    if (draft === null) return close()
    if (!draft.trim()) return noneLabel ? choose(null) : close()
    const next = parse(draft)
    if (next) return choose(next)
    setError(unknown(draft.trim()))
    close()
  }
  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => (Math.max(current, -1) + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && options[highlighted]) choose(options[highlighted].value)
      else commit()
    } else if (event.key === 'Escape') {
      close()
    }
  }

  return (
    <div className="relative min-w-0">
      <input
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && options[highlighted] ? `${id}-${highlighted}` : undefined}
        value={draft ?? (value ? display(value) : '')}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => {
          setOpen(true)
          event.target.select()
        }}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          setDraft(event.target.value)
          setError('')
          setOpen(true)
          setActive(-1)
        }}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className={selectClass}
      />
      {open && options.length ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="font-code absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-slate-300 bg-white py-1 text-sm shadow-lg dark:border-white/15 dark:bg-[#0b1517]"
        >
          {options.map((option, index) => (
            <li
              key={option.value ?? 'none'}
              id={`${id}-${index}`}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option.value)}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer justify-between gap-3 px-2 py-1 ${index === highlighted ? 'bg-teal-50 text-teal-900 dark:bg-teal-400/10 dark:text-teal-100' : 'text-slate-800 dark:text-slate-100'}`}
            >
              <span className={`truncate ${option.value === value ? 'font-semibold' : ''}`}>{option.label}</span>
              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{option.note}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{error}</p> : null}
    </div>
  )
}

// The Uno pin a part pin is wired to; empty means "boşta".
export function PinSelect({ value, onChange, label }) {
  return (
    <SuggestBox
      label={label}
      value={value}
      display={(pin) => pin}
      suggest={suggestPins}
      parse={parsePin}
      onChange={onChange}
      placeholder="— boşta —"
      noneLabel="— boşta —"
      unknown={(text) => `“${text}” diye bir pin yok.`}
    />
  )
}

// Wire ends as text: "P:<part>:<pin>" or "U:<pin>".
const endFromKey = (key) => (key.startsWith('U:') ? { uno: key.slice(2) } : { part: key.slice(2, key.indexOf(':', 2)), pin: key.slice(key.indexOf(':', 2) + 1) })
const HOLE = /^([a-j]\d{1,2}|[TB][+-]\d{1,2})$/i
// "pot s" finds "Potansiyometre · S": every typed word starts a word of the label.
const wordsMatch = (label, text) => {
  const words = lower(label).split(/[\s·]+/)
  return lower(text)
    .split(/\s+/)
    .every((typed) => words.some((word) => word.startsWith(typed)))
}

// One end of a new wire: a part pin, an Uno pin or (typed) a breadboard hole.
function EndSelect({ circuit, label, value, onChange }) {
  const board = circuit.parts.find((part) => part.type === 'breadboard')
  const holes = board ? breadboardHoles().byId : null
  const partPins = circuit.parts
    .filter((part) => part.type !== 'breadboard')
    .flatMap((part) => PART_CATALOG[part.type].pins.map((pin) => ({ value: `P:${part.id}:${pin.id}`, label: `${partLabel(part)} · ${pin.label}`, note: '' })))
  const unoPins = PIN_OPTIONS.map((option) => ({ ...option, value: `U:${option.value}`, label: `Uno ${option.label}` }))
  const hole = (text) => {
    const typed = text.trim().replace(/^([tb])/i, (letter) => letter.toUpperCase())
    const id = HOLE.test(typed) ? (/^[a-j]/i.test(typed) ? typed.toLowerCase() : typed) : null
    return holes && id && holes.has(id) ? { value: `P:${board.id}:${id}`, label: `Breadboard · ${describeHole(id)}`, note: '' } : null
  }
  const suggest = (text) => {
    if (!text.trim()) return [...partPins, ...unoPins]
    const found = hole(text)
    const pins = suggestPins(text).map((option) => ({ ...option, value: `U:${option.value}`, label: `Uno ${option.label}` }))
    // "d13" is both an Uno pin and a hole: the pin comes first.
    return [...partPins.filter((option) => wordsMatch(option.label, text)), ...(cleanPin(text) ? pins : []), ...(found ? [found] : [])]
  }
  const parse = (text) => {
    const exact = [...partPins, ...unoPins].find((option) => lower(option.label) === lower(text))
    const pin = parsePin(text.replace(/^uno\s*/i, ''))
    const only = suggest(text)
    return exact?.value ?? (pin ? `U:${pin}` : null) ?? hole(text)?.value ?? (only.length === 1 ? only[0].value : null)
  }
  return (
    <SuggestBox
      label={label}
      value={value}
      display={(key) => describeEndpoint(circuit, endFromKey(key))}
      suggest={suggest}
      parse={parse}
      onChange={onChange}
      placeholder="parça pini, Uno pini ya da a12"
      unknown={(text) => `“${text}” bulunamadı.`}
    />
  )
}

function Slider({ label, min, max, step = 1, value, unit = '', onChange }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        <span className="font-code text-teal-700 dark:text-teal-300">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full accent-teal-600" />
    </label>
  )
}

function Readout({ part, state }) {
  if (!state) return null
  const rows = []
  if (state.brightness !== undefined) rows.push(['Parlaklık', `%${Math.round(state.brightness * 100)}`])
  if (state.red !== undefined) rows.push(['R / G / B', [state.red, state.green, state.blue].map((v) => Math.round(v * 255)).join(' / ')])
  if (state.angle !== undefined) rows.push(['Açı', `${Math.round(state.angle)}°`])
  if (state.on !== undefined) rows.push(['Ses', state.on ? `${Math.round(state.frequency)} Hz` : 'sessiz'])
  if (state.left !== undefined) rows.push(['Sol / sağ motor', `%${Math.round(state.left * 100)} / %${Math.round(state.right * 100)}`])
  if (state.segments) rows.push(['Segmentler', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].filter((_, i) => state.segments[i] > 0.5).join(' ') || '—'])
  if (!rows.length) return null
  return (
    <dl className="font-code mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-slate-50 p-2.5 text-xs dark:bg-white/5">
      {rows.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-slate-500 dark:text-slate-400">{key}</dt>
          <dd className="text-right text-slate-800 dark:text-slate-100">{value}</dd>
        </div>
      ))}
      <span className="sr-only">{part.id}</span>
    </dl>
  )
}

export function PartControls({ part, inputs, onInput }) {
  const value = inputs ?? {}
  switch (part.type) {
    case 'tactButton':
    case 'button':
      return (
        <button
          type="button"
          onPointerDown={() => onInput('pressed', true)}
          onPointerUp={() => onInput('pressed', false)}
          onPointerLeave={() => value.pressed && onInput('pressed', false)}
          className={`w-full select-none rounded-md px-3 py-2 font-semibold text-white transition ${value.pressed ? 'bg-rose-700' : 'bg-rose-600 hover:bg-rose-700'}`}
        >
          {value.pressed ? 'Basılı…' : 'Basılı tut'}
        </button>
      )
    case 'potentiometer':
      return <Slider label="Konum (analogRead)" min={0} max={1023} value={value.value ?? 512} onChange={(v) => onInput('value', v)} />
    case 'ldr':
      return <Slider label="Ortam ışığı" min={0} max={100} unit="%" value={value.light ?? 50} onChange={(v) => onInput('light', v)} />
    case 'ultrasonic':
      return <Slider label="Engel mesafesi" min={2} max={450} unit=" cm" value={value.distance ?? 50} onChange={(v) => onInput('distance', v)} />
    case 'dht11':
      return (
        <div className="space-y-3">
          <Slider label="Sıcaklık" min={0} max={50} unit=" °C" value={value.temperature ?? 24} onChange={(v) => onInput('temperature', v)} />
          <Slider label="Nem" min={5} max={95} unit=" %" value={value.humidity ?? 45} onChange={(v) => onInput('humidity', v)} />
        </div>
      )
    case 'irSensor':
      return (
        <div className="grid grid-cols-2 gap-2">
          {[
            [false, 'Beyaz zemin'],
            [true, 'Siyah çizgi'],
          ].map(([black, text]) => (
            <button
              key={text}
              type="button"
              onClick={() => onInput('black', black)}
              className={`rounded-md border px-2 py-1.5 text-sm transition ${Boolean(value.black) === black ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-teal-950' : 'border-slate-300 text-slate-700 hover:border-teal-600 dark:border-white/15 dark:text-slate-200'}`}
            >
              {text}
            </button>
          ))}
        </div>
      )
    default:
      return null
  }
}

const OPTION_LABELS = { color: 'Renk', ohms: 'Değer' }

export function PartInspector({ part, circuit, inputs, state, onInput, onWire, onRotate, onDelete, onProp }) {
  const definition = PART_CATALOG[part.type]
  const { nets, plugged } = buildNets(circuit)
  const holes = plugged.get(part.id)?.holes
  // What each pin reaches through the breadboard and other jumpers.
  const reach = (pin) => {
    const uno = describeNet(nets, `P:${part.id}:${pin}`)
    const via = holes?.[pin] ? `${holes[pin]} deliği` : null
    return [via, `→ ${uno.length ? uno.join(', ') : 'boşta'}`].filter(Boolean).join(' ')
  }
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{partLabel(part)}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{definition.help}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={onRotate} title="Döndür" aria-label="Döndür" className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:text-slate-300">
            <RotateCw size={15} />
          </button>
          <button type="button" onClick={onDelete} title="Parçayı kaldır" aria-label="Parçayı kaldır" className="rounded-md border border-slate-300 p-1.5 text-rose-600 hover:border-rose-500 dark:border-white/15 dark:text-rose-300">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {Object.entries(definition.options ?? {}).map(([option, choices]) => (
        <label key={option} className="block text-sm text-slate-700 dark:text-slate-200">
          {OPTION_LABELS[option] ?? option}
          <select
            value={part.props?.[option] ?? definition.props?.[option] ?? ''}
            onChange={(event) => onProp(option, option === 'ohms' ? Number(event.target.value) : event.target.value)}
            className={`${selectClass} mt-1`}
          >
            {Object.entries(choices).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
      ))}

      <PartControls part={part} inputs={inputs} onInput={onInput} />
      <Readout part={part} state={state} />

      {part.type === 'breadboard' ? (
        <BreadboardSummary part={part} circuit={circuit} nets={nets} plugged={plugged} />
      ) : (
        <div>
          <p className="font-code mb-2 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Pinler</p>
          {holes ? <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Breadboard’a takılı. Uno’ya doğrudan kablo da çekebilirsiniz.</p> : null}
          <div className="space-y-1.5">
            {definition.pins.map((pin) => (
              <div key={pin.id} className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                <span className="font-code text-sm text-slate-700 dark:text-slate-200">
                  {pin.label}
                  <span className="block text-[0.7rem] leading-tight text-slate-500 dark:text-slate-400">{reach(pin.id)}</span>
                </span>
                <PinSelect label={`${partLabel(part)} ${pin.label}`} value={directUnoPin(circuit, part.id, pin.id)} onChange={(uno) => onWire(part.id, pin.id, uno)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// The circuit's connections, under the parts: the wires as built (with a
// form to add one), or every part pin with the Uno pin it is wired to. The
// order stays put; whatever touches the selection is highlighted.
export function ConnectionsPanel({ circuit, selection, onSelect, onWire, onConnect }) {
  const [view, setView] = useState('wires')
  const [adding, setAdding] = useState(null) // { from, to } while adding a wire
  const { nets, plugged } = buildNets(circuit)
  const selectedPart = circuit.parts.find((part) => part.id === selection?.partId)
  const selectedNets = new Set((selectedPart ? PART_CATALOG[selectedPart.type].pins : []).map((pin) => nets.find(`P:${selectedPart.id}:${pin.id}`)))
  const touches = (wire) =>
    wire.id === selection?.wireId || (selectedPart && [wire.from, wire.to].some((end) => end.part === selectedPart.id || selectedNets.has(nets.find(endpointKey(end)))))
  const wires = circuit.wires.map(normalizeWire)
  const parts = circuit.parts.filter((part) => part.type !== 'breadboard')
  const row = (active) => `rounded-md px-2 py-1 ${active ? 'bg-teal-50 dark:bg-teal-400/10' : ''}`
  const tab = (active) =>
    `rounded px-2 py-0.5 text-xs transition ${active ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950' : 'text-slate-600 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300'}`
  const add = () => {
    onConnect(endFromKey(adding.from), endFromKey(adding.to))
    setAdding(null)
  }
  return (
    <PanelCard
      title="Bağlantılar"
      actions={
        <div className="font-code flex gap-1 rounded-md border border-slate-300 p-0.5 dark:border-white/15" role="group" aria-label="Bağlantı görünümü">
          <button type="button" aria-pressed={view === 'wires'} onClick={() => setView('wires')} className={tab(view === 'wires')}>
            Kablolar
          </button>
          <button type="button" aria-pressed={view === 'pins'} onClick={() => setView('pins')} className={tab(view === 'pins')}>
            Pin haritası
          </button>
        </div>
      }
    >
      {view === 'wires' ? (
        <div className="space-y-3">
          {wires.length ? (
            <ul className="font-code space-y-0.5 text-sm">
              {wires.map((wire) => (
                <li key={wire.id}>
                  <button
                    type="button"
                    onClick={() => onSelect({ wireId: wire.id })}
                    className={`${row(touches(wire))} block w-full text-left text-slate-700 hover:text-teal-700 dark:text-slate-200 dark:hover:text-teal-300 ${wire.id === selection?.wireId ? 'font-semibold' : ''}`}
                  >
                    {describeEndpoint(circuit, wire.from)} ↔ {describeEndpoint(circuit, wire.to)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Henüz bağlantı yok.</p>
          )}
          {adding ? (
            <div className="space-y-2 rounded-md border border-slate-200 p-2 dark:border-white/10">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
                <EndSelect circuit={circuit} label="Kablonun bir ucu" value={adding.from} onChange={(from) => setAdding((current) => ({ ...current, from }))} />
                <span className="font-code pt-1.5 text-slate-500">↔</span>
                <EndSelect circuit={circuit} label="Kablonun öbür ucu" value={adding.to} onChange={(to) => setAdding((current) => ({ ...current, to }))} />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={add} disabled={!adding.from || !adding.to || adding.from === adding.to} className="rounded-md bg-teal-700 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50 dark:bg-teal-400 dark:text-teal-950">
                  Ekle
                </button>
                <button type="button" onClick={() => setAdding(null)} className="text-sm text-slate-500 underline dark:text-slate-400">
                  vazgeç
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding({ from: null, to: null })} className="font-code inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-700 hover:border-teal-600 hover:text-teal-800 dark:border-white/15 dark:text-slate-200">
              <Plus size={13} />
              Kablo ekle
            </button>
          )}
        </div>
      ) : parts.length ? (
        <ul className="space-y-2 text-sm">
          {parts.map((part) => (
            <li key={part.id} className={row(part.id === selectedPart?.id)}>
              <button type="button" onClick={() => onSelect({ partId: part.id })} className="text-left font-semibold text-slate-800 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-300">
                {partLabel(part)}
              </button>
              <div className="mt-1 space-y-1">
                {PART_CATALOG[part.type].pins.map((pin) => {
                  const uno = describeNet(nets, `P:${part.id}:${pin.id}`)
                  const direct = directUnoPin(circuit, part.id, pin.id)
                  const hole = plugged.get(part.id)?.holes?.[pin.id]
                  // Reached some other way than a direct wire: through the breadboard.
                  const via = uno.length && !direct ? `${hole ? `${hole} deliği ` : ''}→ ${uno.join(', ')}` : null
                  return (
                    <div key={pin.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2">
                      <span className="font-code text-xs text-slate-700 dark:text-slate-200">
                        {pin.label}
                        {via ? <span className="block text-[0.7rem] leading-tight text-slate-500 dark:text-slate-400">{via}</span> : null}
                      </span>
                      <PinSelect label={`${partLabel(part)} ${pin.label}`} value={direct} onChange={(next) => onWire(part.id, pin.id, next)} />
                    </div>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Masada bağlanacak parça yok.</p>
      )}
    </PanelCard>
  )
}

// Which strips of the board carry which Uno pins, and what is plugged in.
function BreadboardSummary({ part, circuit, nets, plugged }) {
  const strips = new Map()
  for (const wire of circuit.wires) {
    for (const end of [wire.from, wire.to]) {
      if (end?.part !== part.id) continue
      const uno = describeNet(nets, `P:${part.id}:${end.pin}`)
      const hole = breadboardHoles().byId.get(end.pin)
      if (!uno.length || !hole) continue
      const strip = hole.rail ? describeHole(end.pin).replace(/ \(\d+\)$/, '') : `${hole.col}. sütun (${hole.strip.endsWith('t') ? 'a–e' : 'f–j'})`
      strips.set(strip, uno.join(', '))
    }
  }
  const riders = circuit.parts.filter((p) => plugged.get(p.id)?.board === part.id)
  return (
    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
      <p className="font-code text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Üstündekiler</p>
      <p>{riders.length ? riders.map(partLabel).join(', ') : 'Henüz parça takılı değil. Parçayı sürükleyip breadboard’un üstüne bırakın.'}</p>
      {strips.size ? (
        <ul className="font-code space-y-0.5 text-xs">
          {[...strips].map(([strip, uno]) => (
            <li key={strip}>
              {strip} → {uno}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function IssuesList({ issues }) {
  if (!issues.length) return null
  return (
    <ul className="space-y-1.5">
      {issues.map((issue) => (
        <li
          key={issue.message}
          className={`flex gap-2 rounded-md px-2.5 py-1.5 text-sm ${issue.level === 'error' ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'}`}
        >
          {issue.level === 'error' ? <CircleX size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
          {issue.message}
        </li>
      ))}
    </ul>
  )
}

export function SerialMonitor({ text, running, baud, onSend, onClear }) {
  const outputRef = useRef(null)
  const [line, setLine] = useState('')
  const [follow, setFollow] = useState(true)
  useEffect(() => {
    if (follow && outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [text, follow])
  const send = (event) => {
    event.preventDefault()
    if (!line) return
    onSend(`${line}\n`)
    setLine('')
  }
  return (
    <PanelCard
      title={baud ? `Serial Monitor · ${baud} baud` : 'Serial Monitor'}
      actions={
        <div className="flex items-center gap-3">
          <label className="font-code flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <input type="checkbox" checked={follow} onChange={(event) => setFollow(event.target.checked)} className="accent-teal-600" />
            kaydır
          </label>
          <button type="button" onClick={onClear} title="Temizle" aria-label="Serial Monitor'ü temizle" className="text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300">
            <Eraser size={15} />
          </button>
        </div>
      }
    >
      <pre ref={outputRef} className="font-code h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs leading-relaxed text-emerald-300">
        {text || (running ? '' : 'Program çalışınca Serial.print çıktıları burada görünür.')}
      </pre>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input
          value={line}
          onChange={(event) => setLine(event.target.value)}
          disabled={!running}
          placeholder={running ? 'Arduino’ya gönder…' : 'Önce programı çalıştırın'}
          className="font-code min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100"
        />
        <button type="submit" disabled={!running} className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-teal-400 dark:text-teal-950">
          <Send size={14} />
          Gönder
        </button>
      </form>
    </PanelCard>
  )
}

function Bar({ value }) {
  const width = Math.min(100, Math.abs(value) * 100)
  return (
    <div className="relative h-2 rounded-full bg-slate-200 dark:bg-white/10">
      <div className={`absolute top-0 h-2 rounded-full ${value >= 0 ? 'left-1/2 bg-teal-500' : 'right-1/2 bg-orange-500'}`} style={{ width: `${width / 2}%` }} />
      <div className="absolute left-1/2 top-[-2px] h-3 w-px bg-slate-400" />
    </div>
  )
}

export function CarHud({ car }) {
  if (!car) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Programı çalıştırınca araba hareket eder; turlar ve sensörler burada görünür.</p>
  }
  const best = car.lapTimes.length ? Math.min(...car.lapTimes) : null
  return (
    <div className="space-y-3">
      <div className="font-code grid grid-cols-3 gap-2 text-center">
        {[
          ['Tur', car.laps],
          ['Bu tur', `${car.currentLap.toFixed(1)} s`],
          ['En iyi', best ? `${best.toFixed(2)} s` : '—'],
        ].map(([key, value]) => (
          <div key={key} className="rounded-md bg-slate-50 px-2 py-2 dark:bg-white/5">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{key}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        {['left', 'center', 'right'].map((side) => (
          <div key={side} className="text-center">
            <div className={`mx-auto h-5 w-5 rounded-full border-2 ${car.sensors[side] ? 'border-slate-900 bg-slate-900 dark:border-white dark:bg-white' : 'border-slate-400 bg-transparent'}`} />
            <p className="font-code mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">{{ left: 'SOL', center: 'ORTA', right: 'SAĞ' }[side]}</p>
          </div>
        ))}
      </div>
      <div className="font-code space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2">
          <span>Sol motor</span>
          <Bar value={car.command.left} />
          <span className="text-right">%{Math.round(car.command.left * 100)}</span>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2">
          <span>Sağ motor</span>
          <Bar value={car.command.right} />
          <span className="text-right">%{Math.round(car.command.right * 100)}</span>
        </div>
      </div>
      {car.crashed ? <p className="rounded-md bg-rose-50 px-2.5 py-1.5 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">Araba parkurun dışına çıktı. “Başa al” ile tekrar deneyin.</p> : null}
    </div>
  )
}

export function CarWiring({ circuit, onWire }) {
  const wireFor = (part, pin) => directUnoPin(circuit, part, pin)
  const groups = [
    { part: 'driver', title: 'L298N motor sürücü', pins: PART_CATALOG.motorDriver.pins },
    ...['left', 'center', 'right'].map((side) => ({ part: `ir-${side}`, title: `KH-09 ${{ left: 'sol', center: 'orta', right: 'sağ' }[side]} sensör`, pins: PART_CATALOG.irSensor.pins })),
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.part}>
          <p className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{group.title}</p>
          <div className="space-y-1.5">
            {group.pins.map((pin) => (
              <div key={pin.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-2">
                <span className="font-code text-sm text-slate-600 dark:text-slate-300">{pin.label}</span>
                <PinSelect label={`${group.title} ${pin.label}`} value={wireFor(group.part, pin.id)} onChange={(uno) => onWire(group.part, pin.id, uno)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
