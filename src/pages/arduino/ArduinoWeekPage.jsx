import { ArrowLeft, ArrowRight, Target, Trophy } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { arduinoWeeks } from '../../utils/arduinoTraining'
import { Breadcrumb, Bullets, Chips, Label, Panel } from './ArduinoParts'

export default function ArduinoWeekPage() {
  const { week: weekParam } = useParams()
  const index = arduinoWeeks.findIndex((item) => String(item.week) === weekParam)

  if (index === -1) {
    return <Navigate to="/arduino" replace />
  }

  const week = arduinoWeeks[index]
  const previous = arduinoWeeks[index - 1]
  const next = arduinoWeeks[index + 1]

  return (
    <div className="space-y-6">
      <Breadcrumb current={`${week.week}. hafta`} />

      <div className="flex flex-wrap gap-2">
        {arduinoWeeks.map((item) => (
          <Link
            key={item.week}
            to={`/arduino/hafta/${item.week}`}
            className={`font-code rounded-md border px-3 py-1.5 text-sm transition ${
              item.week === week.week
                ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-teal-950'
                : 'border-slate-300 bg-white text-slate-600 hover:border-teal-600 hover:text-teal-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-teal-400 dark:hover:text-teal-200'
            }`}
          >
            {item.week}. hafta
          </Link>
        ))}
        <Link
          to="/arduino/yarisma"
          className="font-code rounded-md border border-dashed border-orange-400 px-3 py-1.5 text-sm text-orange-700 transition hover:bg-orange-50 dark:border-orange-300/50 dark:text-orange-200 dark:hover:bg-orange-400/10"
        >
          Yarışma
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="font-code flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-3xl font-semibold text-white dark:bg-teal-400 dark:text-teal-950">
          {week.week}
        </span>
        <div>
          <Label>{week.week}. hafta</Label>
          <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl">{week.title}</h1>
          <p className="mt-3 flex max-w-3xl gap-2 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            <Target size={20} className="mt-1 shrink-0 text-teal-600 dark:text-teal-300" />
            {week.goal}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {week.lessons.map((items, lessonIndex) => (
          <Panel key={lessonIndex}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">{lessonIndex + 1}. ders</h2>
              <span className="font-code text-xs text-slate-500 dark:text-slate-400">{lessonIndex === 0 ? '14:45–15:40' : '15:55–16:45'}</span>
            </div>
            <Bullets items={items} />
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <Panel className="border-teal-600/50 bg-teal-50/95 dark:border-teal-300/30 dark:bg-teal-400/10">
          <Label>Hafta çıktısı</Label>
          <p className="mt-2 flex gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Trophy size={20} className="mt-1 shrink-0 text-orange-500" />
            {week.outcome}
          </p>
        </Panel>
        <Panel>
          <Label>Ana malzemeler</Label>
          <div className="mt-3">
            <Chips items={week.materials} />
          </div>
        </Panel>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Haftalar arası geçiş">
        {previous ? (
          <Link
            to={`/arduino/hafta/${previous.week}`}
            className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-300/80 bg-white/95 p-4 transition hover:border-teal-600 dark:border-teal-300/15 dark:bg-[#0f1d1f]/95 dark:hover:border-teal-400"
          >
            <ArrowLeft size={18} className="shrink-0 text-teal-600 transition group-hover:-translate-x-1 dark:text-teal-300" />
            <span className="min-w-0">
              <span className="font-code block text-xs text-slate-500 dark:text-slate-400">Önceki · {previous.week}. hafta</span>
              <span className="block truncate font-semibold text-slate-900 dark:text-white">{previous.title}</span>
            </span>
          </Link>
        ) : (
          <Link
            to="/arduino"
            className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-300/80 bg-white/95 p-4 transition hover:border-teal-600 dark:border-teal-300/15 dark:bg-[#0f1d1f]/95 dark:hover:border-teal-400"
          >
            <ArrowLeft size={18} className="shrink-0 text-teal-600 transition group-hover:-translate-x-1 dark:text-teal-300" />
            <span>
              <span className="font-code block text-xs text-slate-500 dark:text-slate-400">Geri</span>
              <span className="block font-semibold text-slate-900 dark:text-white">Eğitim ana sayfası</span>
            </span>
          </Link>
        )}
        <Link
          to={next ? `/arduino/hafta/${next.week}` : '/arduino/yarisma'}
          className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-300/80 bg-white/95 p-4 text-right transition hover:border-teal-600 dark:border-teal-300/15 dark:bg-[#0f1d1f]/95 dark:hover:border-teal-400 sm:justify-end"
        >
          <span className="min-w-0 flex-1 sm:flex-none">
            <span className="font-code block text-xs text-slate-500 dark:text-slate-400">{next ? `Sonraki · ${next.week}. hafta` : 'Sonraki · 5. hafta'}</span>
            <span className="block truncate font-semibold text-slate-900 dark:text-white">{next ? next.title : 'Çizgi izleyen robot yarışması'}</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-teal-600 transition group-hover:translate-x-1 dark:text-teal-300" />
        </Link>
      </nav>
    </div>
  )
}
