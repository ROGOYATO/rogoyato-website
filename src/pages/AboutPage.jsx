import { motion } from 'framer-motion'
import { Bot, Download, GraduationCap, Rocket, Trophy, Users } from 'lucide-react'
import PageTitleHero from '../components/PageTitleHero'
import aboutHeroImage from '../assets/heroes/about-hero.png'

const publicBase = import.meta.env.BASE_URL

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

      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-900/70 sm:p-8">
        <h2 className="font-heading text-3xl text-slate-900 dark:text-white">Kurumsal Kimlik</h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-slate-700 dark:text-slate-300">
          ROGOYATO'nun resmi logolarını aşağıdan inceleyebilir ve tasarımlarınızda, belgelerinizde kullanmak üzere vektörel (SVG) formatta indirebilirsiniz.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <img src={`${publicBase}branding/yatay_beyaz.png`} alt="Yatay Beyaz Logo" className="h-14 w-full object-contain" />
            <a href={`${publicBase}branding/SVG/yatay_beyaz.svg`} download="ROGOYATO_Yatay_Beyaz.svg" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
              <Download size={16} />
              SVG İndir
            </a>
          </div>
          
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <img src={`${publicBase}branding/yatay_siyah.png`} alt="Yatay Siyah Logo" className="h-14 w-full object-contain" />
            <a href={`${publicBase}branding/SVG/yatay_siyah.svg`} download="ROGOYATO_Yatay_Siyah.svg" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              <Download size={16} />
              SVG İndir
            </a>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <img src={`${publicBase}branding/kare_beyaz.png`} alt="Kare Beyaz Logo" className="h-20 w-full object-contain" />
            <a href={`${publicBase}branding/SVG/kare_beyaz.svg`} download="ROGOYATO_Kare_Beyaz.svg" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
              <Download size={16} />
              SVG İndir
            </a>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <img src={`${publicBase}branding/kare_siyah.png`} alt="Kare Siyah Logo" className="h-20 w-full object-contain" />
            <a href={`${publicBase}branding/SVG/kare_siyah.svg`} download="ROGOYATO_Kare_Siyah.svg" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              <Download size={16} />
              SVG İndir
            </a>
          </div>
        </div>
      </section>
    </motion.section>
  )
}
