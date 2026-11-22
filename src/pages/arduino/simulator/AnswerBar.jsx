import { Cable, Code2, RotateCcw } from 'lucide-react'
import { getAnswer } from './answers'

const button =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-teal-600 hover:text-teal-800 disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:border-teal-300 dark:hover:text-teal-200'

// "Show the code" / "show the wiring" for the current exercise, as far as
// its answer has them.
export default function AnswerBar({ example, onShowCode, onShowWires, onReset, className = 'mt-3 space-y-2' }) {
  const answer = getAnswer(example)
  // Blink uses the on-board LED: nothing to wire.
  const wired = example.mode === 'car' || example.circuit.parts.length > 0
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {answer?.code ? (
          <button type="button" onClick={() => onShowCode(answer)} className={button}>
            <Code2 size={15} />
            Kodu göster
          </button>
        ) : null}
        {answer?.wires && wired ? (
          <button type="button" onClick={() => onShowWires(answer)} className={button}>
            <Cable size={15} />
            Bağlantıları göster
          </button>
        ) : null}
        <button type="button" onClick={onReset} className={button}>
          <RotateCcw size={14} />
          Baştan başla
        </button>
      </div>
    </div>
  )
}
