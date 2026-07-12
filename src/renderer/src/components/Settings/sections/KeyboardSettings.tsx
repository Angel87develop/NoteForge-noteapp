/* eslint-disable prettier/prettier */
import React, { useState } from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { matchesSearch } from '../../../utils/settingsSearch'
import SettingsGroup from '../SettingsGroup'

interface KeyboardSettingsProps {
  searchQuery?: string
}

export default function KeyboardSettings({ searchQuery = '' }: KeyboardSettingsProps): React.ReactElement {
  const { settings, updateKeyboardSettings } = useSettings()
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)

  const handleShortcutChange = (shortcutId: string, newKey: string): void => {
    const updatedShortcuts = settings.keyboard.shortcuts.map((s) =>
      s.id === shortcutId ? { ...s, currentKey: newKey } : s
    )
    updateKeyboardSettings({ shortcuts: updatedShortcuts })
  }

  const formatKeyCombo = (e: React.KeyboardEvent<HTMLInputElement>): string => {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')

    if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      return ''
    }

    let key = e.key
    if (key === ' ') key = 'Space'
    if (key === 'Tab') key = 'Tab'
    if (key === 'Enter') key = 'Enter'
    if (key === 'Escape') key = 'Esc'
    if (key === 'ArrowUp') key = 'Up'
    if (key === 'ArrowDown') key = 'Down'
    if (key === 'ArrowLeft') key = 'Left'
    if (key === 'ArrowRight') key = 'Right'

    if (key.length === 1) {
      key = key.toUpperCase()
    } else {
      key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
    }

    parts.push(key)
    return parts.join('+')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, shortcutId: string): void => {
    e.preventDefault()
    e.stopPropagation()

    const keyCombo = formatKeyCombo(e)
    if (keyCombo) {
      handleShortcutChange(shortcutId, keyCombo)
      setEditingShortcut(null)
    }
  }

  const visibleShortcuts = settings.keyboard.shortcuts.filter((shortcut) =>
    matchesSearch(searchQuery, [
      shortcut.name,
      shortcut.currentKey,
      shortcut.defaultKey,
      'keyboard',
      'shortcut'
    ])
  )

  const showImportExport = matchesSearch(searchQuery, [
    'import shortcuts',
    'export shortcuts',
    'import',
    'export'
  ])

  return (
    <div className="space-y-8">
      <SettingsGroup title="Keyboard Shortcuts">
        {visibleShortcuts.map((shortcut) => (
          <div key={shortcut.id} className="flex items-center justify-between py-3 border-b border-ink-700 last:border-0">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-primary">{shortcut.name}</label>
            </div>
            <div className="flex items-center gap-2">
              {editingShortcut === shortcut.id ? (
                <input
                  type="text"
                  value={shortcut.currentKey}
                  readOnly
                  onKeyDown={(e) => handleKeyDown(e, shortcut.id)}
                  onBlur={() => setEditingShortcut(null)}
                  className="px-3 py-1.5 bg-ink-800 border border-amber rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber/20 w-32 cursor-pointer"
                  placeholder="Press a key combination..."
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setEditingShortcut(shortcut.id)}
                  className="px-3 py-1.5 bg-ink-800 border border-ink-600 rounded text-sm text-text-primary hover:border-amber transition-all w-32 text-left"
                >
                  {shortcut.currentKey}
                </button>
              )}
              <button
                onClick={() => handleShortcutChange(shortcut.id, shortcut.defaultKey)}
                className="text-xs text-text-muted hover:text-amber transition-colors"
                title="Restore default value"
              >
                Reset
              </button>
            </div>
          </div>
        ))}
      </SettingsGroup>

      {showImportExport && (
        <div className="flex gap-3 pt-4 border-t border-ink-700">
          <button className="px-4 py-2 bg-ink-800 border border-ink-600 rounded-lg text-sm text-text-primary hover:border-amber transition-all">
            Import shortcuts
          </button>
          <button className="px-4 py-2 bg-ink-800 border border-ink-600 rounded-lg text-sm text-text-primary hover:border-amber transition-all">
            Export shortcuts
          </button>
        </div>
      )}
    </div>
  )
}
