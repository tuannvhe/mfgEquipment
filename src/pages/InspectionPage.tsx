import { useMemo } from 'react'
import { Table, Tag } from 'antd'
import type { Equipment, User } from '../types'

interface Props { 
  equipment: Equipment[]
  user: User
}

export default function InspectionPage({ equipment, user }: Props) {
  const rows = useMemo(
    () =>
      equipment
        .flatMap(e =>
          (e.inspections || []).map(ins => ({
            key: ins.id,
            date: ins.date,
            eqname: e.eqtitle || e.mfgname,
            model: e.model,
            detail: ins.detail,
            failure: ins.failure,
            replacement: ins.replacement,
            inspector: ins.inspector,
            remarks: ins.remarks,
          }))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [equipment]
  )

  const columns = [
    { title: 'Ngày KT',   dataIndex: 'date',        width: 110, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    {
      title: 'Thiết bị', dataIndex: 'eqname', width: 220,
      render: (v: string, r: typeof rows[0]) => (
        <div>
          <div className="font-semibold text-slate-800 text-[13px]">{v}</div>
          <div className="font-mono text-[10px] text-slate-400">{r.model}</div>
        </div>
      ),
    },
    { title: 'Nội dung kiểm tra', dataIndex: 'detail' },
    {
      title: 'Lịch sử lỗi', dataIndex: 'failure',
      render: (v: string) => {
        const skip = ['không có', 'không', 'máy mới', '']
        return skip.includes((v || '').toLowerCase())
          ? <span className="text-slate-400">{v}</span>
          : <Tag color="error">{v}</Tag>
      },
    },
    { title: 'Linh kiện thay', dataIndex: 'replacement' },
    { title: 'Người KT',       dataIndex: 'inspector', width: 120, render: (v: string) => <span className="font-medium">{v}</span> },
    { title: 'Ghi chú',        dataIndex: 'remarks',   render: (v: string) => <span className="text-slate-500">{v}</span> },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Table
        size="small"
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        bordered={false}
        scroll={{ x: 900 }}
        locale={{ emptyText: 'Chưa có bản ghi kiểm tra nào' }}
        rowClassName={(_, idx) => idx % 2 === 0 ? '' : 'bg-slate-50/50'}
      />
    </div>
  )
}
