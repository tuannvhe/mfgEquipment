import { useState } from 'react'
import type { Equipment, User } from '../types'
import EquipmentRow from '../components/EquipmentRow'
import { Input, Select, Button, Pagination, DatePicker, Card, Skeleton} from 'antd' 
import { 
  Search, X, Settings2, CheckCircle2, AlertCircle, XCircle, 
  Calendar, MapPin, Activity, Type, List, SlidersHorizontal, Plus,
  LayoutGrid,
  Filter,
  FilterXIcon
} from 'lucide-react'
import dayjs from 'dayjs' 
import type { TimeRangePickerProps} from 'antd';

const { RangePicker } = DatePicker;
const LOCATIONS = ['Bắc Giang #1', 'Bắc Giang #2', 'Bắc Ninh', 'Hà Nam', 'Hưng Yên']

const EquipmentSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-3">
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton.Button active size="small" style={{ width: 120 }} />
          <Skeleton.Button active size="small" style={{ width: 80 }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
        </div>
      </div>
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
  workCenterCode: ''
})

interface Props {
  equipment: Equipment[]
  totalItems: number
  currentPage: number
  pageSize: number
  fetchEquipment: (params: any) => void
  onSave: (eq: Equipment) => Promise<any>
  onDelete: (id: string) => void
  user: User
  stats: { good: number; warn: number; bad: number };
  loading?: boolean;
}

