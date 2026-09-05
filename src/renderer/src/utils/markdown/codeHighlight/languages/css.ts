/* eslint-disable prettier/prettier */
import type { LanguageDefinition } from '../types'
import { commonRules, rule } from '../generic'

const cssAtRules = [
  'media', 'import', 'charset', 'font-face', 'keyframes', 'supports',
  'page', 'namespace', 'font-feature-values', 'layer', 'container'
]

export const css: LanguageDefinition = {
  name: 'css',
  aliases: ['scss', 'less'],
  rules: [
    commonRules.blockComment,
    commonRules.lineCommentSlash,
    commonRules.doubleString,
    commonRules.singleString,
    // At-rules: @media, @import...
    rule('decorator', `@(?:${cssAtRules.join('|')})\\b`),
    // Selectores de id y clase: #id, .clase
    rule('function', '[.#][A-Za-z_-][\\w-]*'),
    // Propiedad: nombre:
    rule('property', '[A-Za-z-]+(?=\\s*:)'),
    // Valor numérico con unidad
    commonRules.number,
    // Funciones CSS: rgb(...), url(...)
    rule('function', '[A-Za-z-]+(?=\\s*\\()'),
    rule('keyword', '!important'),
    commonRules.operator,
    commonRules.punctuation,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
