import type { LanguageDefinition } from '../types'
import { commonRules, rule } from '../generic'

export const json: LanguageDefinition = {
  name: 'json',
  aliases: ['jsonc'],
  rules: [
    commonRules.lineCommentSlash,
    commonRules.blockComment,
    commonRules.doubleString,
    // Claves: "clave" :
    rule('property', '"(?:[^"\\\\]|\\\\.)*"(?=\\s*:)'),
    rule('keyword', '\\b(?:true|false|null)\\b'),
    commonRules.number,
    commonRules.operator,
    commonRules.punctuation,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
