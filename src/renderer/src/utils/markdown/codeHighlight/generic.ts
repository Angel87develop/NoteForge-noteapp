/* eslint-disable prettier/prettier */
/**
 * Helpers y reglas reutilizables para construir definiciones de lenguaje.
 *
 * Todas las regex se construyen con flag sticky (`y`) para que el motor las
 * aplique ancladas a la posición actual del cursor de forma determinista.
 */
import type { HighlightRule, TokenType } from './types'

/** Construye una RegExp sticky a partir de un patrón y flags base. */
export const rule = (
  type: TokenType,
  pattern: string,
  flags = ''
): HighlightRule => ({
  type,
  regex: new RegExp(pattern, `y${flags}`)
})

/** Lista de palabras clave como alternación `\\b(kw1|kw2)\\b`. */
export const keywordList = (words: string[]): string => `\\b(?:${words.join('|')})\\b`

/** Lista de palabras clave sin límite de palabra (para builtin con `-` etc.). */
export const altList = (words: string[]): string => `(?:${words.join('|')})`

/**
 * Reglas comunes que casi todos los lenguajes comparten.
 * Se devuelven como función para que cada lenguaje pueda intercalarlas
 * en el orden que prefiera.
 */
export const commonRules = {
  // Comentarios de línea: // ... y # ...
  lineCommentSlash: rule('comment', '//[^\\n]*'),
  lineCommentHash: rule('comment', '#[^\\n]*'),
  lineCommentDash: rule('comment', '--[^\\n]*'),

  // Comentarios de bloque: /* ... */ (multilínea)
  blockComment: rule('comment', '/\\*[\\s\\S]*?\\*/'),

  // Strings: "..." '...' `...`
  doubleString: rule('string', '"(?:[^"\\\\]|\\\\.)*"'),
  singleString: rule('string', "'(?:[^'\\\\]|\\\\.)*'"),
  templateString: rule('string', '`(?:[^`\\\\]|\\\\.)*`'),

  // Números (enteros, decimales, hex, binario, octal, notación científica)
  number: rule('number', '\\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\\d+\\.\\d*|\\.\\d+|\\d+)(?:[eE][+-]?\\d+)?)\\b'),

  // Booleanos y null/undefined comunes
  booleanNull: rule('boolean', '\\b(?:true|false|null|undefined|none|None|True|False)\\b'),

  // Operadores comunes
  operator: rule('operator', '&&|\\|\\||=>|==|!=|<=|>=|<<|>>|[-+*/%=<>!&|^~?]'),

  // Puntuación común
  punctuation: rule('punctuation', '[(){}\\[\\].,;:]'),

  // Identificadores genéricos (funciona como fallback dentro de un lenguaje)
  identifier: rule('plain', '[A-Za-z_$][\\w$]*'),

  // Espacios en blanco
  whitespace: rule('plain', '\\s+')
}

/**
 * Crea una regla de "función" para lenguajes tipo C/JS: `identificador(`.
 */
export const functionCallRule = (): HighlightRule =>
  rule('function', '\\b[A-Za-z_$][\\w$]*(?=\\s*\\()')
