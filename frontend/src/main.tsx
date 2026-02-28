import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './theme'
import './index.css'
import App from './App.tsx'
import EmailAuthPage from './pages/EmailAuthPage.tsx'
import { safeConsole } from './utils/console'

// Show production warning once
if (import.meta.env.PROD) {
  safeConsole.warn('⚠️ WARNING: Using console in production may leak sensitive information! Consider removing console logs for better security and performance.');
}

// Simple client-side routing based on URL path
const path = window.location.pathname;

const renderApp = () => {
  if (path === '/verify-email' || path === '/verify' || path === '/reset-password' || path === '/reset') {
    return <EmailAuthPage />;
  }
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {renderApp()}
    </ThemeProvider>
  </StrictMode>,
)
