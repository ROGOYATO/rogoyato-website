import { GripVertical, Hammer, Loader2, Play, RotateCw } from 'lucide-react'
import { useRef, useState } from 'react'

const STORAGE_KEY = 'rogoyato-derle-calistir-ayri'
const SPLIT_AT = 28 // px of drag that splits or joins the pieces
const GAP = 14 // px between the pieces once split

function remembered() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// "Derle ve çalıştır" as two puzzle pieces. Together they are one button.
// Drag the Derle piece to the left (or Alt+←) and they come apart into
// Derle (compile only) and Çalıştır (run the last build); drag it back
// (or Alt+→) to join them again.
export default function RunButtons({ compiling, running, canRun, stale, onBuildAndRun, onBuild, onRun }) {
  const [split, setSplit] = useState(remembered)
  const [drag, setDrag] = useState(0) // live offset of the Derle piece while dragged
  const start = useRef(null)

  const choose = (value) => {
    setSplit(value)
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    } catch {
      // The choice lasts for this visit only.
    }
  }

  const onPointerDown = (event) => {
    if (event.button !== 0) return
    start.current = { x: event.clientX, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event) => {
    if (!start.current) return
    const dx = event.clientX - start.current.x
    if (Math.abs(dx) > 4) start.current.moved = true
    // Joined, it only pulls left; split, it only pushes back right.
    setDrag(split ? Math.max(0, Math.min(GAP + 20, dx)) : Math.min(0, Math.max(-(GAP + 30), dx)))
  }
  const onPointerUp = (event) => {
    const begun = start.current
    start.current = null
    const dx = event.clientX - (begun?.x ?? event.clientX)
    setDrag(0)
    if (!begun) return
    if (begun.moved) {
      if (!split && dx <= -SPLIT_AT) choose(true)
      else if (split && dx >= SPLIT_AT) choose(false)
      return
    }
    if (split) onBuild()
    else onBuildAndRun()
  }
  const onKeyDown = (event) => {
    if (event.altKey && event.key === 'ArrowLeft' && !split) {
      event.preventDefault()
      choose(true)
    } else if (event.altKey && event.key === 'ArrowRight' && split) {
      event.preventDefault()
      choose(false)
    }
  }

  const offset = (split ? -GAP : 0) + drag
  const busy = compiling
  const base =
    'relative inline-flex h-10 select-none items-center gap-2 font-semibold transition-[transform,background-color,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="relative inline-flex items-center" style={{ paddingLeft: split ? GAP : 0, transition: 'padding 200ms ease-out' }}>
      {/* Derle: the piece with the tab. */}
      <button
        type="button"
        aria-label={split ? 'Derle' : 'Derle ve çalıştır'}
        title={split ? 'Derle (sağa sürükleyince birleşir)' : 'Derle ve çalıştır (Derle’yi sola sürükleyince ayrılır)'}
        disabled={busy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null
          setDrag(0)
        }}
        onKeyDown={onKeyDown}
        // Pointer clicks are handled on release (to tell them from drags);
        // this is Enter, Space and assistive technology.
        onClick={(event) => {
          if (event.detail !== 0) return
          if (split) onBuild()
          else onBuildAndRun()
        }}
        style={{ transform: `translateX(${offset}px)`, touchAction: 'none' }}
        className={`${base} z-10 cursor-grab rounded-l-lg bg-teal-700 pl-2 pr-4 text-white shadow-sm hover:bg-teal-800 active:cursor-grabbing dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-300 ${split ? 'rounded-r-lg' : ''}`}
      >
        <GripVertical size={15} className="opacity-60" aria-hidden />
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Hammer size={16} />}
        {busy ? 'Derleniyor…' : split ? 'Derle' : running ? 'Yeniden derle ve' : 'Derle ve'}
        {/* The tab that sits in the Çalıştır piece's socket. */}
        <span
          aria-hidden
          className="absolute -right-[9px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full bg-inherit"
        />
      </button>

      {/* Çalıştır: the piece with the socket. */}
      <button
        type="button"
        aria-label={split ? 'Çalıştır' : 'Derle ve çalıştır'}
        title={split ? (canRun ? (stale ? 'Son derlenen programı çalıştır (kod o zamandan beri değişti)' : 'Son derlenen programı çalıştır') : 'Önce derleyin') : 'Derle ve çalıştır'}
        disabled={busy || (split && !canRun)}
        onClick={() => (split ? onRun() : onBuildAndRun())}
        style={{
          WebkitMaskImage: 'radial-gradient(circle 9px at 0 50%, transparent 8.5px, #000 9px)',
          maskImage: 'radial-gradient(circle 9px at 0 50%, transparent 8.5px, #000 9px)',
        }}
        className={`${base} ml-[2px] rounded-r-lg pl-5 pr-4 shadow-sm ${split ? 'rounded-l-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300' : 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-300'}`}
      >
        {split && running ? <RotateCw size={16} /> : <Play size={16} />}
        {split ? (running ? 'Yeniden başlat' : 'Çalıştır') : 'çalıştır'}
        {split && stale && canRun ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-300" aria-hidden /> : null}
      </button>
    </div>
  )
}
