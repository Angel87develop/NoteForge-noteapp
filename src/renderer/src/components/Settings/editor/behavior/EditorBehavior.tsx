/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../../contexts/SettingsContext'
import { EditorView } from '../../../../types/settings'
import Toggle from '../../Toggle'
import Slider from '../../Slider'
import Select from '../../Select'

export default function EditorBehavior(): React.ReactElement {
  const { settings, updateEditorBehavior } = useSettings()

  return (
    <div className="space-y-1 border-t border-ink-700 pt-4">
      <Select
        label="View"
        value={settings.editor.behavior.view}
        options={[
          { value: 'markdown', label: 'Markdown' },
          { value: 'dual', label: 'Dual' }
        ]}
        onChange={(value) => updateEditorBehavior({ view: value as EditorView })}
      />
      
      <Toggle
        label="Synchronized scroll editor / preview"
        checked={settings.editor.behavior.syncScroll}
        onChange={(checked) => updateEditorBehavior({ syncScroll: checked })}
        disabled={settings.editor.behavior.view !== 'dual'}
      />
      
      <Toggle
        label="Auto-save"
        checked={settings.editor.behavior.autoSave}
        onChange={(checked) => updateEditorBehavior({ autoSave: checked })}
      />
      
      {settings.editor.behavior.autoSave && (
        <Slider
          label="Auto-save interval"
          description="Time in seconds between automatic saves"
          value={settings.editor.behavior.autoSaveInterval}
          min={1}
          max={60}
          unit="s"
          onChange={(value) => updateEditorBehavior({ autoSaveInterval: value })}
        />
      )}
      
      <Toggle
        label="Confirm when closing unsaved notes"
        checked={settings.editor.behavior.confirmOnClose}
        onChange={(checked) => updateEditorBehavior({ confirmOnClose: checked })}
      />
      
      <Toggle
        label="Restore previous session on startup"
        checked={settings.editor.behavior.restoreSession}
        onChange={(checked) => updateEditorBehavior({ restoreSession: checked })}
      />
    </div>
  )
}

