/* eslint-disable prettier/prettier */
import React from 'react'
import { matchesSearch } from '../../utils/settingsSearch'

interface SliderProps {
  label: string
  description?: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  disabled?: boolean
  searchQuery?: string
  searchKeywords?: string[]
}

export default function Slider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  searchQuery,
  searchKeywords
}: SliderProps): React.ReactElement | null {
  if (!matchesSearch(searchQuery ?? '', [label, description, ...(searchKeywords ?? [])])) {
    return null
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-sm font-medium text-text-primary">{label}</label>
          {description && (
            <p className="text-xs text-text-muted mt-1">{description}</p>
          )}
        </div>
        <span className="text-sm font-mono text-amber px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((value - min) / (max - min)) * 100}%, var(--bg-tertiary) ${((value - min) / (max - min)) * 100}%, var(--bg-tertiary) 100%)`
        }}
      />
    </div>
  )
}

