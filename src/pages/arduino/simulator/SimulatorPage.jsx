import { Bot, Check, Columns2, Columns3, Cpu, LayoutTemplate, Loader2, Lock, LockOpen, Play, Plus, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PART_CATALOG,
  UNO_ID,
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
  unoPlacement,
} from '../../../utils/avrSim/catalog'
import { TRACKS } from '../../../utils/avrSim/car'
import BenchView from './BenchView'
import CarView from './CarView'
import CodeEditor from './CodeEditor'
import { Dock, Splitter } from './Dock'
import { useAutoColumns, useDockLayout, useWideScreen } from './dockLayout'
import Licenses from './Licenses'
import AnswerBar from './AnswerBar'
import LibraryList from './LibraryList'
import RunButtons from './RunButtons'
import { compileSketch, rememberCompiled } from './compile'
import { onCompilerProgress, preloadCompiler } from './compiler/browserCompiler'
import { EXAMPLES } from './examples'
import { CarHud, CarWiring, ConnectionsPanel, IssuesList, PanelCard, PartInspector, SerialMonitor, UnoInspector } from './Panels'
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

// Cars saved before the battery pack and the motors were parts of their own
// get them, wired as the chassis comes.
function withChassis(carCircuit) {
  const chassis = CAR_EXAMPLE.carCircuit
  const missing = chassis.parts.filter((part) => !carCircuit.parts.some((p) => p.id === part.id))
  if (!missing.length) return carCircuit
  const added = new Set(missing.map((part) => part.id))
  return { ...carCircuit, parts: [...carCircuit.parts, ...missing], wires: [...carCircuit.wires, ...chassis.wires.filter((wire) => added.has(wire.from.part))] }
}

