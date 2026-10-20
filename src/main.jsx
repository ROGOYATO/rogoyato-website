import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ArduinoCompetitionPage from './pages/arduino/ArduinoCompetitionPage.jsx'
import ArduinoHomePage from './pages/arduino/ArduinoHomePage.jsx'
import ArduinoLayout from './pages/arduino/ArduinoLayout.jsx'
import ArduinoMaterialsPage from './pages/arduino/ArduinoMaterialsPage.jsx'
import ArduinoWeekPage from './pages/arduino/ArduinoWeekPage.jsx'
import CompetitionsPage from './pages/CompetitionsPage.jsx'
import EventApplyPage from './pages/EventApplyPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import SnakeGamePage from './pages/SnakeGamePage.jsx'
import TeamApplyPage from './pages/TeamApplyPage.jsx'
import TeamPage from './pages/TeamPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/arduino" element={<ArduinoLayout />}>
          <Route index element={<ArduinoHomePage />} />
          <Route path="hafta/:week" element={<ArduinoWeekPage />} />
          <Route path="yarisma" element={<ArduinoCompetitionPage />} />
          <Route path="malzemeler" element={<ArduinoMaterialsPage />} />
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
          <Route path="ekip" element={<TeamPage />} />
          <Route path="ekip/basvuru" element={<TeamApplyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
