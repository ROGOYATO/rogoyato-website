import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, LockOpen, Maximize2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { openForPage } from '../../utils/answerLock'
import open from './simulator/answers/open.json'
import page from './simulator/answers/page.json'
import { Breadcrumb, Label, Panel } from './ArduinoParts'

const weekName = (week) => (Number(week) === 5 ? 'Yarışma' : `${week}. hafta`)
const MASK = '••••-••••-••••'

// A code that stays hidden until clicked, so the list can be on a projector.
function CodeCell({ id, code, shown, onToggle, onProject }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-label={shown ? 'Kodu gizle' : 'Kodu göster'}
        className={`font-code inline-flex items-center gap-2 rounded-md border px-3 py-1.5 tracking-wider transition ${shown ? 'border-teal-600 bg-teal-50 text-xl font-semibold text-teal-900 dark:border-teal-300/60 dark:bg-teal-400/10 dark:text-teal-100' : 'border-slate-300 text-slate-400 hover:border-teal-600 dark:border-white/15 dark:text-slate-500'}`}
      >
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
        {shown ? code : MASK}
      </button>
      <button type="button" onClick={() => onProject(id)} title="Tahtaya yansıt" aria-label="Tahtaya yansıt" className="rounded-md p-1.5 text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300">
        <Maximize2 size={16} />
      </button>
      <button type="button" onClick={copy} title="Kopyala" aria-label="Kopyala" className="rounded-md p-1.5 text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  )
}

const Badge = ({ isOpen }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs ${isOpen ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
    {isOpen ? 'herkese açık' : 'kilitli'}
  </span>
)

// Not linked from anywhere: the trainers open it with the page password to
// read the unlock codes. The password is never stored or sent.
export default function ArduinoLockPage() {
  const [password, setPassword] = useState('')
  const [list, setList] = useState(null)
  const [state, setState] = useState('idle')
  const [shown, setShown] = useState({})
  const [projected, setProjected] = useState(null)

  useEffect(() => {
    if (!projected) return undefined
    const close = (event) => event.key === 'Escape' && setProjected(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [projected])

  const submit = async (event) => {
    event.preventDefault()
    setState('working')
    const value = await openForPage(password, page)
    setState(value ? 'idle' : 'wrong')
    setList(value)
    setShown({})
  }

  const toggle = (id) => setShown((current) => ({ ...current, [id]: !current[id] }))
  const entries = list
    ? Object.entries(list.weeks).map(([week, code]) => ({
        week,
        code,
        exercises: list.exercises.filter((item) => String(item.week) === week),
      }))
    : []
  const lookup = (id) => {
    if (id.startsWith('hafta-')) {
      const week = id.slice(6)
      return { title: `${weekName(week)}: tüm uygulamalar`, code: list.weeks[week] }
    }
    const item = list.exercises.find((exercise) => exercise.id === id)
    return { title: item.title, code: item.code }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb current="Kilit kodları" />
      <div>
        <Label>Eğitmenler için</Label>
        <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">Simülatör kilit kodları</h1>
        <p className="mt-2 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-300">
          Sayfa şifresini girince kodlar gelir; her kod tıklanana kadar gizli kalır. Bir uygulamanın kodu yalnızca o uygulamanın, haftanın kodu o haftadaki tüm
          uygulamaların “Kodu göster” ve “Bağlantıları göster” butonlarını açar. Şifre hiçbir yere gönderilmez ve kaydedilmez.
        </p>
      </div>

      <Panel>
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <KeyRound size={18} className="text-teal-700 dark:text-teal-300" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sayfa şifresi"
            autoComplete="current-password"
            aria-label="Sayfa şifresi"
            className="font-code min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100 sm:max-w-sm"
          />
          <button type="submit" disabled={!password || state === 'working'} className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60 dark:bg-teal-400 dark:text-teal-950">
            {state === 'working' ? <Loader2 size={16} className="animate-spin" /> : <LockOpen size={16} />}
            Aç
          </button>
          {list ? (
            <button type="button" onClick={() => setShown({})} className="text-sm text-slate-500 underline hover:text-teal-700 dark:text-slate-400">
              hepsini gizle
            </button>
          ) : null}
          {state === 'wrong' ? <p className="w-full text-sm text-rose-700 dark:text-rose-300">Şifre yanlış.</p> : null}
        </form>
      </Panel>

      {entries.map(({ week, code, exercises }) => (
        <Panel key={week}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">{weekName(week)}</h2>
              <Badge isOpen={Boolean(open.weeks[week])} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Haftanın kodu (tüm uygulamalar)</span>
              <CodeCell id={`hafta-${week}`} code={code} shown={shown[`hafta-${week}`]} onToggle={toggle} onProject={setProjected} />
            </div>
          </div>
          {exercises.length ? (
            <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200 dark:divide-white/10 dark:border-white/10">
              {exercises.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    {item.title}
                    <span className="font-code text-xs text-slate-400 dark:text-slate-500">{item.id}</span>
                    {open.exercises[item.id] ? <Badge isOpen /> : null}
                  </span>
                  <CodeCell id={item.id} code={item.code} shown={shown[item.id]} onToggle={toggle} onProject={setProjected} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Bu haftada kilitli uygulama yok.</p>
          )}
        </Panel>
      ))}

      <Panel>
        <Label>Herkese açmak</Label>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Kodu sitenin deposundaki <code className="font-code">src/pages/arduino/simulator/answers/open.json</code> dosyasına eklemek yeterli: haftanın kodu{' '}
          <code className="font-code">weeks</code> altına hafta numarasıyla (yarışma 5), bir uygulamanın kodu <code className="font-code">exercises</code> altına
          uygulamanın adıyla (listede kodun yanında yazar). Site yeniden yayınlanınca herkes için açılır; geri kilitlemek için satırı silin.
        </p>
        <pre className="font-code mt-3 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs leading-relaxed text-teal-100">
          {`{
  "weeks": {
    "2": "XXXX-XXXX-XXXX"
  },
  "exercises": {
    "dht11": "XXXX-XXXX-XXXX"
  }
}`}
        </pre>
      </Panel>

      {projected && list ? (
        <button
          type="button"
          onClick={() => setProjected(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-white"
        >
          <X size={28} className="absolute right-6 top-6 text-slate-400" />
          <span className="font-hero text-3xl font-bold sm:text-5xl">{lookup(projected).title}</span>
          <span className="font-code break-all text-5xl font-bold tracking-[0.12em] text-teal-300 sm:text-8xl">{lookup(projected).code}</span>
          <span className="text-sm text-slate-400">Kapatmak için tıklayın ya da Esc’ye basın</span>
        </button>
      ) : null}
    </div>
  )
}
