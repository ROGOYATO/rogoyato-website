import { motion } from 'framer-motion'
import { teamUnits } from '../utils/siteData'

export default function TeamPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Organizasyon</p>
        <h1 className="mt-2 font-heading text-3xl text-white sm:text-4xl">Ekibimiz</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Ekip temel olarak teknik birimler ve organizasyon biriminden olusur. Donem basinda
          yeni uyeler ilgi alanina gore bu birimlere dagitilir.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {teamUnits.map((unit) => (
          <article key={unit.name} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
            <h2 className="font-heading text-2xl text-white">{unit.name}</h2>
            <p className="mt-2 text-slate-300">{unit.focus}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
