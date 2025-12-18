/* eslint-disable prettier/prettier */
interface InputProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number'
  disabled?: boolean
}

export default function Input({ 
  label, 
  description, 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  disabled = false 
}: InputProps) {
  return (
    <div className="py-3">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-muted mb-2">{description}</p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
      />
    </div>
  )
}

