import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Panel({ className = '', children }) {
  return (
    <section
      className={`rounded-xl border border-slate-300/80 bg-white/95 p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-teal-300/15 dark:bg-[#0f1d1f]/95 sm:p-7 ${className}`}
    >
      {children}
    </section>
  )
}

export function Label({ children }) {
  return <p className="font-code text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">{children}</p>
}

export function Bullets({ items, className = 'space-y-2.5' }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-200">
          <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600 dark:bg-teal-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Chips({ items }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="font-code rounded-md border border-teal-700/25 bg-teal-50 px-2.5 py-1 text-xs text-teal-900 dark:border-teal-300/25 dark:bg-teal-400/10 dark:text-teal-100"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export function Breadcrumb({ current }) {
  return (
    <nav aria-label="Konum" className="font-code flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <Link to="/arduino" className="text-teal-700 hover:underline dark:text-teal-300">
        Arduino Eğitimi
      </Link>
      <ChevronRight size={13} />
      <span>{current}</span>
    </nav>
  )
}
