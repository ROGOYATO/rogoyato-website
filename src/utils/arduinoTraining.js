export const arduinoTraining = {
  term: '2026 Güz Dönemi',
  title: 'Arduino Eğitimi',
  summary: 'Dört haftalık bireysel Arduino eğitimi. Çizgi izleyen robot yarışması, eğitimden ayrı bir etkinliktir.',
  facts: [
    { label: 'Ders günü', value: 'Cumartesi' },
    { label: 'Ders saati', value: '14:45–16:45' },
    { label: 'Ders konumu', value: 'TM 218' },
    { label: 'Program', value: '4 hafta eğitim + yarışma' },
    { label: 'Çalışma biçimi', value: 'Bireysel' },
  ],
  dailyFlow: [
    { time: '14:45–15:40', label: '1. ders' },
    { time: '15:40–15:55', label: 'Ara' },
    { time: '15:55–16:45', label: '2. ders' },
  ],
  outcomes: [
    'Arduino IDE kurup karta örnek ve özgün kod yükleyebilme',
    'Breadboard üzerinde temel devre kurabilme',
    'Dijital giriş–çıkış, analog okuma ve PWM kullanabilme',
    'HC-SR04, LDR, DHT11 ve KH-09 gibi sensörlerden veri okuyabilme',
    'SG90 servo motoru konum kontrollü sürebilme',
    'L298N ile iki DC motorun yön ve hız kontrolünü yapabilme',
    'Eğitimden ayrı yarışmada 2WD robotu ve üç KH-09 sensörle çizgi izleme becerisini kullanabilme',
  ],
}

export const arduinoWeeks = [
  {
    week: 1,
    title: 'Kurulum, Arduino temelleri ve temel elektronik',
    goal: 'Her öğrenci Arduino IDE kurar, karta kod yükler, LED ve butonla giriş–çıkış uygulamasını tamamlar.',
    lessons: [
      [
        'Program açılışı ve hedefler',
        'Arduino ve mikrodenetleyici mantığı',
        'Arduino IDE kurulumu; kart ve port seçimi',
        'Blink örneğini derleme ve karta yükleme',
        'Yaygın kurulum ve CH340 sürücü sorunları',
      ],
      [
        'Breadboard, gerilim, akım ve direnç',
        'LED bağlantısı ve seri direnç',
        'Butonla dijital giriş',
        'pinMode, digitalWrite, digitalRead, if–else',
        'Uygulama: butona basılınca LED yakma',
      ],
    ],
    outcome: 'Çalışan Arduino kurulumu ve buton kontrollü LED devresi.',
    materials: ['Arduino Uno', 'USB kablo', 'Breadboard', 'Jumper', 'LED', '330Ω direnç', 'Buton'],
    code: 'digitalWrite(LED, HIGH);',
    simulator: 'buton-led',
  },
  {
    week: 2,
    title: 'Analog girişler, PWM ve temel sensörler',
    goal: 'Analog okuma, Serial Monitor kullanımı ve sensör verilerini yorumlama.',
    lessons: [
      [
        'Dijital ve analog sinyal farkı',
        'analogRead ve 0–1023 aralığı',
        'Serial.begin, Serial.print, Serial Monitor',
        'PWM ve analogWrite',
        'Uygulama: potansiyometre ile LED parlaklığı',
      ],
      [
        'LDR ile ışık algılama',
        'HC-SR04 ile mesafe ölçümü',
        'DHT11 ile sıcaklık ve nem verisi',
        'Aktif buzzer ile uyarı',
        'Uygulama: mesafeye veya ışığa bağlı uyarı',
      ],
    ],
    outcome: 'En az iki sensörü okuyup karar üreten çalışan devre.',
    materials: ['Potansiyometre', 'LED', 'LDR', 'HC-SR04', 'DHT11', 'Aktif buzzer'],
    code: 'analogWrite(LED, analogRead(A0) / 4);',
    simulator: 'mesafe-uyari',
  },
  {
    week: 3,
    title: 'Servo, yardımcı bileşenler ve kontrol mantığı',
    goal: 'Servo sürme, sensör verisine koşullu tepki verme ve işlevleri fonksiyonlara ayırma.',
    lessons: [
      [
        'Servo motorun çalışma mantığı',
        'Servo kütüphanesi; attach ve write',
        'Potansiyometreyle servo konumu',
        'Harici besleme ve ortak GND',
        'Uygulama: 0°, 90° ve 180° testleri',
      ],
      [
        'Eşik değeri ve kontrol mantığı',
        'KH-09 IR sensörü: dijital okuma ve hassasiyet ayarı',
        'RGB LED ve 7 segment ile çıktı',
        'Kodun fonksiyonlara ayrılması',
        'Uygulama: sensöre göre servo konumu',
      ],
    ],
    outcome: 'Sensör verisine tepki veren servo tabanlı uygulama.',
    materials: ['SG90', 'Potansiyometre', 'KH-09', 'RGB LED', '7 segment'],
    code: 'servo.write(90);',
    simulator: 'servo-pot',
  },
  {
    week: 4,
    title: 'L298N ve DC motor kontrolü',
    goal: 'L298N üzerinden iki DC motorun yön ve hızını denetleme. Robot şasisi bu hafta monte edilmez.',
    lessons: [
      [
        'Motorlar neden Arduino pinine doğrudan bağlanmaz?',
        'H-köprü ve L298N bağlantıları',
        'Tek motorla ileri, geri, dur testleri',
        'Motor beslemesi ve ortak GND',
      ],
      [
        'İkinci motoru bağlama',
        'İki motoru bağımsız sürme',
        'PWM ile hız ayarı',
        'İleri, geri, sağ, sol kontrol mantığı',
        'Uygulama: masa üzerinde, şasi olmadan iki motor testi',
      ],
    ],
    outcome: 'İki motorun bağımsız yön ve hız kontrolü.',
    materials: ['Arduino Uno', 'L298N', '2 TT motor (2WD kitinden)'],
    code: 'analogWrite(ENA, 180);',
    simulator: 'motorlar',
  },
]

