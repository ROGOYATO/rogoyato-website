import { motion } from 'framer-motion'
import { CalendarClock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { events } from '../utils/siteData'

function statusClass(status) {
  if (status === 'open') return 'bg-emerald-300/20 text-emerald-100 border-emerald-300/30'
  if (status === 'upcoming') return 'bg-amber-300/20 text-amber-100 border-amber-300/40'
  return 'bg-slate-300/15 text-slate-200 border-slate-300/25'
}

function statusLabel(status) {
  if (status === 'open') return 'Basvuru Acik'
  if (status === 'upcoming') return 'Yakinda'
  return 'Tamamlandi'
}

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Donem Takvimi</p>
        <h1 className="mt-2 font-heading text-3xl text-white sm:text-4xl">Etkinlikler</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Okul ici ve universitelerarasi programlar ayni takvimde gorunur. Basvuru gerektiren
          etkinlikler kart uzerinde acikca isaretlenir.
        </p>
      </motion.header>

      <section className="grid gap-4">
        {events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(event.status)}`}
              >
                {statusLabel(event.status)}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                {event.type}
              </span>
              {event.requiresApplication ? (
                <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                  Basvuru Gerekli
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 font-heading text-2xl text-white">{event.title}</h2>
            <p className="mt-2 text-slate-300">{event.summary}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
              <p className="inline-flex items-center gap-2">
                <CalendarClock size={16} className="text-cyan-200" />
                {event.date}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-amber-200" />
                {event.location}
              </p>
            </div>

            <Link
              to={`/etkinlikler/${event.id}`}
              className="mt-5 inline-flex rounded-full border border-cyan-300/35 bg-cyan-300/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/25"
            >
              Etkinlik detayini ac
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
