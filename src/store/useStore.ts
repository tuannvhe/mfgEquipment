import { useState, useCallback, useEffect, useRef } from 'react'
import type { Equipment } from '../types'
import api from '../utils/api'
import Swal from 'sweetalert2' // 1. Import SweetAlert2

// 1. Export uid ngay tại đây để các file khác có thể import { uid }
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  background: '#fff',
  color: '#1e293b',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});
const ModernAlert = Swal.mixin({
  customClass: {
    confirmButton: 'rounded-xl px-6 py-2.5 font-bold text-sm mx-2 transition-all hover:scale-105',
    cancelButton: 'rounded-xl px-6 py-2.5 font-bold text-sm mx-2 transition-all hover:scale-105',
    popup: 'rounded-[2rem] p-8 shadow-2xl border-none',
    title: 'text-2xl font-extrabold text-slate-800',
    htmlContainer: 'text-slate-500 font-medium'
  },
  buttonsStyling: true,
});
const dataURLtoFile = (dataUrl: string, filename: string) => {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}

const isDataURL = (v: any): v is string => typeof v === 'string' && v.startsWith('data:')

function mapApiToEquipment(data: any, existingMeta: any[] = []): Equipment {
  const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
  const formatUrl = (path: string) => {
    if (!path) return path;
    // Nếu đã là URL đầy đủ (Cloudinary, http, https, data:) thì giữ nguyên
    if (path.startsWith('http') || path.startsWith('https') || path.startsWith('data:')) return path;
    // Đảm bảo không bị double slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  };

  const mapped: Equipment = {
    id: String(data.id ?? ''),
    appmodel: data.appliedModelName ?? data.appmodel ?? '',
    opcond: (data.operatingConditions ?? data.opcond ?? 'Good') as any,
    ctrlnum: data.controlNumber ?? data.ctrlnum ?? '',
    eqtype: data.equipmentTitle ?? data.eqtype ?? '',
    location: data.installationLocation ?? data.location ?? '',
    person: data.responsiblePerson ?? data.person ?? '',
    instdate: data.dateOfInstallation ? data.dateOfInstallation.split('T')[0] : data.instdate ?? '',
    value: data.equipmentPrice != null ? String(data.equipmentPrice) : data.value ?? '',
    mfgname: data.manufacturerName ?? data.mfgname ?? '',
    eqtitle: data.manufacturerEquipmentTitle ?? data.eqtitle ?? '',
    model: data.model ?? data.manufacturerModel ?? '',
    serial: data.serialNo ?? data.serial ?? '',
    power: data.power ?? data.power ?? '',
    mfgdate: data.dateOfManufacture ? data.dateOfManufacture.split('T')[0] : data.mfgdate ?? '',
    weight: data.weight ?? data.weight ?? '',
    size: data.size ?? data.size ?? '',
    makeraddr: data.manufacturerAddr ?? data.makeraddr ?? '',
    photo1: '',
    photo2: '',
    // periodicInspections -> periodicItems, lọc bỏ row toàn null
    periodicItems: (data.periodicInspections || data.periodicItems || [])
      .filter((item: any) => item.inspectionInterval || item.periodicItems || item.dateOfInspection || item.inspectionDetails || item.interval || item.content)
      .map((item: any) => ({
        id: String(item.id || uid()),
        interval: item.inspectionInterval || item.interval || '',
        item: item.periodicItems || item.item || '',
        inspdate: item.dateOfInspection ? item.dateOfInspection.split('T')[0] : (item.inspdate || ''),
        content: item.inspectionDetails || item.content || '',
      })),
    // inspections: lấy date/detail từ periodicInspections, failure/replacement/inspector/remarks từ spareParts (cùng index)
    inspections: (() => {
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
          result.push({ id: String(p.id || s.id || uid()), date, detail, failure, replacement, inspector, remarks });
        }
      }
      return result;
    })(),
    // spareParts: giữ row nếu có bất kỳ field nào có giá trị
    spareParts: (data.spareParts || [])
      .filter((item: any) => item.partName || item.partNumber || item.specification || item.quantity || item.failureHistory || item.replacementParts || item.inspector || item.remarks)
      .map((item: any) => ({
        id: String(item.id || uid()),
        name: item.partName || item.name || '',
        partnum: item.partNumber || item.partnum || '',
        spec: item.specification || item.spec || '',
        qty: String(item.quantity ?? item.qty ?? ''),
        replacement: item.replacementParts || item.replacement || '',
        failure: item.failureHistory || item.failure || '',
        inspector: item.inspector || '',
        remarks: item.remarks || '',
      })),
  };

 const serverMeta: any[] = [];
  // Kiểm tra tất cả các trường có thể chứa ảnh
  const rawList = data.images || data.mainImages || data.equipmentImages || [];
  mapped.photo1 = '';
  mapped.photo2 = '';
  if (Array.isArray(rawList) && rawList.length > 0) {
    rawList.forEach((img: any) => {
        // Kiểm tra logic xác định Trái/Phải
        // true/1/true string -> Phải (photo2)
        // false/0/false string -> Trái (photo1)
        const isRight = img.imageType === true || img.type === true || img.imageType === 1;
        
        serverMeta.push({ id: img.id, type: isRight });

        const url = formatUrl(img.imagePath || img.path || img.url);
        
        if (isRight) {
            mapped.photo2 = url; 
        } else {
            mapped.photo1 = url;
        }
    });
  } 
  // Trường hợp Fallback: Nếu BE trả về mảng string đơn thuần (mainImagePath)
  else if (Array.isArray(data.mainImagePath)) {
     data.mainImagePath.forEach((path: string, i: number) => {
        if (!path) return;
        const isRight = i === 1; // Giả định index 1 là bên phải
        mapped[isRight ? 'photo2' : 'photo1'] = formatUrl(path);
     });
  }

  // Cực kỳ quan trọng: Gán lại meta
  (mapped as any)._serverImages = serverMeta.length > 0 ? serverMeta : existingMeta;
  
  return mapped;
}

