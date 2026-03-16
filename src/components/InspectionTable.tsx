import { Button, DatePicker, Input, Table } from 'antd'
import { Plus, X } from 'lucide-react'
import dayjs from 'dayjs'
import type { Inspection } from '../types'
import { uid } from '../store/useStore'

interface Props {
  value: Inspection[]
  onChange: (v: Inspection[]) => void
}

export default function InspectionTable({ value, onChange }: Props) {
  const set = (id: string, key: keyof Inspection, val: string) =>
    onChange(value.map(r => (r.id === id ? { ...r, [key]: val } : r)))

  const del = (id: string) => onChange(value.filter(r => r.id !== id))

  const add = () =>
    onChange([
      ...value,
      { id: uid(), date: '', detail: '', failure: '', replacement: '', inspector: '', remarks: '' },
    ])

  const columns = [
    {
      title: 'Ngày KT',
      dataIndex: 'date',
      width: 140,
      render: (v: string, row: Inspection) => (
        <DatePicker
          size="small"
          value={v ? dayjs(v) : null}
          format="YYYY-MM-DD"
          className="w-full"
          onChange={d => set(row.id, 'date', d ? d.format('YYYY-MM-DD') : '')}
        />
      ),
    },
    {
      title: 'Nội dung kiểm tra',
      dataIndex: 'detail',
      render: (v: string, row: Inspection) => (
        <Input size="small" value={v} placeholder="Nội dung..." onChange={e => set(row.id, 'detail', e.target.value)} />
      ),
    },
    {
      title: 'Lịch sử lỗi',
      dataIndex: 'failure',
      width: 160,
      render: (v: string, row: Inspection) => (
        <Input size="small" value={v} placeholder="Lịch sử lỗi" onChange={e => set(row.id, 'failure', e.target.value)} />
      ),
    },
    {
      title: 'Linh kiện thay thế',
      dataIndex: 'replacement',
      width: 180,
      render: (v: string, row: Inspection) => (
        <Input size="small" value={v} placeholder="Linh kiện thay" onChange={e => set(row.id, 'replacement', e.target.value)} />
      ),
    },
    {
      title: 'Người KT',
      dataIndex: 'inspector',
      width: 120,
      render: (v: string, row: Inspection) => (
        <Input size="small" value={v} placeholder="Người KT" onChange={e => set(row.id, 'inspector', e.target.value)} />
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'remarks',
      width: 140,
      render: (v: string, row: Inspection) => (
        <Input size="small" value={v} placeholder="Ghi chú" onChange={e => set(row.id, 'remarks', e.target.value)} />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_: unknown, row: Inspection) => (
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
        locale={{ emptyText: 'Chưa có bản ghi kiểm tra' }}
      />
      <Button
        type="dashed"
        block
        icon={<Plus size={13} />}
        onClick={add}
        className="text-slate-500"
      >
        Thêm dòng kiểm tra
      </Button>
    </div>
  )
}
