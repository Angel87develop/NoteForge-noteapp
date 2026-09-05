/* eslint-disable prettier/prettier */
/**
 * Resaltado de sintaxis para bloques de código en NoteForge.
 *
 * API pública:
 *   - highlightCode(code, language)            -> string HTML con <span> por token
 *   - renderCodeBlock(code, language)          -> string HTML del bloque completo
 *   - getLanguageDefinition(language)          -> LanguageDefinition usada
 *   - isLanguageSupported(language)            -> boolean
 *
 * El motor no depende de librerías externas: cada lenguaje declara sus reglas
 * como RegExp sticky. Se soportan: python, javascript, typescript, bash, json,
 * css, html, sql (con alias). Cualquier otro lenguaje usa una definición
 * genérica que resalta strings, números, comentarios y llamadas a función.
 */
import { languages } from './languages'
import { genericLanguage } from './languages/generic'
import {
  tokenize,
  normalizeLanguageName,
  DEFAULT_LANGUAGE_NAME
} from './highlighter'
import type { LanguageDefinition, TokenType } from './types'

/** Mapa nombre -> definición, incluyendo alias. */
const languageMap: Record<string, LanguageDefinition> = {}
for (const lang of languages) {
  languageMap[lang.name] = lang
  if (lang.aliases) {
    for (const alias of lang.aliases) {
      languageMap[alias] = lang
    }
  }
}

/** Devuelve la definición de lenguaje a usar para `language`. */
export const getLanguageDefinition = (language: string): LanguageDefinition => {
  const name = normalizeLanguageName(language)
  return languageMap[name] || genericLanguage
}

/** Indica si un lenguaje está soportado explícitamente (no es el genérico). */
export const isLanguageSupported = (language: string): boolean => {
  const name = normalizeLanguageName(language)
  return Boolean(languageMap[name])
}

/** Nombre de lenguaje "canónico" para mostrar en el header del bloque. */
export const getDisplayLanguageName = (language: string): string => {
  const name = normalizeLanguageName(language)
  if (languageMap[name]) {
    return languageMap[name].name
  }
  return name || DEFAULT_LANGUAGE_NAME
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

/** Genera el HTML de un único token. */
const renderToken = (type: TokenType, value: string): string => {
  if (type === 'plain') {
    return escapeHtml(value)
  }
  return `<span class="tok-${type}">${escapeHtml(value)}</span>`
}

/**
 * Convierte código fuente a HTML con spans de resaltado por token.
 * El texto plano se escapa y se envuelve línea a línea conservando espacios.
 */
export const highlightCode = (code: string, language: string): string => {
  if (!code) return ''
  const definition = getLanguageDefinition(language)
  const tokens = tokenize(code, definition)
  return tokens
    .map((token) => renderToken(token.type, token.value))
    .join('')
}

/**
 * Renderiza un bloque de código completo: header con el lenguaje + contenido
 * resaltado. Pensado para usarse dentro de una vista previa renderizada.
 */
export const renderCodeBlock = (code: string, language: string): string => {
  const display = getDisplayLanguageName(language)
  const highlighted = highlightCode(code, language)
  return (
    `<div class="code-block" data-lang="${escapeHtml(display)}">` +
    `<div class="code-block-header"><span class="code-block-lang">${escapeHtml(display)}</span></div>` +
    `<pre class="code-block-pre"><code>${highlighted}</code></pre>` +
    `</div>`
  )
}

export * from './types'
export { tokenize } from './highlighter'
