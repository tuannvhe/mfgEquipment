import React, { useEffect, useState } from 'react';
import { 
  Table, Tag, Typography, Card, Input, Avatar, 
  Pagination, Button, DatePicker, Divider, Empty,
  Tooltip
} from 'antd';
import { 
  Clock3, Search, User, History, List, ArrowRight,
  Calendar, FilterX, Laptop, Type, Activity, ChevronRight,
  PlusCircle, FileEdit, Trash2, UserCheck,
  MapPin,
  SlidersHorizontal
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAuditStore } from '../store/useAuditStore';
import type { AuditLog } from '../types';
import type { TimeRangePickerProps } from 'antd';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const AuditLogPage: React.FC = () => {
  const { logs, totalItems, currentPage, pageSize, fetchLogs, loading, auditStats } = useAuditStore();
  
  const [searchControl, setSearchControl] = useState<string>('');
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();

  const rangePresets: TimeRangePickerProps['presets'] = [
    { label: 'Hôm nay', value: [dayjs(), dayjs()] },
      { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
      { label: '14 ngày qua', value: [dayjs().subtract(14, 'd'), dayjs()] },
      { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
      { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
      { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];

  useEffect(() => {
    fetchLogs({ page: 1, pageSize: 10 });
  }, []);

const updateData = (params: { page?: number; pageSize?: number; searchTerm?: string }) => {

    // Ưu tiên dùng searchTerm truyền vào, nếu không thì lấy từ state
    const currentSearch = params.searchTerm !== undefined ? params.searchTerm : searchControl;

    fetchLogs({
      searchTerm: currentSearch || undefined, 
      page: params.page ?? currentPage,
      pageSize: params.pageSize ?? pageSize,
      startDate: dateRange ? dateRange[0] : undefined,
      endDate: dateRange ? dateRange[1] : undefined
    });
  };

  const handleReset = () => {
    setSearchControl('');
    setSearchTitle('');
    setDateRange(undefined);
    fetchLogs({ page: 1, pageSize: 10 });
  };

  const columns = [
          {
            title: 'THỜI GIAN CẬP NHẬT',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 180,
            fixed: 'left' as const,
            render: (date: string) => (
              <div className="flex flex-col gap-1.5 py-1">
                {/* Ngày tháng với nền nhẹ */}
                <div className="flex items-center gap-2 bg-slate-100/80 w-fit px-2.5 py-1 rounded-lg border border-slate-200/50">
                  <Calendar size={13} className="text-emerald-500" />
                  <span className="font-mono font-black text-[13px] text-slate-700 tracking-tighter">
                    {dayjs(date).format('DD/MM/YYYY')}
                  </span>
                </div>
                
                {/* Giờ phút giây */}
                <div className="flex items-center gap-1.5 text-slate-400 ml-1">
                  <Clock3 size={12} className="text-slate-500" />
                  <span className="text-[11px] font-bold tracking-widest uppercase italic">
                    {dayjs(date).format('HH:mm:ss')}
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: 'THÔNG TIN THIẾT BỊ',
            key: 'equipment',
            width: 650, // Điều chỉnh độ rộng vừa đủ để dàn hàng ngang
            render: (_: any, record: AuditLog) => (
              <div className="flex items-center gap-4 py-2">
                {/* Nhóm 1: Tên chính */}
                <div className="flex items-center gap-2 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                  <Laptop size={14} className="text-emerald-600" />
                  <Text className="text-[13px] font-black text-slate-800 whitespace-nowrap">
                    {record.equipmentTitle || "N/A"}
                  </Text>
                  <span className="text-[10px] font-bold text-emerald-600/60 bg-white px-1.5 py-0.5 rounded shadow-sm ml-1">
                    {record.entityName}
                  </span>
                </div>

                {/* Nhóm 2: Vị trí */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/30 rounded-full border border-blue-100/30">
                  <MapPin size={12} className="text-blue-500" />
                  <span className="text-[11px] font-bold text-blue-700 whitespace-nowrap">
                    {record.installationLocation || "N/A"}
                  </span>
                </div>

                {/* Nhóm 3: Số kiểm soát */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50/30 rounded-full border border-amber-100/30">
                  <Type size={12} className="text-amber-600" />
                  <span className="text-[10px] font-mono font-bold text-amber-700 whitespace-nowrap">
                    Số kiểm soát: {record.controlNumber || "N/A"}
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: 'NHÂN VIÊN',
            dataIndex: 'updatedBy',
            key: 'updatedBy',
            width: 170, // Thu hẹp lại
            render: (user: string) => (
              <div className="flex items-center gap-2">
                <Avatar size={20} className="bg-emerald-100 text-emerald-600" icon={<UserCheck size={12} />} />
                <Text className="text-[12px] font-bold text-slate-600">{user || "Hệ thống"}</Text>
              </div>
            ),
          },
          {
            title: 'THAO TÁC',
            dataIndex: 'action',
            key: 'action',
            width: 130,
            align: 'center' as const,
            render: (action: string) => {
        const configs = {
          Created: { 
            color: 'emerald', 
            label: 'TẠO MỚI', 
            icon: <PlusCircle size={12} strokeWidth={3} />,
            gradient: 'from-emerald-400 to-emerald-600',
            shadow: 'shadow-emerald-100'
          },
          Modified: { 
            color: 'amber', 
            label: 'CHỈNH SỬA', 
            icon: <FileEdit size={12} strokeWidth={3} />,
            gradient: 'from-amber-400 to-amber-600',
            shadow: 'shadow-amber-100'
          },
          Deleted: { 
            color: 'rose', 
            label: 'XÓA BỎ', 
            icon: <Trash2 size={12} strokeWidth={3} />,
            gradient: 'from-rose-400 to-rose-600',
            shadow: 'shadow-rose-100'
          },
        }[action] || { color: 'slate', label: action, icon: null, gradient: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-100' };

        return (
          <div className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-xl
            bg-white border border-${configs.color}-100
            ${configs.shadow} shadow-sm
            group/tag transition-all duration-300 hover:scale-105
          `}>
            {/* Icon Circle - Điểm nhấn tròn phía trước */}
            <div className={`
              flex items-center justify-center w-5 h-5 rounded-lg
              bg-gradient-to-br ${configs.gradient} text-white shadow-sm
            `}>
              {configs.icon}
            </div>

            {/* Text với spacing rộng và font đậm */}
            <span className={`
              font-black text-[10px] tracking-[0.05em]
              text-${configs.color}-600 uppercase
            `}>
              {configs.label}
            </span>
          </div>
        );
      },
    },   
];

const renderEmptyState = () => (
    <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-700">
      {/* Icon Search với hiệu ứng nhảy bounce */}
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 animate-bounce">
        <Search size={40} className="text-slate-300" />
      </div>

      {/* Thông báo chính */}
      <h3 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả</h3>
      
      {/* Thông báo phụ */}
      <p className="text-slate-500 mt-2 text-center">
        Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn
      </p>

      {/* Nút reset chỉ hiện khi có filter */}
      {(searchControl || dateRange) && (
        <Button 
          onClick={handleReset} 
          className="mt-6 h-11 px-8 rounded-xl font-bold bg-emerald-500 text-white border-none hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
        >
          XÓA TẤT CẢ BỘ LỌC
        </Button>
      )}
    </div>
  );

  const expandedRowRender = (record: AuditLog) => {
    const changeList = record.newValue?.split(' | ') || [];
    const isCreated = record.action === 'Created';
    const isDeleted = record.action === 'Deleted';
    const formatValue = (val: string | null) => {
    if (!val || val === "Trống" || val === "null") return null;
  // 1. Kiểm tra nếu là định dạng ngày tháng từ Database (ví dụ: "4/3/2026 12:00:00 AM")
  // Regex này nhận diện các chuỗi có định dạng ngày/tháng/năm kèm giờ
  const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/; 
  
  if (dateTimeRegex.test(val)) {
    const d = dayjs(val);
    if (d.isValid()) {
      return d.format('DD/MM/YYYY');
    }
  }

  // 2. Việt hóa các giá trị Boolean cho dễ đọc
  if (val.toLowerCase() === 'false') return '';
  if (val.toLowerCase() === 'true') return '';

  return val;
};
    // Hàm mapping để Việt hóa tên các trường dữ liệu
    const translateProperty = (prop: string) => {
      const dictionary: Record<string, string> = {
        'ISDELETED': 'TRẠNG THÁI XÓA',
        'PERIODICITEMS': 'HẠNG MỤC ĐỊNH KỲ',
        'PARTNUMBER': 'MÃ PHỤ TÙNG',
        'QUANTITY': 'SỐ LƯỢNG',
        'EQUIPMENTTITLE': 'TÊN THIẾT BỊ',
        'CONTROLNUMBER': 'SỐ KIỂM SOÁT',
        'STATUS': 'TRẠNG THÁI',
        'DESCRIPTION': 'MÔ TẢ',
        'EQUIPMENTTYPE': 'LOẠI THIẾT BỊ',
        'LOCATION': 'VỊ TRÍ',
        'USER': 'NGƯỜI DÙNG',
        'APPLIEDMODELNAME': 'TÊN MÔ HÌNH ÁP DỤNG',
        'OPERATINGCONDITIONS': 'ĐIỀU KIỆN VẬN HÀNH',
        'EQUIPMENTPRICE':'GIÁ THIẾT BỊ',
        'MANUFCATURERNAME':'TÊN NHÀ SẢN XUẤT',
        'MANUFACTUREREQUIPMENTTITLE':'TÊN THIẾT BỊ THEO NHÀ SẢN XUẤT',
        'MODEL':'TÊN MẪU',
        'SERIALNO':'SỐ SERI',
        'WEIGHT':'TRỌNG LƯỢNG',
        'POWER':'NGUỒI ĐIỆN',
        'DATEOFMANUFACTURE':'NGÀY SẢN XUẤT',
        'SIZE':'KÍCH THƯỚC',
        'RESPONSIBLEPERSON':'NGƯỜI PHỤ TRÁCH',
        'INSTALLATIONLOCATION':'ĐỊA ĐIỂM LẮP ĐẶT',
        'DATEOFINSTALLATION':'NGÀY LẮP ĐẶT',
        'INSPECTIONINTERVAL':'CHU KỲ KIỂM TRA',
        'PERIODICINSPECTIONITEMS':'CÁC HẠNG MỤC KIỂM TRA ĐỊNH KỲ',
        'PARTNAME': 'TÊN LINH KIỆN',
        'SPECIFICATION':'QUY CÁCH',
        'DATEOFINSPECTION':'NGÀY KIỂM TRA',
        'INSPECTIONDETAILS':'NỘI DUNG KIỂM TRA/SỰ CỐ',
        'FAILUREHISTORY':'LỊCH SỬ HỎNG',
        'REPLACEMENTPARTS':'LINH KIỆN THAY THẾ',
        'INSPECTOR': 'NGƯỜI KIỂM TRA',
        'REMARKS':'GHI CHÚ',
        'EQUIPMENTIMAGE':'HÌNH ẢNH',
        'IMAGENAME':'TÊN HÌNH ẢNH',
        'RELATIVEPATH':'ĐƯỜNG DẪN ẢNH',
        'TYPE':'LOẠI',
        'EQUIPMENTHEADER':'THIẾT BỊ',
        'SPAREPART': 'LINH KIỆN THAY THẾ',
        '---':'TRỐNG',
        'CREATIONTIME':'THỜI GIAN CẬP NHẬT'
      };
      return dictionary[prop.toUpperCase()] || prop;
    };

return (
    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 m-2 shadow-inner">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
          <Activity size={16} className="text-slate-400" />
        </div>
        <h4 className="text-[13px] font-black text-slate-600 uppercase tracking-widest">
          Chi tiết các thay đổi dữ liệu
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {changeList.map((change, index) => {
          const [propPart, valuePart] = change.split(': ');
          const propertyName = propPart?.split('.').pop() || '';
          const hasArrow = valuePart?.includes(' -> ');
          const [oldVal, newVal] = hasArrow ? valuePart.split(' -> ') : [null, valuePart];

          return (
            <div key={index} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 transition-all group">
              {/* Tên thuộc tính */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">
                  {translateProperty(propertyName)}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded border border-slate-100 font-bold uppercase">
                  Field
                </span>
              </div>

              {/* Box hiển thị giá trị */}
              <div className="space-y-2">
                {oldVal && (
                  <div className="relative pl-3 border-l-2 border-slate-200 py-1">
                    <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-200" />
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Trước:</div>
                    <div className="text-[12px] text-slate-500 font-medium  opacity-60 truncate">
                      {formatValue(oldVal)}
                    </div>
                  </div>
                )}

                <div className={`relative pl-3 border-l-2 ${oldVal ? 'border-blue-400' : 'border-slate-300'} py-1 bg-slate-50/50 rounded-r-lg`}>
                  <span className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${oldVal ? 'bg-blue-400' : 'bg-slate-300'}`} />
                  <div className={`text-[10px] font-bold uppercase mb-0.5 ${oldVal ? 'text-blue-500' : 'text-slate-500'}`}>
                    {oldVal ? 'Sau khi sửa:' : 'Giá trị thiết lập:'}
                  </div>
                  <Tooltip title={formatValue(newVal)} mouseEnterDelay={0.5}>
                    <div className="text-[13px] text-slate-800 font-black truncate leading-tight tracking-tight">
                      {formatValue(newVal)}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-1000">
      
      {/* BỘ LỌC THÔNG MINH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Tổng lưu lượng', value: totalItems, sub: 'Bản ghi hệ thống', icon: <Activity />, color: 'emerald' },
          { label: 'Biến động 24h', value: auditStats?.new24h || 0, sub: 'Tạo mới & Sửa', icon: <History />, color: 'blue' },
          { label: 'Dữ liệu đã xóa', value: auditStats?.deleted || 0, sub: 'Thiết bị đã xóa', icon: <Trash2 />, color: 'rose' },
        ].map((stat, i) => {
          // Tạo mapping class để Tailwind nhận diện được đầy đủ
          const colorMapper = {
            emerald: {
              bgGradient: 'from-emerald-500 to-emerald-600',
              bgLight: 'bg-emerald-50',
              text: 'text-emerald-500',
              shadow: 'shadow-emerald-200/50',
              decor: 'group-hover:bg-emerald-500/10 bg-emerald-500/5'
            },
            blue: {
              bgGradient: 'from-blue-500 to-blue-600',
              bgLight: 'bg-blue-50',
              text: 'text-blue-500',
              shadow: 'shadow-blue-200/50',
              decor: 'group-hover:bg-blue-500/10 bg-blue-500/5'
            },
            rose: {
              bgGradient: 'from-rose-500 to-rose-600',
              bgLight: 'bg-rose-50',
              text: 'text-rose-500',
              shadow: 'shadow-rose-200/50',
              decor: 'group-hover:bg-rose-500/10 bg-rose-500/5'
            }
          }[stat.color as 'emerald' | 'blue' | 'rose'];

          return (
            <div key={i} className="group relative bg-white rounded-[2rem] p-1 transition-all duration-500 hover:-translate-y-2 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100/80 overflow-hidden">
              {/* Background Decor - Sửa class nối chuỗi */}
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${colorMapper.decor}`} />
              
              <div className="relative flex items-center gap-5 p-5">
                {/* Icon Box - Sửa class nối chuỗi */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMapper.bgGradient} flex items-center justify-center text-white shadow-lg ${colorMapper.shadow} transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  {React.cloneElement(stat.icon as React.ReactElement, { size: 28, strokeWidth: 2.5 })}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{stat.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{stat.value.toLocaleString()}</span>
                    {/* Badge - Sửa class nối chuỗi */}
                    <span className={`text-[10px] font-bold ${colorMapper.text} ${colorMapper.bgLight} px-1.5 py-0.5 rounded-md uppercase`}>Items</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 opacity-70">{stat.sub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Card className="border-none rounded-[32px] bg-white/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50" styles={{ body: { padding: '24px' } }}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ô Tìm kiếm */}
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <Search size={12} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tìm kiếm thiết bị</span>
            </div>
            <Input 
              placeholder="Mã kiểm soát / Tên thiết bị..." 
              value={searchControl}
              onChange={e => setSearchControl(e.target.value)}
              // Giảm chiều cao xuống h-10, bo góc xl (12px)
              className="h-10 rounded-xl bg-slate-50/50 border-slate-100 hover:border-emerald-300 focus:bg-white transition-all text-[13px]"
              allowClear
              onPressEnter={() => updateData({ page: 1 })}
            />
          </div>

          {/* Bộ chọn Ngày */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <Calendar size={12} className="text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Thời Gian</span>
            </div>
            <RangePicker 
              className="w-full h-10 rounded-xl bg-slate-50/50 border-slate-100 hover:border-emerald-300 focus:bg-white transition-all text-[13px]"
              format="DD/MM/YYYY"
              presets={rangePresets}
              value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
              onChange={(dates) => {
                if (dates?.[0] && dates?.[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                } else {
                  setDateRange(undefined);
                }
              }}
            />
          </div>

          {/* Nút bấm */}
          <div className="flex items-end gap-2">
            <Button 
              onClick={() => {
                fetchLogs({ 
                  page: 1, 
                  pageSize: pageSize,
                  searchTerm: searchControl || undefined,
                  startDate: dateRange ? dateRange[0] : undefined,
                  endDate: dateRange ? dateRange[1] : undefined
                });
              }} 
              type="primary" 
              loading={loading}
              className="h-10 w-full rounded-xl bg-emerald-500 border-none shadow-lg shadow-emerald-100 font-bold hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            >
              <div className="flex items-center gap-2">
                {!loading && <Search size={18} strokeWidth={2.5} />}
                <span className="uppercase tracking-wider text-[13px]">Tìm kiếm</span>
              </div>
            </Button>
            
            {(searchControl || dateRange) && (
              <Button 
                icon={<FilterX size={18} />} 
                onClick={handleReset} 
                // Nút reset cũng nhỏ lại tương ứng h-10 w-10
                className="h-10 w-10 rounded-xl bg-red-50 text-red-500 border-none hover:bg-red-100 flex items-center justify-center shrink-0" 
              />
            )}
          </div>
        </div>
      </Card>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50 overflow-hidden transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between p-7 bg-white border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner">
              <List size={20} className="text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="uppercase tracking-[0.2em] text-[10px] text-slate-400 font-black leading-none mb-1.5">
                Data Stream Tracking
              </span>
              <span className="text-base text-slate-800 font-black">Danh sách lịch sử thao tác</span>
            </div>
          </div>
          
          {loading && (
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-xl border border-emerald-100 animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                ĐANG TẢI DỮ LIỆU...
             </div>
          )}
        </div>
        
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{ emptyText: renderEmptyState() }}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            columnWidth: 60,
            expandIcon: ({ expanded, onExpand, record }) => (
              <span 
                onClick={e => onExpand(record, e)} 
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 cursor-pointer shadow-sm ${
                  expanded ? 'bg-emerald-500 text-white rotate-90' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <ChevronRight size={14} strokeWidth={3} />
              </span>
            ),
          }}
          rowClassName={() => `group cursor-pointer transition-all duration-200 hover:bg-emerald-50/10`}
          className="custom-audit-table"
        />
        
        {logs.length > 0 && (
          <div className="p-8 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
            <div className="flex items-center gap-4">
               <div className="flex flex-col">
                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[0.15em]">Tổng số bản ghi</Text>
                  <Text className="text-slate-700 text-[15px] font-black">
                    <span className="text-emerald-600">{totalItems}</span> THAO TÁC
                  </Text>
               </div>
               <Divider type="vertical" className="h-10 border-slate-200 mx-2" />
               {/* <div className="hidden md:block">
                  <Text className="text-[12px] text-slate-400 font-medium italic italic">
                    Dữ liệu được cập nhật thời gian thực từ máy chủ
                  </Text>
               </div> */}
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalItems}
              onChange={(p, ps) => updateData({ page: p, pageSize: ps })}
              showSizeChanger
              className="custom-pagination"
            />
          </div>
        )}
      </div>

     <style>{`
        /* Ẩn scrollbar nhưng vẫn scroll được */
        .custom-audit-table .ant-table-body::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-audit-table .ant-table-body::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        /* Hiệu ứng Glass cho Header */
        .custom-audit-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #475569 !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 18px 24px !important;
        }

        /* Border radius cho Table */
        .custom-audit-table {
          border-radius: 24px;
          overflow: hidden;
        }

        /* Row Hover Effect */
        .ant-table-row {
          transition: all 0.3s ease !important;
        }
        .ant-table-row:hover > td {
          background-color: #f0fdf4/50 !important;
        }

        /* Custom Pagination */
        // .custom-pagination .ant-pagination-item {
        //   border-radius: 12px !important;
        //   border: none !important;
        //   background: #f1f5f9 !important;
        //   font-weight: bold !important;
        // }
        // .custom-pagination .ant-pagination-item-active {
        //   background: #0add97 !important;
        //   box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
        // }
        .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
        .custom-pagination .ant-pagination-next .ant-pagination-item-link {
          border-radius: 12px !important;
          border: none !important;
          background: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default AuditLogPage;