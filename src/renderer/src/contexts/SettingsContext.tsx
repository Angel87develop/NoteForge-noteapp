/* eslint-disable prettier/prettier */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Settings, defaultSettings } from '../types/settings'
import { loadSettings, saveSettings } from '../utils/settingsStorage'

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  updateEditorAppearance: (updates: Partial<Settings['editor']['appearance']>) => void
  updateEditorBehavior: (updates: Partial<Settings['editor']['behavior']>) => void
  updateMarkdownSettings: (updates: Partial<Settings['editor']['markdown']>) => void
  updateKeyboardSettings: (updates: Partial<Settings['keyboard']>) => void
  updateUITheme: (updates: Partial<Settings['ui']['theme']>) => void
  updateUIVisibility: (updates: Partial<Settings['ui']['visibility']>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const updateEditorAppearance = (updates: Partial<Settings['editor']['appearance']>) => {
    setSettings((prev) => ({
      ...prev,
      editor: {
        ...prev.editor,
        appearance: { ...prev.editor.appearance, ...updates }
      }
    }))
  }

  const updateEditorBehavior = (updates: Partial<Settings['editor']['behavior']>) => {
    setSettings((prev) => ({
      ...prev,
      editor: {
        ...prev.editor,
        behavior: { ...prev.editor.behavior, ...updates }
      }
    }))
  }

  const updateMarkdownSettings = (updates: Partial<Settings['editor']['markdown']>) => {
    setSettings((prev) => ({
      ...prev,
      editor: {
        ...prev.editor,
        markdown: { ...prev.editor.markdown, ...updates }
      }
    }))
  }

  const updateKeyboardSettings = (updates: Partial<Settings['keyboard']>) => {
    setSettings((prev) => ({
      ...prev,
      keyboard: { ...prev.keyboard, ...updates }
    }))
  }

  const updateUITheme = (updates: Partial<Settings['ui']['theme']>) => {
    setSettings((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        theme: { ...prev.ui.theme, ...updates }
      }
    }))
  }

  const updateUIVisibility = (updates: Partial<Settings['ui']['visibility']>) => {
    setSettings((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        visibility: { ...prev.ui.visibility, ...updates }
      }
    }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateEditorAppearance,
        updateEditorBehavior,
        updateMarkdownSettings,
        updateKeyboardSettings,
        updateUITheme,
        updateUIVisibility,
        resetSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
