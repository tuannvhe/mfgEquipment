import axios from 'axios'

const API_URL ='http://localhost:6008/api'
//http://192.168.112.254:6008/

const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    'Content-Type': 'application/json'
  },
   withCredentials:true
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/Auth/refresh-token`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Clear local storage and redirect if refresh fails
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
