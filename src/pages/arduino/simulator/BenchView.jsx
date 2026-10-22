import { useEffect, useRef, useState } from 'react'
import { Bench3D } from './Bench3D'

// apiRef gets { fits(before, after, partId) } for checks made outside the scene.
export default function BenchView({ circuit, inputs, selection, dark, frameKey, subscribe, onSelect, onConnect, onMovePart, onPress, apiRef }) {
  const containerRef = useRef(null)
  const benchRef = useRef(null)
  const handlers = useRef({})
  const inputsRef = useRef(inputs)
  const [hover, setHover] = useState(null)
  const [wiring, setWiring] = useState(null)

  useEffect(() => {
    handlers.current = { onSelect, onConnect, onMovePart, onPress }
    inputsRef.current = inputs
  })

  useEffect(() => {
    const bench = new Bench3D(containerRef.current, {
      onSelect: (value) => handlers.current.onSelect?.(value),
      onConnect: (from, to) => handlers.current.onConnect?.(from, to),
      onMovePart: (id, position) => handlers.current.onMovePart?.(id, position),
      onPress: (id, pressed) => handlers.current.onPress?.(id, pressed),
      onHover: setHover,
      onWiring: setWiring,
    })
    benchRef.current = bench
    if (apiRef) apiRef.current = { fits: (before, after, partId) => bench.fits(before, after, partId) }
    const unsubscribe = subscribe((snapshot) => bench.setSnapshot(snapshot, inputsRef.current))
    return () => {
      unsubscribe()
      bench.dispose()
      benchRef.current = null
      if (apiRef) apiRef.current = null
    }
  }, [subscribe, apiRef])

  useEffect(() => {
    benchRef.current?.setCircuit(circuit)
  }, [circuit])

  // Frame the scene when a different project is opened, not on every edit.
  useEffect(() => {
    benchRef.current?.frame()
  }, [frameKey])

  useEffect(() => {
    benchRef.current?.setSelection(selection)
  }, [selection])

  useEffect(() => {
    benchRef.current?.setTheme(dark)
  }, [dark])

  useEffect(() => {
    benchRef.current?.setInputs(inputs)
  }, [inputs])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-9rem)] rounded-md bg-slate-900/75 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
        {wiring ? (
          <span>
            <span className="text-amber-300">{wiring}</span> seçildi. Kablonun öbür ucu için bir pine ya da breadboard deliğine tıklayın (iptal: Esc ya da boş alan).
          </span>
        ) : (
          'Pine ya da breadboard deliğine tıklayıp kablo çekin · parçayı breadboard’a sürükleyip takın · butona basılı tutun'
        )}
      </div>
      {hover ? (
        <div
          className="font-code pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: hover.x, top: hover.y - 10 }}
        >
          {hover.text}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => benchRef.current?.focus()}
        className="font-code absolute bottom-3 right-3 rounded-md border border-white/20 bg-slate-900/70 px-2.5 py-1 text-xs text-white backdrop-blur-sm hover:bg-slate-900"
      >
        Kamerayı sıfırla
      </button>
    </div>
  )
}
