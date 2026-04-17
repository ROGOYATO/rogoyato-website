import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { events } from '../utils/siteData'

export default function EventApplyPage() {
  const { eventId } = useParams()
  const event = events.find((item) => item.id === eventId)

  if (!event) {
    return (
      <section className="border-y border-slate-200 py-8 dark:border-slate-800">
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">Başvuru sayfası bulunamadı</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Etkinlik bilgisi degismis olabilir.</p>
        <Link to="/etkinlikler" className="mt-4 inline-flex text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100">
          Etkinliklere dön
        </Link>
      </section>
    )
  }

  if (!event.requiresApplication) {
    return (
      <section className="border-y border-slate-200 py-8 dark:border-slate-800">
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">Bu etkinlikte başvuru alınmıyor</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Etkinlik herkese acik sekilde gerceklesecektir.</p>
        <Link
          to={`/etkinlikler/${event.id}`}
          className="mt-4 inline-flex text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
        >
          Etkinlik detayına dön
        </Link>
      </section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <Link
        to={`/etkinlikler/${event.id}`}
        className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
      >
        <ArrowLeft size={16} />
        Etkinlik detayına dön
      </Link>

      <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">Etkinlik Başvurusu</p>
        <h1 className="mt-2 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">{event.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
          Son başvuru tarihi: {event.applicationDeadline || 'Etkinlik duyurusundaki tarihe bakınız'}
        </p>
        {event.applicationNote ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.applicationNote}</p>
        ) : null}
      </header>

      <section className="border-y border-slate-200 py-6 dark:border-slate-800">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Başvuru formu (taslak)</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Bu alana daha sonra Google Form ya da ozel backend formu baglanabilir.
        </p>

        <form className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Ad Soyad
            <input
              type="text"
              placeholder="Adınızı yazın"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-200">
            E-posta
            <input
              type="email"
              placeholder="ornek@mail.com"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
            Kısa not
            <textarea
              rows="4"
              placeholder="Neden katılmak istediğinizi yazın"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <button
            type="button"
            className="rounded-md border border-emerald-300 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
          >
            Basvuruyu gonder (demo)
          </button>
        </form>
      </section>
    </motion.section>
  )
}