export const arduinoCompetition = {
  title: 'Çizgi İzleyen Robot Yarışması',
  edition: '2026 Güz',
  organizer: 'TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu (ROGOYATO)',
  sponsor: 'Westonya',
  summary:
    'Arduino Eğitimi’nin kapanışı olarak düzenlenen yarışmada katılımcılar, eğitim boyunca öğrendiklerini kendi kurdukları çizgi izleyen robotla parkurda sınar. Robotlar katılımcıların kendi zamanlarında hazırlanır; yarış günü tamamlanmış robotla gelinir.',
  facts: [
    { label: 'Başlangıç', value: '21 Kasım 2026 Cumartesi', detail: 'Dersin bitişiyle (16:45)' },
    { label: 'Yarış günü', value: '28 Kasım 2026 Cumartesi', detail: 'Turlar 14:45’te başlar' },
    { label: 'Yer', value: 'TM 218', detail: 'Teknoloji Merkezi, 2. kat' },
    { label: 'Katılım', value: 'Bireysel', detail: 'Arduino Eğitimi katılımcıları' },
  ],
  // When things happen; `highlight` marks what participants must not miss.
  timeline: [
    { when: '21 Kasım · 16:45', title: 'Yarışma başlar', text: 'Kurallar açıklanır, hazırlık süresi başlar.' },
    { when: '21–27 Kasım', title: 'Robotunu hazırla', text: 'Robotunu kendi zamanında, istediğin yerde kur, kodla ve dene. Teknik sorularını eğitim WhatsApp grubundan sorabilirsin.', highlight: true },
    { when: '28 Kasım · 10:00–14:45', title: 'Danışma ve pist denemesi', text: 'TM 218 açık: eğitmenlere teknik sorularını sorabilir, robotunu yarış pistinde deneyebilirsin. Robot burada sıfırdan yapılmaz; hazır getirilir.', highlight: true },
    { when: '28 Kasım · 14:45', title: 'Yoklama ve sıralama turları', text: 'Robotlar teslim edilir, her yarışmacı sırayla piste çıkar.' },
    { when: '28 Kasım · ~16:30', title: 'Final ve ödül töreni', text: 'En iyi dört yarışmacı finalde kapışır, ardından kupalar verilir.' },
  ],
  // The regulation, article by article.
  rules: [
    {
      title: 'Katılım',
      items: [
        'Yarışmaya 2026 Güz Arduino Eğitimi’ne katılan öğrenciler katılabilir.',
        'Yarışma bireyseldir; her yarışmacı tek bir robotla yarışır ve robotunu kendisi kurar ve kodlar.',
        'Yarışmacılar 28 Kasım 14:45’teki yoklamada robotlarıyla birlikte TM 218’de bulunmalıdır.',
      ],
    },
    {
      title: 'Hazırlık ve destek',
      items: [
        'Robot, 21–27 Kasım arasında yarışmacının kendi zamanında hazırlanır; montaj, kablolama ve kod yarış gününden önce tamamlanmış olmalıdır.',
        'Yarış günü 10:00–14:45 arasında TM 218’de eğitmenlerden teknik destek alınabilir: arızalı bağlantı, yüklenmeyen kod, çalışmayan sensör gibi sorunlarda yardım edilir.',
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
        'Sıralama turlarında her yarışmacının üç deneme hakkı vardır; en iyi denemesi geçerli sayılır.',
        'Robot başlangıç çizgisine konur ve hakemin işaretiyle çalıştırılır. Bir deneme en fazla 3 dakika sürer.',
        'Turu tamamlayan robotlar süreye göre sıralanır; turu tamamlayan her robot, tamamlayamayanların önündedir.',
        'Turu tamamlayamayan robotlar parkurda ilerledikleri mesafeye göre sıralanır.',
        'Robot çizgiyi tamamen kaybedip parkurdan çıkarsa ya da deneme sırasında robota dokunulursa o deneme o noktada sona erer.',
        'Denemeler arasında kod, ayar ve pil değiştirilebilir; sıra gelen yarışmacının en geç 2 dakika içinde piste çıkması gerekir.',
      ],
    },
    {
      title: 'Final',
      items: [
        'Sıralama turlarının en iyi dört yarışmacısı finale kalır.',
        'Finalde her finalist bir deneme daha yapar; dereceler, finalistin sıralama ve final denemelerinden en iyisine göre belirlenir.',
        'Eşitlik durumunda kısa bir tekrar sürüşü yapılır.',
      ],
    },
    {
      title: 'Genel',
      items: [
        'Hakem kararları kesindir; itirazlar aynı gün, sonuçlar açıklanmadan önce yarışma sorumlusuna yapılır.',
        'Kurallara aykırı robotlar veya başkası tarafından hazırlandığı anlaşılan robotlar yarışma dışı bırakılır.',
        'Yarışmacılar pil, kablo ve şarj ekipmanını güvenli şekilde kullanmakla yükümlüdür.',
        'ROGOYATO, gerekli gördüğü durumlarda kurallarda değişiklik yapma ve bunu duyurma hakkını saklı tutar.',
      ],
    },
  ],
  prizes: [
    { place: 1, title: 'Birincilik', trophy: 'Baymax', base: 'Altın kaide', height: '26 cm', image: 'arduino/yarisma/kupa-baymax.webp' },
    { place: 2, title: 'İkincilik', trophy: 'Megabot', base: 'Gümüş kaide', height: '24 cm', image: 'arduino/yarisma/kupa-megabot.webp' },
    { place: 3, title: 'Üçüncülük', trophy: 'Microbot', base: 'Bronz kaide', height: '21 cm', image: 'arduino/yarisma/kupa-microbot.webp' },
  ],
  prizeNote: 'Kupalar, ödül sponsorumuz Westonya tarafından çok renkli 3B baskıyla üretilmektedir.',
  materials: ['2WD robot araba kiti', 'Arduino Uno', 'L298N', '3 adet KH-09', '4×AA pil', 'Jumper kablolar'],
}

