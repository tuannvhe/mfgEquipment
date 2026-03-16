import { useState, useCallback } from 'react'
import type { Equipment } from '../types'
import { exportToExcel } from '../utils/excelExport'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const SEED: Equipment[] = [
  {
    id: '1',
    appmodel: 'Big Size (B35,22)',
    opcond: 'Good',
    ctrlnum: '#17-A',
    eqtype: 'Riveting Assembly',
    location: 'Bắc Giang #1',
    person: 'Nguyễn Văn A',
    instdate: '2025-10-31',
    value: '348,840 USD',
    mfgname: 'HongYU',
    eqtitle: 'Super electro-piercing riveting assembly integrated machine',
    model: 'HY-JR3K-01',
    serial: '28100115001',
    mfgdate: '2025-10',
    weight: '10,000 Kg',
    power: '380VAC, 45KW',
    size: '2100x1900x1950',
    makeraddr: 'Hongyu Intelligent Equipment (Hong Kong) Co. Limited',
    inspections: [
      { id: 'i1', date: '2026-01-15', detail: 'Kiểm tra tổng thể định kỳ', failure: 'Không có', replacement: 'Không', inspector: 'Trần B', remarks: 'Bình thường' },
    ],
    periodicItems: [
      { id: 'p1', interval: 'Hàng ngày', item: 'Kiểm tra nguồn điện' },
    ],
    spareParts: [
      { id: 's1', name: 'Relay điện từ', partnum: 'HY-RLY-001', spec: '24VDC, 10A', qty: '2' },
    ],
  },
  {
    id: '2',
    appmodel: '',
    opcond: 'Warning',
    ctrlnum: '610-D',
    eqtype: 'Capacitor Assembly',
    location: 'Bắc Giang #1',
    person: 'Lê Thị C',
    instdate: '2025-12-10',
    value: '',
    mfgname: 'China',
    eqtitle: 'Capacitor Secondary Assembly Machine',
    model: 'LSK-ZY130B',
    serial: '2025010001',
    mfgdate: '2025-12',
    weight: '',
    power: '380V, 50HZ, 30KW',
    size: '800x784x90',
    makeraddr: '',
    inspections: [
      { id: 'i2', date: '2026-03-08', detail: 'Thử gọi hào phần chuẩn', failure: 'Máy mới', replacement: 'MITSUBISHI PLC Module', inspector: 'Tuấn', remarks: 'Đang thử nghiệm' },
      { id: 'i3', date: '2026-03-12', detail: 'Kiểm tra dây chạy ổn định', failure: 'Không', replacement: '1', inspector: 'Tuấn', remarks: 'Thử giản' },
    ],
    periodicItems: [
      { id: 'p2', interval: 'Hàng tháng', item: 'Tra mỡ trục xoay' },
    ],
    spareParts: [
      { id: 's2', name: 'PLC Module', partnum: 'MITS-PLC-02', spec: 'Mitsubishi FX3U', qty: '1' },
      { id: 's3', name: 'Cảm biến quang', partnum: 'SEN-OPT-05', spec: '24V NPN', qty: '4' },
    ],
  },
]

function loadFromStorage(): Equipment[] {
  try {
    const raw = localStorage.getItem('vt_equipment_v3')
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED
  } catch {
    return SEED
  }
}

export function useEquipmentStore() {
  const [equipment, setEquipment] = useState<Equipment[]>(loadFromStorage)

  const persist = useCallback((next: Equipment[]) => {
    localStorage.setItem('vt_equipment_v3', JSON.stringify(next))
    setEquipment(next)
  }, [])

  const saveEquipment = useCallback((eq: Equipment) => {
    const data = { ...eq, id: eq.id || uid() }
    setEquipment(prev => {
      const next = prev.find(e => e.id === data.id)
        ? prev.map(e => (e.id === data.id ? data : e))
        : [...prev, data]
      localStorage.setItem('vt_equipment_v3', JSON.stringify(next))
      return next
    })
    return data
  }, [])

  const deleteEquipment = useCallback((id: string) => {
    setEquipment(prev => {
      const next = prev.filter(e => e.id !== id)
      localStorage.setItem('vt_equipment_v3', JSON.stringify(next))
      return next
    })
  }, [])

  const exportExcel = useCallback((data: Equipment[]) => {
    exportToExcel(data, `VINATech_Equipment_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [])

  return { equipment, saveEquipment, deleteEquipment, exportExcel, persist }
}

export { uid }
