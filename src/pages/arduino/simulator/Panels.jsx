import { AlertTriangle, CircleX, Eraser, RotateCw, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PART_CATALOG, PWM_PINS, UNO_ANALOG, UNO_DIGITAL, breadboardHoles, buildNets, describeHole, describeNet, directUnoPin, partLabel } from '../../../utils/avrSim/catalog'

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

export function PinSelect({ value, onChange, label }) {
  return (
    <select aria-label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value || null)} className={selectClass}>
      <option value="">— boşta —</option>
      <optgroup label="Dijital">
        {UNO_DIGITAL.map((pin) => (
          <option key={pin} value={pin}>
            {pin}
            {PWM_PINS.has(pin) ? ' ~PWM' : ''}
            {pin === 'D0' || pin === 'D1' ? ' (Serial)' : ''}
          </option>
        ))}
      </optgroup>
      <optgroup label="Analog">
        {UNO_ANALOG.map((pin) => (
          <option key={pin} value={pin}>
            {pin}
          </option>
        ))}
      </optgroup>
      <optgroup label="Güç">
        {['5V', '3V3', 'GND', 'VIN'].map((pin) => (
          <option key={pin} value={pin}>
            {pin}
          </option>
        ))}
      </optgroup>
    </select>
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
    return [via, uno.length ? `→ ${uno.join(', ')}` : null].filter(Boolean).join(' ')
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
          <p className="font-code mb-2 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Bağlantılar</p>
          {holes ? <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Breadboard’a takılı. Uno’ya doğrudan kablo da çekebilirsiniz.</p> : null}
          <div className="space-y-1.5">
            {definition.pins.map((pin) => (
              <div key={pin.id} className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                <span className="font-code text-sm text-slate-700 dark:text-slate-200">
                  {pin.label}
                  {reach(pin.id) ? <span className="block text-[0.7rem] leading-tight text-slate-500 dark:text-slate-400">{reach(pin.id)}</span> : null}
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

export function SerialMonitor({ text, running, onSend, onClear }) {
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
      title="Serial Monitor · 9600 baud"
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
