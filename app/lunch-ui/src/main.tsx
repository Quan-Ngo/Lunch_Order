import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import i18n, { APP_LANGUAGE_STORAGE_KEY, resolveSupportedLanguage } from './i18n'

async function bootstrap() {
  const params = new URLSearchParams(window.location.search)
  const portalLanguage = resolveSupportedLanguage(params.get('sap-locale'))

  if (portalLanguage) {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, portalLanguage)
    if (i18n.language !== portalLanguage) {
      await i18n.changeLanguage(portalLanguage)
    }
  } else {
    const savedLanguage = resolveSupportedLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY))
    if (savedLanguage && i18n.language !== savedLanguage) {
      await i18n.changeLanguage(savedLanguage)
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}

void bootstrap()
