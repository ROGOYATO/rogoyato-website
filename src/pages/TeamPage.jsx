import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { teamMembers, teamUnits } from '../utils/siteData'

export default function TeamPage() {
  const sliderRef = useRef(null)

  const scrollSlider = (direction) => {
    if (!sliderRef.current) {
      return
    }

    sliderRef.current.scrollBy({
      left: direction === 'next' ? 320 : -320,
      behavior: 'smooth',
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">Organizasyon</p>
        <h1 className="mt-2 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">Ekibimiz</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
          Ekip temel olarak teknik birimler ve organizasyon biriminden olusur. Donem basinda
          yeni uyeler ilgi alanina gore bu birimlere dagitilir.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-slate-900/65">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Ekip uyeleri</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollSlider('prev')}
              className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Bir onceki uye"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider('next')}
              className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Bir sonraki uye"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div ref={sliderRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="min-w-[250px] snap-start overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/85 dark:border-white/10 dark:bg-slate-950/70"
            >
              <img
                src={member.photo}
                alt={`${member.name} fotografi`}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="font-heading text-lg text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{member.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {teamUnits.map((unit) => (
          <article key={unit.name} className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-slate-900/65">
            <h2 className="font-heading text-2xl text-slate-900 dark:text-white">{unit.name}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{unit.focus}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
