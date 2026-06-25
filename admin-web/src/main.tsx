import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme + lang before first render to avoid flash
try {
  const saved = JSON.parse(localStorage.getItem('winrak-ui') ?? '{}')
  const theme = saved?.state?.theme ?? 'dark'
  const lang  = saved?.state?.lang  ?? 'fr'
  if (theme === 'light') document.documentElement.classList.add('light')
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
