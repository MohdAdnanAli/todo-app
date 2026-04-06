import { render, screen, waitFor } from '@testing-library/react'
import { vi, test, describe, expect, beforeEach } from 'vitest'
import App from './App'

// Mock ALL dependencies before importing App
vi.mock('../theme')
vi.mock('../components/ErrorBoundary')
vi.mock('../components')
vi.mock('../pages/AdminDashboard')
vi.mock('axios')
vi.mock('../services/offlineStorage')
vi.mock('../services/onboarding')
vi.mock('../services/api')
vi.mock('../utils/crypto')
vi.mock('../hooks/useAuth')

const mockUseTheme = vi.fn()
vi.mocked(mockUseTheme).mockReturnValue({
  currentTheme: { isDark: false, icon: '🌙' },
  themeId: 'system',
  setThemeId: vi.fn(),
  customColors: {},
  setCustomColors: vi.fn(),
  isCustomizing: false,
  setIsCustomizing: vi.fn()
})

vi.mock('../theme', () => ({
  ThemeProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useTheme: mockUseTheme
}))

vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

vi.mock('../components', () => ({
  AuthForm: () => <input data-testid="email-input" aria-label="email" role="textbox" />,
  PasswordUnlockModal: () => null,
  LEDIndicator: () => null,
  ProfileModal: () => null,
  WelcomeBackModal: () => null,
  ThemeSelector: () => null,
  TodoForm: () => null,
  SmartTodoList: () => null,
}))

vi.mock('../pages/AdminDashboard', () => ({
  AdminDashboard: vi.fn(() => null)
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn()
        .mockResolvedValueOnce({ data: { user: null, isAdmin: false, encryptionSalt: '' } })
        .mockResolvedValueOnce({ data: [] }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn(),
          eject: vi.fn()
        }
      }
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('../services/offlineStorage', () => ({
  offlineStorage: {
    getPassword: vi.fn(() => Promise.resolve('')),
    getEncryptionSalt: vi.fn(() => Promise.resolve('')),
    getRawTodos: vi.fn(() => Promise.resolve([])),
    saveTodos: vi.fn(),
  },
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
    }, { timeout: 5000 })
  })

  test('renders AuthForm when not authenticated', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
