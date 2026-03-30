export type OpCond = 'Good' | 'Warning' | 'Bad'

// Maps to InspectionDto (PeriodicInspections)
export interface PeriodicItem {
  id: string
  interval: string    // InspectionInterval
  item: string        // PeriodicItems
  inspdate: string    // DateOfInspection
  content: string     // InspectionDetails
  
}

// Maps to SparePartDto (SpareParts) - gộp cả spare part + failure/repair history
export interface SparePart {
  id: string
  name: string        // PartName
  partnum: string     // PartNumber
  spec: string        // Specification
  qty: string         // Quantity
  replacement: string // ReplacementParts
  failure: string     // FailureHistory
  inspector: string   // Inspector
  remarks: string     // Remarks
}

// Inspection chỉ dùng nội bộ FE để hiển thị bảng lịch sử KT/SC (lấy từ SparePart)
export interface Inspection {
  id: string
  date: string
  detail: string
  failure: string
  replacement: string
  inspector: string
  remarks: string
}

export interface Equipment {
  id: string
  // VINATech section
  appmodel: string
  opcond: OpCond
  ctrlnum: string
  eqtype: string
  location: string
  person: string
  instdate: string
  value: string
  // Manufacturer section
  mfgname: string
  eqtitle: string
  model: string
  serial: string
  mfgdate: string
  weight: string
  power: string
  size: string
  makeraddr: string
  photo1?: string
  photo2?: string
  // Sub-records
  periodicItems: PeriodicItem[]
  spareParts: SparePart[]
  inspections: Inspection[]   // FE-only: hiển thị bảng Date/Detail từ PeriodicInspections
  _serverImages?: { id: number | string; type: boolean }[]
}

export interface User {
  id: string
  username: string
  name: string
  role: string
  avatar?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
  role?: string
}

export interface AuditLog {
  id: number;
  equipmentId?: number; // Trường đã có
  equipmentTitle?: string;  // THÊM DÒNG NÀY
  controlNumber?: string;   // THÊM DÒNG NÀY
  entityName: string;
  propertyName: string;
  oldValue: string | null;
  newValue: string | null;
  action: string;
  updatedBy: string;
  updatedAt: string;
  installationLocation?: string;
}
// src/types/index.ts
export interface PagedResult<T> {
  items: T[];
  totalCount: number; // Đổi từ totalItems thành totalCount (chữ t viết thường)
  pageSize: number;
  currentPage: number;
  totalPages: number;
  auditStats: AuditStats | null;
}
export interface AuditStats {
  total: number;
  new24h: number;
  deleted: number;
}