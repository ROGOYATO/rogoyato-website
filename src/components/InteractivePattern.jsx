import { Bot, Cpu } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

function buildItems() {
  const kinds = ['bot', 'cpu']

  return Array.from({ length: 28 }, (_, index) => {
    const ratioX = ((index * 37) % 100) / 100
    const ratioY = ((index * 53 + 17) % 100) / 100

    return {
      id: index,
      x: 0.06 + ratioX * 0.88,
      y: 0.08 + ratioY * 0.84,
      size: 14 + (index % 4) * 3,
      depth: 0.5 + (index % 5) * 0.18,
      baseOpacity: 0.32 + (index % 3) * 0.09,
      kind: kinds[index % kinds.length],
      delay: `${(index % 7) * 0.6}s`,
      duration: `${8 + (index % 5) * 2}s`,
    }
  })
}

export default function InteractivePattern() {
  const items = useMemo(() => buildItems(), [])
  const itemRefs = useRef([])
  const pointerRef = useRef({ x: 0, y: 0 })
  const frameRequestedRef = useRef(false)

  useEffect(() => {
    const applyInteraction = () => {
      frameRequestedRef.current = false

      const width = window.innerWidth
      const height = window.innerHeight
      const pointer = pointerRef.current

      items.forEach((item, index) => {
        const node = itemRefs.current[index]
        if (!node) {
          return
        }

        const anchorX = item.x * width
        const anchorY = item.y * height
        const dx = pointer.x - anchorX
        const dy = pointer.y - anchorY
        const distance = Math.hypot(dx, dy)
        const influence = Math.max(0, 1 - distance / 320)
        const translateX = -dx * 0.09 * item.depth * influence
        const translateY = -dy * 0.09 * item.depth * influence

        node.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0)`
        node.style.opacity = `${Math.min(0.92, item.baseOpacity + influence * 0.38)}`
      })
    }

    const requestInteractionFrame = () => {
      if (frameRequestedRef.current) {
        return
      }

      frameRequestedRef.current = true
      window.requestAnimationFrame(applyInteraction)
    }

    const setPointer = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
      requestInteractionFrame()
    }

    const centerPointer = () => {
      pointerRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      requestInteractionFrame()
    }

    centerPointer()
    window.addEventListener('pointermove', setPointer, { passive: true })
    window.addEventListener('resize', centerPointer)

    return () => {
      window.removeEventListener('pointermove', setPointer)
      window.removeEventListener('resize', centerPointer)
    }
  }, [items])

  return (
    <div aria-hidden className="interactive-pattern pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {items.map((item, index) => (
        <span
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node
          }}
          className={`interactive-pattern-item ${item.kind === 'bot' ? 'interactive-pattern-item-bot' : 'interactive-pattern-item-cpu'}`}
          style={{
            left: `${item.x * 100}%`,
            top: `${item.y * 100}%`,
            opacity: item.baseOpacity,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.kind === 'bot' ? <Bot size={item.size} strokeWidth={1.8} /> : <Cpu size={item.size} strokeWidth={1.8} />}
        </span>
      ))}
    </div>
  )
}
