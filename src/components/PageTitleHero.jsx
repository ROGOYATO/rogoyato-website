import heroPhoto from '../../ornekbutonarkaplan.png'

export default function PageTitleHero({ title }) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/70 shadow-[0_18px_64px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-slate-900/65">
      <img
        src={heroPhoto}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2.2px]"
      />
      <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/55" />
      <div className="relative flex min-h-[170px] items-center justify-center px-6 py-10 sm:min-h-[210px]">
        <h1 className="font-heading text-center text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
      </div>
    </header>
  )
}
