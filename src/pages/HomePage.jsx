import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, ClipboardCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { events } from '../utils/siteData'

const stats = [
  { label: 'Donemlik Etkinlik Ritmi', value: '3-4 Etkinlik' },
  { label: 'Universitelerarasi Format', value: 'En Az 1 Buyuk Program' },
  { label: 'Takim Yapisi', value: '4 Ana Birim' },
]

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

export default function HomePage() {
  const highlighted = events.slice(0, 3)

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-[0_20px_80px_rgba(2,132,199,0.15)] sm:p-8"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs tracking-wide text-cyan-100">
          <Sparkles size={14} />
          Toplulugu tanit, etkinlikleri yonet, basvurulari tek merkezden yurur
        </div>

        <h1 className="font-heading text-3xl leading-tight text-white sm:text-5xl">
          ROGOYATO dijital merkezi
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300 sm:text-lg">
          Ana sayfa bir yonlendirme merkezi olarak tasarlandi. Detaylar ayri sayfalarda,
          basvuru gerektiren programlar ise kampanya formatinda ilerler.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/etkinlikler"
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-300/40"
          >
            <CalendarDays className="mb-3 text-cyan-200" />
            <p className="text-sm text-slate-300">Etkinlik Takvimi</p>
            <p className="font-medium text-white">Donem akisini gor</p>
          </Link>
          <Link
            to="/basvuru-merkezi"
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-emerald-300/40"
          >
            <ClipboardCheck className="mb-3 text-emerald-200" />
            <p className="text-sm text-slate-300">Basvuru Merkezi</p>
            <p className="font-medium text-white">Acilik surecleri takip et</p>
          </Link>
          <Link
            to="/topluluga-katil"
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-amber-300/45"
          >
            <Users className="mb-3 text-amber-200" />
            <p className="text-sm text-slate-300">Topluluga Katil</p>
            <p className="font-medium text-white">Uyelik surecini baslat</p>
          </Link>
          <Link
            to="/yarismalar"
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-fuchsia-300/45"
          >
            <ArrowRight className="mb-3 text-fuchsia-200" />
            <p className="text-sm text-slate-300">Basari Arsivi</p>
            <p className="font-medium text-white">Yarisma hikayelerini incele</p>
          </Link>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-2 font-heading text-2xl text-cyan-100">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
        <h2 className="font-heading text-2xl text-white sm:text-3xl">One cikan etkinlikler</h2>
        <p className="mt-2 text-slate-300">
          Surekli etkinlik varmis gibi davranmayan, donem ritmini gercekci gosteren akis.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {highlighted.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(event.status)}`}
              >
                {statusLabel(event.status)}
              </span>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{event.type}</p>
              <h3 className="mt-1 font-heading text-xl text-white">{event.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{event.summary}</p>
              <p className="mt-3 text-xs text-slate-400">
                {event.date} • {event.location}
              </p>
              <Link
                to={`/etkinlikler/${event.id}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                Detaya git
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
