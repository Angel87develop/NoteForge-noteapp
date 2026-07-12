/* eslint-disable prettier/prettier */
import { Settings, defaultSettings } from '../types/settings'

const SETTINGS_KEY = 'noteforge-settings'

export const loadSettings = (): Settings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      
      // Migrar nombres de shortcuts de español a inglés y eliminar shortcuts obsoletos
      let shortcuts = parsed.keyboard?.shortcuts || defaultSettings.keyboard.shortcuts
      shortcuts = shortcuts.map((shortcut: any) => {
        // Migrar nombres en español a inglés
        const nameMap: Record<string, string> = {
          'Crear nota': 'Create note',
          'Cambiar nota': 'Switch note',
          'Modo enfoque': 'Focus mode'
        }
        
        // Actualizar nombre si está en el mapa
        if (nameMap[shortcut.name]) {
          shortcut.name = nameMap[shortcut.name]
        }
        
        return shortcut
      })
      
      // Eliminar shortcut de "Modo enfoque" (focus-mode)
      shortcuts = shortcuts.filter((shortcut: any) => shortcut.id !== 'focus-mode')
      
      // Asegurar que todos los shortcuts requeridos existan
      const requiredShortcutIds = ['new-note', 'switch-note', 'toggle-preview', 'toggle-sidebar']
      const existingIds = shortcuts.map((s: any) => s.id)
      
      requiredShortcutIds.forEach((id) => {
        if (!existingIds.includes(id)) {
          const defaultShortcut = defaultSettings.keyboard.shortcuts.find(s => s.id === id)
          if (defaultShortcut) {
            shortcuts.push(defaultShortcut)
          }
        }
      })
      
      // Merge con defaults para asegurar que todas las propiedades existan
      return {
        ...defaultSettings,
        ...parsed,
        editor: {
          ...defaultSettings.editor,
          ...parsed.editor,
          appearance: {
            ...defaultSettings.editor.appearance,
            ...parsed.editor?.appearance
          },
          behavior: {
            ...defaultSettings.editor.behavior,
            ...parsed.editor?.behavior
          },
          markdown: {
            ...defaultSettings.editor.markdown,
            ...parsed.editor?.markdown
          }
        },
        keyboard: {
          ...defaultSettings.keyboard,
          ...parsed.keyboard,
          profile: ['vim', 'emacs'].includes(parsed.keyboard?.profile)
            ? 'default'
            : (parsed.keyboard?.profile ?? defaultSettings.keyboard.profile),
          shortcuts
        },
        ui: {
          ...defaultSettings.ui,
          ...parsed.ui,
          theme: {
            ...defaultSettings.ui.theme,
            ...parsed.ui?.theme
          },
          visibility: {
            ...defaultSettings.ui.visibility,
            ...parsed.ui?.visibility
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return defaultSettings
}

export const saveSettings = (settings: Settings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

export const resetSettings = (): Settings => {
  saveSettings(defaultSettings)
  return defaultSettings
}

