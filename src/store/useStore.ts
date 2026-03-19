import { useState, useCallback, useEffect, useRef } from 'react'
import type { Equipment } from '../types'
import { exportToExcel } from '../utils/excelExport'
import api from '../utils/api'
import Swal from 'sweetalert2' // 1. Import SweetAlert2
// 1. Export uid ngay tại đây để các file khác có thể import { uid }
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const SEED: Equipment[] = [];

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
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}?v=${Date.now()}`; // Thêm version để tránh cache
  };
  const mapped: Equipment = {
    id: String(data.id && data.id !== 0 ? data.id : (data.equipmentId || '')),
    appmodel: data.appliedModelName ?? data.appmodel ?? '',
    opcond: (data.operatingConditions ?? data.opcond ?? 'Good') as any,
    ctrlnum: data.controlNumber ?? data.ctrlnum ?? '',
    eqtype: data.manufacturerEquipmentTitle ?? data.eqtype ?? '',
    location: data.installationLocation ?? data.location ?? '',
    person: data.responsiblePerson ?? data.person ?? '',
    instdate: data.dateOfInstallation ? data.dateOfInstallation.split('T')[0] : data.instdate ?? '',
    value: data.equipmentPrice != null ? String(data.equipmentPrice) : data.value ?? '',
    mfgname: data.manufacturerName ?? data.mfgname ?? '',
    eqtitle: data.equipmentTitle ?? data.eqtitle ?? '',
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

  // Kiểm tra tất cả các trường có thể chứa ảnh
  const rawList = data.images || data.equipmentImages || data.mainImages || [];
  const serverMeta: any[] = [];

  if (Array.isArray(rawList)) {
    rawList.forEach((img: any) => {
      const isRight = img.imageType === true || img.type === true || img.imageType === 1;
      serverMeta.push({ id: img.id, type: isRight });

      // QUAN TRỌNG: Đọc relativePath từ Cloudinary nếu có
      const path = img.relativePath || img.imagePath || img.path || img.url;
      const url = formatUrl(path);

      if (isRight) mapped.photo2 = url; 
      else mapped.photo1 = url;
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
  formData.append('EquipmentTitle', eq.eqtitle || '');
  formData.append('EquipmentPrice', eq.value || '0');
  formData.append('InstallationLocation', eq.location || '');
  formData.append('DateOfInstallation', eq.instdate || '');
  formData.append('ResponsiblePerson', eq.person || '');
  formData.append('ManufacturerName', eq.mfgname || '');
  formData.append('ManufacturerEquipmentTitle', eq.eqtype || '');
  formData.append('ManufacturerModel', eq.model || '');
  formData.append('SerialNo', eq.serial || '');
  formData.append('DateOfManufacture', eq.mfgdate || '');
  formData.append('Weight', eq.weight || '');
  formData.append('Power', eq.power || '');
  formData.append('Size', eq.size || '');

// --- LOGIC XỬ LÝ ẢNH (BẢN FIX TRIỆT ĐỂ) ---
// KIỂM TRA QUAN TRỌNG: Log xem metadata có tồn tại không
const serverImages = (eq as any)._serverImages || [];

  const processPhoto = (photo: string | null | undefined, isRight: boolean) => {
  // 1. Tìm TẤT CẢ ảnh cũ ở vị trí này (phòng trường hợp DB đang bị trùng sẵn)
  const originalsAtPosition = serverImages.filter((img: any) => 
    (img.imageType === isRight || img.type === isRight)
  );
  
  const isNewUpload = isDataURL(photo); 
  const isRemoving = !photo || photo.trim() === "";

  // TH 1: NẾU CÓ THAY ĐỔI (Upload mới hoặc Xóa hẳn)
  if (isNewUpload || isRemoving) {
    // Gửi lệnh xóa TẤT CẢ các ID cũ tại vị trí này để dọn dẹp sạch sẽ
    originalsAtPosition.forEach((oldImg: any) => {
      formData.append('DeletedImageIds', String(oldImg.id));
    });
  }

  // TH 2: UPLOAD ẢNH MỚI
  if (isNewUpload) {
    const file = dataURLtoFile(photo as string, `upload_${isRight ? 'Right' : 'Left'}.png`);
    formData.append('files', file); 
    formData.append('ImageTypes', String(isRight)); // Gửi 'true' hoặc 'false' dưới dạng string
  }
  
  // TH 3: Nếu là ảnh cũ (không phải dataURL) và không xóa, 
  // thì KHÔNG append DeletedImageIds, Backend sẽ giữ nguyên ID đó.
};

  processPhoto(eq.photo1, false); // Xử lý ảnh Trái (Type = false)
  processPhoto(eq.photo2, true);  // Xử lý ảnh Phải (Type = true)

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

function loadFromStorage(): Equipment[] {
  try {
    const raw = localStorage.getItem('vt_equipment_v3')
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED
  } catch { return SEED }
}

export function useEquipmentStore() {
  const [equipment, setEquipment] = useState<Equipment[]>(loadFromStorage)
  const [loading, setLoading] = useState(true)
  const loadedOnce = useRef(false)
  const fetchingId = useRef<string | null>(null);
  const [totalItems, setTotalItems] = useState(0); // Quan trọng: Lưu tổng số từ server
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Thêm state pageSize
  
const fetchEquipment = useCallback(async (
  page: number, 
  searchTerm: string = '', 
  location?: string, 
  type?: string, 
  status?: string,
  size?: number // Nhận thêm tham số size
) => {
    try {
      const currentSize = size || pageSize; // Ưu tiên size mới truyền vào, không thì dùng state
      const res = await api.get('/Equipment', {
        params: { 
          page, 
          pageSize: currentSize, // Gửi size lên Server
          searchTerm, 
          location, 
          type, 
          status 
        }
      });

      const items = res.data?.items || [];
      const total = res.data?.totalCount || 0;
      const normalized = items.map((item: any) => mapApiToEquipment(item));
      
      setEquipment(normalized);
      setTotalItems(total);
      setCurrentPage(page);
      if (size) setPageSize(size); // Cập nhật state nếu có sự thay đổi size
    } catch (err) {
      console.warn('Load API fail:', err);
    } finally {
      setLoading(false);
    }
}, [pageSize]);
  // Gọi lần đầu khi mount
 useEffect(() => {
    fetchEquipment(1).then(() => setLoading(false));
}, [fetchEquipment]);

  // --- PHẦN SỬA 2: THÊM HÀM GET DETAIL ĐỂ LOAD DỮ LIỆU KHI BẤM VÀO ITEM ---
const getDetail = useCallback(async (id: string) => {
  if (!id || id.includes('-') || fetchingId.current === id) return null;
  fetchingId.current = id;
  setLoading(true);
  try {
    const res = await api.get(`/Detail/${id}`);
    const fullData = mapApiToEquipment(res.data);
    
    setEquipment(prev => {
      const next = prev.map(e => String(e.id) === String(id) ? fullData : e);
      // Cập nhật lại cache để lần sau mở ra có ảnh ngay
      localStorage.setItem('vt_equipment_v3', JSON.stringify(next));
      return [...next];
    });
    
    return fullData;
  } catch (err) {
    console.error("Load detail fail:", err);
    return null;
  } finally {
    setLoading(false);
    fetchingId.current = null;
  }
}, []);

  const persist = useCallback((next: Equipment[]) => {
    localStorage.setItem('vt_equipment_v3', JSON.stringify(next))
    setEquipment(next)
  }, [])

const saveEquipment = useCallback(async (eq: Equipment) => {
  try {
    Swal.showLoading();
    const isUpdate = Boolean(eq.id && !eq.id.includes('-'));
    let response;

    // Phục hồi metadata
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

    // --- PHẦN FIX: ĐẢM BẢO LOAD LẠI BẢNG ---
    
    // 1. Lấy dữ liệu thực tế từ Server trả về (Thường nằm trong response.data hoặc response.data.data)
    const rawData = response.data?.data || response.data;
    const updatedRecord = mapApiToEquipment(rawData);

    // 2. Cập nhật State một cách tuyệt đối
    setEquipment(prev => {
      let next;
      if (isUpdate) {
        // Thay thế bản ghi cũ dựa trên ID
        next = prev.map(e => String(e.id) === String(updatedRecord.id) ? updatedRecord : e);
      } else {
        // Thêm mới vào đầu danh sách (Spread giúp React nhận diện mảng mới hoàn toàn)
        next = [updatedRecord, ...prev];
      }
      
      // 3. Đồng bộ bộ nhớ đệm
      localStorage.setItem('vt_equipment_v3', JSON.stringify(next));
      return [...next]; // Spread một lần nữa để chắc chắn địa chỉ mảng thay đổi
    });

    Swal.fire({
      icon: 'success',
      title: isUpdate ? 'Cập nhật thành công!' : 'Thêm mới thành công!',
      text: `Thiết bị ${updatedRecord.eqtitle} đã được cập nhật.`,
      timer: 2500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });

    return updatedRecord;

  } catch (error: any) {
     // ... logic catch lỗi cũ của bạn giữ nguyên
  }
}, [equipment]); // Dependency [equipment] rất quan trọng để React thấy được sự thay đổi

  const deleteEquipment = useCallback(async (id: string) => {
  // Nếu là ID tạm (có dấu gạch ngang), chỉ cần xóa ở Local
  if (id.includes('-')) {
    setEquipment(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem('vt_equipment_v3', JSON.stringify(next));
      return next;
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Bạn có chắc chắn?',
    text: "Dữ liệu sẽ bị xóa vĩnh viễn trên Server!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Đồng ý xóa',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    try {
      Swal.showLoading();
      
      // GỌI API XÓA THỰC TẾ (Giả định endpoint là /Equipment/{id})
      await api.delete(`/Equipment/${id}`); 

      setEquipment(prev => {
        const next = prev.filter(e => String(e.id) !== String(id));
        localStorage.setItem('vt_equipment_v3', JSON.stringify(next));
        return next;
      });
      
      Swal.fire({
        title: 'Đã xóa!',
        icon: 'success',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err: any) {
      console.error("Delete fail:", err);
      Swal.fire('Lỗi!', err.response?.data?.message || 'Không thể xóa thiết bị trên hệ thống.', 'error');
    }
  }
}, []);
  const exportExcel = useCallback((data: Equipment[]) => {
    exportToExcel(data, `VINATech_Equipment_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [])

  return { 
    equipment, 
    loading, 
    totalItems, 
    currentPage, 
    fetchEquipment, // Export hàm này ra ngoài
    getDetail, 
    pageSize,
    saveEquipment, 
    deleteEquipment 
  };
}