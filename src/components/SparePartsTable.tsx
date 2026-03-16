import { Button, Input, InputNumber, Table } from 'antd'
import { Plus, X } from 'lucide-react'
import type { SparePart } from '../types'
import { uid } from '../store/useStore'

interface Props {
  value: SparePart[]
  onChange: (v: SparePart[]) => void
}

export default function SparePartsTable({ value, onChange }: Props) {
  const set = (id: string, key: keyof SparePart, val: string) =>
    onChange(value.map(r => (r.id === id ? { ...r, [key]: val } : r)))

  const del = (id: string) => onChange(value.filter(r => r.id !== id))

  const add = () =>
    onChange([...value, { id: uid(), name: '', partnum: '', spec: '', qty: '' }])

  const columns = [
    {
      title: 'Tên linh kiện',
      dataIndex: 'name',
      render: (v: string, row: SparePart) => (
        <Input size="small" value={v} placeholder="Tên linh kiện" onChange={e => set(row.id, 'name', e.target.value)} />
      ),
    },
    {
      title: 'Số hiệu linh kiện',
      dataIndex: 'partnum',
      width: 160,
      render: (v: string, row: SparePart) => (
        <Input size="small" value={v} placeholder="Số hiệu" className="font-mono" onChange={e => set(row.id, 'partnum', e.target.value)} />
      ),
    },
    {
      title: 'Quy cách',
      dataIndex: 'spec',
      render: (v: string, row: SparePart) => (
        <Input size="small" value={v} placeholder="Quy cách" onChange={e => set(row.id, 'spec', e.target.value)} />
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'qty',
      width: 100,
      render: (v: string, row: SparePart) => (
        <InputNumber
          size="small"
          min={0}
          value={v ? Number(v) : undefined}
          placeholder="SL"
          className="w-full"
          onChange={val => set(row.id, 'qty', val?.toString() ?? '')}
        />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_: unknown, row: SparePart) => (
        <Button type="text" size="small" danger icon={<X size={13} />} onClick={() => del(row.id)} />
      ),
    },
  ]

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
        locale={{ emptyText: 'Chưa có phụ tùng dự phòng' }}
      />
      <Button type="dashed" block icon={<Plus size={13} />} onClick={add} className="text-slate-500">
        Thêm linh kiện
      </Button>
    </div>
  )
}
