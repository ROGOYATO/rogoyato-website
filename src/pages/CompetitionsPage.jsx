import { motion } from 'framer-motion'
import { Award, Cpu, GraduationCap, Rocket, Target, Trophy, Users } from 'lucide-react'
import PageTitleHero from '../components/PageTitleHero'
import {
  achievementStats,
  competitionHighlights,
  participationHighlights,
  teamTracks,
  trainingRoadmap,
} from '../utils/siteData'
import achievementsHeroImage from '../../ornekbutonarkaplan.png'

const publicBase = import.meta.env.BASE_URL
const achievementVisuals = ['nav-achievements.svg', 'nav-events.svg', 'nav-about.svg']
const teamVisuals = ['nav-team.svg', 'nav-about.svg', 'nav-events.svg', 'nav-achievements.svg']

function trainingBadge(status) {
  if (status === 'Tamamlandı') {
    return 'border-emerald-300/45 bg-emerald-300/20 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-400/10 dark:text-emerald-100'
  }

  return 'border-amber-300/55 bg-amber-300/20 text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/10 dark:text-amber-100'
}

export default function CompetitionsPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageTitleHero title="Başarılar" imageSrc={achievementsHeroImage} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {achievementStats.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-900/72"
          >
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-2 font-heading text-4xl text-cyan-700 dark:text-cyan-200">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.note}</p>
          </article>
        ))}
      </section>

      <article className="rounded-2xl border border-cyan-200/70 bg-cyan-500/10 p-6 dark:border-cyan-300/25 dark:bg-cyan-400/10 sm:p-8">
        <h2 className="font-heading text-2xl text-cyan-900 dark:text-cyan-100">Performans Odaklı Üretim Yaklaşımı</h2>
        <p className="mt-3 text-cyan-900/90 dark:text-cyan-50/90">
          ROGOYATO, yarışma sonuçlarını tek başına bir hedef olarak değil; proje geliştirme, teknik raporlama,
          saha doğrulama ve ekip yönetimi becerilerinin ölçüldüğü bir süreç olarak ele alır. Bu yaklaşım sayesinde,
          farklı takım yapılarında paralel ilerleyen projelerle sürdürülebilir bir teknik üretim hattı kuruyoruz.
        </p>
      </article>

      {competitionHighlights.length === 0 ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 text-slate-600 dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300 sm:p-8">
          Başarı arşivi gerçek verilerle güncelleniyor. Yeni sonuçları bu alanda paylaşacağız.
        </article>
      ) : (
        <div className="grid gap-4">
          {competitionHighlights.map((item, index) => {
            const visual = `${publicBase}${achievementVisuals[index % achievementVisuals.length]}`

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-zinc-900/70"
              >
                <div className="flex flex-col sm:min-h-[320px] sm:flex-row">
                  <div className="relative h-52 sm:h-auto sm:w-1/3">
                    <img src={visual} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/55 via-zinc-900/20 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col p-6 sm:w-2/3 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/45 bg-fuchsia-400/15 px-3 py-1 text-xs text-fuchsia-700 dark:border-fuchsia-300/35 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
                        <Trophy size={14} />
                        {item.year}
                      </div>
                      <span className="rounded-full border border-amber-300/55 bg-amber-300/20 px-3 py-1 text-xs text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/10 dark:text-amber-100">
                        {item.result}
                      </span>
                    </div>

                    <h2 className="mt-4 font-heading text-2xl text-slate-900 dark:text-white sm:text-3xl">{item.title}</h2>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/55 bg-cyan-300/20 px-3 py-1 text-xs text-cyan-800 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100">
                        <Award size={13} />
                        Skor: {item.score}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/65 bg-slate-200/70 px-3 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                        <Target size={13} />
                        {item.stage}
                      </span>
                    </div>

                    <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/70 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Takımlar ve Proje Hatları</h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-300/20 px-3 py-1 text-xs text-cyan-800 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100">
            <Users size={13} />
            Çok takımlı üretim modeli
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {teamTracks.map((team, index) => (
            <article
              key={team.name}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-zinc-950/45"
            >
              <div className="flex min-h-[180px]">
                <div className="relative hidden w-2/5 md:block">
                  <img
                    src={`${publicBase}${teamVisuals[index % teamVisuals.length]}`}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-slate-900/15 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col justify-center p-5">
                  <h3 className="font-heading text-xl text-slate-900 dark:text-white">{team.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{team.focus}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/70 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/50 bg-indigo-300/20 px-3 py-1 text-xs text-indigo-700 dark:border-indigo-300/30 dark:bg-indigo-400/10 dark:text-indigo-100">
            <GraduationCap size={13} />
            Eğitim Yetkinliği
          </div>
          <h2 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">Dönemlik Teknik Eğitim Akışı</h2>

          <div className="mt-4 space-y-3">
            {trainingRoadmap.map((item) => (
              <div
                key={`${item.term}-${item.title}`}
                className="rounded-xl border border-slate-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-zinc-950/45"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.term}</p>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${trainingBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.title}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/70 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-300/20 px-3 py-1 text-xs text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            <Rocket size={13} />
            Katılım ve İvme
          </div>
          <h2 className="mt-3 font-heading text-2xl text-slate-900 dark:text-white">Saha Deneyimi</h2>

          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {participationHighlights.map((item) => (
              <li key={item} className="flex gap-3">
                <Cpu size={16} className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-cyan-300/45 bg-cyan-400/10 p-4 text-sm text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
            Sponsor iş birlikleriyle birlikte, takımların proje olgunluk seviyesi ve saha görünürlüğünü yeni dönemde daha
            da ileri taşımayı hedefliyoruz.
          </div>
        </article>
      </section>
    </motion.section>
  )
}
