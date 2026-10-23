import { ArrowLeft, Cpu, Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import useTheme from '../../hooks/useTheme'
import logoImage from '../../assets/logo.webp'
import { arduinoTraining } from '../../utils/arduinoTraining'

const navLinks = [
  { to: '/arduino', label: 'Program', end: true },
  { to: '/arduino/hafta/1', label: 'Haftalar', match: '/arduino/hafta' },
  { to: '/arduino/yarisma', label: 'Yarışma' },
  { to: '/arduino/malzemeler', label: 'Malzemeler' },
  { to: '/arduino/simulator', label: 'Simülatör' },
]

export default function ArduinoLayout() {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="arduino-board flex min-h-screen flex-col text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b-2 border-teal-700/80 bg-white/90 backdrop-blur-xl dark:border-teal-400/40 dark:bg-[#0b1517]/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/arduino" className="flex min-w-0 items-center gap-3" aria-label="Arduino eğitimi ana sayfası">
            <img src={logoImage} alt="" className="h-10 w-10 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block font-hero text-lg font-bold text-slate-900 dark:text-white">{arduinoTraining.title}</span>
              <span className="font-code block text-xs text-teal-700 dark:text-teal-300">{arduinoTraining.term}</span>
            </span>
          </Link>

          <Link
            to="/"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:text-teal-200"
          >
            <ArrowLeft size={15} />
            ROGOYATO
          </Link>

          <nav className="no-scrollbar -mx-1 flex w-full gap-1 overflow-x-auto px-1 sm:w-auto sm:flex-1 sm:justify-center md:order-0">
            {navLinks.map((item) => {
              const forceActive = item.match && pathname.startsWith(item.match)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'font-code shrink-0 rounded-md px-2.5 py-1.5 text-[0.8rem] transition sm:px-3 sm:text-sm',
                      isActive || forceActive
                        ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950'
                        : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      {/* The simulator takes the whole width; the other pages read better narrow. */}
      <main className={pathname === '/arduino/simulator' ? 'w-full flex-1 px-3 py-3 sm:px-4' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8'}>
        <Outlet />
      </main>

      <footer className="border-t-2 border-teal-700/80 bg-white/90 dark:border-teal-400/40 dark:bg-[#0b1517]/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Cpu size={15} className="text-teal-700 dark:text-teal-300" />
            ROGOYATO · TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/arduino"
              className="font-code rounded-md border border-teal-700/40 px-3 py-1.5 text-teal-800 transition hover:bg-teal-50 dark:border-teal-400/40 dark:text-teal-200 dark:hover:bg-teal-400/10"
            >
              Eğitim ana sayfası
            </Link>
            <Link
              to="/"
              className="font-code inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ArrowLeft size={14} />
              ROGOYATO ana sayfası
            </Link>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 shadow-xs transition hover:bg-slate-100 dark:border-white/15 dark:bg-[#10201f] dark:text-slate-100 dark:hover:bg-[#16302e]"
        aria-label="Tema değiştir"
        title="Tema değiştir"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        <span className="hidden sm:inline">{theme === 'dark' ? 'Açık' : 'Koyu'}</span>
      </button>
    </div>
  )
}
