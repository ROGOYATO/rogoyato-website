import { useMemo, useState } from 'react'
import { COMPETITION_TRACKS, alongTrack } from '../utils/competitionTracks'

const CM = 100
const MARGIN = 12 // cm round the line
const number = (value, digits = 1) => value.toLocaleString('tr', { maximumFractionDigits: digits })

// Each track in centimetres with the distance to every point.
function prepare(id) {
  const { name, points: metres } = COMPETITION_TRACKS[id]
  const points = metres.map(([x, y]) => [x * CM, y * CM])
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const box = { x: Math.min(...xs) - MARGIN, y: Math.min(...ys) - MARGIN, w: Math.max(...xs) - Math.min(...xs) + 2 * MARGIN, h: Math.max(...ys) - Math.min(...ys) + 2 * MARGIN }
  const { distances, length } = alongTrack(points)
  const at = (fraction) => {
    const goal = fraction * length
    let i = distances.findIndex((d) => d >= goal)
    if (i < 0) i = points.length - 1
    const j = (i + 1) % points.length
    return { point: points[i], direction: Math.atan2(points[j][1] - points[i][1], points[j][0] - points[i][0]) }
  }
  return { id, name, points, box, distances, length, at }
}

const TRACKS = Object.keys(COMPETITION_TRACKS).map(prepare)

function TrackPicker({ track, progress, onPick }) {
  const { points, box, distances, length, at } = track
  const robot = at(progress)
  const start = at(0)
  // A click on the drawing picks the nearest point of the line.
  const pick = (event) => {
    const svg = event.currentTarget
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse())
    let best = 0
    let bestDistance = Infinity
    points.forEach(([x, y], i) => {
      const d = (x - p.x) ** 2 + (y - p.y) ** 2
      if (d < bestDistance) {
        bestDistance = d
        best = i
      }
    })
    onPick(distances[best] / length)
  }
  const deg = (radians) => (radians * 180) / Math.PI
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} onClick={pick} className="w-full cursor-crosshair touch-manipulation rounded-md border border-slate-200 bg-white dark:border-white/10" role="img" aria-label={`${track.name} parkur: robotun çizgiden ayrıldığı noktaya dokun`}>
      <polyline points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke="#111" strokeWidth="1.9" strokeLinejoin="round" />
      {/* the part covered, from the start to the picked point */}
      <polyline
        points={points.filter((_, i) => distances[i] <= progress * length).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* start line and the way the robot goes */}
      <g transform={`translate(${start.point[0]},${start.point[1]}) rotate(${deg(start.direction)})`}>
        {[-3, -2, -1, 0, 1, 2].flatMap((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={c * 1.5 - 1.5} y={r * 1.5} width="1.5" height="1.5" fill={(r + c) % 2 ? '#fff' : '#111'} />))}
        <path d="M4 -4.2h7m-2.2 -1.8l2.2 1.8l-2.2 1.8" fill="none" stroke="#0f766e" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx={robot.point[0]} cy={robot.point[1]} r="2.4" fill="#0f766e" stroke="#fff" strokeWidth="0.6" />
    </svg>
  )
}

const input = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-zinc-900 dark:text-white'

