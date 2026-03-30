import { create } from 'zustand'
import api from '../utils/api'
import type { AuditLog, AuditStats, PagedResult } from '../types'

// Cập nhật service để nhận đầy đủ params
export const auditService = {
  getLogs: async (params: { 
    searchTerm?: string, 
    page?: number, 
    pageSize?: number, 
    searchTitle?: string, 
    startDate?: string, 
    endDate?: string 
  }): Promise<PagedResult<AuditLog>> => {
    const response = await api.get<PagedResult<AuditLog>>('/Audit', {
      // Axios sẽ tự động loại bỏ các param là undefined
      params: {
        searchTerm: params.searchTerm, // Giả định backend dùng mapping này
        page: params.page,
        pageSize: params.pageSize,
        equipmentTitle: params.searchTitle,
        startDate: params.startDate,
        endDate: params.endDate
      }
    });
    return response.data;
  }
};

interface AuditState {
  logs: AuditLog[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  auditStats?: AuditStats | null;
  // Interface nhận 1 Object params
  fetchLogs: (params: { 
    searchTerm?: string, 
    page?: number, 
    pageSize?: number, 
    searchTitle?: string, 
    startDate?: string, 
    endDate?: string 
  }) => Promise<void>;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,
  totalItems: 0,
  currentPage: 1,
  pageSize: 10,
  auditStats: null,
  // Thực thi hàm fetchLogs nhận vào 1 Object
  fetchLogs: async (params) => {
    const { page = 1, pageSize = 10 } = params; // Lấy default values
    set({ loading: true }); 
    try {
      // Truyền nguyên object params vào service
      const result = await auditService.getLogs(params);
      
      set({ 
        logs: result.items || [], 
        totalItems: result.totalCount || 0,
        currentPage: result.currentPage || page,
        pageSize: result.pageSize || pageSize,
        loading: false ,
        auditStats: result.auditStats || null
      });
    } catch (error) {
      console.error("Fetch logs error:", error);
      set({ loading: false, logs: [] });
    }
  },
}));