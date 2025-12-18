/* eslint-disable prettier/prettier */
import React from 'react'

interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function Toggle({ label, description, checked, onChange, disabled = false }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <label className="text-sm font-medium text-text-primary cursor-pointer" onClick={() => !disabled && onChange(!checked)}>
          {label}
        </label>
        {description && (
          <p className="text-xs text-text-muted mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 focus:ring-offset-ink-800 ${
          checked 
            ? 'bg-amber border-amber' 
            : 'bg-ink-600 border-ink-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked 
              ? 'translate-x-5' 
              : 'translate-x-0 border'
          }`}
          style={checked 
            ? { backgroundColor: 'var(--text-primary)' }
            : { backgroundColor: 'var(--text-primary)', borderColor: 'var(--border-default)', opacity: 0.5 }
          }
        />
      </button>
    </div>
  )
}

