// The line-following robot competition: its own event, apart from the
// Arduino training whose participants take part.
export const lineRobotCompetition = {
  title: 'Çizgi İzleyen Robot Yarışması',
  path: '/yarisma/cizgi-izleyen-robot',
  // When the races start (Türkiye time); the countdown runs to it.
  raceStart: '2026-11-28T15:00:00+03:00',
  // The Google Form for entries (its public address, not the editor's);
  // null hides the button.
  applicationUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdbGE_kz49O-7NB6Itwbb_Dg7QBzfOQPOIW9etBSXWs1IlyqQ/viewform',
  edition: '2026 Güz',
  organizer: 'TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu (ROGOYATO)',
  sponsor: 'Westonya',
  summary:
    'Tek başına ya da en fazla üç kişilik takımlar hâlinde, kendi kurulan çizgi izleyen robotlarla parkurda yarışılan ödüllü yarışma. Robotlar katılımcıların kendi zamanlarında hazırlanır; yarış günü tamamlanmış robotla gelinir.',
  facts: [
    { label: 'Hazırlık', value: 'Yarış gününe kadar', detail: 'Katılımcıların kendi zamanında' },
    { label: 'Yarış günü', value: '28 Kasım 2026 Cumartesi', detail: 'Sıralama turları 15:00’te' },
    { label: 'Yer', value: 'ST-1', detail: 'TOBB ETÜ, Sosyal Tesisler Binası' },
    { label: 'Katılım', value: 'Bireysel veya takım', detail: 'Takımlar en fazla 3 kişi' },
  ],
  // When things happen; `highlight` marks what participants must not miss.
  beforeRaceDay:
    'Robotunu kendi zamanında, istediğin yerde kur, kodla ve dene. Teknik sorularını eğitim WhatsApp grubundan sorabilirsin. Robot yarış günü sıfırdan yapılmaz; hazır getirilir.',
  dayPlan: [
    { time: '09:30–10:00', title: 'Hazırlık', text: 'Yarış alanının hazırlanması (ROGOYATO ekibi).' },
    { time: '10:00–14:45', title: 'Teknik danışma ve pist denemesi', text: 'Yarışmacılar eğitmenlere teknik sorularını sorar; pistler kurulduktan sonra deneme sürüşü yapar.' },
    { time: '14:45–15:00', title: 'Yoklama ve açılış', text: 'Robotların ve yarışmacıların kaydı, kuralların hatırlatılması.' },
    { time: '15:00–16:15', title: 'Sıralama turları', text: 'Her robot sırayla piste çıkar; her parkurda en fazla üç deneme.' },
    { time: '16:15–16:30', title: 'Sonuçların açıklanması', text: 'Derecelerin hesaplanması ve açıklanması.' },
    { time: '16:30–16:45', title: 'Ödül töreni ve kapanış', text: 'İlk üç dereceye kupaların verilmesi, toplu fotoğraf.' },
  ],
  // The regulation, article by article.
  rules: [
    {
      title: 'Katılım',
      items: [
        'Yarışma herkese açıktır. Bütün yarışmacılar ve takımlar tek bir sıralamada yarışır.',
        'Yarışmaya katılmak için başvuru formunun doldurulması gerekir; takımlarda formu bir kişi takım adına doldurur.',
        'Yarışmaya tek başına ya da en fazla üç kişilik takımlar hâlinde katılınabilir. Bir kişi yalnızca bir takımda yer alabilir.',
        'Her yarışmacı ya da takım tek bir robotla yarışır; robotunu kendisi kurar ve kodlar.',
        'Yarışmacılar 28 Kasım 14:45’teki yoklamada robotlarıyla birlikte yarış alanında bulunmalıdır; takımlarda en az bir üyenin bulunması yeterlidir.',
      ],
    },
    {
      title: 'Hazırlık ve destek',
      items: [
        'Robot, yarış gününe kadar yarışmacıların kendi zamanında hazırlanır; montaj, kablolama ve kod yarış gününden önce tamamlanmış olmalıdır.',
        'Yarış günü 10:00–14:45 arasında yarış alanında eğitmenlerden teknik destek alınabilir: arızalı bağlantı, yüklenmeyen kod, çalışmayan sensör gibi sorunlarda yardım edilir.',
        'Eğitmenler kod yazmaz, hazır çözüm ya da yarış taktiği vermez.',
        'Sitemizdeki Arduino simülatörü, robot kodunun genel mantığını kurmak için kullanılabilir.',
      ],
    },
    {
      title: 'Robot',
      items: [
        'Robot, Malzemeler bölümündeki gerekli malzemelerle kurulur: 2WD şasi, iki TT motor, Arduino Uno, L298N motor sürücü, en fazla üç KH-09 kızılötesi sensör, motorlar için 4×AA pil yuvası ve Arduino için ayrı bir 9V pil.',
        'Malzemelerin birebir aynı marka ve model olması gerekmez; aynı türde ve benzer özellikte (eşdeğer) parçalar kullanılabilir. Bir parçanın eşdeğer sayılıp sayılmadığına yarış günü yoklamada jüri karar verir; emin olmadığın bir parçayı yarıştan önce sorabilirsin.',
        'Ek motor, ek sensör, hazır çizgi izleme kartı veya uzaktan kumanda kullanılamaz.',
        'Kablo, bant, vida, kablo bağı, karton, yapıştırıcı, sıcak silikon ve sensör tutucu gibi bağlantı ve montaj malzemeleri serbesttir; şasi üzerinde yerleşim yarışmacıya bırakılmıştır.',
        'Robot tamamen otonom çalışır; deneme başladıktan sonra robota bilgisayar ya da kablo bağlanamaz.',
      ],
    },
    {
      title: 'Parkur',
      figures: [
        { image: 'yarisma/cizgi-izleyen-robot/parkur-kolay.svg', caption: 'Şekil 1 – Kolay parkur: 5,8 m, geniş virajlar.' },
        { image: 'yarisma/cizgi-izleyen-robot/parkur-orta.svg', caption: 'Şekil 2 – Orta parkur: 8,7 m, saç tokası virajlar ve bir dalga.' },
        { image: 'yarisma/cizgi-izleyen-robot/parkur-zor.svg', caption: 'Şekil 3 – Zor parkur: 9,8 m, dar saç tokaları, keskin kırılmalar, dalgalar ve kesişme.' },
      ],
      items: [
        'Yarışmada üç parkur var: Kolay, Orta ve Zor (Şekil 1–3). Her robot üç parkurda da yarışır. Şekillerdeki kareler 10 cm’dir; şekle tıklayınca büyük hâli açılır.',
        'Parkurlar beyaz kâğıda gerçek boyutunda basılır; çizgi 19 mm genişliğinde siyahtır. Kolay parkur yaklaşık 1,7 m × 1,0 m, Orta 1,4 m × 1,6 m, Zor 1,4 m × 2,0 m’lik bir alan kaplar.',
        'Başlangıç ve bitiş, kareli çizgiyle işaretli aynı yerdir; robot oktaki yönde gider.',
        'Zor parkurda çizgi kendisiyle dik açıyla kesişir; kesişme noktasında robot düz devam eder.',
        'Üç parkur sitemizdeki Arduino simülatöründe de var (Yarışma: Kolay, Orta, Zor); kodunu yarıştan önce orada deneyebilirsin. Simülatör gerçeğin yaklaşık bir modelidir; gerçek robotta hız ve ayarlar farklı çıkabilir.',
        'Yarış günü 10:00–14:45 arasında, pistler kurulduktan sonra yarış alanında deneme sürüşü yapılabilir.',
      ],
    },
    {
      title: 'Yarış ve puanlama',
      example: {
        caption: 'Örnek: üç parkurlu bir yarışmada üç robotun toplam süresi',
        columns: ['Robot', '1. parkur', '2. parkur', '3. parkur', 'Toplam'],
        rows: [
          ['A', 'Bitirdi, 45 sn → 45', 'Bitirdi, 60 sn → 60', 'Bitirdi, 50 sn → 50', '155 sn (1.)'],
          ['B', 'Bitirdi, 30 sn → 30', 'Bitirdi, 40 sn → 40', 'Bitiremedi, 0,75 → 180 + 45 = 225', '295 sn (2.)'],
          ['C', 'Bitiremedi, 0,50 → 180 + 90 = 270', 'Bitiremedi, 0,90 → 180 + 18 = 198', 'Bitirdi, 80 sn → 80', '548 sn (3.)'],
        ],
      },
      items: [
        'Robot, en ön noktası başlangıç/bitiş çizgisinin hemen gerisinde, çizgiye hizalı olacak şekilde konur ve hakemin işaretiyle çalıştırılır (örneğin düğmesine basılır). Süre hakemin işaretiyle başlar; robot parkuru tamamlayıp en ön noktası başlangıç/bitiş çizgisini yeniden geçtiğinde hakem kronometreyi durdurur. Bir deneme en fazla 3 dakika (180 saniye) sürer.',
        'Bitirme: Robot parkurun tamamını izleyip başlangıç çizgisine dönerse parkuru bitirmiş olur; denemenin sonucu ölçülen süredir.',
        'Robotun bitişte kendiliğinden durması gerekmez; süreyi hakem kronometreyle ölçer ve robot çizgiyi geçtikten sonra yarışmacı robotunu alır. Kesişmelerde üç sensör birden siyah görebileceğinden, “üç sensör de siyahsa dur” gibi bir kod robotu yarı yolda durdurabilir.',
        'Bitirememe: Robot çizgiyi tamamen kaybedip parkurdan çıkarsa, bir kesişmede düz gitmek yerine sağa ya da sola dönüp kesişen çizgiye geçerse, deneme sırasında robota dokunulursa ya da 180 saniye dolarsa deneme o noktada biter. Denemenin sonucu ilerleme oranıdır: robotun ulaştığı en uzak noktaya kadar parkur boyunca gittiği yolun, parkurun tüm uzunluğuna oranı (örneğin parkurun dörtte üçü = 0,75). Hakem bunu parkurdaki işaretlerden belirler.',
        'Her robotun her parkurda üç deneme hakkı vardır; her parkurda robotun en iyi denemesi sayılır. Bitiren deneme bitiremeyenden, iki bitirmeden süresi kısa olan, iki bitirememeden ilerleme oranı yüksek olan daha iyidir.',
        'Parkur süresi: Bitirilen parkurda en iyi denemenin süresidir. Bitirilemeyen parkurda 180 + 180 × (1 − ilerleme oranı) saniyedir; yani bitirilemeyen bir parkur, ne kadar ilerlendiyse o kadar az olmak üzere 180 ile 360 saniye arasında sayılır. Hiç deneme yapılmayan parkur 360 saniyedir.',
        'Toplam süre, robotun bütün parkurlardaki parkur sürelerinin toplamıdır. Sıralama toplam süreye göre yapılır; toplam süresi en az olan birinci olur (bkz. örnek).',
        'Denemeler arasında kod, ayar ve pil değiştirilebilir; sırası gelen robotun en geç 2 dakika içinde piste çıkması gerekir.',
      ],
    },
    {
      title: 'Dereceler',
      items: [
        'Dereceler sıralama turlarının sonucuna göre belirlenir; ayrıca final turu yapılmaz.',
        'İlk üç dereceye giren yarışmacılara ya da takımlara kupa verilir.',
        'Derece için eşitlik olması durumunda eşit robotlar kısa bir tekrar sürüşü yapar.',
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
    { place: 1, title: 'Birincilik', trophy: 'Baymax', base: 'Altın rengi kaide', height: '26 cm', image: 'yarisma/cizgi-izleyen-robot/kupa-baymax.webp' },
    { place: 2, title: 'İkincilik', trophy: 'Megabot', base: 'Gümüş rengi kaide', height: '24 cm', image: 'yarisma/cizgi-izleyen-robot/kupa-megabot.webp' },
    { place: 3, title: 'Üçüncülük', trophy: 'Microbot', base: 'Bronz rengi kaide', height: '21 cm', image: 'yarisma/cizgi-izleyen-robot/kupa-microbot.webp' },
  ],
  faq: [
    { q: 'Nasıl başvururum?', a: 'Başvurular Google Form üzerinden alınır; bu sayfanın üstündeki “Başvuru formu” butonundan forma ulaşabilirsin. Takımlarda formu bir kişi, takım adına doldurur.' },
    { q: 'Arduino Eğitimi’ne katılmadım, katılabilir miyim?', a: 'Evet, yarışma herkese açık ve herkes aynı sıralamada yarışır. Robot, Malzemeler bölümündeki parçalarla ya da eşdeğerleriyle kurulur.' },
    { q: 'Takım olarak katılabilir miyim?', a: 'Evet. Tek başına ya da en fazla üç kişilik bir takımla katılabilirsin; bir kişi yalnızca bir takımda yer alabilir.' },
    { q: 'Robotu nerede ve ne zaman yapacağım?', a: 'Robotunu yarış gününe kadar kendi zamanında, istediğin yerde hazırlarsın. Yarış gününe tamamlanmış robotla gelinir; robotlar yarış günü sıfırdan yapılmaz.' },
    { q: 'Takıldığım yerde yardım alabilir miyim?', a: 'Hazırlık haftasında teknik sorularını eğitim WhatsApp grubundan sorabilirsin. Yarış günü 10:00–14:45 arasında yarış alanında eğitmenler teknik sorunlarda yardım eder; kod yazmaz ve taktik vermez.' },
    { q: 'Parkur nasıl olacak?', a: 'Üç parkur var: Kolay (5,8 m), Orta (8,7 m) ve Zor (9,8 m); çizimleri Şartname’nin Parkur bölümünde. Parkurlar beyaz kâğıda gerçek boyutunda basılır, çizgi 19 mm genişliğinde siyahtır. Zor parkurda çizgi kendisiyle kesişir; kesişmede robot düz devam eder.' },
    { q: 'Yarışma nerede yapılacak?', a: 'Yarışma TOBB ETÜ’de, Sosyal Tesisler Binası’nda (ST-1) yapılacak. Gün boyunca çay ve kahve ikramı olacak.' },
    { q: 'Malzemelerim yanımda değilken nasıl çalışırım?', a: 'Sitemizdeki Arduino simülatöründe yarışmanın üç parkuru da var; robot kodunun genel mantığını orada kurabilirsin. Simülatör yaklaşık bir modeldir, hız ve ayarları gerçek robotta yeniden denemelisin.' },
    { q: 'Robot bitişte durmalı mı?', a: 'Hayır. Robot, önü başlangıç/bitiş çizgisine hizalı olarak başlar; turu tamamlayıp önü çizgiyi yeniden geçtiğinde hakem kronometreyi durdurur ve robotunu alırsın. Kesişmelerde üç sensör birden siyah görebilir; bu durumda robotun düz devam etmesi gerekir, durursa deneme orada biter.' },
    { q: 'Sıralama nasıl belirlenir?', a: 'Her parkurda üç deneme hakkın var ve en iyisi sayılır. Bitirdiğin parkurda süren sayılır; bitiremediğin parkurda 180 + 180 × (1 − ilerleme oranı) saniye sayılır, yani 180 ile 360 saniye arası: ne kadar ilerlersen o kadar az. Bütün parkurların süreleri toplanır, toplamı en az olan birinci olur. Şartnamenin 5. maddesinde örnek bir hesap var. Final yapılmaz; ilk üçe kupa verilir.' },
  ],
  contact: [
    { label: 'E-posta', value: 'rogoyato@gmail.com', href: 'mailto:rogoyato@gmail.com' },
    { label: 'Instagram', value: '@eturogoyato', href: 'https://www.instagram.com/eturogoyato/' },
  ],
  prizeNote: 'Kupalar, ödül sponsorumuz Westonya tarafından çok renkli 3B baskıyla üretilmektedir.',
  // The Materials tab: what a robot needs and what helps on the day.
  // Links go to Elektronikport, where the training's kit was bought.
  requiredMaterials: [
    { name: '2WD robot araba kiti (şasi, 2 TT motor, 2 tekerlek, serbest teker, 4×AA pil yuvası, vida ve somunlar)', count: '1', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino', image: 'yarisma/cizgi-izleyen-robot/malzemeler/2wd-kit.webp' },
    { name: 'Arduino Uno (R3 ya da CH340’lı klon) ve USB kablosu', count: '1', image: 'yarisma/cizgi-izleyen-robot/malzemeler/arduino-uno.webp' },
    { name: 'L298N motor sürücü modülü', count: '1', url: 'https://www.elektronikport.com/urun/l298n-motor-surucu-modulu-h-kopru', image: 'yarisma/cizgi-izleyen-robot/malzemeler/l298n.webp' },
    { name: 'KH-09 kızılötesi çizgi sensörü', count: '3 adede kadar', url: 'https://www.elektronikport.com/urun/ir-alici-verici-sensor-modulu-1', image: 'yarisma/cizgi-izleyen-robot/malzemeler/kh09.webp' },
    { name: 'AA pil (motorlar için)', count: '4', url: 'https://www.elektronikport.com/kategori/pil', image: 'yarisma/cizgi-izleyen-robot/malzemeler/aa-pil.webp' },
    { name: '9V pil ve DC jaklı pil başlığı (Arduino için, motorlardan ayrı)', count: '1', url: 'https://www.elektronikport.com/kategori/pil', image: 'yarisma/cizgi-izleyen-robot/malzemeler/9v-pil.webp', image2: 'yarisma/cizgi-izleyen-robot/malzemeler/pil-basligi-dc-jak.webp' },
    { name: 'Jumper kablolar (erkek-dişi ve dişi-dişi)', count: 'Yeteri kadar', url: 'https://www.elektronikport.com/kategori/jumper-kablo', image: 'yarisma/cizgi-izleyen-robot/malzemeler/jumper.webp' },
  ],
  recommendedMaterials: [
    { name: 'Karton, bant, yapıştırıcı ya da sıcak silikon', note: 'KH-09 sensörlerini şasiye monte etmek için; bunlardan biri yeterli.' },
    { name: 'Yedek AA piller ya da şarjlı piller ve şarj cihazı', note: 'Zayıflayan pil motorları yavaşlatır, robotun davranışını değiştirir.' },
    { name: 'Yedek 9V pil', note: 'Arduino’nun pili biterse kart yeniden başlar ya da hiç çalışmaz.' },
    { name: 'Arduino IDE kurulu dizüstü bilgisayar ve USB kablosu', note: 'Yarış günü deneme sürüşlerinin ardından kodda ayar yapmak için.' },
    { name: 'Küçük yıldız ve düz tornavida', note: 'Vidaları sıkmak ve KH-09’ların hassasiyet ayarı için.' },
    { name: 'Kablo bağı, çift taraflı bant, izole bant', note: 'Kartları ve kabloları şasiye sabitlemek için.', url: 'https://www.elektronikport.com/kategori/bant-ve-sprey-cesitleri' },
    { name: 'Beyaz karton ve siyah çizgi', note: 'Evde kısa bir deneme parkuru için: yaklaşık 2 cm genişliğinde siyah çizgiyi yazıcıdan çıkarıp kartona yapıştırabilirsin.' },
    { name: 'Yedek jumper kablolar', note: 'Gevşeyen ya da kopan bağlantılar için.' },
    { name: 'Multimetre', note: 'İsteğe bağlı; pil gerilimini ve bağlantıları ölçmek için.' },
  ],
  materials: ['2WD robot araba kiti', 'Arduino Uno', 'L298N', 'en fazla 3 adet KH-09', '4×AA pil', '9V pil (Arduino için)', 'Jumper kablolar'],
}
