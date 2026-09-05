import type { LanguageDefinition } from '../types'
import { commonRules, rule } from '../generic'

export const html: LanguageDefinition = {
  name: 'html',
  aliases: ['xml', 'xhtml', 'svg', 'vue'],
  rules: [
    commonRules.blockComment,
    // Tags de apertura/cierre: <div ...> o </div>
    rule('tag', '</?[A-Za-z][\\w-]*'),
    rule('tag', '/?>'),
    // Atributos: nombre=
    rule('attr-name', '\\s[A-Za-z_:][\\w:.-]*(?=\\s*=)'),
    // Valores de atributo: "..." o '...'
    rule('attr-value', '"(?:[^"\\\\]|\\\\.)*"'),
    rule('attr-value', "'(?:[^'\\\\]|\\\\.)*'"),
    commonRules.number,
    commonRules.whitespace,
    rule('plain', '[^\\w\\s]')
  ]
}
