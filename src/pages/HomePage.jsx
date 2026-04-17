import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const primaryLinks = [
  { to: '/etkinlikler', label: 'Etkinlikler', desc: 'Yaklasan ve gecmis etkinlikler' },
  { to: '/ekip', label: 'Ekibimiz', desc: 'Birimler ve ekip yapisi' },
  { to: '/hakkimizda', label: 'Hakkimizda', desc: 'Topluluk modeli ve kurumsal kimlik' },
  { to: '/basarilar', label: 'Basarilar', desc: 'Yarisma ve proje ciktisi arsivi' },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-[0_18px_72px_rgba(2,132,199,0.16)] sm:p-8"
      >
        <h1 className="font-heading text-3xl leading-tight text-white sm:text-5xl">
          ROGOYATO ana merkez
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300 sm:text-lg">
          Bu sayfa sade bir yonlendirme alanidir. Etkinlik, ekip, hakkimizda ve basarilar
          icerikleri ayri sayfalarda yonetilir. Basvuru gerektiren etkinliklerde "Etkinlige basvur"
          adimi etkinlik detayindan acilir.
        </p>
      </motion.section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
        <h2 className="font-heading text-2xl text-white">Sayfa yonlendirmeleri</h2>
        <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-slate-950/60">
          {primaryLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-white/5"
            >
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-slate-300">{item.desc}</p>
              </div>
              <ArrowRight size={16} className="text-cyan-200" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
