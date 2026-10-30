// Run by the deploy workflow before the build: when the simulator's lock
// state lives in a private repository (answers/store.json), downloads it
// into the build with the KILIT_TOKEN secret (read access to that
// repository). Otherwise, or on failure, the copy in the repository is used;
// without one the deploy stops, so the live site keeps its answers.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const DIR = new URL('../src/pages/arduino/simulator/answers/', import.meta.url)
const store = JSON.parse(readFileSync(new URL('store.json', DIR), 'utf8'))
const token = process.env.KILIT_TOKEN

function fallback(reason) {
  if (existsSync(new URL('kilit.json', DIR))) {
    console.log(`::warning::${reason}; sitedeki kilit verisi kullanılıyor.`)
    return
  }
  console.log(`::error::${reason}; sitede kilit verisi de yok, yayın durduruldu (canlı site değişmedi).`)
  process.exit(1)
}

if (!store.repo || !store.private) {
  console.log('Kilit verisi özel bir depoda değil; indirilecek bir şey yok.')
} else if (!token) {
  fallback('KILIT_TOKEN tanımlı değil')
} else {
  const { owner, name, branch, path } = store.repo
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=${branch}`, {
    headers: { Accept: 'application/vnd.github.raw+json', Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    fallback(`Kilit verisi indirilemedi (HTTP ${response.status})`)
  } else {
    const body = await response.json()
    // The raw file, or the contents API's base64 wrapper around it.
    const state = body.content && !body.exercises ? JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')) : body
    if (!state.exercises || !state.weeks || !state.page) {
      fallback('İndirilen kilit verisi geçersiz')
    } else {
      writeFileSync(new URL('kilit.json', DIR), `${JSON.stringify(state)}\n`)
      console.log(`Kilit verisi ${owner}/${name} deposundan alındı (${Object.keys(state.exercises).length} uygulama).`)
    }
  }
}
