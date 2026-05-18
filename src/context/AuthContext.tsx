import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { MOCK_ADMIN_USER, MOCK_DRIVER_USER, MOCK_CLIENT_USER } from '@/lib/mockData'

interface AuthContextType {
  user: User | null
  login: (rut: string, password: string, role?: UserRole) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const MOCK_USERS: Record<string, User> = {
  admin: MOCK_ADMIN_USER,
  driver: MOCK_DRIVER_USER,
  client: MOCK_CLIENT_USER,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (_rut: string, _password: string, role: UserRole = 'client') => {
    setUser(MOCK_USERS[role])
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
