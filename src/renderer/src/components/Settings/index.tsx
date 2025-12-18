/* eslint-disable prettier/prettier */
import React, { useState } from 'react'
import EditorSettings from './sections/EditorSettings'
import KeyboardSettings from './sections/KeyboardSettings'
import UISettings from './sections/UISettings'
import AboutSettings from './sections/AboutSettings'

type SettingsSection = 'editor' | 'keyboard' | 'ui' | 'about'

interface SettingsProps {
  onClose: () => void
}

const sections: Array<{ id: SettingsSection; label: string; icon: React.ReactNode }> = [
  {
    id: 'editor',
    label: 'Markdown Editor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'keyboard',
    label: 'Keyboard Shortcuts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="17" cy="10" r="1" fill="currentColor" />
        <rect x="4" y="14" width="16" height="2" rx="1" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'ui',
    label: 'UI',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'about',
    label: 'About the Application',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
]

export default function Settings({ onClose }: SettingsProps): React.ReactElement {
  const [activeSection, setActiveSection] = useState<SettingsSection>('editor')
  const [searchQuery, setSearchQuery] = useState('')

  const renderSection = (): React.ReactElement => {
    switch (activeSection) {
      case 'editor':
        return <EditorSettings />
      case 'keyboard':
        return <KeyboardSettings />
      case 'ui':
        return <UISettings />
      case 'about':
        return <AboutSettings />
      default:
        return <EditorSettings />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full h-full flex" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        {/* Categories Sidebar */}
        <div className="w-64 border-r flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)' }}>
          {/* Header */}
          <div className="p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-semibold text-text-primary">Settings</h2>
              <button
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary rounded transition-all"
                style={{ '--hover-bg': 'var(--bg-hover)' } as React.CSSProperties}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="relative">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-amber/20"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              />
            </div>
          </div>

          {/* Sections List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'border-l-2 text-text-primary'
                    : 'text-text-primary'
                }`}
                style={activeSection === section.id 
                  ? { backgroundColor: 'var(--accent-glow)', borderLeftColor: 'var(--accent-primary)' }
                  : {}
                }
                onMouseEnter={(e) => {
                  if (activeSection !== section.id) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span className={activeSection === section.id ? 'text-amber' : 'text-text-primary'}>
                  {section.icon}
                </span>
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h3 className="text-2xl font-serif font-semibold text-text-primary">
              {sections.find((s) => s.id === activeSection)?.label}
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
            <div className="max-w-3xl">{renderSection()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

