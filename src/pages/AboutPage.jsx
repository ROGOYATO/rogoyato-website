import { motion } from 'framer-motion'

const values = [
  {
    title: 'Uretim odakli topluluk',
    text: 'Sadece etkinlik duzenlemek yerine prototip ve teknik cikti olusturan bir yapi.',
  },
  {
    title: 'Donem ritmine uygun tempo',
    text: 'Yilda onlarca etkinlik yerine donemsel 3-4 nitelikli program ve olceklenebilir format.',
  },
  {
    title: 'Acik ve adil basvuru sureci',
    text: 'Universitelerarasi ve okul ici programlarda kosullar net, degerlendirme seffaf.',
  },
]

export default function AboutPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Topluluk Profili</p>
        <h1 className="mt-3 font-heading text-3xl text-white sm:text-4xl">Hakkimizda</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          ROGOYATO, robotik ve gomulu yazilim alanlarinda uretim odakli ekipler kurar,
          teknik gelisimi destekleyen etkinlikler duzenler ve universitelararasi formatlarda
          is birligi agi olusturur.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {values.map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
            <h2 className="font-heading text-xl text-white">{item.title}</h2>
            <p className="mt-2 text-slate-300">{item.text}</p>
          </article>
        ))}
      </div>

      <article className="rounded-3xl border border-cyan-300/25 bg-cyan-400/10 p-6 sm:p-8">
        <h2 className="font-heading text-2xl text-cyan-100">Calisma modeli</h2>
        <p className="mt-3 text-cyan-50/90">
          Platform normalde portal formatinda calisir. Basvuru gerektiren bir etkinlik acildiginda,
          o etkinlige ozel landing sayfasi ve basvuru kosullari aktiflestirilir. Etkinlik bitince
          sayfa arsive alinip yarisma/etkinlik gecmisi olarak korunur.
        </p>
      </article>
    </motion.section>
  )
}
