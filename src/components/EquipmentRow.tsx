import { useState, useEffect, useMemo, useRef } from 'react'
import { Tag, Modal } from 'antd'
import { ChevronRight, MapPin, PlusCircle } from 'lucide-react'
import type { Equipment } from '../types'
import StatusBadge from './StatusBadge'
import EquipmentForm from './EquipmentForm'

interface Props {
  eq: Equipment
  isNew?: boolean
  onSave: (eq: Equipment) => Promise<Equipment | void>;
  onDelete: (id: string) => void
  readOnly?: boolean
  defaultOpen?: boolean
  
}

export default function EquipmentRow({ eq, isNew = false, onSave, onDelete, readOnly = false, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [localForm, setLocalForm] = useState<Equipment>({ ...eq })
  const [isSaving, setIsSaving] = useState(false);
  const skipDirtyCheck = useRef(false);
// 1. Tối giản isDirty: Chỉ dùng để hiện Badge "Đang chỉnh sửa" cho vui, không dùng để chặn đóng nữa
  const isDirty = useMemo(() => {
    if (isSaving || !open) return false;
    if (isNew && !localForm.ctrlnum && !localForm.eqtype) return false;

    const fields = ['appmodel', 'opcond', 'ctrlnum', 'eqtype', 'model', 'serial', 'location', 'eqtitle', 'mfgname'] as const;
    return fields.some(f => (localForm[f] ?? '').toString().trim() !== (eq[f] ?? '').toString().trim());
  }, [localForm, eq, isSaving, open]);

  // 2. toggleOpen cực kỳ đơn giản: Bấm là đóng/mở, không hỏi Modal
  const toggleOpen = () => {
    if (isSaving) return; // Đang lưu thì đợi tí
    
    if (open) {
      // Khi đóng lại, reset form về dữ liệu gốc từ props
      setLocalForm({ ...eq });
    }
    setOpen(!open);
  };

  const EMPTY_EQ = (): Equipment => ({
    id: '', appmodel: '', opcond: 'Good', ctrlnum: '', eqtype: '',
    location: 'Bắc Giang #1', person: '', instdate: '', value: '',
    mfgname: '', eqtitle: '', model: '', serial: '', mfgdate: '',
    weight: '', power: '', size: '', makeraddr: '',
    periodicItems: [], inspections: [], spareParts: [],
  })

  // 3. Đồng bộ hóa dữ liệu khi props eq thay đổi (ví dụ khi load danh sách mới)
  useEffect(() => {
    if (!open) {
      setLocalForm({ ...eq });
    }
  }, [eq, open]);

  const handleSave = async (data: Equipment) => {
    setIsSaving(true);
    skipDirtyCheck.current = true;
    try {
      await onSave(data);
      if (isNew) {
        setOpen(false);
        setTimeout(() => {
          setIsSaving(false);
          setLocalForm(EMPTY_EQ());
          skipDirtyCheck.current = false;
        }, 500);
      } else {
        setIsSaving(false);
        skipDirtyCheck.current = false;
      }
    } catch (error) {
      setIsSaving(false);
      skipDirtyCheck.current = false;
    }
  };

const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async (id: string) => {

  setTimeout(async () => {
    try {
      await onDelete(id);
      setOpen(false);
    } catch (error) {

    }
  }, 300);
};

  return (
    // Bọc hiệu ứng xóa
    <div className={`transition-all duration-300 ${isDeleting ? 'opacity-0 scale-95 max-h-0 overflow-hidden' : 'opacity-100'}`}>
      <div
        className={`group relative rounded-[16px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          open 
            ? 'bg-white shadow-[0_20px_40px_-12px_rgba(5,150,105,0.12)] my-4 z-10 scale-[1.002] ring-1 ring-emerald-100' 
            // GIẢM my-3 xuống my-1 để các hàng sát nhau hơn
            : 'bg-white/80 backdrop-blur-md border border-slate-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 my-1' 
        }`}
      >
        {!isNew && (
          <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-700 ${
            eq.opcond === 'Good' ? 'bg-emerald-500' : 
            eq.opcond === 'Warning' ? 'bg-amber-500' : 
            'bg-rose-500'
          }`} />
        )}

        <div
          onClick={toggleOpen}
          // GIẢM py-3.5 xuống py-2 để chiều cao mỗi dòng ngắn lại
          className={`flex items-center gap-3 px-6 py-2 cursor-pointer select-none rounded-[16px] transition-all ${
            open ? 'bg-emerald-50/30' : 'hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent'
          }`}
        >
          {/* GIẢM kích thước icon chevron từ w-11 h-11 xuống w-9 h-9 */}
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-500 shadow-sm ${
            open 
              ? 'bg-emerald-600 text-white rotate-90' 
              : 'bg-white text-slate-400 group-hover:bg-emerald-500 group-hover:text-white'
          }`}>
            <ChevronRight size={18} strokeWidth={3} />
          </div>

          {isNew ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 animate-pulse border border-emerald-100">
                <PlusCircle size={22} />
              </div>
              <div>
                <span className="text-emerald-800 font-black text-base tracking-tight block">Tạo hồ sơ thiết bị</span>
                <span className="text-emerald-600/50 text-[9px] font-black uppercase tracking-widest">New Registry</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Cột chính: Thu gọn spacing */}
              <div className="md:col-span-5 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black bg-emerald-900 text-emerald-50 px-1.5 py-0.5 rounded tracking-wider border border-emerald-800">
                    {eq.ctrlnum || 'PENDING'}
                  </span>
                  <h3 className="font-bold text-[14px] text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                    {eq.eqtype || eq.mfgname || 'Unnamed Unit'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-700/70 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50 uppercase">
                    {eq.model}
                  </span>
                  {eq.serial && (
                    <span className="text-[10px] font-medium text-slate-400 italic">
                      SN: {eq.serial}
                    </span>
                  )}
                </div>
              </div>

              {/* Cột vị trí: GIẢM pl-6 xuống pl-4 */}
              <div className="md:col-span-4 hidden sm:flex flex-col gap-0.5 border-l border-emerald-50 pl-4">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{eq.eqtitle || 'No Title'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[13px] font-semibold">
                  <MapPin size={13} className="text-emerald-500" />
                  <span className="truncate">{eq.location}</span>
                </div>
              </div>

              {/* Cột trạng thái */}
              <div className="md:col-span-3 flex items-center justify-end gap-4">
                <div className="scale-90 origin-right">
                   <StatusBadge status={eq.opcond} />
                </div>
                {eq.instdate && (
                  <div className="hidden lg:flex flex-col items-end border-l border-emerald-100/50 pl-4">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50/50 px-1.5 rounded">
                      {eq.instdate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isDirty && !isNew && (
            <div className="absolute -top-2 right-6 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black shadow-lg animate-bounce border border-white">
              Đang chỉnh sửa
            </div>
          )}
        </div>

        {open && (
          <div className="origin-top animate-in fade-in zoom-in-95 duration-400 border-t border-emerald-50">
            <div className="p-3 bg-gradient-to-b from-emerald-50/10 to-white rounded-b-[16px]">
                <EquipmentForm
                  initialData={localForm}
                  isNew={isNew}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onCancel={toggleOpen}
                  onChange={(newData) => setLocalForm(newData)}
                  readOnly={readOnly}
                />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