const toValidIntId = (id: any) => {
  const s = String(id || '');
  return (s.includes('-') || isNaN(Number(s)) || !s) ? '0' : s;
};

function buildDetailFormData(eq: Equipment, id: string): FormData {
  const formData = new FormData();
  const vId = toValidIntId(id);
  // EquipmentId chỉ cần cho update (vId > 0)
  if (Number(vId) > 0) formData.append('EquipmentId', vId);
  formData.append('AppliedModelName', eq.appmodel || '');
  formData.append('OperatingConditions', eq.opcond || 'Good');
  formData.append('ControlNumber', eq.ctrlnum || '');
  formData.append('ManufacturerEquipmentTitle', eq.eqtitle || '');
  formData.append('EquipmentPrice', eq.value || '0');
  formData.append('InstallationLocation', eq.location || '');
  formData.append('DateOfInstallation', eq.instdate || '');
  formData.append('ResponsiblePerson', eq.person || '');
  formData.append('ManufacturerName', eq.mfgname || '');
  formData.append('EquipmentTitle', eq.eqtype || '');
  formData.append('ManufacturerModel', eq.model || '');
  formData.append('SerialNo', eq.serial || '');
  formData.append('DateOfManufacture', eq.mfgdate || '');
  formData.append('Weight', eq.weight || '');
  formData.append('Power', eq.power || '');
  formData.append('Size', eq.size || '');

// --- LOGIC XỬ LÝ ẢNH (BẢN FIX CHỐNG NHÂN ĐÔI) ---
const serverImages = (eq as any)._serverImages || [];

const processPhoto = (photo: string | null | undefined, isRight: boolean) => {
  const original = serverImages.find((img: any) => img.type === isRight);
  const isNewUpload = isDataURL(photo); 
  const hasPhoto = !!(photo && photo.trim() !== "");

  // TRƯỜNG HỢP 1: THAY THẾ HOẶC THÊM MỚI (CHỈ KHI LÀ BASE64)
  if (isNewUpload) {
    // Nếu có ảnh cũ ở vị trí này trên server -> Đánh dấu xóa ảnh cũ
    if (original) {
      formData.append('DeletedImageIds', String(original.id));
    }
    
    // QUAN TRỌNG: Chỉ append vào ImageTypes KHI CÓ file tương ứng đi kèm
    const file = dataURLtoFile(photo as string, `upload_${isRight ? 'Right' : 'Left'}.png`);
    formData.append('files', file); 
    formData.append('ImageTypes', isRight ? 'true' : 'false'); 
  }

  else if (!hasPhoto && original) {
    formData.append('DeletedImageIds', String(original.id));
  }
};

processPhoto(eq.photo1, false); 
processPhoto(eq.photo2, true);

  // PeriodicInspections - indexed form fields (ASP.NET [FromForm] binding)
  (eq.periodicItems || []).forEach((item, idx) => {
    const iid = toValidIntId(item.id);
    formData.append(`PeriodicInspections[${idx}][id]`, iid);
    formData.append(`PeriodicInspections[${idx}][inspectionInterval]`, item.interval || '');
    formData.append(`PeriodicInspections[${idx}][periodicItems]`, item.item || '');
    if (item.inspdate) formData.append(`PeriodicInspections[${idx}][dateOfInspection]`, new Date(item.inspdate).toISOString());
    formData.append(`PeriodicInspections[${idx}][inspectionDetails]`, item.content || '');
  });

  // SpareParts - indexed form fields (ASP.NET [FromForm] binding)
  (eq.spareParts || []).forEach((item, idx) => {
    const sid = toValidIntId(item.id);
    formData.append(`SpareParts[${idx}][id]`, sid);
    formData.append(`SpareParts[${idx}][partName]`, item.name || '');
    formData.append(`SpareParts[${idx}][partNumber]`, item.partnum || '');
    formData.append(`SpareParts[${idx}][specification]`, item.spec || '');
    formData.append(`SpareParts[${idx}][quantity]`, String(Number(item.qty) || 0));
    formData.append(`SpareParts[${idx}][replacementParts]`, item.replacement || '');
    formData.append(`SpareParts[${idx}][failureHistory]`, item.failure || '');
    formData.append(`SpareParts[${idx}][inspector]`, item.inspector || '');
    formData.append(`SpareParts[${idx}][remarks]`, item.remarks || '');
  });

  return formData;
}



