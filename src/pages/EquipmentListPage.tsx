import {  useState } from 'react'
import { Input, Select, Button, Pagination } from 'antd'
import { Search, X, Settings2, CheckCircle2, AlertCircle, XCircle, Download, PlusCircle } from 'lucide-react'
import type { Equipment, User } from '../types'
import { exportToExcel } from '../utils/excelExport'
import EquipmentRow from '../components/EquipmentRow'

const LOCATIONS = ['Bắc Giang #1', 'Bắc Giang #2', 'Bắc Ninh', 'Hà Nam', 'Hưng Yên']

const EMPTY_EQ = (): Equipment => ({
  id: '',
  appmodel: '', opcond: 'Good', ctrlnum: '', eqtype: 'Winding',
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
  onSave: (eq: Equipment) => void
  onDelete: (id: string) => void
  user: User
  stats: { good: number; warn: number; bad: number };
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
  stats 
}: Props) {
  const readOnly = false
  const [q, setQ] = useState('')
  const [fLoc, setFLoc] = useState<string | undefined>()
  const [fType, setFType] = useState<string | undefined>()
  const [fStatus, setFStatus] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  //const [showNewForm, setShowNewForm] = useState(false)

  // Hàm trung tâm để gọi dữ liệu từ Server
  const updateData = (params: { page?: number; search?: string; loc?: string; type?: string; status?: string; pageSize?: number; }) => {
    fetchEquipment({
      page: params.page ?? 1,
      searchTerm: params.search ?? q,
      location: params.loc ?? fLoc,
      type: params.type ?? fType,
      status: params.status ?? fStatus,
      pageSize: params.pageSize ?? pageSize
    });
  };
  



  const statCards = [
    { label: 'Tổng thiết bị', val: totalItems, border: 'border-l-[#2d5f1b]', num: 'text-[#2d5f1b]', Icon: Settings2, bg: 'bg-[#f0f4f0]' },
    { label: 'Hoạt động tốt', val: stats.good,  border: 'border-l-emerald-600', num: 'text-emerald-600', Icon: CheckCircle2, bg: 'bg-emerald-50' },
    { label: 'Cần theo dõi',  val: stats.warn,  border: 'border-l-amber-500',  num: 'text-amber-500',  Icon: AlertCircle, bg: 'bg-amber-50' },
    { label: 'Hỏng / Sửa',   val: stats.bad,   border: 'border-l-red-600',     num: 'text-red-600',   Icon: XCircle, bg: 'bg-red-50' },
  ]

  const hasFilter = !!(q || fLoc || fType || fStatus)

  // Reset về trang 1 khi filter thay đổi
  const handleFilterChange = (fn: () => void) => { fn(); setPage(1) }


  return (
    <div className="space-y-2">
      {/* 1. Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl border border-slate-200 border-l-4 ${s.border} p-4 shadow-sm flex items-center gap-3`}>
            <div>
              <div className={`text-3xl font-extrabold leading-none ${s.num}`}>{s.val}</div>
              <div className="text-[12px] text-slate-500 mt-1.5 font-bold uppercase tracking-widest">{s.label}</div>
            </div>
            <s.Icon size={32} className={`ml-auto opacity-20 ${s.num}`} />
          </div>
        ))}
      </div>

      {/* 2. Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Tìm kiếm..."
          value={q}
          onChange={e => { setQ(e.target.value); updateData({ page: 1, search: e.target.value }); }}
          allowClear
          className="flex-1 min-w-[200px] h-8 max-w-sm"
        />
        <Select
          placeholder="Vị trí"
          value={fLoc}
          onChange={v => { setFLoc(v); updateData({ page: 1, loc: v }); }}
          allowClear
          className="min-w-[140px] h-8"
          options={LOCATIONS.map(l => ({ value: l, label: l }))}
        />
        <Select
          placeholder="Trạng thái"
          value={fStatus}
          onChange={v => { setFStatus(v); updateData({ page: 1, status: v }); }}
          allowClear
          className="min-w-[130px] h-8"
          options={[
            { value: 'Good', label: 'Tốt' },
            { value: 'Warning', label: 'Theo dõi' },
            { value: 'Bad', label: 'Hỏng/Sửa' },
          ]}
        />
        {hasFilter && (
          <Button
            type="text"
            icon={<X size={14} />}
            onClick={() => {
              setQ(''); setFLoc(undefined); setFType(undefined); setFStatus(undefined);
              updateData({ page: 1, search: '', loc: '', type: '', status: '' });
            }}
          >
            Xóa lọc
          </Button>
        )}
        
        <div className="ml-auto flex gap-2">
          {/* {!readOnly && (
            <Button 
                type="primary" 
                icon={<PlusCircle size={14} />} 
                onClick={() => setShowNewForm(!showNewForm)}
                className="bg-[#2d5f1b]"
            >
              Thêm hồ sơ
            </Button>
          )} */}
          <Button icon={<Download size={14} />} onClick={() => exportToExcel(equipment)}>
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* 3. New Form Inline */}
      <div className="space-y-3">
        {/* THANH THÊM MỚI CỐ ĐỊNH: Luôn xuất hiện trên đầu danh sách */}
        {!readOnly && (
          <div className="mb-6"> {/* Thêm margin bottom để tách biệt với danh sách bên dưới */}
             <EquipmentRow
              key="fixed-add-new-row" // QUAN TRỌNG: Key này phải cố định
              eq={EMPTY_EQ()} 
              isNew={true}
              onSave={onSave}
              onDelete={() => {}}
            />
          </div>
        )}

        {/* DANH SÁCH HỒ SƠ */}
        {equipment.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <p className="text-sm italic">Không tìm thấy hồ sơ thiết bị nào khớp với bộ lọc</p>
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

      {/* 5. Pagination - Điều khiển trang từ Server */}
      <div className="flex justify-center pt-2">
        <Pagination
    current={currentPage}
    pageSize={pageSize}
    total={totalItems}
    
    // 1. Cho phép thay đổi số lượng bản ghi
    showSizeChanger={true} 
    pageSizeOptions={['10', '20', '50', '100']}
    
    // 2. Xử lý khi người dùng đổi trang HOẶC đổi số lượng bản ghi
    onChange={(p, ps) => {
      // p: trang mới, ps: size mới
      updateData({ page: p, pageSize: ps });
    }}
    
    // Việt hóa nhãn hiển thị
    locale={{ items_per_page: '/ trang' }}
    showTotal={(total, range) => (
      <span className="text-slate-500 italic">
        Đang hiển thị {range[0]}-{range[1]} trong tổng số {total} hồ sơ
      </span>
    )}
  />
      </div>
    </div>
  )
}