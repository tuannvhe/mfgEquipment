import { useMemo } from 'react'
import { Table } from 'antd'
import type { Equipment } from '../types'

interface Props { equipment: Equipment[] }

export default function SparePartsPage({ equipment }: Props) {
  const rows = useMemo(
    () =>
      equipment.flatMap(e =>
        (e.spareParts || []).map(s => ({
          key: s.id,
          eqname: e.eqtitle || e.mfgname,
          name: s.name,
          partnum: s.partnum,
          spec: s.spec,
          qty: s.qty,
        }))
      ),
    [equipment]
  )

  const columns = [
    { title: 'Thiết bị',             dataIndex: 'eqname',  render: (v: string) => <span className="font-medium text-slate-800">{v}</span> },
    { title: 'Tên linh kiện',        dataIndex: 'name' },
    { title: 'Số hiệu linh kiện',    dataIndex: 'partnum', render: (v: string) => <span className="font-mono text-[12px]">{v}</span> },
    { title: 'Quy cách',             dataIndex: 'spec' },
    { title: 'Số lượng',             dataIndex: 'qty',     width: 90, render: (v: string) => <span className="font-bold text-[#0047AB]">{v}</span> },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Table
        size="small"
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20 }}
        bordered={false}
        locale={{ emptyText: 'Chưa có phụ tùng dự phòng' }}
        rowClassName={(_, idx) => idx % 2 === 0 ? '' : 'bg-slate-50/50'}
      />
    </div>
  )
}
