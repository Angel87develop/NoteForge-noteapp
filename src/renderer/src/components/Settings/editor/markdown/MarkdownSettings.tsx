/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../../contexts/SettingsContext'
import { MarkdownDialect } from '../../../../types/settings'
import Toggle from '../../Toggle'
import Select from '../../Select'

export default function MarkdownSettings(): React.ReactElement {
  const { settings, updateMarkdownSettings } = useSettings()

  return (
    <div className="space-y-1 border-t border-ink-700 pt-4">
      <Select
        label="Dialect selection"
        value={settings.editor.markdown.dialect}
        options={[
          { value: 'commonmark', label: 'CommonMark' },
          { value: 'gfm', label: 'GitHub Flavored Markdown' }
        ]}
        onChange={(value) => updateMarkdownSettings({ dialect: value as MarkdownDialect })}
      />
      
      <Toggle
        label="Tables"
        checked={settings.editor.markdown.tables}
        onChange={(checked) => updateMarkdownSettings({ tables: checked })}
      />
      
      <Toggle
        label="Task lists"
        checked={settings.editor.markdown.taskLists}
        onChange={(checked) => updateMarkdownSettings({ taskLists: checked })}
      />
      
      <Toggle
        label="Footnotes"
        checked={settings.editor.markdown.footnotes}
        onChange={(checked) => updateMarkdownSettings({ footnotes: checked })}
      />
      
      <Toggle
        label="Math support (KaTeX / LaTeX)"
        checked={settings.editor.markdown.mathSupport}
        onChange={(checked) => updateMarkdownSettings({ mathSupport: checked })}
      />
      
      <Toggle
        label="Embedded HTML rendering"
        checked={settings.editor.markdown.htmlEmbedded}
        onChange={(checked) => updateMarkdownSettings({ htmlEmbedded: checked })}
      />
    </div>
  )
}

