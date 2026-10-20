import { ExternalLink } from 'lucide-react'
import { arduinoMaterials } from '../../utils/arduinoTraining'
import { Breadcrumb, Bullets, Label, Panel, ShopLink } from './ArduinoParts'

function KitLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-code inline-flex items-center gap-1.5 rounded-md border border-teal-700/40 px-2.5 py-1 text-xs text-teal-800 transition hover:bg-teal-50 dark:border-teal-400/40 dark:text-teal-200 dark:hover:bg-teal-400/10"
    >
      {children}
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  )
}

export default function ArduinoMaterialsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb current="Malzemeler" />

      <header>
        <Label>Öğrenci başına donanım</Label>
        <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl">Malzeme listesi</h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Eğitim boyunca ve yarışmada her öğrencinin kullanacağı parçalar. Altı çizili adlar Elektronikport’taki ürün veya kategori sayfasına gider.
        </p>
      </header>

      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">Başlangıç seti</h2>
          <div className="flex items-center gap-3">
            <span className="font-code text-xs text-slate-500 dark:text-slate-400">{arduinoMaterials.starterKit.length} kalem</span>
            <KitLink href={arduinoMaterials.starterKitUrl}>Süper Başlangıç Seti</KitLink>
          </div>
        </div>
        <div className="mt-4">
          <Bullets items={arduinoMaterials.starterKit} className="grid gap-x-8 gap-y-2.5 md:grid-cols-2" />
        </div>
        <p className="mt-5 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
          Eğitimde kullanılmadığı için setten çıkarılan parçalar: {arduinoMaterials.starterKitRemoved.join(', ')}.
        </p>
      </Panel>

      <Panel>
        <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">Ayrıca alınan parçalar</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead>
              <tr className="font-code border-b border-slate-300 text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-white/15 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">Ürün</th>
                <th className="py-2 pr-4 font-semibold">Adet</th>
                <th className="py-2 font-semibold">Programdaki kullanımı</th>
              </tr>
            </thead>
            <tbody>
              {arduinoMaterials.extras.map((item) => (
                <tr key={item.name} className="border-b border-slate-200 last:border-0 dark:border-white/10">
                  <td className="py-3 pr-4 font-semibold">
                    <ShopLink href={item.url}>{item.name}</ShopLink>
                  </td>
                  <td className="font-code py-3 pr-4 text-teal-700 dark:text-teal-300">{item.count}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{item.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">2WD robot kitinin içeriği</h2>
            <KitLink href={arduinoMaterials.robotKitUrl}>2WD robot kiti</KitLink>
          </div>
          <div className="mt-4">
            <Bullets items={arduinoMaterials.robotKit} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{arduinoMaterials.robotKitNote}</p>
        </Panel>
        <Panel>
          <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">Sarf ve yardımcı malzemeler</h2>
          <div className="mt-4">
            <Bullets items={arduinoMaterials.consumables} />
          </div>
        </Panel>
      </div>
    </div>
  )
}
