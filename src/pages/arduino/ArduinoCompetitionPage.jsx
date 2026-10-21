import { ArrowLeft, ArrowRight, Cpu, Flag, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { arduinoCompetition } from '../../utils/arduinoTraining'
import { Breadcrumb, Bullets, Chips, Label, Panel } from './ArduinoParts'

export default function ArduinoCompetitionPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb current="Yarışma" />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
          <Flag size={30} />
        </span>
        <div>
          <p className="font-code text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">5. hafta · Ayrı etkinlik</p>
          <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl sm:leading-10">{arduinoCompetition.title}</h1>
        </div>
      </header>

      <Panel className="border-orange-300/80 bg-orange-50/95 dark:border-orange-300/30 dark:bg-orange-400/10">
        <p className="flex gap-3 text-lg leading-relaxed text-slate-800 dark:text-slate-100">
          <Info size={20} className="mt-1 shrink-0 text-orange-600 dark:text-orange-300" />
          {arduinoCompetition.summary}
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {arduinoCompetition.stages.map((stage) => (
          <Panel key={stage.title}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">{stage.title}</h2>
              {stage.note && (
                <span className="font-code rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{stage.note}</span>
              )}
            </div>
            <Bullets items={stage.items} />
          </Panel>
        ))}
      </div>

      <Panel>
        <Label>Yarışma malzemeleri</Label>
        <div className="mt-3">
          <Chips items={arduinoCompetition.materials} />
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
          <span className="block text-sm text-slate-600 dark:text-slate-300">Kablolanmış arabaya kendi çizgi izleme kodunuzu yazıp parkurda deneyin; malzemeniz olmasa da olur.</span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-teal-600 transition group-hover:translate-x-1 dark:text-teal-300" />
      </Link>

      <Link
        to="/arduino/hafta/4"
        className="group inline-flex items-center gap-2 font-semibold text-teal-700 hover:underline dark:text-teal-300"
      >
        <ArrowLeft size={17} className="transition group-hover:-translate-x-1" />
        4. hafta: L298N ve DC motor kontrolü
      </Link>
    </div>
  )
}
