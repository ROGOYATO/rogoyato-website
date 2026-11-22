import { ArrowRight, CalendarDays, ChevronDown, Clock, Cpu, Flag, Handshake, Mail, MapPin, Printer, Trophy, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logoImage from '../assets/logo.webp'
import { lineRobotCompetition as competition } from '../utils/lineRobotCompetition'

const publicBase = import.meta.env.BASE_URL
const FACT_ICONS = [Flag, CalendarDays, MapPin, Users]
// Podium order on wide screens: second, first, third.
const PODIUM = [2, 1, 3]
const PLACE_STYLE = {
  1: { medal: 'from-amber-300 to-yellow-600', text: 'text-amber-700 dark:text-amber-300', lift: 'md:-translate-y-8' },
  2: { medal: 'from-slate-200 to-slate-500', text: 'text-slate-600 dark:text-slate-300', lift: '' },
  3: { medal: 'from-orange-300 to-orange-700', text: 'text-orange-700 dark:text-orange-300', lift: 'md:translate-y-4' },
}
const SECTIONS = [
  ['genel', 'Genel Bilgi'],
  ['tarihler', 'Önemli Tarihler'],
  ['yaris-gunu', 'Yarış Günü'],
  ['oduller', 'Ödüller'],
  ['sartname', 'Şartname'],
  ['sss', 'SSS'],
  ['iletisim', 'İletişim'],
]

// Days, hours, minutes and seconds to the races; null once they started.
function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const left = new Date(target).getTime() - now
  if (left <= 0) return null
  const s = Math.floor(left / 1000)
  return [
    [Math.floor(s / 86400), 'gün'],
    [Math.floor((s % 86400) / 3600), 'saat'],
    [Math.floor((s % 3600) / 60), 'dakika'],
    [s % 60, 'saniye'],
  ]
}

function SectionTitle({ number, kicker, title }) {
  return (
    <div className="flex items-end gap-4 border-b-2 border-slate-900 pb-3 dark:border-white/70">
      <span className="font-code text-4xl font-bold leading-none text-amber-500">{String(number).padStart(2, '0')}</span>
      <div>
        <p className="font-code text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{kicker}</p>
        <h2 className="font-heading text-3xl leading-tight text-slate-900 dark:text-white">{title}</h2>
      </div>
    </div>
  )
}

