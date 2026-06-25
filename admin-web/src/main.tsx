import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, applyLang } from './stores/ui.store'

// Apply saved theme + lang before first render to avoid flash
try {
  const saved = JSON.parse(localStorage.getItem('winrak-ui') ?? '{}')
  const theme = saved?.state?.theme ?? 'dark'
  const lang  = saved?.state?.lang  ?? 'fr'
  applyTheme(theme)
  applyLang(lang)
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
