/* eslint-disable prettier/prettier */
import React from 'react'
import { useSettings } from '../../../contexts/SettingsContext'
import { EditorView, MarkdownDialect } from '../../../types/settings'
import Toggle from '../Toggle'
import Slider from '../Slider'
import Select from '../Select'
import Input from '../Input'
import SettingsGroup from '../SettingsGroup'

interface EditorSettingsProps {
  searchQuery?: string
}

export default function EditorSettings({ searchQuery = '' }: EditorSettingsProps): React.ReactElement {
  const { settings, updateEditorAppearance, updateEditorBehavior, updateMarkdownSettings } = useSettings()

  return (
    <div className="space-y-8">
      <SettingsGroup title="Editor Appearance">
        <Slider
          searchQuery={searchQuery}
          label="Font size"
          value={settings.editor.appearance.fontSize}
          min={10}
          max={24}
          unit="px"
          onChange={(value) => updateEditorAppearance({ fontSize: value })}
        />

        <Select
          searchQuery={searchQuery}
          label="Font family"
          description="Select a font for the entire application"
          value={settings.editor.appearance.fontFamily}
          options={[
            { value: 'JetBrains Mono', label: 'JetBrains Mono' },
            { value: 'Fira Code', label: 'Fira Code' },
            { value: 'Source Code Pro', label: 'Source Code Pro' },
            { value: 'Cascadia Code', label: 'Cascadia Code' },
            { value: 'Consolas', label: 'Consolas' },
            { value: 'Monaco', label: 'Monaco' },
            { value: 'Menlo', label: 'Menlo' },
            { value: 'Courier New', label: 'Courier New' },
            { value: 'Ubuntu Mono', label: 'Ubuntu Mono' },
            { value: 'Roboto Mono', label: 'Roboto Mono' },
            { value: 'Inconsolata', label: 'Inconsolata' },
            { value: 'Space Mono', label: 'Space Mono' },
            { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
            { value: 'Hack', label: 'Hack' },
            { value: 'Anonymous Pro', label: 'Anonymous Pro' },
            { value: 'DM Sans', label: 'DM Sans' },
            { value: 'Inter', label: 'Inter' },
            { value: 'Roboto', label: 'Roboto' },
            { value: 'Open Sans', label: 'Open Sans' },
            { value: 'Lato', label: 'Lato' },
            { value: 'Montserrat', label: 'Montserrat' },
            { value: 'Poppins', label: 'Poppins' },
            { value: 'Raleway', label: 'Raleway' },
            { value: 'custom', label: 'Custom font...' }
          ]}
          onChange={(value) => updateEditorAppearance({ fontFamily: value as any })}
        />

        {settings.editor.appearance.fontFamily === 'custom' && (
          <Input
            searchQuery={searchQuery}
            label="Custom font"
            value={settings.editor.appearance.customFontFamily}
            onChange={(value) => updateEditorAppearance({ customFontFamily: value })}
            placeholder="e.g., JetBrains Mono, Fira Code..."
          />
        )}

        <Slider
          searchQuery={searchQuery}
          label="Line height"
          value={settings.editor.appearance.lineHeight}
          min={1}
          max={3}
          step={0.1}
          onChange={(value) => updateEditorAppearance({ lineHeight: value })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Maximum text width"
          description="Limits content width for better readability"
          checked={settings.editor.appearance.maxTextWidth}
          onChange={(checked) => updateEditorAppearance({ maxTextWidth: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Word wrap"
          description="Automatically wrap long lines"
          checked={settings.editor.appearance.wordWrap}
          onChange={(checked) => updateEditorAppearance({ wordWrap: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Line numbers"
          checked={settings.editor.appearance.lineNumbers}
          onChange={(checked) => updateEditorAppearance({ lineNumbers: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Highlight active line"
          checked={settings.editor.appearance.highlightActiveLine}
          onChange={(checked) => updateEditorAppearance({ highlightActiveLine: checked })}
        />
      </SettingsGroup>

      <SettingsGroup title="Behavior">
        <Select
          searchQuery={searchQuery}
          label="View"
          value={settings.editor.behavior.view}
          options={[
            { value: 'editor-only', label: 'Editor only' },
            { value: 'editor-preview', label: 'Editor + live preview' },
            { value: 'preview-only', label: 'Preview only' }
          ]}
          onChange={(value) => updateEditorBehavior({ view: value as EditorView })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Synchronized scroll editor / preview"
          checked={settings.editor.behavior.syncScroll}
          onChange={(checked) => updateEditorBehavior({ syncScroll: checked })}
          disabled={settings.editor.behavior.view !== 'editor-preview'}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Auto-save"
          checked={settings.editor.behavior.autoSave}
          onChange={(checked) => updateEditorBehavior({ autoSave: checked })}
        />

        {settings.editor.behavior.autoSave && (
          <Slider
            searchQuery={searchQuery}
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
          searchQuery={searchQuery}
          label="Confirm when closing unsaved notes"
          checked={settings.editor.behavior.confirmOnClose}
          onChange={(checked) => updateEditorBehavior({ confirmOnClose: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Restore previous session on startup"
          checked={settings.editor.behavior.restoreSession}
          onChange={(checked) => updateEditorBehavior({ restoreSession: checked })}
        />
      </SettingsGroup>

      <SettingsGroup title="Markdown">
        <Select
          searchQuery={searchQuery}
          label="Dialect selection"
          value={settings.editor.markdown.dialect}
          options={[
            { value: 'commonmark', label: 'CommonMark' },
            { value: 'gfm', label: 'GitHub Flavored Markdown' }
          ]}
          onChange={(value) => updateMarkdownSettings({ dialect: value as MarkdownDialect })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Tables"
          checked={settings.editor.markdown.tables}
          onChange={(checked) => updateMarkdownSettings({ tables: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Task lists"
          checked={settings.editor.markdown.taskLists}
          onChange={(checked) => updateMarkdownSettings({ taskLists: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Footnotes"
          checked={settings.editor.markdown.footnotes}
          onChange={(checked) => updateMarkdownSettings({ footnotes: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Math support (KaTeX / LaTeX)"
          checked={settings.editor.markdown.mathSupport}
          onChange={(checked) => updateMarkdownSettings({ mathSupport: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Diagrams (Mermaid)"
          checked={settings.editor.markdown.diagrams}
          onChange={(checked) => updateMarkdownSettings({ diagrams: checked })}
        />

        <Toggle
          searchQuery={searchQuery}
          label="Embedded HTML rendering"
          checked={settings.editor.markdown.htmlEmbedded}
          onChange={(checked) => updateMarkdownSettings({ htmlEmbedded: checked })}
        />
      </SettingsGroup>
    </div>
  )
}
