import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, ClipboardList, MapPin } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageTitleHero from '../components/PageTitleHero'
import { events } from '../utils/siteData'

const publicBase = import.meta.env.BASE_URL

function EventGalleryCarousel({ images, title }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [snapPoints, setSnapPoints] = useState([])

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return
    }

    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) {
      return undefined
    }

    setSnapPoints(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', () => {
      setSnapPoints(emblaApi.scrollSnapList())
      onSelect()
    })

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/70 sm:p-6">
      <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Gezi Galerisi</h2>

      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/55 text-white backdrop-blur-sm transition hover:bg-slate-950/70"
          aria-label="Önceki görsel"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/55 text-white backdrop-blur-sm transition hover:bg-slate-950/70"
          aria-label="Sonraki görsel"
        >
          <ChevronRight size={20} />
        </button>

        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="-ml-3 flex">
            {images.map((imagePath) => (
              <div key={imagePath} className="min-w-0 flex-[0_0_100%] pl-3">
                <img
                  src={`${publicBase}${imagePath}`}
                  alt={`${title} görseli`}
                  className="aspect-[4/3] w-full rounded-2xl bg-zinc-950/85 object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {snapPoints.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {snapPoints.map((_, index) => (
            <button
              key={`gallery-dot-${index}`}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2.5 rounded-full transition ${
                index === selectedIndex ? 'w-7 bg-cyan-600 dark:bg-cyan-300' : 'w-2.5 bg-slate-300 dark:bg-zinc-600'
              }`}
              aria-label={`Görsel ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function statusMeta(status) {
  if (status === 'open') {
    return {
      label: 'Başvuru Açık',
      classes:
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-300/20 dark:text-emerald-100 dark:border-emerald-300/30',
    }
  }
  if (status === 'upcoming') {
    return {
      label: 'Yakında',
      classes:
        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-300/20 dark:text-amber-100 dark:border-amber-300/40',
    }
  }
  return {
    label: 'Tamamlandı',
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-600/20 dark:text-zinc-100 dark:border-zinc-400/35',
  }
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const event = events.find((item) => item.id === eventId)

  if (!event) {
    return (
      <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/75 sm:p-8">
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">Etkinlik bulunamadı</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Bu etkinlik arşivde değişmiş olabilir.</p>
        <Link to="/etkinlikler" className="mt-5 inline-flex text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100">
          Etkinlik listesine dön
        </Link>
      </section>
    )
  }

  const meta = statusMeta(event.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <Link to="/etkinlikler" className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100">
        <ArrowLeft size={16} />
        Tüm etkinliklere dön
      </Link>

      <PageTitleHero title="Etkinlik Detayı" />

      <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/75 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${meta.classes}`}>
            {meta.label}
          </span>
          <span className="rounded-full border border-slate-300/70 bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
            {event.type}
          </span>
          {event.requiresApplication ? (
            <span className="rounded-full border border-cyan-300 bg-cyan-100 px-2.5 py-1 text-xs text-cyan-800 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-100">
              Başvuru Gerekli
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">{event.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">{event.summary}</p>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="inline-flex items-center gap-2">
            <CalendarClock size={16} className="text-cyan-700 dark:text-cyan-200" />
            {event.date}
          </p>
          <p className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-amber-600 dark:text-amber-200" />
            {event.location}
          </p>
        </div>
      </section>

      {event.body && event.body.length ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-slate-700 dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300 sm:p-6">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Etkinlik Notları</h2>
          <div className="mt-3 space-y-3 leading-relaxed">
            {event.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {event.galleryImages && event.galleryImages.length ? (
        <EventGalleryCarousel images={event.galleryImages} title={event.title} />
      ) : null}

      {event.requiresApplication && event.status !== 'closed' ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-300/25 dark:bg-cyan-300/10">
          <h2 className="font-heading text-xl text-cyan-900 dark:text-cyan-100">Etkinlik başvurusu</h2>
          <p className="mt-2 text-cyan-800 dark:text-cyan-50/90">
            Bu etkinlik için ayrı bir başvuru sayfası bulunur. Son tarih ve gerekli bilgiler
            başvuru ekranında yer alır.
          </p>
          <Link
            to={`/etkinlikler/${event.id}/basvuru`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-900 transition hover:bg-cyan-200 dark:border-cyan-300/40 dark:bg-cyan-200/20 dark:text-cyan-50 dark:hover:bg-cyan-200/30"
          >
            <ClipboardList size={16} />
            Etkinliğe başvur
          </Link>
        </section>
      ) : null}
    </motion.div>
  )
}
