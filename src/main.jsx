import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ArduinoHomePage from './pages/arduino/ArduinoHomePage.jsx'
import ArduinoLayout from './pages/arduino/ArduinoLayout.jsx'
import ArduinoMaterialsPage from './pages/arduino/ArduinoMaterialsPage.jsx'
import ArduinoWeekPage from './pages/arduino/ArduinoWeekPage.jsx'
import LazySimulatorPage from './pages/arduino/simulator/LazySimulatorPage.jsx'
import CompetitionsPage from './pages/CompetitionsPage.jsx'
import EventApplyPage from './pages/EventApplyPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LineRobotCompetitionPage from './pages/LineRobotCompetitionPage.jsx'
import SnakeGamePage from './pages/SnakeGamePage.jsx'
import TeamApplyPage from './pages/TeamApplyPage.jsx'
import TeamPage from './pages/TeamPage.jsx'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

// Addresses used to look like rogoyato.com/#/etkinlikler; links shared
// back then still open the right page.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/arduino" element={<ArduinoLayout />}>
          <Route index element={<ArduinoHomePage />} />
          <Route path="hafta/:week" element={<ArduinoWeekPage />} />
          {/* The competition moved out of the training; old links still work. */}
          <Route path="yarisma" element={<Navigate to="/yarisma/cizgi-izleyen-robot" replace />} />
          <Route path="malzemeler" element={<ArduinoMaterialsPage />} />
          <Route path="simulator" element={<LazySimulatorPage />} />
          <Route path="*" element={<Navigate to="/arduino" replace />} />
        </Route>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="hakkimizda" element={<AboutPage />} />
          <Route path="snake-game" element={<SnakeGamePage />} />
          <Route path="etkinlikler" element={<EventsPage />} />
          <Route path="etkinlikler/:eventId" element={<EventDetailPage />} />
          <Route path="etkinlikler/:eventId/basvuru" element={<EventApplyPage />} />
          <Route path="basarilar" element={<CompetitionsPage />} />
          <Route path="yarisma/cizgi-izleyen-robot" element={<LineRobotCompetitionPage />} />
          <Route path="ekip" element={<TeamPage />} />
          <Route path="ekip/basvuru" element={<TeamApplyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
