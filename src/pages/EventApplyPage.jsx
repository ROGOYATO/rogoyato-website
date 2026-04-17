import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { events } from '../utils/siteData'

export default function EventApplyPage() {
  const { eventId } = useParams()
  const event = events.find((item) => item.id === eventId)

  if (!event) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <h1 className="font-heading text-3xl text-white">Basvuru sayfasi bulunamadi</h1>
        <p className="mt-3 text-slate-300">Etkinlik bilgisi degismis olabilir.</p>
        <Link to="/etkinlikler" className="mt-4 inline-flex text-cyan-200 hover:text-cyan-100">
          Etkinliklere don
        </Link>
      </section>
    )
  }

  if (!event.requiresApplication) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <h1 className="font-heading text-3xl text-white">Bu etkinlikte basvuru alinmiyor</h1>
        <p className="mt-3 text-slate-300">Etkinlik herkese acik sekilde gerceklesecektir.</p>
        <Link
          to={`/etkinlikler/${event.id}`}
          className="mt-4 inline-flex text-cyan-200 hover:text-cyan-100"
        >
          Etkinlik detayina don
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
        className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100"
      >
        <ArrowLeft size={16} />
        Etkinlik detayina don
      </Link>

      <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Etkinlik Basvurusu</p>
        <h1 className="mt-2 font-heading text-3xl text-white sm:text-4xl">{event.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Son basvuru tarihi: {event.applicationDeadline || 'Etkinlik duyurusundaki tarihe bakiniz'}
        </p>
        {event.applicationNote ? (
          <p className="mt-2 text-sm text-slate-400">{event.applicationNote}</p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
        <h2 className="font-heading text-2xl text-white">Basvuru formu (taslak)</h2>
        <p className="mt-2 text-slate-300">
          Bu alana daha sonra Google Form ya da ozel backend formu baglanabilir.
        </p>

        <form className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-200">
            Ad Soyad
            <input
              type="text"
              placeholder="Adinizi yazin"
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </label>

          <label className="text-sm text-slate-200">
            E-posta
            <input
              type="email"
              placeholder="ornek@mail.com"
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </label>

          <label className="text-sm text-slate-200 sm:col-span-2">
            Kisa not
            <textarea
              rows="4"
              placeholder="Neden katilmak istediginizi yazin"
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </label>

          <button
            type="button"
            className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/25"
          >
            Basvuruyu gonder (demo)
          </button>
        </form>
      </section>
    </motion.section>
  )
}
