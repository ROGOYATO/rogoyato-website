import { Eraser, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ARENA, MIN_DRAWN_LENGTH, trackFromDrawing } from '../../../utils/avrSim/car'

const SCALE = 400 // canvas px per metre
const LINE_PX = 0.019 * SCALE // the black tape, to scale

// Draw your own track: press, drag around the arena and let go. The end is
// joined back to the start, where the car sets off.
export default function TrackDrawer({ initial, onUse, onClose }) {
  const canvasRef = useRef(null)
  const [raw, setRaw] = useState([])
  const [preview, setPreview] = useState(initial ?? null)
  const [tooShort, setTooShort] = useState(false)
  const drawing = useRef(false)

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    const { width, height } = ctx.canvas
    ctx.fillStyle = '#f4f4f0'
    ctx.fillRect(0, 0, width, height)
    // 10 cm grid
    ctx.strokeStyle = '#dcdcd4'
    ctx.lineWidth = 1
    for (let x = 0.1; x < ARENA.width; x += 0.1) {
      ctx.beginPath()
      ctx.moveTo(x * SCALE, 0)
      ctx.lineTo(x * SCALE, height)
      ctx.stroke()
    }
    for (let y = 0.1; y < ARENA.height; y += 0.1) {
      ctx.beginPath()
      ctx.moveTo(0, y * SCALE)
      ctx.lineTo(width, y * SCALE)
      ctx.stroke()
    }
    const stroke = (points, closed, color) => {
      if (points.length < 2) return
      ctx.strokeStyle = color
      ctx.lineWidth = LINE_PX
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      points.forEach(([x, y], index) => (index ? ctx.lineTo(x * SCALE, y * SCALE) : ctx.moveTo(x * SCALE, y * SCALE)))
      if (closed) ctx.closePath()
      ctx.stroke()
    }
    if (raw.length) stroke(raw, false, '#111111')
    else if (preview) {
      stroke(preview.points, true, '#111111')
      // Start: a green dot where the car sets off.
      const [x0, y0] = preview.points[0]
      ctx.fillStyle = '#16a34a'
      ctx.beginPath()
      ctx.arc(x0 * SCALE, y0 * SCALE, 9, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [raw, preview])

  const toArena = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return [((event.clientX - rect.left) / rect.width) * ARENA.width, ((event.clientY - rect.top) / rect.height) * ARENA.height]
  }

  const down = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    setPreview(null)
    setTooShort(false)
    setRaw([toArena(event)])
  }
  const move = (event) => {
    if (!drawing.current) return
    const point = toArena(event)
    setRaw((points) => {
      const [lx, ly] = points[points.length - 1]
      return Math.hypot(point[0] - lx, point[1] - ly) < 0.005 ? points : [...points, point]
    })
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    const track = trackFromDrawing(raw)
    setPreview(track)
    setTooShort(!track)
    setRaw([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Pist çiz">
      <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl dark:bg-[#0f1a1c]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Pist çiz</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Basılı tutup alanın içinde bir tur çiz ve bırak; bitiş, başladığın yere birleştirilir. Araba yeşil noktadan, çizdiğin yönde başlar. Çizgi kendisiyle kesişebilir. Alan 2 m × 1,4 m, kareler 10 cm.
        </p>
        <canvas
          ref={canvasRef}
          width={ARENA.width * SCALE}
          height={ARENA.height * SCALE}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="mt-3 w-full cursor-crosshair touch-none rounded-md border border-slate-300 dark:border-white/15"
        />
        {tooShort ? (
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Pist çok kısa; en az {MIN_DRAWN_LENGTH.toLocaleString('tr')} m uzunluğunda bir tur çiz.</p>
        ) : null}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setRaw([])
              setPreview(null)
              setTooShort(false)
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-white/15 dark:text-slate-200"
          >
            <Eraser size={14} />
            Temizle
          </button>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-white/15 dark:text-slate-200">
            Vazgeç
          </button>
          <button
            type="button"
            disabled={!preview}
            onClick={() => onUse(preview)}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-teal-400 dark:text-teal-950"
          >
            Bu pisti kullan
          </button>
        </div>
      </div>
    </div>
  )
}
