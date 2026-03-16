import { Button, Input, Table } from 'antd'
import { Plus, X } from 'lucide-react'
import type { PeriodicItem } from '../types'
import { uid } from '../store/useStore'

interface Props {
  value: PeriodicItem[]
  onChange: (v: PeriodicItem[]) => void
}

export default function PeriodicTable({ value, onChange }: Props) {
  const set = (id: string, key: keyof PeriodicItem, val: string) =>
    onChange(value.map(r => (r.id === id ? { ...r, [key]: val } : r)))

  const del = (id: string) => onChange(value.filter(r => r.id !== id))

  const add = () =>
    onChange([...value, { id: uid(), interval: '', item: '' }])

  const columns = [
    {
      title: 'Chu kỳ kiểm tra',
      dataIndex: 'interval',
      width: 140,
      render: (v: string, row: PeriodicItem) => (
        <Input size="small" value={v} placeholder="Chu kỳ..." onChange={e => set(row.id, 'interval', e.target.value)} />
      ),
    },
    {
      title: 'Các hạng mục kiểm tra định kỳ',
      dataIndex: 'item',
      render: (v: string, row: PeriodicItem) => (
        <Input size="small" value={v} placeholder="Nội dung..." onChange={e => set(row.id, 'item', e.target.value)} />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_: unknown, row: PeriodicItem) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<X size={13} />}
          onClick={() => del(row.id)}
        />
      ),
    },
  ]

  // Default to 4 empty rows if value is empty
  const displayValue = value && value.length > 0 ? value : Array.from({ length: 4 }).map(() => ({ id: uid(), interval: '', item: '' }))

  // Ensure onChange is called to save the empty rows if they were generated
  // However, it's better to just display them and not mutate the parent state until they type something.
  // Wait, if we want them to act exactly like normal rows where they can type,
  // we could just initialize them in EquipmentForm if they are not present.
  // Here we just render value.

  return (
    <div>
      <Table
        size="small"
        dataSource={value}
        columns={columns}
        rowKey="id"
        pagination={false}
        className="mb-2"
        bordered
        rowClassName={(_, idx) => (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')}
        locale={{ emptyText: 'Chưa có hạng mục' }}
      />
      <Button
        type="dashed"
        block
        icon={<Plus size={13} />}
        onClick={add}
        className="text-slate-500"
      >
        Thêm hạng mục
      </Button>
    </div>
  )
}
