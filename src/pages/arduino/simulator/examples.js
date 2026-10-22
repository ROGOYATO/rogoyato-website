// The simulator's exercises, following the training weeks. Each starts with
// an empty sketch and its parts placed but unwired. Blink's answer is here;
// the others are encrypted one by one in the lock state and open with
// their own code or their week's (src/utils/answerLock.js, scripts/answers.mjs).

// Breadboard layouts: the board sits beside the digital header and parts
// sit in its lower half (rows f–j), next to the Uno.
const P = 0.254
const BOARD = { id: 'bb', type: 'breadboard', position: [0, -9], rotation: 0 }
const col = (n) => (n - 32) * P
const row = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((name, i) => [name, i < 5 ? -0.381 - (4 - i) * P : 0.381 + (i - 5) * P]))
// A resistor standing from row j into the bottom − rail.
const toRail = (row.j + 2.413) / 2
const onBoard = (x, z) => [BOARD.position[0] + x, BOARD.position[1] + z]

const carCircuit = {
  parts: [
    { id: 'driver', type: 'motorDriver', position: [0, 0] },
    { id: 'ir-left', type: 'irSensor', position: [0, 0] },
    { id: 'ir-center', type: 'irSensor', position: [0, 0] },
    { id: 'ir-right', type: 'irSensor', position: [0, 0] },
  ],
  // Left unwired: students connect the driver and sensors themselves.
  wires: [],
}

