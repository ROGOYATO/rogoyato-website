import { Moon, ShieldCheck, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import useTheme from './hooks/useTheme'

const navLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/etkinlikler', label: 'Etkinlikler' },
  { to: '/ekip', label: 'Ekibimiz' },
  { to: '/basarilar', label: 'Başarılar' },
]

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/85 backdrop-blur-xl dark:border-cyan-500/20 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-[0.95rem]">
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
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <button
        type="button"
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-3 py-2 text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:hover:bg-zinc-800"
        aria-label="Tema değiştir"
        title="Tema değiştir"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        <span className="hidden sm:inline">{theme === 'dark' ? 'Açık' : 'Koyu'}</span>
      </button>

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>ROGOYATO • Robotik ve Gömülü Yazılım Topluluğu</p>
          <p className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} />
            Etkinlik başvuruları etkinlik bazlı açılır.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
