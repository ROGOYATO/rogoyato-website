import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const primaryLinks = [
  { to: '/etkinlikler', label: 'Etkinlikler', desc: 'Yaklaşan ve geçmiş etkinlikler' },
  { to: '/ekip', label: 'Ekibimiz', desc: 'Kişi kartları ve ekip yapısı' },
  { to: '/hakkimizda', label: 'Hakkımızda', desc: 'Topluluk modeli ve kurumsal kimlik' },
  { to: '/basarilar', label: 'Başarılar', desc: 'Yarışma ve proje çıktısı arşivi' },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="border-b border-slate-200 pb-8 dark:border-slate-800"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <img
            src="/favicon.png"
            alt="TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu logosu"
            className="h-20 w-20 rounded-lg border border-slate-200 bg-white object-contain p-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <div>
            <h1 className="font-heading text-3xl leading-tight text-slate-900 dark:text-white sm:text-4xl">
              TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300 sm:text-lg">
              Ana sayfa, içeriklere yönlendiren sade bir merkezdir. Etkinlik başvuruları,
              ilgili etkinliğin kendi sayfasında açılır.
            </p>
          </div>
        </div>
      </motion.section>

      <section className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Hızlı geçiş</h2>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {primaryLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between gap-3 py-4 transition hover:text-slate-900 dark:hover:text-white"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
              </div>
              <ArrowRight size={16} className="text-slate-500 dark:text-slate-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