export const EXAMPLES = [
  {
    id: 'blink',
    week: 1,
    title: 'Blink',
    summary: 'Karttaki dahili LED’i (LED_BUILTIN, D13’teki L LED’i) yarım saniyede bir yakıp söndür. Kablo gerekmez.',
    mode: 'bench',
    code: `// Görev: Karttaki dahili LED’i (LED_BUILTIN, D13’teki L LED’i) yarım
// saniyede bir yakıp söndür. Kablo gerekmez.

void setup() {

}

void loop() {

}
`,
    circuit: { parts: [], wires: [] },
    // The first exercise; its answer is open to everyone.
    answer: {
      code: `// Hafta 1: İlk program. LED_BUILTIN, Uno'da D13 pinidir.
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH); // LED'i yak
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);  // LED'i söndür
  delay(500);
}
`,
      wires: [],
    },
  },
  {
    id: 'breadboard-led',
    week: 1,
    title: 'Breadboard’da LED',
    summary: 'Breadboard’daki LED’i 330 Ω dirençle D13’e bağla ve yarım saniyede bir yakıp söndür.',
    mode: 'bench',
    code: `// Görev: Breadboard’daki LED’i 330 Ω dirençle D13’e bağla ve yarım
// saniyede bir yakıp söndür.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        BOARD,
        { id: 'r1', type: 'resistor', position: onBoard(col(19), row.h), rotation: 0, props: { ohms: 330 } },
        { id: 'led1', type: 'bareLed', position: onBoard(col(21.5), row.f), rotation: 0, props: { color: 'red' } },
      ],
      wires: [],
    },
  },
  {
    id: 'buton-led',
    week: 1,
    title: 'Butonla LED',
    summary: 'Butona basılı tutunca LED yansın, bırakınca sönsün. Buton D2’ye, LED D8’e; buton bırakılınca D2 boşta kalmasın.',
    mode: 'bench',
    code: `// Görev: Butona basılı tutunca LED yansın, bırakınca sönsün. Buton D2’ye,
// LED D8’e; buton bırakılınca D2 boşta kalmasın.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        BOARD,
        // The button straddles the channel: columns 11 and 13 join when pressed.
        { id: 'btn', type: 'tactButton', position: onBoard(col(12), 0), rotation: 0 },
        // 10 kΩ pull-down standing from j13 into the − rail.
        { id: 'r2', type: 'resistor', position: onBoard(col(13), toRail), rotation: 90, props: { ohms: 10000 } },
        { id: 'r1', type: 'resistor', position: onBoard(col(19), row.h), rotation: 0, props: { ohms: 330 } },
        { id: 'led1', type: 'bareLed', position: onBoard(col(21.5), row.f), rotation: 0, props: { color: 'green' } },
      ],
      wires: [],
    },
  },
  {
    id: 'pot-pwm',
    week: 2,
    title: 'Potansiyometre ile parlaklık',
    summary: 'Potansiyometreyle LED’in parlaklığını ayarla, okunan değeri ve PWM değerini Serial Monitor’e yaz. Pot A0’a, LED PWM’li D9’a.',
    mode: 'bench',
    code: `// Görev: Potansiyometreyle LED’in parlaklığını ayarla, okunan değeri ve
// PWM değerini Serial Monitor’e yaz. Pot A0’a, LED PWM’li D9’a.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        BOARD,
        // The pot's legs in j8, j10 and j12, its shaft towards you.
        { id: 'pot', type: 'potentiometer', position: onBoard(col(10), row.j), rotation: 0 },
        { id: 'r1', type: 'resistor', position: onBoard(col(19), row.h), rotation: 0, props: { ohms: 330 } },
        { id: 'led1', type: 'bareLed', position: onBoard(col(21.5), row.f), rotation: 0, props: { color: 'yellow' } },
      ],
      wires: [],
    },
  },
  {
    id: 'ldr-gece-lambasi',
    week: 2,
    title: 'LDR ile gece lambası',
    summary: 'Ortam karardığında LED yansın (analogRead 400’ün altı karanlık), ışık değerini Serial’e yaz. LDR ile 10 kΩ direnç bir gerilim bölücü kurar; orta noktaları A1’e, LED D6’ya. Işığı LDR’yi seçip kaydırıcıyla değiştir.',
    mode: 'bench',
    code: `// Görev: Ortam karardığında LED yansın (analogRead 400’ün altı karanlık),
// ışık değerini Serial’e yaz. LDR ile 10 kΩ direnç bir gerilim bölücü
// kurar; orta noktaları A1’e, LED D6’ya. Işığı LDR’yi seçip kaydırıcıyla
// değiştir.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        BOARD,
        { id: 'ldr', type: 'ldr', position: onBoard(col(9.5), row.f), rotation: 0 },
        { id: 'r2', type: 'resistor', position: onBoard(col(12), row.h), rotation: 0, props: { ohms: 10000 } },
        { id: 'r1', type: 'resistor', position: onBoard(col(19), row.h), rotation: 0, props: { ohms: 330 } },
        { id: 'led1', type: 'bareLed', position: onBoard(col(21.5), row.f), rotation: 0, props: { color: 'white' } },
      ],
      wires: [],
    },
    inputs: { ldr: { light: 70 } },
  },
  {
    id: 'mesafe-uyari',
    week: 2,
    title: 'Mesafe uyarısı',
    summary: 'HC-SR04 ile mesafeyi ölçüp Serial’e yaz; engel 20 cm’den yakınsa buzzer ötsün. TRIG D7’ye, ECHO D6’ya, buzzer D8’e.',
    mode: 'bench',
    code: `// Görev: HC-SR04 ile mesafeyi ölçüp Serial’e yaz; engel 20 cm’den yakınsa
// buzzer ötsün. TRIG D7’ye, ECHO D6’ya, buzzer D8’e.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        { id: 'sonar', type: 'ultrasonic', position: [-7, -2], rotation: -90 },
        BOARD,
        { id: 'buzzer', type: 'buzzer', position: onBoard(col(22.5), row.g), rotation: 0 },
      ],
      wires: [],
    },
    inputs: { sonar: { distance: 35 } },
  },
  {
    id: 'dht11',
    week: 2,
    title: 'DHT11 sıcaklık ve nem',
    summary: 'DHT11’den sıcaklık ve nemi 2 saniyede bir okuyup Serial Monitor’e yaz. DATA D4’e.',
    mode: 'bench',
    code: `// Görev: DHT11’den sıcaklık ve nemi 2 saniyede bir okuyup Serial Monitor’e
// yaz. DATA D4’e.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [{ id: 'dht', type: 'dht11', position: [1.6, -6.8], rotation: 180 }],
      wires: [],
    },
  },
  {
    id: 'servo-pot',
    week: 3,
    title: 'Servoyu potansiyometreyle çevirmek',
    summary: 'Potansiyometreyi çevirince servo 0–180° arasında aynı oranda dönsün. Servo sinyali D9’a, pot A0’a.',
    mode: 'bench',
    code: `// Görev: Potansiyometreyi çevirince servo 0–180° arasında aynı oranda
// dönsün. Servo sinyali D9’a, pot A0’a.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        BOARD,
        { id: 'servo', type: 'servo', position: [-7.5, -1], rotation: 90 },
        { id: 'pot', type: 'potentiometer', position: onBoard(col(10), row.j), rotation: 0 },
      ],
      wires: [],
    },
  },
  {
    id: 'ir-rgb',
    week: 3,
    title: 'KH-09 ile RGB LED',
    summary: 'IR sensör siyah çizgiyi görünce RGB LED kırmızı, beyaz zeminde yeşil yansın. Sensör D2’ye; R, G, B uçları D11, D10, D9’a.',
    mode: 'bench',
    code: `// Görev: IR sensör siyah çizgiyi görünce RGB LED kırmızı, beyaz zeminde
// yeşil yansın. Sensör D2’ye; R, G, B uçları D11, D10, D9’a.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        { id: 'ir', type: 'irSensor', position: [6.5, -1.5], rotation: 0 },
        BOARD,
        // The LED in the top half; each colour leg reaches the bottom half
        // through its own 330 Ω resistor across the channel.
        { id: 'rgb', type: 'rgbLed', position: onBoard(col(21.5), row.b), rotation: 0 },
        ...[['rR', 20], ['rG', 22], ['rB', 23]].map(([id, n]) => ({ id, type: 'resistor', position: onBoard(col(n), (row.d + row.f) / 2), rotation: 90, props: { ohms: 330 } })),
      ],
      wires: [],
    },
  },
  {
    id: 'yedi-segment',
    week: 3,
    title: '7 segment sayaç',
    summary: 'Gösterge her saniye 0’dan 9’a kadar saysın. a–g segmentleri D2–D8’e; COM, 330 Ω dirençle GND’ye.',
    mode: 'bench',
    code: `// Görev: Gösterge her saniye 0’dan 9’a kadar saysın. a–g segmentleri
// D2–D8’e; COM, 330 Ω dirençle GND’ye.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [
        BOARD,
        // Across the channel: its top legs in row d, the bottom ones in row h.
        { id: 'seg', type: 'sevenSegment', position: onBoard(col(12), (row.d + row.h) / 2), rotation: 0 },
        { id: 'r1', type: 'resistor', position: onBoard(col(12), toRail), rotation: 90, props: { ohms: 330 } },
      ],
      wires: [],
    },
  },
  {
    id: 'motorlar',
    week: 4,
    title: 'L298N ile iki motor',
    summary: 'Motorları sırayla ileri, geri, sağa, sola döndür ve durdur; her adımı Serial’e yaz. ENA D5, IN1 D7, IN2 D8, ENB D6, IN3 D9, IN4 D10.',
    mode: 'bench',
    code: `// Görev: Motorları sırayla ileri, geri, sağa, sola döndür ve durdur; her
// adımı Serial’e yaz. ENA D5, IN1 D7, IN2 D8, ENB D6, IN3 D9, IN4 D10.

void setup() {

}

void loop() {

}
`,
    circuit: {
      parts: [{ id: 'driver', type: 'motorDriver', position: [0, -9.5], rotation: 180 }],
      wires: [],
    },
  },
  {
    id: 'robot-araba',
    week: 5,
    title: 'Robot araba',
    summary: 'Yarışma arabası çizgiyi izlesin. L298N ve üç KH-09 sensörü takılı ama bağlı değil; “Araba kabloları”ndan bağla. KH-09 siyah çizgide HIGH, beyaz zeminde LOW verir.',
    mode: 'car',
    code: `// Görev: Yarışma arabası çizgiyi izlesin. L298N ve üç KH-09 sensörü takılı
// ama bağlı değil; “Araba kabloları”ndan bağla. KH-09 siyah çizgide HIGH,
// beyaz zeminde LOW verir.

void setup() {

}

void loop() {

}
`,
    circuit: { parts: [], wires: [] },
    carCircuit,
  },
  {
    id: 'bos',
    week: 0,
    title: 'Boş proje',
    summary: 'Kendi devrenizi kurun: “Parça ekle” ile parça seçin, pinlerine tıklayıp Uno’ya bağlayın.',
    mode: 'bench',
    code: `void setup() {
  // bir kez çalışır
}

void loop() {
  // sürekli tekrar eder
}
`,
    circuit: { parts: [], wires: [] },
  },
]

export const CAR_PARTS = carCircuit.parts

// Small, stable hash so a sketch can be matched with its precompiled hex.
export function sketchHash(code) {
  let hash = 0x811c9dc5
  for (let i = 0; i < code.length; i += 1) {
    hash ^= code.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
