import { Printer } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import logoDarkImage from '../assets/logo-dark.webp'
import logoImage from '../assets/logo.webp'
import { lineRobotCompetition as competition } from '../utils/lineRobotCompetition'

const publicBase = import.meta.env.BASE_URL

// The page's tabs; the open one is kept in the address (?bolum=…) so a link
// can point straight at the regulation.
const TABS = [
  ['genel', 'Genel Bilgi'],
  ['tarihler', 'Önemli Tarihler'],
  ['program', 'Yarış Günü Programı'],
  ['sartname', 'Yarışma Şartnamesi'],
  ['malzemeler', 'Malzemeler'],
  ['oduller', 'Ödüller'],
  ['sss', 'Sıkça Sorulan Sorular'],
  ['iletisim', 'İletişim'],
]

const cell = 'border-b border-slate-200 px-4 py-3 align-top dark:border-white/10'
const headCell = 'border-b-2 border-slate-800 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-white/40 dark:text-slate-300'

function TabTitle({ children }) {
  return <h2 className="border-b border-slate-200 pb-3 font-heading text-2xl text-slate-900 dark:border-white/10 dark:text-white">{children}</h2>
}

function General() {
  const rows = [
    ['Düzenleyen', competition.organizer],
    ['Yarış günü', '28 Kasım 2026 Cumartesi'],
    ['Yer', 'Duyurulacak (TOBB ETÜ kampüsü)'],
    ['Parkur', 'Duyurulacak'],
    ['Katılım', 'Arduino Eğitimi katılımcıları; bireysel ya da en fazla 3 kişilik takım'],
    ['Robot hazırlığı', 'Yarış gününe kadar, katılımcıların kendi zamanında'],
    ['Teknik danışma', '28 Kasım, 10:00–14:45, yarış alanında'],
    ['Sıralama turları', '28 Kasım, 15:00'],
    ['Başvuru', competition.applicationUrl ? 'Google Form ile (aşağıdaki bağlantıdan)' : 'Google Form ile; bağlantı yakında bu sayfada paylaşılacak'],
    ['Ödül sponsoru', competition.sponsor],
  ]
  return (
    <>
      <TabTitle>Genel Bilgi</TabTitle>
      <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">{competition.summary}</p>
      <table className="mt-6 w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row" className={`${cell} w-28 text-left sm:w-44 font-semibold text-slate-900 dark:text-white`}>
                {label}
              </th>
              <td className={`${cell} text-slate-700 dark:text-slate-300`}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 border-l-4 border-slate-800 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-700 dark:border-white/50 dark:bg-white/5 dark:text-slate-300">
        <p className="font-semibold text-slate-900 dark:text-white">Önemli</p>
        <p className="mt-1">
          Robotlar yarış gününden önce, katılımcıların kendi zamanında hazırlanır; yarış gününe tamamlanmış robotla gelinir. Yarış günü 10:00–14:45 arasında eğitmenlere teknik sorular sorulabilir ve deneme sürüşü yapılabilir. Eğitmenler kod
          yazmaz, taktik vermez.
        </p>
      </div>
    </>
  )
}

