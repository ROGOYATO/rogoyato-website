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
      <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Topluluk Profili</p>
        <h1 className="mt-3 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">Hakkımızda</h1>
        <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">
          ROGOYATO, robotik ve gomulu yazilim alaninda ogrenci gelisimini destekleyen, ekip
          tabanli uretim kulturunu yayginlastiran bir topluluktur.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {values.map((item) => (
          <article key={item.title} className="border-l-2 border-cyan-600 pl-4 dark:border-cyan-400">
            <h2 className="font-heading text-xl text-slate-900 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{item.text}</p>
          </article>
        ))}
      </div>

      <article className="border-y border-slate-200 py-6 dark:border-slate-800 sm:py-8">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Kurumsal kimlik</h2>
        <p className="mt-3 text-cyan-900/90 dark:text-cyan-50/90">
          Asagidaki alanlar logolarin ve kimlik varyasyonlarinin yerlesmesi icin ayrilmistir.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Ana logo alani
          </div>
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Monogram alani
          </div>
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Koyu zemin logo alani
          </div>
        </div>
      </article>
    </motion.section>
  )
}
