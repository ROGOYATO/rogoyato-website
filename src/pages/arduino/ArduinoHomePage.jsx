import { ArrowRight, CheckCircle2, Flag, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { arduinoCompetition, arduinoTraining, arduinoWeeks } from '../../utils/arduinoTraining'
import { Bullets, Label, Panel } from './ArduinoParts'

const flowMinutes = [55, 15, 50]

export default function ArduinoHomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="min-w-0">
          <Label>{arduinoTraining.term} · Ders planı</Label>
          <h1 className="mt-3 font-hero text-4xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            {arduinoTraining.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{arduinoTraining.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/arduino/hafta/1"
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-300"
            >
              1. haftadan başla
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/arduino/malzemeler"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:text-teal-200"
            >
              <Package size={17} />
              Malzeme listesi
            </Link>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-teal-900/30 bg-[#0f2a2c] shadow-xl dark:border-teal-300/20">
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0b2123] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
            <span className="font-code ml-2 text-xs text-teal-100/70">egitim.ino</span>
          </div>
          <pre className="font-code overflow-x-auto p-5 text-[0.82rem] leading-7 text-teal-50 sm:text-sm">
            <span className="text-teal-300/60">{'// ROGOYATO · Arduino Eğitimi\n'}</span>
            <span className="text-orange-300">const char</span>
            {'* gun   = '}
            <span className="text-amber-200">"Cumartesi"</span>
            {';\n'}
            <span className="text-orange-300">const char</span>
            {'* saat  = '}
            <span className="text-amber-200">"14:45-16:45"</span>
            {';\n'}
            <span className="text-orange-300">const int</span>
            {'   hafta = '}
            <span className="text-sky-300">4</span>
            {';\n\n'}
            <span className="text-orange-300">void</span>
            {' setup() { kur(); }\n'}
            <span className="text-orange-300">void</span>
            {' loop()  { ogren(); uygula(); }'}
          </pre>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {arduinoTraining.facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-slate-300/80 bg-white/95 px-4 py-3 dark:border-teal-300/15 dark:bg-[#0f1d1f]/95">
            <p className="font-code text-[0.7rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{fact.label}</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fact.value}</p>
          </div>
        ))}
      </section>

      <Panel>
        <Label>Günlük akış</Label>
        <div className="mt-4 flex overflow-hidden rounded-md border border-slate-300/80 dark:border-teal-300/20">
          {arduinoTraining.dailyFlow.map((slot, index) => (
            <div
              key={slot.time}
              style={{ flexGrow: flowMinutes[index], flexBasis: 0 }}
              className={`min-w-0 px-3 py-3 ${
                slot.label === 'Ara'
                  ? 'bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-100'
                  : 'bg-teal-50 text-teal-900 dark:bg-teal-400/10 dark:text-teal-50'
              } ${index > 0 ? 'border-l border-slate-300/80 dark:border-teal-300/20' : ''}`}
            >
              <p className="truncate text-sm font-semibold">{slot.label}</p>
              <p className="font-code truncate text-xs opacity-80">{slot.time}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <Label>Öğrenme çıktıları</Label>
        <h2 className="mt-2 font-hero text-2xl font-bold text-slate-900 dark:text-white">Eğitimin sonunda neler yapabileceksin?</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {arduinoTraining.outcomes.map((outcome) => (
            <li key={outcome} className="flex gap-3 text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-300" />
              <span className="leading-relaxed">{outcome}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <section>
        <Label>Program</Label>
        <h2 className="mt-2 font-hero text-2xl font-bold text-slate-900 dark:text-white">Dört haftalık eğitim ve yarışma</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {arduinoWeeks.map((week) => (
            <Link
              key={week.week}
              to={`/arduino/hafta/${week.week}`}
              className="group flex min-w-0 gap-4 rounded-xl border border-slate-300/80 bg-white/95 p-5 transition hover:-translate-y-0.5 hover:border-teal-600 hover:shadow-md dark:border-teal-300/15 dark:bg-[#0f1d1f]/95 dark:hover:border-teal-400"
            >
              <span className="font-code flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-teal-700 text-xl font-semibold text-white dark:bg-teal-400 dark:text-teal-950">
                {week.week}
              </span>
              <span className="min-w-0">
                <span className="font-code block text-xs text-slate-500 dark:text-slate-400">{week.week}. hafta</span>
                <span className="mt-0.5 block font-semibold text-slate-900 dark:text-white">{week.title}</span>
                <span className="font-code mt-2 block truncate text-xs text-teal-700 dark:text-teal-300">{week.code}</span>
              </span>
              <ArrowRight size={18} className="ml-auto mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-600 dark:group-hover:text-teal-300" />
            </Link>
          ))}

          <Link
            to="/arduino/yarisma"
            className="group flex min-w-0 gap-4 rounded-xl border-2 border-dashed border-orange-400/70 bg-orange-50/90 p-5 transition hover:-translate-y-0.5 hover:border-orange-500 hover:shadow-md dark:border-orange-300/40 dark:bg-orange-400/10 md:col-span-2"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-orange-500 text-white">
              <Flag size={22} />
            </span>
            <span className="min-w-0">
              <span className="font-code block text-xs text-orange-800 dark:text-orange-200">5. hafta · Ayrı etkinlik</span>
              <span className="mt-0.5 block font-semibold text-slate-900 dark:text-white">{arduinoCompetition.title}</span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">Ders yok; herkes kendi robotunu kurar ve parkurda yarışır.</span>
            </span>
            <ArrowRight size={18} className="ml-auto mt-1 shrink-0 text-orange-500 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <Panel className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <Label>Donanım</Label>
          <h2 className="mt-2 font-hero text-2xl font-bold text-slate-900 dark:text-white">Öğrenci başına malzeme</h2>
          <div className="mt-4">
            <Bullets
              items={[
                'Arduino Uno, breadboard, sensörler ve LED’lerden oluşan başlangıç seti',
                'L298N motor sürücü, 2WD robot araba kiti ve 3 adet KH-09 sensör',
                '4 adet AA pil öğrenci tarafından temin edilir',
              ]}
            />
          </div>
        </div>
        <Link
          to="/arduino/malzemeler"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-300"
        >
          Tam liste
          <ArrowRight size={17} />
        </Link>
      </Panel>
    </div>
  )
}
