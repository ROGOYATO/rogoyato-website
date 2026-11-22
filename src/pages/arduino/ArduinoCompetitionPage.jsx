import { ArrowRight, CalendarDays, Cpu, Flag, Handshake, MapPin, Trophy, User, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoImage from '../../assets/logo.webp'
import { arduinoCompetition } from '../../utils/arduinoTraining'
import { Breadcrumb, Bullets, Chips, Label, Panel } from './ArduinoParts'

const publicBase = import.meta.env.BASE_URL
const FACT_ICONS = [Flag, CalendarDays, MapPin, User]
// Podium order on wide screens: second, first, third.
const PODIUM = [2, 1, 3]
const PLACE_STYLE = {
  1: { ring: 'from-amber-300 to-yellow-600', text: 'text-amber-700 dark:text-amber-300', lift: 'md:-translate-y-6' },
  2: { ring: 'from-slate-200 to-slate-500', text: 'text-slate-600 dark:text-slate-300', lift: '' },
  3: { ring: 'from-orange-300 to-orange-700', text: 'text-orange-700 dark:text-orange-300', lift: 'md:translate-y-4' },
}

export default function ArduinoCompetitionPage() {
  const competition = arduinoCompetition
  const prizes = PODIUM.map((place) => competition.prizes.find((prize) => prize.place === place))

  return (
    <div className="space-y-6">
      <Breadcrumb current="Yarışma" />

      {/* Cover: the title, who organizes it and the trophies. */}
      <header className="relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_top,#334155,#0b1120_70%)] px-6 pb-8 pt-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)] sm:px-10 sm:pt-9">
        <div className="flex flex-wrap items-center gap-3">
          <img src={logoImage} alt="" className="h-11 w-11" />
          <div className="min-w-0">
            <p className="font-code text-[0.7rem] uppercase tracking-[0.2em] text-slate-300">Resmi yarışma duyurusu</p>
            <p className="text-sm text-slate-200">{competition.organizer}</p>
          </div>
        </div>
        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="font-code text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Arduino Eğitimi · {competition.edition}</p>
            <h1 className="mt-2 font-hero text-4xl font-extrabold leading-tight sm:text-5xl">{competition.title}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-200">{competition.summary}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
              <Trophy size={15} />
              Ödül sponsoru: <span className="font-semibold">{competition.sponsor}</span>
            </p>
          </div>
          <div className="flex items-end justify-center gap-2 sm:gap-4">
            {prizes.map((prize) => (
              <img
                key={prize.place}
                src={`${publicBase}${prize.image}`}
                alt={`${prize.title} kupası: ${prize.trophy}`}
                className={`w-auto drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)] ${prize.place === 1 ? 'h-52 sm:h-64' : 'h-40 sm:h-48'}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Key facts. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {competition.facts.map((fact, index) => {
          const Icon = FACT_ICONS[index] ?? Flag
          return (
            <Panel key={fact.label} className="!p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-amber-300 dark:bg-white/10">
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <Label>{fact.label}</Label>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fact.value}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{fact.detail}</p>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>

      {/* The two things everyone must know. */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="border-teal-600/40 bg-teal-50/95 dark:border-teal-300/30 dark:bg-teal-400/10">
          <div className="flex gap-4">
            <Wrench size={26} className="mt-1 shrink-0 text-teal-700 dark:text-teal-300" />
            <div>
              <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">Robotunu kendi zamanında hazırla</h2>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200">
                21–27 Kasım arasında robotunu istediğin yerde ve istediğin saatte kur, kodla ve dene. Yarış gününe <strong>tamamlanmış robotunla</strong> gel; robotlar yarış günü sıfırdan yapılmaz.
              </p>
            </div>
          </div>
        </Panel>
        <Panel className="border-amber-500/40 bg-amber-50/95 dark:border-amber-300/30 dark:bg-amber-400/10">
          <div className="flex gap-4">
            <Handshake size={26} className="mt-1 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">Yarış öncesi bize danış</h2>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200">
                28 Kasım Cumartesi <strong>10:00–14:45</strong> arasında TM 218 açık. Teknik sorunlarında yardım ediyor, robotunu yarış pistinde denemene izin veriyoruz. Kod ve taktik vermiyoruz.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Programme. */}
      <Panel>
        <Label>Program</Label>
        <ol className="mt-5 space-y-0">
          {competition.timeline.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {index < competition.timeline.length - 1 ? <span className="absolute left-[0.6rem] top-6 h-full w-px bg-slate-300 dark:bg-white/15" aria-hidden="true" /> : null}
              <span className={`relative mt-1 h-5 w-5 shrink-0 rounded-full border-4 ${step.highlight ? 'border-amber-400 bg-amber-100 dark:bg-amber-400/30' : 'border-slate-300 bg-white dark:border-white/25 dark:bg-transparent'}`} />
              <div className="min-w-0">
                <p className="font-code text-xs font-semibold text-slate-500 dark:text-slate-400">{step.when}</p>
                <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
                <p className="text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-200">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* Prizes. */}
      <Panel>
        <Label>Ödüller</Label>
        <h2 className="mt-1 font-hero text-2xl font-bold text-slate-900 dark:text-white">İlk üç dereceye özel kupalar</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3 md:items-end">
          {prizes.map((prize) => {
            const style = PLACE_STYLE[prize.place]
            return (
              <figure key={prize.place} className={`flex flex-col items-center text-center ${style.lift} ${prize.place === 1 ? 'order-first md:order-none' : ''}`}>
                <div className="flex h-64 items-end justify-center rounded-2xl bg-gradient-to-b from-slate-100 to-white px-6 pb-4 pt-6 dark:from-white/10 dark:to-transparent">
                  <img src={`${publicBase}${prize.image}`} alt={`${prize.trophy} kupası`} className={`w-auto ${prize.place === 1 ? 'h-56' : 'h-48'}`} />
                </div>
                <span className={`mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${style.ring} font-hero text-lg font-extrabold text-white shadow`}>{prize.place}</span>
                <figcaption className="mt-2">
                  <p className={`font-hero text-xl font-bold ${style.text}`}>{prize.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {prize.trophy} kupası · {prize.base} · {prize.height}
                  </p>
                </figcaption>
              </figure>
            )
          })}
        </div>
        <p className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">{competition.prizeNote}</p>
      </Panel>

      {/* Regulation. */}
      <Panel>
        <Label>Yarışma kuralları</Label>
        <h2 className="mt-1 font-hero text-2xl font-bold text-slate-900 dark:text-white">Yönetmelik</h2>
        <div className="mt-6 grid gap-x-10 gap-y-7 lg:grid-cols-2">
          {competition.rules.map((section, index) => (
            <section key={section.title}>
              <h3 className="flex items-baseline gap-2 font-semibold text-slate-900 dark:text-white">
                <span className="font-code text-sm text-amber-700 dark:text-amber-300">Madde {index + 1}</span>
                {section.title}
              </h3>
              <Bullets items={section.items} className="mt-3 space-y-2" />
            </section>
          ))}
        </div>
      </Panel>

      <Panel>
        <Label>Robot malzemeleri</Label>
        <div className="mt-3">
          <Chips items={competition.materials} />
        </div>
      </Panel>

      <Link
        to="/arduino/simulator?ornek=robot-araba"
        className="group flex items-center gap-4 rounded-xl border-2 border-teal-600/50 bg-teal-50/95 p-4 transition hover:border-teal-600 dark:border-teal-300/30 dark:bg-teal-400/10 dark:hover:border-teal-300"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950">
          <Cpu size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-900 dark:text-white">Robot arabayı simülatörde dene</span>
          <span className="block text-sm text-slate-600 dark:text-slate-300">Kablolanmış arabaya kendi çizgi izleme kodunuzu yazıp parkurlarda deneyin; malzemeniz yanınızda olmasa da olur.</span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-teal-600 transition group-hover:translate-x-1 dark:text-teal-300" />
      </Link>
    </div>
  )
}
