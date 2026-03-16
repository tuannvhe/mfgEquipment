import { Tag } from 'antd'
import type { OpCond } from '../types'

const CONFIG: Record<OpCond, { color: string; label: string }> = {
  Good:    { color: 'success', label: 'Tốt' },
  Warning: { color: 'warning', label: 'Theo dõi' },
  Bad:     { color: 'error',   label: 'Hỏng/Sửa' },
}

export default function StatusBadge({ status }: { status: OpCond }) {
  const cfg = CONFIG[status] ?? CONFIG.Good
  return <Tag color={cfg.color} className="font-medium">{cfg.label}</Tag>
}
