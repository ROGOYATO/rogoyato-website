import { forwardRef } from 'react'

const files = (name) => `${import.meta.env.BASE_URL}lisanslar/${name}`
const TOOLS_COMMIT = '8c563b189cacc9953ee20fa51fad1a80da75673d'

// Everything the simulator ships to the browser that someone else wrote.
const COMPONENTS = [
  {
    name: 'GCC 7.3.0 + Arduino AVR yamaları',
    role: 'C++ ve C derleyicileri (cc1plus, cc1), WebAssembly',
    license: 'GPL-3.0-or-later',
    text: 'GPL-3.0.txt',
    sources: [
      ['gcc-7.3.0', 'https://ftp.gnu.org/gnu/gcc/gcc-7.3.0/gcc-7.3.0.tar.xz'],
      ['Arduino yaması', 'https://raw.githubusercontent.com/arduino/toolchain-avr/368b87a73e3677071fa44f2182c1ea4cc6a90557/avr-gcc-patches/atmel-patches-gcc.7.3.0-arduino2.patch'],
      ['sitenin yaması', 'https://github.com/ROGOYATO/rogoyato-website/blob/main/scripts/wasm-patches/gcc/avr-builtin-no-operands.patch'],
    ],
  },
  {
    name: 'GNU binutils 2.42',
    role: 'avr-as, avr-ld, avr-objcopy, WebAssembly',
    license: 'GPL-3.0-or-later',
    text: 'GPL-3.0.txt',
    sources: [['binutils-2.42', 'https://ftp.gnu.org/gnu/binutils/binutils-2.42.tar.xz']],
  },
  {
    name: 'GMP 6.1.0, MPFR 3.1.4, MPC 1.0.3',
    role: 'derleyicinin içindeki sayı kütüphaneleri',
    license: 'LGPL-3.0-or-later',
    text: 'LGPL-3.0.txt',
    sources: [
      ['gmp', 'https://ftp.gnu.org/gnu/gmp/gmp-6.1.0.tar.bz2'],
      ['mpfr', 'https://ftp.gnu.org/gnu/mpfr/mpfr-3.1.4.tar.bz2'],
      ['mpc', 'https://ftp.gnu.org/gnu/mpc/mpc-1.0.3.tar.gz'],
    ],
  },
  {
    name: 'WebAssembly derleme betikleri',
    role: 'yukarıdaki araçları kaynaktan WebAssembly’e derler',
    license: 'jeffrey-braam/arduino-ide',
    sources: [
      ['toolchain/build.sh', `https://github.com/jeffrey-braam/arduino-ide/tree/${TOOLS_COMMIT}/toolchain`],
      ['build-wasm-gcc.sh', 'https://github.com/ROGOYATO/rogoyato-website/blob/main/scripts/build-wasm-gcc.sh'],
    ],
  },
  {
    name: 'libgcc',
    role: 'derleyicinin çalışma zamanı kütüphanesi',
    license: 'GPL-3.0 + GCC Runtime Library Exception 3.1',
    text: 'GCC-exception-3.1.txt',
  },
  {
    name: 'avr-libc 2.0.0',
    role: 'C kütüphanesi ve AVR başlık dosyaları',
    license: 'Modified BSD',
    text: 'avr-libc.txt',
    sources: [['avr-libc', 'https://github.com/avrdudes/avr-libc']],
  },
  {
    name: 'Arduino AVR çekirdeği 1.8.8',
    role: 'Arduino.h, Serial, digitalWrite… (önceden derlenmiş)',
    license: 'LGPL-2.1-or-later',
    text: 'LGPL-2.1.txt',
    sources: [['ArduinoCore-avr 1.8.8', 'https://github.com/arduino/ArduinoCore-avr/tree/1.8.8']],
  },
  {
    name: 'Wire, SPI, SoftwareSerial, EEPROM, HID',
    role: 'AVR kartlarıyla gelen kütüphaneler (gerekince indirilir)',
    license: 'LGPL-2.1-or-later',
    text: 'LGPL-2.1.txt',
    sources: [['ArduinoCore-avr 1.8.8 libraries', 'https://github.com/arduino/ArduinoCore-avr/tree/1.8.8/libraries']],
  },
  {
    name: 'Arduino Library Manager kütüphaneleri',
    role: 'kodda #include edilen diğer kütüphaneler; tarayıcınız downloads.arduino.cc’den indirir',
    license: 'her biri kendi lisansıyla',
    sources: [['Library Manager listesi', 'https://downloads.arduino.cc/libraries/library_index.json.gz']],
  },
  {
    name: 'Servo 1.3.0',
    role: 'Servo kütüphanesi (önceden derlenmiş)',
    license: 'LGPL-2.1-or-later',
    text: 'LGPL-2.1.txt',
    sources: [['Servo', 'https://github.com/arduino-libraries/Servo/tree/1.3.0']],
  },
  {
    name: 'DHT sensor library 1.4.7',
    role: 'DHT11 kütüphanesi (önceden derlenmiş)',
    license: 'MIT',
    text: 'DHT-sensor-library-MIT.txt',
    sources: [['DHT-sensor-library', 'https://github.com/adafruit/DHT-sensor-library/tree/1.4.7']],
  },
  {
    name: 'Adafruit Unified Sensor 1.1.15',
    role: 'DHT kütüphanesinin bağımlılığı',
    license: 'Apache-2.0',
    text: 'Apache-2.0.txt',
    sources: [['Adafruit_Sensor', 'https://github.com/adafruit/Adafruit_Sensor/tree/1.1.15']],
  },
  {
    name: 'avr8js 0.21.1',
    role: 'ATmega328P işlemci emülatörü',
    license: 'MIT',
    text: 'avr8js-MIT.txt',
    sources: [['wokwi/avr8js', 'https://github.com/wokwi/avr8js']],
  },
  {
    name: 'three.js 0.181',
    role: '3D tezgâh ve araba görünümü',
    license: 'MIT',
    text: 'three.js-MIT.txt',
    sources: [['mrdoob/three.js', 'https://github.com/mrdoob/three.js']],
  },
]

