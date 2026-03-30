import React, { useEffect } from 'react';
import { Table, Tag, Typography, Card, Input, Avatar, Pagination, Button, DatePicker, Divider, Select } from 'antd';
import { Search, Laptop, Calendar, FilterX, Box, RefreshCw, AlertCircle, CheckCircle2, Settings2, MapPin, User, UserCheck } from 'lucide-react';
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
      setLoadingParts(true);
      try {
        // Thay url này bằng endpoint API thực tế của bạn
        // const res = await axios.get('/api/parts/list');
        // setParts(res.data.map(p => ({ label: p.partName, value: p.partId })));
        
        // Demo dữ liệu giả định
        setParts([
          { label: 'Tất cả linh kiện', value: '' },
          { label: 'Sensor E3Z-D61', value: 'SENSOR_01' },
          { label: 'Motor 750W', value: 'MOTOR_02' },
          { label: 'Belt 100mm', value: 'BELT_03' },
        ]);
      } finally {
        setLoadingParts(false);
      }
    };
    loadParts();
  }, []);

  useEffect(() => {
    store.fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.dateRange, store.pagination.current, store.pagination.pageSize]); 

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
  title: 'THỜI GIAN & NHÂN VIÊN',
  key: 'time',
  width: 200,
  render: (_: any, record: any) => (
    <div className="flex flex-col gap-1.5 text-left">
      {/* Dòng 1: Thời gian - Giữ nguyên phong cách sạch sẽ */}
      <div className="flex items-center gap-2 text-slate-700">
        <Calendar size={14} className="text-emerald-500" />
        <span className="font-bold text-[13px]">
          {record?.dateOfInspection ? dayjs(record.dateOfInspection).format('DD/MM/YYYY') : '---'}
        </span>
      </div>

      {/* Dòng 2: Nhân viên - Sử dụng Avatar đúng ý bạn */}
      <div className="flex items-center gap-2">
        <Avatar 
          size={20} 
          className="bg-emerald-100 text-emerald-600 flex items-center justify-center border-none shadow-sm" 
          icon={<UserCheck size={12} />} 
        />
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">
          {record?.inspector || "N/A"}
        </span>
      </div>
    </div>
  ),
},
    {
  title: 'NỘI DUNG & LỊCH SỬ LỖI',
  key: 'check_content',
  widthmin: 280,
  render: (_: any, record: any) => (
    <div className="flex flex-col gap-2 py-1 text-left">
      {/* 1. Nội dung kiểm tra - Phần chính */}
      <div className="flex items-start gap-2">
        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <Text className="text-[13px] font-bold text-slate-700 leading-snug whitespace-normal">
          {record?.inspectionDetails || "Kiểm tra định kỳ"} 
        </Text>
      </div>

      {/* 2. Lịch sử hư hỏng - Phần phụ, nhỏ hơn và nằm dưới */}
      <div className="flex flex-col gap-1 pl-3.5 border-l-2 border-slate-100">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Lịch sử hư hỏng:
        </span>
        {record?.failureHistory ? (
          <div className="whitespace-normal">
            <Tag 
              color="error" 
              className="border-none bg-rose-50 text-rose-500 font-bold rounded-md px-2 py-0.5 m-0 text-[10px] leading-tight"
            >
              {record.failureHistory}
            </Tag>
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 italic">Không có dữ liệu lỗi</span>
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
            <Settings2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-[13px] font-black text-blue-900 leading-snug whitespace-normal">
              {record?.partName}
            </span>
          </div>
          {record?.specification && (
            <span className="text-[10px] text-blue-400 font-medium italic px-5">
              Spec: {record.specification}
            </span>
          )}
        </div>
      ),
    },
    
    {
      title: 'GHI CHÚ',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 180,
      render: (text: string) => (
        <span className="text-[11px] text-slate-400 italic leading-relaxed whitespace-normal block">
          {text || "---"}
        </span>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      
      {/* STATS SECTION - Đồng bộ hoàn toàn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Tổng linh kiện" value={store.totalCount} bgColor="bg-emerald-500" icon={<Box />} sub="Trong kho quản lý" />
        <StatCard label="Cần thay gấp" value={store.stats?.urgentReplacements} bgColor="bg-rose-500" icon={<AlertCircle />} sub="Hạng mục ưu tiên" />
        <StatCard label="Đã hoàn tất" value={store.stats?.completedThisMonth} bgColor="bg-blue-500" icon={<CheckCircle2 />} sub="Trong tháng này" />
      </div>

      <Card className="border-none rounded-[2rem] shadow-sm bg-white/80 backdrop-blur-md overflow-hidden ring-1 ring-slate-100/50">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4"> {/* Tăng lên 5 cột để đủ chỗ */}
          
          {/* Ô tìm kiếm */}
          <div className="md:col-span-1">
            <Input 
              placeholder="Mã thiết bị..." 
              value={store.searchText}
              onChange={(e) => store.setSearchText(e.target.value)}
              className="rounded-xl h-10 border-slate-100 focus:border-emerald-400"
              allowClear
              prefix={<Search size={14} className="text-slate-300 mr-1" />}
            />
          </div>

          {/* Combo Box Linh Kiện */}
          <div className="md:col-span-1">
            <Select
              showSearch
              allowClear
              placeholder="Chọn linh kiện..."
              className="w-full h-10 custom-select-premium"
              options={parts}
              value={store.selectedPart}
              // Bỏ dấu '?' nếu bạn đã cập nhật Store chắc chắn
              onChange={(value) => store.setSelectedPart(value)} 
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          {/* Range Picker */}
          <div className="md:col-span-2">
            <RangePicker 
              value={store.dateRange}
              onChange={store.setDateRange}
              className="rounded-xl h-10 border-slate-100 w-full"
              presets={rangePresets as any}
              format="DD/MM/YYYY"
            />
          </div>

          {/* Nút Action */}
          <div className="flex gap-2">
            <Button 
              onClick={store.fetchLogs} 
              type="primary" 
              className="h-10 grow rounded-xl bg-emerald-500 border-none shadow-lg shadow-emerald-100 font-bold hover:bg-emerald-600 transition-all"
            >
              TRA CỨU
            </Button>
            {(store.searchText || store.dateRange || store.selectedPart) && (
              <Button 
                onClick={() => {
                   store.resetFilters();
                   // store.setSelectedPart(''); // Reset combo box
                }} 
                icon={<FilterX size={18} />} 
                className="h-10 w-10 rounded-xl bg-red-50 text-red-500 border-none flex items-center justify-center" 
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dữ liệu bảo trì định kỳ</span>
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
            onChange={(page, size) => store.setPagination(page, size)}
            showSizeChanger
            className="custom-pagination"
          />
        </div>
      </div>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          color: #64748b !important;
          padding: 16px 24px !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          padding: 12px 24px !important;
        }
        .custom-table .ant-table-row:hover > td {
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