function Dates() {
  return (
    <>
      <TabTitle>Önemli Tarihler</TabTitle>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr>
            <th className={`${headCell} w-48`}>Tarih</th>
            <th className={headCell}>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          {competition.timeline.map((step) => (
            <tr key={step.title}>
              <td className={`${cell} whitespace-nowrap font-semibold text-slate-900 dark:text-white`}>{step.when}</td>
              <td className={cell}>
                <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300">{step.text}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Programme() {
  return (
    <>
      <TabTitle>Yarış Günü Programı</TabTitle>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">28 Kasım 2026 Cumartesi · Yer duyurulacak</p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr>
            <th className={`${headCell} w-36`}>Saat</th>
            <th className={headCell}>Etkinlik</th>
          </tr>
        </thead>
        <tbody>
          {competition.dayPlan.map((slot) => (
            <tr key={slot.time}>
              <td className={`${cell} whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white`}>{slot.time}</td>
              <td className={cell}>
                <p className="font-semibold text-slate-900 dark:text-white">{slot.title}</p>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300">{slot.text}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Regulation() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10">
        <h2 className="font-heading text-2xl text-slate-900 dark:text-white">Yarışma Şartnamesi</h2>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10 print:hidden"
        >
          <Printer size={15} />
          Yazdır / PDF olarak kaydet
        </button>
      </div>
      <p className="mt-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
        {competition.organizer}
        <br />
        {competition.title} {competition.edition} Şartnamesi
      </p>
      <div className="mt-6 space-y-6">
        {competition.rules.map((section, index) => (
          <section key={section.title} className="break-inside-avoid">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Madde {index + 1} – {section.title}
            </h3>
            <ol className="mt-2 space-y-1.5">
              {section.items.map((item, itemIndex) => (
                <li key={item} className="grid grid-cols-[2.5rem_1fr] text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300">
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
                    {index + 1}.{itemIndex + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <section>
          <h3 className="font-semibold text-slate-900 dark:text-white">Ek – Robot malzemeleri</h3>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300">{competition.materials.join(', ')}.</p>
        </section>
      </div>
    </>
  )
}

function Materials() {
  return (
    <>
      <TabTitle>Malzemeler</TabTitle>
      <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
        Robot yalnızca aşağıdaki gerekli malzemelerle kurulur (Şartname, Madde 3). Önerilen malzemeler zorunlu değildir; hazırlıkta ve yarış günü işinizi kolaylaştırır.
      </p>
      <h3 className="mt-6 font-semibold text-slate-900 dark:text-white">Gerekli malzemeler</h3>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr>
            <th className={headCell}>Malzeme</th>
            <th className={`${headCell} w-36`}>Adet</th>
          </tr>
        </thead>
        <tbody>
          {competition.requiredMaterials.map((item) => (
            <tr key={item.name}>
              <td className={`${cell} text-slate-800 dark:text-slate-200`}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-400 underline-offset-2 hover:decoration-slate-900 dark:hover:decoration-white">
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </td>
              <td className={`${cell} text-slate-700 dark:text-slate-300`}>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="mt-8 font-semibold text-slate-900 dark:text-white">Önerilen malzemeler</h3>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr>
            <th className={headCell}>Malzeme</th>
            <th className={headCell}>Neden</th>
          </tr>
        </thead>
        <tbody>
          {competition.recommendedMaterials.map((item) => (
            <tr key={item.name}>
              <td className={`${cell} w-2/5 text-slate-800 dark:text-slate-200`}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-400 underline-offset-2 hover:decoration-slate-900 dark:hover:decoration-white">
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </td>
              <td className={`${cell} text-slate-600 dark:text-slate-300`}>{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">Bağlantılar, eğitim setinin alındığı Elektronikport’taki ürün ve kategori sayfalarına gider.</p>
    </>
  )
}

function Prizes() {
  return (
    <>
      <TabTitle>Ödüller</TabTitle>
      <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">İlk üç dereceye kupa verilir. {competition.prizeNote}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {competition.prizes.map((prize) => (
          <figure key={prize.place} className="border border-slate-200 dark:border-white/10">
            <div className="flex h-60 items-end justify-center bg-slate-50 p-4 dark:bg-white/5">
              <img src={`${publicBase}${prize.image}`} alt={`${prize.trophy} kupası`} className="h-full w-auto object-contain" />
            </div>
            <figcaption className="border-t border-slate-200 px-4 py-3 dark:border-white/10">
              <p className="font-semibold text-slate-900 dark:text-white">{prize.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {prize.trophy} kupası, {prize.base.toLocaleLowerCase('tr')}, {prize.height}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}

function Faq() {
  return (
    <>
      <TabTitle>Sıkça Sorulan Sorular</TabTitle>
      <dl className="mt-4">
        {competition.faq.map((item) => (
          <div key={item.q} className="border-b border-slate-200 py-4 dark:border-white/10">
            <dt className="font-semibold text-slate-900 dark:text-white">{item.q}</dt>
            <dd className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">{item.a}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

function Contact() {
  return (
    <>
      <TabTitle>İletişim</TabTitle>
      <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
        Yarışmayla ilgili sorularınızı eğitim WhatsApp grubundan ya da aşağıdaki kanallardan iletebilirsiniz.
      </p>
      <table className="mt-6 w-full text-sm">
        <tbody>
          <tr>
            <th scope="row" className={`${cell} w-28 text-left sm:w-44 font-semibold text-slate-900 dark:text-white`}>
              Düzenleyen
            </th>
            <td className={`${cell} text-slate-700 dark:text-slate-300`}>{competition.organizer}</td>
          </tr>
          {competition.contact.map((item) => (
            <tr key={item.label}>
              <th scope="row" className={`${cell} text-left font-semibold text-slate-900 dark:text-white`}>
                {item.label}
              </th>
              <td className={cell}>
                <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-slate-900 underline underline-offset-2 dark:text-white">
                  {item.value}
                </a>
              </td>
            </tr>
          ))}
          <tr>
            <th scope="row" className={`${cell} text-left font-semibold text-slate-900 dark:text-white`}>
              Ödül sponsoru
            </th>
            <td className={`${cell} text-slate-700 dark:text-slate-300`}>{competition.sponsor}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

const PANELS = { genel: General, tarihler: Dates, program: Programme, sartname: Regulation, malzemeler: Materials, oduller: Prizes, sss: Faq, iletisim: Contact }

export default function LineRobotCompetitionPage() {
  const [params, setParams] = useSearchParams()
  const active = PANELS[params.get('bolum')] ? params.get('bolum') : 'genel'
  const Panel = PANELS[active]
  const open = (id) => setParams(id === 'genel' ? {} : { bolum: id }, { replace: true })

  return (
    <div className="space-y-6">
      <nav aria-label="Konum" className="text-sm text-slate-500 dark:text-slate-400 print:hidden">
        <Link to="/etkinlikler" className="hover:text-slate-900 hover:underline dark:hover:text-white">
          Etkinlikler
        </Link>
        <span className="mx-2">/</span>
        <span>{competition.title}</span>
      </nav>

      {/* Title block. */}
      <header className="border-t-4 border-slate-900 bg-white px-6 py-6 dark:border-white dark:bg-zinc-900/80 sm:px-8 print:border-0 print:px-0">
        <div className="flex flex-wrap items-center gap-5">
          <img src={logoImage} alt="ROGOYATO logosu" className="h-16 w-16 shrink-0 dark:hidden" />
          <img src={logoDarkImage} alt="ROGOYATO logosu" className="hidden h-16 w-16 shrink-0 dark:block" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{competition.organizer}</p>
            <h1 className="mt-1 font-heading text-3xl text-slate-900 dark:text-white sm:text-4xl">
              {competition.title} <span className="text-slate-400">·</span> {competition.edition}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">28 Kasım 2026 Cumartesi · Yer duyurulacak · Bireysel veya en fazla 3 kişilik takım</p>
          </div>
          {/* The entry form, once it is out. */}
          {competition.applicationUrl ? (
            <a href={competition.applicationUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 print:hidden">
              Başvuru formu
            </a>
          ) : (
            <p className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-white/20 dark:text-slate-300 print:hidden">Başvuru formu yakında</p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
        {/* Tabs: a column on the left on wide screens, a scrolling row on phones. */}
        <nav aria-label="Yarışma bölümleri" className="min-w-0 print:hidden">
          <ul role="tablist" aria-orientation="vertical" className="flex gap-1 overflow-x-auto border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/80 lg:sticky lg:top-24 lg:flex-col lg:gap-0 lg:overflow-visible lg:py-1">
            {TABS.map(([id, label]) => {
              const selected = id === active
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => open(id)}
                    className={`w-full whitespace-nowrap px-4 py-2.5 text-left text-sm transition lg:border-l-2 ${
                      selected
                        ? 'border-b-2 border-slate-900 font-semibold text-slate-900 dark:border-white dark:text-white lg:border-b-0 lg:bg-slate-100 dark:lg:bg-white/10'
                        : 'border-b-2 border-transparent text-slate-600 lg:border-l-transparent hover:text-slate-900 dark:text-slate-300 dark:hover:text-white lg:border-b-0 lg:hover:bg-slate-50 dark:lg:hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section role="tabpanel" className="min-w-0 border border-slate-200 bg-white px-5 py-6 dark:border-white/10 dark:bg-zinc-900/80 sm:px-8 print:border-0 print:p-0">
          <Panel />
        </section>
      </div>
    </div>
  )
}
