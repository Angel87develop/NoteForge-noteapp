/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { matchesSearch } from '../../../utils/settingsSearch'
import SettingsGroup from '../SettingsGroup'

interface AboutSettingsProps {
  searchQuery?: string
}

export default function AboutSettings({ searchQuery = '' }: AboutSettingsProps): React.ReactElement {
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
    window.open('https://github.com/Angel87develop/NoteForge-noteapp/issues', '_blank')
  }

  const handleResetSettings = (): void => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings()
    }
  }

  const showAppName = matchesSearch(searchQuery, ['app name', 'application', 'noteforge', settings.about.appName])
  const showVersion = matchesSearch(searchQuery, ['version', settings.about.version])
  const showChangelog = matchesSearch(searchQuery, ['changelog', settings.about.changelog])
  const showLicense = matchesSearch(searchQuery, ['license', settings.about.license])
  const showOpenDataFolder = matchesSearch(searchQuery, ['open data folder', 'data folder', 'storage', 'notes folder'])
  const showReportBug = matchesSearch(searchQuery, ['report bug', 'bug', 'issue', 'github'])
  const showReset = matchesSearch(searchQuery, ['reset settings', 'reset', 'default values'])

  return (
    <div className="space-y-8">
      <SettingsGroup title="Application Information">
        {showAppName && (
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">App name</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.appName}</p>
          </div>
        )}

        {showVersion && (
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Version</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.version}</p>
          </div>
        )}

        {showChangelog && (
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Changelog</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.changelog}</p>
          </div>
        )}

        {showLicense && (
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">License</label>
            <p className="text-sm text-text-primary mt-1">{settings.about.license}</p>
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup title="Actions">
        {showOpenDataFolder && (
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
        )}

        {showReportBug && (
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
        )}

        {showReset && (
          <button
            onClick={handleResetSettings}
            className="w-full px-4 py-2.5 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400 hover:border-red-600 hover:bg-red-900/30 transition-all text-left"
          >
            Reset Settings to default values
          </button>
        )}
      </SettingsGroup>
    </div>
  )
}
