import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import logoImage from '../assets/favicon.png'

const publicBase = import.meta.env.BASE_URL

const primaryLinks = [
  { to: '/etkinlikler', label: 'Etkinlikler', image: 'nav-events.svg', fallback: '#0f766e' },
  { to: '/ekip', label: 'Ekibimiz', image: 'nav-team.svg', fallback: '#4c1d95' },
  { to: '/hakkimizda', label: 'Hakkımızda', image: 'nav-about.svg', fallback: '#1d4ed8' },
  { to: '/basarilar', label: 'Başarılar', image: 'nav-achievements.svg', fallback: '#b45309' },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-3xl border border-slate-200/90 bg-white/90 px-6 py-8 shadow-[0_18px_72px_rgba(56,189,248,0.12)] dark:border-white/10 dark:bg-slate-900/75 sm:px-10 sm:py-10"
      >
        <div className="flex w-full items-center justify-center">
          <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 sm:flex-row sm:items-center sm:justify-center">
            <img
              src={logoImage}
              alt="TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu logosu"
              className="h-32 w-32 object-contain sm:h-44 sm:w-44"
            />
            <h1 className="font-heading text-center text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-left sm:text-5xl sm:leading-[1.05]">
              <span className="block">TOBB ETÜ</span>
              <span className="block">Robotik ve Gömülü</span>
              <span className="block">Yazılım Topluluğu</span>
            </h1>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {primaryLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group relative h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900 sm:h-56"
            style={{ backgroundColor: item.fallback }}
          >
            <img
              src={`${publicBase}${item.image}`}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover blur-[1.6px] transition duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-900/35 transition group-hover:bg-slate-900/45 dark:bg-slate-950/45" />
            <div className="relative flex h-full items-center justify-center px-3 text-center">
              <span className="font-heading text-2xl font-semibold text-white">{item.label}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
