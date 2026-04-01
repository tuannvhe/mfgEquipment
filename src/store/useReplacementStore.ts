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
  selectedPartId: string | undefined; // Lưu ID
  setSelectedPartId: (partId: string | undefined) => void;
  operatingConditions: 'all' | 'good' | 'warning' | 'bad';
  setOperatingConditions: (conditions: 'all' | 'good' | 'warning' | 'bad') => void;
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
    selectedPartId: undefined,
    operatingConditions: 'all',
    setOperatingConditions: (conditions) => set({ operatingConditions: conditions }),
  setSelectedPartId: (partId) => {
    // Reset về trang 1 khi chọn linh kiện mới
    set({ selectedPartId: partId, pagination: { ...get().pagination, current: 1 } });
  },
  // Chỉ cập nhật State, không gọi fetchLogs()
  setSelectedPart: (partId) => {
    set({ selectedPart: partId, pagination: { ...get().pagination, current: 1 } });
  },

  // Khi đổi trang hoặc số bản ghi trên trang thì thường sẽ fetch luôn để người dùng thấy kết quả
  setPagination: (current, pageSize) => {
  set((state) => ({
    pagination: { 
      current: current ?? state.pagination.current, 
      pageSize: pageSize ?? state.pagination.pageSize 
    }
  }));
  get().fetchLogs(); // Khi đổi trang thì fetch luôn là đúng
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
    selectedPartId: undefined, // PHẢI thêm dòng này để reset Combo Box
    selectedPart: undefined,
    operatingConditions: 'all',
    pagination: { current: 1, pageSize: 10 }, 
  });
  get().fetchLogs(); // Reset xong fetch lại dữ liệu mặc định là đúng logic
},

fetchLogs: async () => {
  const { pagination, dateRange, searchText, selectedPartId, operatingConditions } = get();
  
  // Bật loading để App.tsx hiển thị Overlay
  set({ loading: true });
  
  try {
    const response = await api.get('/Replacement', { 
      params: {
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
        // Dùng startOf/endOf để đảm bảo lấy hết dữ liệu trong ngày
        fromDate: dateRange?.[0] ? dayjs(dateRange[0]).startOf('day').toISOString() : undefined,
        toDate: dateRange?.[1] ? dayjs(dateRange[1]).endOf('day').toISOString() : undefined,
        searchTerm: searchText || undefined,
        partId: selectedPartId || undefined, 
        operatingConditions: operatingConditions === 'all' ? undefined : operatingConditions,
        _t: Date.now(), // Chống cache trình duyệt
      }
    });
    
    const result = response.data;
    set({ 
      items: result.items || [],
      totalCount: result.totalCount || 0,
      stats: result.replacementStats,
    });
  } catch (error) {
    console.error("Fetch replacement logs error:", error);
    set({ items: [], totalCount: 0 });
  } finally {
    // Luôn luôn tắt loading dù thành công hay thất bại
    set({ loading: false });
  }
}
}));