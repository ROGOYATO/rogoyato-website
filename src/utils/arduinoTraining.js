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
  },
]

export const arduinoCompetition = {
  title: 'Çizgi izleyen robot yarışması',
  summary:
    '5. hafta yalnızca yarışmaya ayrılmıştır; ders, yeni konu anlatımı veya yönlendirilmiş uygulama yapılmaz. Yarışmacılar kendi robotlarını bu etkinlik kapsamında kurar, test eder ve parkurda yarışır. Yarışmanın yeri ve saati ders programından ayrı duyurulur.',
  stages: [
    {
      title: 'Yarışmaya hazırlık',
      note: 'Eğitim verilmez',
      items: [
        '2WD şasi, TT motorlar, tekerlekler ve serbest tekerin montajı',
        'Arduino Uno, L298N ve pil yuvasını şasiye sabitleme',
        'Üç KH-09 sensörün sol–orta–sağ konumlandırılması',
        'Motor, sensör ve çizgi takip kodunu birleştirme',
      ],
    },
    {
      title: 'Parkur ve yarışma',
      items: [
        'Sensörleri siyah–beyaz zeminde kalibre etme',
        'Kısa parkur testi ve ayarlar',
        'Her öğrencinin kendi robotuyla çizgi izleyen parkur yarışması',
      ],
    },
  ],
  materials: ['2WD robot araba kiti', 'Arduino Uno', 'L298N', '3 adet KH-09', 'Piller', 'Jumper kablolar', 'Çizgi parkuru'],
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
    { name: 'AA pil (4 adet; öğrenci temin edecek)', url: 'https://www.elektronikport.com/kategori/pil' },
    { name: 'İzole bant veya kablo bağı', url: 'https://www.elektronikport.com/kategori/bant-ve-sprey-cesitleri' },
  ],
}
