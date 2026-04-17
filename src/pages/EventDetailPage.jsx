import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, ClipboardList, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { events } from '../utils/siteData'

function statusMeta(status) {
  if (status === 'open') {
    return {
      label: 'Basvuru Acik',
      classes: 'bg-emerald-300/20 text-emerald-100 border-emerald-300/30',
    }
  }
  if (status === 'upcoming') {
    return {
      label: 'Yakinda',
      classes: 'bg-amber-300/20 text-amber-100 border-amber-300/40',
    }
  }
  return {
    label: 'Tamamlandi',
    classes: 'bg-slate-300/15 text-slate-200 border-slate-300/25',
  }
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const event = events.find((item) => item.id === eventId)

  if (!event) {
    return (
      <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">Etkinlik bulunamadi</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Bu etkinlik arsivde degismis olabilir.</p>
        <Link to="/etkinlikler" className="mt-5 inline-flex text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100">
          Etkinlik listesine don
        </Link>
      </section>
    )
  }

  const meta = statusMeta(event.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <Link to="/etkinlikler" className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100">
        <ArrowLeft size={16} />
        Tum etkinliklere don
      </Link>

      <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${meta.classes}`}>
            {meta.label}
          </span>
          <span className="rounded-full border border-slate-300/70 bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
            {event.type}
          </span>
          {event.requiresApplication ? (
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
              Basvuru Gerekli
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">{event.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">{event.summary}</p>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="inline-flex items-center gap-2">
            <CalendarClock size={16} className="text-cyan-700 dark:text-cyan-200" />
            {event.date}
          </p>
          <p className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-amber-600 dark:text-amber-200" />
            {event.location}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-slate-900/65">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Program Akisi</h2>
          <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
            {event.agenda.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-slate-900/65">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Kosullar ve Notlar</h2>
          <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
            {event.notes.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {event.requiresApplication && event.status !== 'closed' ? (
        <section className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-5">
          <h2 className="font-heading text-xl text-cyan-100">Etkinlik basvurusu</h2>
          <p className="mt-2 text-cyan-50/90">
            Bu etkinlik icin ayri bir basvuru sayfasi bulunur. Son tarih ve gerekli bilgiler
            basvuru ekraninda yer alir.
          </p>
          <Link
            to={`/etkinlikler/${event.id}/basvuru`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-200/20 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-200/30"
          >
            <ClipboardList size={16} />
            Etkinlige basvur
          </Link>
        </section>
      ) : null}
    </motion.div>
  )
}
