// The line-following competition's three tracks, as printed, and the
// straights-and-arcs layout they (and the simulator's tracks) are built
// with. Kept apart from the simulator so the competition page can draw
// them without loading it. Units are metres; screen y grows downwards.

// Lays out a track the way real line-follower tracks are built: straights
// and arcs of a known radius. ['S', metres] or ['A', radius, degrees], where
// positive degrees turn right.
export function buildTrack(start, headingDegrees, segments) {
  let [x, y] = start
  let heading = (headingDegrees * Math.PI) / 180
  const points = [[x, y]]
  for (const [kind, a, b] of segments) {
    if (kind === 'S') {
      const steps = Math.max(1, Math.round(a / 0.01))
      for (let i = 0; i < steps; i += 1) {
        x += (Math.cos(heading) * a) / steps
        y += (Math.sin(heading) * a) / steps
        points.push([x, y])
      }
    } else {
      const turn = (b * Math.PI) / 180
      const steps = Math.max(2, Math.round((Math.abs(turn) * a) / 0.01))
      const chord = (Math.abs(turn) * a) / steps
      for (let i = 0; i < steps; i += 1) {
        heading += turn / steps
        x += Math.cos(heading - turn / steps / 2) * chord
        y += Math.sin(heading - turn / steps / 2) * chord
        points.push([x, y])
      }
    }
  }
  points.pop() // the loop ends where it started
  return points
}

// The three tracks from the start line, as printed: lengths of the two
// straights that close each loop worked out to 0.01 mm.
const SEGMENTS = {
  kolay: { name: 'Kolay', segments: [['S', 1.24], ['A', 0.2, -90], ['S', 0.55], ['A', 0.2, -90], ['S', 0.3], ['A', 0.16, -90], ['S', 0.3], ['A', 0.16, 180], ['S', 0.3], ['A', 0.16, -90], ['S', 0.3], ['A', 0.2, -90], ['S', 0.55], ['A', 0.2, -90]] },
  orta: { name: 'Orta', segments: [['S', 1.05], ['A', 0.15, 90], ['S', 1.3], ['A', 0.15, 90], ['S', 0.35], ['A', 0.09, 60], ['A', 0.09, -120], ['A', 0.09, 60], ['S', 0.15], ['A', 0.15, 90], ['S', 0.12], ['A', 0.15, 90], ['S', 0.6], ['A', 0.13, -180], ['S', 0.6], ['A', 0.13, 180], ['S', 0.6], ['A', 0.13, -180], ['S', 0.83823], ['A', 0.15, 90], ['S', 0.1], ['A', 0.15, 90]] },
  zor: { name: 'Zor', segments: [['S', 0.35], ['A', 0.14, -270], ['S', 0.28], ['A', 0.14, -90], ['S', 0.25], ['A', 0.12, 90], ['S', 0.1], ['A', 0.04, 45], ['S', 0.28], ['A', 0.04, -45], ['S', 0.84544], ['A', 0.12, 90], ['S', 0.2], ['A', 0.08, 60], ['A', 0.08, -120], ['A', 0.08, 60], ['S', 0.06], ['A', 0.08, 60], ['A', 0.08, -120], ['A', 0.08, 60], ['S', 0.1], ['A', 0.12, 90], ['S', 0.08], ['A', 0.12, 90], ['S', 0.55], ['A', 0.11, -180], ['S', 0.55], ['A', 0.11, 180], ['S', 0.55], ['A', 0.11, -180], ['S', 0.55], ['A', 0.11, 180], ['S', 0.55], ['A', 0.11, -180], ['S', 0.01432], ['A', 0.12, 90], ['S', 0.06], ['A', 0.12, 90]] },
}


export const COMPETITION_TRACKS = Object.fromEntries(
  Object.entries(SEGMENTS).map(([id, { name, segments }]) => [id, { name, points: buildTrack([0, 0], 0, segments) }]),
)

// Distance along a closed track from its start to each point, and its length.
export function alongTrack(points) {
  const distances = [0]
  for (let i = 1; i < points.length; i += 1) {
    distances.push(distances[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  }
  const [lx, ly] = points[points.length - 1]
  return { distances, length: distances[distances.length - 1] + Math.hypot(points[0][0] - lx, points[0][1] - ly) }
}
