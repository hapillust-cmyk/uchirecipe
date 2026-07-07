import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MaintenancePage from './MaintenancePage.tsx'
import { MAINTENANCE_MODE } from './logic/maintenance.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{MAINTENANCE_MODE ? <MaintenancePage /> : <App />}</StrictMode>,
)
