import { useState } from 'react'
import type { Equipment, User } from '../types'
import EquipmentRow from '../components/EquipmentRow'
import { Input, Select, Button, Pagination, DatePicker, Card, Skeleton} from 'antd' 
import { 
  Search, X, Settings2, CheckCircle2, AlertCircle, XCircle, 
  Download, Calendar, MapPin, Activity, Type, List 
} from 'lucide-react'
import dayjs from 'dayjs' 
import type { TimeRangePickerProps} from 'antd';

const { RangePicker } = DatePicker;
const LOCATIONS = ['Bắc Giang #1', 'Bắc Giang #2', 'Bắc Ninh', 'Hà Nam', 'Hưng Yên']
const EquipmentSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-3">
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 space-y-3">
        {/* Giả lập Tiêu đề và Mã số */}
        <div className="flex items-center gap-3">
          <Skeleton.Button active size="small" style={{ width: 120 }} />
          <Skeleton.Button active size="small" style={{ width: 80 }} />
        </div>
        {/* Giả lập thông tin chi tiết */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
        </div>
      </div>
      {/* Giả lập các nút thao tác bên phải */}
      <div className="flex gap-2">
        <Skeleton.Avatar active size="large" shape="square" />
        <Skeleton.Avatar active size="large" shape="square" />
      </div>
    </div>
  </div>
);
const EMPTY_EQ = (): Equipment => ({
  id: '',
  appmodel: '', opcond: 'Good', ctrlnum: '', eqtype: '',
  location: 'Bắc Giang #1', person: '', instdate: '', value: '',
  mfgname: '', eqtitle: '', model: '', serial: '', mfgdate: '',
  weight: '', power: '', size: '', makeraddr: '',
  periodicItems: [], inspections: [], spareParts: [],
})

interface Props {
  equipment: Equipment[]
  totalItems: number      // <-- Thêm mới
  currentPage: number    // <-- Thêm mới
  pageSize: number       // <-- Thêm mới
  fetchEquipment: (params: any) => void // <-- Hàm để gọi API trang mới
  onSave: (eq: Equipment) => Promise<any>
  onDelete: (id: string) => void
  user: User
  stats: { good: number; warn: number; bad: number };
  loading?: boolean;
}

