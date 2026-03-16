import { useState } from 'react'
import {
  Button, Space, Tooltip, DatePicker
} from 'antd'
import { Save, Trash2, Plus, X, Upload, Eraser, Printer } from 'lucide-react'
import type { Equipment } from '../types'
import { uid } from '../store/useStore'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import dayjs from 'dayjs'

const EQ_TYPES = ['Winding', 'Riveting Assembly', 'Capacitor Assembly', 'Other']
const LOCATIONS = ['Bắc Giang #1', 'Bắc Giang #2', 'Bắc Ninh', 'Hà Nam', 'Hưng Yên']

interface Props {
  initialData: Equipment
  isNew: boolean
  onSave: (eq: Equipment) => void
  onDelete: (id: string) => void
  onCancel: () => void
}

const TdLabel = ({ children, colSpan = 1, className = '' }: any) => (
  <td colSpan={colSpan} className={`bg-[#e5edd9] border border-black text-[#1a3811] text-[9.5px] sm:text-[10px] font-bold text-center align-middle py-1.5 px-1 uppercase leading-tight ${className}`}>
    {children}
  </td>
);

const TdValue = ({ children, colSpan = 1, className = '' }: any) => (
  <td colSpan={colSpan} className={`border border-black bg-white p-0 align-middle ${className}`}>
    {children}
  </td>
);

const ExcelInput = ({ value, onChange, placeholder, className = '' }: any) => (
  <input 
    value={value || ''} 
    onChange={e => onChange(e.target.value)} 
    placeholder={placeholder} 
    className={`w-full h-full min-h-[34px] px-2 py-1 text-center text-[12.5px] bg-transparent border-none outline-none focus:bg-[#f6fbf0] font-semibold text-slate-800 ${className}`} 
  />
);

