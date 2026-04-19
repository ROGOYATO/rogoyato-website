import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import PageTitleHero from '../components/PageTitleHero'
import { competitionHighlights } from '../utils/siteData'
import achievementsHeroImage from '../../ornekbutonarkaplan.png'

const publicBase = import.meta.env.BASE_URL
const achievementVisuals = ['nav-achievements.svg', 'nav-events.svg', 'nav-about.svg']

export default function CompetitionsPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Başarılar" imageSrc={achievementsHeroImage} />

      {competitionHighlights.length === 0 ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 text-slate-600 dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300 sm:p-8">
          Başarı arşivi gerçek verilerle güncelleniyor. Yeni sonuçları bu alanda paylaşacağız.
        </article>
      ) : (
        <div className="grid gap-4">
          {competitionHighlights.map((item, index) => {
          const visual = `${publicBase}${achievementVisuals[index % achievementVisuals.length]}`

          return (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-zinc-900/70"
            >
              <div className="flex flex-col sm:min-h-[320px] sm:flex-row">
                <div className="relative h-52 sm:h-auto sm:w-1/3">
                  <img src={visual} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/55 via-zinc-900/20 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-6 sm:w-2/3 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/45 bg-fuchsia-400/15 px-3 py-1 text-xs text-fuchsia-700 dark:border-fuchsia-300/35 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
                      <Trophy size={14} />
                      {item.year}
                    </div>
                    <span className="rounded-full border border-amber-300/55 bg-amber-300/20 px-3 py-1 text-xs text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/10 dark:text-amber-100">
                      {item.result}
                    </span>
                  </div>

                  <h2 className="mt-4 font-heading text-3xl text-slate-900 dark:text-white">{item.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
                </div>
              </div>
            </article>
          )
          })}
        </div>
      )}
    </motion.section>
  )
}