export default function EquipmentListPage({ 
  equipment, totalItems, currentPage, pageSize, fetchEquipment, 
  onSave, onDelete, stats, loading 
}: Props) {
  const readOnly = false
  const [q, setQ] = useState('')
  const [fLoc, setFLoc] = useState<string | undefined>()
  const [fType] = useState<string | undefined>()
  const [fStatus, setFStatus] = useState<string | undefined>()
  const [fDates, setFDates] = useState<[string, string] | undefined>()
  
  const rangePresets: TimeRangePickerProps['presets'] = [
    { label: 'Hôm nay', value: [dayjs(), dayjs()] },
    { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];

  const updateData = (params: any) => {
    fetchEquipment({
      page: params.page ?? 1,
      searchTerm: params.search !== undefined ? params.search : q,
      location: params.hasOwnProperty('loc') ? params.loc : fLoc,
      type: params.type ?? fType,
      status: params.hasOwnProperty('status') ? params.status : fStatus,
      pageSize: params.pageSize ?? pageSize,
      startDate: params.dates ? params.dates[0] : fDates?.[0],
      endDate: params.dates ? params.dates[1] : fDates?.[1],
    });
  };

  const statCards = [
    { label: 'Tổng thiết bị', val: totalItems, color: 'from-blue-600 to-blue-400', Icon: Settings2, shadow: 'shadow-blue-200' },
    { label: 'Hoạt động tốt', val: stats.good, color: 'from-emerald-600 to-teal-400', Icon: CheckCircle2, shadow: 'shadow-emerald-200' },
    { label: 'Theo dõi', val: stats.warn, color: 'from-amber-500 to-orange-300', Icon: AlertCircle, shadow: 'shadow-amber-200' },
    { label: 'Hỏng / Sửa chữa', val: stats.bad, color: 'from-rose-600 to-red-400', Icon: XCircle, shadow: 'shadow-red-200' },
  ]

  const resetFilters = () => {
    setQ(''); setFLoc(undefined); setFStatus(undefined); setFDates(undefined);
    fetchEquipment({ page: 1, pageSize, searchTerm: '', location: undefined, status: undefined });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* 1. Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={`relative overflow-hidden group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:-translate-y-1 transition-all duration-300 ${s.shadow} hover:shadow-xl`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${s.color} opacity-[0.05] rounded-full group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative flex flex-col gap-1">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2 shadow-lg`}>
                <s.Icon size={20} />
              </div>
              <div className="text-3xl font-black text-slate-800 tracking-tight">{s.val}</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Filter Card */}
      <Card 
        className="border-none rounded-[32px] bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-100"
        styles={{ body: { padding: '24px' } }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200"><SlidersHorizontal size={22} /></div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Bộ lọc</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"> 
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1"><Type size={12} className="text-blue-500" /><span className="text-[11px] font-bold uppercase tracking-tight">Từ khóa</span></div>
            <Input prefix={<Search size={14} className="text-slate-400" />} placeholder="Mã số, tên thiết bị..." value={q} onChange={e => setQ(e.target.value)} onPressEnter={() => updateData({})} className="h-10 rounded-xl bg-slate-50 border-slate-200" allowClear />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1"><MapPin size={12} className="text-emerald-500" /><span className="text-[11px] font-bold uppercase tracking-tight">Địa điểm</span></div>
            <Select placeholder="Tất cả vị trí" value={fLoc} onChange={setFLoc} allowClear className="w-full h-10" options={LOCATIONS.map(l => ({ value: l, label: l }))} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1"><Activity size={12} className="text-amber-500" /><span className="text-[11px] font-bold uppercase tracking-tight">Vận hành</span></div>
            <Select placeholder="Tất cả" value={fStatus} onChange={setFStatus} allowClear className="w-full h-10" options={[{ value: 'Good', label: '🟢 Hoạt động tốt' }, { value: 'Warning', label: '🟡 Theo dõi' }, { value: 'Bad', label: '🔴 Hỏng/Sửa chữa' }]} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 ml-1"><Calendar size={12} className="text-purple-500" /><span className="text-[11px] font-bold uppercase tracking-tight">Ngày lắp đặt</span></div>
            <RangePicker className="w-full h-10 rounded-xl bg-slate-50 border-slate-200" format="DD/MM/YYYY" presets={rangePresets} value={fDates ? [dayjs(fDates[0]), dayjs(fDates[1])] : null} onChange={(dates) => dates ? setFDates([dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]) : setFDates(undefined)} />
          </div>

          <div className="flex items-center gap-2">
            <Button type="primary" onClick={() => updateData({})} className="flex-1 h-10 font-black rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 border-none shadow-lg shadow-green-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Search size={16} strokeWidth={3} /><span>TÌM KIẾM</span>
            </Button>
            {(q || fLoc || fStatus || fDates) && <Button type="text" danger icon={<FilterXIcon size={18} />} onClick={resetFilters} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-50 shrink-0" />}
          </div>
        </div>
      </Card>

      {/* 3. Main List Card */}
      <Card 
        className="border-none rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden"
        styles={{ body: { padding: '24px' } }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-400 rounded-2xl text-white shadow-lg shadow-emerald-200 transition-transform group-hover:rotate-6">
              <List size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Danh sách hồ sơ thiết bị</h2>
              {loading && <p className="text-[10px] text-blue-500 font-bold animate-pulse">ĐANG CẬP NHẬT DỮ LIỆU...</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Add New Row Section */}
          {!readOnly && (
            <div className="relative group p-4 rounded-2xl bg-slate-50/50 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full shadow-md flex items-center gap-1">
                <Plus size={12} strokeWidth={3} /> TẠO MỚI THIẾT BỊ
              </div>
              <EquipmentRow key="fixed-add-new-row" eq={EMPTY_EQ()} isNew={true} onSave={async (newEq) => await onSave(newEq)} onDelete={() => {}} />
            </div>
          )}

          {/* List Content */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="space-y-3">{[...Array(pageSize)].map((_, i) => <EquipmentSkeleton key={i} />)}</div>
            ) : equipment.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={32} className="text-slate-300" /></div>
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy dữ liệu</h3>
                <p className="text-slate-400 text-sm">Vui lòng thử lại với bộ lọc khác</p>
              </div>
            ) : (
              <div className="space-y-3">
                {equipment.map(eq => (
                  <div key={eq.id} className="transition-all duration-200 hover:scale-[1.005]">
                    <EquipmentRow eq={eq} onSave={onSave} onDelete={onDelete} readOnly={readOnly} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Pagination Inside Card */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
            onChange={(p, ps) => updateData({ page: p, pageSize: ps })}
            className="custom-pagination-rms"
            locale={{ items_per_page: '/ trang', jump_to: 'Đi đến', page: 'Trang' }} 
            showTotal={(total, range) => (
              <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                Hiển thị {range[0]}-{range[1]} trên tổng số {total} thiết bị
              </span>
            )}
          />
        </div>
      </Card>
    </div>
  );
}