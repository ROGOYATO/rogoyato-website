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
    <div className="min-h-screen text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-1 px-3 py-3 sm:gap-2 sm:px-6">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <button
        type="button"
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Tema değiştir"
        title="Tema değiştir"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        <span>{theme === 'dark' ? 'Açık' : 'Koyu'}</span>
      </button>

      <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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
