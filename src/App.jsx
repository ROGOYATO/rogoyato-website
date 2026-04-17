import { Moon, Rocket, ShieldCheck, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import useTheme from './hooks/useTheme'

const navLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/hakkimizda', label: 'Hakkimizda' },
  { to: '/etkinlikler', label: 'Etkinlikler' },
  { to: '/ekip', label: 'Ekibimiz' },
  { to: '/basarilar', label: 'Basarilar' },
]

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(251,191,36,0.22),transparent_40%)] dark:bg-[radial-gradient(circle_at_10%_15%,rgba(14,165,233,0.16),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(245,158,11,0.2),transparent_40%)]" />

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/85 backdrop-blur-xl dark:border-cyan-500/20 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-700 shadow-[0_0_24px_rgba(56,189,248,0.28)] dark:bg-cyan-400/20 dark:text-cyan-200 dark:shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <Rocket size={18} />
            </div>
            <div>
              <p className="font-heading text-base leading-tight text-cyan-800 dark:text-cyan-100">
                ROGOYATO
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300/90">Robotik ve Gomulu Yazilim</p>
            </div>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2 text-sm sm:text-[0.95rem]">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-3 py-2 transition',
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-100'
                      : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="Tema degistir"
              title="Tema degistir"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>ROGOYATO • Robotik ve Gomulu Yazilim Toplulugu</p>
          <p className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} />
            Etkinlik basvurulari etkinlik bazli acilir.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
