import { useState, useEffect } from 'react'
import { Tag } from 'antd'
import { ChevronRight, PlusCircle } from 'lucide-react'
import type { Equipment } from '../types'
import StatusBadge from './StatusBadge'
import EquipmentForm from './EquipmentForm'

interface Props {
  eq: Equipment
  isNew?: boolean
  onSave: (eq: Equipment) => void
  onDelete: (id: string) => void
  defaultOpen?: boolean
}

export default function EquipmentRow({ eq, isNew = false, onSave, onDelete, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [localForm, setLocalForm] = useState<Equipment>({ ...eq })

  // Sync when external eq changes (after save)
  useEffect(() => {
    if (!isNew) setLocalForm({ ...eq })
  }, [eq, isNew])

  const handleSave = (data: Equipment) => {
    onSave(data)
    if (isNew) setOpen(false)
  }

  const handleDelete = (id: string) => {
    onDelete(id)
    setOpen(false)
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white transition-all duration-300 ${
        open ? 'shadow-xl ring-2 ring-[#4C9C2E]/30' : 'shadow-sm border border-slate-200 hover:shadow-lg'
      }`}
    >
      {/* ── Clickable header row ── */}
      <div
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-4 px-5 py-2 cursor-pointer select-none transition-colors ${
          open ? 'bg-[#f0f7f0]' : 'hover:bg-slate-50/50'
        }`}
      >
        {/* Chevron */}
        <span
          className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
          style={{ lineHeight: 0 }}
        >
          <ChevronRight size={18} />
        </span>

        {isNew ? (
          <span className="flex items-center gap-3 text-[#2d5f1b] font-bold text-[15px]">
            <PlusCircle size={20} className="text-[#4C9C2E]" />
            Thành lập hồ sơ thiết bị mới
          </span>
        ) : (
          <>
            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] text-primaryDark truncate leading-snug">
                {eq.eqtitle || eq.mfgname || 'Thiết bị không tên'}
              </div>
              <div className="font-mono text-[12px] text-primaryDark mt-1 flex gap-3 flex-wrap items-center">
                <span className="bg-primary/10 px-2 py-0.5 rounded  italic">{eq.model || 'N/A'}</span>
                {eq.serial && <span className="opacity-70">Serial: {eq.serial}</span>}
              </div>
            </div>

            {/* Meta chips */}
            <Tag color="#3d7a25" className="hidden sm:inline-block shrink-0 px-3 py-0.5 text-[12px] font-bold rounded-full border-none">
              {eq.eqtype}
            </Tag>
            <span className="hidden md:inline text-[14px] text-slate-500 shrink-0 font-semibold">{eq.location}</span>
            <StatusBadge status={eq.opcond} />
            {eq.instdate && (
              <span className="hidden lg:inline font-mono text-[12px] text-slate-400 shrink-0 border-l border-slate-200 pl-3">
                {eq.instdate}
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Expandable form ── */}
      {open && (
        <EquipmentForm
          initialData={localForm}
          isNew={isNew}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
