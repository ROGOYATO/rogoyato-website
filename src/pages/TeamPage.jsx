import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/PageTitleHero'
import { teamMembers } from '../utils/siteData'

const publicBase = import.meta.env.BASE_URL

export default function TeamPage() {
  const sliderRef = useRef(null)
  const baseCount = teamMembers.length
  const loopMembers = useMemo(() => [...teamMembers, ...teamMembers, ...teamMembers], [])
  const [activeIndex, setActiveIndex] = useState(0)
  const [virtualIndex, setVirtualIndex] = useState(baseCount)

  const centerCardInView = (slider, card, smooth) => {
    const targetLeft = card.offsetLeft - (slider.clientWidth - card.clientWidth) / 2

    if (smooth) {
      slider.scrollTo({ left: targetLeft, behavior: 'smooth' })
      return
    }

    slider.scrollLeft = targetLeft
  }

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

    const normalizedIndex = ((nearestIndex % baseCount) + baseCount) % baseCount
    setActiveIndex(normalizedIndex)
    setVirtualIndex(nearestIndex)

    if (nearestIndex < baseCount * 0.6 || nearestIndex > baseCount * 2.4) {
      const middleIndex = normalizedIndex + baseCount
      const middleCard = cards[middleIndex]
      if (middleCard) {
        centerCardInView(slider, middleCard, false)
        setVirtualIndex(middleIndex)
      }
    }
  }

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) {
      return undefined
    }

    const handleScroll = () => updateActiveCard()
    slider.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    window.requestAnimationFrame(() => {
      const initialCard = slider.children[baseCount]
      if (!initialCard) {
        return
      }

      centerCardInView(slider, initialCard, false)
      setVirtualIndex(baseCount)
      setActiveIndex(0)
    })

    return () => {
      slider.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [baseCount])

  const scrollByStep = (step) => {
    const slider = sliderRef.current
    if (!slider) {
      return
    }

    const cards = Array.from(slider.children)
    const normalizedCurrent = ((virtualIndex % baseCount) + baseCount) % baseCount
    const middleCurrent = normalizedCurrent + baseCount
    const targetVirtual = middleCurrent + step
    const targetCard = cards[targetVirtual]

    if (!targetCard) {
      return
    }

    centerCardInView(slider, targetCard, true)
    setVirtualIndex(targetVirtual)
    setActiveIndex(((targetVirtual % baseCount) + baseCount) % baseCount)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Ekibimiz" />

      <div className="flex justify-center">
        <Link
          to="/ekip/basvuru"
          className="inline-flex items-center rounded-full border border-cyan-300/60 bg-cyan-100 px-5 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-200 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100 dark:hover:bg-cyan-300/25"
        >
          Ekibe Katıl
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-none sm:p-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            className="absolute left-1 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-950/85 dark:text-slate-100 dark:hover:bg-zinc-800 sm:left-2"
            aria-label="Önceki üye"
          >
            <ChevronLeft size={26} />
          </button>

          <button
            type="button"
            onClick={() => scrollByStep(1)}
            className="absolute right-1 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-950/85 dark:text-slate-100 dark:hover:bg-zinc-800 sm:right-2"
            aria-label="Sonraki üye"
          >
            <ChevronRight size={26} />
          </button>

          <div
            ref={sliderRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-14 pb-4 pt-1 scroll-smooth sm:px-16"
          >
            {loopMembers.map((member, index) => {
              const realIndex = index % baseCount
              const rawDistance = Math.abs(realIndex - activeIndex)
              const distance = Math.min(rawDistance, baseCount - rawDistance)
              const photoSrc = member.photo.startsWith('http') ? member.photo : `${publicBase}${member.photo}`
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
                  key={`${member.name}-${index}`}
                  className={`min-w-[74vw] snap-center overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/90 transition duration-300 dark:border-white/10 dark:bg-zinc-950/70 sm:min-w-[44vw] lg:min-w-[30%] ${cardClass}`}
                >
                  <img
                    src={photoSrc}
                    alt={`${member.name} fotoğrafı`}
                    className={`aspect-square w-full object-cover transition duration-300 ${imageClass}`}
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