// The day's score sheet: each track finished (time), not finished (how far
// along) or not tried, and the total the ranking goes by.
export default function ScoreCalculator({ limit }) {
  const [results, setResults] = useState(() => Object.fromEntries(TRACKS.map(({ id }) => [id, { status: 'finished', time: '', progress: 0.5 }])))
  const [shown, setShown] = useState(TRACKS[0].id)
  const set = (id, change) => setResults((all) => ({ ...all, [id]: { ...all[id], ...change } }))

  const scores = useMemo(
    () =>
      Object.fromEntries(
        TRACKS.map(({ id }) => {
          const r = results[id]
          if (r.status === 'none') return [id, { value: 2 * limit, note: 'Deneme yok' }]
          if (r.status === 'dnf') return [id, { value: limit + limit * (1 - r.progress), note: `${limit} + ${limit} × (1 − ${number(r.progress, 3)})` }]
          const time = Number(String(r.time).replace(',', '.'))
          if (!r.time || !(time > 0)) return [id, { value: null, note: 'Süreyi gir' }]
          if (time > limit) return [id, { value: null, note: `${limit} saniyeyi geçen deneme bitmiş sayılmaz; “Bitiremedi” seç` }]
          return [id, { value: time, note: 'Bitirdi' }]
        }),
      ),
    [results, limit],
  )
  const complete = Object.values(scores).every(({ value }) => value !== null)
  const total = Object.values(scores).reduce((sum, { value }) => sum + (value ?? 0), 0)
  const track = TRACKS.find(({ id }) => id === shown)
  const r = results[shown]

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Her parkur için robotun en iyi denemesini gir: bitirdiyse süresini, bitiremediyse çizgiden ayrıldığı ilk noktayı parkur çiziminde işaretle (atladıysa atladığı yer). Kesişmeye yakın bir yere dokununca yanlış kol seçilirse kaydırıcıyla düzelt.
      </p>

      <div role="tablist" aria-label="Parkur" className="flex flex-wrap gap-2">
        {TRACKS.map(({ id, name }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === shown}
            onClick={() => setShown(id)}
            className={`rounded-md border px-3 py-1.5 text-sm ${id === shown ? 'border-slate-900 bg-slate-900 font-semibold text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-300 text-slate-700 dark:border-white/15 dark:text-slate-200'}`}
          >
            {name} · {scores[id].value === null ? '—' : `${number(scores[id].value)} sn`}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <TrackPicker track={track} progress={r.status === 'dnf' ? r.progress : r.status === 'finished' ? 1 : 0} onPick={(progress) => set(shown, { status: 'dnf', progress })} />
        <div className="space-y-4 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            {track.name} parkur: {number(track.length / 100, 2)} m
          </p>
          <fieldset className="space-y-1.5">
            <legend className="font-semibold text-slate-900 dark:text-white">Sonuç</legend>
            {[
              ['finished', 'Bitirdi'],
              ['dnf', 'Bitiremedi'],
              ['none', 'Deneme yapmadı'],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <input type="radio" name={`sonuc-${shown}`} checked={r.status === value} onChange={() => set(shown, { status: value })} />
                {label}
              </label>
            ))}
          </fieldset>
          {r.status === 'finished' ? (
            <label className="block">
              <span className="font-semibold text-slate-900 dark:text-white">Süre (saniye)</span>
              <input type="text" inputMode="decimal" value={r.time} onChange={(event) => set(shown, { time: event.target.value })} placeholder="örneğin 48,6" className={`${input} mt-1`} />
            </label>
          ) : null}
          {r.status === 'dnf' ? (
            <label className="block">
              <span className="font-semibold text-slate-900 dark:text-white">İlerleme: %{number(r.progress * 100)}</span>
              <span className="block text-slate-500 dark:text-slate-400">{number((r.progress * track.length) / 100, 2)} m / {number(track.length / 100, 2)} m</span>
              <input type="range" min="0" max="0.999" step="0.001" value={r.progress} onChange={(event) => set(shown, { progress: Number(event.target.value) })} className="mt-2 w-full accent-teal-700" />
            </label>
          ) : null}
          <div className="border-t border-slate-200 pt-3 dark:border-white/10">
            <p className="text-slate-500 dark:text-slate-400">{scores[shown].note}</p>
            <p className="font-heading text-2xl text-slate-900 dark:text-white">{scores[shown].value === null ? '—' : `${number(scores[shown].value)} sn`}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-slate-800 pt-3 dark:border-white/40">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {TRACKS.map(({ id, name }) => `${name} ${scores[id].value === null ? '—' : number(scores[id].value)}`).join(' + ')}
        </p>
        <p className="font-heading text-2xl text-slate-900 dark:text-white">Toplam: {complete ? `${number(total)} sn` : '—'}</p>
      </div>
    </div>
  )
}
