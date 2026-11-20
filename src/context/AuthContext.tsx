import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  ready: boolean
  setUser: (u: User | null) => void
  login: (email: string, password: string) => Promise<User>
  register: (input: { name: string; email: string; phone: string; password: string; confirmPassword: string; acceptTerms: boolean }) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const r = await api.session()
      setUser(r.data.user)
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      setUser,
      refresh,
      login: async (email, password) => {
        const r = await api.login({ email, password })
        setUser(r.data.user)
        return r.data.user
      },
      register: async (input) => {
        const r = await api.register(input)
        setUser(r.data.user)
        return r.data.user
      },
      logout: async () => {
        try {
          await api.logout()
        } finally {
          setUser(null)
        }
      },
    }),
    [user, ready, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Where a signed-in user belongs after login/registration. */
export function homeFor(user: User): string {
  if (user.role === 'admin') return '/admin'
  if (user.onboardingStatus === 'pending') return '/onboarding'
  return '/dashboard'
}
