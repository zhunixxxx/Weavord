import type { SortField, SortOrder } from '../types/word'

interface SortControlsProps {
  field: SortField
  order: SortOrder
  onChange: (field: SortField) => void
}

const OPTIONS: { field: SortField; label: string }[] = [
  { field: 'alpha', label: '首字母' },
  { field: 'date', label: '添加日期' },
  { field: 'proficiency', label: '熟练度' },
]

export default function SortControls({ field, order, onChange }: SortControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = field === opt.field
        return (
          <button
            key={opt.field}
            type="button"
            onClick={() => onChange(opt.field)}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
            {active && (
              <span className="text-xs opacity-80">{order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
