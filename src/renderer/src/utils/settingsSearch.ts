/* eslint-disable prettier/prettier */
export type SettingsSectionId = 'editor' | 'keyboard' | 'ui' | 'about'

export function matchesSearch(query: string, terms: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return terms.some((term) => term && term.toLowerCase().includes(q))
}

export const sectionSearchKeywords: Record<SettingsSectionId, string[]> = {
  editor: [
    'editor', 'markdown', 'appearance', 'behavior', 'font', 'size', 'family',
    'line height', 'wrap', 'auto-save', 'preview', 'view', 'tables', 'task lists',
    'footnotes', 'math', 'katex', 'mermaid', 'diagrams', 'html', 'commonmark', 'gfm',
    'line numbers', 'session', 'dialect', 'maximum text width', 'word wrap',
    'highlight active line', 'custom font', 'synchronized scroll', 'confirm', 'restore'
  ],
  keyboard: [
    'keyboard', 'shortcut', 'shortcuts', 'ctrl', 'key', 'create note', 'switch note',
    'toggle preview', 'toggle sidebar', 'import', 'export', 'reset'
  ],
  ui: [
    'ui', 'theme', 'light', 'dark', 'system', 'border radius', 'density', 'compact',
    'comfortable', 'animation', 'sidebar', 'notes bar', 'top bar', 'icon set', 'visibility'
  ],
  about: [
    'about', 'application', 'version', 'changelog', 'license', 'data folder',
    'open data', 'bug', 'report', 'reset settings'
  ]
}