const link = 'text-teal-700 underline-offset-2 hover:underline dark:text-teal-300'

const Licenses = forwardRef(function Licenses(_, ref) {
  return (
    <details ref={ref} id="lisanslar" className="group rounded-xl border border-slate-300/80 bg-white/95 dark:border-teal-300/15 dark:bg-[#0f1d1f]/95">
      <summary className="font-code cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
        <span className="mr-1 inline-block transition group-open:rotate-90">›</span> Lisanslar ve kaynaklar
      </summary>
      <div className="space-y-4 border-t border-slate-200 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">
        <p className="leading-relaxed">
          Simülatör tamamen sizin tarayıcınızda çalışır: kod derleme, işlemcinin taklidi ve 3D görünüm bu sitenin indirdiği dosyalarla kendi bilgisayarınızda
          yapılır; kodunuz bir sunucuya gönderilmez. Bunun için aşağıdaki açık kaynak yazılımlar kullanılır. GPL ve LGPL lisanslı parçaların kaynak kodu
          bağlantılarda; dosyaların SHA-256 değerleri ve tam liste{' '}
          <a href={files('KAYNAKLAR.txt')} className={link}>
            KAYNAKLAR.txt
          </a>{' '}
          dosyasında.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <thead className="font-code text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-1.5 pr-3 font-medium">Yazılım</th>
                <th className="py-1.5 pr-3 font-medium">Ne için</th>
                <th className="py-1.5 pr-3 font-medium">Lisans</th>
                <th className="py-1.5 font-medium">Kaynak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {COMPONENTS.map((item) => (
                <tr key={item.name} className="align-top">
                  <td className="py-2 pr-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{item.role}</td>
                  <td className="py-2 pr-3">
                    {item.text ? (
                      <a href={files(item.text)} className={link}>
                        {item.license}
                      </a>
                    ) : (
                      item.license
                    )}
                  </td>
                  <td className="py-2">
                    {(item.sources ?? []).map(([label, href], index) => (
                      <span key={href}>
                        {index ? ', ' : ''}
                        <a href={href} target="_blank" rel="noreferrer" className={link}>
                          {label}
                        </a>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
          Derleyici paketini yeniden oluşturan betik sitenin deposunda:{' '}
          <a href="https://github.com/ROGOYATO/rogoyato-website/blob/main/scripts/build-browser-compiler.mjs" target="_blank" rel="noreferrer" className={link}>
            scripts/build-browser-compiler.mjs
          </a>
          . Simülatörün kendisi (devre modeli, 3D parçalar, robot araba) ROGOYATO tarafından yazılmıştır.
        </p>
      </div>
    </details>
  )
})

export default Licenses
