import { useEffect, useMemo, useState } from 'react'
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
const ATTEMPTS = 3
const STORAGE_KEY = 'cizgi-izleyen-robot-puanlar'
const emptyAttempt = () => ({ status: '', time: '', progress: 0.5 })
const newRobot = (name) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, ranked: true, results: Object.fromEntries(TRACKS.map(({ id }) => [id, Array.from({ length: ATTEMPTS }, emptyAttempt)])) })

// The day's sheet is kept in this browser, so a reload loses nothing.
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved?.robots)) return saved.robots
  } catch {
    // no storage: the sheet lasts for this visit
  }
  return []
}

// One attempt's score: its time if finished within the limit, limit +
// limit × (1 − progress) if not, null while it is not entered (or invalid).
function attemptScore(attempt, limit) {
  if (attempt.status === 'dnf') return { value: limit + limit * (1 - attempt.progress), text: `bitiremedi, %${number(attempt.progress * 100)}` }
  if (attempt.status !== 'finished') return null
  const time = Number(String(attempt.time).replace(',', '.'))
  if (!attempt.time || !(time > 0) || time > limit) return null
  return { value: time, text: `bitirdi, ${number(time)} sn` }
}

// A track's score is its best attempt: any finish beats any non-finish, the
// shorter finish and the farther non-finish win, which is the smallest
// score. No attempt counts twice the limit.
function trackScore(attempts, limit) {
  const scores = attempts.map((attempt) => attemptScore(attempt, limit)).filter(Boolean)
  if (!scores.length) return { value: 2 * limit, text: 'deneme yok', best: -1 }
  const best = scores.reduce((a, b) => (b.value < a.value ? b : a))
  return { ...best, best: attempts.findIndex((attempt) => attemptScore(attempt, limit)?.value === best.value) }
}