export const arduinoMaterials = {
  starterKitUrl: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040',
  robotKitUrl: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino',
  starterKit: [
    { name: 'Arduino Uno R3 SMD CH340 (USB kablo dahil)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: '830 pin breadboard (16,5 × 5,5 cm)', url: 'https://www.elektronikport.com/kategori/plaket-breadboard' },
    { name: 'Erkek-dişi jumper, 20 cm (20 adet)', url: 'https://www.elektronikport.com/kategori/jumper-kablo' },
    { name: 'Erkek-erkek jumper, 20 cm (20 adet)', url: 'https://www.elektronikport.com/urun/jumper-kablo-erkek-erkek-20-cm-40-adet-1' },
    { name: 'Dişi-dişi jumper, 20 cm (20 adet)', url: 'https://www.elektronikport.com/urun/jumper-kablo-disi-disi-20-cm-40-adet-1' },
    { name: 'SG90 mini servo motor (9 g)', url: 'https://www.elektronikport.com/urun/mini-servo-motor-sg90-9g-arduino' },
    { name: 'HC-SR04 ultrasonik mesafe sensörü', url: 'https://www.elektronikport.com/kategori/mesafe-ve-hareket-sensorleri' },
    { name: 'Aktif buzzer (5 V)', url: 'https://www.elektronikport.com/kategori/buzzer-hoparlor' },
    { name: '10K potansiyometre', url: 'https://www.elektronikport.com/urun/10k-pot-potansiyometre' },
    { name: 'LDR (5 mm, 2 adet)', url: 'https://www.elektronikport.com/urun/ldr-5mm' },
    { name: 'Tact switch buton (4 bacaklı, 5 adet)', url: 'https://www.elektronikport.com/urun/6x6x6-mm-tach-buton-4-bacak-1' },
    { name: 'RGB LED (5 mm, ortak katot, 2 adet)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: 'DHT11 sıcaklık ve nem sensörü', url: 'https://www.elektronikport.com/urun/dht11-nem-ve-isi-sensoru-arduino' },
    { name: 'Kırmızı LED (5 mm, 5 adet)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: 'Mavi LED (5 mm, 5 adet)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: 'Sarı LED (5 mm, 5 adet)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: 'Yeşil LED (5 mm, 5 adet)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: '1K direnç (¼ W, 5 adet)', url: 'https://www.elektronikport.com/urun/1-kohm-1-4w-direnc-100-adet' },
    { name: '330Ω direnç (¼ W, 5 adet)', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: '10K direnç (¼ W, 5 adet)', url: 'https://www.elektronikport.com/urun/10-kohm-1-4w-direnc-100-adet' },
    { name: '7 segment display (14 mm, ortak katot)', url: 'https://www.elektronikport.com/urun/14mm-ortak-katot-display-kirmizi' },
    { name: 'Çift taraflı malzeme kutusu', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
  ],
  extras: [
    { name: 'L298N motor sürücü modülü', url: 'https://www.elektronikport.com/urun/l298n-motor-surucu-modulu-h-kopru', count: '1', use: '4. hafta: DC motor kontrolü; yarışma' },
    { name: '2WD robot araba kiti', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino', count: '1', use: 'Yalnızca yarışmada robot montajı' },
    { name: 'KH-09 IR alıcı-verici sensör modülü', url: 'https://www.elektronikport.com/urun/ir-alici-verici-sensor-modulu-1', count: '3', use: 'Üç sensör: sol, orta ve sağ' },
  ],
  starterKitRemoved: ['LCD ekran (2×16, 5 V 1602)', 'IR uzaktan kumanda ve alıcı (HX1838)'],
  robotKit: [
    { name: 'TT tip redüktörlü DC motor (2 adet)', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
    { name: 'Tekerlek (2 adet)', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
    { name: 'Serbest teker / caster (1 adet)', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
    { name: '2WD robot şasisi', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
    { name: '4×AA pil yuvası', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
    { name: 'Vida, somun ve montaj parçaları', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
  ],
  robotKitNote:
    'Şasi, tekerlek ve motorlar dört haftalık eğitim sırasında monte edilmez; yarışmacılar bunları derslerden bağımsız yarışma etkinliğinde monte eder.',
  consumables: [
    { name: 'Piller', url: 'https://www.elektronikport.com/kategori/pil' },
    { name: 'İzole bant veya kablo bağı', url: 'https://www.elektronikport.com/kategori/bant-ve-sprey-cesitleri' },
  ],
}
