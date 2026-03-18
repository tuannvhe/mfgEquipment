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
    if (!path || path.startsWith('http') || path.startsWith('data:')) return path;
    // Đảm bảo không bị double slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  };

  const mapped: Equipment = {
    id: String(data.Id ?? data.id ?? ''),
    appmodel: data.appliedModelName ?? data.appmodel ?? '',
    opcond: (data.operatingConditions ?? data.opcond ?? 'Good') as any,
    ctrlnum: data.controlNumber ?? data.ctrlnum ?? '',
    eqtype: data.equipmentTitle ?? data.eqtype ?? 'Other',
    location: data.installationLocation ?? data.location ?? '',
    person: data.responsiblePerson ?? data.person ?? '',
    instdate: data.dateOfInstallation ? data.dateOfInstallation.split('T')[0] : data.instdate ?? '',
    value: data.equipmentPrice != null ? String(data.equipmentPrice) : data.value ?? '',
    mfgname: data.manufacturerName ?? data.mfgname ?? '',
    eqtitle: data.manufacturerEquipmentTitle ?? data.eqtitle ?? '',
    model: data.manufacturerModel ?? data.model ?? '',
    serial: data.serialNo ?? data.serial ?? '',
    power: data.power ?? data.power ?? '',
    mfgdate: data.dateOfManufacture ? data.dateOfManufacture.split('T')[0] : data.mfgdate ?? '',
    weight: data.weight ?? data.weight ?? '',
    size: data.size ?? data.size ?? '',
    makeraddr: data.manufacturerAddr ?? data.makeraddr ?? '',
    photo1: '',
    photo2: '',
    periodicItems: data.periodicItems ?? data.PeriodicInspections ?? [],
    inspections: (data.periodicInspections || data.inspections || []).map((item: any) => ({
      id: String(item.id || uid()),
      date: item.inspectionDate ? item.inspectionDate.split('T')[0] : (item.dateOfInspection ? item.dateOfInspection.split('T')[0] : (item.date || '')),
      detail: item.description || item.periodicItems || item.detail || '',
      failure: item.failureStatus || item.failure || '',
      replacement: item.replacementPart || item.replacement || '',
      inspector: item.inspectorName || item.inspector || '',
      remarks: item.remarks || ''
    })),
    spareParts: (data.spareParts || []).map((item: any) => ({
      id: String(item.id || uid()),
      name: item.partName || item.name || '',
      partnum: item.partNumber || item.partnum || '',
      spec: item.specification || item.spec || '',
      qty: item.quantity || item.qty || 0
    })),
  };

 const serverMeta: any[] = [];
  // Kiểm tra tất cả các trường có thể chứa ảnh
  const rawList = data.images || data.mainImages || data.equipmentImages || [];

  if (Array.isArray(rawList) && rawList.length > 0) {
    rawList.forEach((img: any) => {
      const isRight = img.imageType === true || img.type === true || img.imageType === 1;
      
      serverMeta.push({ id: img.id, type: isRight });

      const url = formatUrl(img.imagePath || img.path || img.url);
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
  formData.append('Id', vId);
  formData.append('EquipmentId', vId);
  formData.append('AppliedModelName', eq.appmodel || '');
  formData.append('OperatingConditions', eq.opcond || 'Good');
  formData.append('ControlNumber', eq.ctrlnum || '');
  formData.append('EquipmentTitle', eq.eqtype || '');
  formData.append('EquipmentPrice', eq.value || '');
  formData.append('InstallationLocation', eq.location || '');
  if (eq.instdate) formData.append('DateOfInstallation', eq.instdate);
  if (eq.person) formData.append('ResponsiblePerson', eq.person);
  formData.append('ManufacturerName', eq.mfgname || '');
  formData.append('ManufacturerModel', eq.model || '');
  formData.append('SerialNo', eq.serial || '');
  formData.append('Power', eq.power || '');
  if (eq.mfgdate) formData.append('DateOfManufacture', eq.mfgdate);
  formData.append('Weight', eq.weight || '');
  formData.append('Size', eq.size || '');
  formData.append('ManufacturerEquipmentTitle', eq.eqtitle || '');

// --- LOGIC XỬ LÝ ẢNH (BẢN FIX TRIỆT ĐỂ) ---
// KIỂM TRA QUAN TRỌNG: Log xem metadata có tồn tại không
const serverImages = (eq as any)._serverImages || [];

  const processPhoto = (photo: string | null | undefined, isRight: boolean) => {
    // Tìm ảnh gốc từ server dựa trên vị trí (Trái/Phải)
    const original = serverImages.find((img: any) => img.type === isRight);
    
    const isNewUpload = isDataURL(photo); // Ảnh mới (base64)
    const isRemoving = !photo || photo.trim() === ""; // Người dùng xóa ảnh

    // TH 1: NẾU CÓ THAY ĐỔI (Upload mới hoặc Xóa hẳn) -> Gửi lệnh xóa ảnh cũ
    if (original && (isNewUpload || isRemoving)) {
      // Quan trọng: Gửi key đơn giản 'DeletedImageIds', ASP.NET sẽ tự gom vào List<int>
      formData.append('DeletedImageIds', String(original.id));
      
    }

    // TH 2: UPLOAD ẢNH MỚI
    if (isNewUpload) {
      const file = dataURLtoFile(photo as string, `upload_${isRight ? 'Right' : 'Left'}.png`);
      formData.append('files', file); // Tên phải khớp chính xác với List<IFormFile> ở Backend
      formData.append('ImageTypes', isRight ? 'true' : 'false'); 
      
    }

    // TH 3: GIỮ NGUYÊN ẢNH CŨ
    // Nếu không có isNewUpload và photo vẫn tồn tại, KHÔNG append gì cả. 
    // Backend sẽ tự hiểu là giữ nguyên các bản ghi không nằm trong DeletedImageIds.
  };

  processPhoto(eq.photo1, false); // Xử lý ảnh Trái (Type = false)
  processPhoto(eq.photo2, true);  // Xử lý ảnh Phải (Type = true)

  // Xử lý bảng con (giữ nguyên logic của bạn)
  (eq.inspections || []).forEach((item, idx) => {
    formData.append(`PeriodicInspections[${idx}].Id`, toValidIntId(item.id));
    formData.append(`PeriodicInspections[${idx}].InspectionDate`, item.date || '');
    formData.append(`PeriodicInspections[${idx}].Description`, item.detail || '');
    formData.append(`PeriodicInspections[${idx}].FailureStatus`, item.failure || '');
    formData.append(`PeriodicInspections[${idx}].ReplacementPart`, item.replacement || '');
    formData.append(`PeriodicInspections[${idx}].InspectorName`, item.inspector || '');
    formData.append(`PeriodicInspections[${idx}].Remarks`, item.remarks || '');
  });

  (eq.spareParts || []).forEach((item, idx) => {
    formData.append(`SpareParts[${idx}].Id`, toValidIntId(item.id));
    formData.append(`SpareParts[${idx}].PartName`, item.name || '');
    formData.append(`SpareParts[${idx}].PartNumber`, item.partnum || '');
    formData.append(`SpareParts[${idx}].Specification`, item.spec || '');
    formData.append(`SpareParts[${idx}].Quantity`, String(item.qty || 0));
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
const [totalItems, setTotalItems] = useState(0);
  useEffect(() => {
    if (loadedOnce.current) return
    loadedOnce.current = true

    const fetchEquipment = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await api.get(`/Equipment?t=${timestamp}`); 
        
        let list: any[] = []
        if (Array.isArray(res.data)) list = res.data
        else if (Array.isArray((res.data as any)?.data)) list = (res.data as any).data
        else if (Array.isArray((res.data as any)?.items)) list = (res.data as any).items

        const normalized = list.map(item => mapApiToEquipment(item))
        
        // Sửa lại logic ghi đè: Chỉ ghi đè nếu API thực sự trả về data
        if (normalized.length > 0) {
          setEquipment(normalized)
          localStorage.setItem('vt_equipment_v3', JSON.stringify(normalized))
        }
      } catch (err) { console.warn('Load API fail:', err) }
      finally { setLoading(false) }
    }
    fetchEquipment()
  }, [])

  // --- PHẦN SỬA 2: THÊM HÀM GET DETAIL ĐỂ LOAD DỮ LIỆU KHI BẤM VÀO ITEM ---
  const getDetail = useCallback(async (id: string) => {
    if (!id || id.includes('-') || fetchingId.current === id) return null;
    fetchingId.current = id;
    setLoading(true);
    try {
      const res = await api.get(`/Detail/${id}`);
      const fullData = mapApiToEquipment(res.data);
      setEquipment(prev => prev.map(e => e.id === id ? fullData : e));
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
      
      // FIX 1: Xác định isUpdate chặt chẽ hơn (bỏ qua id là '0', rỗng, hoặc có dấu '-')
      const isUpdate = Boolean(eq.id && !String(eq.id).includes('-') && String(eq.id) !== '0');
      let response;

      // Phục hồi metadata cho ảnh
      const originalRecord = equipment.find(e => String(e.id) === String(eq.id));
      if (originalRecord && !(eq as any)._serverImages) {
        (eq as any)._serverImages = (originalRecord as any)._serverImages;
      }

      // Gọi API tương ứng
      if (isUpdate) {
        const detailFormData = buildDetailFormData(eq, eq.id);
        response = await api.put(`/Detail/update-full`, detailFormData);
      } else {
        const createFormData = buildDetailFormData(eq, '0');
        response = await api.post('/Equipment', createFormData);
      }
      
      // Kiểm tra dữ liệu trả về từ Server
      const rawData = response.data?.data || response.data;
      if (!rawData) throw new Error("Server không trả về dữ liệu sau khi lưu.");

      // Chuẩn hóa dữ liệu thật từ Server
      const updatedRecord = mapApiToEquipment(rawData);
      if (isUpdate && (!updatedRecord.id || updatedRecord.id === '0' || updatedRecord.id === '')) {
         updatedRecord.id = String(eq.id);
      }
      // --- FIX 2: CẬP NHẬT STATE THÔNG MINH (KHÔNG CẦN F5) ---
      setEquipment(prev => {
        const nextList = [...prev];
        // Tìm xem bản ghi (với ID lúc đang thao tác) đã nằm sẵn trong danh sách chưa
        const existingIndex = nextList.findIndex(item => String(item.id) === String(eq.id));

        if (existingIndex >= 0) {
          // Nếu ĐÃ CÓ (Đang Edit hoặc đang Lưu một dòng tạm thời có ID chứa '-'):
          // Ta GHI ĐÈ dòng cũ đó bằng dữ liệu chuẩn xịn (ID mới) từ Server
          nextList[existingIndex] = updatedRecord;
        } else {
          // Nếu CHƯA CÓ (Thêm mới hoàn toàn từ một popup/form ngoài bảng):
          // Thêm dữ liệu vào ĐẦU danh sách
          nextList.unshift(updatedRecord);
        }
        
        // Lưu ngay xuống LocalStorage
        localStorage.setItem('vt_equipment_v3', JSON.stringify(nextList));
        return nextList; 
      });

      Swal.fire({
        icon: 'success',
        title: isUpdate ? 'Cập nhật thành công!' : 'Thêm mới thành công!',
        text: `Thiết bị ${updatedRecord.eqtitle} đã được lưu.`,
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      return updatedRecord;

    } catch (error: any) {
      console.error("Save error:", error);
      Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể lưu dữ liệu', 'error');
      return null;
    }
  }, [equipment]);

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

  return { equipment, loading, getDetail, saveEquipment, deleteEquipment, exportExcel, persist }
}