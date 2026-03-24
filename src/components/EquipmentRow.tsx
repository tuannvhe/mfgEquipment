import { useState, useEffect, useMemo } from 'react'
import { Tag, Modal } from 'antd'
import { ChevronRight, MapPin, PlusCircle } from 'lucide-react'
import type { Equipment } from '../types'
import StatusBadge from './StatusBadge'
import EquipmentForm from './EquipmentForm'

interface Props {
  eq: Equipment
  isNew?: boolean
  onSave: (eq: Equipment) => void
  onDelete: (id: string) => void
  readOnly?: boolean
  defaultOpen?: boolean
  
}

export default function EquipmentRow({ eq, isNew = false, onSave, onDelete, readOnly = false, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [localForm, setLocalForm] = useState<Equipment>({ ...eq })

const isDirty = useMemo(() => {
  if (!open) return false;

  const checkDiff = (a: any, b: any) => {
    const fields = [
      'appmodel', 'opcond', 'ctrlnum', 'eqtype', 'model', 'serial', 
      'location', 'eqtitle', 'mfgname', 'mfgdate', 'value', 'weight', 
      'power', 'size', 'instdate', 'person'
    ];
    
    return fields.some(field => {
      // 1. Chuẩn hóa giá trị về String và loại bỏ null/undefined
      let valA = (a[field] ?? '').toString().trim();
      let valB = (b[field] ?? '').toString().trim();

      // 2. Xử lý lệch định dạng ngày (Chỉ lấy 10 ký tự đầu YYYY-MM-DD)
      const dateFields = ['instdate', 'mfgdate'];
      if (dateFields.includes(field)) {
        valA = valA.substring(0, 10);
        valB = valB.substring(0, 10);
      }

      return valA !== valB;
    });
  };

  return checkDiff(localForm, eq);
}, [localForm, eq, open]);
const toggleOpen = () => {
  if (open && isDirty) {
    Modal.confirm({
      title: 'Thay đổi chưa được lưu!',
      content: 'Bạn có chắc chắn muốn đóng không? Các thay đổi sẽ bị mất.',
      okText: 'Đóng và Bỏ qua',
      cancelText: 'Tiếp tục sửa',
      okType: 'danger',
      centered: true,
      onOk: () => {
        setLocalForm({ ...eq }); 
        setOpen(false);
      },
    });
    return;
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
  const statusColor = 
    eq.opcond === 'Good' ? 'bg-emerald-500' : 
    eq.opcond === 'Warning' ? 'bg-amber-500' : 'bg-red-500';
  // Sync when external eq changes (after save)
useEffect(() => {
  // Chỉ cập nhật localForm từ props khi:
  // 1. ID thay đổi (chuyển sang thiết bị khác)
  // 2. Hoặc khi người dùng CHƯA gõ gì (không dirty) mà props eq có thay đổi từ server
  const hasIdChanged = localForm.id !== eq.id;
  
  if (hasIdChanged || !isDirty) {
    setLocalForm({ ...eq });
  }
}, [eq, isDirty]); // Thêm isDirty vào dependency

 const handleSave = async (data: Equipment) => {
  try {
    await onSave(data);
    
    setLocalForm({ ...data }); 

    if (isNew) {
      //setOpen(false); //<-- Bỏ dòng này nếu bạn muốn form vẫn mở sau khi bấm lưu
      // Hoặc reset form về trắng để nhập tiếp bản ghi khác
      setLocalForm(EMPTY_EQ());
    }
  } catch (error) {
    console.error("Lưu thất bại:", error);
  }
};
  const handleDelete = (id: string) => {
    onDelete(id)
    setOpen(false)
  }

return (
    <div
      className={`group relative rounded-2xl overflow-hidden bg-white transition-all duration-300 ${
        open 
          ? 'shadow-2xl ring-1 ring-slate-200 my-4' 
          : 'shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md'
      }`}
    >
      {/* 1. Dải màu trạng thái bên mép trái (Chỉ hiện khi không phải hàng thêm mới) */}
      {!isNew && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor} opacity-70`} />
      )}

      {/* ── Clickable header row ── */}
      <div
        onClick={toggleOpen}
        className={`flex items-center gap-4 px-6 py-4 cursor-pointer select-none transition-all ${
          open ? 'bg-slate-50/80 border-b border-slate-100' : 'hover:bg-blue-50/30'
        }`}
      >
        {/* Chevron với hiệu ứng xoay mượt và màu sắc nhấn */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${open ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover:bg-white'}`}>
          <ChevronRight size={18} className={`transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
        </div>

        {isNew ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <PlusCircle size={20} />
            </div>
            <span className="text-green-700 font-bold text-[16px] tracking-tight">
              Thêm hồ sơ thiết bị mới
            </span>
          </div>
        ) : (
          <>
            {/* 2. Cải tiến Typography & Layout */}
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Cột 1: Thông tin chính (Mã/Tên) */}
              <div className="md:col-span-5">
                <div className="flex items-center gap-2">
                   <span className="text-[11px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                    {eq.ctrlnum || 'No ID'}
                  </span>
                  -
                  <div className="font-bold text-[15px] text-green-800 truncate">
                    {eq.eqtype || eq.mfgname || 'Thiết bị không tên'}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[13px] text-slate-400 font-medium">{eq.model}</span>
                   {eq.serial && (
                     <>
                      <span className="text-slate-300">•</span>
                      <span className="text-[12px] text-slate-400 font-mono italic">SN: {eq.serial}</span>
                     </>
                   )}
                </div>
              </div>

              {/* Cột 2: Vị trí & Title */}
              <div className="md:col-span-4 hidden sm:flex flex-wrap gap-2 items-center">
                <Tag className="rounded-md border-none bg-blue-50 text-green-600 font-bold px-2 py-0.5 text-[11px]">
                  {eq.eqtitle}
                </Tag>
                <div className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium">
                  <MapPin size={13} className="text-slate-300" />
                  {eq.location}
                </div>
              </div>

              {/* Cột 3: Trạng thái & Ngày */}
              <div className="md:col-span-3 flex items-center justify-end gap-4">
                <StatusBadge status={eq.opcond} />
                {eq.instdate && (
                  <div className="hidden lg:flex flex-col items-end border-l border-slate-100 pl-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Ngày lắp</span>
                    <span className="text-[12px] font-mono font-bold text-slate-600 mt-1">{eq.instdate}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {isDirty && !isNew && (
          <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold animate-pulse">
            ĐANG CHỈNH SỬA
          </span>
        )}
      </div>

      {open && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <EquipmentForm
          initialData={localForm}
          isNew={isNew}
          onSave={handleSave}
          onDelete={handleDelete} // <--- THÊM DÒNG NÀY VÀO
          onCancel={toggleOpen}
          onChange={(newData) => setLocalForm(newData)}
          readOnly={readOnly}
        />
        </div>
      )}
    </div>
  )
}