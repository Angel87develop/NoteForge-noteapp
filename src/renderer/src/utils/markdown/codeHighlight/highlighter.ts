/* eslint-disable prettier/prettier */
import type { LanguageDefinition, Token } from './types'

/**
 * Motor de tokenización.
 *
 * Recorre el código carácter a carácter intentando aplicar las reglas del
 * lenguaje en orden. Cada regex es sticky (`y`), por lo que se ancla al
 * índice actual: si coincide, se captura ese trozo como token y se avanza;
 * si ninguna regla coincide, se consume un carácter como `plain`.
 */
export const tokenize = (code: string, language: LanguageDefinition): Token[] => {
  const tokens: Token[] = []
  const { rules } = language
  let pos = 0
  const len = code.length

  while (pos < len) {
    let matched = false

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      rule.regex.lastIndex = pos
      const m = rule.regex.exec(code)
      if (m && m[0].length > 0) {
        // Para reglas con grupos de captura (ej. TypeScript `: Type`),
        // usamos el grupo 1 si existe para colorear solo la parte relevante.
        const value = m[1] ? m[1] : m[0]
        if (m[1]) {
          // Si hay prefijo antes del grupo capturado, emitirlo como plain.
          const prefix = code.slice(pos, m.index + (m[0].length - m[1].length))
          if (prefix.length > 0) {
            tokens.push({ type: 'plain', value: prefix })
          }
        }
        tokens.push({ type: rule.type, value })
        pos += m[0].length
        matched = true
        break
      }
    }

    if (!matched) {
      // Consumir un carácter como plain y seguir.
      const last = tokens[tokens.length - 1]
      const ch = code[pos]
      if (last && last.type === 'plain') {
        last.value += ch
      } else {
        tokens.push({ type: 'plain', value: ch })
      }
      pos += 1
    }
  }

  return tokens
}

/** Lenguaje por defecto cuando no se reconoce el solicitado. */
export const DEFAULT_LANGUAGE_NAME = 'generic'

/** Normaliza el nombre del lenguaje (minúsculas, sin espacios). */
export const normalizeLanguageName = (lang: string): string =>
  (lang || '').trim().toLowerCase()
