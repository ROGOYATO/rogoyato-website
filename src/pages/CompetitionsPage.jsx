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
      <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-200">Gecmis Basarilar</p>
        <h1 className="mt-2 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">Başarılar</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
          Yarisma ve teknik programlardan elde edilen ciktilar bu sayfada arsivlenir.
        </p>
      </header>

      <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {competitionHighlights.map((item) => (
          <article key={item.title} className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/45 bg-fuchsia-400/15 px-3 py-1 text-xs text-fuchsia-700 dark:border-fuchsia-300/35 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
                <Trophy size={14} />
                {item.year}
              </div>
              <span className="rounded-full border border-amber-300/55 bg-amber-300/20 px-3 py-1 text-xs text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/10 dark:text-amber-100">
                {item.result}
              </span>
            </div>
            <h2 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{item.detail}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