export function useEquipmentStore() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState({ good: 0, warn: 0, bad: 0 });
 const fetchEquipment = useCallback(async (params: { 
    page: number, 
    pageSize?: number,
    searchTerm?: string, 
    location?: string, 
    status?: string,
    type?: string,
    startDate?: string, // Thêm dòng này
    endDate?: string
  }) => {
    setLoading(true);
    const finalPageSize = params.pageSize || pageSize;
   try {
      const res = await api.get('/Equipment', { 
        params: { 
          page: params.page, 
          pageSize: finalPageSize,
          searchTerm: params.searchTerm,
          location: params.location,
          status: params.status,
          type: params.type,
          startDate: params.startDate, 
          endDate: params.endDate
        } 
      });

      const rawData = res.data.items || res.data.data || [];
      const total = res.data.totalCount || 0;
      const serverStats = res.data.stats; 

      if (serverStats) {
        setStats({
          good: serverStats.good,
          warn: serverStats.warning, 
          bad: serverStats.bad
        });
      }
      const normalized = rawData.map((item: any) => mapApiToEquipment(item));
      
      setEquipment(normalized);
      setTotalCount(total);
      setCurrentPage(params.page);
      if (params.pageSize) setPageSize(params.pageSize);
    } catch (err) {
      console.error('Load API fail:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize, equipment.length]);

 const isFirstRun = useRef(true);

useEffect(() => {
  if (isFirstRun.current) {
    fetchEquipment({ page: 1 });
    isFirstRun.current = false;
  }
}, [fetchEquipment]);
  

const saveEquipment = useCallback(async (eq: Equipment) => {
  try {

    setLoading(true);
    
    const isUpdate = Boolean(eq.id && !eq.id.includes('-'));
    let response;

    const originalRecord = equipment.find(e => String(e.id) === String(eq.id));
    if (originalRecord && !(eq as any)._serverImages) {
      (eq as any)._serverImages = (originalRecord as any)._serverImages;
    }

    if (isUpdate) {
      const detailFormData = buildDetailFormData(eq, eq.id);
      response = await api.put(`/Detail/update-full`, detailFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      const createFormData = buildDetailFormData(eq, '0');
      response = await api.post('/Equipment', createFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    const rawData = response.data?.data || response.data;
    const updatedRecord = mapApiToEquipment(rawData);

    setEquipment(prev => {
      let next;
      if (isUpdate) {
        next = prev.map(e => String(e.id) === String(updatedRecord.id) ? updatedRecord : e);
      } else {
        next = [updatedRecord, ...prev];
      }
      return [...next]; 
    });
    await fetchEquipment({ page: currentPage, pageSize: pageSize });
    Toast.fire({
      icon: 'success',
      title: isUpdate ? 'Đã cập nhật hồ sơ' : 'Đã thêm thiết bị mới',
      text: updatedRecord.eqtype,
      background: '#f0fdf4', // Nền xanh nhạt cực nhẹ
    });
    setLoading(false);
    return updatedRecord;

  } catch (error: any) {
    setLoading(false);
  const serverErrors = error.response?.data?.errors;
  
  let errorContent = "";
  if (serverErrors) {
    errorContent = `
      <div class="mt-4 space-y-2 text-left bg-red-50 p-4 rounded-2xl border border-red-100">
        ${Object.values(serverErrors).flat().map(msg => `
          <div class="flex items-start gap-2 text-red-600 text-sm">
            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
            <span>${msg}</span>
          </div>
        `).join('')}
      </div>`;
  }

  ModernAlert.fire({
    icon: 'error',
    title: 'Kiểm tra lại dữ liệu',
    html: errorContent || 'Đã có lỗi không xác định xảy ra.',
    confirmButtonText: 'Tôi đã hiểu',
    confirmButtonColor: '#10b981', // Màu xanh Primary của bạn
  });

        return null;
  }
}, [equipment]); 

// Thêm tham số title vào hàm
const deleteEquipment = useCallback(async (id: string, title?: string) => {
  if (id.includes('-')) {
    setEquipment(prev => prev.filter(e => e.id !== id));
    return;
  }

  const result = await ModernAlert.fire({
    title: 'Xác nhận xóa?',
    // Chèn title vào nội dung thông báo
    html: `Hành động này không thể hoàn tác.<br/>Thiết bị ${title || 'này'} sẽ bị loại khỏi hệ thống.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Xóa thiết bị',
    cancelButtonText: 'Quay lại',
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      // Giữ nguyên logic xóa của bạn...
      await api.delete(`/Equipment/${id}`); 
      setEquipment(prev => prev.filter(e => String(e.id) !== String(id)));
      
      Toast.fire({
        icon: 'success',
        title: `Đã xóa ${title || 'thiết bị'} thành công`,
        background: '#fef2f2', 
      });
    } catch (err: any) {
      console.error("Delete fail:", err);
      ModernAlert.fire('Thất bại', 'Không thể kết nối đến máy chủ để xóa.', 'error');
    }
  }
}, []);


return { 
    equipment, 
    totalCount, 
    currentPage, 
    pageSize, 
    
    loading, 
    fetchEquipment, 
    saveEquipment, 
    deleteEquipment,
    stats ,
    
  };}