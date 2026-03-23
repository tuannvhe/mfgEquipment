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

const normalizeUser = (raw: any): User => {
  
  return {
    id: raw?.id?.toString() || raw?.sub?.toString() || raw?.Id?.toString() || 'unknown',
    username: raw?.username || raw?.sub || raw?.Username || 'unknown',
    name: raw?.name || raw?.username || raw?.FullName || 'Người dùng',
    role: raw?.role || raw?.Role || 'user',
  };
};

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/Auth/login', { username, password });

    const { accessToken, refreshToken, user } = response.data;
    
    // Lưu token ngay
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

    let finalUser: User | null = null;

    // Ưu tiên 1: Dữ liệu user object từ API trả về trực tiếp
    if (user) {
      finalUser = normalizeUser(user);
    } 
    // Ưu tiên 2: Giải mã từ JWT nếu API không trả về object user riêng
    else if (accessToken) {
      const parsed = parseJwt(accessToken);
      if (parsed) finalUser = normalizeUser(parsed);
    }
    const apiData = response.data as any;
  
  // Kiểm tra mọi khả năng: role (viết thường) hoặc Role (viết hoa) từ Database
  const fallbackRole = apiData.role || apiData.Role || apiData.user?.role || 'user';
    // Ưu tiên 3: Fallback cuối cùng nếu cả 2 cách trên đều thất bại
    if (!finalUser) {
      finalUser = {
        id: 'unknown',
        username,
        name: username,
        role: fallbackRole, // Gán giá trị chuỗi cụ thể thay vì biến role không tồn tại
      };
    }

    localStorage.setItem('user_info', JSON.stringify(finalUser));

    return {
      accessToken,
      refreshToken,
      user: finalUser,
    };
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
