// Mouse-wheel zoom that glides. OrbitControls jumps the camera one step
// per wheel notch, which reads as stutter next to its damped turning and
// panning. Here each notch moves a goal distance and the camera eases
// towards it frame by frame. The wheel is taken on the container, before
// it reaches the controls' canvas; pinching on a touch screen is left to
// the controls.
const PER_PIXEL = 0.0009 // zoom per pixel of wheel travel (a notch is ~100 px)
const EASE = 16 // per second; about 90 % of the way in 0.15 s

export default class SmoothZoom {
  constructor(controls, container, onWheel = () => {}) {
    this.controls = controls
    this.container = container
    this.goal = null // camera distance to reach, null when settled
    this.onWheel = (event) => {
      // Like the controls: switched off (the car's chase and top views), the
      // wheel scrolls the page.
      if (!this.controls.enabled) return
      event.preventDefault()
      event.stopPropagation()
      // Lines or pages on some mice and systems, pixels on most.
      let delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
      // A touchpad pinch arrives as a wheel with Ctrl held, in small steps.
      if (event.ctrlKey) delta *= 4
      const { minDistance, maxDistance } = this.controls
      const now = this.goal ?? this.distance()
      this.goal = Math.min(maxDistance, Math.max(minDistance, now * Math.exp(delta * PER_PIXEL)))
      onWheel()
    }
    container.addEventListener('wheel', this.onWheel, { capture: true, passive: false })
  }

  distance() {
    return this.controls.object.position.distanceTo(this.controls.target)
  }

  // Moves the camera towards the goal; true while it is still on its way.
  // Call before controls.update().
  update(dt) {
    if (this.goal === null) return false
    const now = this.distance()
    const step = 1 - Math.exp(-EASE * dt)
    let next = now + (this.goal - now) * step
    if (Math.abs(this.goal - next) < now * 0.001) {
      next = this.goal
      this.goal = null
    }
    const { object: camera, target } = this.controls
    camera.position.sub(target).setLength(next).add(target)
    return true
  }

  // A jump of the camera (framing the scene) drops a zoom on its way.
  cancel() {
    this.goal = null
  }

  dispose() {
    this.container.removeEventListener('wheel', this.onWheel, { capture: true })
  }
}
