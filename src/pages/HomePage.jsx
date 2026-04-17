import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const primaryLinks = [
  { to: '/etkinlikler', label: 'Etkinlikler', image: '/nav-events.svg' },
  { to: '/ekip', label: 'Ekibimiz', image: '/nav-team.svg' },
  { to: '/hakkimizda', label: 'Hakkımızda', image: '/nav-about.svg' },
  { to: '/basarilar', label: 'Başarılar', image: '/nav-achievements.svg' },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_18px_72px_rgba(56,189,248,0.12)] dark:border-white/10 dark:bg-slate-900/75 sm:p-8"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img
            src="/favicon.png"
            alt="TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu logosu"
            className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain p-1.5 dark:border-slate-700 dark:bg-slate-900"
          />
          <h1 className="font-heading text-3xl leading-tight text-slate-900 dark:text-white sm:text-5xl">
            TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu
          </h1>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group relative h-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
          >
            <img
              src={item.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-900/35 transition group-hover:bg-slate-900/45 dark:bg-slate-950/45" />
            <div className="relative flex h-full items-center justify-center px-3 text-center">
              <span className="font-heading text-xl font-semibold text-white">{item.label}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