export default function LineRobotCompetitionPage() {
  const prizes = PODIUM.map((place) => competition.prizes.find((prize) => prize.place === place))
  const countdown = useCountdown(competition.raceStart)

  return (
    <div className="competition-page -mt-2 space-y-10 print:space-y-6">
      {/* Cover. */}
      <header className="relative overflow-hidden rounded-3xl bg-[#0b1120] text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)] print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(45,212,191,0.12),transparent_50%)]" aria-hidden="true" />
        {/* The track: a line to follow across the cover. */}
        <svg className="absolute inset-x-0 bottom-0 h-24 w-full opacity-30" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 70 C 200 20, 350 95, 550 55 S 900 10, 1200 60" fill="none" stroke="#f8fafc" strokeWidth="6" strokeDasharray="1 0" />
        </svg>
        <div className="relative px-6 pb-10 pt-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="" className="h-10 w-10" />
              <div className="leading-tight">
                <p className="font-heading text-lg">ROGOYATO</p>
                <p className="text-xs text-slate-400">TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu</p>
              </div>
            </div>
            <p className="font-code rounded-full border border-amber-300/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">Resmi duyuru · {competition.edition}</p>
          </div>

          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="font-code text-sm uppercase tracking-[0.25em] text-amber-300">28 Kasım 2026 · Cumartesi</p>
              <h1 className="mt-3 font-heading text-5xl leading-[1.05] sm:text-6xl">
                Çizgi İzleyen
                <br />
                Robot Yarışması
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">{competition.summary}</p>

              {countdown ? (
                <div className="mt-7">
                  <p className="font-code text-xs uppercase tracking-[0.2em] text-slate-400">Sıralama turlarına kalan</p>
                  <div className="mt-2 flex gap-2 sm:gap-3">
                    {countdown.map(([value, unit]) => (
                      <div key={unit} className="w-[4.4rem] rounded-xl border border-white/10 bg-white/5 py-2 text-center sm:w-20">
                        <p className="font-code text-2xl font-bold tabular-nums sm:text-3xl">{String(value).padStart(2, '0')}</p>
                        <p className="text-[0.7rem] uppercase tracking-wider text-slate-400">{unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#sartname" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300">
                  Yarışma şartnamesi
                  <ArrowRight size={16} />
                </a>
                <Link to="/arduino/simulator?ornek=robot-araba" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10">
                  <Cpu size={16} />
                  Simülatörde dene
                </Link>
              </div>
            </div>

            <div className="flex items-end justify-center gap-2 sm:gap-4">
              {prizes.map((prize) => (
                <img
                  key={prize.place}
                  src={`${publicBase}${prize.image}`}
                  alt={`${prize.title} kupası: ${prize.trophy}`}
                  className={`w-auto drop-shadow-[0_18px_24px_rgba(0,0,0,0.5)] ${prize.place === 1 ? 'h-56 sm:h-72' : 'h-40 sm:h-52'}`}
                />
              ))}
            </div>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-300 lg:justify-end">
            <Trophy size={15} className="text-amber-300" />
            Ödül sponsoru <span className="font-semibold text-white">{competition.sponsor}</span>
          </p>
        </div>
      </header>

      {/* Section menu, kept in view while reading. */}
      <nav aria-label="Bölümler" className="sticky top-[4.75rem] z-20 -mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 px-2 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/90 print:hidden">
        <ul className="flex min-w-max gap-1">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="font-code block rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 transition hover:bg-slate-900 hover:text-white dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-900">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* 01 General. */}
      <section id="genel" className="scroll-mt-40 space-y-5">
        <SectionTitle number={1} kicker="Yarışma hakkında" title="Genel Bilgi" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {competition.facts.map((fact, index) => {
            const Icon = FACT_ICONS[index] ?? Flag
            return (
              <article key={fact.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/70">
                <Icon size={20} className="text-amber-600 dark:text-amber-300" />
                <p className="font-code mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{fact.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{fact.value}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{fact.detail}</p>
              </article>
            )
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="flex gap-4 rounded-2xl border-l-4 border-teal-600 bg-teal-50 p-6 dark:border-teal-300 dark:bg-teal-400/10">
            <Wrench size={24} className="mt-1 shrink-0 text-teal-700 dark:text-teal-300" />
            <div>
              <h3 className="font-heading text-xl text-slate-900 dark:text-white">Robotunu kendi zamanında hazırla</h3>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200">
                21–27 Kasım arasında robotunu istediğin yerde ve istediğin saatte kur, kodla ve dene. Yarış gününe <strong>tamamlanmış robotunla</strong> gel; robotlar yarış günü sıfırdan yapılmaz.
              </p>
            </div>
          </article>
          <article className="flex gap-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-6 dark:border-amber-300 dark:bg-amber-400/10">
            <Handshake size={24} className="mt-1 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <h3 className="font-heading text-xl text-slate-900 dark:text-white">Yarış öncesi bize danış</h3>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200">
                28 Kasım Cumartesi <strong>10:00–14:45</strong> arasında yarış alanı açık. Teknik sorunlarında yardım ediyor, robotunu yarış pistinde denemene izin veriyoruz. Kod ve taktik vermiyoruz.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* 02 Dates. */}
      <section id="tarihler" className="scroll-mt-40 space-y-5">
        <SectionTitle number={2} kicker="Takvim" title="Önemli Tarihler" />
        <ol className="grid gap-3 md:grid-cols-5">
          {competition.timeline.map((step) => (
            <li
              key={step.title}
              className={`rounded-2xl border p-5 ${step.highlight ? 'border-amber-400 bg-amber-50 dark:border-amber-300/50 dark:bg-amber-400/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/70'}`}
            >
              <p className="font-code text-sm font-bold text-slate-900 dark:text-white">{step.when}</p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-white">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 03 Race day. */}
      <section id="yaris-gunu" className="scroll-mt-40 space-y-5">
        <SectionTitle number={3} kicker="28 Kasım 2026 Cumartesi" title="Yarış Günü Akışı" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/70">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white dark:bg-white/10">
              <tr>
                <th className="font-code px-5 py-3 text-xs font-semibold uppercase tracking-wider">Saat</th>
                <th className="font-code px-5 py-3 text-xs font-semibold uppercase tracking-wider">Etkinlik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {competition.dayPlan.map((slot) => (
                <tr key={slot.time} className="align-top">
                  <td className="font-code whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-600 dark:text-amber-300" />
                      {slot.time}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-white">{slot.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{slot.text}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04 Prizes. */}
      <section id="oduller" className="scroll-mt-40 space-y-5">
        <SectionTitle number={4} kicker="Kupalar" title="Ödüller" />
        <div className="rounded-3xl bg-gradient-to-b from-slate-100 to-white p-6 pt-14 dark:from-white/5 dark:to-transparent sm:p-10 sm:pt-16">
          <div className="grid gap-10 md:grid-cols-3 md:items-end">
            {prizes.map((prize) => {
              const style = PLACE_STYLE[prize.place]
              return (
                <figure key={prize.place} className={`flex flex-col items-center text-center ${style.lift} ${prize.place === 1 ? 'order-first md:order-none' : ''}`}>
                  <img src={`${publicBase}${prize.image}`} alt={`${prize.trophy} kupası`} className={`w-auto drop-shadow-[0_16px_20px_rgba(15,23,42,0.25)] ${prize.place === 1 ? 'h-64' : 'h-52'}`} />
                  <span className={`mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${style.medal} font-heading text-xl text-white shadow`}>{prize.place}</span>
                  <figcaption className="mt-2">
                    <p className={`font-heading text-2xl ${style.text}`}>{prize.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {prize.trophy} kupası · {prize.base} · {prize.height}
                    </p>
                  </figcaption>
                </figure>
              )
            })}
          </div>
          <p className="mt-10 border-t border-slate-200 pt-4 text-center text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">{competition.prizeNote}</p>
        </div>
      </section>

      {/* 05 Regulation, as a document. */}
      <section id="sartname" className="scroll-mt-40 space-y-5">
        <SectionTitle number={5} kicker="Kurallar" title="Yarışma Şartnamesi" />
        <article className="rounded-2xl border border-slate-300 bg-white px-6 py-8 shadow-[0_1px_0_rgba(15,23,42,0.05)] dark:border-white/15 dark:bg-zinc-950 sm:px-12 sm:py-10 print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-white/10">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{competition.organizer}</p>
              <h3 className="mt-2 font-heading text-2xl text-slate-900 dark:text-white">
                {competition.title} {competition.edition} Şartnamesi
              </h3>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10 print:hidden"
            >
              <Printer size={15} />
              Yazdır / PDF kaydet
            </button>
          </div>
          <div className="mt-6 space-y-7">
            {competition.rules.map((section, index) => (
              <section key={section.title} className="break-inside-avoid">
                <h4 className="font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
                  Madde {index + 1} – {section.title}
                </h4>
                <ol className="mt-3 space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={item} className="grid grid-cols-[2.6rem_1fr] text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="font-code text-sm text-slate-500 dark:text-slate-400">
                        {index + 1}.{itemIndex + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-200 pt-5 dark:border-white/10">
            <p className="font-semibold text-slate-900 dark:text-white">Robot malzemeleri</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{competition.materials.join(' · ')}</p>
          </div>
        </article>
      </section>

      {/* 06 FAQ. */}
      <section id="sss" className="scroll-mt-40 space-y-5 print:hidden">
        <SectionTitle number={6} kicker="Merak edilenler" title="Sıkça Sorulan Sorular" />
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-zinc-900/70">
          {competition.faq.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-slate-900 dark:text-white">
                {item.q}
                <ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-slate-700 dark:text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 07 Contact and organizer. */}
      <section id="iletisim" className="scroll-mt-40 space-y-5 print:hidden">
        <SectionTitle number={7} kicker="Düzenleyen" title="İletişim" />
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <article className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900/70">
            <img src={logoImage} alt="" className="h-16 w-16 shrink-0" />
            <div>
              <p className="font-heading text-xl text-slate-900 dark:text-white">{competition.organizer}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Yarışmaya dair soruların için eğitim WhatsApp grubuna yazabilir ya da aşağıdaki kanallardan bize ulaşabilirsin.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {competition.contact.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10">
                      <Mail size={14} />
                      {item.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
          <article className="flex flex-col justify-center rounded-2xl bg-slate-900 p-6 text-white dark:bg-white/10">
            <p className="font-code text-xs uppercase tracking-[0.2em] text-amber-300">Ödül sponsoru</p>
            <p className="mt-2 font-heading text-3xl">{competition.sponsor}</p>
            <p className="mt-2 text-sm text-slate-300">İlk üç dereceye verilecek kupaları ürettiği için Westonya’ya teşekkür ederiz.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
