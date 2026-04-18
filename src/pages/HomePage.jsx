import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import logoImage from '../assets/favicon.png'
import buttonBackdrop from '../../ornekbutonarkaplan.png'

const primaryLinks = [
  { to: '/etkinlikler', label: 'Etkinlikler', tint: 'from-cyan-700/55 via-cyan-900/45 to-slate-900/65' },
  { to: '/ekip', label: 'Ekibimiz', tint: 'from-amber-700/55 via-slate-900/45 to-slate-900/70' },
  { to: '/hakkimizda', label: 'Hakkımızda', tint: 'from-blue-700/55 via-slate-900/50 to-slate-900/70' },
  { to: '/basarilar', label: 'Başarılar', tint: 'from-orange-700/55 via-slate-900/50 to-slate-900/70' },
]

const heroFontClass = 'font-hero-option-1'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-3xl border border-slate-200/90 bg-white/90 px-6 py-8 shadow-[0_18px_58px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-zinc-900/75 dark:shadow-none sm:px-10 sm:py-10"
      >
        <div className="flex w-full items-center justify-center">
          <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 sm:flex-row sm:items-center sm:justify-center">
            <img
              src={logoImage}
              alt="TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu logosu"
              className="h-32 w-32 object-contain sm:h-44 sm:w-44"
            />
            <h1 className={`${heroFontClass} text-center text-3xl font-bold leading-tight text-slate-900 dark:text-white sm:text-left sm:text-5xl sm:leading-[1.05]`}>
              <span className="block">TOBB ETÜ</span>
              <span className="block">ROBOTİK VE</span>
              <span className="block">GÖMÜLÜ YAZILIM</span>
              <span className="block">TOPLULUĞU</span>
            </h1>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {primaryLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group relative h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-[0_10px_34px_rgba(15,23,42,0.14)] dark:border-zinc-700 dark:bg-zinc-900 sm:h-56"
          >
            <img
              src={buttonBackdrop}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] transition duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${item.tint} transition group-hover:opacity-85`} />
            <div className="relative flex h-full items-center justify-center px-3 text-center">
              <span className="font-heading text-2xl font-semibold text-white">{item.label}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
