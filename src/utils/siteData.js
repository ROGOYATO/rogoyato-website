export const events = [
  {
    id: 'robotik-101-atolye',
    title: 'Robotik 101 Atölyesi',
    type: 'Okul İçi',
    date: '22 Nisan 2026',
    location: 'Mühendislik A Blok',
    status: 'open',
    requiresApplication: true,
    summary:
      'Yeni katılanlar için temel sensör kullanımı, motor sürme ve hızlı prototipleme atölyeleri.',
    agenda: [
      'Takım tanışma ve ekip dağılımı',
      'Sensör + aktüatör mini eğitim',
      'Hızlı prototip görevi ve sunum',
    ],
    notes: [
      'Kontenjan 40 kişi ile sınırlıdır.',
      'Laptop getirilmesi önerilir.',
    ],
    applicationDeadline: '20 Nisan 2026',
    applicationNote: 'Başvuru sonuç listesi etkinlikten 1 gün önce paylaşılır.',
  },
  {
    id: 'gomulu-yazilim-gecesi',
    title: 'Gömülü Yazılım Gecesi',
    type: 'Okul İçi',
    date: '10 Mayis 2026',
    location: 'Teknopark Konferans Salonu',
    status: 'upcoming',
    requiresApplication: false,
    summary:
      'Topluluğun dönem içinde geliştirdiği denemelerin demo gecesi ve teknik sohbet buluşması.',
    agenda: [
      'Açık sahne demo sunumları',
      'Mentor geri bildirim masalari',
      'Soru cevap ve networking',
    ],
    notes: ['Başvuru gerektirmez, herkese açıktır.'],
    applicationDeadline: null,
    applicationNote: null,
  },
  {
    id: 'anadolu-embedded-challenge',
    title: 'Anadolu Embedded Challenge',
    type: 'Üniversitelerarası',
    date: '01 Haziran 2026',
    location: 'ROGOYATO Ev Sahipligi',
    status: 'open',
    requiresApplication: true,
    summary:
      'Üniversiteler arası takımların gömülü sistem senaryoları üzerinde yarıştığı başvuru bazlı etkinlik.',
    agenda: [
      'Ön eleme başvuru değerlendirmesi',
      'Final günü teknik senaryo çözümü',
      'Jüri değerlendirmesi ve ödül töreni',
    ],
    notes: [
      'Takımlar 3-5 kişi olmalıdır.',
      'Her takım bir teknik lider belirtmelidir.',
      'Finalistler etkinlikten 7 gün önce açıklanır.',
    ],
    applicationDeadline: '18 Mayıs 2026',
    applicationNote: 'Takım listesi ve niyet mektubu zorunludur.',
  },
  {
    id: 'mikrodenetleyici-bootcamp',
    title: 'Mikrodenetleyici Bootcamp',
    type: 'Okul İçi',
    date: '14 Mart 2026',
    location: 'Elektrik Lab 2',
    status: 'closed',
    requiresApplication: true,
    summary:
      'STM32 temelli hızlandırılmış kamp. Geçmiş dönem etkinliği olarak arşivde tutuluyor.',
    agenda: ['Kurulum günü', 'Driver katmanı çalışması', 'Mini proje teslimi'],
    notes: ['Etkinlik tamamlandı. Sonraki dönem tekrarlanabilir.'],
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
      'Algoritma ve gömülü yazılım takımı ortak çalışması ile final etabına yükseliş.',
  },
  {
    year: '2025',
    title: 'Univ Robotics Cup',
    result: '2.lik',
    detail:
      'Gerçek zamanlı kontrol stratejisi ile derece alınan kurumlararası yarışma.',
  },
  {
    year: '2024',
    title: 'Embedded Jam',
    result: 'Mansiyon',
    detail:
      'Kısa sürede üretilen prototip ile yenilik ödülü.',
  },
]

export const teamUnits = [
  {
    name: 'Gömülü Yazılım',
    focus: 'Firmware, haberleşme protokolleri, sistem optimizasyonu',
  },
  {
    name: 'Elektronik ve PCB',
    focus: 'Kart tasarımı, güç yönetimi, test ve doğrulama',
  },
  {
    name: 'Mekanik ve Üretim',
    focus: 'Şasi, hareket sistemleri, prototipleme',
  },
  {
    name: 'Organizasyon ve İletişim',
    focus: 'Etkinlik planı, iş birlikleri, topluluk süreçleri',
  },
]

export const teamMembers = [
  {
    name: 'Elif Yılmaz',
    role: 'Topluluk Başkanı',
    photo: 'https://api.dicebear.com/9.x/notionists/svg?seed=ElifYilmaz',
  },
  {
    name: 'Berk Kara',
    role: 'Gömülü Yazılım Lideri',
    photo: 'https://api.dicebear.com/9.x/notionists/svg?seed=BerkKara',
  },
  {
    name: 'Dila Aydın',
    role: 'Elektronik Takım Sorumlusu',
    photo: 'https://api.dicebear.com/9.x/notionists/svg?seed=DilaAydin',
  },
  {
    name: 'Emir Can',
    role: 'Mekanik Takım Sorumlusu',
    photo: 'https://api.dicebear.com/9.x/notionists/svg?seed=EmirCan',
  },
  {
    name: 'Nisa Demir',
    role: 'Etkinlik ve İletişim',
    photo: 'https://api.dicebear.com/9.x/notionists/svg?seed=NisaDemir',
  },
  {
    name: 'Ali Öztürk',
    role: 'Yarışma Koordinatörü',
    photo: 'https://api.dicebear.com/9.x/notionists/svg?seed=AliOzturk',
  },
]