const ExcelSelect = ({ value, onChange, options, className = '' }: any) => (
  <select 
    value={value || ''} 
    onChange={e => onChange(e.target.value)} 
    className={`w-full h-full min-h-[34px] px-1 py-1 text-center text-[12.5px] bg-transparent border-none outline-none focus:bg-[#f6fbf0] font-semibold text-slate-800 ${className}`}
  >
    <option value="" disabled>-- Chọn --</option>
    {options.map((o: any) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);

const ExcelDatePicker = ({ value, onChange, className = '' }: any) => (
  <DatePicker 
    value={value ? dayjs(value) : null}
    onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
    format="YYYY-MM-DD"
    variant="borderless"
    allowClear={false}
    placeholder="Chọn ngày"
    className={`w-full h-full max-h-[30px] text-center font-semibold text-slate-800 date-picker-excel ${className}`}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  />
);

export default function EquipmentForm({ initialData, isNew, onSave, onDelete, onCancel }: Props) {
  const [form, setForm] = useState<Equipment>({ ...initialData })
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ho_so_thiet_bi_${form.ctrlnum || form.id}`,
  })
  
  // Track extra rows manually to allow user to add more rows via button
  const [extraP, setExtraP] = useState(0)
  const [extraS, setExtraS] = useState(0)
  const [extraBot, setExtraBot] = useState(0)

  const set = <K extends keyof Equipment>(key: K, val: Equipment[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.eqtitle && !form.model && !form.appmodel) {
      alert('Vui lòng điền ít nhất Tên thiết bị hoặc Model!')
      return
    }
    
    // Clean empty arrays
    const cleanForm = { ...form };
    cleanForm.inspections = (cleanForm.inspections || []).filter(i => i.date || i.detail || i.failure || i.remarks || i.replacement || i.inspector);
    cleanForm.periodicItems = (cleanForm.periodicItems || []).filter(i => i.interval || i.item || i.inspdate || i.content);
    cleanForm.spareParts = (cleanForm.spareParts || []).filter(i => i.name || i.partnum || i.qty || i.spec);
    
    onSave(cleanForm)
    if (isNew) setForm({ ...initialData })
  }

  // Periodic Item Helpers
  const emptyPItem = () => ({ id: `p_${uid()}`, interval: '', item: '', inspdate: '', content: '' })
  const getPItem = (i: number) => form.periodicItems?.[i] || emptyPItem()
  const setPItem = (i: number, key: string, val: string) => {
    const arr = [...(form.periodicItems || [])]
    while (arr.length <= i) arr.push(emptyPItem())
    arr[i] = { ...arr[i], [key]: val }
    set('periodicItems', arr)
  }

  // Spare Part Helpers
  const getSPart = (i: number) => form.spareParts?.[i] || { id: `s_${uid()}`, name: '', partnum: '', spec: '', qty: '' }
  const setSPart = (i: number, key: string, val: string) => {
    const arr = [...(form.spareParts || [])]
    while (arr.length <= i) arr.push({ id: `s_${uid()}`, name: '', partnum: '', spec: '', qty: '' })
    arr[i] = { ...arr[i], [key]: val }
    set('spareParts', arr)
  }

  // Inspection Helpers
  const getInsp = (i: number) => form.inspections?.[i] || { id: `i_${uid()}`, date: '', detail: '', failure: '', replacement: '', inspector: '', remarks: '' }
  const setInsp = (i: number, key: string, val: string) => {
    const arr = [...(form.inspections || [])]
    while (arr.length <= i) arr.push({ id: `i_${uid()}`, date: '', detail: '', failure: '', replacement: '', inspector: '', remarks: '' })
    arr[i] = { ...arr[i], [key]: val }
    set('inspections', arr)
  }

  // Image Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo1' | 'photo2') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      set(field, ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Row Management Helpers
  const pRowCount = Math.max(4 + extraP, form.periodicItems?.length || 0)
  const sRowCount = Math.max(4 + extraS, form.spareParts?.length || 0)
  const botRowCount = Math.max(4 + extraBot, form.inspections?.length || 0)

  const clearPRow = (i: number) => {
    const newP = [...(form.periodicItems || [])]
    if (newP[i]) newP[i] = { id: newP[i].id, interval: '', item: '', inspdate: '', content: '' }
    set('periodicItems', newP)
  }
  const deletePRow = (i: number) => {
    if (pRowCount <= 4) return
    const newP = [...(form.periodicItems || [])]
    if (newP.length > i) newP.splice(i, 1)
    set('periodicItems', newP)
    if (extraP > 0) setExtraP(p => p - 1)
  }

  const clearSRow = (i: number) => {
    const newS = [...(form.spareParts || [])]
    if (newS[i]) newS[i] = { id: newS[i].id, name: '', partnum: '', spec: '', qty: '' }
    set('spareParts', newS)
  }
  const deleteSRow = (i: number) => {
    if (sRowCount <= 4) return
    const newS = [...(form.spareParts || [])]
    if (newS.length > i) newS.splice(i, 1)
    set('spareParts', newS)
    if (extraS > 0) setExtraS(s => s - 1)
  }

  const clearBotRow = (i: number) => {
    const newI = [...(form.inspections || [])]
    if (newI[i]) newI[i] = { id: newI[i].id, date: '', detail: '', failure: '', replacement: '', inspector: '', remarks: '' }
    set('inspections', newI)
  }

  const deleteBotLRow = (i: number) => {
    if (botRowCount <= 4) return
    const newI = [...(form.inspections || [])]
    if (newI.length > i) newI.splice(i, 1)
    set('inspections', newI)
    if (extraBot > 0) setExtraBot(b => b - 1)
  }

  return (
    <div className="border-t border-slate-100 eq-row-expand bg-[#fdfdfd]">
      {/* Action bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <span className="text-[14px] text-[#2d5f1b] font-bold tracking-tight">
          {isNew ? 'TẠO MỚI HỒ SƠ THIẾT BỊ (MFG. EQUIPMENT RECORD)' : 'CHỈNH SỬA HỒ SƠ THIẾT BỊ'}
        </span>
        <Space size="middle">
          {!isNew && (
            <Button
              size="small"
              danger
              variant="outlined"
              icon={<Trash2 size={14} />}
              onClick={() => {
                if (confirm('Xóa thiết bị này khỏi hệ thống?')) onDelete(form.id)
              }}
              style={{ fontSize: 13 }}
              className='rounded-lg shadow-sm hover:shadow-md'
            >
              Xóa hồ sơ
            </Button>
          )}
          {isNew ? (
            <Button size="small" onClick={onCancel} style={{ fontSize: 13 }} className='rounded-lg hover:bg-slate-50'>Hủy bỏ</Button>
          ) : null}
          {!isNew && (
            <Button
              size="small"
              icon={<Printer size={14} />}
              onClick={() => handlePrint()}
              className='rounded-lg shadow-sm border-amber-500 text-amber-600 hover:!border-amber-600 hover:!text-amber-700'
              style={{ fontSize: 13 }}
            >
              In Hồ Sơ (A4)
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            icon={<Save size={14} />}
            onClick={handleSave}
            style={{ background: '#2d5f1b', border: 'none', boxShadow: '0 4px 12px rgba(45, 95, 27, 0.2)', fontSize: 13 }}
            className='rounded-lg'
          >
            {isNew ? 'Lưu hồ sơ mới' : 'Lưu thay đổi'}
          </Button>
        </Space>
      </div>

      <div className="flex justify-center fade-in">
        <div ref={printRef} className="w-full max-w-[1200px] overflow-x-auto bg-white shadow-xl shadow-slate-200 border border-slate-300 printable-area">
          
          <table className="w-full table-fixed border-collapse border-[2.5px] border-black text-black">
            <colgroup>
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <tbody>
              {/* === MAIN HEADER === */}
              <tr>
                <td colSpan={2} className="border-b-[2.5px] border-r border-black p-3 align-middle text-left">
                  <img src="./images/logoB.png" alt="VINATech" className="h-[50px] mx-auto opacity-90 object-contain justify-center" />
                </td>
                <td colSpan={4} className="border-b-[2.5px] border-r border-black p-3 align-middle text-center">
                  <div className="text-[22px] font-black tracking-tighter leading-none text-slate-800">MFG. EQUIPMENT RECORD</div>
                  <div className="text-[14px] font-bold text-slate-600 mt-1 uppercase tracking-widest">Hồ Sơ Thiết Bị Sản Xuất</div>
                </td>
                <td colSpan={2} className="border-b-[2.5px] border-black p-0 align-top">
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border-b border-r border-black text-[9px] font-bold text-center h-[26px] bg-[#e5edd9] uppercase leading-tight">Prepared<br/>Lập</td>
                        <td className="border-b border-r border-black text-[9px] font-bold text-center h-[26px] bg-[#e5edd9] uppercase leading-tight">Reviewed<br/>Kiểm tra</td>
                        <td className="border-b border-black text-[9px] font-bold text-center bg-[#e5edd9] uppercase leading-tight">Approved<br/>Phê duyệt</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black h-12 bg-white"></td>
                        <td className="border-r border-black h-12 bg-white"></td>
                        <td className="h-10 bg-white"></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* === ROW 1: HEADERS === */}
              <tr>
                <TdLabel colSpan={4} className="text-[13px] bg-[#c3d5b5]">VINATech VINA</TdLabel>
                <TdLabel colSpan={4} className="text-[13px] bg-[#c3d5b5]">MANUFACTURER / NhÀ SẢN XUẤT</TdLabel>
              </tr>

              {/* === ROW 2 === */}
              <tr>
                <TdLabel>Applied Model Name<br/>Tên mô hình áp dụng</TdLabel>
                <TdValue colSpan={3}><ExcelInput value={form.appmodel} onChange={(v: string) => set('appmodel', v)} placeholder="Ví dụ: 3510S" /></TdValue>
                <TdLabel>Manufacturer Name<br/>Tên nhà sản xuất</TdLabel>
                <TdValue colSpan={3}><ExcelInput value={form.mfgname} onChange={(v: string) => set('mfgname', v)} placeholder="Ví dụ: CHINA" /></TdValue>
              </tr>

              {/* === ROW 3 === */}
              <tr>
                <TdLabel>Operating Conditions<br/>Điều kiện vận hành</TdLabel>
                <TdValue colSpan={3}>
                  <ExcelSelect 
                    value={form.opcond} onChange={(v: any) => set('opcond', v)} 
                    options={[{value: 'Good', label: 'Good - Tốt'}, {value: 'Warning', label: 'Warning - Theo dõi'}, {value: 'Bad', label: 'Bad - Lỗi/Hỏng'}]} 
                  />
                </TdValue>
                <TdLabel>Equipment Title<br/>Tên gọi thiết bị</TdLabel>
                <TdValue colSpan={3}><ExcelInput value={form.eqtitle} onChange={(v: string) => set('eqtitle', v)} placeholder="Ví dụ: Capacitor Secondary..." /></TdValue>
              </tr>

              {/* === ROW 4 === */}
              <tr>
                <TdLabel>Control Number<br/>Số kiểm soát</TdLabel>
                <TdValue><ExcelInput value={form.ctrlnum} onChange={(v: string) => set('ctrlnum', v)} /></TdValue>
                <TdLabel>Date of Installation<br/>Ngày lắp đặt</TdLabel>
                <TdValue><ExcelDatePicker value={form.instdate} onChange={(v: string) => set('instdate', v)} /></TdValue>
                <TdLabel>Model<br/>Tên mẫu</TdLabel>
                <TdValue><ExcelInput value={form.model} onChange={(v: string) => set('model', v)} className="font-mono text-blue-800" /></TdValue>
                <TdLabel>Weight<br/>Trọng lượng</TdLabel>
                <TdValue><ExcelInput value={form.weight} onChange={(v: string) => set('weight', v)} /></TdValue>
              </tr>

              {/* === ROW 5 === */}
              <tr>
                <TdLabel>Equipment Type<br/>Phân loại thiết bị</TdLabel>
                <TdValue><ExcelSelect value={form.eqtype} onChange={(v: string) => set('eqtype', v)} options={EQ_TYPES} /></TdValue>
                <TdLabel>Installation Location<br/>Địa điểm lắp đặt</TdLabel>
                <TdValue><ExcelSelect value={form.location} onChange={(v: string) => set('location', v)} options={LOCATIONS} /></TdValue>
                <TdLabel>Serial No<br/>Số Seri</TdLabel>
                <TdValue><ExcelInput value={form.serial} onChange={(v: string) => set('serial', v)} className="font-mono text-blue-800" /></TdValue>
                <TdLabel>Power<br/>Nguồn điện</TdLabel>
                <TdValue><ExcelInput value={form.power} onChange={(v: string) => set('power', v)} className="font-mono" /></TdValue>
              </tr>

              {/* === ROW 6 === */}
              <tr>
                <TdLabel>Equipment Price<br/>Giá thiết bị</TdLabel>
                <TdValue><ExcelInput value={form.value} onChange={(v: string) => set('value', v)} /></TdValue>
                <TdLabel>Responsible Person<br/>Người phụ trách</TdLabel>
                <TdValue><ExcelInput value={form.person} onChange={(v: string) => set('person', v)} /></TdValue>
                <TdLabel>Date of Manufacture<br/>Ngày sản xuất</TdLabel>
                <TdValue><ExcelDatePicker value={form.mfgdate} onChange={(v: string) => set('mfgdate', v)} /></TdValue>
                <TdLabel>Size<br/>Kích thước</TdLabel>
                <TdValue><ExcelInput value={form.size} onChange={(v: string) => set('size', v)} className="font-mono" /></TdValue>
              </tr>

              {/* === ROW 7 === */}
              <tr>
                <TdValue colSpan={4} className="bg-[#f0f4eb] p-0 relative group/photo hover:bg-[#e6ebdf] transition-colors cursor-pointer border-black">
                  <label className="flex flex-col h-full min-h-[140px] w-full items-center justify-center cursor-pointer m-0">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photo1')} />
                    {form.photo1 ? (
                      <div className="relative h-full w-full flex items-center justify-center bg-white">
                        <img src={form.photo1} alt="Machine Photo 1" className="max-h-[136px] max-w-full object-contain z-10 p-1" />
                        <button onClick={(e) => { e.preventDefault(); set('photo1', ''); }} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded flex items-center justify-center p-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20 shadow-sm" title="Xóa ảnh này"><Trash2 size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center opacity-50 group-hover/photo:opacity-100 transition-opacity text-center px-4">
                        <Upload size={24} className="mb-2 text-[#2d5f1b]" />
                        <span className="text-[11px] font-bold text-[#2d5f1b] uppercase tracking-widest text-center px-4">Tải lên<br/>(Machine Photo)</span>
                      </div>
                    )}
                  </label>
                </TdValue>
                <TdValue colSpan={4} className="bg-[#f0f4eb] border-l-0 p-0 relative group/photo hover:bg-[#e6ebdf] transition-colors cursor-pointer border-black">
                  <label className="flex flex-col h-full min-h-[140px] w-full items-center justify-center cursor-pointer m-0">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photo2')} />
                    {form.photo2 ? (
                      <div className="relative h-full w-full flex items-center justify-center bg-white">
                        <img src={form.photo2} alt="Machine Label Photo" className="max-h-[136px] max-w-full object-contain z-10 p-1" />
                        <button onClick={(e) => { e.preventDefault(); set('photo2', ''); }} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded flex items-center justify-center p-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20 shadow-sm" title="Xóa ảnh này"><Trash2 size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center opacity-50 group-hover/photo:opacity-100 transition-opacity text-center px-4">
                        <Upload size={24} className="mb-2 text-[#2d5f1b]" />
                        <span className="text-[11px] font-bold text-[#2d5f1b] uppercase tracking-widest text-center px-4">Tải Tem máy lên<br/>(Nameplate Photo)</span>
                      </div>
                    )}
                  </label>
                </TdValue>
              </tr>

              {/* === ALL SECTIONS MERGED: LEFT (Periodic + Inspection) | RIGHT (Spare Parts + Repair) === */}
              <tr>
                <td colSpan={8} className="p-0 border-t-[2.5px] border-black">
                  <div className="flex w-full">
                    {/* ===== LEFT COLUMN: Periodic Items + Inspection History ===== */}
                    <div className="flex-1 border-r-[2px] border-black">
                      <table className="w-full table-fixed border-collapse">
                        <colgroup>
                          <col style={{ width: '35%' }} />
                          <col style={{ width: '65%' }} />
                        </colgroup>
                        <tbody>
                          {/* --- Periodic Inspection Items --- */}
                          <tr>
                            <td colSpan={2} className="bg-[#c3d5b5] border-b border-black text-[11px] font-black text-center text-[#1a3811] uppercase py-2 tracking-wide">
                              PERIODIC INSPECTION ITEMS / CÁC HẠNG MỤC KT ĐỊNH KỲ
                            </td>
                          </tr>
                          <tr>
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Inspection Interval<br/>Chu kỳ KT</td>
                            <td className="bg-[#e5edd9] border-b border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Periodic Inspection Items<br/>Các hạng mục KT định kỳ</td>
                          </tr>
                          {Array.from({ length: pRowCount }).map((_, i) => {
                            const p = getPItem(i);
                            return (
                              <tr key={`p_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={p.interval} onChange={(v: string) => setPItem(i, 'interval', v)} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={p.content} onChange={(v: string) => setPItem(i, 'content', v)} className="text-left" />
                                  <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                    <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearPRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                    {pRowCount > 4 && <Tooltip title="Xóa hàng này"><button onClick={() => deletePRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}


                          {/* --- Inspection History --- */}
                          <tr>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Date of Insp.<br/>Ngày KT/SC</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Inspection Details<br/>Nội dung kiểm tra / sự cố</td>
                          </tr>
                          {Array.from({ length: botRowCount }).map((_, i) => {
                            const r = getInsp(i);
                            return (
                              <tr key={`botL_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelDatePicker value={r.date} onChange={(v: string) => setInsp(i, 'date', v)} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={r.detail} onChange={(v: string) => setInsp(i, 'detail', v)} className="text-left" />
                                  <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                    <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearBotRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                    {botRowCount > 4 && <Tooltip title="Xóa hàng này"><button onClick={() => deleteBotLRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          <tr className="no-print">
                            <td colSpan={2} className="p-0 border-t border-black">
                              <button
                                onClick={() => { setExtraP(v => v + 1); setExtraBot(v => v + 1) }}
                                className="w-full h-7 bg-slate-50 hover:bg-[#eef4ea] flex items-center justify-center text-[11px] font-bold text-slate-400 hover:text-[#2d5f1b] transition-colors"
                              >
                                <Plus size={12} className="mr-1" /> Thêm dòng
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* ===== RIGHT COLUMN: Spare Parts + Failure/Repair ===== */}
                    <div className="flex-1">
                      <table className="w-full table-fixed border-collapse">
                        <colgroup>
                          <col style={{ width: '28%' }} />
                          <col style={{ width: '24%' }} />
                          <col style={{ width: '24%' }} />
                          <col style={{ width: '24%' }} />
                        </colgroup>
                        <tbody>
                          {/* --- Spare Parts --- */}
                          <tr>
                            <td colSpan={4} className="bg-[#c3d5b5] border-b border-black text-[11px] font-black text-center text-[#1a3811] uppercase py-2 tracking-wide">
                              SPARE PARTS / PHỤ TÙNG DỰ PHÒNG
                            </td>
                          </tr>
                          <tr>
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Part Name<br/>Tên linh kiện</td>
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Part Number<br/>Số hiệu LK</td>
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Specification<br/>Quy cách</td>
                            <td className="bg-[#e5edd9] border-b border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Quantity<br/>Số Lượng</td>
                          </tr>
                          {Array.from({ length: sRowCount }).map((_, i) => {
                            const s = getSPart(i);
                            return (
                              <tr key={`s_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={s.name} onChange={(v: string) => setSPart(i, 'name', v)} />
                                </td>
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={s.partnum} onChange={(v: string) => setSPart(i, 'partnum', v)} className="font-mono text-blue-800" />
                                </td>
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={s.spec} onChange={(v: string) => setSPart(i, 'spec', v)} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={s.qty} onChange={(v: string) => setSPart(i, 'qty', v)} type="number" />
                                  <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                    <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearSRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                    {sRowCount > 4 && <Tooltip title="Xóa hàng này"><button onClick={() => deleteSRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}


                          {/* --- Failure / Repair History --- */}
                          <tr>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Failure History<br/>Số Lượt Hỏng</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Replacement Parts<br/>Linh kiện thay thế</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Inspector<br/>Người KT</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Remarks<br/>Ghi chú</td>
                          </tr>
                          {Array.from({ length: botRowCount }).map((_, i) => {
                            const r = getInsp(i);
                            return (
                              <tr key={`botR_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0  align-middle">
                                  <ExcelInput value={r.failure} onChange={(v: string) => setInsp(i, 'failure', v)} />
                                </td>
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={r.replacement} onChange={(v: string) => setInsp(i, 'replacement', v)} />
                                </td>
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={r.inspector} onChange={(v: string) => setInsp(i, 'inspector', v)} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={r.remarks} onChange={(v: string) => setInsp(i, 'remarks', v)} />
                                  <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                    <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearBotRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                    {botRowCount > 4 && <Tooltip title="Xóa hàng này"><button onClick={() => deleteBotLRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          <tr className="no-print">
                            <td colSpan={4} className="p-0 border-t border-black">
                              <button
                                onClick={() => { setExtraS(v => v + 1); setExtraBot(v => v + 1) }}
                                className="w-full h-7 bg-slate-50 hover:bg-[#eef4ea] flex items-center justify-center text-[11px] font-bold text-slate-400 hover:text-[#2d5f1b] transition-colors"
                              >
                                <Plus size={12} className="mr-1" /> Thêm dòng
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                  </div>
                </td>
              </tr>

            </tbody>
          </table>

        </div>
      </div>
    </div>
  )
}
