import { Rocket, ShieldCheck } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/hakkimizda', label: 'Hakkimizda' },
  { to: '/etkinlikler', label: 'Etkinlikler' },
  { to: '/ekip', label: 'Ekibimiz' },
  { to: '/basarilar', label: 'Basarilar' },
]

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(14,165,233,0.16),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(245,158,11,0.2),transparent_40%)]" />

      <header className="sticky top-0 z-30 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/20 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <Rocket size={18} />
            </div>
            <div>
              <p className="font-heading text-base leading-tight text-cyan-100">
                ROGOYATO
              </p>
              <p className="text-xs text-slate-300/90">Robotik ve Gomulu Yazilim</p>
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
                      ? 'bg-cyan-400/20 text-cyan-100'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
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

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>ROGOYATO • Robotik ve Gomulu Yazilim Toplulugu</p>
          <p className="inline-flex items-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            Etkinlik basvurulari etkinlik bazli acilir.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
