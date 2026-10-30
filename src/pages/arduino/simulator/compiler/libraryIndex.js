// The Arduino Library Manager's index, cut down to what the simulator needs:
// the newest release of every library that runs on AVR boards. The deploy
// writes it to /arduino-libraries.json (scripts/build-library-index.mjs);
// without that file the full index is fetched and cut down here.
//
// Entry: [name, version, zip path under DOWNLOADS, headers, dependencies, flags]
// flags: 1 = made for AVR (not just "*"), 2 = an official Arduino library.

export const FULL_INDEX = 'https://downloads.arduino.cc/libraries/library_index.json.gz'
export const DOWNLOADS = 'https://downloads.arduino.cc/libraries/'

function compareVersions(a, b) {
  const pa = a.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0)
  const pb = b.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const difference = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (difference) return difference
  }
  return 0
}

export function compactIndex(index) {
  const latest = new Map()
  const headers = new Map() // newest release that lists its headers
  for (const release of index.libraries) {
    const current = latest.get(release.name)
    if (!current || compareVersions(release.version, current.version) > 0) latest.set(release.name, release)
    if (release.providesIncludes?.length) {
      const known = headers.get(release.name)
      if (!known || compareVersions(release.version, known.version) > 0) headers.set(release.name, release)
    }
  }
  const entries = []
  for (const release of latest.values()) {
    const architectures = (release.architectures ?? []).map((name) => name.toLowerCase())
    if (!architectures.some((name) => name === '*' || name === 'avr') || !release.url.startsWith(DOWNLOADS)) continue
    const flags = (architectures.includes('avr') ? 1 : 0) | ((release.types ?? []).includes('Arduino') ? 2 : 0)
    entries.push([
      release.name,
      release.version,
      release.url.slice(DOWNLOADS.length),
      headers.get(release.name)?.providesIncludes ?? [],
      (release.dependencies ?? []).map((dependency) => dependency.name),
      flags,
    ])
  }
  return entries
}

const squash = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '')
const archiveName = (path) => path.split('/').pop().replace(/-[^-]*\.zip$/, '')

// The libraries that may provide a header, most likely first: the ones whose
// release lists it, then those named like it (many releases list nothing).
// The caller checks that the downloaded library really has the header.
export function librariesFor(entries, header) {
  const file = header.split('/').pop()
  const base = squash(file.replace(/\.(h|hh|hpp)$/i, ''))
  const scored = []
  for (const entry of entries) {
    const [name, , path, headers, , flags] = entry
    const names = [squash(name), squash(archiveName(path))]
    let score = 0
    if (names.includes(base)) score += 10
    else if (base.length >= 3 && names.some((candidate) => candidate.length >= 3 && (candidate.startsWith(base) || base.startsWith(candidate)))) score += 6
    if (score && [name, archiveName(path)].some((candidate) => candidate.toLowerCase() === file.replace(/\.(h|hh|hpp)$/i, '').toLowerCase())) score += 3
    if (headers.includes(header) || headers.includes(file)) score += 5
    if (!score) continue
    if (flags & 2) score += 2
    if (flags & 1) score += 1
    scored.push([score, entry])
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1][0].length - b[1][0].length).map(([, entry]) => entry)
}

export const findLibrary = (entries, name) => entries.find((entry) => entry[0] === name) ?? null
