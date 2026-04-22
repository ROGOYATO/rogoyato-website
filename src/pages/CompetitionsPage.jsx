import { motion, useInView } from 'framer-motion'
import { Award, Cpu, GraduationCap, Rocket, Sparkles, Target, Trophy, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  achievementStats,
  competitionHighlights,
  participationHighlights,
  teamTracks,
  trainingRoadmap,
} from '../utils/siteData'
import achievementsHeroImage from '../../ornekbutonarkaplan.png'

const statIcons = [Users, Rocket, Cpu, GraduationCap]

function parseNumericValue(value) {
  const raw = String(value).trim()
  const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/)

  if (!match) {
    return { target: 0, decimals: 0, suffix: raw }
  }

  return {
    target: Number.parseFloat(match[1]),
    decimals: match[1].includes('.') ? 2 : 0,
    suffix: match[2] || '',
  }
}

function AnimatedMetricValue({ value, className = '' }) {
  const metricRef = useRef(null)
  const isInView = useInView(metricRef, { once: true, margin: '-10% 0px' })
  const [displayValue, setDisplayValue] = useState(0)

  const { target, decimals, suffix } = useMemo(() => parseNumericValue(value), [value])

  useEffect(() => {
    if (!isInView) {
      return undefined
    }

    const duration = 1400
    const start = performance.now()
    let rafId = 0

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const easedProgress = 1 - (1 - progress) ** 3
      setDisplayValue(target * easedProgress)

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step)
      }
    }

    rafId = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [isInView, target])

  const formatted = displayValue.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={metricRef} className={className}>
      {formatted}
      {suffix}
    </span>
  )
}

