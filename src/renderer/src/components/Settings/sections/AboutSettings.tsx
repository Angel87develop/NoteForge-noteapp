/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../contexts/SettingsContext'

export default function AboutSettings(): React.ReactElement {
  const { settings, resetSettings } = useSettings()

  const handleOpenDataFolder = async (): Promise<void> => {
    if (window.api) {
      try {
        const result = await window.api.openDataFolder()
        if (!result.success) {
          console.error('Error opening data folder:', result.error)
        }
      } catch (error) {
        console.error('Error opening data folder:', error)
      }
    }
  }

  const handleReportBug = (): void => {
    // Open bug report URL
    window.open('https://github.com/Angel87develop/NoteForge-noteapp/issues', '_blank')
  }

  const handleResetSettings = (): void => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings()
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Application Information</h3>
        <div className="space-y-4 border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">App name</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.appName}</p>
          </div>
          
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Version</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.version}</p>
          </div>
          
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Changelog</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.changelog}</p>
          </div>
          
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">License</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.license}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Actions</h3>
        <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={handleOpenDataFolder}
            className="w-full px-4 py-2.5 border rounded-lg text-sm text-text-primary transition-all text-left"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
            onMouseEnter={(e) => { 
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => { 
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
            }}
          >
            Open Data Folder
          </button>
          
          <button
            onClick={handleReportBug}
            className="w-full px-4 py-2.5 border rounded-lg text-sm text-text-primary transition-all text-left"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
            onMouseEnter={(e) => { 
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => { 
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
            }}
          >
            Report Bug
          </button>
          
          <button
            onClick={handleResetSettings}
            className="w-full px-4 py-2.5 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400 hover:border-red-600 hover:bg-red-900/30 transition-all text-left"
          >
            Reset Settings to default values
          </button>
        </div>
      </div>
    </div>
  )
}

