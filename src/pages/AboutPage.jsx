import { motion } from 'framer-motion'
import PageTitleHero from '../components/PageTitleHero'

export default function AboutPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Hakkımızda" />

      <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 dark:border-white/10 dark:bg-zinc-900/65 sm:p-7">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Topluluk Profili</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          ROGOYATO, robotik ve gömülü yazılım alanında öğrenci gelişimini destekleyen, ekip
          tabanlı üretim kültürünü yaygınlaştıran bir topluluktur.
        </p>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Dönem içinde teknik üretimi önceleyen etkinliklerle üyelerin gerçek proje çıktısı
          almasını hedefler.
        </p>
      </article>

      <article className="rounded-3xl border border-cyan-300/40 bg-cyan-500/10 p-6 dark:border-cyan-300/25 dark:bg-cyan-400/10 sm:p-8">
        <h2 className="font-heading text-2xl text-cyan-800 dark:text-cyan-100">Kurumsal Kimlik</h2>
        <p className="mt-3 text-cyan-900/90 dark:text-cyan-50/90">
          Aşağıdaki alanlar logoların ve kimlik varyasyonlarının yerleşmesi için ayrılmıştır.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-cyan-300/45 bg-white/75 p-4 text-center text-sm text-cyan-800 dark:border-cyan-200/35 dark:bg-zinc-950/45 dark:text-cyan-50/90">
            Ana logo alanı
          </div>
          <div className="rounded-xl border border-cyan-300/45 bg-white/75 p-4 text-center text-sm text-cyan-800 dark:border-cyan-200/35 dark:bg-zinc-950/45 dark:text-cyan-50/90">
            Monogram alanı
          </div>
          <div className="rounded-xl border border-cyan-300/45 bg-white/75 p-4 text-center text-sm text-cyan-800 dark:border-cyan-200/35 dark:bg-zinc-950/45 dark:text-cyan-50/90">
            Koyu zemin logo alanı
          </div>
        </div>
      </article>
    </motion.section>
  )
}
