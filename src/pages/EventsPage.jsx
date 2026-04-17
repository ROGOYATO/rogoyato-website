import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/PageTitleHero'
import { events } from '../utils/siteData'

function statusClass(status) {
  if (status === 'open') return 'bg-emerald-300/20 text-emerald-100 border-emerald-300/30'
  if (status === 'upcoming') return 'bg-amber-300/20 text-amber-100 border-amber-300/40'
  return 'bg-slate-300/15 text-slate-200 border-slate-300/25'
}

function statusLabel(status) {
  if (status === 'open') return 'Başvuru Açık'
  if (status === 'upcoming') return 'Yakında'
  return 'Tamamlandı'
}

export default function EventsPage() {
  const upcomingEvents = events.filter((event) => event.status === 'open' || event.status === 'upcoming')
  const pastEvents = events.filter((event) => event.status === 'closed')

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <PageTitleHero title="Etkinlikler" />
      </motion.section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Yaklaşan Etkinlikler</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/65">
          {upcomingEvents.map((event) => (
            <article key={event.id} className="border-b border-slate-200/80 p-4 last:border-b-0 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(event.status)}`}
                >
                  {statusLabel(event.status)}
                </span>
                <span className="rounded-full border border-slate-300/70 bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                  {event.type}
                </span>
              </div>

              <h3 className="mt-2 font-heading text-xl text-slate-900 dark:text-white">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{event.summary}</p>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                <p className="inline-flex items-center gap-2">
                  <CalendarClock size={16} className="text-cyan-700 dark:text-cyan-200" />
                  {event.date}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin size={16} className="text-amber-600 dark:text-amber-200" />
                  {event.location}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/etkinlikler/${event.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
                >
                  Detay
                  <ArrowRight size={14} />
                </Link>
                {event.requiresApplication && event.status !== 'closed' ? (
                  <Link
                    to={`/etkinlikler/${event.id}/basvuru`}
                    className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/25"
                  >
                    Etkinliğe başvur
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Geçmiş Etkinlikler</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/65">
          {pastEvents.map((event) => (
            <article key={event.id} className="border-b border-slate-200/80 p-4 last:border-b-0 dark:border-white/10">
              <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {event.date} • {event.location}
              </p>
              <Link
                to={`/etkinlikler/${event.id}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
              >
                Etkinlik detayını gör
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
