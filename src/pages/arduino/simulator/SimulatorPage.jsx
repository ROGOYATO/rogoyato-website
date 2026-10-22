import { Bot, Check, Cpu, Loader2, Play, Plus, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PART_CATALOG,
  connectEndpoints,
  describeEndpoint,
  movePart,
  normalizeCircuit,
  partLabel,
  placeOnBreadboard,
  removePart,
  resolveCar,
  resolveCircuit,
  rotatePart,
  setDirectUnoPin,
  setStripUno,
} from '../../../utils/avrSim/catalog'
import { TRACKS } from '../../../utils/avrSim/car'
import { Breadcrumb, Label } from '../ArduinoParts'
import BenchView from './BenchView'
import CarView from './CarView'
import CodeEditor from './CodeEditor'
import Licenses from './Licenses'
import AnswerBar from './AnswerBar'
import { compileSketch, rememberCompiled } from './compile'
import { onCompilerProgress, preloadCompiler } from './compiler/browserCompiler'
import { EXAMPLES } from './examples'
import { CarHud, CarWiring, ConnectionsPanel, IssuesList, PanelCard, PartInspector, SerialMonitor } from './Panels'
import useSimulator from './useSimulator'

// Older saved projects held the examples' answers; they are dropped.
const STORAGE_KEY = 'rogoyato-sim-project-v3'
const OLD_STORAGE_KEYS = ['rogoyato-sim-project-v1', 'rogoyato-sim-project-v2']
const WEEK_LABELS = { 1: '1. hafta', 2: '2. hafta', 3: '3. hafta', 4: '4. hafta', 5: 'Yarışma', 0: 'Serbest' }
const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))
const CAR_EXAMPLE = EXAMPLES.find((example) => example.mode === 'car')

function projectFromExample(example) {
  return {
    exampleId: example.id,
    mode: example.mode,
    code: example.code,
    circuit: clone(example.circuit),
    carCircuit: clone(example.carCircuit ?? CAR_EXAMPLE.carCircuit),
    inputs: clone(example.inputs ?? {}),
  }
}

function loadSaved() {
  try {
    for (const key of OLD_STORAGE_KEYS) window.localStorage.removeItem(key)
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    // Projects saved before the breadboard used { part, pin, uno } wires.
    if (saved?.code && saved?.circuit) return { ...saved, circuit: normalizeCircuit(saved.circuit), carCircuit: saved.carCircuit && normalizeCircuit(saved.carCircuit) }
  } catch {
    // Storage can be unavailable (private mode); start from an example.
  }
  return null
}

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

// Rough footprint radius of each part on the mat, in cm.
const FOOTPRINT = { breadboard: 9, motorDriver: 8, ultrasonic: 3.2, servo: 2.6, sevenSegment: 2.4, irSensor: 2 }
const footprint = (type) => FOOTPRINT[type] ?? 1.6

function nextPosition(parts, type) {
  const spots = []
  for (const z of [8, -8, 13, -13, 18]) for (const x of [0, -5, 5, -10, 10, -15, 15, -20, 20]) spots.push([x, z])
  const free = ([x, z]) =>
    Math.hypot(x, z) > 4.4 + footprint(type) && // the Uno sits at the origin
    parts.every((part) => Math.hypot(part.position[0] - x, part.position[1] - z) > footprint(part.type) + footprint(type) + 0.6)
  return spots.find(free) ?? [0, 22]
}

