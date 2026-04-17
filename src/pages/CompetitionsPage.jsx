import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import PageTitleHero from '../components/PageTitleHero'
import { competitionHighlights } from '../utils/siteData'

export default function CompetitionsPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Başarılar" />

      <div className="grid gap-4">
        {competitionHighlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-zinc-900/65">
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
