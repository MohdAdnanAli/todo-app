import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './theme'
import './index.css'
import App from './App.tsx'
import EmailAuthPage from './pages/EmailAuthPage.tsx'
// import { safeConsole } from './utils/console'


// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Handler] Unhandled promise rejection:', event.reason);
  // Prevent the default browser error
  event.preventDefault();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('[Global Handler] Uncaught error:', event.error);
});

  // Show production warning once (disabled for debug)
  // if (import.meta.env.PROD) {
  //   safeConsole.warn('⚠️ WARNING: Using console in production...');
  // }


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
