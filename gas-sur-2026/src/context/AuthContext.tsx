import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { MOCK_ADMIN_USER, MOCK_DRIVER_USER, MOCK_CLIENT_USER, MOCK_CLIENT_USER_2, MOCK_CLIENT_USER_3 } from '@/lib/mockData'

interface AuthContextType {
  user: User | null
  login: (rut: string, password: string, role?: UserRole) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const ALL_MOCK_USERS: User[] = [
  MOCK_ADMIN_USER,
  MOCK_DRIVER_USER,
  MOCK_CLIENT_USER,
  MOCK_CLIENT_USER_2,
  MOCK_CLIENT_USER_3,
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (rut: string, password: string, role: UserRole = 'client'): boolean => {
  const found = ALL_MOCK_USERS.find(
    (u) => u.rut === rut && u.role === role && u.password === password
  )
  if (found) {
    setUser(found)
    return true
  }
  return false
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