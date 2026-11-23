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
    'ROGOYATO Arduino Eğitimi katılımcılarının tek başına ya da en fazla üç kişilik takımlar hâlinde kendi kurdukları çizgi izleyen robotlarla parkurda yarıştığı ödüllü yarışma. Robotlar katılımcıların kendi zamanlarında hazırlanır; yarış günü tamamlanmış robotla gelinir.',
  facts: [
    { label: 'Hazırlık', value: 'Yarış gününe kadar', detail: 'Katılımcıların kendi zamanında' },
    { label: 'Yarış günü', value: '28 Kasım 2026 Cumartesi', detail: 'Sıralama turları 15:00’te' },
    { label: 'Yer', value: 'Duyurulacak', detail: 'TOBB ETÜ kampüsü' },
    { label: 'Katılım', value: 'Bireysel veya takım', detail: 'Takımlar en fazla 3 kişi' },
  ],
  // When things happen; `highlight` marks what participants must not miss.
  beforeRaceDay:
    'Robotunu kendi zamanında, istediğin yerde kur, kodla ve dene. Teknik sorularını eğitim WhatsApp grubundan sorabilirsin. Robot yarış günü sıfırdan yapılmaz; hazır getirilir.',
  dayPlan: [
    { time: '09:30–10:00', title: 'Hazırlık', text: 'Yarış alanının hazırlanması (ROGOYATO ekibi).' },
    { time: '10:00–14:45', title: 'Teknik danışma ve pist denemesi', text: 'Yarışmacılar deneme sürüşü yapar, eğitmenlere teknik sorularını sorar.' },
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
        'Yarışmaya 2026 Güz Arduino Eğitimi’ne katılan öğrenciler katılabilir.',
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
        'Robot, eğitimde kullanılan malzemelerle kurulur: 2WD şasi, iki TT motor, Arduino Uno, L298N motor sürücü, en fazla üç KH-09 kızılötesi sensör, motorlar için 4×AA pil yuvası ve Arduino için ayrı bir 9V pil.',
        'Ek motor, ek sensör, hazır çizgi izleme kartı veya uzaktan kumanda kullanılamaz.',
        'Kablo, bant, vida, kablo bağı, karton, yapıştırıcı, sıcak silikon ve sensör tutucu gibi bağlantı ve montaj malzemeleri serbesttir; şasi üzerinde yerleşim yarışmacıya bırakılmıştır.',
        'Robot tamamen otonom çalışır; deneme başladıktan sonra robota bilgisayar ya da kablo bağlanamaz.',
      ],
    },
    {
      title: 'Parkur',
      figure: {
        image: 'yarisma/cizgi-izleyen-robot/ornek-parkur-kesisme.svg',
        caption: 'Şekil 1 – Örnek parkur: çizgi kendisiyle kesişebilir, robot kesişmede düz devam eder. Yarışmada birden fazla parkur olabilir; parkurlar bu örnekten farklı olabilir.',
      },
      items: [
        'Parkur bilgileri daha sonra duyurulacaktır. Yarışmada birden fazla parkur kullanılabilir.',
        'Parkur, beyaz zemin üzerinde yaklaşık 2 cm genişliğinde siyah bir çizgiden oluşur.',
        'Parkur çizgisi kendisiyle kesişebilir; kesişme noktalarında robot düz devam eder (Şekil 1).',
        'Yarış günü 10:00–14:45 arasında yarış alanında deneme sürüşü yapılabilir.',
      ],
    },
    {
      title: 'Yarış ve puanlama',
      items: [
        'Robot başlangıç çizgisinin gerisine konur ve hakemin işaretiyle çalıştırılır. Süre hakemin işaretiyle başlar, robot parkuru tamamlayıp başlangıç çizgisini yeniden geçtiğinde durur. Bir deneme en fazla 3 dakika sürer.',
        'Bitirme: Robot parkurun tamamını izleyip başlangıç çizgisine dönerse parkuru bitirmiş olur; bu denemenin sonucu süresidir.',
        'Bitirememe: Robot çizgiyi tamamen kaybedip parkurdan çıkarsa, kesişmede başka kola saparsa, deneme sırasında robota dokunulursa ya da 3 dakika dolarsa deneme o noktada sona erer; bu denemenin sonucu, robotun ulaştığı en uzak noktanın başlangıçtan çizgi boyunca ölçülen mesafesidir.',
        'Her robotun her parkurda üç deneme hakkı vardır ve o parkurdaki en iyi denemesi geçerli sayılır. Bitiren deneme, bitiremeyen her denemeden iyidir; iki bitirmeden süresi kısa olan, iki bitirememeden mesafesi uzun olan daha iyidir.',
        'Sıralama şu ölçütlerle, sırayla yapılır: (1) bitirilen parkur sayısı, çok olan önde; (2) bitirilen parkurlardaki en iyi sürelerin toplamı, az olan önde; (3) bitirilemeyen parkurlarda ulaşılan mesafelerin toplamı, çok olan önde. Tek parkur kullanılırsa bu, o parkurdaki en iyi denemeye göre sıralamaktır.',
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
    { q: 'Takım olarak katılabilir miyim?', a: 'Evet. Tek başına ya da en fazla üç kişilik bir takımla katılabilirsin. Takımın tüm üyeleri Arduino Eğitimi katılımcısı olmalı ve bir kişi yalnızca bir takımda yer alabilir.' },
    { q: 'Robotu nerede ve ne zaman yapacağım?', a: 'Robotunu yarış gününe kadar kendi zamanında, istediğin yerde hazırlarsın. Yarış gününe tamamlanmış robotla gelinir; robotlar yarış günü sıfırdan yapılmaz.' },
    { q: 'Takıldığım yerde yardım alabilir miyim?', a: 'Hazırlık haftasında teknik sorularını eğitim WhatsApp grubundan sorabilirsin. Yarış günü 10:00–14:45 arasında yarış alanında eğitmenler teknik sorunlarda yardım eder; kod yazmaz ve taktik vermez.' },
    { q: 'Parkur nasıl olacak?', a: 'Parkur bilgileri daha sonra duyurulacak; yarışmada birden fazla parkur olabilir. Beyaz zemin üzerinde yaklaşık 2 cm genişliğinde siyah bir çizgi olacak; çizgi kendisiyle kesişebilir, kesişmelerde robot düz devam eder (Şartname, Şekil 1).' },
    { q: 'Yarışma nerede yapılacak?', a: 'Yarışmanın yapılacağı yer kesinleştiğinde bu sayfada ve eğitim WhatsApp grubunda duyurulacak.' },
    { q: 'Malzemelerim yanımda değilken nasıl çalışırım?', a: 'Sitemizdeki Arduino simülatörü, robot kodunun genel mantığını kurmak için kullanılabilir.' },
    { q: 'Sıralama nasıl belirlenir?', a: 'Her denemede robot ya parkuru bitirir ve sonucu süresi olur ya da bitiremez ve sonucu ulaştığı en uzak noktanın mesafesi olur. Bitiren deneme her zaman bitiremeyenden iyidir; bitirenler arasında kısa süre, bitiremeyenler arasında uzun mesafe öndedir. Her parkurda üç deneme hakkın var, en iyisi sayılır. Birden fazla parkur olursa önce bitirdiğin parkur sayısına, sonra bu parkurlardaki sürelerinin toplamına, sonra kalan parkurlarda ulaştığın mesafeye bakılır. Final yapılmaz; ilk üçe kupa verilir.' },
  ],
  contact: [
    { label: 'E-posta', value: 'rogoyato@gmail.com', href: 'mailto:rogoyato@gmail.com' },
    { label: 'Instagram', value: '@eturogoyato', href: 'https://www.instagram.com/eturogoyato/' },
  ],
  prizeNote: 'Kupalar, ödül sponsorumuz Westonya tarafından çok renkli 3B baskıyla üretilmektedir.',
  // The Materials tab: what a robot needs and what helps on the day.
  // Links go to Elektronikport, where the training's kit was bought.
  requiredMaterials: [
    { name: '2WD robot araba kiti (şasi, 2 TT motor, 2 tekerlek, serbest teker, 4×AA pil yuvası, vida ve somunlar)', count: '1', url: 'https://www.elektronikport.com/urun/2wd-robot-araba-kiti-arduino' },
    { name: 'Arduino Uno (eğitim setindeki CH340’lı kart) ve USB kablosu', count: '1', url: 'https://www.elektronikport.com/urun/arduino-uno-super-baslangic-seti-6040' },
    { name: 'L298N motor sürücü modülü', count: '1', url: 'https://www.elektronikport.com/urun/l298n-motor-surucu-modulu-h-kopru' },
    { name: 'KH-09 kızılötesi çizgi sensörü', count: '3 adede kadar', url: 'https://www.elektronikport.com/urun/ir-alici-verici-sensor-modulu-1' },
    { name: 'AA pil (motorlar için)', count: '4', url: 'https://www.elektronikport.com/kategori/pil' },
    { name: '9V pil ve DC jaklı pil başlığı (Arduino için, motorlardan ayrı)', count: '1', url: 'https://www.elektronikport.com/kategori/pil' },
    { name: 'Jumper kablolar (erkek-dişi ve dişi-dişi)', count: 'Yeteri kadar', url: 'https://www.elektronikport.com/kategori/jumper-kablo' },
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
  materials: ['2WD robot araba kiti', 'Arduino Uno', 'L298N', '3 adet KH-09', '4×AA pil', '9V pil (Arduino için)', 'Jumper kablolar'],
}
