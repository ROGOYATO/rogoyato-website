import { motion } from 'framer-motion'
import { Bot, GraduationCap, Rocket, Trophy, Users } from 'lucide-react'
import PageTitleHero from '../components/PageTitleHero'
import aboutHeroImage from '../assets/heroes/about-hero.png'

export default function AboutPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Hakkımızda" imageSrc={aboutHeroImage} />

      <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-900/70 sm:p-8">
        <h2 className="font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">Hakkımızda</h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-slate-700 dark:text-slate-300">
          TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu olarak hedefimiz, teori ile pratiği aynı masada buluşturmak.
          Üyelerimizin yalnızca kod yazan değil; problem tanımlayan, sistem kuran, test eden ve sahada uygulayan
          mühendislik refleksi kazanmasını önceliklendiriyoruz.
        </p>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-slate-700 dark:text-slate-300">
          4 Ekim 2023'ten bu yana farklı mühendislik disiplinlerinden öğrencileri bir araya getirerek eğitim,
          proje üretimi ve yarışma hazırlığını aynı çatı altında sürdürüyoruz. Amacımız, üyelerimize yalnızca
          teorik bilgi değil; ekip çalışması, uygulama disiplini ve sahada problem çözme yetkinliği kazandırmak.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/70">
          <div className="inline-flex rounded-full border border-cyan-300/60 bg-cyan-300/20 p-2 text-cyan-800 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-200">
            <Trophy size={16} />
          </div>
          <h3 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">Yarışma Odağı</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            TEKNOFEST ve benzeri yarışma süreçlerinde, raporlama disiplini ile teknik üretimi birlikte ilerletiyoruz.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/70">
          <div className="inline-flex rounded-full border border-indigo-300/60 bg-indigo-300/20 p-2 text-indigo-800 dark:border-indigo-300/35 dark:bg-indigo-400/10 dark:text-indigo-200">
            <GraduationCap size={16} />
          </div>
          <h3 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">Eğitim Hattı</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Kampüs içinde uygulamalı Arduino, PCB, Cesium ve ROS odaklı eğitimlerle teknik tabanı güçlendiriyoruz.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/70">
          <div className="inline-flex rounded-full border border-emerald-300/60 bg-emerald-300/20 p-2 text-emerald-800 dark:border-emerald-300/35 dark:bg-emerald-400/10 dark:text-emerald-200">
            <Users size={16} />
          </div>
          <h3 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">Takım Yapısı</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Çok takımlı proje modeliyle üyeler, farklı teknik rollerde sorumluluk alarak gerçek ekip deneyimi kazanıyor.
          </p>
        </article>
      </section>

      <article className="rounded-3xl border border-cyan-300/40 bg-cyan-500/10 p-6 dark:border-cyan-300/25 dark:bg-cyan-400/10 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-cyan-900 dark:text-cyan-100">
          <Bot size={18} />
          <Rocket size={18} />
          <span className="text-xs uppercase tracking-[0.08em]">Saha ve Atölye Pratiği</span>
        </div>
        <p className="mt-3 text-cyan-900/90 dark:text-cyan-50/90">
          ROGOYATO'da süreç, fikirden prototipe ve prototipten yarışma sahasına uzanır. Kulüp içi üretim ritmi,
          eğitimler ve takım çalışmasıyla birleşerek her dönem daha olgun proje çıktıları üretmeyi amaçlar.
        </p>
      </article>
    </motion.section>
  )
}
