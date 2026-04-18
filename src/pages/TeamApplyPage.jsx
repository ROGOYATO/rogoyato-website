import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/PageTitleHero'

export default function TeamApplyPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <Link
        to="/ekip"
        className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
      >
        <ArrowLeft size={16} />
        Ekibimiz sayfasına dön
      </Link>

      <PageTitleHero title="Ekibe Başvuru" />

      <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/10 dark:bg-zinc-900/65 sm:p-7">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Başvuru Formu (Taslak)</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Bu alanı sonraki adımda resmi başvuru sürecine göre netleştirebiliriz.
        </p>

        <form className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Ad Soyad
            <input
              type="text"
              placeholder="Adınızı yazın"
              className="mt-1 w-full rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-white/15 dark:bg-zinc-950/70 dark:text-white"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-200">
            E-posta
            <input
              type="email"
              placeholder="ornek@mail.com"
              className="mt-1 w-full rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-white/15 dark:bg-zinc-950/70 dark:text-white"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
            Teknik İlgi Alanı
            <input
              type="text"
              placeholder="Gömülü, PCB, mekanik vb."
              className="mt-1 w-full rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-white/15 dark:bg-zinc-950/70 dark:text-white"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
            Kısa Not
            <textarea
              rows="4"
              placeholder="Neden ekibe katılmak istediğinizi yazın"
              className="mt-1 w-full rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-white/15 dark:bg-zinc-950/70 dark:text-white"
            />
          </label>

          <button
            type="button"
            className="rounded-full border border-emerald-300 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-200 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-100 dark:hover:bg-emerald-300/25"
          >
            Başvuruyu Gönder (Demo)
          </button>
        </form>
      </section>
    </motion.section>
  )
}
