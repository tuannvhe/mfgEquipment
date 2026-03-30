import { create } from 'zustand';
import api from '../utils/api'; // Dùng chung instance với Audit
import dayjs from 'dayjs';

interface ReplacementState {
  items: any[];
  totalCount: number;
  loading: boolean;
  stats: any;
  
  pagination: { current: number; pageSize: number };
  dateRange: any;
  searchText: string;
  setPagination: (current: number, pageSize: number) => void;
  setDateRange: (range: any) => void;
  setSearchText: (text: string) => void;
  fetchLogs: () => Promise<void>;
  resetFilters: () => void;
  selectedPart: string | undefined; // Thêm biến lưu linh kiện đang chọn
  setSelectedPart: (partId: string | undefined) => void;
}

export const useReplacementStore = create<ReplacementState>((set, get) => ({
  items: [],
  totalCount: 0,
  loading: false,
  stats: null,
  pagination: { current: 1, pageSize: 10 },
  dateRange: null,
  searchText: '',
  selectedPart: undefined,

  // Chỉ cập nhật State, không gọi fetchLogs()
  setSelectedPart: (partId) => {
    set({ selectedPart: partId, pagination: { ...get().pagination, current: 1 } });
  },

  // Khi đổi trang hoặc số bản ghi trên trang thì thường sẽ fetch luôn để người dùng thấy kết quả
  setPagination: (current, pageSize) => {
    set({ pagination: { current, pageSize } });
    get().fetchLogs();
  },

  // Chỉ cập nhật State, không gọi fetchLogs()
  setDateRange: (range) => {
    set({ dateRange: range, pagination: { ...get().pagination, current: 1 } });
  },

  setSearchText: (text) => set({ searchText: text }),

  resetFilters: () => {
    set({ 
      dateRange: null, 
      searchText: '', 
      pagination: { current: 1, pageSize: 10 }, 
      selectedPart: undefined 
    });
    get().fetchLogs(); // Reset thì nên fetch lại dữ liệu mặc định
  },

  fetchLogs: async () => {
    const { pagination, dateRange, searchText, selectedPart } = get();
    set({ loading: true });
    
    try {
      const response = await api.get('/Replacement', { 
        params: {
          pageIndex: pagination.current,
          pageSize: pagination.pageSize,
          fromDate: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
          toDate: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
          query: searchText || undefined,
          partName: selectedPart || undefined, // ĐỪNG QUÊN THÊM BIẾN NÀY VÀO PARAMS
          _t: Date.now() 
        }
      });
      
      const result = response.data;
      set({ 
        items: result.items || [], 
        totalCount: result.totalCount || 0, 
        stats: result.stats || null, 
        loading: false 
      });
    } catch (error) {
      console.error("Replacement fetch error:", error);
      set({ loading: false, items: [] });
    }
  }
}));