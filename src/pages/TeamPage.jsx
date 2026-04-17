import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import PageTitleHero from '../components/PageTitleHero'
import { teamMembers } from '../utils/siteData'

export default function TeamPage() {
  const sliderRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveCard = () => {
    const slider = sliderRef.current
    if (!slider) {
      return
    }

    const centerPoint = slider.scrollLeft + slider.clientWidth / 2
    const cards = Array.from(slider.children)
    if (!cards.length) {
      return
    }

    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2
      const distance = Math.abs(centerPoint - cardCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    setActiveIndex(nearestIndex)
  }

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) {
      return undefined
    }

    const handleScroll = () => updateActiveCard()
    slider.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      slider.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const scrollToIndex = (targetIndex) => {
    const slider = sliderRef.current
    if (!slider) {
      return
    }

    const clampedIndex = Math.max(0, Math.min(targetIndex, teamMembers.length - 1))
    const targetCard = slider.children[clampedIndex]
    if (!targetCard) {
      return
    }

    const targetLeft = targetCard.offsetLeft - (slider.clientWidth - targetCard.clientWidth) / 2
    slider.scrollTo({ left: targetLeft, behavior: 'smooth' })
    setActiveIndex(clampedIndex)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Ekibimiz" />

      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-zinc-900/70 sm:p-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/75" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/75" />

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="absolute left-1 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-950/85 dark:text-slate-100 dark:hover:bg-zinc-800 sm:left-2"
            aria-label="Önceki üye"
            disabled={activeIndex === 0}
          >
            <ChevronLeft size={26} />
          </button>

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="absolute right-1 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-950/85 dark:text-slate-100 dark:hover:bg-zinc-800 sm:right-2"
            aria-label="Sonraki üye"
            disabled={activeIndex === teamMembers.length - 1}
          >
            <ChevronRight size={26} />
          </button>

          <div
            ref={sliderRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-14 pb-4 pt-1 scroll-smooth sm:px-16"
          >
            {teamMembers.map((member, index) => {
              const distance = Math.abs(index - activeIndex)
              const cardClass =
                distance === 0
                  ? 'scale-100 opacity-100'
                  : distance === 1
                    ? 'scale-[0.95] opacity-95'
                    : 'scale-[0.9] opacity-75'
              const imageClass =
                distance === 0
                  ? 'blur-0'
                  : distance === 1
                    ? 'blur-[1px]'
                    : 'blur-[2.2px]'

              return (
                <article
                  key={member.name}
                  className={`min-w-[74vw] snap-center overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/90 transition duration-300 dark:border-white/10 dark:bg-zinc-950/70 sm:min-w-[44vw] lg:min-w-[30%] ${cardClass}`}
                >
                  <img
                    src={member.photo}
                    alt={`${member.name} fotoğrafı`}
                    className={`h-72 w-full object-cover transition duration-300 sm:h-80 ${imageClass}`}
                    loading="lazy"
                  />
                  <div className="p-5">
                    <h3 className="font-heading text-2xl text-slate-900 dark:text-white">{member.name}</h3>
                    <p className="mt-1 text-base text-slate-600 dark:text-slate-300">{member.role}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </motion.section>
  )
}
