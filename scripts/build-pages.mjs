// Runs after `vite build`. GitHub Pages only serves files that exist, so
// every page of the site gets its own copy of index.html (with its own
// title and address), and search engines get a sitemap of them all.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { arduinoWeeks } from '../src/utils/arduinoTraining.js'
import { lineRobotCompetition } from '../src/utils/lineRobotCompetition.js'
import { events } from '../src/utils/siteData.js'

const SITE = 'https://rogoyato.com'
const DIST = 'dist'

// [address, title, listed in the sitemap]
const pages = [
  ['/', null, true],
  ['/etkinlikler', 'Etkinlikler', true],
  ...events.map((event) => [`/etkinlikler/${event.id}`, event.title, true]),
  ...events.map((event) => [`/etkinlikler/${event.id}/basvuru`, `${event.title} Başvurusu`, false]),
  [lineRobotCompetition.path, lineRobotCompetition.title, true],
  ['/basarilar', 'Başarılar', true],
  ['/ekip', 'Ekibimiz', true],
  ['/ekip/basvuru', 'Ekip Başvurusu', true],
  ['/hakkimizda', 'Hakkımızda', true],
  ['/arduino', 'Arduino Eğitimi', true],
  ...arduinoWeeks.map(({ week }) => [`/arduino/hafta/${week}`, `Arduino Eğitimi ${week}. Hafta`, true]),
  ['/arduino/malzemeler', 'Arduino Eğitimi Malzemeleri', true],
  ['/arduino/simulator', 'Arduino Simülatörü', true],
  ['/arduino/kilit', 'Arduino Eğitimi', false],
  ['/snake-game', 'Snake', false],
]

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

function pageHtml(path, title) {
  const fullTitle = title ? `${title} | ROGOYATO` : 'ROGOYATO | TOBB ETÜ Robotik ve Gömülü Yazılım Topluluğu'
  const url = `${SITE}${path}`
  return template.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escape(fullTitle)}</title>\n    <link rel="canonical" href="${url}" />\n    <meta property="og:title" content="${escape(fullTitle)}" />\n    <meta property="og:url" content="${url}" />\n    <meta property="og:site_name" content="ROGOYATO" />`,
  )
}

for (const [path, title] of pages) {
  // /etkinlikler is served from etkinlikler.html, so the address needs
  // no trailing slash.
  const file = path === '/' ? join(DIST, 'index.html') : join(DIST, `${path.slice(1)}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, pageHtml(path, title))
}

// /etkinlikler is also a folder (it holds the event pages); in case the
// server looks in the folder first, the page is there as well.
for (const [path, title] of pages) {
  if (path !== '/' && existsSync(join(DIST, path.slice(1)))) {
    writeFileSync(join(DIST, path.slice(1), 'index.html'), pageHtml(path, title))
  }
}

// Any other address still opens the site, which sends it home.
writeFileSync(join(DIST, '404.html'), template)

const today = new Date().toISOString().slice(0, 10)
const urls = pages
  .filter(([, , listed]) => listed)
  .map(([path]) => `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)

console.log(`build-pages: ${pages.length} pages, ${urls.length} in the sitemap`)
