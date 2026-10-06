import React, { useState } from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { matchesSearch } from '../../../utils/settingsSearch'
import { KeyboardProfile } from '../../../types/settings'
import SettingsGroup from '../SettingsGroup'
import Select from '../Select'

interface KeyboardSettingsProps {
  searchQuery?: string
}

const vimNormalModeDocs: Array<{ keys: string; desc: string }> = [
  { keys: 'h / l', desc: 'Move left / right' },
  { keys: 'j / k', desc: 'Move down / up' },
  { keys: 'w / b / e', desc: 'Next word / prev word / end of word' },
  { keys: '0 / ^ / $', desc: 'Line start / first non-blank / line end' },
  { keys: 'gg / G', desc: 'Go to first line / last line' },
  { keys: '{ / }', desc: 'Prev / next paragraph' },
  { keys: 'i / a / I / A', desc: 'Insert before / after / line start / line end' },
  { keys: 'o / O', desc: 'Open line below / above (insert mode)' },
  { keys: 'x', desc: 'Delete character' },
  { keys: 'dd / dw / d$ / D', desc: 'Delete line / word / to end of line' },
  { keys: 'cc / cw / C', desc: 'Change line / word / to end of line' },
  { keys: 'yy / yw / y$', desc: 'Yank (copy) line / word / to end of line' },
  { keys: 'p / P', desc: 'Paste after / before cursor' },
  { keys: 'u / Ctrl+r', desc: 'Undo / redo' },
  { keys: 'v / V', desc: 'Visual mode (char / line selection)' },
  { keys: ':', desc: 'Command mode (:w save, :q, :wq)' },
  { keys: 'ZZ', desc: 'Save and quit (save note)' },
  { keys: 'Esc', desc: 'Back to normal mode / cancel' },
  { keys: '{count}+motion', desc: 'e.g. 3j moves down 3 lines, 5x deletes 5 chars' }
]

const vimInsertModeDocs: Array<{ keys: string; desc: string }> = [
  { keys: 'Esc / Ctrl+[', desc: 'Back to normal mode' },
  { keys: 'Ctrl+r', desc: 'Redo' }
]

export default function KeyboardSettings({
  searchQuery = ''
}: KeyboardSettingsProps): React.ReactElement {
  const { settings, updateKeyboardSettings } = useSettings()
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const profile = settings.keyboard.profile

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
      'shortcut',
      ...(profile === 'vim' ? ['vim'] : [])
    ])
  )

  const showImportExport = matchesSearch(searchQuery, [
    'import shortcuts',
    'export shortcuts',
    'import',
    'export'
  ])

  const showProfileSelector = matchesSearch(searchQuery, [
    'profile',
    'default',
    'vim',
    'keyboard',
    'mode'
  ])

  const showVimDocs =
    profile === 'vim' &&
    matchesSearch(searchQuery, [
      'vim',
      'normal mode',
      'insert mode',
      'visual mode',
      'command mode',
      'motions',
      'shortcuts'
    ])

  return (
    <div className="space-y-8">
      <SettingsGroup title="Keyboard Profile">
        {showProfileSelector && (
          <Select
            label="Profile"
            description="Default uses standard shortcuts. Vim enables Vim modes, motions and a status line in the editor."
            value={profile}
            options={[
              { value: 'default', label: 'Default' },
              { value: 'vim', label: 'Vim' }
            ]}
            onChange={(value) => updateKeyboardSettings({ profile: value as KeyboardProfile })}
          />
        )}
      </SettingsGroup>

      <SettingsGroup title="Keyboard Shortcuts">
        {visibleShortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex items-center justify-between py-3 border-b border-ink-700 last:border-0"
          >
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

      {showVimDocs && (
        <SettingsGroup title="Vim Mode Reference">
          <div className="text-xs text-text-muted mb-3">
            The editor starts in NORMAL mode. Type <code className="text-amber">i</code> to insert
            text,
            <code className="text-amber"> Esc</code> to go back. A status line below the editor
            shows the current mode, pending commands and messages.
          </div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Normal mode</h4>
          <div className="space-y-1">
            {vimNormalModeDocs.map((doc) => (
              <div key={doc.keys} className="flex items-baseline justify-between py-1 text-sm">
                <code className="text-amber font-mono text-xs whitespace-nowrap">{doc.keys}</code>
                <span className="text-text-muted text-xs ml-4">{doc.desc}</span>
              </div>
            ))}
          </div>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Insert mode</h4>
          <div className="space-y-1">
            {vimInsertModeDocs.map((doc) => (
              <div key={doc.keys} className="flex items-baseline justify-between py-1 text-sm">
                <code className="text-amber font-mono text-xs whitespace-nowrap">{doc.keys}</code>
                <span className="text-text-muted text-xs ml-4">{doc.desc}</span>
              </div>
            ))}
          </div>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Visual mode</h4>
          <div className="text-xs text-text-muted">
            Enter with <code className="text-amber">v</code> (or{' '}
            <code className="text-amber">V</code> for linewise). Move to extend the selection, then
            use <code className="text-amber">y</code> (yank),
            <code className="text-amber"> d</code> (delete), <code className="text-amber">x</code>{' '}
            or <code className="text-amber">c</code> (change).{' '}
            <code className="text-amber">Esc</code> exits.
          </div>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Command mode</h4>
          <div className="text-xs text-text-muted">
            <code className="text-amber">:w</code> save · <code className="text-amber">:q</code>{' '}
            quit (message) · <code className="text-amber">:wq</code> /{' '}
            <code className="text-amber">:x</code> save · <code className="text-amber">:h</code>{' '}
            help
          </div>
        </SettingsGroup>
      )}

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
