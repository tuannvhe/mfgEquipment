import { useMemo, useState } from 'react'
import { Input, Select, Button, Pagination } from 'antd'
import { Search, X, Settings2, CheckCircle2, AlertCircle, XCircle, Download, PlusCircle } from 'lucide-react'
import type { Equipment, User } from '../types'
import { exportToExcel } from '../utils/excelExport'
import EquipmentRow from '../components/EquipmentRow'

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
  onSave: (eq: Equipment) => void
  onDelete: (id: string) => void
  user: User
}

export default function EquipmentListPage({ equipment, onSave, onDelete, user }: Props) {
  const readOnly = false
  const [q, setQ] = useState('')
  const [fLoc, setFLoc] = useState<string | undefined>()
  const [fType, setFType] = useState<string | undefined>()
  const [fStatus, setFStatus] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [showNewForm, setShowNewForm] = useState(false)
  const PAGE_SIZE = 8

  const filtered = useMemo(
    () =>
      equipment.filter(e => {
        const mq =
          !q ||
          [e.mfgname, e.eqtitle, e.model, e.serial, e.appmodel, e.ctrlnum].some(f =>
            (f || '').toLowerCase().includes(q.toLowerCase())
          )
        return (
          mq &&
          (!fLoc || e.location === fLoc) &&
          (!fType || e.eqtype === fType) &&
          (!fStatus || e.opcond === fStatus)
        )
      }),
    [equipment, q, fLoc, fType, fStatus]
  )

  const stats = {
    total: equipment.length,
    good: equipment.filter(e => e.opcond === 'Good').length,
    warn: equipment.filter(e => e.opcond === 'Warning').length,
    bad: equipment.filter(e => e.opcond === 'Bad').length,
  }

  const statCards = [
    { label: 'Tổng thiết bị', val: stats.total, border: 'border-l-[#2d5f1b]', num: 'text-[#2d5f1b]', Icon: Settings2, bg: 'bg-[#f0f4f0]' },
    { label: 'Hoạt động tốt', val: stats.good,  border: 'border-l-emerald-600', num: 'text-emerald-600', Icon: CheckCircle2, bg: 'bg-emerald-50' },
    { label: 'Cần theo dõi',  val: stats.warn,  border: 'border-l-amber-500',  num: 'text-amber-500',  Icon: AlertCircle, bg: 'bg-amber-50' },
    { label: 'Hỏng / Sửa',   val: stats.bad,   border: 'border-l-red-600',     num: 'text-red-600',   Icon: XCircle, bg: 'bg-red-50' },
  ]

  const hasFilter = !!(q || fLoc || fType || fStatus)

  // Reset về trang 1 khi filter thay đổi
  const handleFilterChange = (fn: () => void) => { fn(); setPage(1) }

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={`${s.bg} rounded-xl border border-slate-200 border-l-4 ${s.border} p-4 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.01]`}
          >
            <div>
              <div className={`text-3xl font-extrabold leading-none ${s.num}`}>{s.val}</div>
              <div className="text-[12px] text-slate-500 mt-1.5 font-bold uppercase tracking-widest">{s.label}</div>
            </div>
            <s.Icon size={32} className={`ml-auto opacity-20 ${s.num}`} />
          </div>
        ))}
      </div>

      {/* Filters + Add button */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Tên, model, S/N, số kiểm soát..."
          value={q}
          onChange={e => handleFilterChange(() => setQ(e.target.value))}
          allowClear
          size="middle"
          className="flex-1 min-w-[200px] h-8 max-w-sm"
        />
        <Select
          size="middle"
          placeholder="Tất cả vị trí"
          value={fLoc}
          onChange={v => handleFilterChange(() => setFLoc(v))}
          allowClear
          className="min-w-[140px] h-8"
          options={LOCATIONS.map(l => ({ value: l, label: l }))}
        />
        <Select
          size="middle"
          placeholder="Tất cả loại"
          value={fType}
          onChange={v => handleFilterChange(() => setFType(v))}
          allowClear
          className="min-w-[160px] h-8"
          options={EQ_TYPES.map(t => ({ value: t, label: t }))}
        />
        <Select
          size="middle"
          placeholder="Trạng thái"
          value={fStatus}
          onChange={v => handleFilterChange(() => setFStatus(v))}
          allowClear
          className="min-w-[130px] h-8"
          options={[
            { value: 'Good',    label: 'Tốt' },
            { value: 'Warning', label: 'Theo dõi' },
            { value: 'Bad',     label: 'Hỏng/Sửa' },
          ]}
        />
        {hasFilter && (
          <Button
            size="middle"
            type="text"
            icon={<X size={14} />}
            onClick={() => handleFilterChange(() => { setQ(''); setFLoc(undefined); setFType(undefined); setFStatus(undefined) })}
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
            onClick={() => exportToExcel(filtered)}
            className="border-slate-300 text-slate-600"
          >
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* New form inline */}
      {!readOnly && showNewForm && (
        <EquipmentRow
          key="__new__"
          eq={EMPTY_EQ()}
          isNew
          defaultOpen
          onSave={(eq) => { onSave(eq); setShowNewForm(false) }}
          onDelete={() => {}}
        />
      )}

      {/* Equipment list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-slate-200 text-slate-400">
            <Settings2 size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Không tìm thấy thiết bị nào</p>
          </div>
        )}

        {paginated.map(eq => (
          <EquipmentRow key={eq.id} eq={eq} onSave={onSave} onDelete={onDelete} readOnly={readOnly} />
        ))}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={setPage}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} hồ sơ`}
          />
        </div>
      )}
    </div>
  )
}