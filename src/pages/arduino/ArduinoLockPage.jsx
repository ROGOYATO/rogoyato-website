import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, LockOpen, Maximize2, RefreshCw, Unlock, Lock, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { create, describe, publish, readLatest, save } from '../../utils/lockStore'
import { readList, recoverList, renewExercise, renewWeek, sealList, setOpen } from '../../utils/lockState'
import { suggestPassphrase } from '../../utils/passphrase'
import { loadState } from './simulator/answers'
import store from './simulator/answers/store.json'
import { Breadcrumb, Label, Panel } from './ArduinoParts'

const weekName = (week) => (Number(week) === 5 ? 'Yarışma' : `${week}. hafta`)
const MASK = '••••-••••-••••'
const TOKEN_KEY = 'rogoyato-kilit-anahtar'
const configured = Boolean(store.gist || store.repo)
const MISSING = 'Kilit verisi depoda henüz yok; önce aşağıdan “Depoya yükle” ile ilk kurulumu yapın.'
const SPREAD = store.deploy ? 'Site yeniden yayınlanıyor; öğrencilere 1–2 dakika içinde yansır.' : 'Öğrencilere en geç 5 dakika içinde yansır.'
const input =
  'font-code min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100 sm:max-w-sm'
const primary = 'inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60 dark:bg-teal-400 dark:text-teal-950'
const small =
  'inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:border-teal-600 hover:text-teal-800 disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:hover:text-teal-200'

function storedToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

