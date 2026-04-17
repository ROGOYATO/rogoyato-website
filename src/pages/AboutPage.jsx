import { motion } from 'framer-motion'

const values = [
  {
    title: 'Uretim odakli topluluk',
    text: 'Teknik gelisim, proje ciktisi ve ekip calismasi odakli bir yapi.',
  },
  {
    title: 'Gercekci etkinlik ritmi',
    text: 'Donem icinde 3-4 etkinlik ve gerektiginde basvuru bazli programlar.',
  },
  {
    title: 'Acik basvuru surecleri',
    text: 'Okul ici ve universitelerarasi etkinliklerde kosullar net sekilde duyurulur.',
  },
]

export default function AboutPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Topluluk Profili</p>
        <h1 className="mt-3 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">Hakkimizda</h1>
        <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">
          ROGOYATO, robotik ve gomulu yazilim alaninda ogrenci gelisimini destekleyen, ekip
          tabanli uretim kulturunu yayginlastiran bir topluluktur.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {values.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-slate-900/65">
            <h2 className="font-heading text-xl text-slate-900 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{item.text}</p>
          </article>
        ))}
      </div>

      <article className="rounded-3xl border border-cyan-300/40 bg-cyan-500/10 p-6 dark:border-cyan-300/25 dark:bg-cyan-400/10 sm:p-8">
        <h2 className="font-heading text-2xl text-cyan-800 dark:text-cyan-100">Kurumsal kimlik</h2>
        <p className="mt-3 text-cyan-900/90 dark:text-cyan-50/90">
          Asagidaki alanlar logolarin ve kimlik varyasyonlarinin yerlesmesi icin ayrilmistir.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-cyan-300/45 bg-white/75 p-4 text-center text-sm text-cyan-800 dark:border-cyan-200/35 dark:bg-slate-950/45 dark:text-cyan-50/90">
            Ana logo alani
          </div>
          <div className="rounded-xl border border-cyan-300/45 bg-white/75 p-4 text-center text-sm text-cyan-800 dark:border-cyan-200/35 dark:bg-slate-950/45 dark:text-cyan-50/90">
            Monogram alani
          </div>
          <div className="rounded-xl border border-cyan-300/45 bg-white/75 p-4 text-center text-sm text-cyan-800 dark:border-cyan-200/35 dark:bg-slate-950/45 dark:text-cyan-50/90">
            Koyu zemin logo alani
          </div>
        </div>
      </article>
    </motion.section>
  )
}
