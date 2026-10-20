import { arduinoMaterials } from '../../utils/arduinoTraining'
import { Breadcrumb, Bullets, Label, Panel } from './ArduinoParts'

export default function ArduinoMaterialsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb current="Malzemeler" />

      <header>
        <Label>Öğrenci başına donanım</Label>
        <h1 className="mt-1 font-hero text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl">Malzeme listesi</h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Eğitim boyunca ve yarışmada her öğrencinin kullanacağı parçalar.
        </p>
      </header>

      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">Başlangıç seti</h2>
          <span className="font-code text-xs text-slate-500 dark:text-slate-400">{arduinoMaterials.starterKit.length} kalem</span>
        </div>
        <div className="mt-4">
          <Bullets items={arduinoMaterials.starterKit} className="grid gap-x-8 gap-y-2.5 md:grid-cols-2" />
        </div>
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
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{item.name}</td>
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
          <h2 className="font-hero text-xl font-bold text-slate-900 dark:text-white">2WD robot kitinin içeriği</h2>
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
