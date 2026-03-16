import { useMemo } from 'react'
import { Table, Tag } from 'antd'
import type { Equipment } from '../types'

interface Props { equipment: Equipment[] }

const SKIP = new Set(['không có', 'không', 'máy mới', ''])

export default function FailurePage({ equipment }: Props) {
  const rows = useMemo(
    () =>
      equipment
        .flatMap(e =>
          (e.inspections || [])
            .filter(i => !SKIP.has((i.failure || '').toLowerCase()))
            .map(i => ({
              key: i.id,
              date: i.date,
              eqname: e.eqtitle || e.mfgname,
              failure: i.failure,
              replacement: i.replacement,
              inspector: i.inspector,
              remarks: i.remarks,
            }))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [equipment]
  )

  const columns = [
    { title: 'Ngày',          dataIndex: 'date',        width: 110, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Thiết bị',      dataIndex: 'eqname',      render: (v: string) => <span className="font-medium">{v}</span> },
    { title: 'Mô tả lỗi',     dataIndex: 'failure',     render: (v: string) => <Tag color="error">{v}</Tag> },
    { title: 'Linh kiện thay',dataIndex: 'replacement' },
    { title: 'Người xử lý',   dataIndex: 'inspector',   width: 130 },
    { title: 'Ghi chú',       dataIndex: 'remarks',     render: (v: string) => <span className="text-slate-500">{v}</span> },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Table
        size="small"
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20 }}
        bordered={false}
        locale={{ emptyText: 'Không có lỗi nào được ghi nhận' }}
        rowClassName={(_, idx) => idx % 2 === 0 ? '' : 'bg-danger-light/30'}
      />
    </div>
  )
}
