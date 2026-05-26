import { useState, useEffect, useCallback } from 'react'
import {
  Button, Space, Tooltip, DatePicker, Image, notification,
  Select,
  Spin
} from 'antd'
import { Save, Trash2, Plus, X, Upload, Eraser, Printer, SearchIcon } from 'lucide-react'
import type { Equipment } from '../types'
import { uid } from '../store/useStore'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import dayjs from 'dayjs'
import api from '../utils/api'

const LOCATIONS = ['Bắc Giang #1', 'Bắc Giang #2', 'Bắc Ninh', 'Hà Nam', 'Hưng Yên']
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from 'antd'; // Đã có Button, Space... ở trên
import { QrCode, Download } from 'lucide-react';
import SparePartModal from '../components/SparePartModal';

interface Props {
  initialData: Equipment
  isNew: boolean
  onSave: (eq: Equipment) => Promise<any>
  onDelete: (id: string) => void
  onCancel: () => void
  readOnly?: boolean
  onChange?: (newData: Equipment) => void;
  isDirty: boolean;
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
    readOnly={className.includes('read-only')}
    disabled={className.includes('read-only')}
    className={`w-full h-full min-h-[34px] px-2 py-1 text-center text-[12.5px] bg-transparent border-none outline-none focus:bg-[#f6fbf0] font-semibold text-slate-800 ${className}`} 
  />
);

const ExcelSelect = ({ value, onChange, options, className = '' }: any) => (
  <select 
    value={value || ''} 
    onChange={e => onChange(e.target.value)} 
    disabled={className.includes('read-only')}
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
    disabled={className.includes('read-only')}
    className={`w-full h-full max-h-[30px] text-center font-semibold text-slate-800 date-picker-excel ${className}`}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  />
);

