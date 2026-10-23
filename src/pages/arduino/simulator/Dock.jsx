// The simulator's workspace on large screens: the editor, the 3D view and
// docks of panels side by side, their sizes dragged to taste. Panels fold
// shut and move between docks by their grip (drag, or arrow keys on it).
import { useState } from 'react'
import { DockContext } from './dockLayout'

// One dock: the panels in `panels` (id → element, null when not shown) in
// the layout's order, each one a drop target, the dock's end another.
export function Dock({ side, dock, panels, className = '' }) {
  const { layout, move, toggle, dragging, setDragging } = dock
  const [over, setOver] = useState(null) // panel id, or 'end'
  const ids = layout.docks[side].filter((id) => panels[id])
  const allow = (event) => {
    if (!dragging) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }
  const drop = (event, before) => {
    if (!dragging) return
    event.preventDefault()
    event.stopPropagation()
    if (dragging !== before) move(dragging, side, before)
    setDragging(null)
    setOver(null)
  }
  // Arrow keys on a grip: up/down reorder, left/right change docks.
  const keys = (event, id) => {
    const list = layout.docks[side]
    const index = list.indexOf(id)
    if (event.key === 'ArrowUp' && index > 0) move(id, side, list[index - 1])
    else if (event.key === 'ArrowDown' && index < list.length - 1) move(id, side, list[index + 2] ?? null)
    else if (event.key === 'ArrowLeft' && side === 'right') move(id, 'left')
    else if (event.key === 'ArrowRight' && side === 'left') move(id, 'right')
    else return
    event.preventDefault()
    // Keep the focus on the grip that moved.
    requestAnimationFrame(() => document.querySelector(`[data-dock-grip="${id}"]`)?.focus())
  }
  return (
    <div
      data-dock-scroll
      className={`${className} ${dragging ? 'rounded-xl outline-2 outline-dashed outline-teal-500/40' : ''}`}
      onDragOver={(event) => {
        allow(event)
        if (dragging && over === null) setOver('end')
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOver(null)
      }}
      onDrop={(event) => drop(event, null)}
    >
      {ids.map((id) => (
        <div
          key={id}
          data-dock-panel={id}
          onDragOver={(event) => {
            allow(event)
            if (dragging) setOver(id)
          }}
          onDrop={(event) => drop(event, id)}
          className={`relative ${dragging === id ? 'opacity-40' : ''}`}
        >
          {over === id && dragging !== id ? <div className="absolute -top-1.5 left-2 right-2 h-1 rounded-full bg-teal-500" /> : null}
          <DockContext.Provider
            value={{
              id,
              collapsed: Boolean(layout.collapsed[id]),
              toggle: () => toggle(id),
              grip: {
                draggable: true,
                'data-dock-grip': id,
                onDragStart: (event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', id)
                  const panel = event.currentTarget.closest('[data-dock-panel]')
                  if (panel) event.dataTransfer.setDragImage(panel, 24, 16)
                  setDragging(id)
                },
                onDragEnd: () => {
                  setDragging(null)
                  setOver(null)
                },
                onKeyDown: (event) => keys(event, id),
              },
            }}
          >
            {panels[id]}
          </DockContext.Provider>
        </div>
      ))}
      {dragging ? (
        <div className={`rounded-xl border-2 border-dashed px-3 py-4 text-center text-xs ${over === 'end' ? 'border-teal-500 text-teal-700 dark:text-teal-300' : 'border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400'}`}>
          Buraya bırakın
        </div>
      ) : null}
    </div>
  )
}

// A bar between two columns (or rows) that resizes them as it is dragged;
// arrow keys move it too.
export function Splitter({ direction = 'vertical', onMove, label }) {
  const vertical = direction === 'vertical'
  const start = (event) => {
    event.preventDefault()
    const bar = event.currentTarget
    bar.setPointerCapture(event.pointerId)
    let last = vertical ? event.clientX : event.clientY
    const moveTo = (moveEvent) => {
      const now = vertical ? moveEvent.clientX : moveEvent.clientY
      onMove(now - last)
      last = now
    }
    const end = () => {
      bar.removeEventListener('pointermove', moveTo)
      bar.removeEventListener('pointerup', end)
      bar.removeEventListener('pointercancel', end)
      document.body.style.cursor = ''
    }
    bar.addEventListener('pointermove', moveTo)
    bar.addEventListener('pointerup', end)
    bar.addEventListener('pointercancel', end)
    document.body.style.cursor = vertical ? 'col-resize' : 'row-resize'
  }
  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      tabIndex={0}
      onPointerDown={start}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 60 : 16
        const delta = { ArrowLeft: -step, ArrowRight: step, ArrowUp: -step, ArrowDown: step }[event.key]
        if (delta === undefined || (vertical ? /Up|Down/ : /Left|Right/).test(event.key)) return
        event.preventDefault()
        onMove(delta)
      }}
      className={`group flex touch-none items-center justify-center rounded-full outline-none focus-visible:bg-teal-500/30 ${vertical ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'}`}
    >
      <span className={`rounded-full bg-slate-300 transition group-hover:bg-teal-500 group-focus-visible:bg-teal-500 dark:bg-white/15 ${vertical ? 'h-10 w-1' : 'h-1 w-10'}`} />
    </div>
  )
}
