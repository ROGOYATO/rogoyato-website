// The simulator's workspace on large screens: the editor, the 3D view and
// docks of panels side by side, their sizes dragged to taste. Panels fold
// shut and move between docks by their grip (drag, or arrow keys on it).
import { useRef, useState } from 'react'
import { DockContext } from './dockLayout'

// One dock: the panels in `panels` (id → element, null when not shown) in
// the layout's order, each one a drop target, the dock's end another. It
// shows the layout's docks in `sides` one after another (in two columns the
// 3D view's holds the centre's and the panel column's); a drop at its end
// goes into the last. `beside` names the docks the arrow keys move a panel
// to: { left, right }.
export function Dock({ sides, beside = {}, dock, panels, className = '' }) {
  const { layout, move, toggle, dragging, setDragging } = dock
  const [over, setOver] = useState(null) // panel id, or 'end'
  const pressedOn = useRef(null) // where the pointer went down in a title bar
  const list = sides.flatMap((side) => layout.docks[side] ?? [])
  const ids = list.filter((id) => panels[id])
  const sideOf = (id) => sides.find((side) => layout.docks[side]?.includes(id))
  const last = sides[sides.length - 1]
  const allow = (event) => {
    if (!dragging) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }
  // Where a drop at the pointer would go: before the first panel whose
  // middle is below it, or (null) at the end. The gaps between panels count
  // too, so the line shown is always where the panel lands.
  const targetAt = (event) => {
    for (const element of event.currentTarget.querySelectorAll(':scope > [data-dock-panel]')) {
      const box = element.getBoundingClientRect()
      if (event.clientY < box.top + box.height / 2) return element.dataset.dockPanel
    }
    return null
  }
  // Dropping a panel just before itself or the panel after it leaves it
  // where it is.
  const stays = (before) => {
    const index = ids.indexOf(dragging)
    return index >= 0 && (before === dragging || before === (ids[index + 1] ?? null))
  }
  const drop = (event) => {
    if (!dragging) return
    event.preventDefault()
    const before = targetAt(event)
    if (!stays(before)) move(dragging, before ? sideOf(before) : last, before)
    setDragging(null)
    setOver(null)
  }
  // Arrow keys on a grip: up/down reorder, left/right change docks.
  const keys = (event, id) => {
    const index = list.indexOf(id)
    if (event.key === 'ArrowUp' && index > 0) move(id, sideOf(list[index - 1]), list[index - 1])
    else if (event.key === 'ArrowDown' && index < list.length - 1) {
      const after = list[index + 2]
      if (after) move(id, sideOf(after), after)
      else move(id, sideOf(list[index + 1]))
    } else if (event.key === 'ArrowLeft' && beside.left) move(id, beside.left)
    else if (event.key === 'ArrowRight' && beside.right) move(id, beside.right)
    else return
    event.preventDefault()
    // Keep the focus on the grip that moved.
    requestAnimationFrame(() => document.querySelector(`[data-dock-grip="${id}"]`)?.focus())
  }
  return (
    <div
      className={`${className} ${dragging ? 'rounded-xl outline-2 outline-dashed outline-teal-500/40' : ''}`}
      onDragOver={(event) => {
        if (!dragging) return
        allow(event)
        const before = targetAt(event)
        const next = stays(before) ? null : (before ?? 'end')
        if (next !== over) setOver(next)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOver(null)
      }}
      onDrop={drop}
    >
      {ids.map((id) => (
        <div key={id} data-dock-panel={id} className={`relative ${dragging === id ? 'opacity-40' : ''}`}>
          {over === id ? <div className="absolute -top-2 left-2 right-2 h-1 rounded-full bg-teal-500" /> : null}
          <DockContext.Provider
            value={{
              id,
              collapsed: Boolean(layout.collapsed[id]),
              toggle: () => toggle(id),
              // The grip button: focus and arrow keys.
              grip: {
                'data-dock-grip': id,
                onKeyDown: (event) => keys(event, id),
              },
              // The whole title bar drags the panel, except from a control
              // in it (a menu or a checkbox would not work otherwise).
              drag: {
                draggable: true,
                onPointerDown: (event) => {
                  pressedOn.current = event.target
                },
                onDragStart: (event) => {
                  if (pressedOn.current?.closest?.('select, input, textarea, label')) {
                    event.preventDefault()
                    return
                  }
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
      className={`group flex touch-none items-center justify-center rounded-full outline-none focus-visible:bg-teal-500/30 ${vertical ? 'w-2 cursor-col-resize self-stretch' : 'h-2 cursor-row-resize'}`}
    >
      <span className={`rounded-full bg-slate-300 transition group-hover:bg-teal-500 group-focus-visible:bg-teal-500 dark:bg-white/15 ${vertical ? 'h-10 w-1' : 'h-1 w-10'}`} />
    </div>
  )
}