export default function EquipmentForm({ initialData, isNew, onSave, onDelete, onCancel, onChange, readOnly = false }: Props) {
  const inputClass = readOnly ? 'read-only cursor-default' : ''
  const [form, setForm] = useState<Equipment>({ ...initialData })
  const printRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const qrPrintRef = useRef<HTMLDivElement>(null);
  const MOCK_PARTS = [
  { label: 'Sensor E3Z-D61 (Omron)', value: 'Sensor E3Z-D61' },
  { label: 'Relay MY4N-GS (Omron)', value: 'Relay MY4N-GS' },
  { label: 'Belt 100mm (Standard)', value: 'Belt 100mm' },
  { label: 'Motor 750W (Panasonic)', value: 'Motor 750W' },
  { label: 'Cylinder SMC 20-50', value: 'Cylinder SMC 20-50' },
  { label: 'Power Supply 24V-10A', value: 'Power Supply 24V' },
  { label: '--- Không thay thế ---', value: '' },
];
  useEffect(() => {
    if (isNew || !initialData.id) return

    api.get(`/Detail/${initialData.id}`)
      .then(res => {
        const data = res.data
        // Build _serverImages metadata from response
        const rawList = data.images || data.mainImages || data.equipmentImages || []
        const serverImages = Array.isArray(rawList)
          ? rawList.map((img: any) => ({
              id: img.id,
              type: img.imageType === true || img.type === true || img.imageType === 1,
            }))
          : []
        setForm(prev => ({
          ...prev,
          appmodel: data.appliedModelName ?? data.appmodel ?? prev.appmodel,
          opcond: data.operatingConditions ?? data.opcond ?? prev.opcond,
          ctrlnum: data.controlNumber ?? data.ctrlnum ?? prev.ctrlnum,
          eqtitle: data.manufacturerEquipmentTitle ?? data.eqtitle ?? prev.eqtitle,
          value: data.equipmentPrice != null ? String(data.equipmentPrice) : prev.value,
          location: data.installationLocation ?? data.location ?? prev.location,
          instdate: data.dateOfInstallation ? data.dateOfInstallation.split('T')[0] : prev.instdate,
          person: data.responsiblePerson ?? data.person ?? prev.person,
          mfgname: data.manufacturerName ?? data.mfgname ?? prev.mfgname,
          model: data.model ?? data.manufacturerModel ?? prev.model,
          serial: data.serialNo ?? data.serial ?? prev.serial,
          power: data.power ?? prev.power,
          mfgdate: data.dateOfManufacture ? data.dateOfManufacture.split('T')[0] : prev.mfgdate,
          weight: data.weight ?? prev.weight,
          size: data.size ?? prev.size,
          eqtype: data.equipmentTitle ?? data.eqtype ?? prev.eqtype,
          _serverImages: serverImages.length > 0 ? serverImages : (prev as any)._serverImages,
          photo1: (() => {
            const imgs = data.images || data.mainImages || [];
            const left = imgs.find((i: any) => i.imageType === false || i.type === false || i.imageType === 0);
            return left?.imagePath || left?.path || left?.url || prev.photo1;
          })(),
          photo2: (() => {
            const imgs = data.images || data.mainImages || [];
            const right = imgs.find((i: any) => i.imageType === true || i.type === true || i.imageType === 1);
            return right?.imagePath || right?.path || right?.url || prev.photo2;
          })(),
          periodicItems: (data.periodicInspections || data.periodicItems || [])
            .filter((item: any) => item.inspectionInterval || item.periodicItems || item.dateOfInspection || item.inspectionDetails)
            .map((item: any) => ({
              id: String(item.id || `p_${Date.now()}`),
              interval: item.inspectionInterval || item.interval || '',
              item: item.periodicItems || item.item || '',
              inspdate: item.dateOfInspection ? item.dateOfInspection.split('T')[0] : (item.inspdate || ''),
              content: item.inspectionDetails || item.content || '',
            })),
          inspections: (() => {
            if (Array.isArray(data.inspections) && data.inspections.length > 0) {
              return data.inspections.map((item: any) => ({
                id: String(item.id || `i_${Date.now()}`),
                date: item.inspectionDate ? item.inspectionDate.split('T')[0] : (item.date || ''),
                detail: item.description || item.inspectionDetails || item.detail || '',
                failure: item.failureStatus || item.failureHistory || item.failure || '',
                replacement: item.replacementPart || item.replacementParts || item.replacement || '',
                inspector: item.inspectorName || item.inspector || '',
                remarks: item.remarks || '',
              }));
            }
            // Fallback: ghép từ periodicInspections + spareParts (backend gộp chung)
            const periArr: any[] = data.periodicInspections || [];
            const spareArr: any[] = data.spareParts || [];
            const len = Math.max(periArr.length, spareArr.length);
            const result: any[] = [];
            for (let i = 0; i < len; i++) {
              const p = periArr[i] || {};
              const s = spareArr[i] || {};
              const date = p.dateOfInspection ? p.dateOfInspection.split('T')[0] : '';
              const detail = p.inspectionDetails || '';
              const failure = s.failureHistory || '';
              const replacement = s.replacementParts || '';
              const inspector = s.inspector || '';
              const remarks = s.remarks || '';
              if (date || detail || failure || replacement || inspector || remarks) {
                result.push({ id: String(p.id || s.id || `i_${Date.now()}_${i}`), date, detail, failure, replacement, inspector, remarks });
              }
            }
            return result;
          })(),
          spareParts: (data.spareParts || [])
            .filter((item: any) => item.partName || item.partNumber || item.specification || item.quantity || item.failureHistory || item.replacementParts || item.inspector || item.remarks)
            .map((item: any) => ({
              id: String(item.id || `s_${Date.now()}`),
              name: item.partName || item.name || '',
              partnum: item.partNumber || item.partnum || '',
              spec: item.specification || item.spec || '',
              qty: String(item.quantity ?? item.qty ?? ''),
              replacement: item.replacementParts || item.replacement || '',
              failure: item.failureHistory || item.failure || '',
              inspector: item.inspector || '',
              remarks: item.remarks || '',
              sparePartCode: item.sparePartCode || '',
              selectedQty: item.selectedQty || '',
            })),
        }))
      })
      .catch(err => {
        console.warn('Không tải được Detail', err)
      })
  }, [initialData.id, isNew])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ho_so_thiet_bi_${form.ctrlnum || form.id}`,
  })
 const downloadQR = () => {
  // Sửa lỗi 2352: Ép kiểu qua unknown trước khi sang SVGElement
  const svg = document.getElementById('equipment-qr') as unknown as SVGElement;
  
  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Sửa lỗi 2554 & 7009: Sử dụng document.createElement('img') 
    // để tránh xung đột với các định nghĩa Image khác trong project
    const img = document.createElement('img');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${form.ctrlnum || 'Equipment'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    // Sử dụng encodeURIComponent để xử lý các ký tự đặc biệt trong SVG an toàn hơn
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }
};
  // Track extra rows manually to allow user to add more rows via button
  const [extraP, setExtraP] = useState(0)
  const [extraS, setExtraS] = useState(0)
  const [extraBot, setExtraBot] = useState(0)

// Sửa hàm set trong EquipmentForm.tsx
const set = <K extends keyof Equipment>(key: K, val: Equipment[K]) => {
  setForm(prev => {
    const updatedForm = { ...prev, [key]: val };
    
    // Gọi onChange với dữ liệu mới nhất
    if (onChange) {
      onChange(updatedForm);
    }
    
    return updatedForm;
  });
};

const handlePrintQR = useReactToPrint({
  contentRef: qrPrintRef, // Phải khớp với ref ở div bên dưới
  documentTitle: `QR_Code_${form.ctrlnum || form.id}`,
  // Có thể thêm print: true để nó tự mở dialog in ngay
});
const handleSave = async () => {
  setIsSaving(true);
  
  // 1. Tạo bản sao để xử lý
  const cleanForm = { ...form };

  // 2. Dọn dẹp SpareParts
  cleanForm.spareParts = (cleanForm.spareParts || [])
  .map(item => ({
    // Giữ nguyên các trường cũ (id, name, partnum, qty...)
    
    ...item,
    
    // Mapping sang tên trường mà Backend DTO yêu cầu (PascalCase/Specific names)
    // Backend: PartName, PartNumber, ReplacementParts...
    partName: item.name,        // Map 'name' ở FE sang 'partName' cho BE
    partNumber: item.partnum,   // Map 'partnum' ở FE sang 'partNumber' cho BE
    quantity: item.qty,         // Map 'qty' ở FE sang 'quantity' cho BE
    replacementParts: item.replacementParts || item.replacement,
    sparePartCode: item.sparePartCode,
    selectedQty: item.selectedQty,
    stockName: item.stockName,
    workCenterCode: item.workCenterCode
    
  }))
  .filter(i => 
    // Kiểm tra các trường hiện có trong interface của bạn (name, partnum, replacement...)
    i.name || i.partnum || i.replacementParts || i.sparePartCode
  );

  try {
    // console.log("=== DỮ LIỆU THỰC TẾ GỬI ĐI (PAYLOAD) ===");
    // console.log(cleanForm); // Log cleanForm, đừng log 'form' vì 'form' là state cũ

    const savedData = await onSave(cleanForm); 
    
    if (savedData) {
      setForm({ ...savedData });
      if (onChange) onChange(savedData);
      notification.success({ message: 'Lưu thành công' });
    }

    if (isNew) onCancel(); 
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    setIsSaving(false);
  }
};
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
  const emptySPart = () => ({ id: `s_${uid()}`, name: '', partnum: '', spec: '', qty: '', replacement: '', failure: '', inspector: '', remarks: '' })
  const getSPart = (i: number) => form.spareParts?.[i] || emptySPart()
  const setSPart = (i: number, key: string, val: string) => {
    const arr = [...(form.spareParts || [])]
    while (arr.length <= i) arr.push(emptySPart())
    arr[i] = { ...arr[i], [key]: val }
    set('spareParts', arr)
  }

  // Inspection Helpers - chỉ đọc/ghi spareParts (failure/replacement/inspector/remarks)
  const getInsp = (i: number) => {
    const s = form.spareParts?.[i]
    return {
      id: s?.id || `i_${uid()}`,
      failure: s?.failure || '',
      replacement: s?.replacement || '',
      inspector: s?.inspector || '',
      remarks: s?.remarks || '',
      sparePartCode: s?.sparePartCode || '',
      selectedQty: s?.selectedQty || '',
    }
  }
  const setInsp = (i: number, key: string, val: string) => {
    setSPart(i, key, val)
  }

const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo1' | 'photo2') => {
  const file = e.target.files?.[0];
  if (!file) return;

  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    notification.error({
      key: 'upload-error', 
      message: 'Lỗi định dạng',
      description: 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP).',
      placement: 'topRight',
      duration: 4, 
    });
    e.target.value = '';
    return;
  }

  const isLt4M = file.size / 1024 / 1024 < 4;
  if (!isLt4M) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    
    notification.warning({
      key: 'upload-size-warning',
      message: 'Ảnh quá lớn',
      description: `Ảnh nặng ${fileSizeMB}MB. Vui lòng chọn ảnh dưới 4MB.`,
      placement: 'topRight',
      duration: 4, 
      style: { borderLeft: '4px solid #faad14' }
    });
    
    e.target.value = ''; 
    return;
  }

  // 3. Xử lý đọc file và thông báo thành công
  const reader = new FileReader();
  reader.onload = (ev) => {
    set(field, ev.target?.result as string);
    
    notification.success({
      key: 'upload-success',
      message: 'Tải ảnh thành công',
      // description: `Đã cập nhật ảnh thành công`,
      placement: 'topRight',
      duration: 2, // Thành công thì biến mất nhanh hơn (2 giây)
    });
  };
  
  reader.onerror = () => {
    notification.error({
      message: 'Lỗi hệ thống',
      description: 'Không thể đọc tệp tin này.',
      duration: 3,
    });
  };

  reader.readAsDataURL(file);
};

  // Row Management Helpers
  const commonExtra = Math.max(extraP, extraS)
  const commonLength = Math.max(form.periodicItems?.length || 0, form.spareParts?.length || 0)
  const pRowCount = Math.max(1 + commonExtra, commonLength)
  const sRowCount = Math.max(1 + commonExtra, commonLength)
  const botRowCount = Math.max(1 + extraBot, commonLength)

  const clearPRow = (i: number) => {
    const newP = [...(form.periodicItems || [])]
    if (newP[i]) newP[i] = { id: newP[i].id, interval: '', item: '', inspdate: '', content: '' }
    set('periodicItems', newP)
  }
  const deletePRow = (i: number) => {
    if (pRowCount <= 1) return
    const newP = [...(form.periodicItems || [])]
    if (newP.length > i) newP.splice(i, 1)
    set('periodicItems', newP)
    if (extraP > 0) setExtraP(p => p - 1)

    // Also delete from spareParts
    const newS = [...(form.spareParts || [])]
    if (newS.length > i) newS.splice(i, 1)
    set('spareParts', newS)
    if (extraS > 0) setExtraS(s => s - 1)
  }

  const clearSRow = (i: number) => {
    const newS = [...(form.spareParts || [])]
    if (newS[i]) newS[i] = { id: newS[i].id, name: '', partnum: '', spec: '', qty: '', replacement: '', failure: '', inspector: '', remarks: '' }
    set('spareParts', newS)
  }
  const deleteSRow = (i: number) => {
    if (sRowCount <= 1) return
    const newS = [...(form.spareParts || [])]
    if (newS.length > i) newS.splice(i, 1)
    set('spareParts', newS)
    if (extraS > 0) setExtraS(s => s - 1)

    // Also delete from periodicItems
    const newP = [...(form.periodicItems || [])]
    if (newP.length > i) newP.splice(i, 1)
    set('periodicItems', newP)
    if (extraP > 0) setExtraP(p => p - 1)
  }

  const clearBotRow = (i: number) => {
    // Xóa trắng date/detail ở periodicItems, failure/replacement/inspector/remarks ở spareParts
    const newP = [...(form.periodicItems || [])]
    if (newP[i]) newP[i] = { ...newP[i], inspdate: '', content: '' }
    set('periodicItems', newP)
    const newS = [...(form.spareParts || [])]
    if (newS[i]) newS[i] = { ...newS[i], failure: '', replacement: '', inspector: '', remarks: '' }
    set('spareParts', newS)
  }

  const deleteBotLRow = (i: number) => {
    if (botRowCount <= 1) return
    const newP = [...(form.periodicItems || [])]
    if (newP.length > i) newP.splice(i, 1)
    set('periodicItems', newP)
    const newS = [...(form.spareParts || [])]
    if (newS.length > i) newS.splice(i, 1)
    set('spareParts', newS)
    if (extraBot > 0) setExtraBot(b => b - 1)
  }

const [editingField, setEditingField] = useState<'name' | 'replacement' | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingIndex, setEditingIndex] = useState<number | null>(null);
const selectedWC = initialData?.workCenterCode || "";

const handleClearField = (index: number, field: 'name' | 'replacement') => {
  const newSpareParts = [...(form.spareParts || [])];
  
  if (!newSpareParts[index]) return;

  const updatedItem = {
    ...newSpareParts[index],
    [field]: "",
  };

  // ĐẢO NGƯỢC: Nếu xóa 'name', thì mới xóa kèm các thông tin kỹ thuật
  if (field === 'name') {
    updatedItem.partnum = "";
    updatedItem.spec = "";
  }

  newSpareParts[index] = updatedItem;
  set('spareParts', newSpareParts);
};
const handlePartSelect = (
  part: any, 
  quantity: number, 
  storage: string, 
  sparePartCode: string, 
  workCenterCode: string 
) => {
  if (part && editingIndex !== null) {
    const newSpareParts = [...(form.spareParts || [])];
    const currentRow = { ...newSpareParts[editingIndex] };

    // Phải khớp với thuộc tính trong SparePartDto (C#)
    if (editingField === 'replacement') {
      // 1. Backend dùng 'ReplacementParts' có chữ 's'
      currentRow.replacement = part.sparePartName;
      
      // 2. Các trường kho bãi (Viết đúng camelCase hoặc PascalCase tùy config backend)
      // Thông thường JSON gửi đi nên là camelCase: sparePartCode, selectedQty...
      currentRow.sparePartCode = sparePartCode; 
      currentRow.selectedQty = quantity;
      currentRow.stockName = storage;
      currentRow.workCenterCode = workCenterCode;

      // Lưu ý: Nếu bạn đang dùng Ant Design Tooltip hoặc Table hiển thị 
      // thì phải sửa cả dataIndex/key ở chỗ render đó thành 'replacementParts'
    }

    newSpareParts[editingIndex] = currentRow;
    set('spareParts', newSpareParts);
  }
  
  setIsModalOpen(false);
  setEditingIndex(null);
  setEditingField(null);
};
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
              icon={<QrCode size={14} />}
              onClick={() => setIsQRModalOpen(true)}
              className='rounded-lg shadow-sm border-blue-500 text-blue-600 hover:!border-blue-600 hover:!text-blue-700'
              style={{ fontSize: 13 }}
            >
              Mã QR
            </Button>
          )}
          {!isNew && !readOnly && (
            <Button
              size="small"
              danger
              variant="outlined"
              icon={<Trash2 size={14} />}
              onClick={() => {
                onDelete(form.id)
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
          {/* {!isNew && (
            <Button
              size="small"
              icon={<Printer size={14} />}
              onClick={() => handlePrint()}
              className='rounded-lg shadow-sm border-amber-500 text-amber-600 hover:!border-amber-600 hover:!text-amber-700'
              style={{ fontSize: 13 }}
            >
              In Hồ Sơ (A4)
            </Button>
          )} */}
          {!readOnly && (
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
          )}
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
                <TdValue colSpan={3}><ExcelInput value={form.appmodel} onChange={(v: string) => set('appmodel', v)} placeholder="Ví dụ: 3510S" className={inputClass} /></TdValue>
                <TdLabel>Manufacturer Name<br/>Tên nhà sản xuất</TdLabel>
                <TdValue colSpan={3}><ExcelInput value={form.mfgname} onChange={(v: string) => set('mfgname', v)} placeholder="Ví dụ: CHINA" className={inputClass} /></TdValue>
              </tr>

              {/* === ROW 3 === */}
              <tr>
                <TdLabel>Operating Conditions<br/>Điều kiện vận hành</TdLabel>
                <TdValue colSpan={3}>
                  <ExcelSelect 
                    value={form.opcond} onChange={(v: any) => set('opcond', v)} 
                    options={[{value: 'Good', label: 'Good - Tốt'}, {value: 'Warning', label: 'Warning - Theo dõi'}, {value: 'Bad', label: 'Bad - Lỗi/Hỏng'}]} 
                    className={inputClass}
                  />
                </TdValue>
                <TdLabel>Equipment Title<br/>Tên gọi thiết bị</TdLabel>
                <TdValue colSpan={3}><ExcelInput value={form.eqtitle} onChange={(v: string) => set('eqtitle', v)} placeholder="Ví dụ: Capacitor Secondary..." className={inputClass} /></TdValue>
              </tr>

              {/* === ROW 4 === */}
              <tr>
                <TdLabel>Control Number<br/>Số kiểm soát</TdLabel>
                <TdValue><ExcelInput value={form.ctrlnum} onChange={(v: string) => set('ctrlnum', v)} className={inputClass} /></TdValue>
                <TdLabel>Date of Installation<br/>Ngày lắp đặt</TdLabel>
                <TdValue><ExcelDatePicker value={form.instdate} onChange={(v: string) => set('instdate', v)} className={inputClass} /></TdValue>
                <TdLabel>Model<br/>Tên mẫu</TdLabel>
                <TdValue><ExcelInput value={form.model} onChange={(v: string) => set('model', v)} className={`font-mono text-blue-800 ${inputClass}`} /></TdValue>
                <TdLabel>Weight<br/>Trọng lượng</TdLabel>
                <TdValue><ExcelInput value={form.weight} onChange={(v: string) => set('weight', v)} className={inputClass} /></TdValue>
              </tr>

              {/* === ROW 5 === */}
              <tr>
                <TdLabel>Equipment Title<br/>Tên gọi thiết bị</TdLabel>
                <TdValue><ExcelInput value={form.eqtype} onChange={(v: string) => set('eqtype', v)} placeholder="Ví dụ: Winding" className={inputClass} /></TdValue>
                <TdLabel>Installation Location<br/>Địa điểm lắp đặt</TdLabel>
                <TdValue><ExcelSelect value={form.location} onChange={(v: string) => set('location', v)} options={LOCATIONS} className={inputClass} /></TdValue>
                <TdLabel>Serial No<br/>Số Seri</TdLabel>
                <TdValue><ExcelInput value={form.serial} onChange={(v: string) => set('serial', v)} className={`font-mono text-blue-800 ${inputClass}`} /></TdValue>
                <TdLabel>Power<br/>Nguồn điện</TdLabel>
                <TdValue><ExcelInput value={form.power} onChange={(v: string) => set('power', v)} className={`font-mono ${inputClass}`} /></TdValue>
              </tr>

              {/* === ROW 6 === */}
              <tr>
                <TdLabel>Equipment Price<br/>Giá thiết bị</TdLabel>
                <TdValue><ExcelInput value={form.value} onChange={(v: string) => set('value', v)} className={inputClass} /></TdValue>
                <TdLabel>Responsible Person<br/>Người phụ trách</TdLabel>
                <TdValue><ExcelInput value={form.person} onChange={(v: string) => set('person', v)} className={inputClass} /></TdValue>
                <TdLabel>Date of Manufacture<br/>Ngày sản xuất</TdLabel>
                <TdValue><ExcelDatePicker value={form.mfgdate} onChange={(v: string) => set('mfgdate', v)} className={inputClass} /></TdValue>
                <TdLabel>Size<br/>Kích thước</TdLabel>
                <TdValue><ExcelInput value={form.size} onChange={(v: string) => set('size', v)} className={`font-mono ${inputClass}`} /></TdValue>
              </tr>

              {/* === ROW 7: PHOTOS === */}
              <tr>
                {[
                  { id: 'photo1', label: 'Machine Photo', val: form.photo1 },
                  { id: 'photo2', label: 'Nameplate Photo', val: form.photo2 }
                ].map((item, idx) => (
                  <TdValue key={item.id} colSpan={4} className="bg-[#f0f4eb] p-0 relative group/photo border-black">
                    <div className="relative h-full min-h-[160px] w-full flex items-center justify-center bg-white overflow-hidden">
                      {item.val ? (
                        <>
                          {/* Ảnh hỗ trợ Preview (Zoom) */}
                          <Image
                            src={item.val}
                            alt={item.label}
                            className="max-h-[156px] w-auto object-contain p-1"
                            preview={{
                              mask: (
                                <div className="flex flex-col items-center gap-1">
                                  <SearchIcon size={20} />
                                  <span className="text-xs">Xem chi tiết</span>
                                </div>
                              ),
                            }}
                          />
                          
                          {/* Nút chức năng khi hover (Xóa/Thay đổi) - Chỉ hiện khi không phải ReadOnly */}
                          {!readOnly && (
                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20">
                              <label className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded shadow-lg cursor-pointer flex items-center justify-center" title="Thay đổi ảnh">
                                <Upload size={14} />
                                <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, item.id as any)} />
                              </label>
                              <button 
                                onClick={(e) => { e.preventDefault(); set(item.id as any, ''); }}
                                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow-lg flex items-center justify-center"
                                title="Xóa ảnh"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Trạng thái trống */
                        <label className={`flex flex-col items-center justify-center w-full h-full transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50'}`}>
                          {!readOnly && <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, item.id as any)} />}
                          <div className="opacity-40 flex flex-col items-center">
                            <Upload size={28} className="mb-2 text-[#2d5f1b]" />
                            <span className="text-[10px] font-bold text-[#2d5f1b] uppercase tracking-tighter px-4 text-center">
                              {readOnly ? 'Không có hình ảnh' : `Tải lên ${item.label}`}
                            </span>
                          </div>
                        </label>
                      )}
                    </div>
                  </TdValue>
                ))}
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
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Inspection Interval<br/>Chu kỳ kiểm tra</td>
                            <td className="bg-[#e5edd9] border-b border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Periodic Inspection Items<br/>Các hạng mục kiểm tra định kỳ</td>
                          </tr>
                          {Array.from({ length: pRowCount }).map((_, i) => {
                            const p = getPItem(i);
                            return (
                              <tr key={`p_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={p.interval} onChange={(v: string) => setPItem(i, 'interval', v)} className={inputClass} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={p.item} onChange={(v: string) => setPItem(i, 'item', v)} className={`text-left ${inputClass}`} />
                                  {!readOnly && (
                                    <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                      <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearPRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                      {pRowCount > 1 && <Tooltip title="Xóa hàng này"><button onClick={() => deletePRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}


                          {/* --- Inspection History --- */}
                          <tr>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Date of Insp.<br/>Ngày kiểm tra/SC</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Inspection Details<br/>Nội dung kiểm tra / sự cố</td>
                          </tr>
                          {Array.from({ length: botRowCount }).map((_, i) => {
                            const p = getPItem(i);
                            return (
                              <tr key={`botL_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelDatePicker value={p.inspdate} onChange={(v: string) => setPItem(i, 'inspdate', v)} className={inputClass} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={p.content} onChange={(v: string) => setPItem(i, 'content', v)} className={`text-left ${inputClass}`} />
                                  {!readOnly && (
                                    <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                      <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearBotRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                      {botRowCount > 1 && <Tooltip title="Xóa hàng này"><button onClick={() => deleteBotLRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
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
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Part Number<br/>Số hiệu linh kiện</td>
                            <td className="bg-[#e5edd9] border-b border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Specification<br/>Quy cách</td>
                            <td className="bg-[#e5edd9] border-b border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Quantity<br/>Số Lượng</td>
                          </tr>
                          {Array.from({ length: sRowCount }).map((_, i) => {
                            const s = getSPart(i);
                            return (
                              <tr key={`s_${i}`} className="group">
                                {/* <td 
                                  className="border-b border-r border-black bg-white p-0 align-middle cursor-pointer hover:bg-blue-50 group relative"
                                  onClick={() => {
                                    setEditingIndex(i);
                                    setEditingField('name'); // Hoặc 'replacement' tùy ô
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <div className="flex justify-between items-center px-2 min-h-[32px] text-[12px]">
                                    <span className="truncate flex-1 py-1">
                                      {s.name || <span className="text-gray-400 italic">Chọn...</span>}
                                    </span>

                                    {s.name && (
                                      <button
                                        className="hidden group-hover:block ml-1 text-gray-400 hover:text-red-500 font-bold px-1"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Ngăn việc mở Modal khi bấm xóa
                                          handleClearField(i, 'name'); 
                                        }}
                                      >
                                        ✕
                                      </button>
                                    )}
                                    
                                    <span className="text-gray-400 text-[10px] ml-1 shrink-0">▼</span>
                                  </div>
                                </td> */
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={s.name} onChange={(v: string) => setSPart(i, 'name', v)} className={`font-mono text-blue-800 ${inputClass}`} />
                                </td>
                                }
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={s.partnum} onChange={(v: string) => setSPart(i, 'partnum', v)} className={`font-mono text-blue-800 ${inputClass}`} />
                                </td>
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={s.spec} onChange={(v: string) => setSPart(i, 'spec', v)} className={inputClass} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={s.qty} onChange={(v: string) => setSPart(i, 'qty', v)} type="number" className={inputClass} />
                                  {!readOnly && (
                                    <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                      <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearSRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                      {sRowCount > 1 && <Tooltip title="Xóa hàng này"><button onClick={() => deleteSRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}


                          {/* --- Failure / Repair History --- */}
                          <tr>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Failure History<br/>Lịch sử hư hỏng</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Replacement Parts<br/>Linh kiện thay thế</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-r border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Inspector<br/>Người kiểm tra</td>
                            <td className="bg-[#e5edd9] border-b border-t-[2.5px] border-black text-[9.5px] font-bold text-center text-[#1a3811] uppercase py-1.5 px-1 leading-tight">Remarks<br/>Ghi chú</td>
                          </tr>
                          {Array.from({ length: botRowCount }).map((_, i) => {
                            const r = getInsp(i);
                            return (
                              <tr key={`botR_${i}`} className="group">
                                <td className="border-b border-r border-black bg-white p-0  align-middle">
                                  <ExcelInput value={r.failure} onChange={(v: string) => setInsp(i, 'failure', v)} className={inputClass} />
                                </td>
                              <td 
                                className="border-b border-r border-black bg-white p-0 align-middle cursor-pointer hover:bg-indigo-50/50 group relative transition-colors duration-200"
                                onClick={() => {
                                  setEditingIndex(i);
                                  setEditingField('replacement');
                                  setIsModalOpen(true);
                                }}
                              >
                                <div className="flex justify-between items-center px-3 min-h-[36px]">
                                  
                                  <Tooltip 
                                    placement="topLeft"
                                    color="#01561b" 
                                    title={
                                      r.replacement ? (
                                        <div className="p-1 text-[12px] leading-relaxed">
                                          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-600">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span className="font-bold text-blue-100 uppercase tracking-wider">Thông tin linh kiện</span>
                                          </div>
                                          <div className="space-y-1">
                                            <p><span className="text-slate-400">Tên:</span> <span className="text-white">{r.replacement}</span></p>
                                            <p><span className="text-slate-400">Mã linh kiện:</span> <span className="font-mono text-emerald-400">{r.sparePartCode || 'N/A'}</span></p>
                                            <p><span className="text-slate-400">SL yêu cầu:</span> <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-bold">{r.selectedQty || 0}</span></p>
                                          </div>
                                        </div>
                                      ) : "Click để chọn linh kiện"
                                    } 
                                    mouseEnterDelay={0.4}
                                  >
                                    <div className="flex-1 flex flex-col overflow-hidden py-1">
                                      {r.replacement ? (
                                        <>
                                          <span className="text-[12px] font-semibold text-slate-700 truncate leading-tight">
                                            {r.replacement}
                                          </span>
                                          {/* {r.sparePartCode && (
                                            <span className="text-[10px] text-slate-400 font-mono truncate">
                                              {r.sparePartCode}
                                            </span>
                                          )} */}
                                        </>
                                      ) : (
                                        <span className="text-gray-400 italic text-[12px] flex items-center gap-1">
                                          Chọn linh kiện...
                                        </span>
                                      )}
                                    </div>
                                  </Tooltip>

                                  <div className="flex items-center gap-1 ml-2">
                                    {/* Nút xóa được thiết kế lại: Tròn và nổi bật khi hover */}
                                    {r.replacement && (
                                      <button
                                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all duration-200 shadow-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClearField(i, 'replacement'); 
                                        }}
                                      >
                                        <span className="text-[14px] leading-none">×</span>
                                      </button>
                                    )}
                                    
                                    {/* Icon mũi tên nhỏ tinh tế */}
                                    <span className="text-slate-300 text-[9px] group-hover:text-blue-400 transition-colors">
                                      ▼
                                    </span>
                                  </div>
                                </div>
                              </td>
                                <td className="border-b border-r border-black bg-white p-0 align-middle">
                                  <ExcelInput value={r.inspector} onChange={(v: string) => setInsp(i, 'inspector', v)} className={inputClass} />
                                </td>
                                <td className="border-b border-black bg-white p-0 align-middle relative">
                                  <ExcelInput value={r.remarks} onChange={(v: string) => setInsp(i, 'remarks', v)} className={inputClass} />
                                  {!readOnly && (
                                    <div className="absolute top-0 right-0 h-full hidden group-hover:flex items-center space-x-1 pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4">
                                      <Tooltip title="Xóa trắng hàng này"><button onClick={() => clearBotRow(i)} className="p-1 text-slate-400 hover:text-orange-500 bg-slate-50 border border-slate-200 rounded shadow-sm"><Eraser size={12} /></button></Tooltip>
                                      {botRowCount > 1 && <Tooltip title="Xóa hàng này"><button onClick={() => deleteBotLRow(i)} className="p-1 text-slate-400 hover:text-red-600 bg-red-50 border border-red-100 rounded shadow-sm"><X size={12} /></button></Tooltip>}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </td>
              </tr>
              <tr className="no-print">
                <td colSpan={8} className="border-t border-black p-0">
                  {!readOnly && (
                    <button
                      onClick={() => { setExtraP(v => v + 1); setExtraS(v => v + 1); setExtraBot(v => v + 1) }}
                      className="w-full h-7 bg-slate-50 hover:bg-[#eef4ea] flex items-center justify-center text-[11px] font-bold text-slate-400 hover:text-[#2d5f1b] transition-colors"
                    >
                      <Plus size={12} className="mr-1" /> Thêm dòng
                    </button>
                  )}
                </td>
              </tr>

            </tbody>
          </table>
          <Modal
            title="Mã QR Thiết Bị"
            open={isQRModalOpen}
            onCancel={() => setIsQRModalOpen(false)}
            footer={[
              // Nút In mới
              <Button 
                key="print" 
                icon={<Printer size={14} />} 
                onClick={() => handlePrintQR()} // Gọi hàm in
                className="border-amber-500 text-amber-600"
              >
                In mã QR
              </Button>,
              <Button key="download" icon={<Download size={14} />} onClick={downloadQR} type="primary">
                Tải xuống PNG
              </Button>,
              // <Button key="close" onClick={() => setIsQRModalOpen(false)}>
              //   Đóng
              // </Button>
            ]}
            centered
            width={350}
          >
            {/* Bọc nội dung cần in vào div này */}
            <div ref={qrPrintRef} className="qr-print-container flex flex-col items-center justify-center bg-white">
              {/* Thêm style inline để kiểm soát kích thước khi in */}
              <div style={{ width: '100%', maxWidth: '250px', margin: '0 auto' }}>
                <QRCodeSVG
                  id="equipment-qr"
                  // window.location.origin sẽ lấy domain hiện tại (ví dụ: http://192.168.1.50:3000)
                  // Thêm mode=print để trang nhận diện lệnh in tự động
                  value={`${window.location.origin}/equipment/view/${form.id}?mode=print`}
                  size={512}
                  level="H"
                  includeMargin={true}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
              <div className="text-center mt-2">
                {/* Tăng cỡ chữ để khi in ra tem nhỏ vẫn đọc được */}
                <p className="text-[16px] font-bold text-black mb-0">{form.eqtype}</p>
                <p className="text-[14px] font-mono font-bold text-black border border-black px-2 mt-1 inline-block">
                  {form.ctrlnum}
                </p>
                
              </div>
            </div>
          </Modal>  
          <SparePartModal 
            visible={isModalOpen}
            initialWC={selectedWC} 
            onCancel={() => setIsModalOpen(false)}
            onSelect={handlePartSelect}
            isQueryMode={false} // QUAN TRỌNG: Sẽ bỏ qua modal xác nhận số lượng
          />   
        </div>
      </div>
    </div>
    
  )
  
}

