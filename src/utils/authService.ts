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
    id: raw?.id || raw?.Id || raw?.sub || 'unknown',
    
    // Đọc trường Name từ URI của Microsoft
    username: raw?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
              raw?.unique_name || 
              raw?.sub || 
              'unknown',

    name: raw?.name || 
          raw?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
          'Người dùng',

    role: raw?.role || 
          raw?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
          'user'
  };
};

export const authService = {
  checkAuth: async (): Promise<User | null> => {
    // 1. Dùng getAccessToken() để đảm bảo không lấy phải chuỗi "undefined"
    const currentToken = authService.getAccessToken(); 
    const refreshToken = localStorage.getItem('refresh_token');

    // Trường hợp 1: Còn Token và hợp lệ -> Trả về user
    if (currentToken) {
        return authService.getCurrentUser();
    }

    // Trường hợp 2: Mất Token nhưng còn RefreshToken -> Đi cấp mới
    if (refreshToken && refreshToken !== 'undefined') {
        try {
            const response = await api.post('/Auth/refresh-token', { refreshToken });
            
            // QUAN TRỌNG: Lấy đúng trường "token" từ JSON bạn đã gửi
            const newToken = response.data.token; 

            if (newToken) {
                localStorage.setItem('access_token', newToken);
                
                // Giải mã user từ token mới hoặc dùng user từ API nếu có
                const userData = response.data.user || parseJwt(newToken);
                const normalized = normalizeUser(userData);
                
                localStorage.setItem('user_info', JSON.stringify(normalized));
                return normalized;
            }
        } catch (error) {
            console.error("Refresh token failed", error);
            authService.logout();
            return null;
        }
    }

    return null;
},
 login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<any>('/Auth/login', { username, password });

    // SỬA TẠI ĐÂY: Lấy 'token' thay vì 'accessToken'
    const { token, refreshToken, user } = response.data; 
    
    // Lưu vào localStorage (Dùng 'token' vừa lấy được)
    if (token) {
        localStorage.setItem('access_token', token);
    }
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }

    let finalUser: User | null = null;

    if (user) {
        finalUser = normalizeUser(user);
    } else if (token) {
        // Giải mã từ biến 'token'
        const parsed = parseJwt(token);
        if (parsed) finalUser = normalizeUser(parsed);
    }

    // Xử lý fallback cho role và thông tin user khác
    const apiData = response.data as any;
    const fallbackRole = apiData.role || apiData.Role || finalUser?.role || 'user';

    if (!finalUser) {
        finalUser = {
            id: 'unknown',
            username,
            name: username,
            role: fallbackRole,
        };
    } else {
        // Cập nhật role nếu finalUser đã tồn tại
        finalUser.role = fallbackRole;
    }

    localStorage.setItem('user_info', JSON.stringify(finalUser));

    return {
        accessToken: token, // Trả về token cho interface AuthResponse
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

  getAccessToken: () => {
    const token = localStorage.getItem('access_token');
    // Loại bỏ các trường hợp giá trị rác
    if (!token || token === 'undefined' || token === 'null') {
        return null;
    }
    return token;
},
  getRefreshToken: () => localStorage.getItem('refresh_token')
  
  
}
