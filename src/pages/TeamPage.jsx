import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import PageTitleHero from '../components/PageTitleHero'
import { teamMembers } from '../utils/siteData'

export default function TeamPage() {
  const sliderRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startScrollLeftRef = useRef(0)
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

  useEffect(() => {
    const stopDragging = () => {
      isDraggingRef.current = false
    }

    window.addEventListener('mouseup', stopDragging)
    return () => window.removeEventListener('mouseup', stopDragging)
  }, [])

  const handleMouseDown = (event) => {
    const slider = sliderRef.current
    if (!slider) {
      return
    }

    isDraggingRef.current = true
    startXRef.current = event.pageX - slider.offsetLeft
    startScrollLeftRef.current = slider.scrollLeft
  }

  const handleMouseMove = (event) => {
    const slider = sliderRef.current
    if (!slider || !isDraggingRef.current) {
      return
    }

    event.preventDefault()
    const mouseX = event.pageX - slider.offsetLeft
    const walk = (mouseX - startXRef.current) * 1.1
    slider.scrollLeft = startScrollLeftRef.current - walk
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleWheel = (event) => {
    const slider = sliderRef.current
    if (!slider || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }

    event.preventDefault()
    slider.scrollLeft += event.deltaY
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Ekibimiz" />

      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">Çekirdek Kadro</p>
        <h2 className="mt-2 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">Takımı kaydırarak keşfet</h2>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
          Fare ile kartların üzerinde tutup sürükleyebilirsin. Merkezdeki üyeler net kalır,
          kenardakiler yumuşak blur alarak odağı güçlendirir.
        </p>

        <div className="relative mt-7">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/75" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/75" />

          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-4 pt-1 scroll-smooth cursor-grab active:cursor-grabbing"
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
                  className={`min-w-[74vw] snap-center overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/90 transition duration-300 dark:border-white/10 dark:bg-slate-950/70 sm:min-w-[44vw] lg:min-w-[30%] ${cardClass}`}
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
