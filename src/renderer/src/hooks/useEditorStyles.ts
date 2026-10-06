import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useSettings } from '../contexts/SettingsContext'

export function useEditorStyles(): {
  editorStyles: CSSProperties
  editorClasses: string
} {
  const { settings } = useSettings()

  const editorStyles = useMemo((): CSSProperties => {
    const appearance = settings.editor.appearance

    // Mapeo de fuentes a sus nombres CSS
    // Nota: Cascadia Code, Consolas, Monaco, Menlo y Courier New son fuentes del sistema
    const fontFamilyMap: Record<string, string> = {
      // Monospace
      'JetBrains Mono': "'JetBrains Mono', ui-monospace, monospace",
      'Fira Code': "'Fira Code', ui-monospace, monospace",
      'Source Code Pro': "'Source Code Pro', ui-monospace, monospace",
      'Cascadia Code': "'Cascadia Code', 'Consolas', ui-monospace, monospace",
      Consolas: "'Consolas', 'Courier New', monospace",
      Monaco: "'Monaco', 'Menlo', ui-monospace, monospace",
      Menlo: "'Menlo', 'Monaco', ui-monospace, monospace",
      'Courier New': "'Courier New', monospace",
      'Ubuntu Mono': "'Ubuntu Mono', ui-monospace, monospace",
      'Roboto Mono': "'Roboto Mono', ui-monospace, monospace",
      Inconsolata: "'Inconsolata', ui-monospace, monospace",
      'Space Mono': "'Space Mono', ui-monospace, monospace",
      'IBM Plex Mono': "'IBM Plex Mono', ui-monospace, monospace",
      Hack: "'Hack', ui-monospace, monospace",
      'Anonymous Pro': "'Anonymous Pro', ui-monospace, monospace",
      // Sans-serif
      'DM Sans': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      Inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      Roboto: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
      'Open Sans': "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      Lato: "'Lato', -apple-system, BlinkMacSystemFont, sans-serif",
      Montserrat: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
      Poppins: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      Raleway: "'Raleway', -apple-system, BlinkMacSystemFont, sans-serif",
      // Custom
      custom: `'${appearance.customFontFamily}', ui-monospace, monospace`
    }

    return {
      fontFamily:
        fontFamilyMap[appearance.fontFamily] || "'JetBrains Mono', ui-monospace, monospace",
      fontSize: `${appearance.fontSize}px`,
      lineHeight: appearance.lineHeight,
      maxWidth: appearance.maxTextWidth ? '800px' : '100%',
      margin: appearance.maxTextWidth ? '0 auto' : '0'
    }
  }, [settings.editor.appearance])

  const editorClasses = useMemo(() => {
    const classes: string[] = []

    if (settings.editor.appearance.lineNumbers) {
      classes.push('show-line-numbers')
    }

    if (settings.editor.appearance.highlightActiveLine) {
      classes.push('highlight-active-line')
    }

    if (!settings.editor.appearance.wordWrap) {
      classes.push('no-word-wrap')
    }

    return classes.join(' ')
  }, [
    settings.editor.appearance.lineNumbers,
    settings.editor.appearance.highlightActiveLine,
    settings.editor.appearance.wordWrap
  ])

  return { editorStyles, editorClasses }
}
