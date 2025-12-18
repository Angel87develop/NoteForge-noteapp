/* eslint-disable prettier/prettier */
import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  description?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export default function Select({ label, description, value, options, onChange, disabled = false }: SelectProps): React.ReactElement {
  return (
    <div className="py-3">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-muted mb-2">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={{ 
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)'
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

