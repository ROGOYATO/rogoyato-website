import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/PageTitleHero'
import { events } from '../utils/siteData'

const publicBase = import.meta.env.BASE_URL
const eventVisuals = ['nav-events.svg', 'nav-team.svg', 'nav-about.svg', 'nav-achievements.svg']

function statusClass(status) {
  if (status === 'open') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-300/20 dark:text-emerald-100 dark:border-emerald-300/30'
  }
  if (status === 'upcoming') {
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-300/20 dark:text-amber-100 dark:border-amber-300/40'
  }
  return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-600/20 dark:text-zinc-100 dark:border-zinc-400/35'
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
        {upcomingEvents.length === 0 ? (
          <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-slate-600 dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300">
            Yeni etkinlik duyuruları çok yakında burada paylaşılacak.
          </article>
        ) : (
          <div className="grid gap-4">
            {upcomingEvents.map((event, index) => {
              const visual = event.coverImage
                ? `${publicBase}${event.coverImage}`
                : `${publicBase}${eventVisuals[index % eventVisuals.length]}`

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-900/70"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative aspect-square w-full sm:w-1/3 sm:shrink-0 sm:self-start">
                      <img src={visual} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-slate-900/25 to-transparent" />
                    </div>

                    <div className="p-5 sm:w-2/3 sm:p-6">
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

                      <h3 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">{event.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.summary}</p>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <p className="inline-flex items-center gap-2">
                          <CalendarClock size={16} className="text-cyan-700 dark:text-cyan-200" />
                          {event.date}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <MapPin size={16} className="text-amber-600 dark:text-amber-200" />
                          {event.location}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
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
                            className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-200 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-100 dark:hover:bg-emerald-300/25"
                          >
                            Etkinliğe başvur
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Geçmiş Etkinlikler</h2>
        {pastEvents.length === 0 ? (
          <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-slate-600 dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300">
            Arşive eklenen ilk etkinlikler yakında burada görünecek.
          </article>
        ) : (
          <div className="grid gap-4">
            {pastEvents.map((event, index) => {
              const visual = event.coverImage
                ? `${publicBase}${event.coverImage}`
                : `${publicBase}${eventVisuals[(index + upcomingEvents.length) % eventVisuals.length]}`

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-zinc-900/70"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative aspect-square w-full sm:w-1/3 sm:shrink-0 sm:self-start">
                      <img src={visual} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-slate-900/15 to-transparent" />
                    </div>

                    <div className="p-5 sm:w-2/3 sm:p-6">
                      <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs ${statusClass('closed')}`}>
                        {statusLabel('closed')}
                      </span>
                      <h3 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">{event.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.summary}</p>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        {event.date} • {event.location}
                      </p>

                      <Link
                        to={`/etkinlikler/${event.id}`}
                        className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
                      >
                        Etkinlik detayını gör
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
