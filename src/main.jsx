import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AboutPage from './pages/AboutPage.jsx'
import CompetitionsPage from './pages/CompetitionsPage.jsx'
import EventApplyPage from './pages/EventApplyPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import TeamPage from './pages/TeamPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="hakkimizda" element={<AboutPage />} />
          <Route path="etkinlikler" element={<EventsPage />} />
          <Route path="etkinlikler/:eventId" element={<EventDetailPage />} />
          <Route path="etkinlikler/:eventId/basvuru" element={<EventApplyPage />} />
          <Route path="basarilar" element={<CompetitionsPage />} />
          <Route path="ekip" element={<TeamPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
