import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronRight, MapPin, PlusCircle, Hash, Calendar, Box, User, Info } from 'lucide-react'
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

export default function EquipmentRow({ 
  eq, isNew = false, onSave, onDelete, readOnly = false, defaultOpen = false 
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [localForm, setLocalForm] = useState<Equipment>({ ...eq })
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const skipDirtyCheck = useRef(false);

  const isDirty = useMemo(() => {
    if (isSaving || !open) return false;
    if (isNew && !localForm.ctrlnum && !localForm.eqtype) return false;

    const fields = [
      'appmodel', 'opcond', 'ctrlnum', 'eqtype', 'model', 'serial', 
      'location', 'eqtitle', 'mfgname', 'mfgdate', 'weight', 
      'power', 'size', 'makeraddr', 'instdate', 'person', 'value'
    ] as const;
    return fields.some(f => (localForm[f] ?? '').toString().trim() !== (eq[f] ?? '').toString().trim());
  }, [localForm, eq, isSaving, open, isNew]);

  const toggleOpen = () => {
    if (isSaving) return;
    if (open) setLocalForm({ ...eq });
    setOpen(!open);
  };

  const handleSave = async (data: Equipment) => {
    setIsSaving(true);
    try {
      await onSave(data);
      if (isNew) {
        setOpen(false);
        setTimeout(() => {
          setIsSaving(false);
          setLocalForm({ ...eq });
        }, 500);
      } else {
        setIsSaving(false);
      }
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setTimeout(async () => {
      try {
        await onDelete(id);
        setOpen(false);
      } catch (error) {
        setIsDeleting(false);
      }
    }, 300);
  };

  return (
    <div className={`transition-all duration-500 ease-in-out ${isDeleting ? 'opacity-0 -translate-x-full max-h-0' : 'opacity-100'}`}>
      <div
        className={`group relative overflow-hidden transition-all duration-500 rounded-[22px] ${
          open 
            ? 'bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] my-6 ring-2 ring-emerald-500/10' 
            : 'bg-white/70 backdrop-blur-sm border border-slate-200/60 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 my-2 active:scale-[0.99]' 
        }`}
      >
        {/* Accent Bar - Chỉ báo trạng thái tinh tế hơn */}
        {!isNew && (
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500 ${
            eq.opcond === 'Good' ? 'bg-emerald-500' : eq.opcond === 'Warning' ? 'bg-amber-400' : 'bg-rose-500'
          }`} />
        )}

        <div
          onClick={toggleOpen}
          className={`flex items-center gap-6 px-8 py-4 cursor-pointer select-none transition-colors ${
            open ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'
          }`}
        >
          {/* Icon Trạng thái đóng/mở */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
            open ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 rotate-90' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
          }`}>
            <ChevronRight size={18} strokeWidth={3} />
          </div>

          {isNew ? (
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-600 border border-emerald-500/20 shadow-inner">
                <PlusCircle size={24} />
              </div>
              <div>
                <h4 className="text-emerald-900 font-extrabold text-[16px] tracking-tight">Thêm thiết bị mới</h4>
                <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-[0.1em]">New Registry</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Info Chính */}
              <div className="md:col-span-5 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-md shadow-sm">
                    {eq.ctrlnum || 'N/A'}
                  </span>
                  <h3 className="font-bold text-[15.5px] text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                    {eq.eqtype || eq.mfgname}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
                    <Box size={12} /> {eq.model}
                  </div>
                  {eq.serial && (
                    <div className="flex items-center gap-1 text-slate-400 font-medium italic">
                      <Hash size={12} /> {eq.serial}
                    </div>
                  )}
                </div>
              </div>

              {/* Vị trí */}
              <div className="md:col-span-4 hidden sm:flex flex-col gap-1 border-l border-slate-100 pl-8">
                <div className="flex items-center gap-2">
                  <Info size={12} className="text-slate-300" />
                  <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">{eq.eqtitle || 'Unnamed Item'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 text-[12px] font-bold">
                  <div className="p-1 bg-rose-50 text-rose-500 rounded-md">
                    <MapPin size={14} />
                  </div>
                  <span className="truncate">{eq.location}</span>
                </div>
              </div>

              {/* Status & Date */}
              <div className="md:col-span-3 flex items-center justify-end gap-6">
                <div className="transform transition-transform group-hover:scale-105">
                  <StatusBadge status={eq.opcond} />
                </div>
                {eq.instdate && (
                  <div className="hidden lg:flex flex-col items-end border-l border-slate-100 pl-6">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[9px] font-black uppercase">Ngày lắp đặt</span>
                    </div>
                    <span className="text-[12px] font-mono font-bold text-slate-600 mt-0.5">
                      {eq.instdate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badge "Chưa lưu" - Floating Style */}
          {isDirty && !isNew && (
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-black shadow-xl shadow-amber-200 border-2 border-white uppercase tracking-widest animate-bounce">
              Chưa lưu thay đổi
            </div>
          )}
        </div>

        {/* Expansion Content */}
        {open && (
          <div className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="px-10 py-8">
              <EquipmentForm
                initialData={localForm}
                isNew={isNew}
                isDirty={isDirty}
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