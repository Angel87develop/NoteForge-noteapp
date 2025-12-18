/* eslint-disable prettier/prettier */
export type Theme = 'light' | 'dark' | 'system'
export type MarkdownDialect = 'commonmark' | 'gfm'
export type EditorView = 'editor-only' | 'editor-preview' | 'preview-only'
export type UIDensity = 'compact' | 'normal' | 'comfortable'
export type IconSet = 'minimal' | 'outline' | 'filled'
export type KeyboardProfile = 'default' | 'vim' | 'emacs'

export type FontFamily = 
  | 'JetBrains Mono'
  | 'Fira Code'
  | 'Source Code Pro'
  | 'Cascadia Code'
  | 'Consolas'
  | 'Monaco'
  | 'Menlo'
  | 'Courier New'
  | 'Ubuntu Mono'
  | 'Roboto Mono'
  | 'Inconsolata'
  | 'Space Mono'
  | 'IBM Plex Mono'
  | 'Hack'
  | 'Anonymous Pro'
  | 'DM Sans'
  | 'Inter'
  | 'Roboto'
  | 'Open Sans'
  | 'Lato'
  | 'Montserrat'
  | 'Poppins'
  | 'Raleway'
  | 'custom'

export interface EditorAppearance {
  fontSize: number
  fontFamily: FontFamily
  customFontFamily: string
  lineHeight: number
  maxTextWidth: boolean
  wordWrap: boolean
  lineNumbers: boolean
  highlightActiveLine: boolean
}

export interface EditorBehavior {
  view: EditorView
  syncScroll: boolean
  autoSave: boolean
  autoSaveInterval: number // en segundos
  confirmOnClose: boolean
  restoreSession: boolean
}

export interface MarkdownSettings {
  dialect: MarkdownDialect
  tables: boolean
  taskLists: boolean
  footnotes: boolean
  mathSupport: boolean
  diagrams: boolean // Mermaid
  htmlEmbedded: boolean
}

export interface KeyboardShortcut {
  id: string
  name: string
  defaultKey: string
  currentKey: string
}

export interface KeyboardSettings {
  shortcuts: KeyboardShortcut[]
  profile: KeyboardProfile
}

export interface UITheme {
  theme: Theme
  borderRadius: number
  density: UIDensity
  animations: boolean
  animationSpeed: number // 0-100
}

export interface UIVisibility {
  showSidebar: boolean
  showNotesBar: boolean
  showTopBar: boolean
  iconSet: IconSet
}

export interface AboutInfo {
  appName: string
  version: string
  changelog: string
  license: string
}

export interface Settings {
  editor: {
    appearance: EditorAppearance
    behavior: EditorBehavior
    markdown: MarkdownSettings
  }
  keyboard: KeyboardSettings
  ui: {
    theme: UITheme
    visibility: UIVisibility
  }
  about: AboutInfo
}

export const defaultSettings: Settings = {
  editor: {
    appearance: {
      fontSize: 14,
      fontFamily: 'JetBrains Mono',
      customFontFamily: 'JetBrains Mono',
      lineHeight: 1.6,
      maxTextWidth: true,
      wordWrap: true,
      lineNumbers: true,
      highlightActiveLine: true
    },
    behavior: {
      view: 'editor-only',
      syncScroll: true,
      autoSave: true,
      autoSaveInterval: 3,
      confirmOnClose: true,
      restoreSession: true
    },
    markdown: {
      dialect: 'gfm',
      tables: true,
      taskLists: true,
      footnotes: true,
      mathSupport: false,
      diagrams: false,
      htmlEmbedded: false
    }
  },
  keyboard: {
    shortcuts: [
      { id: 'new-note', name: 'Create note', defaultKey: 'Ctrl+N', currentKey: 'Ctrl+N' },
      { id: 'switch-note', name: 'Switch note', defaultKey: 'Ctrl+Tab', currentKey: 'Ctrl+Tab' },
      { id: 'toggle-preview', name: 'Toggle preview', defaultKey: 'Ctrl+P', currentKey: 'Ctrl+P' },
      { id: 'toggle-sidebar', name: 'Toggle sidebar', defaultKey: 'Ctrl+B', currentKey: 'Ctrl+B' }
    ],
    profile: 'default'
  },
  ui: {
    theme: {
      theme: 'dark',
      borderRadius: 8,
      density: 'normal',
      animations: true,
      animationSpeed: 50
    },
    visibility: {
      showSidebar: true,
      showNotesBar: true,
      showTopBar: true,
      iconSet: 'outline'
    }
  },
  about: {
    appName: 'Inkdrop',
    version: '1.0.0',
    changelog: 'Initial release',
    license: 'MIT'
  }
}

