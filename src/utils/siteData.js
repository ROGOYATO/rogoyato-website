export const events = [
  {
    id: 'robotik-101-atolye',
    title: 'Robotik 101 Atolyesi',
    type: 'Okul Ici',
    date: '22 Nisan 2026',
    location: 'Muhendislik A Blok',
    status: 'open',
    requiresApplication: true,
    summary:
      'Yeni katilanlar icin temel sensor kullanimi, motor surme ve hizli prototipleme atolyeleri.',
    agenda: [
      'Takim tanisma ve ekip dagilimi',
      'Sensor + actuator mini egitim',
      'Hizli prototip gorevi ve sunum',
    ],
    notes: [
      'Kontenjan 40 kisi ile sinirlidir.',
      'Laptop getirilmesi onerilir.',
    ],
    applicationDeadline: '20 Nisan 2026',
    applicationNote: 'Basvuru sonuc listesi etkinlikten 1 gun once paylasilir.',
  },
  {
    id: 'gomulu-yazilim-gecesi',
    title: 'Gomulu Yazilim Gecesi',
    type: 'Okul Ici',
    date: '10 Mayis 2026',
    location: 'Teknopark Konferans Salonu',
    status: 'upcoming',
    requiresApplication: false,
    summary:
      'Toplulugun donem icinde gelistirdigi denemelerin demo gecesi ve teknik sohbet bulusmasi.',
    agenda: [
      'Acik sahne demo sunumlari',
      'Mentor geri bildirim masalari',
      'Soru cevap ve networking',
    ],
    notes: ['Basvuru gerektirmez, herkese aciktir.'],
    applicationDeadline: null,
    applicationNote: null,
  },
  {
    id: 'anadolu-embedded-challenge',
    title: 'Anadolu Embedded Challenge',
    type: 'Universitelerarasi',
    date: '01 Haziran 2026',
    location: 'ROGOYATO Ev Sahipligi',
    status: 'open',
    requiresApplication: true,
    summary:
      'Universiteler arasi takimlarin gomulu sistem senaryolari uzerinde yaristigi basvuru bazli etkinlik.',
    agenda: [
      'On eleme basvuru degerlendirmesi',
      'Final gunu teknik senaryo cozumu',
      'Juri degerlendirmesi ve odul toreni',
    ],
    notes: [
      'Takimlar 3-5 kisi olmalidir.',
      'Her takim bir teknik lider belirtmelidir.',
      'Finalistler etkinlikten 7 gun once aciklanir.',
    ],
    applicationDeadline: '18 Mayis 2026',
    applicationNote: 'Takim listesi ve niyet mektubu zorunludur.',
  },
  {
    id: 'mikrodenetleyici-bootcamp',
    title: 'Mikrodenetleyici Bootcamp',
    type: 'Okul Ici',
    date: '14 Mart 2026',
    location: 'Elektrik Lab 2',
    status: 'closed',
    requiresApplication: true,
    summary:
      'STM32 temelli hizlandirilmis kamp. Gecmis donem etkinligi olarak arsivde tutuluyor.',
    agenda: ['Kurulum gunu', 'Driver katmani calismasi', 'Mini proje teslimi'],
    notes: ['Etkinlik tamamlandi. Sonraki donem tekrarlanabilir.'],
    applicationDeadline: null,
    applicationNote: null,
  },
]

export const competitionHighlights = [
  {
    year: '2026',
    title: 'Teknofest Otonom Kategori Finali',
    result: 'Finalist',
    detail:
      'Algoritma ve gomulu yazilim takimi ortak calismasi ile final etabina yukselis.',
  },
  {
    year: '2025',
    title: 'Univ Robotics Cup',
    result: '2.lik',
    detail:
      'Gercek zamanli kontrol stratejisi ile derece alinan kurumlararasi yarisma.',
  },
  {
    year: '2024',
    title: 'Embedded Jam',
    result: 'Mansiyon',
    detail:
      'Kisa surede uretilen prototip ile yenilik odulu.',
  },
]

export const teamUnits = [
  {
    name: 'Gomulu Yazilim',
    focus: 'Firmware, haberlesme protokolleri, sistem optimizasyonu',
  },
  {
    name: 'Elektronik ve PCB',
    focus: 'Kart tasarimi, guc yonetimi, test ve dogrulama',
  },
  {
    name: 'Mekanik ve Uretim',
    focus: 'Sasi, hareket sistemleri, prototipleme',
  },
  {
    name: 'Organizasyon ve Iletisim',
    focus: 'Etkinlik plani, is birlikleri, topluluk surecleri',
  },
]
