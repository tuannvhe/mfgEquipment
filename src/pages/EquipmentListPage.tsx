import { useState, useMemo } from 'react'
import { Input, Select, Button, Pagination } from 'antd'
import { Search, X, Settings2, CheckCircle2, AlertCircle, XCircle, Download, PlusCircle } from 'lucide-react'
import type { Equipment, User } from '../types'
import { exportToExcel } from '../utils/excelExport'
import EquipmentRow from '../components/EquipmentRow'
//import { PAGE_SIZE } from '../store/useStore'
const EQ_TYPES = ['Winding', 'Riveting Assembly', 'Capacitor Assembly', 'Other']
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
  totalItems: number
  currentPage: number
  pageSize: number // <--- Nhận thêm pageSize từ Props
  fetchEquipment: (page: number, q?: string, loc?: string, type?: string, status?: string, size?: number) => void
  onSave: (eq: Equipment) => Promise<{ success: boolean; data?: Equipment } | any>;
  onDelete: (id: string) => void;
  user: User

}

export default function EquipmentListPage({ 
  equipment, 
  totalItems, 
  currentPage, 
  pageSize, 

  fetchEquipment, 
  onSave, 
  onDelete,
  user 
}: Props) {
  const readOnly = false
  const [q, setQ] = useState('')
  const [fLoc, setFLoc] = useState<string | undefined>()
  const [fType, setFType] = useState<string | undefined>()
  const [fStatus, setFStatus] = useState<string | undefined>()
  const [showNewForm, setShowNewForm] = useState(false)
  

  // 1. CHỈ LỌC CLIENT cho Status, Loc, Type (vì BE hiện mới chỉ lọc theo SearchTerm)
  // Nếu BE đã nâng cấp lọc theo cả Loc/Type thì bỏ phần này và dùng trực tiếp 'equipment'


  const stats = {
    total: totalItems, // Dùng tổng từ Server để thống kê chính xác
    good: equipment.filter(e => e.opcond === 'Good').length,
    warn: equipment.filter(e => e.opcond === 'Warning').length,
    bad: equipment.filter(e => e.opcond === 'Bad').length,
  }

  const statCards = [
    { label: 'Tổng thiết bị', val: stats.total, border: 'border-l-[#2d5f1b]', num: 'text-[#2d5f1b]', Icon: Settings2, bg: 'bg-[#f0f4f0]' },
    { label: 'Hoạt động tốt', val: stats.good,  border: 'border-l-emerald-600', num: 'text-emerald-600', Icon: CheckCircle2, bg: 'bg-emerald-50' },
    { label: 'Cần theo dõi',  val: stats.warn,  border: 'border-l-amber-500',  num: 'text-amber-500',  Icon: AlertCircle, bg: 'bg-amber-50' },
    { label: 'Hỏng / Sửa',    val: stats.bad,   border: 'border-l-red-600',     num: 'text-red-600',   Icon: XCircle, bg: 'bg-red-50' },
  ]

  const hasFilter = !!(q || fLoc || fType || fStatus)

  // 2. Sửa hàm chuyển trang
const handlePageChange = (page: number, size: number) => {
    fetchEquipment(page, q, fLoc, fType, fStatus, size);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className="space-y-2">
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
      <div className="flex flex-wrap gap-2 items-center">
      <Input
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Tên, model, S/N, số kiểm soát..."
          value={q}
          onChange={e => {
            const val = e.target.value;
            setQ(val);
            // Truyền đủ các filter hiện tại: page=1, search=val, loc=fLoc, type=fType, status=fStatus
            fetchEquipment(1, val, fLoc, fType, fStatus, pageSize);
          }}
          allowClear
          className="flex-1 min-w-[200px] h-8 max-w-sm"
        />

        {/* Lọc theo Vị trí */}
        <Select
          size="middle"
          placeholder="Tất cả vị trí"
          value={fLoc}
          onChange={v => {
            setFLoc(v);
            fetchEquipment(1, q, v, fType, fStatus, pageSize);
          }}
          allowClear
          className="min-w-[140px] h-8"
          options={LOCATIONS.map(l => ({ value: l, label: l }))}
        />


        {/* Lọc theo Trạng thái */}
        <Select
          size="middle"
          placeholder="Trạng thái"
          value={fStatus}
          onChange={v => {
            setFStatus(v);
            fetchEquipment(1, q, fLoc, fType, v, pageSize);
          }}
          allowClear
          className="min-w-[130px] h-8"
          options={[
            { value: 'Good',    label: 'Tốt' },
            { value: 'Warning', label: 'Theo dõi' },
            { value: 'Bad',     label: 'Hỏng/Sửa' },
          ]}
        />

        {/* Nút Xóa lọc */}
        {hasFilter && (
          <Button
            size="middle"
            type="text"
            icon={<X size={14} />}
            onClick={() => {
              setQ(''); setFLoc(undefined); setFType(undefined); setFStatus(undefined);
              // Reset về mặc định
              fetchEquipment(1, '', undefined, undefined, undefined, pageSize);
            }}
            className="text-slate-400"
          >
            Xóa lọc
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          {!readOnly && (
            <Button
              size="middle"
              type="primary"
              icon={<PlusCircle size={14} />}
              onClick={() => setShowNewForm(v => !v)}
              style={{ background: '#2d5f1b', border: 'none' }}
            >
              Thêm hồ sơ
            </Button>
          )}
          <Button
            size="middle"
            icon={<Download size={14} />}
            onClick={() => exportToExcel(equipment)}
            className="border-slate-300 text-slate-600"
          >
            Xuất Excel
          </Button>
        </div>
      </div>

{/* KHỐI HIỂN THỊ FORM THÊM MỚI */}
{!readOnly && showNewForm && (
  <div className="mb-4">
    <EquipmentRow
      key="__new__"
      eq={EMPTY_EQ()}
      isNew
      defaultOpen
      onSave={async (eq) => {
        // Gọi hàm save từ Store
        const result = await onSave(eq); 

        // CHỈ đóng form danh sách khi thực sự thành công
        if (result && result.success === true) {
          setShowNewForm(false);
        }
        
        // CỰC KỲ QUAN TRỌNG: Phải return result để EquipmentRow nhận được success: false
        return result; 
      }}
      onDelete={() => setShowNewForm(false)}
    />
  </div>
)}

      {/* KHỐI DANH SÁCH CHÍNH */}
      <div className="min-h-[400px]"> 
        {equipment.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-slate-200 text-slate-400">
            <Settings2 size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Không tìm thấy thiết bị nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {equipment.map(eq => (
              <EquipmentRow 
                key={eq.id} 
                eq={eq} 
                onSave={onSave} 
                onDelete={onDelete} 
                readOnly={readOnly} 
              />
            ))}
          </div>
        )}
      </div>

      {/* KHỐI PHÂN TRANG - Đã tách biệt rõ ràng */}
      {totalItems > 0 && ( // Đổi điều kiện từ > PAGE_SIZE thành > 0
  <div className="flex justify-center items-center py-8 border-t border-slate-100 mt-4">
      <Pagination
        current={currentPage}
        pageSize={pageSize} // Dùng giá trị động từ store
        total={totalItems}   
        onChange={handlePageChange}
        showSizeChanger={true} // BẬT TÍNH NĂNG CHỌN SIZE
        pageSizeOptions={['8', '20', '50', '100']} // Các lựa chọn cho người dùng
        showTotal={(total, range) => (
          <span className="text-slate-500">
            Hiển thị <b>{range[0]}-{range[1]}</b> trên <b>{total}</b> thiết bị
          </span>
        )}
      />
    </div>
)}
    </div> // Đóng div chính của component
  )
}