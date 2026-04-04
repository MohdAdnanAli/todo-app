import { render, screen, waitFor } from '@testing-library/react'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import App from './App'

// Mock useTheme to prevent ThemeProvider dependency
vi.mock('../theme/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ 
    currentTheme: { isDark: false }, 
    themeId: 'system' as any, 
    setThemeId: vi.fn(), 
    customColors: {} as any, 
    setCustomColors: vi.fn(),
    isCustomizing: false,
    setIsCustomizing: vi.fn()
  }))
}))

// Reset modules
beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

// Mocks for App dependencies
vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => ({
      get: vi.fn()
        .mockResolvedValueOnce({ data: { user: null, isAdmin: false, encryptionSalt: '' } })
        .mockResolvedValueOnce({ data: [] }),
      post: vi.fn(),
    })),
    isAxiosError: vi.fn(() => false)
  }
}))

vi.mock('../services/offlineStorage', () => ({
  offlineStorage: {
    getPassword: vi.fn(() => Promise.resolve('')),
    getEncryptionSalt: vi.fn(() => Promise.resolve('')),
    getRawTodos: vi.fn(() => Promise.resolve([])),
    saveTodos: vi.fn(),
    savePassword: vi.fn(),
    performLocalAction: vi.fn(),
  },
  addSyncListener: vi.fn()
}))

vi.mock('../services/onboarding', () => ({
  onboardingService: {
    hasCompletedOnboarding: vi.fn(() => Promise.resolve(true)),
    isQuickStartComplete: vi.fn(() => Promise.resolve(true)),
  },
  WELCOME_TOUR_STEPS: [
    { id: 'welcome', title: 'Welcome', description: 'Test', icon: '👋' }
  ]
}))

vi.mock('../services/api', () => ({
  todoApi: { reorderTodos: vi.fn(() => Promise.resolve([])) }
}))

describe('App', () => {
  test('renders loader during initial load', async () => {
    render(<App />)
    
    // Loader shows during isLoading=true
    const loader = screen.queryByText('Preparing your workspace...')
    expect(loader).toBeTruthy()
  })

  test('renders Todo App title after loading', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/Todo App/i)).toBeInTheDocument()
    })
  })

  test('renders AuthForm when not authenticated', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    })
  })
})

