import api from './api'
import type { AuthResponse, User } from '../types'

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    // In a real app, this would be a POST request to your API
    const response = await api.post<AuthResponse>('/auth/login', { username, password })
    
    const { accessToken, refreshToken, user } = response.data
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user_info', JSON.stringify(user))
    
    return response.data
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
