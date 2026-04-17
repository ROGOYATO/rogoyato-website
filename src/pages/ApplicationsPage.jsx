import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { events, openApplicationTypes } from '../utils/siteData'

const openEvents = events.filter((item) => item.requiresApplication && item.status === 'open')

export default function ApplicationsPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Aktif Surecler</p>
        <h1 className="mt-2 font-heading text-3xl text-white sm:text-4xl">Basvuru Merkezi</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          O an acik olan basvuru kanallari tek bir sayfada toplanir. Etkinlik donemine gore bu
          sayfa dinamik olarak guncellenir.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {openEvents.map((event) => (
          <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Etkinlik Basvurusu</p>
            <h2 className="mt-1 font-heading text-2xl text-white">{event.title}</h2>
            <p className="mt-2 text-slate-300">{event.summary}</p>
            <p className="mt-3 text-sm text-slate-400">Son tarih ve kontenjan duyurusu etkinlik detayinda.</p>
            <Link
              to={`/etkinlikler/${event.id}`}
              className="mt-4 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/25"
            >
              Etkinlik detayina git
            </Link>
          </article>
        ))}

        {openApplicationTypes.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Uyelik Basvurusu</p>
            <h2 className="mt-1 font-heading text-2xl text-white">{item.title}</h2>
            <p className="mt-2 text-slate-300">{item.description}</p>
            <span className="mt-3 inline-flex rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
              Basvuru Acik
            </span>
            <Link
              to={item.route}
              className="mt-4 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/25"
            >
              {item.cta}
            </Link>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
