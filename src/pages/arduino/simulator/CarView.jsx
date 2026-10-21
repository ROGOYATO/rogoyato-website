import { useEffect, useRef } from 'react'
import { Car3D } from './Car3D'

export default function CarView({ track, view, dark, subscribe, resetToken }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    const scene = new Car3D(containerRef.current)
    sceneRef.current = scene
    const unsubscribe = subscribe((snapshot) => {
      if (snapshot?.car) scene.setState(snapshot.car)
    })
    return () => {
      unsubscribe()
      scene.dispose()
      sceneRef.current = null
    }
  }, [subscribe])

  useEffect(() => {
    sceneRef.current?.setTrack(track)
  }, [track, resetToken])

  useEffect(() => {
    sceneRef.current?.setView(view)
  }, [view])

  useEffect(() => {
    sceneRef.current?.setTheme(dark)
  }, [dark])

  return <div ref={containerRef} className="absolute inset-0" />
}