function loadSaved() {
  try {
    for (const key of OLD_STORAGE_KEYS) window.localStorage.removeItem(key)
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    // Projects saved before the breadboard used { part, pin, uno } wires.
    if (saved?.code && saved?.circuit) return { ...saved, circuit: normalizeCircuit(saved.circuit), carCircuit: saved.carCircuit ? withChassis(normalizeCircuit(saved.carCircuit)) : clone(CAR_EXAMPLE.carCircuit) }
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
const FOOTPRINT = { breadboard: 9, motorDriver: 2.6, ttMotor: 4.5, battery: 4.3, ultrasonic: 3.2, servo: 2.6, sevenSegment: 2.4, irSensor: 2 }
const footprint = (type) => FOOTPRINT[type] ?? 1.6

function nextPosition(circuit, type) {
  const spots = []
  for (const z of [8, -8, 13, -13, 18]) for (const x of [0, -5, 5, -10, 10, -15, 15, -20, 20]) spots.push([x, z])
  const [ux, uz] = unoPlacement(circuit).position
  const free = ([x, z]) =>
    Math.hypot(x - ux, z - uz) > 4.4 + footprint(type) &&
    circuit.parts.every((part) => Math.hypot(part.position[0] - x, part.position[1] - z) > footprint(part.type) + footprint(type) + 0.6)
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
  // A chip clicked in the parts list stays under the pointer while the
  // inspector above it opens, closes or changes height.
  const chipAnchor = useRef(null)
  useLayoutEffect(() => {
    const anchor = chipAnchor.current
    chipAnchor.current = null
    const chip = anchor && document.querySelector(`[data-part-chip="${CSS.escape(anchor.id)}"]`)
    if (!chip) return
    const moved = chip.getBoundingClientRect().top - anchor.top
    // In the wide layout the dock scrolls, not the page.
    if (Math.abs(moved) > 1) (chip.closest('[data-dock-scroll]') ?? window).scrollBy({ top: moved, behavior: 'instant' })
  }, [selection])
  // The Uno always starts locked (on every visit and every exercise), so a
  // drag meant for the camera does not knock it aside; unlocking it lasts
  // for this visit only.
  const [unoUnlocked, setUnoUnlocked] = useState(false)
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
  const dock = useDockLayout()
  const wide = useWideScreen()
  const autoColumns = useAutoColumns()
  const workspaceRef = useRef(null)
  const [workspaceWidth, setWorkspaceWidth] = useState(1200)
  useEffect(() => {
    const element = workspaceRef.current
    if (!element) return undefined
    const observer = new ResizeObserver(() => setWorkspaceWidth(element.parentElement.getBoundingClientRect().width))
    observer.observe(element.parentElement)
    return () => observer.disconnect()
  }, [wide, dock.layout.columns, autoColumns])
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

  // The code the last good build came from (the "Çalıştır" piece runs it).
  const [built, setBuilt] = useState(null)
  const build = async (prefer = project.prefer ?? {}) => {
    setCompile({ state: 'compiling' })
    setDownload(null)
    const started = performance.now()
    const result = await compileSketch(project.code, prefer)
    if (!result.ok) {
      setCompile({ state: 'error', ...result })
      return null
    }
    hexRef.current = result.hex
    setBuilt(project.code)
    setCompile({ state: 'ok', source: result.source, size: result.size, libraries: result.libraries, seconds: (performance.now() - started) / 1000 })
    return result.hex
  }
  const runBuilt = () => {
    if (!hexRef.current) return
    setCarResetToken((token) => token + 1)
    launch(hexRef.current)
  }
  const run = async (prefer) => {
    if (await build(prefer)) runBuilt()
  }

  const update = (changes) => setProject((current) => ({ ...current, ...changes }))
  // Parts locked where they are ({ id: true }), saved with the project but
  // kept out of the circuit so locking does not restart a running sketch.
  // The Uno's lock is not saved (see unoUnlocked).
  const locked = { [UNO_ID]: !unoUnlocked, ...Object.fromEntries(project.circuit.parts.map((part) => [part.id, Boolean(project.locked?.[part.id])])) }
  const toggleLock = (id) => {
    if (id === UNO_ID) setUnoUnlocked((value) => !value)
    else setProject((current) => ({ ...current, locked: { ...current.locked, [id]: !current.locked?.[id] } }))
  }
  const allLocked = Object.values(locked).every(Boolean)
  const lockAll = (value) => {
    setUnoUnlocked(!value)
    update({ locked: Object.fromEntries(project.circuit.parts.map((part) => [part.id, value])) })
  }
  const setCircuit = (key, fn) => setProject((current) => ({ ...current, [key]: fn(current[key]) }))

  // Turns a part a quarter; if it would then run into another part or the
  // Uno it moves to the nearest spot where it fits. False when there is none.
  const benchApi = useRef(null)
  const rotate = (id) => {
    const before = project.circuit
    const turned = rotatePart(before, id)
    const fits = (circuit) => !benchApi.current || benchApi.current.fits(before, circuit, id)
    let next = fits(turned) ? turned : null
    const [x, z] = id === UNO_ID ? unoPlacement(turned).position : turned.parts.find((item) => item.id === id).position
    for (let radius = 0.4; !next && radius <= 6; radius += 0.4) {
      for (let step = 0; step < 16 && !next; step += 1) {
        const angle = (step / 16) * 2 * Math.PI
        const moved = movePart(turned, id, [x + radius * Math.cos(angle), z + radius * Math.sin(angle)])
        if (fits(moved)) next = moved
      }
    }
    if (next) setCircuit('circuit', () => next)
    return Boolean(next)
  }

  const wireToUno = (key, part, pin, uno) => setCircuit(key, (circuit) => setDirectUnoPin(circuit, part, pin, uno))
  const stripToUno = (board, strip, uno) => setCircuit('circuit', (circuit) => setStripUno(circuit, board, strip, uno))

  const addPart = (type) => {
    const { parts } = project.circuit
    let index = 1
    while (parts.some((part) => part.id === `${type}-${index}`)) index += 1
    const defaults = PART_CATALOG[type].props
    const part = { id: `${type}-${index}`, type, position: nextPosition(project.circuit, type), rotation: 0, ...(defaults ? { props: { ...defaults } } : {}) }
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
    setUnoUnlocked(false)
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
    setUnoUnlocked(false)
    setProject(projectFromExample(example))
  }

  const selectedPart = selection?.partId ? project.circuit.parts.find((part) => part.id === selection.partId) : null
  const selectedWire = selection?.wireId ? project.circuit.wires.find((wire) => wire.id === selection.wireId) : null
  const diagnostics = useMemo(() => (compile.state === 'error' ? (compile.diagnostics ?? []) : []), [compile])

  const serialPanel = <SerialMonitor text={sim.serial} running={running} baud={sim.hud?.baud} onSend={sim.sendSerial} onClear={sim.clearSerial} />
  const editorPane = (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300/80 bg-white dark:border-teal-300/15 dark:bg-[#0b1517]">
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
      <div className="min-h-0 flex-1">
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
          <>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-rose-700 dark:text-rose-300">{compile.errors}</pre>
            {Object.keys(project.prefer ?? {}).length ? (
              <button
                type="button"
                onClick={() => {
                  update({ prefer: {} })
                  run({})
                }}
                className="mt-1 text-slate-600 underline hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300"
              >
                kütüphane seçimlerini sıfırla
              </button>
            ) : null}
          </>
        ) : compile.state === 'ok' ? (
          <>
            <p className="text-emerald-700 dark:text-emerald-300">
              {compile.source === 'example'
                ? 'Hazır derlenmiş örnek yüklendi.'
                : `${compile.source === 'browser' ? 'Tarayıcıda derlendi' : 'Derlendi'} (${compile.seconds.toFixed(1)} s).`}{' '}
              {compile.size?.split('\n')[0]}
            </p>
            <LibraryList
              libraries={compile.libraries}
              prefer={project.prefer ?? {}}
              onPrefer={(header, name) => {
                const prefer = { ...project.prefer, [header]: name }
                update({ prefer })
                run(prefer)
              }}
            />
          </>
        ) : compile.state === 'compiling' ? (
          <p className="text-slate-500 dark:text-slate-400">
            {download && !download.preparing && download.loaded < download.total
              ? `Derleyici indiriliyor (yalnızca ilk seferde): ${(download.loaded / 1e6).toFixed(1)} / ${(download.total / 1e6).toFixed(1)} MB`
              : download?.library
                ? `Kütüphane: ${download.library}… (ilk seferde biraz sürebilir)`
                : 'GCC ile derleniyor…'}
          </p>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Hazır. “Derle ve çalıştır” ile başlatın.</p>
        )}
        {sim.runtimeError ? <p className="mt-1 text-rose-700 dark:text-rose-300">Simülasyon durdu: {sim.runtimeError}</p> : null}
      </div>
      <p className="border-t border-slate-200 px-3 py-1.5 text-[0.7rem] text-slate-500 dark:border-white/10 dark:text-slate-400">
        Tarayıcıda çalışır. Derleyici: GCC 7.3.0 ve GNU binutils 2.42 (WebAssembly, GPL-3.0); kütüphaneler Arduino Library Manager’dan indirilir.{' '}
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
  )
  const benchPane = (
    <section className="relative h-full overflow-hidden rounded-xl border border-slate-300/80 bg-slate-200 dark:border-teal-300/15 dark:bg-[#0d1517]">
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
          onReset={() => running && sim.resetBoard()}
          locked={locked}
          apiRef={benchApi}
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
  )
  // The panels, by id; null when there is nothing to show.
  const panels =
    project.mode === 'bench'
      ? {
          selected: selection?.partId === UNO_ID ? (
            <PanelCard title="Seçili parça">
              <UnoInspector
                running={running}
                board={unoPlacement(project.circuit).board}
                onBoard={(board) => setCircuit('circuit', (circuit) => ({ ...circuit, uno: { ...unoPlacement(circuit), board } }))}
                locked={Boolean(locked[UNO_ID])}
                onToggleLock={() => toggleLock(UNO_ID)}
                onRotate={() => rotate(UNO_ID)}
                onReset={sim.resetBoard}
              />
            </PanelCard>
          ) : selectedPart ? (
            <PanelCard title="Seçili parça">
              <PartInspector
                part={selectedPart}
                circuit={project.circuit}
                inputs={project.inputs[selectedPart.id]}
                state={sim.hud?.parts?.[selectedPart.id]}
                locked={Boolean(locked[selectedPart.id])}
                onToggleLock={() => toggleLock(selectedPart.id)}
                onInput={(key, value) => setInput(selectedPart.id, key, value)}
                onWire={(part, pin, uno) => wireToUno('circuit', part, pin, uno)}
                onStrip={stripToUno}
                onRotate={() => rotate(selectedPart.id)}
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
          ) : null,
          parts: (
            <PanelCard
              title="Parçalar"
              actions={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => lockAll(!allLocked)}
                    title={allLocked ? 'Bütün parçaların kilidini aç' : 'Bütün parçaları yerinde kilitle'}
                    className="font-code inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:text-slate-300"
                  >
                    {allLocked ? <LockOpen size={12} /> : <Lock size={12} />}
                    {allLocked ? 'Kilitleri aç' : 'Hepsini kilitle'}
                  </button>
                  <label className="relative">
                    <span className="sr-only">Parça ekle</span>
                    <select
                      value=""
                      onChange={(event) => event.target.value && addPart(event.target.value)}
                      className="font-code w-[7.5rem] appearance-none rounded-md bg-teal-700 py-1 pl-7 pr-2 text-xs font-semibold text-white dark:bg-teal-400 dark:text-teal-950"
                    >
                      <option value="">Parça ekle</option>
                      {[
                        ['Breadboard ve elemanlar', ([type, definition]) => type === 'breadboard' || definition.bare],
                        ['Modüller', ([type, definition]) => type !== 'breadboard' && !definition.bare],
                      ].map(([group, test]) => (
                        <optgroup key={group} label={group}>
                          {Object.entries(PART_CATALOG)
                            .filter((entry) => !entry[1].legacy && test(entry))
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
                </div>
              }
            >
              {/* The Uno comes first; it can be moved and turned but not removed. */}
              <ul className="flex flex-wrap gap-2">
                {[{ id: UNO_ID, label: 'Arduino Uno' }, ...project.circuit.parts.map((part) => ({ id: part.id, label: partLabel(part) }))].map(({ id, label }) => {
                  const chosen = selection?.partId === id
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-pressed={chosen}
                        data-part-chip={id}
                        onClick={(event) => {
                          chipAnchor.current = { id, top: event.currentTarget.getBoundingClientRect().top }
                          setSelection(chosen ? null : { partId: id })
                        }}
                        className={`font-code inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm transition ${chosen ? 'border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-300/60 dark:bg-teal-400/10 dark:text-teal-100' : 'border-slate-300 text-slate-700 hover:border-teal-600 hover:text-teal-800 dark:border-white/15 dark:text-slate-200'}`}
                      >
                        {chosen ? <Check size={13} /> : null}
                        {label}
                        {locked[id] ? <Lock size={11} className="text-amber-600 dark:text-amber-300" aria-label="kilitli" /> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {project.circuit.parts.length ? null : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Masada başka parça yok. “Parça ekle” ile başlayın.</p>}
            </PanelCard>
          ),
          connections: (
            <ConnectionsPanel
              circuit={project.circuit}
              selection={selection}
              onSelect={setSelection}
              onWire={(part, pin, uno) => wireToUno('circuit', part, pin, uno)}
              onStrip={stripToUno}
              onConnect={(from, to) => setCircuit('circuit', (circuit) => connectEndpoints(circuit, from, to))}
            />
          ),
          issues: issues.length ? (
            <PanelCard title="Devre kontrolü">
              <IssuesList issues={issues} />
            </PanelCard>
          ) : null,
          serial: serialPanel,
        }
      : {
          car: (
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
          ),
          carWiring: (
            <PanelCard title="Araba kabloları">
              <CarWiring circuit={project.carCircuit} onWire={(part, pin, uno) => wireToUno('carCircuit', part, pin, uno)} />
              {issues.length ? (
                <div className="mt-4">
                  <IssuesList issues={issues} />
                </div>
              ) : null}
            </PanelCard>
          ),
          serial: serialPanel,
        }

  const panelIds = new Set(Object.keys(panels).filter((id) => panels[id]))
  const { layout } = dock
  const columnCount = layout.columns ?? autoColumns
  const twoColumns = columnCount === 2
  const hasDock = (side) => layout.docks[side].some((id) => panelIds.has(id)) || Boolean(dock.dragging)
  // Column widths stay within the screen; the 3D view keeps at least 380 px
  // (480 in two columns, where the code column is wider).
  const room = Math.max(0, workspaceWidth - 32)
  const widths = (current) => {
    if ((current.columns ?? autoColumns) === 2) return { left2: Math.max(340, Math.min(current.left2, room - 480)) }
    const left = Math.max(300, Math.min(current.left, room - 380 - Math.max(280, current.right)))
    return { left, right: Math.max(280, Math.min(current.right, room - 380 - left)) }
  }
  const { left: leftWidth = 0, right: rightWidth = 0, left2: codeWidth = 0 } = widths(layout)
  // Dragging works from the latest widths, so fast drags keep up.
  const resize = (side, delta) => dock.update((current) => ({ [side]: widths(current)[side] + delta }))
  // A column's top pane (code, or the 3D view) against the dock under it.
  const resizeRow = (key, column, delta) => {
    const height = column?.getBoundingClientRect().height || 600
    dock.update((current) => ({ [key]: Math.min(0.85, Math.max(0.25, current[key] + delta / height)) }))
  }
  // A column: its pane on top and, when it has panels, the dock under it.
  const column = (side, pane, key) => (
    <div className="flex min-h-0 flex-col" data-column={side}>
      <div className="min-h-[180px]" style={{ flex: hasDock(side) ? `0 0 ${layout[key] * 100}%` : '1 1 auto' }}>
        {pane}
      </div>
      {hasDock(side) ? (
        <>
          <Splitter direction="horizontal" label="Üstteki alan ile panellerin yüksekliği" onMove={(dy) => resizeRow(key, workspaceRef.current?.querySelector(`[data-column="${side}"]`), dy)} />
          <Dock side={side} dock={dock} panels={panels} className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1" />
        </>
      ) : null}
    </div>
  )

  return (
    <>
      {/* On large screens the toolbar and the workspace fill the screen under the site header. */}
      <div className={wide ? 'flex h-[calc(100dvh-5.75rem)] min-h-[640px] flex-col gap-2' : 'space-y-3'}>
        <h1 className="sr-only">Arduino Simülatörü</h1>
        <PanelCard className="[&>div]:px-3 [&>div]:py-2.5">
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
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <button type="button" onClick={() => setSound((value) => !value)} title={sound ? 'Sesi kapat' : 'Sesi aç'} aria-label={sound ? 'Sesi kapat' : 'Sesi aç'} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:text-teal-700 dark:border-white/15 dark:text-slate-300">
                {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {running ? (
                <button type="button" onClick={sim.stop} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700">
                  <Square size={15} />
                  Durdur
                </button>
              ) : null}
              <RunButtons
                compiling={compile.state === 'compiling'}
                running={running}
                canRun={built !== null}
                stale={built !== null && built !== project.code}
                onBuildAndRun={() => run()}
                onBuild={() => build()}
                onRun={runBuilt}
              />
            </div>
          </div>
          {example ? (
            <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <p className="min-w-0 flex-1 basis-80 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{example.summary}</p>
              <AnswerBar key={example.id} example={example} onShowCode={showCode} onShowWires={showWires} onReset={resetExercise} className="space-y-2" />
            </div>
          ) : null}
        </PanelCard>

        {wide ? (
          // Editor | 3D view | dock, filling the screen under the site header.
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1.5 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="hidden xl:inline">Çubukları sürükleyerek alanları büyütün; panelleri tutamaklarından sürükleyip yerlerini değiştirin, başlıklarına tıklayıp katlayın.</span>
              <div className="flex rounded-md border border-slate-300 p-0.5 dark:border-white/15" role="group" aria-label="Düzen">
                {[
                  [3, '3 sütun', <Columns3 key="icon" size={13} />],
                  [2, '2 sütun', <Columns2 key="icon" size={13} />],
                ].map(([columns, text, icon]) => (
                  <button
                    key={columns}
                    type="button"
                    aria-pressed={columnCount === columns}
                    onClick={() => dock.update({ columns })}
                    className={`font-code inline-flex items-center gap-1 rounded-sm px-2 py-0.5 ${columnCount === columns ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950' : 'hover:text-teal-700 dark:hover:text-teal-300'}`}
                  >
                    {icon}
                    {text}
                  </button>
                ))}
              </div>
              <button type="button" onClick={dock.reset} className="font-code inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300">
                <LayoutTemplate size={13} />
                Düzeni sıfırla
              </button>
            </div>
            {twoColumns ? (
              <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: `${codeWidth}px auto minmax(0,1fr)` }} ref={workspaceRef}>
                {column('left', editorPane, 'editor')}
                <Splitter label="Kod ile 3B görünümün genişliği" onMove={(dx) => resize('left2', dx)} />
                {column('right', benchPane, 'bench')}
              </div>
            ) : (
              <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: `${leftWidth}px auto minmax(0,1fr) auto ${rightWidth}px` }} ref={workspaceRef}>
                {column('left', editorPane, 'editor')}
                <Splitter label="Kod ile 3B görünümün genişliği" onMove={(dx) => resize('left', dx)} />
                {benchPane}
                <Splitter label="3B görünüm ile panellerin genişliği" onMove={(dx) => resize('right', -dx)} />
                <Dock side="right" dock={dock} panels={panels} className="min-h-0 space-y-3 overflow-y-auto pb-1" />
              </div>
            )}
          </div>
        ) : (
          // Phones and tablets: the 3D view first, then the code and the panels.
          <div className="space-y-4">
            <div className="h-[380px] sm:h-[520px]">{benchPane}</div>
            <div className="h-[460px] sm:h-[540px]">{editorPane}</div>
            {[...layout.docks.left, ...layout.docks.right].map((id) => (panels[id] ? <div key={id}>{panels[id]}</div> : null))}
          </div>
        )}

      </div>
      <div className="mt-4">
        <Licenses ref={licensesRef} />
      </div>
    </>
  )
}
