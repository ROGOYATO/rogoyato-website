import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, ClipboardList, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { events } from '../utils/siteData'

function statusMeta(status) {
  if (status === 'open') {
    return {
      label: 'Başvuru Açık',
      classes: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/40',
    }
  }
  if (status === 'upcoming') {
    return {
      label: 'Yakında',
      classes: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/40',
    }
  }
  return {
    label: 'Tamamlandı',
    classes: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40',
  }
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const event = events.find((item) => item.id === eventId)

  if (!event) {
    return (
      <section className="border-y border-slate-200 py-8 dark:border-slate-800">
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">Etkinlik bulunamadı</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Bu etkinlik arsivde degismis olabilir.</p>
        <Link to="/etkinlikler" className="mt-5 inline-flex text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100">
          Etkinlik listesine dön
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
        Tüm etkinliklere dön
      </Link>

      <section className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${meta.classes}`}>
            {meta.label}
          </span>
          <span className="rounded-full border border-slate-300/70 bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
            {event.type}
          </span>
          {event.requiresApplication ? (
            <span className="rounded-full border border-cyan-300 bg-cyan-100 px-2.5 py-1 text-xs text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/15 dark:text-cyan-200">
              Başvuru Gerekli
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
        <article className="border-l-2 border-cyan-600 pl-4 dark:border-cyan-400">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Program Akışı</h2>
          <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
            {event.agenda.map((item) => (
              <li key={item} className="border-b border-slate-200 pb-2 dark:border-slate-800">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="border-l-2 border-amber-500 pl-4 dark:border-amber-300">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Koşullar ve Notlar</h2>
          <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
            {event.notes.map((item) => (
              <li key={item} className="border-b border-slate-200 pb-2 dark:border-slate-800">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {event.requiresApplication && event.status !== 'closed' ? (
        <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <h2 className="font-heading text-xl text-slate-900 dark:text-white">Etkinlik başvurusu</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Bu etkinlik icin ayri bir basvuru sayfasi bulunur. Son tarih ve gerekli bilgiler
            basvuru ekraninda yer alir.
          </p>
          <Link
            to={`/etkinlikler/${event.id}/basvuru`}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-cyan-300 bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-200 dark:border-cyan-400/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/25"
          >
            <ClipboardList size={16} />
            Etkinliğe başvur
          </Link>
        </section>
      ) : null}
    </motion.div>
  )
}
