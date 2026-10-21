# Arduino derleme sunucusu

> **İsteğe bağlı.** Simülatör artık kodu öğrencinin tarayıcısında derliyor
> (GCC'nin WebAssembly sürümü, bkz. `scripts/build-browser-compiler.mjs`). Bu sunucu
> yalnızca derleyiciyi çalıştıramayan çok eski tarayıcılar için yedektir; kurmasanız
> da simülatör tam çalışır.

Sunucu, öğrencinin kodunu gerçek Arduino derleyicisiyle (`arduino-cli`, `arduino:avr:uno`)
derler, kodu çalıştırmaz; derlenen program tarayıcıda `avr8js` ile çalışır. Kurulursa
adresi GitHub deposunda `ARDUINO_COMPILE_URL` değişkenine yazılır ve tarayıcı derleyicisi
kullanılamadığında devreye girer.

## İçindekiler

- `server.mjs`: Bağımlılığı olmayan Node.js sunucusu.
- `Dockerfile`: arduino-cli 1.5.1, `arduino:avr` 1.8.8, Servo 1.3.0, DHT sensor library 1.4.7
  ve Adafruit Unified Sensor 1.1.15 kurulu imaj.

## Güvenlik önlemleri

- Yalnızca izin verilen başlıklar eklenebilir (`Servo.h`, `DHT.h`, standart C başlıkları).
  Dosya yolu içeren `#include`, satır içi assembly, `.incbin` ve `#pragma` reddedilir;
  böylece kod sunucudaki dosyaları okuyamaz.
- Kod en fazla 64 KB, derleme en fazla 30 saniye.
- IP başına dakikada 20 derleme, aynı anda 2 derleme, en fazla 20 bekleyen istek.
- Yalnızca `ALLOWED_ORIGINS` içindeki sitelerden gelen istekler kabul edilir.
- Aynı kod tekrar gönderilirse sonuç önbellekten döner (son 300 derleme).
- İmaj root olmayan `node` kullanıcısıyla çalışır.

## Yerelde çalıştırma

```bash
docker build -t rogoyato-compile compile-server
docker run -p 8080:8080 rogoyato-compile
curl localhost:8080/health   # ok
```

## Yayına alma

1. Docker imajı çalıştırabilen bir barındırma hizmetinde (ör. Render, Google Cloud Run,
   Fly.io) yeni bir servis oluşturun. Kaynak olarak bu depoyu ve `compile-server`
   klasörünü, yapı türü olarak Dockerfile seçin. Port: `8080` (ya da hizmetin verdiği
   `PORT` değişkeni; sunucu onu kullanır).
2. Gerekirse ortam değişkeni ekleyin:
   - `ALLOWED_ORIGINS`: Virgülle ayrılmış site adresleri. Varsayılan:
     `https://rogoyato.com,https://www.rogoyato.com,http://localhost:5173,http://localhost:4173`
   - `RATE_LIMIT_PER_MINUTE`, `MAX_PARALLEL`, `MAX_QUEUE`: Sınırları değiştirmek için.
3. Servisin adresini (ör. `https://rogoyato-compile.onrender.com`) GitHub'da
   **Settings → Secrets and variables → Actions → Variables** altında
   `ARDUINO_COMPILE_URL` adıyla kaydedin.
4. `main` dalına bir sonraki push'ta site bu adresle yeniden derlenir ve simülatördeki
   "Derle ve çalıştır" düğmesi açılır.

Ücretsiz planlarda servis bir süre kullanılmayınca uyuyabilir; o durumda ilk derleme
bir dakikaya kadar sürebilir, sonrakiler 1–2 saniyedir.