export default function EquipmentListPage({ 
  equipment, 
  totalItems, 
  currentPage, 
  pageSize, 
  fetchEquipment, 
  onSave, 
  onDelete, 
  user,
  stats,
  loading
}: Props) {
  const readOnly = false
  const [q, setQ] = useState('')
  const [fLoc, setFLoc] = useState<string | undefined>()
  const [fType] = useState<string | undefined>()
  const [fStatus, setFStatus] = useState<string | undefined>()
  //const [showNewForm, setShowNewForm] = useState(false)
  const [fDates, setFDates] = useState<[string, string] | undefined>()
  
  const rangePresets: TimeRangePickerProps['presets'] = [
  { label: 'Hôm nay', value: [dayjs(), dayjs()] },
  { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
  { label: '14 ngày qua', value: [dayjs().subtract(14, 'd'), dayjs()] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
];

  // Hàm trung tâm để gọi dữ liệu từ Server
 const updateData = (params: { 
  page?: number; 
  search?: string; 
  loc?: string | null;
  type?: string; 
  status?: string | null;
  pageSize?: number; 
  dates?: [string, string] | null;
}) => {
  const finalSearch = params.search !== undefined ? params.search : q;
  const finalLoc    = params.hasOwnProperty('loc') ? params.loc : fLoc;
  const finalStatus = params.hasOwnProperty('status') ? params.status : fStatus;
  const finalDates  = params.hasOwnProperty('dates') ? params.dates : fDates;
  fetchEquipment({
    page: params.page ?? 1,
    searchTerm: finalSearch,
    location: finalLoc,
    type: params.type ?? fType,
    status: finalStatus,
    pageSize: params.pageSize ?? pageSize,
    startDate: finalDates ? finalDates[0] : undefined,
    endDate: finalDates ? finalDates[1] : undefined,
  });
};
  const statCards = [
    { label: 'Tổng thiết bị', val: totalItems, border: 'border-l-[#2d5f1b]', num: 'text-[#2d5f1b]', Icon: Settings2, bg: 'bg-[#f0f4f0]' },
    { label: 'Hoạt động tốt', val: stats.good,  border: 'border-l-emerald-600', num: 'text-emerald-600', Icon: CheckCircle2, bg: 'bg-emerald-50' },
    { label: 'Theo dõi',  val: stats.warn,  border: 'border-l-amber-500',  num: 'text-amber-500',  Icon: AlertCircle, bg: 'bg-amber-50' },
    { label: 'Hỏng / Sửa chữa',   val: stats.bad,   border: 'border-l-red-600',     num: 'text-red-600',   Icon: XCircle, bg: 'bg-red-50' },
  ]

const resetFilters = () => {
  // 1. Reset các state về giá trị ban đầu
  setQ('');
  setFLoc(undefined);
  setFStatus(undefined);
  setFDates(undefined);
  
  // 2. Gọi API để tải lại toàn bộ danh sách không có bộ lọc
  fetchEquipment({ 
    page: 1, 
    pageSize, 
    searchTerm: '', 
    location: undefined, 
    status: undefined 
  });
};
const handleSearch = (overrideParams?: any) => {
    fetchEquipment({
      page: overrideParams?.page ?? 1,
      pageSize: overrideParams?.pageSize ?? pageSize,
      searchTerm: overrideParams?.search !== undefined ? overrideParams?.search : q,
      location: overrideParams?.hasOwnProperty('loc') ? overrideParams.loc : fLoc,
      status: overrideParams?.hasOwnProperty('status') ? overrideParams.status : fStatus,
      startDate: (overrideParams?.dates ? overrideParams.dates[0] : fDates?.[0]),
      endDate: (overrideParams?.dates ? overrideParams.dates[1] : fDates?.[1]),
    });
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Stat Cards - Giữ nguyên logic nhưng thêm chút shadow hover */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-slate-200 border-l-4 ${s.border} p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3`}>
            <div>
              <div className={`text-3xl font-extrabold leading-none ${s.num}`}>{s.val}</div>
              <div className="text-[12px] text-slate-500 mt-2 font-bold uppercase tracking-widest">{s.label}</div>
            </div>
            <s.Icon size={32} className={`ml-auto opacity-20 ${s.num}`} />
          </div>
        ))}
      </div>

      <Card 
        className="shadow-md shadow-slate-200/50 border-none rounded-3xl overflow-hidden"
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div className="flex items-center justify-between mb-5"> 
          <div className="space-y-0">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 text-green-600"> 
              <span className="w-1.5 h-6 bg-green-600 rounded-full inline-block" />
              Bộ lọc tìm kiếm
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> 
          {/* Tìm kiếm văn bản */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <Type size={12} className="text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Từ khóa</span>
            </div>
            <Input
              prefix={<Search size={14} className="text-slate-400" />}
              placeholder="Mã số, tên thiết bị..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onPressEnter={() => handleSearch()}
              className="h-9 rounded-lg bg-slate-50 border-slate-200 focus:bg-white transition-all" // h-11 -> h-9
              allowClear
            />
          </div>

          {/* Vị trí */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <MapPin size={12} className="text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Vị trí</span>
            </div>
            <Select
              placeholder="Tất cả vị trí"
              value={fLoc}
              onChange={setFLoc}
              allowClear
              className="w-full h-9" 
              options={LOCATIONS.map(l => ({ value: l, label: l }))}
            />
          </div>

          {/* Trạng thái */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <Activity size={12} className="text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Trạng thái</span>
            </div>
            <Select
              placeholder="Tất cả"
              value={fStatus}
              onChange={setFStatus}
              allowClear
              className="w-full h-9"
              options={[
                { value: 'Good', label: '🟢 Hoạt động tốt' },
                { value: 'Warning', label: '🟡 Theo dõi' },
                { value: 'Bad', label: '🔴 Hỏng/Sửa chữa' },
              ]}
            />
          </div>

          {/* Thời gian */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1">
              <Calendar size={12} className="text-purple-500" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Ngày lắp đặt</span>
            </div>
            <RangePicker
              className="w-full h-9 rounded-lg bg-slate-50 border-slate-200"
              format="DD/MM/YYYY"
              presets={rangePresets}
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']} 
              value={fDates ? [dayjs(fDates[0]), dayjs(fDates[1])] : null}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFDates([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                } else {
                  setFDates(undefined);
                }
              }}
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button 
              type="primary" 
              size="middle"
              icon={<Search size={16} />} 
              onClick={() => handleSearch()}
              className="bg-green-600 hover:bg-green-700 h-9 px-6 font-semibold rounded-xl shadow-md shadow-green-100 border-none flex items-center"
            >
              LỌC DỮ LIỆU
            </Button>
            {(q || fLoc || fStatus || fDates) && (
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<X size={16} />} 
                onClick={resetFilters}
                className="h-9 font-semibold hover:bg-red-50 rounded-xl px-4 transition-all"
              >
                Xóa lọc
              </Button>
            )}
          </div>

          <Button 
            size="middle"
            icon={<Download size={16} />} 
            className="h-9 border-slate-200 text-slate-600 hover:text-emerald-600 rounded-xl px-4 flex items-center font-medium bg-slate-50/50"
          >
            Xuất Excel
          </Button>
        </div>
      </Card>

      {/* 3. PHẦN DANH SÁCH THIẾT BỊ */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-4 text-slate-600 font-bold px-2">
          <List size={18} />
          <span className="uppercase tracking-widest text-sm text-emerald-800 font-bold">
            Danh sách hồ sơ thiết bị
          </span>
          {loading && <span className="ml-2 text-xs font-normal text-slate-400 animate-pulse">(Đang tải dữ liệu...)</span>}
        </div>

        <div className="space-y-4">
          {/* Luôn hiện dòng Thêm mới nếu không phải ReadOnly */}
          {!readOnly && (
            <div className="group bg-blue-50/30 p-4 rounded-2xl border-2 border-dashed border-blue-100 hover:border-blue-300 transition-colors">
              <EquipmentRow
                key="fixed-add-new-row" 
                eq={EMPTY_EQ()} 
                isNew={true}
                onSave={async (newEq) => {
                  await onSave(newEq);
                  // Sau khi lưu xong, form sẽ tự reset về EMPTY_EQ() nhờ key cố định
                }}
                onDelete={() => {}}
              />
            </div>
          )}

          {/* LOGIC CHÍNH: Ưu tiên Loading -> No Data -> List */}
          {loading ? (
            <div className="grid grid-cols-1 gap-3">
              {[...Array(pageSize)].map((_, i) => (
                <EquipmentSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {equipment.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                  {/* ... UI Empty ... */}
                </div>
              ) : (
                equipment.map(eq => (
                  <EquipmentRow 
                    key={eq.id} 
                    eq={eq} 
                    onSave={onSave} 
                    onDelete={onDelete} 
                    readOnly={readOnly} 
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Pagination - Việt hóa & Style */}
      <div className="flex justify-center py-8">
        <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
            onChange={(p, ps) => updateData({ page: p, pageSize: ps })}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
            
            locale={{ 
              items_per_page: '/ trang', 
              jump_to: 'Đi đến',
              page: 'Trang',
            }} 
            
            showTotal={(total, range) => (
              <span className="text-slate-500 font-medium">
                Bản ghi <span>{range[0]}-{range[1]}</span> / {total}
              </span>
            )}
          />
      </div>
    </div>
  )
}
