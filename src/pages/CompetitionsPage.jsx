import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { competitionHighlights } from '../utils/siteData'

export default function CompetitionsPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200">Gecmis Basarilar</p>
        <h1 className="mt-2 font-heading text-3xl text-white sm:text-4xl">Basarilar</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Yarisma ve teknik programlardan elde edilen ciktilar bu sayfada arsivlenir.
        </p>
      </header>

      <div className="grid gap-4">
        {competitionHighlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/35 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-100">
                <Trophy size={14} />
                {item.year}
              </div>
              <span className="rounded-full border border-amber-300/35 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                {item.result}
              </span>
            </div>
            <h2 className="mt-3 font-heading text-2xl text-white">{item.title}</h2>
            <p className="mt-2 text-slate-300">{item.detail}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
