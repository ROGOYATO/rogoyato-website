import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const steps = [
  'Toplulugu ve birimleri incele',
  'Kisa motivasyon ve ilgi alanini paylas',
  'Birim gorusmesi ve uyum degerlendirmesi',
  'Oryantasyon ve ekip atamasi',
]

export default function JoinPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Uyelik Programi</p>
        <h1 className="mt-2 font-heading text-3xl text-white sm:text-4xl">Topluluga Katil</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Uye alim sureci donem bazli acilir. Teknik birimlere gore yerlesim yapilir ve yeni
          uyeler proje akisina kontrollu sekilde dahil edilir.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
        <h2 className="font-heading text-2xl text-white">Uyelik adimlari</h2>
        <div className="mt-4 grid gap-3">
          {steps.map((step, index) => (
            <article key={step} className="rounded-xl border border-white/10 bg-slate-950/65 p-4">
              <p className="inline-flex items-center gap-2 text-cyan-200">
                <CheckCircle2 size={16} />
                Adim {index + 1}
              </p>
              <p className="mt-1 text-slate-200">{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5">
        <h2 className="font-heading text-xl text-amber-100">Basvuru formu</h2>
        <p className="mt-2 text-amber-50/90">
          Bu taslak surumde form baglantisi ornek olarak bir kanal uzerinden verilir. Canliya
          geciste Google Forms veya ozel form endpointi ile degistirilebilir.
        </p>
        <a
          href="https://forms.gle/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/45 bg-amber-200/20 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-200/30"
        >
          Uyelik formunu ac
          <ArrowRight size={16} />
        </a>
      </section>
    </motion.section>
  )
}
