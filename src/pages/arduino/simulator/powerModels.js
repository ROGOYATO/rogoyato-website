// What powers the Uno on the bench: the kit's A-to-B USB cable in its USB
// socket (from the computer: power, uploads and the Serial Monitor) and the
// 9 V battery on its snap-to-barrel cable in the DC jack. Both hang off the
// board's own sockets, so they move with it. A click on either unplugs it.
import * as THREE from 'three'
import { box, cylinder, mat, metal, painted } from './models'

const PLUG = 0.005 // a hair proud of the socket's mouth

function tube(points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 12), radius, 10), material)
  mesh.castShadow = true
  return mesh
}

// The 9 V battery's wrapper: a black and gold alkaline cell.
function batteryWrap() {
  return painted('battery-9v', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#18181b'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#c99a2e'
    ctx.fillRect(0, 0, w * 0.32, h)
    ctx.fillStyle = '#f5f5f4'
    ctx.font = '800 120px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('9V', w * 0.66, h * 0.46)
    ctx.font = '600 30px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText('ALKALINE 6LR61', w * 0.66, h * 0.8)
  })
}

// usb, dc: each socket's frame on the board (position, rotation) and, in
// that frame, the mouth's centre (x, y) and its z; the plug comes out
// along +z. dc.batteryAt: where the battery lies, in the board's frame.
export function buildPowerGear({ usb, dc }) {
  const group = new THREE.Group()

  // USB-B plug in the USB socket and the blue cable off to the computer.
  const usbGroup = new THREE.Group()
  usbGroup.position.copy(usb.position)
  usbGroup.rotation.y = usb.rotation
  const blue = new THREE.MeshPhysicalMaterial({ color: '#2f6fd6', roughness: 0.35, transmission: 0.25, transparent: true, opacity: 0.9, clearcoat: 0.6 })
  const shellZ = usb.mouth + PLUG
  usbGroup.add(
    box(0.84, 0.76, 0.5, metal('#c9ced3', 0.25), usb.x, usb.y, shellZ + 0.25), // the steel B shell left showing
    box(1.2, 1.08, 1.6, blue, usb.x, usb.y, shellZ + 1.3), // overmould
  )
  const relief = cylinder(0.3, 1.0, blue, usb.x, usb.y, shellZ + 2.6, 20)
  relief.rotation.x = Math.PI / 2
  usbGroup.add(relief)
  // Down to the mat and away to the side of the bench.
  usbGroup.add(
    tube(
      [
        [usb.x, usb.y, shellZ + 3.0],
        [usb.x, usb.y - 0.2, shellZ + 4.2],
        [usb.x + 0.6, 0.28, shellZ + 6.5],
        [usb.x + 3.5, 0.24, shellZ + 13],
        [usb.x + 9, 0.24, shellZ + 22],
        [usb.x + 12, 0.24, shellZ + 34],
      ],
      0.2,
      blue,
    ),
  )
  usbGroup.traverse((child) => {
    if (child.isMesh) child.userData = { kind: 'power', which: 'usb', info: 'USB kablosu · bilgisayara bağlı: kartı besler, kodu yükler, Serial Monitor bunun üzerinden çalışır. Çıkarmak için tıklayın.' }
  })
  group.add(usbGroup)

  // Barrel plug in the DC jack, the snap cable and the battery on the mat.
  const dcGroup = new THREE.Group()
  dcGroup.position.copy(dc.position)
  dcGroup.rotation.y = dc.rotation
  const black = mat('#111113', { roughness: 0.55 })
  const plugZ = dc.mouth + PLUG
  const sleeve = cylinder(0.27, 0.35, metal('#cfd3d7', 0.3), dc.x, dc.y, plugZ + 0.17, 24)
  const body = cylinder(0.45, 1.7, black, dc.x, dc.y, plugZ + 1.2, 28)
  const tail = cylinder(0.24, 0.8, black, dc.x, dc.y, plugZ + 2.45, 16)
  for (const piece of [sleeve, body, tail]) piece.rotation.x = Math.PI / 2
  dcGroup.add(sleeve, body, tail)
  for (let i = 0; i < 6; i += 1) {
    const grip = cylinder(0.465, 0.06, mat('#1d1d20', { roughness: 0.7 }), dc.x, dc.y, plugZ + 0.6 + i * 0.22, 28)
    grip.rotation.x = Math.PI / 2
    dcGroup.add(grip)
  }
  // The battery lies on the mat beside the board, its snap towards the jack.
  const battery = new THREE.Group()
  const wrap = new THREE.MeshStandardMaterial({ map: batteryWrap(), roughness: 0.45, metalness: 0.2 })
  const steel = metal('#b9bec4', 0.35)
  // Steel at the ends, the wrapper round the sides and top.
  battery.add(box(4.85, 1.75, 2.65, [steel, steel, wrap, wrap, wrap, wrap], 0, 0.875, 0))
  // The snap clip over its terminals.
  battery.add(box(0.75, 1.5, 2.5, black, 2.8, 0.875, 0), box(0.12, 0.3, 0.6, metal('#d7dbdf', 0.3), 3.2, 0.875, 0.55), box(0.12, 0.3, 0.6, metal('#d7dbdf', 0.3), 3.2, 0.875, -0.55))
  // Placed in the board's frame, lying along it with the snap end towards
  // the jack.
  dcGroup.updateMatrix()
  battery.position.set(dc.batteryAt[0], 0, dc.batteryAt[1]).applyMatrix4(dcGroup.matrix.clone().invert())
  battery.rotation.y = -dc.rotation
  dcGroup.add(battery)
  // Red and black leads from the snap to the plug.
  battery.updateMatrix()
  const snap = (dz) => new THREE.Vector3(3.2, 0.875, dz).applyMatrix4(battery.matrix)
  for (const [colour, side] of [['#c81e1e', 0.12], ['#141416', -0.12]]) {
    const start = snap(side * 2)
    dcGroup.add(
      tube(
        [
          [start.x, start.y, start.z],
          [start.x + 1.2, 0.3, start.z + side],
          [(start.x + dc.x) / 2, 0.22, (start.z + plugZ + 2.9) / 2 + side],
          [dc.x + side, 0.3, plugZ + 4.4],
          [dc.x + side * 0.5, dc.y - 0.1, plugZ + 3.2],
          [dc.x, dc.y, plugZ + 2.8],
        ],
        0.07,
        mat(colour, { roughness: 0.45 }),
      ),
    )
  }
  dcGroup.traverse((child) => {
    if (child.isMesh) child.userData = { kind: 'power', which: 'battery', info: '9V pil · DC jaka takılı: kart bilgisayarsız çalışır, en son yüklenen program çalışır. Çıkarmak için tıklayın.' }
  })
  group.add(dcGroup)

  return {
    group,
    set({ usb: usbIn, battery: batteryIn }) {
      usbGroup.visible = usbIn
      dcGroup.visible = batteryIn
    },
  }
}
