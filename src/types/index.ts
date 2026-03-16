export type OpCond = 'Good' | 'Warning' | 'Bad'

export interface Inspection {
  id: string
  date: string
  detail: string
  failure: string
  replacement: string
  inspector: string
  remarks: string
}

export interface SparePart {
  id: string
  name: string
  partnum: string
  spec: string
  qty: string
}

export interface PeriodicItem {
  id: string
  interval: string
  item: string
  inspdate: string
  content: string
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
  inspections: Inspection[]
  spareParts: SparePart[]
}

export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'user' | 'staff' // adjust roles as needed
  avatar?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

