import React, { useEffect } from 'react';
import { Table, Tag, Typography, Card, Input, Avatar, Pagination, Button, DatePicker, Divider, Select } from 'antd';
import { Search, Laptop, Calendar, FilterX, Box, RefreshCw, Wrench, CheckCircle2, Settings2, MapPin, Activity, UserCheck, 
  SlidersHorizontal, ClipboardCheck, AlertCircle, 
  MessageSquareMore} from 'lucide-react';
import dayjs from 'dayjs';
import { useReplacementStore } from '../store/useReplacementStore';


const { RangePicker } = DatePicker;
const { Text } = Typography;

const ReplacementManagementPage: React.FC = () => {
  const store = useReplacementStore();
  const [loadingParts, setLoadingParts] = React.useState(false);
  const [parts, setParts] = React.useState<{label: string, value: string}[]>([]);
  // Fetch danh sách linh kiện cho Combo Box
  useEffect(() => {
    const loadParts = async () => {
      // Demo dữ liệu - thực tế bạn gọi API ở đây
      setParts([
        { label: 'Tất cả linh kiện', value: '' },
        { label: 'Sensor E3Z-D61', value: 'SENSOR_01' },
        { label: 'Motor 750W', value: 'MOTOR_02' },
        { label: 'Belt 100mm', value: 'BELT_03' },
      ]);
    };
    loadParts();
    store.fetchLogs(); // Khởi tạo dữ liệu lần đầu
  }, []);

useEffect(() => {
  // Chỉ fetch khi thực sự có sự thay đổi về trang (bấm nút phân trang)
  // Nếu bạn muốn CHỈ nhấn nút Tra Cứu mới fetch (kể cả khi đổi trang cũng ko fetch) 
  // thì xóa luôn useEffect này. Nhưng thông thường đổi trang vẫn nên fetch.
  store.fetchLogs();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [store.pagination.current, store.pagination.pageSize]);

  const rangePresets = [
    { label: 'Hôm nay', value: [dayjs(), dayjs()] },
    { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];
  
  const columns = [
    {
      title: 'THIẾT BỊ & VỊ TRÍ',
      dataIndex: 'equipmentTitle',
      key: 'equipment',
      width: 200,
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3 py-1">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100/50 flex-shrink-0 shadow-sm">
            <Laptop size={18} className="text-emerald-600" />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <Text className="text-[14px] font-black text-slate-800 uppercase leading-tight truncate">
              {text || 'N/A'}
            </Text>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded">
                #{record?.controlNumber || '---'}
              </span>
              <div className="flex items-center gap-1 text-blue-500/70">
                <MapPin size={10} />
                <span className="text-[10px] font-bold uppercase">{record?.installationLocation || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
  title: 'NGÀY & NGƯỜI KIỂM TRA',
  key: 'time',
  width: 220,
  render: (_: any, record: any) => (
    <div className="flex flex-col gap-2 text-left">
      {/* Ngày kiểm tra - Giao diện Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/50">
          <Calendar size={13} className="text-emerald-600" />
          <span className="font-mono font-black text-[13px] text-slate-700 tracking-tight">
            {record?.dateOfInspection ? dayjs(record.dateOfInspection).format('DD/MM/YYYY') : '---'}
          </span>
        </div>
      </div>

      {/* Người kiểm tra - Avatar & Name */}
      <div className="flex items-center gap-2 pl-1">
        <Avatar 
          size={18} 
          className="bg-emerald-500 text-white flex items-center justify-center border-none shadow-sm" 
          icon={<UserCheck size={10} />} 
        />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
          {record?.inspector || "N/A"}
        </span>
      </div>
    </div>
  ),
},
    {
  title: 'NỘI DUNG KIỂM TRA & LỊCH SỬ LỖI',
  key: 'check_content',
  width: 400,
  render: (_: any, record: any) => (
    <div className="flex flex-col gap-2.5 py-1 text-left">
      {/* 1. Nội dung kiểm tra - Phần chính */}
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-emerald-50 rounded-lg shrink-0">
          <ClipboardCheck size={14} className="text-emerald-600" />
        </div>
        <div className="flex flex-col">
          <Text className="text-[13px] font-bold text-slate-700 leading-snug whitespace-normal">
            {record?.inspectionDetails || "---"} 
          </Text>
        </div>
      </div>

      {/* 2. Lịch sử hư hỏng - Phần phụ với đường kẻ nối */}
      <div className="flex flex-col gap-1.5 pl-9 relative">
        {/* Đường nối giữa 2 icon tạo cảm giác liên kết dòng thời gian */}
        <div className="absolute left-[17px] -top-2 bottom-4 w-px bg-slate-100" />
        
        <div className="flex items-center gap-1.5">
          <AlertCircle size={10} className="text-rose-400" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Lịch sử hư hỏng
          </span>
        </div>

        {record?.failureHistory ? (
          <div className="whitespace-normal">
            <Tag 
              color="error" 
              className="border-none bg-rose-50 text-rose-500 font-bold rounded-md px-2 py-0.5 m-0 text-[11px] leading-tight"
            >
              {record.failureHistory}
            </Tag>
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 italic pl-1">Không có dữ liệu lỗi</span>
        )}
      </div>
    </div>
  ),
},
    {
  title: 'LINH KIỆN THAY THẾ',
  key: 'part_info',
  width: 280,
  render: (_: any, record: any) => (
    <div className="flex flex-col gap-1.5 bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/30 text-left">
      <div className="flex items-start gap-2">
        {/* Đã đổi từ Settings2 sang Wrench */}
        <Wrench size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <span className="text-[13px] font-black text-blue-900 leading-snug whitespace-normal">
          {record?.replacementParts}
        </span>
      </div>
      {record?.specification && (
        <span className="text-[10px] text-blue-400 font-medium italic px-5">
          Tên linh kiện: {record.partName}
        </span>
      )}
    </div>
  ),
},
    
    {
  title: 'GHI CHÚ',
  dataIndex: 'remarks',
  key: 'remarks',
  width: 300,
  render: (text: string) => (
    <div className="flex items-start gap-2 py-1">
      {/* Icon Ghi chú nhỏ gọn, màu trung tính */}
      <MessageSquareMore size={15} className="text-slate-500 mt-0.5 shrink-0" />
      
      <span className="text-[13px] text-slate-1000 font-Italic leading-relaxed whitespace-normal block">
        {text || ""}
      </span>
    </div>
  )
}
  ];

  return (
      <div className="p-6 space-y-6 animate-in fade-in duration-700">
        
        {/* STATS SECTION - Đồng bộ hoàn toàn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Tổng linh kiện đã thay thế" 
          value={store.totalCount} // Lấy từ stats (30) thay vì totalCount (10)
          bgColor="bg-emerald-500" 
          icon={<Wrench />} 
          sub="Trong kho quản lý" 
        />
        {/* <StatCard 
          label="Cần thay gấp" 
          value={store.stats?.urgentReplacements} // (6)
          bgColor="bg-rose-500" 
          icon={<AlertCircle />} 
          sub="Hạng mục ưu tiên" 
        /> */}
        <StatCard 
          label="Đã thay thế" 
          value={store.stats?.completedThisMonth} // (4)
          bgColor="bg-blue-500" 
          icon={<CheckCircle2 />} 
          sub="Trong tháng này" 
        />
      </div>

      {/* FILTER SECTION */}
      <Card className="border-none rounded-[2.5rem] shadow-sm bg-white/80 backdrop-blur-md overflow-hidden ring-1 ring-slate-100/50">
      <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <SlidersHorizontal size={22} /> 
            {/* Hoặc dùng <Search size={22} /> nếu bạn muốn hình kính lúp */}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none text-emerald-900">Bộ lọc</h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end p-2">
          
          {/* 1. Tìm kiếm thiết bị */}
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <div className="p-1 bg-blue-50 rounded-md">
                <Search size={12} className="text-blue-500" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-tight text-slate-400">Thiết bị</span>
            </div>
            <Input 
              placeholder="Mã số..." 
              value={store.searchText}
              onChange={(e) => store.setSearchText(e.target.value)}
              className="rounded-xl h-10 border-slate-100 bg-slate-50/50 focus:bg-white transition-all"
              allowClear
            />
          </div>

          {/* 2. Combo Box Linh Kiện */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <div className="p-1 bg-emerald-50 rounded-md">
                <Settings2 size={12} className="text-emerald-500" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-tight text-slate-400">Linh kiện thay thế</span>
            </div>
            <Select
              showSearch
              allowClear
              placeholder="Tất cả linh kiện"
              className="w-full h-10 custom-select-premium"
              options={parts}
              value={store.selectedPartId} 
              onChange={(value) => store.setSelectedPartId(value)} 
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          {/* 3. Điều kiện vận hành */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <div className="p-1 bg-amber-50 rounded-md">
                <Activity size={12} className="text-amber-500" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-tight text-slate-400">Điều kiện vận hành</span>
            </div>
            <Select
              placeholder="Tất cả trạng thái"
              value={store.operatingConditions === 'all' ? null : store.operatingConditions}
              onChange={(value) => store.setOperatingConditions(value || 'all')}
              allowClear
              className="w-full h-10 custom-select-premium"
              dropdownStyle={{ borderRadius: '16px', padding: '8px' }}
              options={[
                      { value: 'Good', label: '🟢 Hoạt động tốt' },
                      { value: 'Warning', label: '🟡 Theo dõi' },
                      { value: 'Bad', label: '🔴 Hỏng/Sửa chữa' },
                    ]}
            />
          </div>

          {/* 4. Khoảng thời gian */}
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <div className="p-1 bg-purple-50 rounded-md">
                <Calendar size={12} className="text-purple-500" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-tight text-slate-400">Thời gian kiểm tra</span>
            </div>
            <RangePicker 
              value={store.dateRange}
              onChange={store.setDateRange}
              className="rounded-xl h-10 border-slate-100 bg-slate-50/50 w-full hover:bg-white transition-all"
              presets={rangePresets as any}
              format="DD/MM/YYYY"
            />
          </div>

         {/* 5. Nút Action */}
        <div className="md:col-span-2 flex gap-2">
          <Button 
            onClick={() => {
              store.setPagination(1, store.pagination.pageSize); 
              store.fetchLogs();
            }} 
            type="primary"  
            
            // Thêm hover:scale-105 và active:scale-95 để tạo hiệu ứng nhấn
            className="h-10 w-full rounded-xl bg-emerald-500 border-none shadow-lg shadow-emerald-100 font-bold hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            
            <Search size={18} />
            <span className="text-[12px]">TÌM KIẾM</span>
          </Button>

          {(store.searchText || store.dateRange || store.selectedPartId || (store.operatingConditions && store.operatingConditions !== 'all')) && (
            <Button 
              onClick={() => store.resetFilters()} 
              icon={<FilterX size={18} />} 
              // Thêm hiệu ứng hover tương tự cho nút Reset nếu muốn
              className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 border-none flex items-center justify-center hover:bg-rose-100 hover:scale-110 active:scale-90 transition-all" 
            />
          )}
        </div>
        </div>
      </Card>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                    <RefreshCw size={20} className={`text-blue-600 ${store.loading ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-black text-slate-800 tracking-tight">Nhật ký thay thế linh kiện</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dữ liệu bảo trì & Thay thế</span>
                </div>
            </div>
        </div>

        <Table
          columns={columns}
          dataSource={store.items}
          loading={store.loading}
          pagination={false}
          rowKey={(record) => record.id || Math.random()}
          className="custom-table"
        />

        <div className="p-6 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[0.15em]">Kết quả tìm thấy</Text>
              <Text className="text-slate-700 text-[15px] font-black">
                <span className="text-emerald-600">{store.items.length}</span> / {store.totalCount} BẢN GHI
              </Text>
            </div>
          </div>
          <Pagination
            current={store.pagination.current}
            pageSize={store.pagination.pageSize}
            total={store.totalCount}
            onChange={(page, size) => store.setPagination(page, size)} // Gọi hàm store đã sửa
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']} // Chỉ định rõ các mốc
            className="custom-pagination"
          />
        </div>
      </div>

      <style>{`
        /* Giữ lại các style Table cũ của bạn */
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          color: #64748b !important;
          padding: 16px 24px !important;
        }

        /* ĐỒNG BỘ SELECT PREMIUM */
        .custom-select-premium .ant-select-selector {
          border-radius: 12px !important;
          border-color: #f1f5f9 !important;
          background-color: #f8fafc !important; /* slate-50 */
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.3s ease !important;
          border-width: 1px !important;
        }

        .custom-select-premium:hover .ant-select-selector {
          border-color: #34d399 !important; 
          background-color: #fff !important;
          box-shadow: 0 4px 12px rgba(52, 211, 153, 0.08) !important;
        }

        .ant-select-focused .ant-select-selector {
          border-color: #34d399 !important;
          box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.1) !important;
        }

        /* Item trong dropdown */
        .ant-select-dropdown {
          padding: 8px !important;
          border-radius: 16px !important;
        }

        .ant-select-item-option {
          border-radius: 8px !important;
          margin-bottom: 2px !important;
          transition: all 0.2s ease !important;
        }

        .ant-select-item-option-selected {
          background-color: #f0fdf4 !important;
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, bgColor, icon, sub }: any) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:-translate-y-1 hover:shadow-md group">
    <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="flex flex-col text-left">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className="text-2xl font-black text-slate-800">{(value || 0).toLocaleString()}</span>
      <span className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</span>
    </div>
  </div>
);

export default ReplacementManagementPage;