export default function SimulatorPage() {
  const [searchParams] = useSearchParams()
  const dark = useDarkMode()
  const [project, setProject] = useState(() => {
    const requested = EXAMPLES.find((example) => example.id === searchParams.get('ornek'))
    return requested ? projectFromExample(requested) : (loadSaved() ?? projectFromExample(EXAMPLES[0]))
  })
  const [selection, setSelection] = useState(null)
  const [compile, setCompile] = useState({ state: 'idle' })
  const [sound, setSound] = useState(true)
  const [track, setTrack] = useState('oval')
  const [carView, setCarView] = useState('follow')
  const [carResetToken, setCarResetToken] = useState(0)
  const hexRef = useRef(null)
  const [download, setDownload] = useState(null)
  const preloaded = useRef(false)
  const licensesRef = useRef(null)
  useEffect(() => onCompilerProgress(setDownload), [])
  const sim = useSimulator({ sound })
  const { running, start } = sim

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    } catch {
      // Not saving is fine; the project lives on in this tab.
    }
  }, [project])

  const example = EXAMPLES.find((item) => item.id === project.exampleId)
  const issues = useMemo(
    () => (project.mode === 'car' ? resolveCar(project.carCircuit).issues : resolveCircuit(project.circuit).issues),
    [project.mode, project.circuit, project.carCircuit],
  )

  const launch = useCallback(
    (hex) =>
      start({
        hex,
        circuit: project.mode === 'bench' ? project.circuit : null,
        carCircuit: project.mode === 'car' ? project.carCircuit : null,
        track,
        inputs: project.inputs,
      }),
    [start, project.mode, project.circuit, project.carCircuit, project.inputs, track],
  )

  // Rewiring a running board restarts it, like unplugging and powering it again.
  const launchRef = useRef(launch)
  useEffect(() => {
    launchRef.current = launch
  })
  useEffect(() => {
    if (running && hexRef.current) launchRef.current(hexRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.circuit, project.carCircuit, project.mode])

  const run = async () => {
    setCompile({ state: 'compiling' })
    const started = performance.now()
    const result = await compileSketch(project.code)
    if (!result.ok) {
      setCompile({ state: 'error', ...result })
      return
    }
    hexRef.current = result.hex
    setCompile({ state: 'ok', source: result.source, size: result.size, seconds: (performance.now() - started) / 1000 })
    setCarResetToken((token) => token + 1)
    launch(result.hex)
  }

  const update = (changes) => setProject((current) => ({ ...current, ...changes }))
  const setCircuit = (key, fn) => setProject((current) => ({ ...current, [key]: fn(current[key]) }))

  const wireToUno = (key, part, pin, uno) => setCircuit(key, (circuit) => setDirectUnoPin(circuit, part, pin, uno))
  const stripToUno = (board, strip, uno) => setCircuit('circuit', (circuit) => setStripUno(circuit, board, strip, uno))

  const addPart = (type) => {
    const { parts } = project.circuit
    let index = 1
    while (parts.some((part) => part.id === `${type}-${index}`)) index += 1
    const defaults = PART_CATALOG[type].props
    const part = { id: `${type}-${index}`, type, position: nextPosition(parts, type), rotation: 0, ...(defaults ? { props: { ...defaults } } : {}) }
    // A breadboard goes beside the digital header; parts go into its holes.
    if (type === 'breadboard' && !parts.some((p) => p.type === 'breadboard')) part.position = [0, -9]
    else if (PART_CATALOG[type].bare) part.position = placeOnBreadboard(project.circuit, part) ?? part.position
    setCircuit('circuit', (circuit) => ({ ...circuit, parts: [...circuit.parts, part] }))
    setSelection({ partId: part.id })
  }

  const setInput = (part, key, value) => {
    setProject((current) => ({ ...current, inputs: { ...current.inputs, [part]: { ...current.inputs[part], [key]: value } } }))
    sim.setInput(part, key, value)
  }

  const chooseExample = (id) => {
    const next = EXAMPLES.find((item) => item.id === id)
    if (!next) return
    const dirty = example && (project.code !== example.code || JSON.stringify(project.circuit) !== JSON.stringify(example.circuit))
    if (dirty && !window.confirm('Kodunuz ve devreniz bu örnekle değiştirilecek. Devam edilsin mi?')) return
    sim.stop()
    setSelection(null)
    setCompile({ state: 'idle' })
    setProject(projectFromExample(next))
  }

  // Revealing an answer replaces the code; Ctrl+Z in the editor brings the student's back.
  const showCode = (answer) => {
    if (answer.hex) rememberCompiled(answer.code, answer.hex)
    const edited = project.code !== example.code && project.code !== answer.code
    if (edited && !window.confirm('Yazdığınız kod cevapla değiştirilecek (editörde Ctrl+Z ile geri alabilirsiniz). Devam edilsin mi?')) return
    update({ code: answer.code })
  }

  // The answer's wires go onto the exercise's parts, which are put back where
  // the exercise placed them (so wires to breadboard holes still meet their
  // leads); parts the student added stay as they are.
  const showWires = (answer) => {
    const key = project.mode === 'car' ? 'carCircuit' : 'circuit'
    const start = example[key] ?? CAR_EXAMPLE.carCircuit
    const current = project[key]
    const ownWires = current.wires.length && JSON.stringify(current.wires) !== JSON.stringify(answer.wires)
    if (ownWires && !window.confirm('Çektiğiniz kablolar kaldırılıp cevabın bağlantıları kurulacak. Devam edilsin mi?')) return
    const parts = [
      ...start.parts.map((part) => {
        const mine = current.parts.find((p) => p.id === part.id)
        return mine ? { ...mine, position: part.position, rotation: part.rotation } : clone(part)
      }),
      ...current.parts.filter((part) => !start.parts.some((p) => p.id === part.id)),
    ]
    setSelection(null)
    setCircuit(key, () => ({ parts, wires: clone(answer.wires) }))
  }

  const resetExercise = () => {
    const changed = project.code !== example.code || JSON.stringify(project.circuit) !== JSON.stringify(example.circuit) || JSON.stringify(project.carCircuit) !== JSON.stringify(example.carCircuit ?? CAR_EXAMPLE.carCircuit)
    if (changed && !window.confirm('Kodunuz ve devreniz alıştırmanın başlangıç hâline dönecek. Devam edilsin mi?')) return
    sim.stop()
    setSelection(null)
    setCompile({ state: 'idle' })
    setProject(projectFromExample(example))
  }

  const selectedPart = selection?.partId ? project.circuit.parts.find((part) => part.id === selection.partId) : null
  const selectedWire = selection?.wireId ? project.circuit.wires.find((wire) => wire.id === selection.wireId) : null
  const diagnostics = useMemo(() => (compile.state === 'error' ? (compile.diagnostics ?? []) : []), [compile])

  return (
    <div className="space-y-5">
      <Breadcrumb current="Simülatör" />
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Label>Tarayıcıda gerçek Arduino</Label>
          <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl sm:leading-10">Arduino Simülatörü</h1>
          <p className="mt-2 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-300">
            Kodunuz gerçek Arduino derleyicisiyle (GCC) kendi tarayıcınızda derlenir ve 16 MHz’lik ATmega328P işlemcisi komut komut çalıştırılır; sunucu
            gerekmez. Parçaları masaya ve breadboard’a koyun, kablolarla Uno’ya bağlayın; laptopu ya da malzemesi olmayan da derse katılabilsin.
          </p>
        </div>
      </header>

      <PanelCard>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Örnek proje"
            value={project.exampleId}
            onChange={(event) => chooseExample(event.target.value)}
            className="font-code w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100 sm:w-auto sm:min-w-[16rem]"
          >
            {[1, 2, 3, 4, 5, 0].map((week) => (
              <optgroup key={week} label={WEEK_LABELS[week]}>
                {EXAMPLES.filter((item) => item.week === week).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="flex rounded-md border border-slate-300 p-0.5 dark:border-white/15">
            {[
              ['bench', 'Tezgâh', <Cpu key="icon" size={15} />],
              ['car', 'Robot araba', <Bot key="icon" size={15} />],
            ].map(([mode, text, icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setSelection(null)
                  update({ mode })
                }}
                className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition ${project.mode === mode ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950' : 'text-slate-600 hover:text-teal-800 dark:text-slate-300'}`}
              >
                {icon}
                {text}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setSound((value) => !value)} title={sound ? 'Sesi kapat' : 'Sesi aç'} aria-label={sound ? 'Sesi kapat' : 'Sesi aç'} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:text-teal-700 dark:border-white/15 dark:text-slate-300">
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            {running ? (
              <button type="button" onClick={sim.stop} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700">
                <Square size={15} />
                Durdur
              </button>
            ) : null}
            <button
              type="button"
              onClick={run}
              disabled={compile.state === 'compiling'}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-300"
            >
              {compile.state === 'compiling' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {compile.state === 'compiling' ? 'Derleniyor…' : running ? 'Yeniden derle' : 'Derle ve çalıştır'}
            </button>
          </div>
        </div>
        {example ? (
          <>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{example.summary}</p>
            <AnswerBar key={example.id} example={example} onShowCode={showCode} onShowWires={showWires} onReset={resetExercise} />
          </>
        ) : null}
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="order-2 min-w-0 space-y-4 lg:order-0">
          <section className="overflow-hidden rounded-xl border border-slate-300/80 dark:border-teal-300/15">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-[#0f1d1f]">
              <span className="font-code text-xs text-slate-600 dark:text-slate-300">sketch.ino</span>
              <button
                type="button"
                onClick={() => example && update({ code: example.code })}
                className="font-code inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
              >
                <RotateCcw size={12} />
                başlangıç koduna dön
              </button>
            </div>
            <div className="h-[420px] sm:h-[480px]">
              <CodeEditor
                value={project.code}
                onChange={(code) => {
                  // The compiler (about 5 MB, once) starts downloading as soon as the code is edited.
                  if (!preloaded.current) {
                    preloaded.current = true
                    preloadCompiler()
                  }
                  update({ code })
                }}
                diagnostics={diagnostics}
                dark={dark}
              />
            </div>
            <div className="font-code border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-[#0f1d1f]">
              {compile.state === 'error' ? (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-rose-700 dark:text-rose-300">{compile.errors}</pre>
              ) : compile.state === 'ok' ? (
                <p className="text-emerald-700 dark:text-emerald-300">
                  {compile.source === 'example'
                    ? 'Hazır derlenmiş örnek yüklendi.'
                    : `${compile.source === 'browser' ? 'Tarayıcıda derlendi' : 'Derlendi'} (${compile.seconds.toFixed(1)} s).`}{' '}
                  {compile.size?.split('\n')[0]}
                </p>
              ) : compile.state === 'compiling' ? (
                <p className="text-slate-500 dark:text-slate-400">
                  {download && !download.preparing && download.loaded < download.total
                    ? `Derleyici indiriliyor (yalnızca ilk seferde): ${(download.loaded / 1e6).toFixed(1)} / ${(download.total / 1e6).toFixed(1)} MB`
                    : 'GCC ile derleniyor…'}
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Hazır. “Derle ve çalıştır” ile başlatın.</p>
              )}
              {sim.runtimeError ? <p className="mt-1 text-rose-700 dark:text-rose-300">Simülasyon durdu: {sim.runtimeError}</p> : null}
            </div>
            <p className="border-t border-slate-200 px-3 py-1.5 text-[0.7rem] text-slate-500 dark:border-white/10 dark:text-slate-400">
              Tarayıcıda çalışır. Derleyici: GCC 7.3.0 ve GNU binutils 2.42 (WebAssembly, GPL-3.0).{' '}
              <button
                type="button"
                onClick={() => {
                  licensesRef.current.open = true
                  licensesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="underline hover:text-teal-700 dark:hover:text-teal-300"
              >
                Lisanslar ve kaynaklar
              </button>
            </p>
          </section>
          <SerialMonitor text={sim.serial} running={running} baud={sim.hud?.baud} onSend={sim.sendSerial} onClear={sim.clearSerial} />
        </div>

        {/* On phones the 3D view comes first; on large screens it sits on the right. */}
        <div className="order-1 min-w-0 space-y-4 lg:order-0">
          <section className="relative h-[380px] overflow-hidden rounded-xl border border-slate-300/80 bg-slate-200 dark:border-teal-300/15 dark:bg-[#0d1517] sm:h-[520px]">
            {project.mode === 'bench' ? (
              <BenchView
                circuit={project.circuit}
                inputs={project.inputs}
                selection={selection}
                dark={dark}
                frameKey={project.exampleId}
                subscribe={sim.subscribe}
                onSelect={setSelection}
                onConnect={(from, to) => setCircuit('circuit', (circuit) => connectEndpoints(circuit, from, to))}
                onMovePart={(id, position) => setCircuit('circuit', (circuit) => movePart(circuit, id, position))}
                onPress={(id, pressed) => setInput(id, 'pressed', pressed)}
              />
            ) : (
              <CarView track={track} view={carView} dark={dark} subscribe={sim.subscribe} resetToken={carResetToken} />
            )}
            {running ? (
              <span className="font-code pointer-events-none absolute right-3 top-3 rounded-md bg-emerald-600/90 px-2 py-1 text-xs text-white">
                ● çalışıyor{sim.hud?.speed ? ` · gerçek zamanın %${Math.round(Math.min(1, sim.hud.speed) * 100)}’i` : ''}
              </span>
            ) : null}
          </section>

          {project.mode === 'bench' ? (
            <>
              {selectedPart ? (
                <PanelCard title="Seçili parça">
                  <PartInspector
                    part={selectedPart}
                    circuit={project.circuit}
                    inputs={project.inputs[selectedPart.id]}
                    state={sim.hud?.parts?.[selectedPart.id]}
                    onInput={(key, value) => setInput(selectedPart.id, key, value)}
                    onWire={(part, pin, uno) => wireToUno('circuit', part, pin, uno)}
                    onStrip={stripToUno}
                    onRotate={() => setCircuit('circuit', (circuit) => rotatePart(circuit, selectedPart.id))}
                    onDelete={() => {
                      setSelection(null)
                      setCircuit('circuit', (circuit) => removePart(circuit, selectedPart.id))
                    }}
                    onProp={(key, value) => setCircuit('circuit', (circuit) => ({ ...circuit, parts: circuit.parts.map((part) => (part.id === selectedPart.id ? { ...part, props: { ...part.props, [key]: value } } : part)) }))}
                  />
                </PanelCard>
              ) : selectedWire ? (
                <PanelCard title="Seçili kablo">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-code text-sm text-slate-700 dark:text-slate-200">
                      {describeEndpoint(project.circuit, selectedWire.from)} ↔ {describeEndpoint(project.circuit, selectedWire.to)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelection(null)
                        setCircuit('circuit', (circuit) => ({ ...circuit, wires: circuit.wires.filter((wire) => wire.id !== selectedWire.id) }))
                      }}
                      className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
                    >
                      Kabloyu sök
                    </button>
                  </div>
                </PanelCard>
              ) : null}
              <PanelCard
                title="Parçalar"
                actions={
                  <label className="relative">
                    <span className="sr-only">Parça ekle</span>
                    <select
                      value=""
                      onChange={(event) => event.target.value && addPart(event.target.value)}
                      className="font-code appearance-none rounded-md bg-teal-700 py-1 pl-7 pr-3 text-xs font-semibold text-white dark:bg-teal-400 dark:text-teal-950"
                    >
                      <option value="">Parça ekle</option>
                      {[
                        ['Breadboard ve elemanlar', ([type, definition]) => type === 'breadboard' || definition.bare],
                        ['Modüller', ([type, definition]) => type !== 'breadboard' && !definition.bare],
                      ].map(([group, test]) => (
                        <optgroup key={group} label={group}>
                          {Object.entries(PART_CATALOG)
                            .filter(test)
                            .map(([type, definition]) => (
                              <option key={type} value={type}>
                                {definition.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    <Plus size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white dark:text-teal-950" />
                  </label>
                }
              >
                {project.circuit.parts.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {project.circuit.parts.map((part) => (
                      <li key={part.id}>
                        <button
                          type="button"
                          aria-pressed={part.id === selectedPart?.id}
                          onClick={() => setSelection(part.id === selectedPart?.id ? null : { partId: part.id })}
                          className={`font-code inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm transition ${part.id === selectedPart?.id ? 'border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-300/60 dark:bg-teal-400/10 dark:text-teal-100' : 'border-slate-300 text-slate-700 hover:border-teal-600 hover:text-teal-800 dark:border-white/15 dark:text-slate-200'}`}
                        >
                          {part.id === selectedPart?.id ? <Check size={13} /> : null}
                          {partLabel(part)}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">Masada parça yok. “Parça ekle” ile başlayın.</p>
                )}
              </PanelCard>
              <ConnectionsPanel
                circuit={project.circuit}
                selection={selection}
                onSelect={setSelection}
                onWire={(part, pin, uno) => wireToUno('circuit', part, pin, uno)}
                onStrip={stripToUno}
                onConnect={(from, to) => setCircuit('circuit', (circuit) => connectEndpoints(circuit, from, to))}
              />
              {issues.length ? (
                <PanelCard title="Devre kontrolü">
                  <IssuesList issues={issues} />
                </PanelCard>
              ) : null}
            </>
          ) : (
            <>
              <PanelCard
                title="Araba"
                actions={
                  <button
                    type="button"
                    onClick={() => {
                      sim.resetCar()
                      setCarResetToken((token) => token + 1)
                    }}
                    className="font-code inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300"
                  >
                    <RotateCcw size={12} />
                    Başa al
                  </button>
                }
              >
                <div className="mb-4 flex flex-wrap gap-2">
                  <select
                    aria-label="Parkur"
                    value={track}
                    onChange={(event) => {
                      setTrack(event.target.value)
                      sim.setTrack(event.target.value)
                    }}
                    className="font-code rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100"
                  >
                    {Object.entries(TRACKS).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex rounded-md border border-slate-300 p-0.5 dark:border-white/15">
                    {[
                      ['follow', 'Takip'],
                      ['top', 'Üstten'],
                      ['free', 'Serbest'],
                    ].map(([view, text]) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setCarView(view)}
                        className={`rounded-sm px-2.5 py-1 text-sm ${carView === view ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
                <CarHud car={sim.hud?.car} />
              </PanelCard>
              <PanelCard title="Araba kabloları">
                <CarWiring circuit={project.carCircuit} onWire={(part, pin, uno) => wireToUno('carCircuit', part, pin, uno)} />
                {issues.length ? (
                  <div className="mt-4">
                    <IssuesList issues={issues} />
                  </div>
                ) : null}
              </PanelCard>
            </>
          )}
        </div>
      </div>

      <Licenses ref={licensesRef} />
    </div>
  )
}
