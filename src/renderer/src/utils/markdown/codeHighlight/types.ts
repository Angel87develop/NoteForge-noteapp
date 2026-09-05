/**
 * Tipos para el motor de resaltado de sintaxis de bloques de código.
 *
 * Cada lenguaje define una lista ordenada de reglas. El motor intenta
 * aplicar las reglas en orden desde la posición actual del cursor; la
 * primera regla que coincida gana y se avanza esa cantidad de caracteres.
 */

export type TokenType =
  | 'keyword'
  | 'builtin'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'operator'
  | 'punctuation'
  | 'class-name'
  | 'variable'
  | 'property'
  | 'regex'
  | 'decorator'
  | 'boolean'
  | 'constant'
  | 'tag'
  | 'attr-name'
  | 'attr-value'
  | 'plain'

export interface HighlightRule {
  type: TokenType
  /** RegExp con flag sticky (`y`) para anclar la búsqueda en la posición actual. */
  regex: RegExp
}

export interface Token {
  type: TokenType
  value: string
}

export interface LanguageDefinition {
  name: string
  /** Alias alternativos del lenguaje (ej: `js`, `py`). */
  aliases?: string[]
  /** Reglas ordenadas por prioridad (las primeras se evalúan antes). */
  rules: HighlightRule[]
}
