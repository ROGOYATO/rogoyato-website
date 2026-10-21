import { motion } from 'framer-motion'
import { ArrowRight, Cpu } from 'lucide-react'
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoImage from '../assets/logo.webp'
import aboutHeroImage from '../assets/heroes/about-hero.webp'
import achievementsHeroImage from '../assets/heroes/achievements-hero.webp'
import eventsHeroImage from '../assets/heroes/events-hero.webp'
import teamHeroImage from '../assets/heroes/team-hero.webp'
import { arduinoTraining } from '../utils/arduinoTraining'

const primaryLinks = [
  { to: '/etkinlikler', label: 'Etkinlikler', backdrop: eventsHeroImage },
  { to: '/ekip', label: 'Ekibimiz', backdrop: teamHeroImage },
  { to: '/hakkimizda', label: 'Hakkımızda', backdrop: aboutHeroImage },
  { to: '/basarilar', label: 'Başarılar', backdrop: achievementsHeroImage },
]

const heroFontClass = 'font-hero'
const EASTER_EGG_CLICK_WINDOW_MS = 700

export default function HomePage() {
  const navigate = useNavigate()
  const logoClickTimesRef = useRef([])

  const handleLogoClick = () => {
    const now = Date.now()
    const recentClicks = logoClickTimesRef.current.filter((time) => now - time <= EASTER_EGG_CLICK_WINDOW_MS)
    recentClicks.push(now)
    logoClickTimesRef.current = recentClicks

    if (recentClicks.length >= 3) {
      logoClickTimesRef.current = []
      navigate('/snake-game')
    }
  }

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
            <button
              type="button"
              onClick={handleLogoClick}
              aria-label="ROGOYATO logosu"
              className="rounded-full outline-hidden transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-cyan-500/80"
            >
              <img
                src={logoImage}
                alt="TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu logosu"
                className="h-32 w-32 object-contain sm:h-44 sm:w-44"
              />
            </button>
            <h1 className={`${heroFontClass} text-center text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-left sm:text-5xl sm:leading-[1.05]`}>
              <span className="block">TOBB ETÜ</span>
              <span className="block">ROBOTİK VE</span>
              <span className="block">GÖMÜLÜ YAZILIM</span>
              <span className="block">TOPLULUĞU</span>
            </h1>
          </div>
        </div>
      </motion.section>

      <Link
        to="/arduino"
        className="group flex flex-col gap-4 rounded-2xl border border-teal-600/40 bg-teal-700 p-5 text-white shadow-[0_12px_38px_rgba(15,118,110,0.28)] transition hover:bg-teal-800 dark:border-teal-300/30 dark:bg-teal-900/70 dark:shadow-none dark:hover:bg-teal-900 sm:flex-row sm:items-center sm:p-6"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Cpu size={26} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-teal-100">Yeni eğitim · {arduinoTraining.term}</span>
          <span className="mt-1 block font-hero text-2xl font-bold">{arduinoTraining.title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-teal-50/90">{arduinoTraining.summary}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition group-hover:gap-3 sm:self-center">
          Programı incele
          <ArrowRight size={16} />
        </span>
      </Link>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {primaryLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group relative h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-[0_10px_34px_rgba(15,23,42,0.14)] dark:border-zinc-700 dark:bg-zinc-900 sm:h-56"
          >
            <img
              src={item.backdrop}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] transition duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(2, 6, 23, 0.56) 0%, rgba(2, 6, 23, 0.3) 38%, rgba(2, 6, 23, 0.08) 70%, rgba(2, 6, 23, 0) 100%)',
              }}
            />
            <div className="relative flex h-full items-center justify-center px-3 text-center">
              <span className="font-hero-soft inline-flex rounded-full border border-white/20 px-4 py-2 text-2xl font-semibold tracking-[0.01em] text-white backdrop-blur-[1.5px] drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]">
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
