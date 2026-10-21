// Page passwords are five of these words and a number: easy to remember,
// about 46 bits to guess. ASCII only, so any keyboard types them.
const WORDS = (
  'ada adim agac akil akrep alarm alev altin ambar anahtar anten arena arma armut asker aslan atlas avci ayna ' +
  'ayva bahar balik balon bambu banka bando baraj bardak bayrak bekci beton biber bilet bisiklet bitki bobin boya ' +
  'bulut burun cadde canta cennet cep ceviz cimen damla dalga dans defne defter deniz deve dolap domates dut ' +
  'duvar ekmek elma elmas emek erik eser fanus fener fidan filiz fincan firin fitil gemi gezgin giyim gol gonca ' +
  'guvercin hamak harita hasat hava havuz hazine hediye hilal hurma inci irmak istasyon iz jeton kabak kafes ' +
  'kahve kalem kale kamera kanal kanat kanepe kaplan karanfil kardelen kartal kartpostal kasa kavak kayak kaya ' +
  'kedi kelebek kemer kerpic kiraz kitap koala kompas konak korsan koy kral kum kumru kupa kurabiye kurt kutu ' +
  'labirent lale lamba leylek limon lira lokum maden manav mandal mantar marul masa masal mavi mekik mektup ' +
  'merdiven mermer meyve mimar mineral misafir model motor mozaik muz nane nehir nergis nokta ocak orkide orman ' +
  'otel otobus pamuk papatya park pasta patika pencere pergel pirinc pilot piyano planet portakal pusula radar ' +
  'rakam ray robot roket ruzgar saat saksi salkim sandal sarmasik saray sayfa sedir sehpa servi sinema sincap ' +
  'sirket sokak sonbahar soba sofra sohbet somun sorgu sopa sulu tabak tabela tahta takvim talep tarla tavuk ' +
  'tekne telefon tepe terazi tilki tohum top toprak tren tuval tuz umut uzay vadi vagon valiz vapur vazo veri ' +
  'yaka yaprak yarim yayla yelken yildiz yogurt yol yonca yorgan yumak yunus yuva zambak zeytin zil zirve zurna ' +
  'atom bina bulmaca cetvel cizgi dergi dinamo ekran enerji fosil'
).split(' ')

export function suggestPassphrase() {
  const pick = (n) => {
    const values = globalThis.crypto.getRandomValues(new Uint32Array(1))
    return values[0] % n
  }
  return [...Array.from({ length: 5 }, () => WORDS[pick(WORDS.length)]), 10 + pick(90)].join('-')
}
