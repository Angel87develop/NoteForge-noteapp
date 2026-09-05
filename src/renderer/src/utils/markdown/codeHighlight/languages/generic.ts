import type { LanguageDefinition } from '../types'
import { commonRules, functionCallRule, rule } from '../generic'

/**
 * Definición genérica de fallback para lenguajes no reconocidos.
 * Aplica reglas universales: strings, números, comentarios y funciones.
 */
export const genericLanguage: LanguageDefinition = {
  name: 'generic',
  rules: [
    commonRules.lineCommentSlash,
    commonRules.lineCommentHash,
    commonRules.blockComment,
    commonRules.doubleString,
    commonRules.singleString,
    commonRules.templateString,
    functionCallRule(),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    commonRules.identifier,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
