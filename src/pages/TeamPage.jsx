import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/PageTitleHero'
import { teamMembers } from '../utils/siteData'
import teamHeroImage from '../assets/heroes/team-hero.png'

const publicBase = import.meta.env.BASE_URL

export default function TeamPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true, dragFree: false })

  const handleSelect = useCallback(() => {
    if (!emblaApi) {
      return
    }

    setActiveIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) {
      return undefined
    }

    handleSelect()
    emblaApi.on('select', handleSelect)
    emblaApi.on('reInit', handleSelect)

    return () => {
      emblaApi.off('select', handleSelect)
      emblaApi.off('reInit', handleSelect)
    }
  }, [emblaApi, handleSelect])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Ekibimiz" imageSrc={teamHeroImage} />

      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-none sm:p-8">
        <div className="relative">
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-1 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-950/85 dark:text-slate-100 dark:hover:bg-zinc-800 sm:left-2"
            aria-label="Önceki üye"
          >
            <ChevronLeft size={26} />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-1 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-700 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-950/85 dark:text-slate-100 dark:hover:bg-zinc-800 sm:right-2"
            aria-label="Sonraki üye"
          >
            <ChevronRight size={26} />
          </button>

          <div className="overflow-hidden px-14 py-5 sm:px-16" ref={emblaRef}>
            <div className="-ml-4 flex">
              {teamMembers.map((member, index) => {
                const rawDistance = Math.abs(index - activeIndex)
                const distance = Math.min(rawDistance, teamMembers.length - rawDistance)
              const photoSrc = member.photo.startsWith('http') ? member.photo : `${publicBase}${member.photo}`
              const cardClass =
                distance === 0
                  ? 'scale-[1.08] opacity-100 blur-0'
                  : distance === 1
                    ? 'scale-[0.93] opacity-95 blur-[1px]'
                    : 'scale-[0.86] opacity-75 blur-[2px]'

              return (
                <div key={member.name} className="min-w-0 flex-[0_0_80%] pl-4 sm:flex-[0_0_48%] lg:flex-[0_0_38%]">
                  <article
                    className={`overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/90 transition duration-300 dark:border-white/10 dark:bg-zinc-950/70 ${cardClass}`}
                  >
                    <img
                      src={photoSrc}
                      alt={`${member.name} fotoğrafı`}
                      className="aspect-square w-full object-cover transition duration-300"
                      loading="lazy"
                    />
                    <div className="p-5">
                      <h3 className="font-heading text-2xl text-slate-900 dark:text-white">{member.name}</h3>
                      <p className="mt-1 text-base text-slate-600 dark:text-slate-300">{member.role}</p>
                    </div>
                  </article>
                </div>
              )
            })}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center pt-1">
        <Link
          to="/ekip/basvuru"
          className="inline-flex items-center rounded-full border border-cyan-300/60 bg-cyan-100 px-7 py-3 text-base font-semibold text-cyan-900 transition hover:bg-cyan-200 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100 dark:hover:bg-cyan-300/25"
        >
          Ekibe Katıl
        </Link>
      </div>
    </motion.section>
  )
}
