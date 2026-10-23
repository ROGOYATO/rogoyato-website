// The simulator workspace's layout on large screens: which panels sit in
// which dock, which are folded, how wide the columns are. Remembered in
// this browser. The docks themselves are in Dock.jsx.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export const DockContext = createContext(null)
export const useDockPanel = () => useContext(DockContext)

const STORAGE_KEY = 'rogoyato-sim-layout-v1'
const PANEL_IDS = ['selected', 'parts', 'connections', 'issues', 'car', 'carWiring', 'serial']
export const DEFAULT_LAYOUT = {
  // 3: code | 3D | panels; 2: code over panels | 3D over panels; null: by
  // the screen (see useAutoColumns).
  columns: null,
  // The code column fits the exercises' 78-character comment lines.
  left: 700, // px, in three columns
  left2: 700, // px, in two columns
  right: 360, // px
  editor: 0.6, // share of the left column's height
  bench: 0.62, // in two columns: share of the right column's height
  docks: { left: ['serial'], right: ['selected', 'parts', 'connections', 'issues', 'car', 'carWiring'] },
  collapsed: {},
}

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (!saved?.docks) return DEFAULT_LAYOUT
    // Panels added since the layout was saved go where they go by default.
    const known = new Set([...saved.docks.left, ...saved.docks.right])
    const docks = { left: saved.docks.left.filter((id) => PANEL_IDS.includes(id)), right: saved.docks.right.filter((id) => PANEL_IDS.includes(id)) }
    for (const side of ['left', 'right']) for (const id of DEFAULT_LAYOUT.docks[side]) if (!known.has(id)) docks[side].push(id)
    return { ...DEFAULT_LAYOUT, ...saved, docks, collapsed: saved.collapsed ?? {} }
  } catch {
    return DEFAULT_LAYOUT
  }
}

export function useDockLayout() {
  const [layout, setLayout] = useState(load)
  const [dragging, setDragging] = useState(null)
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch {
      // Storage can be unavailable; the layout then lasts for this visit.
    }
  }, [layout])
  const update = useCallback((patch) => setLayout((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) })), [])
  // Puts a panel into a dock, before another panel or at its end.
  const move = useCallback(
    (id, side, before = null) =>
      update((current) => {
        const docks = { left: current.docks.left.filter((item) => item !== id), right: current.docks.right.filter((item) => item !== id) }
        const at = before ? docks[side].indexOf(before) : -1
        docks[side].splice(at < 0 ? docks[side].length : at, 0, id)
        return { docks }
      }),
    [update],
  )
  const toggle = useCallback((id) => update((current) => ({ collapsed: { ...current.collapsed, [id]: !current.collapsed[id] } })), [update])
  const reset = useCallback(() => setLayout(DEFAULT_LAYOUT), [])
  return { layout, update, move, toggle, reset, dragging, setDragging }
}

export function useWideScreen() {
  const query = '(min-width: 1024px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const change = () => setWide(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return wide
}

// Three columns on a very wide screen (21:9 and wider, or a large monitor),
// two on an ordinary 16:9 or 16:10 one.
export function useAutoColumns() {
  const pick = () => (window.innerWidth / window.innerHeight >= 2 || window.innerWidth >= 2400 ? 3 : 2)
  const [columns, setColumns] = useState(pick)
  useEffect(() => {
    const change = () => setColumns(pick())
    window.addEventListener('resize', change)
    return () => window.removeEventListener('resize', change)
  }, [])
  return columns
}