export default function CompetitionsPage() {
  const averageScore = useMemo(() => {
    const scores = competitionHighlights
      .map((item) => Number.parseFloat(item.score))
      .filter((value) => Number.isFinite(value))

    if (!scores.length) {
      return '0'
    }

    const total = scores.reduce((sum, score) => sum + score, 0)
    return (total / scores.length).toFixed(2)
  }, [])

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative space-y-8 overflow-hidden"
    >
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 via-white to-slate-100/90 p-7 shadow-[0_26px_64px_rgba(8,47,73,0.16)] dark:border-cyan-300/20 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:via-zinc-950/85 dark:to-cyan-950/40 sm:p-10">
        <img
          src={achievementsHeroImage}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.10] mix-blend-multiply dark:opacity-[0.17]"
        />
        <div className="pointer-events-none absolute -right-16 -top-14 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-500/20" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-200/10" />

        <motion.div
          aria-hidden
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute right-8 top-8 hidden rounded-full border border-white/35 bg-white/50 p-3 text-cyan-700 backdrop-blur md:block dark:border-white/10 dark:bg-zinc-900/55 dark:text-cyan-200"
        >
          <Trophy size={22} />
        </motion.div>

        <motion.div
          aria-hidden
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute bottom-8 right-24 hidden rounded-full border border-white/35 bg-white/50 p-2 text-amber-700 backdrop-blur md:block dark:border-white/10 dark:bg-zinc-900/55 dark:text-amber-200"
        >
          <Sparkles size={18} />
        </motion.div>

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">ROGOYATO Performance Deck</p>
          <h1 className="font-hero mt-2 max-w-5xl text-4xl font-extrabold leading-[1.03] text-slate-900 dark:text-white sm:text-6xl">
            Yarışmada Ölçen,
            <span className="block text-cyan-700 dark:text-cyan-200">Sahada Üreten Takım Ekosistemi</span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
            Bu sayfa, yalnızca skorları değil; proje üretim disiplini, çok takımlı organizasyon yapısı, teknik eğitim hattı
            ve dönemsel gelişim ivmesini tek bir sponsorluk vitrini içinde gösterir.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {achievementStats.map((item, index) => {
              const Icon = statIcons[index % statIcons.length]

              return (
                <motion.article
                  key={item.label}
                  whileHover={{ y: -8, rotateX: 8, rotateY: -7, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur-sm [transform-style:preserve-3d] dark:border-white/10 dark:bg-zinc-950/55"
                >
                  <div className="inline-flex rounded-full border border-cyan-300/45 bg-cyan-300/20 p-2 text-cyan-700 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-200">
                    <Icon size={16} />
                  </div>
                  <p className="mt-2 text-[0.72rem] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <AnimatedMetricValue value={item.value} className="mt-1 block font-heading text-4xl text-slate-900 dark:text-white" />
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.note}</p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/85 bg-white/92 p-7 shadow-[0_20px_48px_rgba(15,23,42,0.11)] dark:border-white/10 dark:bg-zinc-900/75 sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/45 bg-fuchsia-300/20 px-3 py-1 text-xs text-fuchsia-700 dark:border-fuchsia-300/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
            <Award size={13} />
            Yarışma Performans Sinyalleri
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-300/20 px-3 py-1 text-xs text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
            Ortalama Skor
            <AnimatedMetricValue value={averageScore} className="font-semibold" />
          </span>
        </div>

        <div className="relative mt-7">
          <div className="pointer-events-none absolute left-8 right-8 top-12 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent md:block dark:via-cyan-300/25" />

          <div className="grid gap-8 md:grid-cols-3">
            {competitionHighlights.map((item) => (
              <motion.article
                key={item.id}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 210, damping: 18 }}
                className="relative text-center"
              >
                <motion.div
                  whileHover={{ rotateY: 8, rotateX: 6 }}
                  transition={{ type: 'spring', stiffness: 210, damping: 18 }}
                  className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-cyan-300/55 bg-cyan-200/30 shadow-[0_0_0_8px_rgba(255,255,255,0.75)] [transform-style:preserve-3d] dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:shadow-[0_0_0_8px_rgba(24,24,27,0.55)]"
                >
                  <AnimatedMetricValue value={item.score} className="font-heading text-3xl text-cyan-800 dark:text-cyan-200" />
                </motion.div>

                <p className="mt-3 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.year} • {item.result}</p>
                <h3 className="mt-2 font-heading text-xl text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{item.stage}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/85 bg-gradient-to-br from-white via-slate-50 to-cyan-50/45 p-7 dark:border-white/10 dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-cyan-950/30 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_1fr]">
          <div>
            <h2 className="font-heading text-3xl text-slate-900 dark:text-white">Takım ve Eğitim Motoru</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Düzenli eğitim döngüsü, çok takımlı üretim modeli ve yarışma odaklı çalışma ritmi birlikte ilerletiliyor.
            </p>

            <div className="mt-5 space-y-3">
              {teamTracks.map((team, index) => (
                <motion.article
                  key={team.name}
                  whileHover={{ x: 7, y: -2, rotateX: 5, rotateY: -5 }}
                  transition={{ type: 'spring', stiffness: 210, damping: 16 }}
                  className="rounded-2xl border border-slate-200/80 bg-white/82 p-4 [transform-style:preserve-3d] dark:border-white/10 dark:bg-zinc-950/45"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex rounded-full border border-cyan-300/55 bg-cyan-300/20 p-2 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100">
                      {index % 2 === 0 ? <Rocket size={15} /> : <Target size={15} />}
                    </span>
                    <div>
                      <h3 className="font-heading text-lg text-slate-900 dark:text-white">{team.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{team.focus}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-2xl text-slate-900 dark:text-white">Eğitim Yol Haritası</h3>
            <div className="relative mt-4 pl-6">
              <div className="pointer-events-none absolute left-2 top-2 h-[calc(100%-0.6rem)] w-px bg-gradient-to-b from-cyan-500/65 via-cyan-300/40 to-transparent" />

              <div className="space-y-4">
                {trainingRoadmap.map((item) => (
                  <div key={`${item.term}-${item.title}`} className="relative">
                    <span className="absolute -left-[1.18rem] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_3px_rgba(34,211,238,0.20)]" />
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.term}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-cyan-200/70 bg-cyan-500/10 p-7 dark:border-cyan-300/25 dark:bg-cyan-400/10 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-heading text-3xl text-cyan-900 dark:text-cyan-100">Saha Ritmi ve İvme</h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-white/70 px-3 py-1 text-xs text-cyan-900 dark:border-cyan-300/35 dark:bg-zinc-900/55 dark:text-cyan-100">
            <Sparkles size={13} />
            Sürekli iterasyon modeli
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {participationHighlights.map((item) => (
            <motion.article
              key={item}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="rounded-2xl border border-cyan-300/45 bg-white/75 p-4 dark:border-cyan-300/25 dark:bg-zinc-950/40"
            >
              <div className="flex items-start gap-3">
                <Cpu size={17} className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-200" />
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-cyan-900/90 dark:text-cyan-50/90">
          Sponsor iş birlikleriyle bu üretim hattını daha yüksek test kapasitesi, daha güçlü saha denemeleri ve daha görünür
          yarışma sonuçlarıyla bir üst seviyeye taşımayı hedefliyoruz.
        </p>
      </section>
    </motion.section>
  )
}
