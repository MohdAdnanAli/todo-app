import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import App from './App'

// Mock theme and other deps to bypass useTheme error
vi.mock('../theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: vi.fn(() => ({
    currentTheme: { isDark: false },
    themeId: 'system',
    setThemeId: vi.fn(),
    customColors: {},
    setCustomColors: vi.fn(),
    isCustomizing: false,
    setIsCustomizing: vi.fn()
  }))
}))

vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../components', () => ({
  AuthForm: () => <input data-testid="email-input" aria-label="email" role="textbox" />,
  // Add other components as needed
}))

vi.mock('../pages/AdminDashboard', () => ({
  AdminDashboard: () => null
}))

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => ({
      get: vi.fn()
        .mockResolvedValueOnce({ data: { user: null, isAdmin: false, encryptionSalt: '' } })
        .mockResolvedValueOnce({ data: [] }),
      post: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn()
        }
      }
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
  WELCOME_TOUR_STEPS: []
}))

vi.mock('../services/api', () => ({
  todoApi: { reorderTodos: vi.fn(() => Promise.resolve([])) }
}))

vi.mock('../utils/crypto', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  decryptAllTodosWithFallback: vi.fn(id => id)
}))

vi.mock('../hooks/useAuth', () => ({
  useLocalTodoDecryption: vi.fn(() => ({ needsUnlock: false, unlock: vi.fn() }))
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  test('renders loader during initial load', async () => {
    render(<App />)
    expect(screen.getByTestId('loader-container')).toBeInTheDocument()
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

