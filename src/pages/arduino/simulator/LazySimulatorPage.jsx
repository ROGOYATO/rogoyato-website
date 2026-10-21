import { Suspense, lazy } from 'react'

// The simulator pulls in three.js and the AVR emulator, so load it only
// when someone opens it.
const SimulatorPage = lazy(() => import('./SimulatorPage.jsx'))

export default function LazySimulatorPage() {
  return (
    <Suspense fallback={<p className="font-code text-sm text-slate-500 dark:text-slate-400">Simülatör yükleniyor…</p>}>
      <SimulatorPage />
    </Suspense>
  )
}