// A code that stays hidden until clicked, so the list can be on a projector,
// with the trainers' actions next to it.
function CodeCell({ id, code, shown, isOpen, canEdit, busy, onToggle, onProject, onRenew, onOpen }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  const icon = 'rounded-md p-1.5 text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300'
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-label={shown ? 'Kodu gizle' : 'Kodu göster'}
        className={`font-code inline-flex items-center gap-2 rounded-md border px-3 py-1.5 tracking-wider transition ${shown ? 'border-teal-600 bg-teal-50 text-xl font-semibold text-teal-900 dark:border-teal-300/60 dark:bg-teal-400/10 dark:text-teal-100' : 'border-slate-300 text-slate-400 hover:border-teal-600 dark:border-white/15 dark:text-slate-500'}`}
      >
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
        {shown ? code : MASK}
      </button>
      <button type="button" onClick={() => onProject(id)} title="Tahtaya yansıt" aria-label="Tahtaya yansıt" className={icon}>
        <Maximize2 size={16} />
      </button>
      <button type="button" onClick={copy} title="Kopyala" aria-label="Kopyala" className={icon}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <button type="button" onClick={() => onRenew(id)} disabled={!canEdit || busy} title="Yeni kod üret; eskisi geçersiz olur" className={small}>
        {busy === `renew:${id}` ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        Yenile
      </button>
      <button type="button" onClick={() => onOpen(id, !isOpen)} disabled={!canEdit || busy} className={small}>
        {busy === `open:${id}` ? <Loader2 size={13} className="animate-spin" /> : isOpen ? <Lock size={13} /> : <Unlock size={13} />}
        {isOpen ? 'Kilitle' : 'Herkese aç'}
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
// read the unlock codes, renew them and open answers for everyone. Saving
// needs a GitHub token allowed to edit the lock state (gist or data repo);
// it stays in this browser only if asked. Passwords are never stored.
export default function ArduinoLockPage() {
  const [lock, setLock] = useState(null)
  const [password, setPassword] = useState('')
  const [pagePassword, setPagePassword] = useState(null)
  const [list, setList] = useState(null)
  const [phase, setPhase] = useState('login') // login | recover | ready
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(null)
  const [shown, setShown] = useState({})
  const [projected, setProjected] = useState(null)
  const [token, setToken] = useState(storedToken)
  const [rememberToken, setRememberToken] = useState(Boolean(storedToken()))
  const [master, setMaster] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [target, setTarget] = useState({ kind: 'gist', owner: 'ROGOYATO', name: 'kilit-verisi', branch: 'main', path: 'kilit.json' })
  const [created, setCreated] = useState(null)
  const canEdit = configured && Boolean(token)

  useEffect(() => {
    loadState().then(setLock, (error) => setMessage({ error: error.message }))
  }, [])

  useEffect(() => {
    if (!projected) return undefined
    const close = (event) => event.key === 'Escape' && setProjected(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [projected])

  useEffect(() => {
    try {
      if (rememberToken && token) window.localStorage.setItem(TOKEN_KEY, token)
      else window.localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Not remembering is fine.
    }
  }, [token, rememberToken])

  const login = async (event) => {
    event.preventDefault()
    setWorking(true)
    setMessage(null)
    // With a key, the saved state: the site's copy can be a deploy behind.
    const state = (canEdit && (await readLatest(store, token).catch(() => null))) || lock
    const value = state ? await readList(state, password) : null
    setWorking(false)
    if (!value) {
      setMessage({ error: 'Şifre yanlış.' })
      return
    }
    setLock(state)
    setList(value)
    setPagePassword(password)
    setPassword('')
    setShown({})
    setPhase('ready')
  }

  // With the master password: show the codes and set a new page password.
  const recover = async (event) => {
    event.preventDefault()
    setWorking(true)
    setMessage(null)
    try {
      const latest = canEdit ? await readLatest(store, token) : null
      if (canEdit && !latest) throw new Error(MISSING)
      const value = await recoverList(latest ?? lock, master)
      if (!value) throw new Error('Ana şifre yanlış.')
      if (canEdit) {
        const next = await sealList(latest, value, newPassword)
        await save(store, token, next, 'Sayfa şifresini yenile')
        await publish(store, token)
        setLock(next)
        setMessage({ ok: `Yeni sayfa şifresi kaydedildi. ${SPREAD}` })
      } else {
        setMessage({ error: 'Kodlar gösteriliyor ama yeni sayfa şifresi kaydedilmedi: GitHub anahtarı gerekli.' })
      }
      setList(value)
      setPagePassword(newPassword)
      setMaster('')
      setNewPassword('')
      setPhase('ready')
    } catch (error) {
      setMessage({ error: error.message })
    } finally {
      setWorking(false)
    }
  }

  // Every change starts from the newest saved state, so two trainers do not
  // overwrite each other.
  const act = async (key, change, done) => {
    setBusy(key)
    setMessage(null)
    try {
      const latest = await readLatest(store, token)
      if (!latest) throw new Error(MISSING)
      const latestList = await readList(latest, pagePassword)
      if (!latestList) throw new Error('Kayıttaki sayfa şifresi değişmiş; sayfayı yenileyip yeni şifreyle girin.')
      const result = await change(latest, latestList)
      await save(store, token, result.state, done)
      await publish(store, token)
      setLock(result.state)
      setList(result.list)
      setMessage({ ok: `${done}. ${SPREAD}` })
      return true
    } catch (error) {
      setMessage({ error: error.message })
      return false
    } finally {
      setBusy(null)
    }
  }

  const renew = (id) => {
    const label = id.startsWith('hafta-') ? `${weekName(id.slice(6))} kodu` : `${list.exercises.find((item) => item.id === id).title} kodu`
    if (!window.confirm(`${label} yenilensin mi? Eski kodu girmiş öğrencilerde cevap yeniden kilitlenir.`)) return
    act(
      `renew:${id}`,
      (latest, latestList) => (id.startsWith('hafta-') ? renewWeek(latest, latestList, id.slice(6), pagePassword) : renewExercise(latest, latestList, id, pagePassword)),
      `${label} yenilendi`,
    )
  }

  const openFor = (id, isOpen) => {
    const [kind, key] = id.startsWith('hafta-') ? ['weeks', id.slice(6)] : ['exercises', id]
    const label = kind === 'weeks' ? weekName(key) : list.exercises.find((item) => item.id === key).title
    act(`open:${id}`, async (latest, latestList) => ({ state: setOpen(latest, latestList, kind, key, isOpen), list: latestList }), `${label} ${isOpen ? 'herkese açıldı' : 'yeniden kilitlendi'}`)
  }

  const changePassword = async (event) => {
    event.preventDefault()
    const next = newPassword
    const ok = await act('password', async (latest, latestList) => ({ state: await sealList(latest, latestList, next), list: latestList }), 'Sayfa şifresi değiştirildi')
    if (ok) {
      setPagePassword(next)
      setNewPassword('')
    }
  }

  const setup = async (event) => {
    event.preventDefault()
    setWorking(true)
    setMessage(null)
    try {
      const where = target.kind === 'gist' ? {} : { repo: { owner: target.owner, name: target.name, branch: target.branch, path: target.path } }
      setCreated(await create(token, where, lock))
    } catch (error) {
      setMessage({ error: error.message })
    } finally {
      setWorking(false)
    }
  }

  // First upload into the configured data repository.
  const upload = async () => {
    setBusy('upload')
    setMessage(null)
    try {
      if (await readLatest(store, token)) throw new Error('Kilit verisi depoda zaten var.')
      await create(token, store, lock)
      await publish(store, token)
      setMessage({ ok: `Kilit verisi ${describe(store)} içine yüklendi. ${SPREAD}` })
    } catch (error) {
      setMessage({ error: error.message })
    } finally {
      setBusy(null)
    }
  }

  const toggle = (id) => setShown((current) => ({ ...current, [id]: !current[id] }))
  const open = lock?.open ?? { weeks: {}, exercises: {} }
  const entries = list
    ? Object.entries(list.weeks).map(([week, code]) => ({ week, code, exercises: list.exercises.filter((item) => String(item.week) === week) }))
    : []
  const lookup = (id) => {
    if (id.startsWith('hafta-')) return { title: `${weekName(id.slice(6))}: tüm uygulamalar`, code: list.weeks[id.slice(6)] }
    const item = list.exercises.find((exercise) => exercise.id === id)
    return { title: item.title, code: item.code }
  }
  const cell = (id, code, isOpen) => (
    <CodeCell id={id} code={code} shown={shown[id]} isOpen={isOpen} canEdit={canEdit} busy={busy} onToggle={toggle} onProject={setProjected} onRenew={renew} onOpen={openFor} />
  )
  const suggest = (
    <button type="button" onClick={() => setNewPassword(suggestPassphrase())} className="text-sm text-slate-500 underline hover:text-teal-700 dark:text-slate-400">
      öner
    </button>
  )

  return (
    <div className="space-y-6">
      <Breadcrumb current="Kilit kodları" />
      <div>
        <Label>Eğitmenler için</Label>
        <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">Simülatör kilit kodları</h1>
        <p className="mt-2 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-300">
          Sayfa şifresini girince kodlar gelir; her kod tıklanana kadar gizli kalır. Bir uygulamanın kodu yalnızca o uygulamanın, haftanın kodu o haftadaki tüm
          uygulamaların “Kodu göster” ve “Bağlantıları göster” butonlarını açar. Buradan her kodu yenileyebilir, cevapları herkese açıp kilitleyebilirsiniz.
        </p>
      </div>

      {phase === 'login' ? (
        <Panel>
          <form onSubmit={login} className="flex flex-wrap items-center gap-2">
            <KeyRound size={18} className="text-teal-700 dark:text-teal-300" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sayfa şifresi" autoComplete="current-password" aria-label="Sayfa şifresi" className={input} />
            <button type="submit" disabled={!password || working || !lock} className={primary}>
              {working ? <Loader2 size={16} className="animate-spin" /> : <LockOpen size={16} />}
              Aç
            </button>
            <button type="button" onClick={() => setPhase('recover')} className="text-sm text-slate-500 underline hover:text-teal-700 dark:text-slate-400">
              şifremi unuttum
            </button>
          </form>
        </Panel>
      ) : null}

      {phase === 'recover' ? (
        <Panel>
          <Label>Ana şifreyle kurtarma</Label>
          <form onSubmit={recover} className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input type="password" value={master} onChange={(event) => setMaster(event.target.value)} placeholder="Ana şifre" aria-label="Ana şifre" className={input} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Yeni sayfa şifresi" aria-label="Yeni sayfa şifresi" className={input} />
              {suggest}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={!master || newPassword.length < 12 || working} className={primary}>
                {working ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Kurtar
              </button>
              <button type="button" onClick={() => setPhase('login')} className="text-sm text-slate-500 underline dark:text-slate-400">
                vazgeç
              </button>
            </div>
            {configured ? (
              <div className="flex flex-wrap items-center gap-2">
                <input type="password" value={token} onChange={(event) => setToken(event.target.value.trim())} placeholder="GitHub anahtarı (kaydetmek için)" aria-label="GitHub anahtarı" className={input} />
              </div>
            ) : null}
          </form>
        </Panel>
      ) : null}

      {message ? (
        <p className={`rounded-md px-3 py-2 text-sm ${message.error ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'}`}>
          {message.error ?? message.ok}
        </p>
      ) : null}

      {phase === 'ready' ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setShown({})} className="text-sm text-slate-500 underline hover:text-teal-700 dark:text-slate-400">
            hepsini gizle
          </button>
          {!canEdit ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {configured ? 'Kod yenilemek ve herkese açmak için aşağıya GitHub anahtarını girin.' : 'Kod yenilemek ve herkese açmak için önce aşağıdaki kurulumu yapın.'}
            </span>
          ) : null}
        </div>
      ) : null}

      {entries.map(({ week, code, exercises }) => (
        <Panel key={week}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">{weekName(week)}</h2>
              <Badge isOpen={Boolean(open.weeks[week])} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Haftanın kodu (tüm uygulamalar)</span>
              {cell(`hafta-${week}`, code, Boolean(open.weeks[week]))}
            </div>
          </div>
          <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200 dark:divide-white/10 dark:border-white/10">
            {exercises.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  {item.title}
                  <span className="font-code text-xs text-slate-400 dark:text-slate-500">{item.id}</span>
                  {open.exercises[item.id] ? <Badge isOpen /> : null}
                </span>
                {cell(item.id, item.code, Boolean(open.exercises[item.id]))}
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      {phase === 'ready' ? (
        <>
          <Panel>
            <Label>GitHub anahtarı</Label>
            {store.private ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Değişiklikler gizli <code className="font-code">{describe(store)}</code> deposuna kaydedilir ve site yeniden yayınlanır. Anahtar:{' '}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="underline">
                  fine-grained token
                </a>
                , Resource owner <b>{store.repo.owner}</b>, depolar <b>{store.repo.name}</b> ve <b>{store.deploy.name}</b>, izinler <b>Contents: Read and write</b> ve{' '}
                <b>Actions: Read and write</b>.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Değişiklikler {configured ? <code className="font-code">{describe(store)}</code> : 'kilit verisine'} kaydedilir. Gist için{' '}
                <a href="https://github.com/settings/tokens/new?scopes=gist&description=ROGOYATO%20kilit" target="_blank" rel="noreferrer" className="underline">
                  “gist” izinli bir anahtar
                </a>
                , veri deposu için yalnızca o depoda “Contents: Read and write” izinli bir anahtar yeterli.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input type="password" value={token} onChange={(event) => setToken(event.target.value.trim())} placeholder="ghp_… / github_pat_…" aria-label="GitHub anahtarı" className={input} />
              <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={rememberToken} onChange={(event) => setRememberToken(event.target.checked)} className="accent-teal-600" />
                bu cihazda hatırla
              </label>
              {configured && store.repo ? (
                <button type="button" onClick={upload} disabled={!token || busy} className={small}>
                  {busy === 'upload' ? <Loader2 size={13} className="animate-spin" /> : null}
                  Depoya yükle (ilk kurulum)
                </button>
              ) : null}
            </div>
          </Panel>

          {configured ? (
            <Panel>
              <Label>Sayfa şifresini değiştir</Label>
              <form onSubmit={changePassword} className="mt-3 flex flex-wrap items-center gap-2">
                <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Yeni sayfa şifresi" aria-label="Yeni sayfa şifresi" className={input} />
                {suggest}
                <button type="submit" disabled={!canEdit || newPassword.length < 12 || busy} className={primary}>
                  Kaydet
                </button>
              </form>
            </Panel>
          ) : (
            <Panel>
              <Label>İlk kurulum</Label>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Kilit verisi şu an sitenin içinde; yenilemek ve herkese açmak için bir kez dışarıya taşınması gerekir. Gist kişisel hesapta açılır (organizasyonların
                gist’i olmaz); veri deposu organizasyonda önceden boş olarak oluşturulmalıdır.
              </p>
              <form onSubmit={setup} className="mt-3 space-y-2 text-sm">
                <div className="flex flex-wrap gap-4 text-slate-700 dark:text-slate-200">
                  {[
                    ['gist', 'Gist (anahtarın sahibinin hesabında)'],
                    ['repo', 'Veri deposu'],
                  ].map(([kind, text]) => (
                    <label key={kind} className="flex items-center gap-1.5">
                      <input type="radio" name="kind" checked={target.kind === kind} onChange={() => setTarget({ ...target, kind })} className="accent-teal-600" />
                      {text}
                    </label>
                  ))}
                </div>
                {target.kind === 'repo' ? (
                  <div className="flex flex-wrap gap-2">
                    {['owner', 'name', 'branch', 'path'].map((field) => (
                      <input key={field} value={target[field]} onChange={(event) => setTarget({ ...target, [field]: event.target.value })} aria-label={field} className="font-code w-40 rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-white/15 dark:bg-[#0b1517] dark:text-slate-100" />
                    ))}
                  </div>
                ) : null}
                <button type="submit" disabled={!token || working} className={primary}>
                  {working ? <Loader2 size={16} className="animate-spin" /> : null}
                  Oluştur
                </button>
              </form>
              {created ? (
                <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                  <p>Oluşturuldu. Son adım: bu satırı Claude’a gönderin; sitenin ayarına (answers/store.json) bir kez yazılacak.</p>
                  <pre className="font-code mt-2 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-teal-100">{JSON.stringify(created)}</pre>
                </div>
              ) : null}
            </Panel>
          )}
        </>
      ) : null}

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
