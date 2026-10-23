import { Cable, Code2, KeyRound, Loader2, Lock, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { getAnswer, hasAnswer, seemsOpen, unlock, useLockState } from './answers'

const button =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-teal-600 hover:text-teal-800 disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:border-teal-300 dark:hover:text-teal-200'

// "Show the code" / "show the wiring" for the current exercise. A locked
// week asks for its code first.
export default function AnswerBar({ example, onShowCode, onShowWires, onReset, className = 'mt-3 space-y-2' }) {
  const [asking, setAsking] = useState(null) // the action waiting for a code
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState({})
  const state = useLockState()
  const open = seemsOpen(example, state) || unlocked[example.week]
  // Blink uses the on-board LED: nothing to wire.
  const wired = example.mode === 'car' || example.circuit.parts.length > 0

  const reveal = async (action) => {
    setBusy(true)
    setError('')
    let answer = null
    try {
      answer = await getAnswer(example)
    } catch (failure) {
      setBusy(false)
      setError(failure.message)
      return
    }
    setBusy(false)
    if (!answer) {
      setAsking(action)
      return
    }
    setUnlocked((current) => ({ ...current, [example.week]: true }))
    setAsking(null)
    if (action === 'code') onShowCode(answer)
    else onShowWires(answer)
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    const ok = await unlock(example, code)
    setBusy(false)
    if (!ok) {
      setError('Kod yanlış. Kodu eğitmeninizden alabilirsiniz.')
      return
    }
    setCode('')
    reveal(asking)
  }

  const icon = (shown) => (busy ? <Loader2 size={15} className="animate-spin" /> : open ? shown : <Lock size={14} />)
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {hasAnswer(example, state) ? (
          <>
            <button type="button" disabled={busy} onClick={() => reveal('code')} className={button}>
              {icon(<Code2 size={15} />)}
              Kodu göster
            </button>
            {wired ? (
              <button type="button" disabled={busy} onClick={() => reveal('wires')} className={button}>
                {icon(<Cable size={15} />)}
                Bağlantıları göster
              </button>
            ) : null}
          </>
        ) : null}
        <button type="button" onClick={onReset} className={button}>
          <RotateCcw size={14} />
          Baştan başla
        </button>
      </div>
      {error && !asking ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {asking ? (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
          <KeyRound size={15} />
          <span>Bu cevap kilitli. Uygulamanın, {example.week === 5 ? 'yarışma haftasının' : `${example.week}. haftanın`} ya da tüm uygulamaların kodunu girin:</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-label="Kilit kodu"
            className="font-code w-40 rounded-md border border-amber-300 bg-white px-2 py-1 uppercase text-slate-900 dark:border-amber-300/40 dark:bg-[#0b1517] dark:text-slate-100"
          />
          <button type="submit" disabled={busy || !code.trim()} className="rounded-md bg-amber-600 px-3 py-1 font-semibold text-white disabled:opacity-60">
            Aç
          </button>
          <button type="button" onClick={() => setAsking(null)} className="text-amber-800 underline dark:text-amber-200">
            vazgeç
          </button>
          {error ? <span className="w-full text-rose-700 dark:text-rose-300">{error}</span> : null}
        </form>
      ) : null}
    </div>
  )
}
