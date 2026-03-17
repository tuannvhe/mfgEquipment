import api from './api'
import type { AuthResponse, User } from '../types'

const parseJwt = (token: string): any | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(decoded)))
  } catch {
    return null
  }
}

const normalizeUser = (raw: any): User => ({
  id: raw?.id?.toString() || raw?.sub?.toString() || 'unknown',
  username: raw?.username || raw?.sub || 'unknown',
  name: raw?.name || raw?.username || raw?.sub || 'Người dùng',
  role: raw?.role === 'admin' ? 'admin' : raw?.role === 'staff' ? 'staff' : 'user',
})

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/Auth/login', { username, password })

    const { accessToken, refreshToken, user } = response.data
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)

    let finalUser: User | null = null
    if (user) finalUser = normalizeUser(user)
    else if (accessToken) {
      const parsed = parseJwt(accessToken)
      if (parsed) finalUser = normalizeUser(parsed)
    }

    if (!finalUser) {
      finalUser = {
        id: 'unknown',
        username,
        name: username,
        role: 'user',
      }
    }

    localStorage.setItem('user_info', JSON.stringify(finalUser))

    return {
      accessToken,
      refreshToken,
      user: finalUser,
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user_info')
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token')
}