// The day's score sheet: robots by name, three attempts on each track, the
// best attempt of each track and the ranking by total.
export default function ScoreCalculator({ limit }) {
  const [robots, setRobots] = useState(load)
  const [selected, setSelected] = useState(() => robots[0]?.id ?? null)
  const [trackId, setTrackId] = useState(TRACKS[0].id)
  const [attemptIndex, setAttemptIndex] = useState(0)
  const [name, setName] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ robots }))
    } catch {
      // no storage
    }
  }, [robots])

  const robot = robots.find(({ id }) => id === selected) ?? null
  const track = TRACKS.find(({ id }) => id === trackId)
  const attempt = robot?.results[trackId][attemptIndex]

  const add = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const robot = newRobot(trimmed)
    setRobots((all) => [...all, robot])
    setSelected(robot.id)
    setAttemptIndex(0)
    setName('')
  }
  const remove = (id) => {
    const robot = robots.find((r) => r.id === id)
    if (!window.confirm(`${robot.name} ve bütün denemeleri silinsin mi?`)) return
    const rest = robots.filter((r) => r.id !== id)
    setRobots(rest)
    if (selected === id) setSelected(rest[0]?.id ?? null)
  }
  const toggleRanked = (id) => setRobots((all) => all.map((r) => (r.id === id ? { ...r, ranked: r.ranked === false } : r)))
  const setAttempt = (change) =>
    setRobots((all) =>
      all.map((r) => (r.id !== selected ? r : { ...r, results: { ...r.results, [trackId]: r.results[trackId].map((a, i) => (i === attemptIndex ? { ...a, ...change } : a)) } })),
    )

  const ranking = useMemo(
    () =>
      robots
        .map((r) => {
          const tracks = Object.fromEntries(TRACKS.map(({ id }) => [id, trackScore(r.results[id], limit)]))
          return { robot: r, tracks, total: Object.values(tracks).reduce((sum, { value }) => sum + value, 0) }
        })
        // ranked robots by total, then those left out of the ranking
        .sort((a, b) => (a.robot.ranked === false) - (b.robot.ranked === false) || a.total - b.total),
    [robots, limit],
  )

  const time = Number(String(attempt?.time ?? '').replace(',', '.'))
  const overLimit = attempt?.status === 'finished' && time > limit

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Robotları adıyla ekle; her robot için her parkurdaki üç denemeyi gir. Bitiren denemenin süresini yaz; bitiremeyen denemede robotun çizgiden ayrıldığı ilk noktayı parkur çiziminde işaretle (atladıysa atladığı yer). Her parkurda en iyi deneme sayılır, sıralama tablosu en altta kendiliğinden oluşur; “Sıralamada” işareti kaldırılan robot (örneğin deneme ya da gösteri robotu) sıralamaya girmez. Girilenler bu tarayıcıda saklanır.
      </p>

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Robot ya da takım adı" aria-label="Robot ya da takım adı" className={`${input} max-w-xs flex-1`} />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
          Robot ekle
        </button>
      </form>

      {robots.length ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Robot">
          {robots.map((r) => (
            <span key={r.id} className={`inline-flex items-center rounded-md border text-sm ${r.id === selected ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-300 text-slate-700 dark:border-white/15 dark:text-slate-200'}`}>
              <button type="button" role="tab" aria-selected={r.id === selected} onClick={() => setSelected(r.id)} className="px-3 py-1.5 font-semibold">
                {r.name}
              </button>
              <label className="flex items-center gap-1 border-l border-current/20 px-2 py-1.5 text-xs" title="Sıralamaya dahil">
                <input type="checkbox" checked={r.ranked !== false} onChange={() => toggleRanked(r.id)} aria-label={`${r.name} sıralamaya dahil`} />
                Sıralamada
              </label>
              <button type="button" onClick={() => remove(r.id)} aria-label={`${r.name} robotunu sil`} className="border-l border-current/20 px-2 py-1.5 opacity-70 hover:opacity-100">
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Henüz robot yok; yukarıdan ekle.</p>
      )}

      {robot ? (
        <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-white/10">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Parkur">
            {TRACKS.map(({ id, name }) => {
              const score = trackScore(robot.results[id], limit)
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={id === trackId}
                  onClick={() => setTrackId(id)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${id === trackId ? 'border-teal-700 bg-teal-700 font-semibold text-white dark:border-teal-400 dark:bg-teal-400 dark:text-teal-950' : 'border-slate-300 text-slate-700 dark:border-white/15 dark:text-slate-200'}`}
                >
                  {name} · {number(score.value)} sn
                </button>
              )
            })}
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_17rem]">
            <TrackPicker track={track} progress={attempt.status === 'dnf' ? attempt.progress : attempt.status === 'finished' ? 1 : 0} onPick={(progress) => setAttempt({ status: 'dnf', progress })} />
            <div className="space-y-4 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                {robot.name} · {track.name} ({number(track.length / 100, 2)} m)
              </p>
              <div className="grid grid-cols-3 gap-1" role="tablist" aria-label="Deneme">
                {robot.results[trackId].map((a, i) => {
                  const score = attemptScore(a, limit)
                  const best = trackScore(robot.results[trackId], limit).best === i
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === attemptIndex}
                      onClick={() => setAttemptIndex(i)}
                      className={`rounded-md border px-2 py-1.5 text-left ${i === attemptIndex ? 'border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white' : 'border-slate-300 dark:border-white/15'}`}
                    >
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{i + 1}. deneme{best ? ' ★' : ''}</span>
                      <span className="block font-semibold text-slate-900 dark:text-white">{score ? `${number(score.value)} sn` : '—'}</span>
                    </button>
                  )
                })}
              </div>
              <fieldset className="space-y-1.5">
                <legend className="font-semibold text-slate-900 dark:text-white">{attemptIndex + 1}. deneme</legend>
                {[
                  ['', 'Girilmedi'],
                  ['finished', 'Bitirdi'],
                  ['dnf', 'Bitiremedi'],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <input type="radio" name="deneme-sonucu" checked={attempt.status === value} onChange={() => setAttempt({ status: value })} />
                    {label}
                  </label>
                ))}
              </fieldset>
              {attempt.status === 'finished' ? (
                <label className="block">
                  <span className="font-semibold text-slate-900 dark:text-white">Süre (saniye)</span>
                  <input type="text" inputMode="decimal" value={attempt.time} onChange={(event) => setAttempt({ time: event.target.value })} placeholder="örneğin 48,6" className={`${input} mt-1`} />
                  {overLimit ? <span className="mt-1 block text-rose-700 dark:text-rose-300">{limit} saniyeyi geçen deneme bitmiş sayılmaz; “Bitiremedi” seç.</span> : null}
                </label>
              ) : null}
              {attempt.status === 'dnf' ? (
                <label className="block">
                  <span className="font-semibold text-slate-900 dark:text-white">İlerleme: %{number(attempt.progress * 100)}</span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    {number((attempt.progress * track.length) / 100, 2)} m / {number(track.length / 100, 2)} m · {limit} + {limit} × (1 − {number(attempt.progress, 3)}) = {number(limit + limit * (1 - attempt.progress))} sn
                  </span>
                  <input type="range" min="0" max="0.999" step="0.001" value={attempt.progress} onChange={(event) => setAttempt({ progress: Number(event.target.value) })} className="mt-2 w-full accent-teal-700" />
                </label>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {ranking.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="mb-2 text-left font-semibold text-slate-900 dark:text-white">Sıralama (her parkurda en iyi deneme; deneme yoksa {2 * limit} sn)</caption>
            <thead>
              <tr className="border-b-2 border-slate-800 text-left text-xs uppercase tracking-wider text-slate-600 dark:border-white/40 dark:text-slate-300">
                <th className="px-2 py-2">Sıra</th>
                <th className="px-2 py-2">Robot</th>
                {TRACKS.map(({ id, name }) => (
                  <th key={id} className="px-2 py-2">
                    {name}
                  </th>
                ))}
                <th className="px-2 py-2">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ robot: r, tracks, total }, i) => (
                <tr key={r.id} className={`border-b border-slate-200 align-top dark:border-white/10 ${r.ranked === false ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                  <td className="px-2 py-2 font-semibold">{r.ranked === false ? 'dışı' : `${i + 1}.`}</td>
                  <td className={`px-2 py-2 font-semibold ${r.ranked === false ? '' : 'text-slate-900 dark:text-white'}`}>{r.name}</td>
                  {TRACKS.map(({ id }) => (
                    <td key={id} className="px-2 py-2">
                      {number(tracks[id].value)}
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{tracks[id].text}</span>
                    </td>
                  ))}
                  <td className={`px-2 py-2 font-heading text-base ${r.ranked === false ? '' : 'text-slate-900 dark:text-white'}`}>{number(total)} sn</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
