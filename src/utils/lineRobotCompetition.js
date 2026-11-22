// The line-following robot competition: its own event, apart from the
// Arduino training whose participants take part.
export const lineRobotCompetition = {
  title: 'Çizgi İzleyen Robot Yarışması',
  path: '/yarisma/cizgi-izleyen-robot',
  // When the races start (Türkiye time); the countdown runs to it.
  raceStart: '2026-11-28T15:00:00+03:00',
  edition: '2026 Güz',
  organizer: 'TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu (ROGOYATO)',
  sponsor: 'Westonya',
  summary:
    'ROGOYATO Arduino Eğitimi katılımcılarının tek başına ya da en fazla üç kişilik takımlar hâlinde kendi kurdukları çizgi izleyen robotlarla parkurda yarıştığı ödüllü yarışma. Robotlar katılımcıların kendi zamanlarında hazırlanır; yarış günü tamamlanmış robotla gelinir.',
  facts: [
    { label: 'Başlangıç', value: '21 Kasım 2026 Cumartesi', detail: 'Dersin bitişiyle (16:45)' },
    { label: 'Yarış günü', value: '28 Kasım 2026 Cumartesi', detail: 'Sıralama turları 15:00’te' },
    { label: 'Yer', value: 'Duyurulacak', detail: 'TOBB ETÜ kampüsü' },
    { label: 'Katılım', value: 'Bireysel veya takım', detail: 'Takımlar en fazla 3 kişi' },
  ],
  // When things happen; `highlight` marks what participants must not miss.
  timeline: [
    { when: '21 Kasım · 16:45', title: 'Yarışma başlar', text: 'Kurallar açıklanır, hazırlık süresi başlar.' },
    { when: '21–27 Kasım', title: 'Robotunu hazırla', text: 'Robotunu kendi zamanında, istediğin yerde kur, kodla ve dene. Teknik sorularını eğitim WhatsApp grubundan sorabilirsin.', highlight: true },
    { when: '28 Kasım · 10:00–14:45', title: 'Danışma ve pist denemesi', text: 'Yarış alanı açık: eğitmenlere teknik sorularını sorabilir, robotunu yarış pistinde deneyebilirsin. Robot burada sıfırdan yapılmaz; hazır getirilir.', highlight: true },
    { when: '28 Kasım · 14:45', title: 'Yoklama ve sıralama turları', text: 'Yoklamanın ardından 15:00’te her yarışmacı ya da takım sırayla piste çıkar.' },
    { when: '28 Kasım · ~16:30', title: 'Final ve ödül töreni', text: 'En iyi dört robot finalde kapışır, ardından kupalar verilir.' },
  ],
  // The race day hour by hour.
  dayPlan: [
    { time: '09:30–10:00', title: 'Hazırlık', text: 'Pistin ve masaların kurulması (ROGOYATO ekibi).' },
    { time: '10:00–14:45', title: 'Teknik danışma ve pist denemesi', text: 'Yarışmacılar robotlarını pistte dener, eğitmenlere teknik sorularını sorar.' },
    { time: '14:45–15:00', title: 'Yoklama ve açılış', text: 'Robotların ve yarışmacıların kaydı, kuralların hatırlatılması.' },
    { time: '15:00–16:15', title: 'Sıralama turları', text: 'Her robot sırayla piste çıkar; en fazla üç deneme.' },
    { time: '16:15–16:30', title: 'Ara', text: 'Sıralamanın açıklanması, finalistlerin belirlenmesi.' },
    { time: '16:30–16:50', title: 'Final', text: 'En iyi dört robotun final denemeleri.' },
    { time: '16:50–17:00', title: 'Ödül töreni ve kapanış', text: 'Kupaların verilmesi, toplu fotoğraf.' },
  ],
  // The regulation, article by article.
  rules: [
    {
      title: 'Katılım',
      items: [
        'Yarışmaya 2026 Güz Arduino Eğitimi’ne katılan öğrenciler katılabilir.',
        'Yarışmaya tek başına ya da en fazla üç kişilik takımlar hâlinde katılınabilir. Bir kişi yalnızca bir takımda yer alabilir.',
        'Her yarışmacı ya da takım tek bir robotla yarışır; robotunu kendisi kurar ve kodlar.',
        'Yarışmacılar 28 Kasım 14:45’teki yoklamada robotlarıyla birlikte yarış alanında bulunmalıdır; takımlarda en az bir üyenin bulunması yeterlidir.',
      ],
    },
    {
      title: 'Hazırlık ve destek',
      items: [
        'Robot, 21–27 Kasım arasında yarışmacıların kendi zamanında hazırlanır; montaj, kablolama ve kod yarış gününden önce tamamlanmış olmalıdır.',
        'Yarış günü 10:00–14:45 arasında yarış alanında eğitmenlerden teknik destek alınabilir: arızalı bağlantı, yüklenmeyen kod, çalışmayan sensör gibi sorunlarda yardım edilir.',
        'Eğitmenler kod yazmaz, hazır çözüm ya da yarış taktiği vermez.',
        'Hazırlık için simülatördeki robot araba ve parkurlar kullanılabilir.',
      ],
    },
    {
      title: 'Robot',
      items: [
        'Robot, eğitimde kullanılan malzemelerle kurulur: 2WD şasi, iki TT motor, Arduino Uno, L298N motor sürücü, en fazla üç KH-09 kızılötesi sensör ve 4×AA pil yuvası.',
        'Ek motor, ek sensör, hazır çizgi izleme kartı veya uzaktan kumanda kullanılamaz.',
        'Kablo, bant, vida, kablo bağı ve sensör tutucu gibi bağlantı malzemeleri serbesttir; şasi üzerinde yerleşim yarışmacıya bırakılmıştır.',
        'Robot tamamen otonom çalışır; deneme başladıktan sonra robota bilgisayar ya da kablo bağlanamaz.',
      ],
    },
    {
      title: 'Parkur',
      items: [
        'Parkur, beyaz zemin üzerine yaklaşık 2 cm genişliğinde siyah bantla çizilmiş, virajlı kapalı bir hattır.',
        'Parkurun tamamı yarış günü 10:00’da açıklanır ve 14:45’e kadar deneme sürüşlerine açıktır.',
      ],
    },
    {
      title: 'Yarış ve puanlama',
      items: [
        'Sıralama turlarında her robotun üç deneme hakkı vardır; en iyi denemesi geçerli sayılır.',
        'Robot başlangıç çizgisine konur ve hakemin işaretiyle çalıştırılır. Bir deneme en fazla 3 dakika sürer.',
        'Turu tamamlayan robotlar süreye göre sıralanır; turu tamamlayan her robot, tamamlayamayanların önündedir.',
        'Turu tamamlayamayan robotlar parkurda ilerledikleri mesafeye göre sıralanır.',
        'Robot çizgiyi tamamen kaybedip parkurdan çıkarsa ya da deneme sırasında robota dokunulursa o deneme o noktada sona erer.',
        'Denemeler arasında kod, ayar ve pil değiştirilebilir; sırası gelen robotun en geç 2 dakika içinde piste çıkması gerekir.',
      ],
    },
    {
      title: 'Final',
      items: [
        'Sıralama turlarının en iyi dört robotu finale kalır.',
        'Finalde her finalist bir deneme daha yapar; dereceler, sıralama ve final denemelerinin en iyisine göre belirlenir.',
        'Eşitlik durumunda kısa bir tekrar sürüşü yapılır.',
      ],
    },
    {
      title: 'Genel',
      items: [
        'Hakem kararları kesindir; itirazlar aynı gün, sonuçlar açıklanmadan önce yarışma sorumlusuna yapılır.',
        'Kurallara aykırı robotlar veya yarışmacılar dışında biri tarafından hazırlandığı anlaşılan robotlar yarışma dışı bırakılır.',
        'Yarışmacılar pil, kablo ve şarj ekipmanını güvenli şekilde kullanmakla yükümlüdür.',
        'ROGOYATO, gerekli gördüğü durumlarda kurallarda değişiklik yapma ve bunu duyurma hakkını saklı tutar.',
      ],
    },
  ],
  prizes: [
    { place: 1, title: 'Birincilik', trophy: 'Baymax', base: 'Altın kaide', height: '26 cm', image: 'yarisma/cizgi-izleyen-robot/kupa-baymax.webp' },
    { place: 2, title: 'İkincilik', trophy: 'Megabot', base: 'Gümüş kaide', height: '24 cm', image: 'yarisma/cizgi-izleyen-robot/kupa-megabot.webp' },
    { place: 3, title: 'Üçüncülük', trophy: 'Microbot', base: 'Bronz kaide', height: '21 cm', image: 'yarisma/cizgi-izleyen-robot/kupa-microbot.webp' },
  ],
  faq: [
    { q: 'Takım olarak katılabilir miyim?', a: 'Evet. Tek başına ya da en fazla üç kişilik bir takımla katılabilirsin. Takımın tüm üyeleri Arduino Eğitimi katılımcısı olmalı ve bir kişi yalnızca bir takımda yer alabilir.' },
    { q: 'Robotu nerede ve ne zaman yapacağım?', a: 'Robotunu 21–27 Kasım arasında kendi zamanında, istediğin yerde hazırlarsın. Yarış gününe tamamlanmış robotla gelinir; robotlar yarış günü sıfırdan yapılmaz.' },
    { q: 'Takıldığım yerde yardım alabilir miyim?', a: 'Hazırlık haftasında teknik sorularını eğitim WhatsApp grubundan sorabilirsin. Yarış günü 10:00–14:45 arasında yarış alanında eğitmenler teknik sorunlarda yardım eder; kod yazmaz ve taktik vermez.' },
    { q: 'Yarışma nerede yapılacak?', a: 'Yarışmanın yapılacağı yer kesinleştiğinde bu sayfada ve eğitim WhatsApp grubunda duyurulacak.' },
    { q: 'Malzemelerim yanımda değilken nasıl çalışırım?', a: 'Sitemizdeki Arduino simülatöründe yarışma arabası kablolanmış olarak hazır; kodunu yazıp sanal parkurlarda deneyebilirsin.' },
    { q: 'Sıralama nasıl belirlenir?', a: 'Turu tamamlayan robotlar süreye göre, tamamlayamayanlar parkurda ilerledikleri mesafeye göre sıralanır. En iyi dört robot finalde bir kez daha koşar.' },
  ],
  contact: [
    { label: 'E-posta', value: 'rogoyato@gmail.com', href: 'mailto:rogoyato@gmail.com' },
    { label: 'Instagram', value: '@eturogoyato', href: 'https://www.instagram.com/eturogoyato/' },
  ],
  prizeNote: 'Kupalar, ödül sponsorumuz Westonya tarafından çok renkli 3B baskıyla üretilmektedir.',
  materials: ['2WD robot araba kiti', 'Arduino Uno', 'L298N', '3 adet KH-09', '4×AA pil', 'Jumper kablolar'],
}
