// Where the lock state lives: a gist (personal accounts only) or a file in a
// small data repository the organisation owns. The trainers' page reads the
// newest version and saves it through the GitHub API with a token allowed to
// edit it. Students read the public raw file (cached up to 5 minutes), or,
// for a private repository, the copy the site's deploy fetched (the page
// starts that deploy after saving).
//
//   { "gist": { "owner": "…", "id": "…", "file": "kilit.json" } }
//   { "repo": { "owner": "ROGOYATO", "name": "kilit-verisi", "branch": "main", "path": "kilit.json" },
//     "private": true,
//     "deploy": { "owner": "ROGOYATO", "name": "rogoyato-website", "workflow": "deploy.yml", "branch": "main" } }
const API = 'https://api.github.com'
const text = (state) => `${JSON.stringify(state, null, 2)}\n`
function toBase64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  // In chunks: spreading the whole file into one call overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
const fromBase64 = (value) => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), (c) => c.charCodeAt(0)))

export const rawUrl = (store) =>
  store.gist
    ? `https://gist.githubusercontent.com/${store.gist.owner}/${store.gist.id}/raw/${store.gist.file}`
    : `https://raw.githubusercontent.com/${store.repo.owner}/${store.repo.name}/${store.repo.branch}/${store.repo.path}`

export const describe = (store) => (store.gist ? `gist ${store.gist.owner}/${store.gist.id}` : `${store.repo.owner}/${store.repo.name}/${store.repo.path}`)

export async function readPublic(store) {
  const response = await fetch(rawUrl(store), { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Kilit bilgisi alınamadı (HTTP ${response.status}).`)
  return response.json()
}

async function api(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (response.status === 401) throw new Error('GitHub anahtarı geçersiz.')
  if (response.status === 403) throw new Error('GitHub anahtarının bu dosyayı düzenleme izni yok.')
  if (response.status === 404 && options.allowMissing) return null
  if (response.status === 404) throw new Error('Depo ya da dosya bulunamadı; anahtarın bu depoya erişimi olduğundan emin olun.')
  if (!response.ok) throw new Error(`GitHub isteği başarısız (HTTP ${response.status}).`)
  return response.status === 204 ? null : response.json()
}

const contentsPath = (repo) => `/repos/${repo.owner}/${repo.name}/contents/${repo.path}`

// The newest saved state, bypassing the raw file cache; null when the data
// repository does not have the file yet.
export async function readLatest(store, token) {
  if (store.gist) {
    const body = await api(`/gists/${store.gist.id}`, token)
    const file = body.files[store.gist.file]
    if (!file) throw new Error(`Gist'te ${store.gist.file} dosyası yok.`)
    return JSON.parse(file.truncated ? await (await fetch(file.raw_url)).text() : file.content)
  }
  const body = await api(`${contentsPath(store.repo)}?ref=${store.repo.branch}`, token, { allowMissing: true })
  return body ? JSON.parse(fromBase64(body.content)) : null
}

// Rebuilds the site so it picks up the state (private repositories).
export async function publish(store, token) {
  if (!store.deploy) return false
  const { owner, name, workflow, branch } = store.deploy
  await api(`/repos/${owner}/${name}/actions/workflows/${workflow}/dispatches`, token, { method: 'POST', body: JSON.stringify({ ref: branch }) })
  return true
}

export async function save(store, token, state, message = 'Kilit verisini güncelle') {
  if (store.gist) {
    await api(`/gists/${store.gist.id}`, token, { method: 'PATCH', body: JSON.stringify({ files: { [store.gist.file]: { content: text(state) } } }) })
    return
  }
  const existing = await api(`${contentsPath(store.repo)}?ref=${store.repo.branch}`, token, { allowMissing: true })
  await api(contentsPath(store.repo), token, {
    method: 'PUT',
    body: JSON.stringify({ message, branch: store.repo.branch, content: toBase64(text(state)), ...(existing ? { sha: existing.sha } : {}) }),
  })
}

// First-time setup. A gist is created (secret, unlisted); a data repository
// must already exist and gets the file written into it.
export async function create(token, target, state) {
  if (target.repo) {
    await save(target, token, state, 'Kilit verisini oluştur')
    return target
  }
  const body = await api('/gists', token, {
    method: 'POST',
    body: JSON.stringify({ description: 'ROGOYATO Arduino simülatörü kilit verisi (şifreli)', public: false, files: { 'kilit.json': { content: text(state) } } }),
  })
  return { gist: { owner: body.owner.login, id: body.id, file: 'kilit.json' } }
}
